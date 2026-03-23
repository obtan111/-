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

// 混合推荐（结合内容推荐和协同过滤）
export async function hybridRecommend(userId: number, limit: number = 10) {
  try {
    // 获取协同过滤推荐
    const cfRecommendations = await collaborativeFilteringRecommend(userId, limit);
    
    // 如果协同过滤结果不足，补充热门菜品
    if (cfRecommendations.length < limit) {
      const popularDishes = await getPopularDishes(limit - cfRecommendations.length);
      const existingIds = new Set(cfRecommendations.map(d => d.id));
      
      popularDishes.forEach(dish => {
        if (!existingIds.has(dish.id)) {
          cfRecommendations.push(dish);
        }
      });
    }

    return cfRecommendations.slice(0, limit);
  } catch (error) {
    console.error('混合推荐错误:', error);
    return await getPopularDishes(limit);
  }
}
