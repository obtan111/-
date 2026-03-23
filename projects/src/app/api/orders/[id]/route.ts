import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { authenticateUser } from '@/lib/auth/auth';

// 获取订单详情
export async function GET(
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

    const { data: order, error } = await client
      .from('orders')
      .select(`
        *,
        merchants(id, shop_name, logo, phone, address),
        order_items(*)
      `)
      .eq('id', id)
      .eq('user_id', authResult.id)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { success: false, error: '订单不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('获取订单详情错误:', error);
    return NextResponse.json(
      { success: false, error: '获取订单详情失败' },
      { status: 500 }
    );
  }
}
