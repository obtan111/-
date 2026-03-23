import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { authenticateMerchant } from '@/lib/auth/auth';

// 获取菜品详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();

    const { data: dish, error } = await client
      .from('dishes')
      .select(`
        *,
        categories(id, name, icon),
        merchants(id, shop_name, logo, rating, address)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error || !dish) {
      return NextResponse.json(
        { success: false, error: '菜品不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: dish,
    });
  } catch (error) {
    console.error('获取菜品详情错误:', error);
    return NextResponse.json(
      { success: false, error: '获取菜品详情失败' },
      { status: 500 }
    );
  }
}

// 更新菜品
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateMerchant(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { category_id, name, description, price, image, stock, is_active } = body;

    const client = getSupabaseClient();

    // 验证菜品是否属于该商家
    const { data: existingDish } = await client
      .from('dishes')
      .select('merchant_id')
      .eq('id', id)
      .single();

    if (!existingDish || existingDish.merchant_id !== authResult.id) {
      return NextResponse.json(
        { success: false, error: '无权限修改此菜品' },
        { status: 403 }
      );
    }

    const { data: dish, error } = await client
      .from('dishes')
      .update({
        category_id,
        name,
        description,
        price,
        image,
        stock,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
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
      { success: false, error: '更新菜品失败，请稍后重试' },
      { status: 500 }
    );
  }
}

// 删除菜品（软删除）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateMerchant(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { id } = await params;
    const client = getSupabaseClient();

    // 验证菜品是否属于该商家
    const { data: existingDish } = await client
      .from('dishes')
      .select('merchant_id')
      .eq('id', id)
      .single();

    if (!existingDish || existingDish.merchant_id !== authResult.id) {
      return NextResponse.json(
        { success: false, error: '无权限删除此菜品' },
        { status: 403 }
      );
    }

    const { error } = await client
      .from('dishes')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: '删除菜品失败' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '菜品删除成功',
    });
  } catch (error) {
    console.error('删除菜品错误:', error);
    return NextResponse.json(
      { success: false, error: '删除菜品失败，请稍后重试' },
      { status: 500 }
    );
  }
}
