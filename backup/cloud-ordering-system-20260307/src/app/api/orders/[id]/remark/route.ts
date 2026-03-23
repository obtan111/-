import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { authenticateUser } from '@/lib/auth/auth';

// 更新订单备注
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
    const { remark } = body;

    const client = getSupabaseClient();

    // 验证订单属于该用户
    const { data: order, error: orderError } = await client
      .from('orders')
      .select('id')
      .eq('id', orderId)
      .eq('user_id', authResult.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: '订单不存在' },
        { status: 404 }
      );
    }

    // 更新备注
    const { data: updatedOrder, error: updateError } = await client
      .from('orders')
      .update({
        remark,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: '更新备注失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: '备注已更新',
    });
  } catch (error) {
    console.error('更新备注错误:', error);
    return NextResponse.json(
      { success: false, error: '更新失败，请稍后重试' },
      { status: 500 }
    );
  }
}
