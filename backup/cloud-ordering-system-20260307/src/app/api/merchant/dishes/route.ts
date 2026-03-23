import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { authenticateMerchant } from '@/lib/auth/auth';

// 获取商家菜品列表
export async function GET(request: NextRequest) {
  const authResult = await authenticateMerchant(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const categoryId = searchParams.get('category_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const client = getSupabaseClient();

    // 先获取总数
    let countQuery = client
      .from('dishes')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', authResult.id);

    if (status === 'active') {
      countQuery = countQuery.eq('is_active', true);
    } else if (status === 'inactive') {
      countQuery = countQuery.eq('is_active', false);
    }
    
    // 添加分类筛选
    if (categoryId) {
      countQuery = countQuery.eq('category_id', parseInt(categoryId));
    }

    const { count: totalCount } = await countQuery;

    // 分步查询，避免关联查询问题
    let query = client
      .from('dishes')
      .select('*')
      .eq('merchant_id', authResult.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }
    
    // 添加分类筛选
    if (categoryId) {
      query = query.eq('category_id', parseInt(categoryId));
    }

    const { data: dishes, error } = await query;

    if (error) {
      console.error('获取菜品错误:', error);
      return NextResponse.json(
        { success: false, error: '获取菜品列表失败' },
        { status: 500 }
      );
    }

    // 获取分类信息
    const categoryIds = [...new Set((dishes || []).map(d => d.category_id).filter(Boolean))];
    let categories: any[] = [];
    if (categoryIds.length > 0) {
      const { data: cats } = await client
        .from('categories')
        .select('*')
        .in('id', categoryIds);
      categories = cats || [];
    }
    const categoryMap = new Map(categories.map(c => [c.id, c]));

    // 组装数据
    const dishesWithCategory = (dishes || []).map(dish => ({
      ...dish,
      categories: categoryMap.get(dish.category_id) || null,
    }));

    return NextResponse.json({
      success: true,
      data: dishesWithCategory,
      total: totalCount || 0,
    });
  } catch (error) {
    console.error('获取商家菜品列表错误:', error);
    return NextResponse.json(
      { success: false, error: '获取菜品列表失败' },
      { status: 500 }
    );
  }
}

// 创建新菜品
export async function POST(request: NextRequest) {
  const authResult = await authenticateMerchant(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const body = await request.json();
    const { category_id, name, description, price, stock, image } = body;

    if (!name || !price) {
      return NextResponse.json(
        { success: false, error: '菜品名称和价格为必填项' },
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
        price: price.toString(),
        stock: stock || 100,
        image,
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
      { success: false, error: '创建菜品失败' },
      { status: 500 }
    );
  }
}

// 更新菜品
export async function PUT(request: NextRequest) {
  const authResult = await authenticateMerchant(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const body = await request.json();
    const { dish_id, ...updateData } = body;

    if (!dish_id) {
      return NextResponse.json(
        { success: false, error: '菜品ID为必填项' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 验证菜品属于该商家
    const { data: existingDish } = await client
      .from('dishes')
      .select('id')
      .eq('id', dish_id)
      .eq('merchant_id', authResult.id)
      .single();

    if (!existingDish) {
      return NextResponse.json(
        { success: false, error: '菜品不存在或无权限' },
        { status: 404 }
      );
    }

    const { data: dish, error } = await client
      .from('dishes')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dish_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: '更新菜品失败' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: dish,
      message: '菜品更新成功',
    });
  } catch (error) {
    console.error('更新菜品错误:', error);
    return NextResponse.json(
      { success: false, error: '更新菜品失败' },
      { status: 500 }
    );
  }
}
