import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 整理分类 - 合并重复或相似分类
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();

    // 1. 获取所有分类
    const { data: categories, error: catError } = await client
      .from('categories')
      .select('*')
      .order('id');

    if (catError) {
      return NextResponse.json(
        { success: false, error: '获取分类失败' },
        { status: 500 }
      );
    }

    // 2. 定义分类合并规则
    const mergeRules: Record<string, number> = {
      // 汤类合并
      '汤': 1,
      '汤品': 1,
      '汤羹': 1,
      '热汤': 1,
      '凉汤': 1,
      
      // 粥类合并
      '粥': 2,
      '粥品': 2,
      '稀饭': 2,
      
      // 面类合并
      '面': 3,
      '面条': 3,
      '面食': 3,
      '炒面': 3,
      '汤面': 3,
      
      // 饭类合并
      '饭': 4,
      '米饭': 4,
      '炒饭': 4,
      '盖饭': 4,
      '盖浇饭': 4,
      
      // 菜类合并
      '菜': 5,
      '蔬菜': 5,
      '素菜': 5,
      '荤菜': 5,
      '热菜': 5,
      '凉菜': 5,
      
      // 饮料合并
      '饮料': 6,
      '饮品': 6,
      '酒水': 6,
      '茶': 6,
      '咖啡': 6,
      
      // 甜点合并
      '甜点': 7,
      '甜品': 7,
      '蛋糕': 7,
      '冰淇淋': 7,
      '布丁': 7,
      
      // 小吃合并
      '小吃': 8,
      '零食': 8,
      '点心': 8,
      '烧烤': 8,
      '炸物': 8,
    };

    // 3. 找出需要合并的分类
    const toMerge: any[] = [];
    const keepCategories: any[] = [];
    
    categories.forEach(cat => {
      const name = cat.name.trim();
      const targetCatId = mergeRules[name];
      
      if (targetCatId) {
        if (cat.id === targetCatId) {
          keepCategories.push(cat);
        } else {
          toMerge.push({
            from: cat,
            to: targetCatId,
            reason: `合并到 "${categories.find(c => c.id === targetCatId)?.name}"`
          });
        }
      } else {
        keepCategories.push(cat);
      }
    });

    // 4. 执行合并操作
    const mergeResults: any[] = [];
    
    for (const merge of toMerge) {
      // 更新所有使用该分类的菜品
      const { error: updateError } = await client
        .from('dishes')
        .update({ category_id: merge.to })
        .eq('category_id', merge.from.id);
      
      if (updateError) {
        mergeResults.push({
          from: merge.from.name,
          to: merge.to,
          success: false,
          error: updateError.message
        });
      } else {
        // 删除旧分类
        const { error: deleteError } = await client
          .from('categories')
          .delete()
          .eq('id', merge.from.id);
        
        mergeResults.push({
          from: merge.from.name,
          to: merge.to,
          success: !deleteError,
          error: deleteError?.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        original_count: categories.length,
        merged_count: toMerge.length,
        final_count: keepCategories.length,
        merge_operations: mergeResults,
        remaining_categories: keepCategories
      }
    });
  } catch (error) {
    console.error('整理分类错误:', error);
    return NextResponse.json(
      { success: false, error: '整理分类失败' },
      { status: 500 }
    );
  }
}

// 获取分类分析报告
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();

    // 获取所有分类及其菜品数量
    const { data: categories, error: catError } = await client
      .from('categories')
      .select('*')
      .order('id');

    if (catError) {
      return NextResponse.json(
        { success: false, error: '获取分类失败' },
        { status: 500 }
      );
    }

    // 获取每个分类的菜品数量
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const { count } = await client
          .from('dishes')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', cat.id);
        return {
          ...cat,
          dish_count: count || 0
        };
      })
    );

    // 分析可能的重复
    const duplicates: any[] = [];
    for (let i = 0; i < categories.length; i++) {
      for (let j = i + 1; j < categories.length; j++) {
        const c1 = categories[i];
        const c2 = categories[j];
        
        const name1 = c1.name.toLowerCase();
        const name2 = c2.name.toLowerCase();
        
        if (name1 === name2 || 
            name1.includes(name2) || 
            name2.includes(name1)) {
          duplicates.push({
            category1: c1,
            category2: c2,
            reason: '名称相似或重复'
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        categories: categoriesWithCount,
        duplicates: duplicates,
        summary: {
          total_categories: categories.length,
          total_dishes: categoriesWithCount.reduce((sum, c) => sum + c.dish_count, 0),
          duplicate_groups: duplicates.length
        }
      }
    });
  } catch (error) {
    console.error('分析分类错误:', error);
    return NextResponse.json(
      { success: false, error: '分析分类失败' },
      { status: 500 }
    );
  }
}
