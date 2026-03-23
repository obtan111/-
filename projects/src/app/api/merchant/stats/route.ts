import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { authenticateMerchant } from '@/lib/auth/auth';

// 获取销售统计数据
export async function GET(request: NextRequest) {
  const authResult = await authenticateMerchant(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const client = getSupabaseClient();

    // 构建日期过滤
    let dateFilter = '';
    if (startDate && endDate) {
      dateFilter = `and(created_at.gte.${startDate},created_at.lte.${endDate})`;
    }

    // 获取订单统计
    const { data: orders, error: ordersError } = await client
      .from('orders')
      .select('id, total_price, status, created_at')
      .eq('merchant_id', authResult.id)
      .not('status', 'eq', 'cancelled');

    if (ordersError) {
      throw ordersError;
    }

    // 计算统计数据
    const totalOrders = orders?.length || 0;
    const totalRevenue = orders?.reduce((sum, order) => sum + parseFloat(order.total_price), 0) || 0;

    // 按状态统计
    const statusStats = {
      pending: orders?.filter(o => o.status === 'pending').length || 0,
      paid: orders?.filter(o => o.status === 'paid').length || 0,
      preparing: orders?.filter(o => o.status === 'preparing').length || 0,
      ready: orders?.filter(o => o.status === 'ready').length || 0,
      waiting_receive: orders?.filter(o => o.status === 'waiting_receive').length || 0,
      completed: orders?.filter(o => o.status === 'completed').length || 0,
    };

    // 获取菜品销量统计
    const { data: dishes, error: dishesError } = await client
      .from('dishes')
      .select('id, name, sales, price')
      .eq('merchant_id', authResult.id)
      .eq('is_active', true)
      .order('sales', { ascending: false })
      .limit(10);

    if (dishesError) {
      throw dishesError;
    }

    // 按日期统计（最近7天）
    const last7Days: { date: string; revenue: number; orders: number }[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayOrders = orders?.filter(o => o.created_at.startsWith(dateStr)) || [];
      const dayRevenue = dayOrders.reduce((sum, o) => sum + parseFloat(o.total_price), 0);
      
      last7Days.push({
        date: dateStr,
        revenue: dayRevenue,
        orders: dayOrders.length,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalOrders,
          totalRevenue: totalRevenue.toFixed(2),
          statusStats,
        },
        topDishes: dishes || [],
        last7Days,
      },
    });
  } catch (error) {
    console.error('获取销售统计错误:', error);
    return NextResponse.json(
      { success: false, error: '获取销售统计失败' },
      { status: 500 }
    );
  }
}
