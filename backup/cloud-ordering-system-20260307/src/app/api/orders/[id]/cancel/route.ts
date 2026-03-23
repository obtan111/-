import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { authenticateUser } from '@/lib/auth/auth';

// 取消订单
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateUser(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { cancel_reason } = body;

    const client = getSupabaseClient();

    // 验证订单
    const { data: order, error: orderError } = await client
      .from('orders')
      .select(`
        *,
        order_items(*)
      `)
      .eq('id', id)
      .eq('user_id', authResult.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: '订单不存在' },
        { status: 404 }
      );
    }

    if (!['pending', 'paid'].includes(order.status)) {
      return NextResponse.json(
        { success: false, error: '订单状态不可取消' },
        { status: 400 }
      );
    }

    // 更新订单状态
    const { data: updatedOrder, error } = await client
      .from('orders')
      .update({
        status: 'cancelled',
        cancel_reason,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: '取消订单失败' },
        { status: 400 }
      );
    }

    // 恢复库存
    for (const item of order.order_items) {
      await client
        .from('dishes')
        .update({
          stock: item.dish_id + item.quantity, // 简化处理
          sales: item.dish_id - item.quantity,
        })
        .eq('id', item.dish_id);
    }

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: '订单已取消',
    });
  } catch (error) {
    console.error('取消订单错误:', error);
    return NextResponse.json(
      { success: false, error: '取消订单失败，请稍后重试' },
      { status: 500 }
    );
  }
}
