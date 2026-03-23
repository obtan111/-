import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { authenticateMerchant } from '@/lib/auth/auth';

// 获取菜品列表（支持筛选）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchant_id = searchParams.get('merchant_id');
    const category_id = searchParams.get('category_id');
    const keyword = searchParams.get('keyword');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const client = getSupabaseClient();

    // 简化查询，不使用关联查询
    let query = client
      .from('dishes')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (merchant_id) {
      query = query.eq('merchant_id', merchant_id);
    }

    if (category_id) {
      query = query.eq('category_id', category_id);
    }

    if (keyword) {
      query = query.or(`name.ilike.%${keyword}%,description.ilike.%${keyword}%`);
    }

    const { data: dishes, error } = await query;

    if (error) {
      console.error('获取菜品错误:', error);
      return NextResponse.json(
        { success: false, error: '获取菜品列表失败', details: error.message },
        { status: 500 }
      );
    }

    // 为每个菜品添加分类名称（从分类表获取）
    const { data: categoriesData } = await client
      .from('categories')
      .select('*');
    
    const categoriesMap = new Map(categoriesData?.map(c => [c.id, c]) || []);

    const dishesWithCategory = dishes?.map(dish => ({
      ...dish,
      categories: categoriesMap.get(dish.category_id) || null,
    }));

    return NextResponse.json({
      success: true,
      data: dishesWithCategory || [],
    });
  } catch (error) {
    console.error('获取菜品列表错误:', error);
    return NextResponse.json(
      { success: false, error: '获取菜品列表失败' },
      { status: 500 }
    );
  }
}

// 商家创建菜品
export async function POST(request: NextRequest) {
  const authResult = await authenticateMerchant(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const body = await request.json();
    const { category_id, name, description, price, image, stock } = body;

    // 验证必填字段
    if (!category_id || !name || !price) {
      return NextResponse.json(
        { success: false, error: '分类、名称和价格为必填项' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    const { data: dish, error } = await client
      .from('dishes')
      .insert({
        merchant_id: authResult.id,
        category_id,
        name,
        description,
        price,
        image,
        stock: stock || 999,
        sales: 0,
        rating: '0.00',
        review_count: 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: '创建菜品失败' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: dish,
      message: '菜品创建成功',
    });
  } catch (error) {
    console.error('创建菜品错误:', error);
    return NextResponse.json(
      { success: false, error: '创建菜品失败，请稍后重试' },
      { status: 500 }
    );
  }
}
