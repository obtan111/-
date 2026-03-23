import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 检查分类情况（管理用）
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();

    // 1. 获取所有分类及其菜品数量
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

    // 2. 获取每个分类的菜品数量
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

    // 3. 查找可能重复的分类（名称相似）
    const duplicates: any[] = [];
    for (let i = 0; i < categories.length; i++) {
      for (let j = i + 1; j < categories.length; j++) {
        const c1 = categories[i];
        const c2 = categories[j];
        
        // 检查名称相似度
        const name1 = c1.name.toLowerCase();
        const name2 = c2.name.toLowerCase();
        
        if (name1 === name2 || 
            name1.includes(name2) || 
            name2.includes(name1) ||
            // 检查常见的同义词
            (name1.includes('汤') && name2.includes('汤')) ||
            (name1.includes('粥') && name2.includes('粥')) ||
            (name1.includes('面') && name2.includes('面'))
        ) {
          duplicates.push({
            category1: c1,
            category2: c2,
            reason: '名称相似或重复'
          });
        }
      }
    }

    // 4. 查找汤类相关的菜品分布
    const { data: soupDishes, error: soupError } = await client
      .from('dishes')
      .select('id, name, description, category_id, categories(name, icon)')
      .or('name.ilike.%汤%,description.ilike.%汤%');

    // 5. 按分类统计汤类菜品
    const soupByCategory: Record<string, any> = {};
    soupDishes?.forEach((dish: any) => {
      const catName = dish.categories?.name || '未分类';
      if (!soupByCategory[catName]) {
        soupByCategory[catName] = {
          category_name: catName,
          category_id: dish.category_id,
          count: 0,
          dishes: []
        };
      }
      soupByCategory[catName].count++;
      soupByCategory[catName].dishes.push({
        id: dish.id,
        name: dish.name,
        description: dish.description
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        categories: categoriesWithCount,
        duplicates: duplicates,
        soup_distribution: Object.values(soupByCategory),
        summary: {
          total_categories: categories.length,
          total_dishes: categoriesWithCount.reduce((sum, c) => sum + c.dish_count, 0),
          soup_dishes_count: soupDishes?.length || 0
        }
      }
    });
  } catch (error) {
    console.error('检查分类错误:', error);
    return NextResponse.json(
      { success: false, error: '检查分类失败' },
      { status: 500 }
    );
  }
}
