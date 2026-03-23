#!/usr/bin/env node

/**
 * 登录和注册测试脚本
 * 运行方式：node scripts/test-auth.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// 加载环境变量
dotenv.config({
  path: '.env.local'
});

async function testAuth() {
  console.log('开始测试登录和注册功能...');
  
  try {
    // 获取Supabase配置
    const supabaseUrl = process.env.COZE_SUPABASE_URL;
    const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ 缺少Supabase配置');
      return false;
    }
    
    console.log('✅ 成功加载Supabase配置');
    
    // 创建Supabase客户端
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      db: {
        timeout: 60000,
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    console.log('✅ 成功创建Supabase客户端');
    
    // 测试1: 检查用户表是否存在
    console.log('\n=== 测试1: 检查用户表 ===');
    try {
      const { data: users, error } = await client
        .from('users')
        .select('id, username, email')
        .limit(5);
      
      if (error) {
        console.error('❌ 用户表查询失败:', error.message);
        console.error('错误详情:', error);
      } else {
        console.log('✅ 用户表查询成功');
        console.log('当前用户数量:', users ? users.length : 0);
        if (users && users.length > 0) {
          console.log('现有用户:', users);
        }
      }
    } catch (error) {
      console.error('❌ 用户表检查出错:', error.message);
    }
    
    // 测试2: 检查商家表是否存在
    console.log('\n=== 测试2: 检查商家表 ===');
    try {
      const { data: merchants, error } = await client
        .from('merchants')
        .select('id, username, shop_name')
        .limit(5);
      
      if (error) {
        console.error('❌ 商家表查询失败:', error.message);
        console.error('错误详情:', error);
      } else {
        console.log('✅ 商家表查询成功');
        console.log('当前商家数量:', merchants ? merchants.length : 0);
        if (merchants && merchants.length > 0) {
          console.log('现有商家:', merchants);
        }
      }
    } catch (error) {
      console.error('❌ 商家表检查出错:', error.message);
    }
    
    // 测试3: 尝试注册新用户
    console.log('\n=== 测试3: 尝试注册新用户 ===');
    const testUsername = 'testuser_' + Date.now();
    const testEmail = testUsername + '@example.com';
    const testPassword = '123456';
    
    try {
      // 加密密码
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      console.log('密码加密成功');
      
      // 尝试插入用户
      const { data: newUser, error } = await client
        .from('users')
        .insert({
          username: testUsername,
          email: testEmail,
          password: hashedPassword,
          phone: '13800138000',
          is_active: true,
        })
        .select()
        .single();
      
      console.log('注册结果 - 数据:', newUser);
      console.log('注册结果 - 错误:', error);
      
      if (error) {
        console.error('❌ 注册失败:', error.message);
      } else {
        console.log('✅ 注册成功:', newUser.username);
        
        // 测试4: 尝试登录
        console.log('\n=== 测试4: 尝试登录 ===');
        const { data: loginUser, error: loginError } = await client
          .from('users')
          .select('*')
          .eq('username', testUsername)
          .single();
        
        if (loginError || !loginUser) {
          console.error('❌ 登录查询失败:', loginError?.message);
        } else {
          console.log('✅ 登录查询成功');
          
          // 验证密码
          const isValid = await bcrypt.compare(testPassword, loginUser.password);
          console.log('密码验证结果:', isValid);
          
          if (isValid) {
            console.log('✅ 登录成功！');
          } else {
            console.error('❌ 密码验证失败');
          }
        }
      }
    } catch (error) {
      console.error('❌ 注册测试出错:', error.message);
      console.error('错误堆栈:', error.stack);
    }
    
    console.log('\n=== 测试完成 ===');
    return true;
  } catch (error) {
    console.error('❌ 测试执行失败:', error.message);
    return false;
  }
}

// 执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  testAuth().then((success) => {
    process.exit(success ? 0 : 1);
  });
}

export { testAuth };