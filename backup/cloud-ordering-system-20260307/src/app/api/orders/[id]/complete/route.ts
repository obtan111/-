import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { authenticateUser } from '@/lib/auth/auth';

// 确认收货
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

    // 验证订单状态（支持旧版delivering和新版ready/waiting_receive）
    const validStatuses = ['delivering', 'ready', 'waiting_receive'];
    if (!validStatuses.includes(order.status)) {
      return NextResponse.json(
        { success: false, error: '订单状态不正确，当前订单无法确认收货' },
        { status: 400 }
      );
    }

    // 更新订单状态
    const { data: updatedOrder, error } = await client
      .from('orders')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: '确认收货失败' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: '已确认收货',
    });
  } catch (error) {
    console.error('确认收货错误:', error);
    return NextResponse.json(
      { success: false, error: '确认收货失败，请稍后重试' },
      { status: 500 }
    );
  }
}
