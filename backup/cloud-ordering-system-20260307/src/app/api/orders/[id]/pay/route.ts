import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { authenticateUser } from '@/lib/auth/auth';

// 支付订单
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
    const { payment_method } = body;

    if (!payment_method) {
      return NextResponse.json(
        { success: false, error: '支付方式为必填项' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 验证订单
    const { data: order, error: orderError } = await client
      .from('orders')
      .select('*')
      .eq('id', id)
      .eq('user_id', authResult.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: '订单不存在' },
        { status: 404 }
      );
    }

    if (order.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: '订单状态不正确' },
        { status: 400 }
      );
    }

    // 更新订单状态
    const { data: updatedOrder, error } = await client
      .from('orders')
      .update({
        status: 'paid',
        payment_method,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: '支付失败' },
        { status: 400 }
      );
    }

    // 更新商家销售额
    await client
      .from('merchants')
      .update({
        total_sales: order.merchant_id + 1, // 简单递增
      })
      .eq('id', order.merchant_id);

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: '支付成功',
    });
  } catch (error) {
    console.error('支付订单错误:', error);
    return NextResponse.json(
      { success: false, error: '支付失败，请稍后重试' },
      { status: 500 }
    );
  }
}
