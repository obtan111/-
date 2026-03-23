import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { authenticateUser } from '@/lib/auth/auth';

// 生成订单号
function generateOrderNo(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `ORD${timestamp}${random}`.toUpperCase();
}

// 获取订单列表
export async function GET(request: NextRequest) {
  const authResult = await authenticateUser(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const client = getSupabaseClient();

    // 分步查询，避免关联查询问题
    let ordersQuery = client
      .from('orders')
      .select('*')
      .eq('user_id', authResult.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      ordersQuery = ordersQuery.eq('status', status);
    }

    const { data: orders, error } = await ordersQuery;

    if (error) {
      console.error('获取订单列表错误:', error);
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
    const { data: orderItems, error: itemsError } = await client
      .from('order_items')
      .select('*')
      .in('order_id', orderIds);

    if (itemsError) {
      console.error('获取订单明细错误:', itemsError);
      return NextResponse.json(
        { success: false, error: '获取订单明细失败' },
        { status: 500 }
      );
    }

    // 获取商家信息
    const merchantIds = [...new Set(orders.map(o => o.merchant_id))];
    const { data: merchants, error: merchantsError } = await client
      .from('merchants')
      .select('id, shop_name, logo, phone, address')
      .in('id', merchantIds);

    if (merchantsError) {
      console.error('获取商家信息错误:', merchantsError);
    }

    // 创建映射
    const itemsMap = new Map<string, any[]>();
    orderItems?.forEach(item => {
      if (!itemsMap.has(item.order_id)) {
        itemsMap.set(item.order_id, []);
      }
      itemsMap.get(item.order_id)!.push(item);
    });

    const merchantsMap = new Map(merchants?.map(m => [m.id, m]) || []);

    // 组装数据
    const ordersWithDetails = orders.map(order => ({
      ...order,
      merchants: merchantsMap.get(order.merchant_id) || null,
      order_items: itemsMap.get(order.id) || [],
    }));

    return NextResponse.json({
      success: true,
      data: ordersWithDetails,
    });
  } catch (error) {
    console.error('获取订单列表错误:', error);
    return NextResponse.json(
      { success: false, error: '获取订单列表失败' },
      { status: 500 }
    );
  }
}

// 创建订单
export async function POST(request: NextRequest) {
  const authResult = await authenticateUser(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const body = await request.json();
    const { address, phone, remark } = body;

    const client = getSupabaseClient();

    // 分步获取购物车数据
    const { data: cartItems, error: cartError } = await client
      .from('cart_items')
      .select('*')
      .eq('user_id', authResult.id);

    if (cartError || !cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { success: false, error: '购物车为空' },
        { status: 400 }
      );
    }

    // 获取菜品信息
    const dishIds = [...new Set(cartItems.map(item => item.dish_id))];
    const { data: dishes, error: dishesError } = await client
      .from('dishes')
      .select('id, name, price, stock, sales, merchant_id')
      .in('id', dishIds);

    if (dishesError) {
      return NextResponse.json(
        { success: false, error: '获取菜品信息失败' },
        { status: 500 }
      );
    }

    const dishMap = new Map(dishes?.map(d => [d.id, d]) || []);

    // 验证库存并计算总价
    let totalPrice = 0;
    const orderItems: any[] = [];

    for (const item of cartItems) {
      const dish = dishMap.get(item.dish_id);
      
      if (!dish) {
        return NextResponse.json(
          { success: false, error: '部分菜品不存在' },
          { status: 400 }
        );
      }

      if (dish.stock < item.quantity) {
        return NextResponse.json(
          { success: false, error: `${dish.name} 库存不足` },
          { status: 400 }
        );
      }

      const price = parseFloat(dish.price);
      const subtotal = price * item.quantity;
      totalPrice += subtotal;

      orderItems.push({
        dish_id: dish.id,
        dish_name: dish.name,
        price: dish.price,
        quantity: item.quantity,
        subtotal: subtotal.toFixed(2),
      });
    }

    const merchant_id = cartItems[0].merchant_id;

    // 创建订单
    const orderNo = generateOrderNo();
    const { data: order, error: orderError } = await client
      .from('orders')
      .insert({
        order_no: orderNo,
        user_id: authResult.id,
        merchant_id,
        total_price: totalPrice.toFixed(2),
        status: 'pending',
        address,
        phone,
        remark,
      })
      .select()
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: '创建订单失败' },
        { status: 400 }
      );
    }

    // 创建订单明细
    const orderItemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsError } = await client
      .from('order_items')
      .insert(orderItemsWithOrderId);

    if (itemsError) {
      // 回滚订单
      await client.from('orders').delete().eq('id', order.id);
      return NextResponse.json(
        { success: false, error: '创建订单明细失败' },
        { status: 400 }
      );
    }

    // 扣减库存
    for (const item of cartItems) {
      const dish = dishMap.get(item.dish_id);
      if (dish) {
        await client
          .from('dishes')
          .update({
            stock: dish.stock - item.quantity,
            sales: (dish.sales || 0) + item.quantity,
          })
          .eq('id', item.dish_id);
      }
    }

    // 清空购物车
    await client
      .from('cart_items')
      .delete()
      .eq('user_id', authResult.id);

    return NextResponse.json({
      success: true,
      data: order,
      message: '订单创建成功',
    });
  } catch (error) {
    console.error('创建订单错误:', error);
    return NextResponse.json(
      { success: false, error: '创建订单失败，请稍后重试' },
      { status: 500 }
    );
  }
}
