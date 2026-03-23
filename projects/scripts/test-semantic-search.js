#!/usr/bin/env node

/**
 * 测试语义搜索API
 * 运行方式：node scripts/test-semantic-search.js
 */

async function testSemanticSearch() {
  console.log('开始测试语义搜索API...');
  
  try {
    // 测试搜索"清淡"
    const response = await fetch('http://localhost:5000/api/recommend?type=semantic&query=清淡&limit=12');
    const data = await response.json();
    
    console.log('\n=== 语义搜索测试结果 ===');
    console.log('状态码:', response.status);
    console.log('响应数据:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 执行测试
testSemanticSearch().then(() => {
  process.exit(0);
});