// 测试订单创建功能
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Supabase配置
const supabaseUrl = process.env.COZE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('请配置Supabase环境变量');
  process.exit(1);
}

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 测试创建订单
async function testCreateOrder() {
  try {
    console.log('开始测试订单创建功能...');
    
    // 1. 登录用户
    const { data: loginData, error: loginError } = await supabase
      .auth.signInWithPassword({
        email: 'user1@example.com',
        password: '123456'
      });
    
    if (loginError) {
      console.error('登录失败:', loginError);
      return;
    }
    
    console.log('登录成功，用户ID:', loginData.user?.id);
    
    // 2. 获取商家ID
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id')
      .limit(1)
      .single();
    
    if (merchantError || !merchant) {
      console.error('获取商家失败:', merchantError);
      return;
    }
    
    console.log('获取商家成功，商家ID:', merchant.id);
    
    // 3. 获取菜品ID
    const { data: dish, error: dishError } = await supabase
      .from('dishes')
      .select('id')
      .eq('merchant_id', merchant.id)
      .limit(1)
      .single();
    
    if (dishError || !dish) {
      console.error('获取菜品失败:', dishError);
      return;
    }
    
    console.log('获取菜品成功，菜品ID:', dish.id);
    
    // 4. 添加到购物车
    const { data: cartItem, error: cartError } = await supabase
      .from('cart_items')
      .insert({
        user_id: loginData.user?.id,
        dish_id: dish.id,
        merchant_id: merchant.id,
        quantity: 1
      })
      .select()
      .single();
    
    if (cartError) {
      console.error('添加到购物车失败:', cartError);
      return;
    }
    
    console.log('添加到购物车成功');
    
    // 5. 创建订单
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: loginData.user?.id,
        merchant_id: merchant.id,
        total_price: 100,
        status: 'pending',
        payment_method: 'cash',
        address: '测试地址',
        phone: '13800138000',
        remark: '测试订单'
      })
      .select()
      .single();
    
    if (orderError || !order) {
      console.error('创建订单失败:', orderError);
      return;
    }
    
    console.log('创建订单成功，订单ID:', order.id);
    
    // 6. 创建订单明细
    const { data: orderItem, error: itemError } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        dish_id: dish.id,
        dish_name: '测试菜品',
        price: 100,
        quantity: 1,
        subtotal: 100
      })
      .select()
      .single();
    
    if (itemError) {
      console.error('创建订单明细失败:', itemError);
      // 回滚订单
      await supabase.from('orders').delete().eq('id', order.id);
      return;
    }
    
    console.log('创建订单明细成功，订单明细ID:', orderItem.id);
    
    // 7. 清理购物车
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', loginData.user?.id);
    
    console.log('测试完成，订单创建功能正常！');
    console.log('订单信息:', {
      orderId: order.id,
      orderItemId: orderItem.id,
      totalPrice: order.total_price,
      status: order.status
    });
    
  } catch (error) {
    console.error('测试过程中出错:', error);
  }
}

// 运行测试
testCreateOrder();
