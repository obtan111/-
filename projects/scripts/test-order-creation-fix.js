// 测试订单创建功能
import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

// 测试用户登录
async function testLogin() {
  try {
    const response = await axios.post(`${BASE_URL}/api/user/login`, {
      username: 'user1',
      password: '123456'
    });
    return response.data.token;
  } catch (error) {
    console.error('登录失败:', error.response?.data || error.message);
    throw error;
  }
}

// 测试添加购物车
async function testAddToCart(token) {
  try {
    // 假设菜品ID为1
    const response = await axios.post(`${BASE_URL}/api/cart`, {
      dish_id: 1,
      quantity: 1
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('添加购物车成功:', response.data);
  } catch (error) {
    console.error('添加购物车失败:', error.response?.data || error.message);
    throw error;
  }
}

// 测试创建订单
async function testCreateOrder(token) {
  try {
    const response = await axios.post(`${BASE_URL}/api/orders`, {
      address: '测试地址',
      phone: '13800138000',
      remark: '测试订单'
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('创建订单成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('创建订单失败:', error.response?.data || error.message);
    throw error;
  }
}

// 主测试函数
async function main() {
  try {
    console.log('开始测试订单创建功能...');
    
    // 登录
    const token = await testLogin();
    console.log('登录成功，获取到token:', token.substring(0, 20) + '...');
    
    // 添加购物车
    await testAddToCart(token);
    
    // 创建订单
    const order = await testCreateOrder(token);
    
    console.log('测试成功！订单创建功能正常。');
    console.log('订单信息:', order);
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 运行测试
main();
