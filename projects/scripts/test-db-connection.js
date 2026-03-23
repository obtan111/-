#!/usr/bin/env node

/**
 * 数据库连接测试脚本
 * 运行方式：node scripts/test-db-connection.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({
  path: '.env.local'
});

async function testDbConnection() {
  console.log('开始测试数据库连接...');
  
  try {
    // 获取Supabase配置
    const supabaseUrl = process.env.COZE_SUPABASE_URL;
    const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ 缺少Supabase配置');
      console.error('请检查.env.local文件中的COZE_SUPABASE_URL和COZE_SUPABASE_ANON_KEY');
      return false;
    }
    
    console.log('✅ 成功加载Supabase配置');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Anon Key:', supabaseAnonKey.substring(0, 20) + '...');
    
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
    
    // 测试连接 - 执行一个简单的查询
    console.log('正在测试数据库连接...');
    
    // 测试用户表
    console.log('\n1. 测试用户表查询:');
    const { data: users, error: usersError } = await client
      .from('users')
      .select('id, username, email')
      .limit(5);
    
    if (usersError) {
      console.error('❌ 用户表查询失败:', usersError.message);
      console.error('错误详情:', usersError);
    } else {
      console.log('✅ 用户表查询成功');
      console.log('用户数量:', users ? users.length : 0);
      if (users && users.length > 0) {
        console.log('前3个用户:', users.slice(0, 3));
      }
    }
    
    // 测试商家表
    console.log('\n2. 测试商家表查询:');
    const { data: merchants, error: merchantsError } = await client
      .from('merchants')
      .select('id, username, shop_name')
      .limit(5);
    
    if (merchantsError) {
      console.error('❌ 商家表查询失败:', merchantsError.message);
      console.error('错误详情:', merchantsError);
    } else {
      console.log('✅ 商家表查询成功');
      console.log('商家数量:', merchants ? merchants.length : 0);
      if (merchants && merchants.length > 0) {
        console.log('前3个商家:', merchants.slice(0, 3));
      }
    }
    
    // 测试orders表（之前的保持活跃脚本使用的表）
    console.log('\n3. 测试orders表查询:');
    const { data: orders, error: ordersError } = await client
      .from('orders')
      .select('id')
      .limit(1);
    
    if (ordersError) {
      console.error('❌ orders表查询失败:', ordersError.message);
      console.error('错误详情:', ordersError);
    } else {
      console.log('✅ orders表查询成功');
      console.log('查询结果:', orders);
    }
    
    // 记录执行时间
    const now = new Date();
    console.log(`\n✅ 测试完成于: ${now.toLocaleString()}`);
    
    return true;
  } catch (error) {
    console.error('❌ 测试执行失败:', error.message);
    console.error('错误堆栈:', error.stack);
    return false;
  }
}

// 执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  testDbConnection().then((success) => {
    process.exit(success ? 0 : 1);
  });
}

export { testDbConnection };