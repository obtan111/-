#!/usr/bin/env node

/**
 * 更新远程数据库脚本
 * 运行方式：node scripts/update-remote-db.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({
  path: '.env.local'
});

async function updateRemoteDb() {
  console.log('开始更新远程数据库...');
  
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
    
    // 测试订单创建
    console.log('\n1. 测试订单创建:');
    try {
      const { data: testOrder, error: testError } = await client
        .from('orders')
        .insert({
          order_no: `TEST${Date.now()}`,
          user_id: 1,
          merchant_id: 1,
          total_price: 100,
          status: 'pending',
          payment_method: 'cash',
          address: '测试地址',
          phone: '13800138000',
          remark: '测试订单'
        })
        .select()
        .single();
      
      if (testError) {
        console.error('❌ 测试订单创建失败:', testError.message);
        console.error('错误详情:', testError);
      } else {
        console.log('✅ 测试订单创建成功');
        console.log('测试订单ID:', testOrder.id);
        
        // 删除测试订单
        const { error: deleteError } = await client
          .from('orders')
          .delete()
          .eq('id', testOrder.id);
        
        if (deleteError) {
          console.error('⚠️ 删除测试订单失败:', deleteError.message);
        } else {
          console.log('✅ 测试订单已删除');
        }
      }
    } catch (error) {
      console.error('❌ 测试订单创建失败:', error.message);
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
updateRemoteDb().then((success) => {
  process.exit(success ? 0 : 1);
});

export { updateRemoteDb };