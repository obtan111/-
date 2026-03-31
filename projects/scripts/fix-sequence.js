// 修复数据库序列问题
import { createClient } from '@supabase/supabase-js';

// 读取环境变量
import dotenv from 'dotenv';
dotenv.config();

// Supabase配置
const supabaseUrl = process.env.COZE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('请配置Supabase环境变量');
  process.exit(1);
}

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 修复order_items表的序列
async function fixOrderItemsSequence() {
  try {
    console.log('开始修复order_items表的序列...');
    
    // 获取order_items表中的最大id值
    const { data: maxIdResult, error: maxIdError } = await supabase
      .from('order_items')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .single();
    
    if (maxIdError && maxIdError.code !== 'PGRST116') { // PGRST116表示表为空
      console.error('获取最大id失败:', maxIdError);
      return;
    }
    
    let maxId = 0;
    if (maxIdResult) {
      maxId = maxIdResult.id;
      console.log(`当前order_items表中的最大id值为: ${maxId}`);
    } else {
      console.log('order_items表为空');
    }
    
    // 重置序列，使其从maxId + 1开始
    const { error: sequenceError } = await supabase
      .rpc('reset_sequence', {
        table_name: 'order_items',
        sequence_name: 'order_items_id_seq',
        max_id: maxId
      });
    
    if (sequenceError) {
      console.error('重置序列失败:', sequenceError);
      
      // 如果rpc函数不存在，尝试直接执行SQL
      console.log('尝试直接执行SQL重置序列...');
      try {
        const { error: sqlError } = await supabase
          .rpc('execute_sql', {
            sql: `SELECT setval('order_items_id_seq', ${maxId + 1}, false);`
          });
        
        if (sqlError) {
          console.error('执行SQL失败:', sqlError);
        } else {
          console.log('序列重置成功！');
        }
      } catch (sqlCatchError) {
        console.error('执行SQL时出错:', sqlCatchError);
      }
    } else {
      console.log('序列重置成功！');
    }
    
  } catch (error) {
    console.error('修复序列时出错:', error);
  }
}

// 主函数
async function main() {
  try {
    await fixOrderItemsSequence();
    console.log('修复完成！');
  } catch (error) {
    console.error('执行过程中出错:', error);
  }
}

// 运行主函数
main();
