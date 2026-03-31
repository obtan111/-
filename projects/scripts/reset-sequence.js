// 重置order_items表的序列
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Supabase配置
const supabaseUrl = process.env.COZE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.COZE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('请配置Supabase环境变量');
  process.exit(1);
}

// 创建Supabase客户端（使用服务密钥）
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 重置order_items表的序列
async function resetOrderItemsSequence() {
  try {
    console.log('开始重置order_items表的序列...');
    
    // 执行SQL查询来重置序列
    const { data, error } = await supabase
      .rpc('execute_sql', {
        sql: `
          -- 获取order_items表中的最大id值
          SELECT COALESCE(MAX(id), 0) as max_id FROM order_items;
        `
      });
    
    if (error) {
      console.error('获取最大id失败:', error);
      return;
    }
    
    const maxId = data?.max_id || 0;
    console.log(`当前order_items表中的最大id值为: ${maxId}`);
    
    // 重置序列
    const { error: sequenceError } = await supabase
      .rpc('execute_sql', {
        sql: `SELECT setval('order_items_id_seq', ${maxId + 1}, false);`
      });
    
    if (sequenceError) {
      console.error('重置序列失败:', sequenceError);
      return;
    }
    
    console.log('序列重置成功！');
    console.log(`序列现在从 ${maxId + 1} 开始`);
    
  } catch (error) {
    console.error('重置序列时出错:', error);
  }
}

// 主函数
async function main() {
  try {
    await resetOrderItemsSequence();
    console.log('操作完成！');
  } catch (error) {
    console.error('执行过程中出错:', error);
  }
}

// 运行主函数
main();
