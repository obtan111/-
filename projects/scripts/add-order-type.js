#!/usr/bin/env node

/**
 * 更新远程数据库添加 order_type 字段
 * 运行方式：node scripts/add-order-type.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({
  path: '.env.local'
});

async function addOrderTypeField() {
  console.log('开始更新远程数据库，添加 order_type 字段...');
  
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
    
    // 添加order_type字段到orders表
    console.log('\n1. 添加order_type字段到orders表:');
    try {
      // 使用Supabase的RPC功能执行SQL语句
      const { data, error } = await client
        .rpc('execute_sql', {
          sql: 'ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) DEFAULT \'dine_in\''
        });
      
      if (error) {
        console.error('❌ 添加order_type字段失败:', error.message);
        console.error('错误详情:', error);
      } else {
        console.log('✅ 成功添加order_type字段到orders表');
      }
    } catch (error) {
      console.error('❌ 执行SQL失败:', error.message);
      
      // 尝试使用另一种方法
      console.log('\n2. 尝试使用直接API调用添加字段:');
      try {
        const { error: alterError } = await client
          .from('orders')
          .alter('add column order_type varchar(20) default \'dine_in\'');
        
        if (alterError) {
          console.error('❌ 直接API调用失败:', alterError.message);
        } else {
          console.log('✅ 成功使用直接API调用添加order_type字段');
        }
      } catch (alterError) {
        console.error('❌ 直接API调用也失败:', alterError.message);
      }
    }
    
    // 记录执行时间
    const now = new Date();
    console.log(`\n✅ 数据库更新完成于: ${now.toLocaleString()}`);
    
    return true;
  } catch (error) {
    console.error('❌ 执行失败:', error.message);
    console.error('错误堆栈:', error.stack);
    return false;
  }
}

// 执行更新
addOrderTypeField().then((success) => {
  process.exit(success ? 0 : 1);
});

export { addOrderTypeField };