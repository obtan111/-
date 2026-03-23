import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { authenticateUser } from '@/lib/auth/auth';

// 获取评价列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dish_id = searchParams.get('dish_id');
    const order_id = searchParams.get('order_id');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const client = getSupabaseClient();

    let query = client
      .from('reviews')
      .select(`
        *,
        users(id, username, avatar)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (dish_id) {
      query = query.eq('dish_id', dish_id);
    }

    if (order_id) {
      query = query.eq('order_id', order_id);
    }

    const { data: reviews, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: '获取评价列表失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error('获取评价列表错误:', error);
    return NextResponse.json(
      { success: false, error: '获取评价列表失败' },
      { status: 500 }
    );
  }
}

// 创建评价
export async function POST(request: NextRequest) {
  const authResult = await authenticateUser(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const body = await request.json();
    const { dish_id, order_id, rating, content, images } = body;

    // 验证必填字段
    if (!dish_id || !order_id || !rating) {
      return NextResponse.json(
        { success: false, error: '菜品ID、订单ID和评分为必填项' },
        { status: 400 }
      );
    }

    // 验证评分范围
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: '评分范围应为1-5' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 验证订单是否已完成且属于该用户
    const { data: order, error: orderError } = await client
      .from('orders')
      .select('status, user_id')
      .eq('id', order_id)
      .single();

    if (orderError || !order || order.user_id !== authResult.id) {
      return NextResponse.json(
        { success: false, error: '订单不存在或无权限评价' },
        { status: 404 }
      );
    }

    if (order.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: '订单未完成，无法评价' },
        { status: 400 }
      );
    }

    // 检查是否已评价
    const { data: existingReview } = await client
      .from('reviews')
      .select('id')
      .eq('user_id', authResult.id)
      .eq('dish_id', dish_id)
      .eq('order_id', order_id)
      .single();

    if (existingReview) {
      return NextResponse.json(
        { success: false, error: '您已评价过该商品' },
        { status: 400 }
      );
    }

    // 创建评价
    const { data: review, error } = await client
      .from('reviews')
      .insert({
        user_id: authResult.id,
        dish_id,
        order_id,
        rating,
        content,
        images: images || [],
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: '评价失败' },
        { status: 400 }
      );
    }

    // 更新菜品评分和评价数
    const { data: dishReviews } = await client
      .from('reviews')
      .select('rating')
      .eq('dish_id', dish_id);

    if (dishReviews) {
      const totalRating = dishReviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = (totalRating / dishReviews.length).toFixed(2);

      await client
        .from('dishes')
        .update({
          rating: avgRating,
          review_count: dishReviews.length,
        })
        .eq('id', dish_id);
    }

    return NextResponse.json({
      success: true,
      data: review,
      message: '评价成功',
    });
  } catch (error) {
    console.error('创建评价错误:', error);
    return NextResponse.json(
      { success: false, error: '评价失败，请稍后重试' },
      { status: 500 }
    );
  }
}
