import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 检查和修复重复分类
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

    console.log('当前分类:', categories.map(c => ({ id: c.id, name: c.name, icon: c.icon })));

    // 2. 找出同名分类
    const categoryNames: Record<string, number[]> = {};
    categories.forEach(cat => {
      const name = cat.name.trim();
      if (!categoryNames[name]) {
        categoryNames[name] = [];
      }
      categoryNames[name].push(cat.id);
    });

    // 3. 处理重复分类
    const duplicates = Object.entries(categoryNames)
      .filter(([name, ids]) => ids.length > 1)
      .map(([name, ids]) => ({
        name,
        category_ids: ids,
        count: ids.length
      }));

    console.log('重复分类:', duplicates);

    // 4. 合并重复分类
    const mergeResults: any[] = [];
    
    for (const duplicate of duplicates) {
      // 保留第一个分类，合并其他分类
      const keepId = duplicate.category_ids[0];
      const mergeIds = duplicate.category_ids.slice(1);
      
      console.log(`合并 ${duplicate.name} 分类: 保留 ${keepId}, 合并 ${mergeIds}`);
      
      for (const mergeId of mergeIds) {
        // 更新所有使用该分类的菜品
        const { error: updateError } = await client
          .from('dishes')
          .update({ category_id: keepId })
          .eq('category_id', mergeId);
        
        if (updateError) {
          console.error('更新菜品分类失败:', updateError);
          mergeResults.push({
            category: duplicate.name,
            from: mergeId,
            to: keepId,
            success: false,
            error: updateError.message
          });
        } else {
          // 删除旧分类
          const { error: deleteError } = await client
            .from('categories')
            .delete()
            .eq('id', mergeId);
          
          if (deleteError) {
            console.error('删除旧分类失败:', deleteError);
            mergeResults.push({
              category: duplicate.name,
              from: mergeId,
              to: keepId,
              success: false,
              error: deleteError.message
            });
          } else {
            mergeResults.push({
              category: duplicate.name,
              from: mergeId,
              to: keepId,
              success: true
            });
          }
        }
      }
    }

    // 5. 验证结果
    const { data: finalCategories } = await client
      .from('categories')
      .select('*')
      .order('id');

    return NextResponse.json({
      success: true,
      data: {
        original_categories: categories.length,
        final_categories: finalCategories?.length || 0,
        merged_categories: duplicates.length,
        merge_operations: mergeResults,
        final_categories_list: finalCategories
      }
    });
  } catch (error) {
    console.error('修复分类错误:', error);
    return NextResponse.json(
      { success: false, error: '修复分类失败' },
      { status: 500 }
    );
  }
}

// 检查分类状态
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

    // 3. 检查重复分类
    const categoryNames: Record<string, number[]> = {};
    categories.forEach(cat => {
      const name = cat.name.trim();
      if (!categoryNames[name]) {
        categoryNames[name] = [];
      }
      categoryNames[name].push(cat.id);
    });

    const duplicates = Object.entries(categoryNames)
      .filter(([name, ids]) => ids.length > 1)
      .map(([name, ids]) => ({
        name,
        category_ids: ids,
        count: ids.length
      }));

    return NextResponse.json({
      success: true,
      data: {
        categories: categoriesWithCount,
        duplicates: duplicates,
        summary: {
          total_categories: categories.length,
          total_dishes: categoriesWithCount.reduce((sum, c) => sum + c.dish_count, 0),
          duplicate_categories: duplicates.length
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
