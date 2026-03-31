// 测试初始化过程
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// 测试初始化API
async function testInitialization() {
  try {
    const response = await axios.post(`${BASE_URL}/api/init`);
    console.log('初始化成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('初始化失败:', error.response?.data || error.message);
    throw error;
  }
}

// 主测试函数
async function main() {
  try {
    console.log('开始测试初始化过程...');
    
    // 调用初始化API
    const result = await testInitialization();
    
    console.log('测试成功！初始化过程正常。');
    console.log('初始化结果:', result);
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 运行测试
main();
