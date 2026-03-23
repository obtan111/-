#!/usr/bin/env node

/**
 * 触发向量嵌入生成
 * 运行方式：node scripts/trigger-embeddings.js
 */

async function triggerEmbeddings() {
  console.log('开始触发向量嵌入生成...');
  
  try {
    const response = await fetch('http://localhost:5000/api/recommend?type=init_embeddings');
    const data = await response.json();
    
    console.log('\n=== 向量嵌入生成结果 ===');
    console.log('状态码:', response.status);
    console.log('成功:', data.message);
    
    if (data.data) {
      const successCount = data.data.filter(d => d.success).length;
      const skippedCount = data.data.filter(d => d.skipped).length;
      const failedCount = data.data.filter(d => d.error).length;
      
      console.log(`\n统计信息:`);
      console.log(`成功: ${successCount} 道`);
      console.log(`跳过: ${skippedCount} 道`);
      console.log(`失败: ${failedCount} 道`);
      console.log(`总计: ${data.data.length} 道`);
    }
    
  } catch (error) {
    console.error('触发失败:', error);
  }
}

// 执行触发
triggerEmbeddings().then(() => {
  process.exit(0);
});