#!/usr/bin/env node

/**
 * 检查菜品数据脚本
 * 运行方式：node scripts/check-dishes.js
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

async function checkDishes() {
  console.log('开始检查菜品数据...');
  
  try {
    // 查询菜品总数
    console.log('正在查询菜品数据...');
    const { data: dishes, error } = await client
      .from('dishes')
      .select('id, name, category_id, price, sales')
      .limit(50);
    
    if (error) {
      console.error('查询菜品失败:', error);
      return;
    }
    
    console.log(`\n=== 菜品数据检查结果 ===`);
    console.log(`总菜品数: ${dishes.length} 道`);
    
    // 按分类统计
    const categoryStats = {};
    dishes.forEach(dish => {
      if (!categoryStats[dish.category_id]) {
        categoryStats[dish.category_id] = 0;
      }
      categoryStats[dish.category_id]++;
    });
    
    console.log('\n各分类菜品数量:');
    for (const [categoryId, count] of Object.entries(categoryStats)) {
      console.log(`分类 ${categoryId}: ${count} 道`);
    }
    
    // 显示前10道菜品
    console.log('\n前10道菜品:');
    dishes.slice(0, 10).forEach((dish, index) => {
      console.log(`${index + 1}. ${dish.name} - ¥${dish.price} - 销量: ${dish.sales}`);
    });
    
  } catch (error) {
    console.error('检查失败:', error);
  }
}

// 执行检查
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('脚本开始执行...');
  checkDishes().then(() => {
    console.log('脚本执行完成');
    process.exit(0);
  }).catch((error) => {
    console.error('脚本执行出错:', error);
    process.exit(1);
  });
}