#!/usr/bin/env node

/**
 * 初始化数据脚本
 * 运行方式：node scripts/init-data.js
 */

import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function initData() {
  console.log('开始初始化数据...');
  
  try {
    const response = await fetch('http://localhost:5000/api/init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    console.log('初始化结果:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('初始化失败:', error.message);
  }
}

initData();
