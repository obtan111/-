import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { authenticateUser } from '@/lib/auth/auth';

// 获取购物车
export async function GET(request: NextRequest) {
  const authResult = await authenticateUser(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const client = getSupabaseClient();

    // 分步查询，避免关联查询问题
    const { data: cartItems, error } = await client
      .from('cart_items')
      .select('*')
      .eq('user_id', authResult.id);

    if (error) {
      console.error('获取购物车错误:', error);
      return NextResponse.json(
        { success: false, error: '获取购物车失败' },
        { status: 500 }
      );
    }

    // 如果购物车为空，直接返回
    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          items: [],
          totalPrice: '0.00',
          itemCount: 0,
        },
      });
    }

    // 获取菜品信息
    const dishIds = [...new Set(cartItems.map(item => item.dish_id))];
    const { data: dishes, error: dishesError } = await client
      .from('dishes')
      .select('id, name, price, image, stock, merchant_id')
      .in('id', dishIds);

    if (dishesError) {
      console.error('获取菜品信息错误:', dishesError);
      return NextResponse.json(
        { success: false, error: '获取菜品信息失败' },
        { status: 500 }
      );
    }

    // 创建菜品映射
    const dishMap = new Map(dishes?.map(d => [d.id, d]) || []);

    // 计算总价并组装数据
    let totalPrice = 0;
    const items = cartItems.map(item => {
      const dish = dishMap.get(item.dish_id);
      const price = dish ? parseFloat(dish.price) : 0;
      const subtotal = price * item.quantity;
      totalPrice += subtotal;
      return {
        ...item,
        dishes: dish || { name: '未知菜品', price: 0 },
        subtotal: subtotal.toFixed(2),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        items,
        totalPrice: totalPrice.toFixed(2),
        itemCount: items.length,
      },
    });
  } catch (error) {
    console.error('获取购物车错误:', error);
    return NextResponse.json(
      { success: false, error: '获取购物车失败' },
      { status: 500 }
    );
  }
}

// 添加到购物车
export async function POST(request: NextRequest) {
  const authResult = await authenticateUser(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const body = await request.json();
    const { dish_id, quantity = 1 } = body;

    if (!dish_id) {
      return NextResponse.json(
        { success: false, error: '菜品ID为必填项' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 获取菜品信息
    const { data: dish, error: dishError } = await client
      .from('dishes')
      .select('id, merchant_id, stock, is_active')
      .eq('id', dish_id)
      .single();

    if (dishError || !dish) {
      return NextResponse.json(
        { success: false, error: '菜品不存在' },
        { status: 404 }
      );
    }

    if (!dish.is_active) {
      return NextResponse.json(
        { success: false, error: '该菜品已下架' },
        { status: 400 }
      );
    }

    if (dish.stock < quantity) {
      return NextResponse.json(
        { success: false, error: '库存不足' },
        { status: 400 }
      );
    }

    // 检查购物车中是否有其他商家的商品
    const { data: existingCart } = await client
      .from('cart_items')
      .select('merchant_id')
      .eq('user_id', authResult.id)
      .limit(1);

    if (existingCart && existingCart.length > 0 && existingCart[0].merchant_id !== dish.merchant_id) {
      return NextResponse.json(
        { success: false, error: '购物车中已有其他商家的商品，请先清空购物车' },
        { status: 400 }
      );
    }

    // 检查购物车中是否已有该商品
    const { data: existingItem } = await client
      .from('cart_items')
      .select('*')
      .eq('user_id', authResult.id)
      .eq('dish_id', dish_id)
      .single();

    if (existingItem) {
      // 更新数量
      const newQuantity = existingItem.quantity + quantity;
      
      if (dish.stock < newQuantity) {
        return NextResponse.json(
          { success: false, error: '库存不足' },
          { status: 400 }
        );
      }

      const { data: updatedItem, error } = await client
        .from('cart_items')
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingItem.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: '更新购物车失败' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: updatedItem,
        message: '已更新购物车',
      });
    } else {
      // 新增商品
      const { data: newItem, error } = await client
        .from('cart_items')
        .insert({
          user_id: authResult.id,
          dish_id,
          merchant_id: dish.merchant_id,
          quantity,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: '添加到购物车失败' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: newItem,
        message: '已添加到购物车',
      });
    }
  } catch (error) {
    console.error('添加到购物车错误:', error);
    return NextResponse.json(
      { success: false, error: '添加到购物车失败' },
      { status: 500 }
    );
  }
}

// 更新购物车
export async function PUT(request: NextRequest) {
  const authResult = await authenticateUser(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const body = await request.json();
    const { dish_id, quantity } = body;

    if (!dish_id) {
      return NextResponse.json(
        { success: false, error: '菜品ID为必填项' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    if (quantity <= 0) {
      // 删除商品
      const { error } = await client
        .from('cart_items')
        .delete()
        .eq('user_id', authResult.id)
        .eq('dish_id', dish_id);

      if (error) {
        return NextResponse.json(
          { success: false, error: '删除失败' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: '已从购物车移除',
      });
    }

    // 获取菜品库存
    const { data: dish } = await client
      .from('dishes')
      .select('stock')
      .eq('id', dish_id)
      .single();

    if (dish && dish.stock < quantity) {
      return NextResponse.json(
        { success: false, error: '库存不足' },
        { status: 400 }
      );
    }

    const { data: updatedItem, error } = await client
      .from('cart_items')
      .update({
        quantity,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', authResult.id)
      .eq('dish_id', dish_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: '更新失败' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedItem,
      message: '更新成功',
    });
  } catch (error) {
    console.error('更新购物车错误:', error);
    return NextResponse.json(
      { success: false, error: '更新失败' },
      { status: 500 }
    );
  }
}

// 清空购物车
export async function DELETE(request: NextRequest) {
  const authResult = await authenticateUser(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const client = getSupabaseClient();

    const { error } = await client
      .from('cart_items')
      .delete()
      .eq('user_id', authResult.id);

    if (error) {
      return NextResponse.json(
        { success: false, error: '清空失败' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '购物车已清空',
    });
  } catch (error) {
    console.error('清空购物车错误:', error);
    return NextResponse.json(
      { success: false, error: '清空失败' },
      { status: 500 }
    );
  }
}
