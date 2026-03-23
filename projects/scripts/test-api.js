#!/usr/bin/env node

/**
 * API端点测试脚本
 * 运行方式：node scripts/test-api.js
 */

import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({
  path: '.env.local'
});

async function testApi() {
  console.log('开始测试API端点...');
  
  const baseUrl = 'http://localhost:5000/api';
  
  // 测试1: 尝试注册
  console.log('\n=== 测试1: 注册新用户 ===');
  try {
    const testUsername = 'testuser_' + Date.now();
    const testEmail = testUsername + '@example.com';
    
    console.log('注册用户名:', testUsername);
    console.log('注册邮箱:', testEmail);
    
    const response = await fetch(`${baseUrl}/user/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: testUsername,
        email: testEmail,
        password: '123456',
        phone: '13800138000',
      }),
    });
    
    const data = await response.json();
    console.log('注册响应状态:', response.status);
    console.log('注册响应数据:', data);
    
    if (response.status === 200 && data.success) {
      console.log('✅ 注册成功！');
      
      // 测试2: 尝试登录
      console.log('\n=== 测试2: 登录 ===');
      const loginResponse = await fetch(`${baseUrl}/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: testUsername,
          password: '123456',
        }),
      });
      
      const loginData = await loginResponse.json();
      console.log('登录响应状态:', loginResponse.status);
      console.log('登录响应数据:', loginData);
      
      if (loginResponse.status === 200 && loginData.success) {
        console.log('✅ 登录成功！');
        console.log('获取到的Token:', loginData.data.token.substring(0, 50) + '...');
      } else {
        console.error('❌ 登录失败');
      }
    } else {
      console.error('❌ 注册失败');
    }
  } catch (error) {
    console.error('❌ 注册测试出错:', error.message);
  }
  
  // 测试3: 尝试使用测试账号登录
  console.log('\n=== 测试3: 使用测试账号登录 ===');
  try {
    const testCredentials = [
      { username: 'testuser', password: '123456' },
      { username: 'merchant', password: '123456' },
    ];
    
    for (const cred of testCredentials) {
      console.log(`\n尝试登录: ${cred.username}`);
      
      const response = await fetch(`${baseUrl}/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cred),
      });
      
      const data = await response.json();
      console.log('响应状态:', response.status);
      console.log('响应数据:', data);
    }
  } catch (error) {
    console.error('❌ 测试账号登录出错:', error.message);
  }
  
  console.log('\n=== 测试完成 ===');
}

// 执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  testApi().then(() => {
    process.exit(0);
  });
}

export { testApi };