// 简单测试订单创建功能
import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

// 测试创建订单
async function testCreateOrder() {
  try {
    // 先登录获取token
    const loginResponse = await axios.post(`${BASE_URL}/api/user/login`, {
      username: 'user1',
      password: '123456'
    });
    
    const token = loginResponse.data.token;
    console.log('登录成功，获取到token');
    
    // 添加商品到购物车
    await axios.post(`${BASE_URL}/api/cart`, {
      dish_id: 1,
      quantity: 1
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('添加商品到购物车成功');
    
    // 创建订单
    const orderResponse = await axios.post(`${BASE_URL}/api/orders`, {
      address: '测试地址',
      phone: '13800138000',
      remark: '测试订单'
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('创建订单成功:', orderResponse.data);
    return orderResponse.data;
  } catch (error) {
    console.error('测试失败:', error.response?.data || error.message);
    throw error;
  }
}

// 主测试函数
async function main() {
  try {
    console.log('开始测试订单创建功能...');
    const order = await testCreateOrder();
    console.log('测试成功！订单创建功能正常。');
    console.log('订单信息:', order);
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 运行测试
main();
