import { getSupabaseClient } from '@/storage/database/supabase-client';

// 智谱AI Embedding 配置
// 注意：智谱AI的embedding模型（包括embedding-3）都需要付费
// 建议使用embedding-2模型，精度高且成本合理
const ZHIPU_EMBEDDING_API = 'https://open.bigmodel.cn/api/paas/v4/embeddings';
const ZHIPU_API_KEY = process.env.COZE_ZHIPUAI_API_KEY || 'cdee1f738bf5464db0f58910a968c4ec.5oy8UnpZ9PjCDCYo';
// 使用 embedding-2 模型（精度更高，成本合理）
const ZHIPU_MODEL = 'embedding-2';

// 标记API状态
let embeddingApiAvailable = true;
let lastApiCheckTime = 0;
const API_CHECK_INTERVAL = 60000; // 1分钟检查一次

// 智谱AI Embedding 响应类型
interface ZhipuEmbeddingResponse {
  data: Array<{
    embedding: number[];
    index: number;
    object: string;
  }>;
  model: string;
  object: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

// 调用智谱AI Embedding API
export async function getZhipuEmbedding(text: string): Promise<number[] | null> {
  // 如果API之前被标记为不可用，检查是否需要重试
  if (!embeddingApiAvailable) {
    const now = Date.now();
    if (now - lastApiCheckTime < API_CHECK_INTERVAL) {
      return null;
    }
    // 尝试重新检查API
    lastApiCheckTime = now;
  }

  try {
    const response = await fetch(ZHIPU_EMBEDDING_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ZHIPU_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: ZHIPU_MODEL,
        input: text,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('智谱AI Embedding API错误:', response.status, errorData);
      
      // 如果是余额不足或权限问题
      if (response.status === 429 || response.status === 402 || response.status === 401) {
        const errorMsg = errorData?.error?.message || errorData?.error?.code || '';
        console.log(`智谱AI API不可用: ${errorMsg}`);
        console.log('提示: 请前往 https://open.bigmodel.cn/ 申请免费API密钥');
        embeddingApiAvailable = false;
        lastApiCheckTime = Date.now();
      }
      return null;
    }

    const result: ZhipuEmbeddingResponse = await response.json();
    
    if (result.data && result.data.length > 0) {
      embeddingApiAvailable = true; // 标记API可用
      return result.data[0].embedding;
    }

    return null;
  } catch (error) {
    console.error('调用智谱AI Embedding API失败:', error);
    return null;
  }
}

// 基于关键词的智能搜索（备选方案）
async function keywordBasedSearch(query: string, limit: number = 10) {
  const client = getSupabaseClient();
  
  // 解析用户意图，提取关键词
  const queryLower = query.toLowerCase();
  
  // 意图映射 - 根据用户描述匹配相关菜品特征
  const intentMap: Record<string, { keywords: string[], categories: number[], priceRange?: [number, number] }> = {
    '减脂': { keywords: ['凉拌', '清蒸', '水煮', '蔬菜', '水果', '沙拉'], categories: [2, 3, 8] },
    '减肥': { keywords: ['凉拌', '清蒸', '水煮', '蔬菜', '水果', '汤'], categories: [2, 3, 8] },
    '便宜': { keywords: [], categories: [], priceRange: [0, 20] },
    '实惠': { keywords: [], categories: [], priceRange: [0, 25] },
    '辣': { keywords: ['辣', '麻辣', '酸辣', '红油'], categories: [1] },
    '辣的': { keywords: ['辣', '麻辣', '酸辣', '红油'], categories: [1] },
    '清淡': { keywords: ['清蒸', '水煮', '汤', '粥', '凉拌'], categories: [2, 3] },
    '解渴': { keywords: ['汁', '水', '饮', '茶', '汤'], categories: [7, 3] },
    '甜': { keywords: ['甜', '糖', '蜜', '芒果', '红豆'], categories: [6] },
    '甜品': { keywords: [], categories: [6] },
    '饮料': { keywords: [], categories: [7] },
    '水果': { keywords: [], categories: [8] },
    '主食': { keywords: [], categories: [4] },
    '米饭': { keywords: ['饭', '炒饭'], categories: [4] },
    '面': { keywords: ['面', '粉'], categories: [4] },
    '汤': { keywords: [], categories: [3] },
    '小吃': { keywords: [], categories: [5] },
    '热菜': { keywords: [], categories: [1] },
    '凉菜': { keywords: [], categories: [2] },
    '早餐': { keywords: ['粥', '包', '饺', '面', '豆浆'], categories: [4, 5] },
    '午餐': { keywords: [], categories: [1, 4] },
    '晚餐': { keywords: [], categories: [1, 4] },
    '下饭': { keywords: ['辣', '麻', '香', '咸'], categories: [1] },
    '开胃': { keywords: ['酸', '辣', '凉拌'], categories: [1, 2] },
    '暖胃': { keywords: ['汤', '粥', '热'], categories: [1, 3] },
    '夏天': { keywords: ['凉', '冰', '冷饮', '绿豆'], categories: [2, 7] },
    '冬天': { keywords: ['热', '汤', '火锅', '炖'], categories: [1, 3] },
  };

  // 分析用户查询意图
  let matchedIntents: { keywords: string[], categories: number[], priceRange?: [number, number] } = {
    keywords: [],
    categories: [],
  };

  for (const [intent, config] of Object.entries(intentMap)) {
    if (queryLower.includes(intent)) {
      matchedIntents.keywords.push(...config.keywords);
      matchedIntents.categories.push(...config.categories);
      if (config.priceRange) {
        matchedIntents.priceRange = config.priceRange;
      }
    }
  }

  // 去重
  matchedIntents.keywords = [...new Set(matchedIntents.keywords)];
  matchedIntents.categories = [...new Set(matchedIntents.categories)];

  // 从查询中提取其他关键词
  const stopWords = ['我', '想', '吃', '喝', '要', '什么', '推荐', '给我', '有没有', '可以', '哪些', '呢', '吗', '的', '一下', '一点', '比较', '适合'];
  let additionalKeywords = queryLower.split(/\s+/).filter(word => 
    word.length > 1 && !stopWords.includes(word) && !Object.keys(intentMap).some(k => word.includes(k))
  );

  matchedIntents.keywords.push(...additionalKeywords);

  // 构建查询
  let queryBuilder = client
    .from('dishes')
    .select('*')
    .eq('is_active', true);

  // 如果有分类限制
  if (matchedIntents.categories.length > 0) {
    queryBuilder = queryBuilder.in('category_id', matchedIntents.categories);
  }

  // 如果有价格限制
  if (matchedIntents.priceRange) {
    queryBuilder = queryBuilder
      .gte('price', matchedIntents.priceRange[0])
      .lte('price', matchedIntents.priceRange[1]);
  }

  const { data: dishes, error } = await queryBuilder.limit(50);

  if (error || !dishes) {
    return await getPopularDishesSimple(limit);
  }

  // 计算匹配分数
  const scoredDishes = dishes.map(dish => {
    let score = 0;
    const dishText = `${dish.name} ${dish.description || ''}`.toLowerCase();
    
    // 关键词匹配
    for (const keyword of matchedIntents.keywords) {
      if (dishText.includes(keyword)) {
        score += 10;
      }
    }

    // 直接查询词匹配
    for (const word of queryLower.split(/\s+/)) {
      if (word.length > 1 && dishText.includes(word)) {
        score += 5;
      }
    }

    // 销量加成
    score += (dish.sales || 0) / 100;

    return { ...dish, similarity: score };
  });

  // 排序并返回
  scoredDishes.sort((a, b) => b.similarity - a.similarity);

  // 获取分类信息
  const topDishes = scoredDishes.slice(0, limit);
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
    similarity: dish.similarity / 100, // 归一化
  }));
}

// 生成菜品向量嵌入
export async function generateDishEmbedding(dishId: number) {
  try {
    const client = getSupabaseClient();
    
    const { data: dish, error } = await client
      .from('dishes')
      .select('*')
      .eq('id', dishId)
      .single();

    if (error || !dish) {
      throw new Error('菜品不存在');
    }

    let categoryName = '';
    if (dish.category_id) {
      const { data: category } = await client
        .from('categories')
        .select('name')
        .eq('id', dish.category_id)
        .single();
      categoryName = category?.name || '';
    }

    const text = `${dish.name} ${dish.description || ''} ${categoryName} 价格${dish.price}元 月销${dish.sales || 0}`;

    const embedding = await getZhipuEmbedding(text);

    if (!embedding) {
      console.log(`菜品 ${dish.name} 跳过向量嵌入（API不可用）`);
      return null;
    }

    await client
      .from('dish_embeddings')
      .upsert({
        dish_id: dishId,
        embedding: embedding,
        embedding_model: ZHIPU_MODEL,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'dish_id',
      });

    console.log(`菜品 ${dish.name} 的向量嵌入已生成`);
    return embedding;
  } catch (error) {
    console.error('生成菜品向量嵌入错误:', error);
    throw error;
  }
}

// 批量生成菜品向量嵌入
export async function batchGenerateDishEmbeddings() {
  try {
    const client = getSupabaseClient();
    
    const { data: dishes, error } = await client
      .from('dishes')
      .select('id, name')
      .eq('is_active', true);

    if (error || !dishes) {
      throw new Error('获取菜品列表失败');
    }

    console.log(`开始为 ${dishes.length} 道菜品生成向量嵌入...`);

    const results = [];
    for (let i = 0; i < dishes.length; i++) {
      const dish = dishes[i];
      try {
        const embedding = await generateDishEmbedding(dish.id);
        results.push({ 
          id: dish.id, 
          name: dish.name, 
          success: embedding !== null,
          skipped: embedding === null
        });
        
        if (embedding !== null && i < dishes.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (err) {
        results.push({ id: dish.id, name: dish.name, success: false, error: String(err) });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const skippedCount = results.filter(r => r.skipped).length;
    console.log(`向量嵌入生成完成: ${successCount} 成功, ${skippedCount} 跳过, ${results.length - successCount - skippedCount} 失败`);

    return results;
  } catch (error) {
    console.error('批量生成菜品向量嵌入错误:', error);
    throw error;
  }
}

// 计算余弦相似度
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// 智能语义搜索菜品
export async function semanticSearchDishes(query: string, limit: number = 10) {
  try {
    console.log('语义搜索查询:', query);
    
    const client = getSupabaseClient();
    
    // 尝试使用智谱AI生成查询向量
    const queryEmbedding = await getZhipuEmbedding(query);

    if (queryEmbedding) {
      console.log('使用智谱AI向量搜索');
      
      // 获取所有菜品向量
      const { data: dishEmbeddings } = await client
        .from('dish_embeddings')
        .select('dish_id, embedding');

      if (dishEmbeddings && dishEmbeddings.length > 0) {
        // 计算相似度
        const resultsWithSimilarity = dishEmbeddings.map(item => ({
          dish_id: item.dish_id,
          similarity: cosineSimilarity(queryEmbedding, item.embedding as number[]),
        }));

        resultsWithSimilarity.sort((a, b) => b.similarity - a.similarity);
        const topDishIds = resultsWithSimilarity.slice(0, limit).map(r => r.dish_id);

        // 获取菜品详情
        const { data: dishes } = await client
          .from('dishes')
          .select('*')
          .in('id', topDishIds)
          .eq('is_active', true);

        if (dishes && dishes.length > 0) {
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
          const similarityMap = new Map(resultsWithSimilarity.map(r => [r.dish_id, r.similarity]));
          const dishMap = new Map(dishes.map(d => [d.id, d]));

          const results = topDishIds
            .filter(id => dishMap.has(id))
            .map(id => {
              const dish = dishMap.get(id);
              return {
                ...dish,
                categories: categoryMap.get(dish.category_id) || null,
                similarity: similarityMap.get(id) || 0,
              };
            });

          console.log(`向量搜索完成，返回 ${results.length} 道菜品`);
          return results;
        }
      }
    }

    // 使用备选的关键词搜索
    console.log('使用关键词智能搜索');
    return await keywordBasedSearch(query, limit);

  } catch (error) {
    console.error('语义搜索错误:', error);
    return await getPopularDishesSimple(limit);
  }
}

// 基于内容推荐（相似菜品）
export async function getSimilarDishes(dishId: number, limit: number = 5) {
  try {
    const client = getSupabaseClient();
    
    // 获取目标菜品
    const { data: targetDish } = await client
      .from('dishes')
      .select('*')
      .eq('id', dishId)
      .single();

    if (!targetDish) {
      return await getPopularDishesSimple(limit);
    }

    // 获取同分类或相似菜品
    const { data: similarDishes } = await client
      .from('dishes')
      .select('*')
      .eq('is_active', true)
      .eq('category_id', targetDish.category_id)
      .neq('id', dishId)
      .order('sales', { ascending: false })
      .limit(limit);

    if (!similarDishes || similarDishes.length === 0) {
      return await getPopularDishesSimple(limit);
    }

    // 获取分类信息
    const categoryIds = [...new Set(similarDishes.map(d => d.category_id).filter(Boolean))];
    let categories: any[] = [];
    if (categoryIds.length > 0) {
      const { data: cats } = await client
        .from('categories')
        .select('*')
        .in('id', categoryIds);
      categories = cats || [];
    }
    const categoryMap = new Map(categories.map(c => [c.id, c]));

    return similarDishes.map(dish => ({
      ...dish,
      categories: categoryMap.get(dish.category_id) || null,
      similarity: 0.8, // 同分类默认相似度
    }));
  } catch (error) {
    console.error('获取相似菜品错误:', error);
    return await getPopularDishesSimple(limit);
  }
}

// 基于购物车内容的推荐
export async function getCartBasedRecommendations(dishIds: number[], limit: number = 6, excludeIds: number[] = []) {
  try {
    const client = getSupabaseClient();
    
    // 获取购物车中的菜品
    const { data: cartDishes } = await client
      .from('dishes')
      .select('*')
      .in('id', dishIds)
      .eq('is_active', true);
    
    if (!cartDishes || cartDishes.length === 0) {
      return await getPopularDishesSimple(limit, excludeIds);
    }
    
    // 分析购物车菜品的分类
    const categoryIds = [...new Set(cartDishes.map(d => d.category_id).filter(Boolean))];
    
    // 合并需要排除的ID（购物车中的 + 已推荐的）
    const allExcludeIds = [...new Set([...dishIds, ...excludeIds])];
    
    // 获取同分类的其他热门菜品
    let query = client
      .from('dishes')
      .select('*')
      .eq('is_active', true)
      .in('category_id', categoryIds)
      .order('sales', { ascending: false });
    
    // 排除购物车中的菜品和已推荐的菜品
    if (allExcludeIds.length > 0) {
      query = query.not('id', 'in', `(${allExcludeIds.join(',')})`);
    }
    
    const { data: similarDishes } = await query.limit(limit * 2); // 获取更多，以便后续筛选
    
    if (!similarDishes || similarDishes.length === 0) {
      return await getPopularDishesSimple(limit);
    }
    
    // 计算推荐分数（基于分类匹配和销量）
    const scoredDishes = similarDishes.map(dish => {
      let score = 0;
      
      // 同分类加分
      if (categoryIds.includes(dish.category_id)) {
        score += 50;
      }
      
      // 销量加分
      score += (dish.sales || 0) / 10;
      
      return { ...dish, score };
    });
    
    // 排序并返回
    scoredDishes.sort((a, b) => b.score - a.score);
    const topDishes = scoredDishes.slice(0, limit);
    
    // 获取分类信息
    const topCategoryIds = [...new Set(topDishes.map(d => d.category_id).filter(Boolean))];
    let categories: any[] = [];
    if (topCategoryIds.length > 0) {
      const { data: cats } = await client
        .from('categories')
        .select('*')
        .in('id', topCategoryIds);
      categories = cats || [];
    }
    const categoryMap = new Map(categories.map(c => [c.id, c]));
    
    return topDishes.map(dish => ({
      ...dish,
      categories: categoryMap.get(dish.category_id) || null,
      similarity: dish.score / 100, // 归一化
    }));
  } catch (error) {
    console.error('基于购物车推荐错误:', error);
    return await getPopularDishesSimple(limit, excludeIds);
  }
}

// 获取热门菜品
export async function getPopularDishesSimple(limit: number = 10, excludeIds: number[] = []) {
  try {
    const client = getSupabaseClient();

    let query = client
      .from('dishes')
      .select('*')
      .eq('is_active', true)
      .order('sales', { ascending: false });
    
    // 排除已推荐的菜品
    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    }
    
    const { data: dishes } = await query.limit(limit);

    if (!dishes) {
      return [];
    }

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
    }));
  } catch (error) {
    console.error('获取热门菜品错误:', error);
    return [];
  }
}