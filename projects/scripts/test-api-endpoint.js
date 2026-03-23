#!/usr/bin/env node

/**
 * 测试API端点脚本
 * 运行方式：node scripts/test-api-endpoint.js
 */

async function testApi() {
  console.log('开始测试API端点...');
  
  try {
    // 测试菜品API
    console.log('测试菜品API...');
    const dishResponse = await fetch('http://localhost:5000/api/dishes?limit=50');
    const dishData = await dishResponse.json();
    
    console.log('\n=== 菜品API响应 ===');
    console.log('状态码:', dishResponse.status);
    console.log('响应数据:', dishData);
    
    // 测试分类API
    console.log('\n测试分类API...');
    const categoryResponse = await fetch('http://localhost:5000/api/categories');
    const categoryData = await categoryResponse.json();
    
    console.log('\n=== 分类API响应 ===');
    console.log('状态码:', categoryResponse.status);
    console.log('响应数据:', categoryData);
    
  } catch (error) {
    console.error('测试API失败:', error);
  }
}

// 执行测试
testApi().then(() => {
  process.exit(0);
});