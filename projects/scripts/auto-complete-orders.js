#!/usr/bin/env node

/**
 * 自动确认收货脚本
 * 运行方式：node scripts/auto-complete-orders.js
 * 
 * 功能：
 * - 检查所有"出餐中"和"待收货"状态的订单
 * - 如果订单出餐超过1小时，自动确认收货
 * - 建议配合Windows任务计划程序定期执行
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({
  path: '.env.local'
});

// 创建Supabase客户端
const client = createClient(
  process.env.COZE_SUPABASE_URL,
  process.env.COZE_SUPABASE_ANON_KEY
);

// 自动确认收货的时间阈值（毫秒）
// 1小时 = 60 * 60 * 1000 = 3600000毫秒
const AUTO_COMPLETE_THRESHOLD = 60 * 60 * 1000;

async function autoCompleteOrders() {
  console.log('开始自动确认收货任务...');
  console.log(`时间阈值: ${AUTO_COMPLETE_THRESHOLD / 1000 / 60} 分钟`);
  
  try {
    const now = new Date();
    
    // 查询所有"出餐中"和"待收货"状态的订单
    const { data: orders, error } = await client
      .from('orders')
      .select('id, order_no, status, updated_at')
      .in('status', ['ready', 'waiting_receive'])
      .eq('merchant_id', 1); // 假设商家ID为1
    
    if (error) {
      console.error('查询订单失败:', error);
      return;
    }
    
    if (!orders || orders.length === 0) {
      console.log('没有需要自动确认收货的订单');
      return;
    }
    
    console.log(`发现 ${orders.length} 个出餐中/待收货订单`);
    
    let completedCount = 0;
    
    for (const order of orders) {
      const updatedAt = new Date(order.updated_at);
      const timeDiff = now.getTime() - updatedAt.getTime();
      
      console.log(`\n订单 ${order.order_no}:`);
      console.log(`  状态: ${order.status}`);
      console.log(`  出餐时间: ${updatedAt.toLocaleString()}`);
      console.log(`  距现在: ${Math.floor(timeDiff / 1000 / 60)} 分钟`);
      
      // 如果超过1小时，自动确认收货
      if (timeDiff >= AUTO_COMPLETE_THRESHOLD) {
        console.log(`  → 自动确认收货`);
        
        const { error: updateError } = await client
          .from('orders')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id);
        
        if (updateError) {
          console.error(`  → 更新失败:`, updateError);
        } else {
          console.log(`  → 已自动确认收货`);
          completedCount++;
        }
      } else {
        console.log(`  → 距自动确认还剩: ${Math.floor((AUTO_COMPLETE_THRESHOLD - timeDiff) / 1000 / 60)} 分钟`);
      }
    }
    
    console.log(`\n=== 任务完成 ===`);
    console.log(`自动确认收货: ${completedCount} 个订单`);
    console.log(`检查订单总数: ${orders.length} 个订单`);
    
  } catch (error) {
    console.error('自动确认收货任务失败:', error);
  }
}

// 执行任务
if (import.meta.url === `file://${process.argv[1]}`) {
  autoCompleteOrders().then(() => {
    process.exit(0);
  });
}

export { autoCompleteOrders };