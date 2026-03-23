import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { authenticateMerchant } from '@/lib/auth/auth';

export async function GET(request: NextRequest) {
  const authResult = await authenticateMerchant(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = client
      .from('orders')
      .select('*')
      .eq('merchant_id', authResult.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('获取订单错误:', error);
      return NextResponse.json(
        { success: false, error: '获取订单列表失败' },
        { status: 500 }
      );
    }

    // 如果没有订单，直接返回
    if (!orders || orders.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // 获取订单明细
    const orderIds = orders.map(o => o.id);
    const { data: orderItems } = await client
      .from('order_items')
      .select('*')
      .in('order_id', orderIds);

    // 获取菜品信息
    const dishIds = [...new Set((orderItems || []).map(item => item.dish_id).filter(Boolean))];
    let dishes: any[] = [];
    if (dishIds.length > 0) {
      const { data: dishesData } = await client
        .from('dishes')
        .select('id, name, price')
        .in('id', dishIds);
      dishes = dishesData || [];
    }

    // 获取用户信息
    const userIds = [...new Set(orders.map(o => o.user_id).filter(Boolean))];
    let users: any[] = [];
    if (userIds.length > 0) {
      const { data: usersData } = await client
        .from('users')
        .select('id, username, phone')
        .in('id', userIds);
      users = usersData || [];
    }

    // 创建映射
    const dishesMap = new Map(dishes.map(d => [d.id, d]));
    const itemsMap = new Map<string, any[]>();
    (orderItems || []).forEach(item => {
      const key = item.order_id.toString();
      if (!itemsMap.has(key)) {
        itemsMap.set(key, []);
      }
      // 添加菜品信息到订单项
      const itemWithDish = {
        ...item,
        dishes: dishesMap.get(item.dish_id) || null,
      };
      itemsMap.get(key)!.push(itemWithDish);
    });

    const usersMap = new Map(users.map(u => [u.id, u]));

    // 组装数据
    const ordersWithDetails = orders.map(order => ({
      ...order,
      users: usersMap.get(order.user_id) || null,
      order_items: itemsMap.get(order.id.toString()) || [],
    }));

    return NextResponse.json({
      success: true,
      data: ordersWithDetails,
    });
  } catch (error) {
    console.error('获取商家订单列表错误:', error);
    return NextResponse.json(
      { success: false, error: '获取订单列表失败' },
      { status: 500 }
    );
  }
}

// 更新订单状态（商家端）
export async function PUT(request: NextRequest) {
  const authResult = await authenticateMerchant(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const body = await request.json();
    const { order_id, status } = body;

    if (!order_id || !status) {
      return NextResponse.json(
        { success: false, error: '订单ID和状态为必填项' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 验证订单属于该商家
    const { data: order } = await client
      .from('orders')
      .select('id, status')
      .eq('id', order_id)
      .eq('merchant_id', authResult.id)
      .single();

    if (!order) {
      return NextResponse.json(
        { success: false, error: '订单不存在或无权限' },
        { status: 404 }
      );
    }

    // 更新订单状态（只更新status和updated_at字段）
    const { data: updatedOrder, error } = await client
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', order_id)
      .select()
      .single();

    if (error) {
      console.error('更新订单状态错误:', error);
      return NextResponse.json(
        { success: false, error: '更新订单状态失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: '订单状态更新成功',
    });
  } catch (error) {
    console.error('更新订单状态错误:', error);
    return NextResponse.json(
      { success: false, error: '更新订单状态失败' },
      { status: 500 }
    );
  }
}