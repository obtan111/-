#!/usr/bin/env node

/**
 * 检查远程数据库表结构
 * 运行方式：node scripts/check-db-structure.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({
  path: '.env.local'
});

async function checkDbStructure() {
  console.log('开始检查远程数据库表结构...');
  
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
    
    // 检查orders表结构
    console.log('\n1. 检查orders表结构:');
    try {
      // 尝试获取orders表的所有列
      const { data: orders, error: ordersError } = await client
        .from('orders')
        .select('*')
        .limit(1);
      
      if (ordersError) {
        console.error('❌ 获取orders表失败:', ordersError.message);
        console.error('错误详情:', ordersError);
      } else {
        console.log('✅ 成功获取orders表');
        if (orders && orders.length > 0) {
          console.log('Orders表字段:', Object.keys(orders[0]));
          if (orders[0].order_type) {
            console.log('✅ order_type字段存在');
            console.log('order_type默认值:', orders[0].order_type);
          } else {
            console.error('❌ order_type字段不存在');
          }
        } else {
          console.log('⚠️ orders表为空，无法检查字段');
        }
      }
    } catch (error) {
      console.error('❌ 检查orders表失败:', error.message);
    }
    
    // 记录执行时间
    const now = new Date();
    console.log(`\n✅ 检查完成于: ${now.toLocaleString()}`);
    
    return true;
  } catch (error) {
    console.error('❌ 执行失败:', error.message);
    console.error('错误堆栈:', error.stack);
    return false;
  }
}

// 执行检查
checkDbStructure().then((success) => {
  process.exit(success ? 0 : 1);
});

export { checkDbStructure };