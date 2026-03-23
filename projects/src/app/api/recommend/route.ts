import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth/auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { semanticSearchDishes, getSimilarDishes, getPopularDishesSimple, batchGenerateDishEmbeddings, getCartBasedRecommendations } from '@/lib/recommend/embedding';
import { hybridRecommend, recordUserBehavior } from '@/lib/recommend/collaborative';

// 基于用户订单历史的智能推荐（结合向量相似度）
async function getOrderBasedRecommendations(userId: number, limit: number = 6, excludeIds: number[] = []) {
  try {
    const client = getSupabaseClient();
    
    // 1. 获取用户的订单历史
    const { data: userOrders } = await client
      .from('orders')
      .select('id')
      .eq('user_id', userId)
      .in('status', ['completed', 'ready', 'preparing'])
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (!userOrders || userOrders.length === 0) {
      return null;
    }
    
    const orderIds = userOrders.map(o => o.id);
    
    // 2. 获取用户购买过的菜品
    const { data: orderItems } = await client
      .from('order_items')
      .select('dish_id, dish_name, quantity')
      .in('order_id', orderIds);
    
    if (!orderItems || orderItems.length === 0) {
      return null;
    }
    
    // 3. 分析用户购买数据
    const purchasedDishIds = [...new Set(orderItems.map(item => item.dish_id))];
    
    const { data: purchasedDishes } = await client
      .from('dishes')
      .select('id, category_id, name, price, description')
      .in('id', purchasedDishIds);
    
    if (!purchasedDishes || purchasedDishes.length === 0) {
      return null;
    }
    
    // 统计分类偏好
    const categoryPreference: Record<number, number> = {};
    purchasedDishes.forEach(dish => {
      if (dish.category_id) {
        // 根据购买次数加权
        const purchaseCount = orderItems.filter(item => item.dish_id === dish.id)
          .reduce((sum, item) => sum + (item.quantity || 1), 0);
        categoryPreference[dish.category_id] = (categoryPreference[dish.category_id] || 0) + purchaseCount;
      }
    });
    
    const preferredCategories = Object.entries(categoryPreference)
      .sort((a, b) => b[1] - a[1])
      .map(([catId]) => parseInt(catId));
    
    // 4. 构建用户口味画像（用于向量搜索）
    // 根据购买频率构建加权描述
    const userTasteProfile = purchasedDishes
      .map(dish => {
        const purchaseCount = orderItems.filter(item => item.dish_id === dish.id)
          .reduce((sum, item) => sum + (item.quantity || 1), 0);
        return `${dish.name} ${dish.description || ''}`.repeat(Math.min(purchaseCount, 3));
      })
      .join(' ');
    
    console.log('用户口味画像:', userTasteProfile.substring(0, 100) + '...');
    
    // 5. 尝试使用向量相似度搜索
    let vectorRecommendations: any[] = [];
    
    try {
      // 动态导入embedding函数避免循环依赖
      const { getZhipuEmbedding, cosineSimilarity } = await import('@/lib/recommend/embedding');
      
      // 生成用户口味向量
      const userEmbedding = await getZhipuEmbedding(userTasteProfile);
      
      if (userEmbedding) {
        console.log('使用向量相似度搜索推荐');
        
        // 获取所有菜品的向量嵌入
        const { data: dishEmbeddings } = await client
          .from('dish_embeddings')
          .select('dish_id, embedding');
        
        if (dishEmbeddings && dishEmbeddings.length > 0) {
          // 计算与用户口味的相似度
          const similarities = dishEmbeddings
            .filter(item => !purchasedDishIds.includes(item.dish_id)) // 排除已购买的
            .map(item => ({
              dish_id: item.dish_id,
              similarity: cosineSimilarity(userEmbedding, item.embedding as number[]),
            }))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit * 2); // 获取更多用于后续筛选
          
          if (similarities.length > 0) {
            // 获取相似菜品的详情
            const similarDishIds = similarities.map(s => s.dish_id);
            const { data: similarDishes } = await client
              .from('dishes')
              .select('*')
              .in('id', similarDishIds)
              .eq('is_active', true);
            
            if (similarDishes) {
              const similarityMap = new Map(similarities.map(s => [s.dish_id, s.similarity]));
              vectorRecommendations = similarDishes.map(dish => ({
                ...dish,
                vector_similarity: similarityMap.get(dish.id) || 0,
              }));
            }
          }
        }
      }
    } catch (error) {
      console.log('向量搜索失败，使用备选方案:', error);
    }
    
    // 6. 基于偏好的分类获取候选菜品（备选方案）
    let categoryRecommendations: any[] = [];
    
    // 合并所有需要排除的ID（已购买 + 已推荐 + 向量推荐结果）
    const allExcludeIds = [...new Set([...purchasedDishIds, ...excludeIds, ...vectorRecommendations.map(r => r.id)])];
    
    if (vectorRecommendations.length < limit) {
      for (const categoryId of preferredCategories) {
        let query = client
          .from('dishes')
          .select('*')
          .eq('category_id', categoryId)
          .eq('is_active', true)
          .order('sales', { ascending: false });
        
        // 排除已购买、已推荐和向量推荐结果中的菜品
        if (allExcludeIds.length > 0) {
          query = query.not('id', 'in', `(${allExcludeIds.join(',')})`);
        }
        
        const { data: categoryDishes } = await query.limit(Math.ceil(limit / preferredCategories.length) + 2);
        
        if (categoryDishes) {
          categoryRecommendations.push(...categoryDishes);
        }
      }
    }
    
    // 7. 合并两种推荐结果
    let allRecommendations = [...vectorRecommendations, ...categoryRecommendations];
    
    // 8. 如果推荐不足，补充热销菜品（排除所有已推荐的）
    if (allRecommendations.length < limit) {
      const existingIds = [...new Set([...purchasedDishIds, ...excludeIds, ...allRecommendations.map(r => r.id)])];
      let query = client
        .from('dishes')
        .select('*')
        .eq('is_active', true)
        .order('sales', { ascending: false });
      
      if (existingIds.length > 0) {
        query = query.not('id', 'in', `(${existingIds.join(',')})`);
      }
      
      const { data: popularDishes } = await query.limit(limit - allRecommendations.length);
      
      if (popularDishes) {
        allRecommendations.push(...popularDishes);
      }
    }
    
    // 9. 去重
    allRecommendations = allRecommendations
      .filter((dish, index, self) => 
        index === self.findIndex(d => d.id === dish.id)
      );
    
    // 10. 智能评分（结合向量相似度、分类偏好、销量、价格）
    const avgPurchasedPrice = purchasedDishes.reduce((sum, d) => 
      sum + parseFloat(d.price), 0) / purchasedDishes.length;
    
    const scoredRecommendations = allRecommendations.map(dish => {
      let score = 0;
      
      // 向量相似度分数（权重最高）
      if (dish.vector_similarity) {
        score += dish.vector_similarity * 50; // 最高50分
      }
      
      // 分类匹配加分
      const catRank = preferredCategories.indexOf(dish.category_id);
      if (catRank !== -1) {
        score += (preferredCategories.length - catRank) * 15;
      }
      
      // 销量加分
      score += (dish.sales || 0) / 10;
      
      // 价格相似度加分
      const priceDiff = Math.abs(parseFloat(dish.price) - avgPurchasedPrice);
      if (priceDiff < 10) score += 10;
      else if (priceDiff < 20) score += 7;
      else if (priceDiff < 30) score += 4;
      
      return { ...dish, recommendation_score: score };
    });
    
    // 11. 按分数排序并限制数量
    scoredRecommendations.sort((a, b) => b.recommendation_score - a.recommendation_score);
    const topRecommendations = scoredRecommendations.slice(0, limit);
    
    // 12. 获取分类信息
    const categoryIds = [...new Set(topRecommendations.map(d => d.category_id).filter(Boolean))];
    let categories: any[] = [];
    if (categoryIds.length > 0) {
      const { data: cats } = await client
        .from('categories')
        .select('*')
        .in('id', categoryIds);
      categories = cats || [];
    }
    const categoryMap = new Map(categories.map(c => [c.id, c]));
    
    // 13. 构建最终推荐结果
    const finalRecommendations = topRecommendations.map(dish => ({
      ...dish,
      categories: categoryMap.get(dish.category_id) || null,
      // 综合相似度（向量相似度 + 评分归一化）
      similarity: dish.vector_similarity 
        ? Math.min((dish.vector_similarity * 0.7 + (dish.recommendation_score / 100) * 0.3), 0.99)
        : Math.min(dish.recommendation_score / 100, 0.99),
    }));
    
    const vectorCount = finalRecommendations.filter(r => r.vector_similarity).length;
    console.log(`智能推荐完成: 向量推荐${vectorCount}道，分类推荐${finalRecommendations.length - vectorCount}道，偏好分类: [${preferredCategories.join(', ')}]`);
    
    return finalRecommendations;
  } catch (error) {
    console.error('基于订单历史推荐错误:', error);
    return null;
  }
}

// 智能推荐
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'hybrid'; // hybrid, semantic, similar, popular, cart, order_based
    const query = searchParams.get('query');
    const dishId = searchParams.get('dish_id');
    const dishIds = searchParams.get('dish_ids');
    const excludeIds = searchParams.get('exclude_ids'); // 需要排除的菜品ID（已推荐的）
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // 解析需要排除的菜品ID
    const excludeDishIds = excludeIds 
      ? excludeIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id))
      : [];

    let recommendations;

    switch (type) {
      case 'semantic':
        // 语义搜索 - 支持自然语言查询
        if (!query) {
          return NextResponse.json(
            { success: false, error: '请输入搜索内容' },
            { status: 400 }
          );
        }
        recommendations = await semanticSearchDishes(query, limit);
        break;

      case 'similar':
        // 相似菜品推荐
        if (!dishId) {
          return NextResponse.json(
            { success: false, error: '菜品ID为必填项' },
            { status: 400 }
          );
        }
        recommendations = await getSimilarDishes(parseInt(dishId), limit);
        break;

      case 'cart':
        // 基于购物车内容的推荐
        if (!dishIds) {
          return NextResponse.json(
            { success: false, error: '菜品ID列表为必填项' },
            { status: 400 }
          );
        }
        const dishIdArray = dishIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
        if (dishIdArray.length === 0) {
          return NextResponse.json(
            { success: false, error: '无效的菜品ID列表' },
            { status: 400 }
          );
        }
        recommendations = await getCartBasedRecommendations(dishIdArray, limit);
        break;

      case 'order_based':
        // 基于用户订单历史的推荐 - 需要登录
        const authResultOrder = await authenticateUser(request);
        if (authResultOrder instanceof NextResponse) {
          return authResultOrder;
        }
        recommendations = await getOrderBasedRecommendations(authResultOrder.id, limit, excludeDishIds);
        if (!recommendations) {
          // 没有订单历史，返回热门菜品（排除已推荐的）
          recommendations = await getPopularDishesSimple(limit, excludeDishIds);
        }
        break;

      case 'cart_based':
        // 基于购物车的实时推荐 - 需要登录
        const authResultCart = await authenticateUser(request);
        if (authResultCart instanceof NextResponse) {
          return authResultCart;
        }
        // 获取用户购物车
        const { data: cartData } = await getSupabaseClient()
          .from('carts')
          .select('items')
          .eq('user_id', authResultCart.id)
          .single();
        
        if (!cartData || !cartData.items || cartData.items.length === 0) {
          // 购物车为空，返回热门菜品（排除已推荐的）
          recommendations = await getPopularDishesSimple(limit, excludeDishIds);
        } else {
          // 提取购物车中的菜品ID
          const cartDishIds = cartData.items.map((item: any) => item.dish_id);
          // 使用基于购物车的推荐（排除已推荐的）
          recommendations = await getCartBasedRecommendations(cartDishIds, limit, excludeDishIds);
        }
        break;

      case 'popular':
        // 热门菜品（排除已推荐的）
        recommendations = await getPopularDishesSimple(limit, excludeDishIds);
        break;

      case 'init_embeddings':
        // 初始化向量嵌入（管理员功能）
        const results = await batchGenerateDishEmbeddings();
        return NextResponse.json({
          success: true,
          message: '向量嵌入初始化完成',
          data: results,
        });

      case 'hybrid':
      default:
        // 混合推荐 - 需要用户登录
        const authResult = await authenticateUser(request);
        if (authResult instanceof NextResponse) {
          // 未登录时返回热门菜品
          recommendations = await getPopularDishesSimple(limit);
        } else {
          recommendations = await hybridRecommend(authResult.id, limit);
        }
        break;
    }

    // 如果推荐结果不足，补充热门菜品
    if (!recommendations || recommendations.length < limit) {
      const currentIds = recommendations ? recommendations.map((r: any) => r.id) : [];
      const additionalDishes = await getPopularDishesSimple(
        limit - (recommendations?.length || 0),
        [...excludeDishIds, ...currentIds]
      );
      recommendations = [...(recommendations || []), ...additionalDishes];
    }

    return NextResponse.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error('推荐错误:', error);
    return NextResponse.json(
      { success: false, error: '推荐失败，请稍后重试' },
      { status: 500 }
    );
  }
}

// 记录用户行为
export async function POST(request: NextRequest) {
  const authResult = await authenticateUser(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const body = await request.json();
    const { dish_id, behavior_type, score } = body;

    if (!dish_id || !behavior_type) {
      return NextResponse.json(
        { success: false, error: '菜品ID和行为类型为必填项' },
        { status: 400 }
      );
    }

    const success = await recordUserBehavior(authResult.id, dish_id, behavior_type, score);

    if (!success) {
      return NextResponse.json(
        { success: false, error: '记录行为失败' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '行为记录成功',
    });
  } catch (error) {
    console.error('记录用户行为错误:', error);
    return NextResponse.json(
      { success: false, error: '记录行为失败，请稍后重试' },
      { status: 500 }
    );
  }
}