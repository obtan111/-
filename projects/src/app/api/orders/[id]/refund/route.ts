import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { authenticateUser } from '@/lib/auth/auth';

// 用户申请退款
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
    const orderId = parseInt(id);
    const body = await request.json();
    const { refund_reason } = body;

    if (!refund_reason) {
      return NextResponse.json(
        { success: false, error: '请填写退款原因' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 验证订单属于该用户
    const { data: order, error: orderError } = await client
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', authResult.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: '订单不存在' },
        { status: 404 }
      );
    }

    // 只有已支付、准备中的订单可以退款
    if (!['paid', 'preparing'].includes(order.status)) {
      return NextResponse.json(
        { success: false, error: '该订单状态不支持退款' },
        { status: 400 }
      );
    }

    // 更新订单状态为已退款（使用cancelled_at和cancel_reason字段）
    const { data: updatedOrder, error: updateError } = await client
      .from('orders')
      .update({
        status: 'refunded',
        cancel_reason: `[退款] ${refund_reason}`,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('退款更新错误:', updateError);
      return NextResponse.json(
        { success: false, error: '退款失败' },
        { status: 500 }
      );
    }

    // 恢复库存 - 直接更新
    const { data: orderItems } = await client
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (orderItems && orderItems.length > 0) {
      for (const item of orderItems) {
        // 获取当前库存
        const { data: dish } = await client
          .from('dishes')
          .select('stock, sales')
          .eq('id', item.dish_id)
          .single();
        
        if (dish) {
          // 恢复库存，减少销量
          await client
            .from('dishes')
            .update({
              stock: dish.stock + item.quantity,
              sales: Math.max(0, (dish.sales || 0) - item.quantity),
            })
            .eq('id', item.dish_id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: '退款成功',
    });
  } catch (error) {
    console.error('退款错误:', error);
    return NextResponse.json(
      { success: false, error: '退款失败，请稍后重试' },
      { status: 500 }
    );
  }
}
