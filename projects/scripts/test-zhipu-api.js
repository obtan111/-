#!/usr/bin/env node

/**
 * 测试智谱AI API密钥
 * 运行方式：node scripts/test-zhipu-api.js
 */

import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({
  path: '.env.local'
});

const ZHIPU_EMBEDDING_API = 'https://open.bigmodel.cn/api/paas/v4/embeddings';
const ZHIPU_API_KEY = process.env.COZE_ZHIPUAI_API_KEY || 'cdee1f738bf5464db0f58910a968c4ec.5oy8UnpZ9PjCDCYo';
const ZHIPU_MODEL = 'embedding-2';

async function testZhipuApi() {
  console.log('开始测试智谱AI API密钥...');
  console.log('API密钥:', ZHIPU_API_KEY);
  console.log('模型:', ZHIPU_MODEL);
  
  try {
    const response = await fetch(ZHIPU_EMBEDDING_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ZHIPU_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: ZHIPU_MODEL,
        input: '测试文本',
      }),
    });

    console.log('\n=== API响应 ===');
    console.log('状态码:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ API调用成功！');
      console.log('响应数据:', JSON.stringify(result, null, 2));
    } else {
      const errorData = await response.json();
      console.log('❌ API调用失败');
      console.log('错误信息:', JSON.stringify(errorData, null, 2));
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 执行测试
testZhipuApi().then(() => {
  process.exit(0);
});