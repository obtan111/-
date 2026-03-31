import { getSupabaseClient } from '@/storage/database/supabase-client';

// 行为类型映射
type BehaviorType = 'view' | 'click' | 'add_to_cart' | 'purchase' | 'review';

// 记录用户行为
export async function recordUserBehavior(
  userId: number,
  dishId: number,
  behaviorType: BehaviorType,
  score?: number
) {
  try {
    const client = getSupabaseClient();

    // 行为权重
    const behaviorScores: Record<BehaviorType, number> = {
      view: 1.0,
      click: 1.5,
      add_to_cart: 2.0,
      purchase: 3.0,
      review: 4.0,
    };

    const finalScore = score || behaviorScores[behaviorType];

    const { error } = await client
      .from('user_behaviors')
      .insert({
        user_id: userId,
        dish_id: dishId,
        behavior_type: behaviorType,
        score: finalScore.toFixed(2),
      });

    if (error) {
      console.error('记录用户行为错误:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('记录用户行为错误:', error);
    return false;
  }
}

// 协同过滤推荐（基于用户购买历史）
export async function collaborativeFilteringRecommend(userId: number, limit: number = 10) {
  try {
    const client = getSupabaseClient();

    // 获取用户行为记录
    const { data: userBehaviors } = await client
      .from('user_behaviors')
      .select('dish_id, behavior_type')
      .eq('user_id', userId);

    if (!userBehaviors || userBehaviors.length === 0) {
      // 如果用户没有行为记录，返回热门菜品
      return await getPopularDishes(limit);
    }

    const interactedDishIds = [...new Set(userBehaviors.map(b => b.dish_id))];

    // 找到有相似行为的其他用户
    const { data: similarUsersData } = await client
      .from('user_behaviors')
      .select('user_id, dish_id')
      .in('dish_id', interactedDishIds)
      .neq('user_id', userId);

    if (!similarUsersData || similarUsersData.length === 0) {
      return await getPopularDishes(limit);
    }

    // 计算用户相似度（简化版：共同交互越多越相似）
    const userSimilarity: Record<number, number> = {};
    similarUsersData.forEach(su => {
      userSimilarity[su.user_id] = (userSimilarity[su.user_id] || 0) + 1;
    });

    // 获取相似用户的其他行为
    const similarUserIds = Object.keys(userSimilarity).map(Number);
    const { data: recommendedData } = await client
      .from('user_behaviors')
      .select('dish_id, score')
      .in('user_id', similarUserIds)
      .not('dish_id', 'in', `(${interactedDishIds.join(',')})`);

    if (!recommendedData || recommendedData.length === 0) {
      return await getPopularDishes(limit);
    }

    // 获取推荐的菜品ID
    const recommendedDishIds = [...new Set(recommendedData.map(d => d.dish_id))];
    
    // 获取菜品详情
    const { data: dishes } = await client
      .from('dishes')
      .select('*')
      .in('id', recommendedDishIds)
      .eq('is_active', true);

    if (!dishes) {
      return await getPopularDishes(limit);
    }

    // 计算推荐分数
    const dishScores: Record<number, { score: number; dish: any }> = {};
    const dishMap = new Map(dishes.map(d => [d.id, d]));

    recommendedData.forEach(item => {
      const dish = dishMap.get(item.dish_id);
      if (dish && !dishScores[item.dish_id]) {
        dishScores[item.dish_id] = {
          score: parseFloat(item.score) || 1,
          dish: dish,
        };
      } else if (dishScores[item.dish_id]) {
        dishScores[item.dish_id].score += parseFloat(item.score) || 1;
      }
    });

    // 获取分类信息
    const categoryIds = [...new Set(dishes.map(d => d.category_id).filter(Boolean))];
    let categories: any[] = [];
    if (categoryIds.length > 0) {
      const { data: cats } = await client
        .from('categories')
        .select('*')
        .in('id', categoryIds);
      categories = cats || [];
    }
    const categoryMap = new Map(categories.map(c => [c.id, c]));

    // 排序并返回
    const results = Object.values(dishScores)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => ({
        ...item.dish,
        categories: categoryMap.get(item.dish.category_id) || null,
        recommendation_score: item.score,
      }));

    return results;
  } catch (error) {
    console.error('协同过滤推荐错误:', error);
    return await getPopularDishes(limit);
  }
}

// 获取热门菜品
export async function getPopularDishes(limit: number = 10) {
  try {
    const client = getSupabaseClient();

    const { data: dishes, error } = await client
      .from('dishes')
      .select('*')
      .eq('is_active', true)
      .order('sales', { ascending: false })
      .limit(limit);

    if (error || !dishes) {
      return [];
    }

    // 获取分类信息
    const categoryIds = [...new Set(dishes.map(d => d.category_id).filter(Boolean))];
    let categories: any[] = [];
    if (categoryIds.length > 0) {
      const { data: cats } = await client
        .from('categories')
        .select('*')
        .in('id', categoryIds);
      categories = cats || [];
    }
    const categoryMap = new Map(categories.map(c => [c.id, c]));

    return dishes.map(dish => ({
      ...dish,
      categories: categoryMap.get(dish.category_id) || null,
      recommendation_score: dish.sales / 100, // 基于销量计算推荐分
    }));
  } catch (error) {
    console.error('获取热门菜品错误:', error);
    return [];
  }
}

// 混合推荐（综合向量相似度、分类、销量、价格）
export async function hybridRecommend(userId: number, limit: number = 10) {
  try {
    const client = getSupabaseClient();
    
    // 1. 获取用户行为和订单历史
    const { data: userBehaviors } = await client
      .from('user_behaviors')
      .select('dish_id, behavior_type, score')
      .eq('user_id', userId);
    
    const { data: userOrders } = await client
      .from('orders')
      .select('id')
      .eq('user_id', userId)
      .in('status', ['completed', 'ready', 'preparing']);
    
    let userDishIds: number[] = [];
    let categoryPreferences: Record<number, number> = {};
    let pricePreferences: number[] = [];
    
    // 分析用户行为
    if (userBehaviors && userBehaviors.length > 0) {
      userDishIds = [...new Set(userBehaviors.map(b => b.dish_id))];
      
      // 分析分类偏好
      const { data: behaviorDishes } = await client
        .from('dishes')
        .select('id, category_id, price')
        .in('id', userDishIds);
      
      if (behaviorDishes) {
        behaviorDishes.forEach(dish => {
          if (dish.category_id) {
            categoryPreferences[dish.category_id] = (categoryPreferences[dish.category_id] || 0) + 1;
          }
          pricePreferences.push(parseFloat(dish.price));
        });
      }
    }
    
    // 分析订单历史
    if (userOrders && userOrders.length > 0) {
      const orderIds = userOrders.map(o => o.id);
      const { data: orderItems } = await client
        .from('order_items')
        .select('dish_id')
        .in('order_id', orderIds);
      
      if (orderItems) {
        const orderDishIds = [...new Set(orderItems.map(item => item.dish_id))];
        userDishIds = [...new Set([...userDishIds, ...orderDishIds])];
        
        // 分析订单中的分类和价格
        const { data: orderDishes } = await client
          .from('dishes')
          .select('id, category_id, price')
          .in('id', orderDishIds);
        
        if (orderDishes) {
          orderDishes.forEach(dish => {
            if (dish.category_id) {
              categoryPreferences[dish.category_id] = (categoryPreferences[dish.category_id] || 0) + 2; // 订单权重更高
            }
            pricePreferences.push(parseFloat(dish.price));
          });
        }
      }
    }
    
    // 2. 计算用户偏好向量（如果有足够的行为数据）
    let userEmbedding: number[] | null = null;
    if (userDishIds.length > 0) {
      try {
        const { getZhipuEmbedding } = await import('./embedding');
        
        // 获取用户交互过的菜品
        const { data: userDishes } = await client
          .from('dishes')
          .select('name, description, category_id')
          .in('id', userDishIds);
        
        if (userDishes && userDishes.length > 0) {
          // 构建用户偏好文本
          const userText = userDishes
            .map(dish => `${dish.name} ${dish.description || ''}`)
            .join(' ');
          
          // 生成用户偏好向量
          userEmbedding = await getZhipuEmbedding(userText);
        }
      } catch (error) {
        console.log('生成用户偏好向量失败:', error);
      }
    }
    
    // 3. 获取候选菜品（排除用户已交互的）
    let query = client
      .from('dishes')
      .select('*')
      .eq('is_active', true);
    
    if (userDishIds.length > 0) {
      query = query.not('id', 'in', `(${userDishIds.join(',')})`);
    }
    
    const { data: candidateDishes } = await query.limit(50); // 获取足够多的候选菜品
    
    if (!candidateDishes || candidateDishes.length === 0) {
      return await getPopularDishes(limit);
    }
    
    // 4. 计算推荐分数（综合多个维度）
    const scoredDishes = await Promise.all(candidateDishes.map(async (dish) => {
      let score = 0;
      
      // 向量相似度分数（如果有用户向量）
      if (userEmbedding) {
        try {
          const { cosineSimilarity } = await import('./embedding');
          
          // 获取菜品向量
          const { data: dishEmbedding } = await client
            .from('dish_embeddings')
            .select('embedding')
            .eq('dish_id', dish.id)
            .single();
          
          if (dishEmbedding && dishEmbedding.embedding) {
            const similarity = cosineSimilarity(userEmbedding, dishEmbedding.embedding as number[]);
            score += similarity * 40; // 向量相似度权重40%
          }
        } catch (error) {
          // 向量相似度计算失败，不影响其他分数
        }
      }
      
      // 分类偏好分数
      if (dish.category_id && categoryPreferences[dish.category_id]) {
        score += categoryPreferences[dish.category_id] * 20; // 分类偏好权重20%
      }
      
      // 销量分数
      score += (dish.sales || 0) / 10; // 销量权重15%
      
      // 价格相似度分数
      if (pricePreferences.length > 0) {
        const avgPrice = pricePreferences.reduce((sum, p) => sum + p, 0) / pricePreferences.length;
        const priceDiff = Math.abs(parseFloat(dish.price) - avgPrice);
        if (priceDiff < 10) score += 10;
        else if (priceDiff < 20) score += 7;
        else if (priceDiff < 30) score += 4;
      } else {
        // 没有价格偏好，根据价格区间加分
        const price = parseFloat(dish.price);
        if (price < 20) score += 5;
        else if (price < 50) score += 8;
        else score += 5;
      }
      
      // 评分分数
      if (dish.rating) {
        score += parseFloat(dish.rating) * 5;
      }
      
      return { ...dish, recommendation_score: score };
    }));
    
    // 5. 排序并返回
    scoredDishes.sort((a, b) => b.recommendation_score - a.recommendation_score);
    const topDishes = scoredDishes.slice(0, limit);
    
    // 6. 获取分类信息
    const categoryIds = [...new Set(topDishes.map(d => d.category_id).filter(Boolean))];
    let categories: any[] = [];
    if (categoryIds.length > 0) {
      const { data: cats } = await client
        .from('categories')
        .select('*')
        .in('id', categoryIds);
      categories = cats || [];
    }
    const categoryMap = new Map(categories.map(c => [c.id, c]));
    
    return topDishes.map(dish => ({
      ...dish,
      categories: categoryMap.get(dish.category_id) || null,
    }));
  } catch (error) {
    console.error('混合推荐错误:', error);
    return await getPopularDishes(limit);
  }
}
