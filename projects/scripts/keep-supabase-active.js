#!/usr/bin/env node

/**
 * 定时任务：每天自动请求数据库以保持Supabase活跃度
 * 运行方式：node scripts/keep-supabase-active.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({
  path: '.env.local'
});

async function keepSupabaseActive() {
  console.log('开始执行保持Supabase活跃度的定时任务...');
  
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
    
    // 执行一个简单的查询来保持数据库活跃
    // 这里查询orders表的第一条记录，使用limit(1)确保查询快速且轻量
    const { data, error, status } = await client
      .from('orders')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ 查询执行失败:', error.message);
      console.error('状态码:', status);
      return false;
    }
    
    console.log('✅ 数据库查询执行成功');
    console.log('查询结果:', data);
    
    // 记录执行时间
    const now = new Date();
    console.log(`✅ 任务执行完成于: ${now.toLocaleString()}`);
    
    return true;
  } catch (error) {
    console.error('❌ 任务执行失败:', error.message);
    return false;
  }
}

// 执行任务
if (import.meta.url === `file://${process.argv[1]}`) {
  keepSupabaseActive().then((success) => {
    process.exit(success ? 0 : 1);
  });
}

export { keepSupabaseActive };