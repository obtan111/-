#!/usr/bin/env node

/**
 * 菜品数据生成脚本
 * 运行方式：node scripts/generate-dishes.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({
  path: '.env.local'
});

// 创建Supabase客户端
const getSupabaseClient = () => {
  return createClient(
    process.env.COZE_SUPABASE_URL,
    process.env.COZE_SUPABASE_ANON_KEY
  );
};

// 分类ID映射
const CATEGORIES = {
  hot: 1,        // 热菜
  cold: 2,       // 凉菜
  soup: 3,       // 汤品
 主食: 4,       // 主食
  snack: 5,      // 小吃
  dessert: 6,    // 甜品
  drink: 7,      // 饮料
  fruit: 8       // 水果
};

// 菜品数据 - 按分类组织
const DISHES_DATA = {
  [CATEGORIES.hot]: [
    { name: '麻婆豆腐', description: '经典川菜，麻辣鲜香，豆腐嫩滑，口感丰富', price: 28, sales: 156 },
    { name: '宫保鸡丁', description: '传统名菜，鸡肉嫩滑，花生香脆，酸甜微辣', price: 32, sales: 132 },
    { name: '鱼香肉丝', description: '川菜经典，肉丝细嫩，笋丝爽口，鱼香味浓', price: 26, sales: 145 },
    { name: '红烧肉', description: '传统鲁菜，肥瘦相间，入口即化，甜咸适中', price: 38, sales: 128 },
    { name: '糖醋里脊', description: '酸甜可口，外酥里嫩，肉质鲜美', price: 35, sales: 118 },
    { name: '青椒肉丝', description: '家常小炒，青椒爽脆，肉丝鲜嫩，咸香适口', price: 24, sales: 105 },
    { name: '回锅肉', description: '川菜经典，五花肉肥而不腻，搭配蒜苗香辣可口', price: 30, sales: 98 },
    { name: '水煮肉片', description: '麻辣鲜香，肉片嫩滑，配菜丰富，汤汁浓郁', price: 36, sales: 89 },
    { name: '梅菜扣肉', description: '粤菜经典，五花肉软烂，梅菜香浓，肥而不腻', price: 42, sales: 82 },
    { name: '可乐鸡翅', description: '甜香可口，鸡肉嫩滑，可乐香气浓郁', price: 32, sales: 95 }
  ],
  [CATEGORIES.cold]: [
    { name: '凉拌黄瓜', description: '清爽开胃，黄瓜脆嫩，蒜香浓郁，酸辣可口', price: 18, sales: 168 },
    { name: '口水鸡', description: '川菜经典，鸡肉嫩滑，麻辣鲜香，回味无穷', price: 38, sales: 142 },
    { name: '夫妻肺片', description: '传统名菜，牛肺、牛肚等食材，麻辣鲜香', price: 45, sales: 125 },
    { name: '皮蛋豆腐', description: '豆腐嫩滑，皮蛋香浓，蒜醋调味，清爽可口', price: 22, sales: 138 },
    { name: '红油耳丝', description: '猪耳爽脆，红油香辣，口感丰富', price: 32, sales: 115 },
    { name: '拍黄瓜', description: '简单清爽，黄瓜脆嫩，蒜香浓郁', price: 16, sales: 152 },
    { name: '卤味拼盘', description: '多种卤味组合，香气浓郁，口感丰富', price: 48, sales: 98 },
    { name: '凉拌木耳', description: '木耳爽脆，酸辣可口，营养丰富', price: 20, sales: 128 },
    { name: '糖拌西红柿', description: '经典甜品，西红柿酸甜，白糖提味', price: 15, sales: 145 },
    { name: '酸辣土豆丝', description: '爽脆可口，酸辣开胃，家常必备', price: 18, sales: 132 }
  ],
  [CATEGORIES.soup]: [
    { name: '紫菜蛋花汤', description: '清爽鲜美，营养丰富，蛋花均匀，紫菜香浓', price: 15, sales: 178 },
    { name: '番茄蛋汤', description: '酸甜开胃，番茄香浓，蛋花嫩滑', price: 18, sales: 165 },
    { name: '酸辣汤', description: '酸辣开胃，食材丰富，暖胃暖心', price: 22, sales: 152 },
    { name: '玉米排骨汤', description: '汤清味鲜，排骨软烂，玉米香甜', price: 35, sales: 138 },
    { name: '冬瓜排骨汤', description: '清淡鲜美，冬瓜祛湿，排骨营养', price: 32, sales: 125 },
    { name: '鱼头豆腐汤', description: '鱼头香浓，豆腐嫩滑，汤白味鲜', price: 38, sales: 118 },
    { name: '香菇鸡汤', description: '香菇香浓，鸡肉鲜嫩，汤清味美', price: 42, sales: 105 },
    { name: '银耳莲子汤', description: '滋阴润燥，银耳软糯，莲子香甜', price: 25, sales: 142 },
    { name: '萝卜牛肉汤', description: '牛肉软烂，萝卜清甜，汤味浓郁', price: 36, sales: 98 },
    { name: '海带汤', description: '清爽可口，海带鲜嫩，营养丰富', price: 18, sales: 135 }
  ],
  [CATEGORIES.主食]: [
    { name: '蛋炒饭', description: '颗粒分明，蛋香浓郁，米饭松软', price: 15, sales: 168 },
    { name: '扬州炒饭', description: '传统名吃，配料丰富，米饭粒粒分明', price: 22, sales: 145 },
    { name: '西红柿鸡蛋面', description: '经典面食，汤汁浓郁，面条劲道', price: 20, sales: 152 },
    { name: '红烧牛肉面', description: '牛肉软烂，汤汁香浓，面条劲道', price: 28, sales: 138 },
    { name: '炸酱面', description: '传统面食，炸酱香浓，面条劲道', price: 24, sales: 125 },
    { name: '盖浇饭', description: '米饭松软，配菜丰富，酱汁浓郁', price: 26, sales: 142 },
    { name: '包子', description: '传统面食，皮薄馅大，口感松软', price: 12, sales: 158 },
    { name: '馒头', description: '传统面食，松软可口，麦香浓郁', price: 3, sales: 172 },
    { name: '花卷', description: '传统面食，层次分明，口感松软', price: 4, sales: 165 },
    { name: '饺子', description: '传统美食，皮薄馅大，口感鲜美', price: 25, sales: 132 }
  ],
  [CATEGORIES.snack]: [
    { name: '炸薯条', description: '外酥里嫩，口感香脆，搭配番茄酱更佳', price: 18, sales: 145 },
    { name: '炸鸡排', description: '外酥里嫩，肉质鲜美，香气扑鼻', price: 22, sales: 138 },
    { name: '春卷', description: '传统小吃，外皮酥脆，内馅丰富', price: 16, sales: 125 },
    { name: '煎饺', description: '底部酥脆，内馅鲜美，口感丰富', price: 18, sales: 142 },
    { name: '小笼包', description: '传统名吃，皮薄馅大，汤汁鲜美', price: 20, sales: 135 },
    { name: '手抓饼', description: '层次分明，口感酥脆，可加各种配料', price: 15, sales: 152 },
    { name: '油条', description: '传统早点，外酥里软，口感蓬松', price: 4, sales: 168 },
    { name: '麻团', description: '传统小吃，外酥内软，芝麻香浓', price: 5, sales: 145 },
    { name: '爆米花', description: '香甜可口，口感酥脆，观影必备', price: 12, sales: 132 },
    { name: '烤肠', description: '香气扑鼻，肉质鲜美，口感丰富', price: 8, sales: 158 }
  ],
  [CATEGORIES.dessert]: [
    { name: '提拉米苏', description: '经典意式甜点，口感层次丰富，咖啡香气浓郁', price: 32, sales: 128 },
    { name: '芒果布丁', description: '芒果香浓，口感嫩滑，甜而不腻', price: 22, sales: 135 },
    { name: '巧克力蛋糕', description: '巧克力香浓，口感绵密，甜而不腻', price: 28, sales: 122 },
    { name: '冰淇淋', description: '口感细腻，口味丰富，清凉解暑', price: 18, sales: 145 },
    { name: '双皮奶', description: '传统甜点，口感嫩滑，奶香浓郁', price: 16, sales: 138 },
    { name: '红豆沙', description: '传统甜品，红豆绵密，口感香甜', price: 15, sales: 125 },
    { name: '绿豆汤', description: '清凉解暑，绿豆软糯，口感清甜', price: 12, sales: 142 },
    { name: '银耳羹', description: '滋阴润燥，银耳软糯，口感清甜', price: 18, sales: 118 },
    { name: '果冻', description: '口感Q弹，口味丰富，清凉解暑', price: 10, sales: 132 },
    { name: '布丁', description: '口感嫩滑，口味丰富，甜而不腻', price: 15, sales: 128 }
  ],
  [CATEGORIES.drink]: [
    { name: '可乐', description: '经典碳酸饮料，口感清爽，气泡丰富', price: 8, sales: 168 },
    { name: '雪碧', description: '柠檬味碳酸饮料，口感清爽，气泡丰富', price: 8, sales: 152 },
    { name: '橙汁', description: '新鲜橙汁，口感酸甜，营养丰富', price: 12, sales: 145 },
    { name: '苹果汁', description: '新鲜苹果汁，口感清甜，营养丰富', price: 12, sales: 138 },
    { name: '奶茶', description: '香浓奶茶，口感丝滑，口味丰富', price: 15, sales: 158 },
    { name: '咖啡', description: '香浓咖啡，口感醇厚，提神醒脑', price: 18, sales: 132 },
    { name: '绿茶', description: '清香绿茶，口感清爽，提神醒脑', price: 10, sales: 125 },
    { name: '红茶', description: '香浓红茶，口感醇厚，温暖身心', price: 10, sales: 118 },
    { name: '酸奶', description: '口感酸甜，营养丰富，有助于消化', price: 12, sales: 142 },
    { name: '矿泉水', description: '纯净矿泉水，口感清爽，补充水分', price: 5, sales: 165 }
  ],
  [CATEGORIES.fruit]: [
    { name: '苹果', description: '新鲜苹果，口感脆甜，营养丰富', price: 6, sales: 138 },
    { name: '香蕉', description: '新鲜香蕉，口感软糯，香甜可口', price: 5, sales: 145 },
    { name: '橙子', description: '新鲜橙子，口感酸甜，富含维生素C', price: 6, sales: 132 },
    { name: '草莓', description: '新鲜草莓，口感鲜甜，香气浓郁', price: 12, sales: 125 },
    { name: '蓝莓', description: '新鲜蓝莓，口感酸甜，富含花青素', price: 25, sales: 98 },
    { name: '葡萄', description: '新鲜葡萄，口感鲜甜，汁水丰富', price: 8, sales: 122 },
    { name: '西瓜', description: '新鲜西瓜，口感清甜，消暑解渴', price: 3, sales: 158 },
    { name: '哈密瓜', description: '新鲜哈密瓜，口感香甜，香气浓郁', price: 4, sales: 142 },
    { name: '菠萝', description: '新鲜菠萝，口感酸甜，香气浓郁', price: 5, sales: 135 },
    { name: '猕猴桃', description: '新鲜猕猴桃，口感酸甜，富含维生素C', price: 8, sales: 118 }
  ]
};

async function generateDishes() {
  console.log('开始生成菜品数据...');
  
  const client = getSupabaseClient();
  
  try {
    // 先检查是否已有菜品数据
    const { data: existingDishes, error: checkError } = await client
      .from('dishes')
      .select('id')
      .limit(1);
    
    if (checkError) {
      console.error('检查菜品数据失败:', checkError);
      return;
    }
    
    if (existingDishes && existingDishes.length > 0) {
      console.log('数据库中已存在菜品数据，跳过生成');
      return;
    }
    
    // 批量插入菜品数据
    const allDishes = [];
    
    for (const [categoryId, dishes] of Object.entries(DISHES_DATA)) {
      for (const dish of dishes) {
        allDishes.push({
          name: dish.name,
          description: dish.description,
          price: dish.price,
          sales: dish.sales,
          category_id: parseInt(categoryId),
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }
    
    console.log(`准备插入 ${allDishes.length} 道菜品...`);
    
    // 分批插入，每批10条
    const batchSize = 10;
    let successCount = 0;
    
    for (let i = 0; i < allDishes.length; i += batchSize) {
      const batch = allDishes.slice(i, i + batchSize);
      
      const { error } = await client
        .from('dishes')
        .insert(batch);
      
      if (error) {
        console.error('插入菜品失败:', error);
      } else {
        successCount += batch.length;
        console.log(`已插入 ${successCount} 道菜品`);
      }
      
      // 避免API限流
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n=== 菜品数据生成完成 ===`);
    console.log(`成功插入: ${successCount} 道菜品`);
    console.log(`总菜品数: ${allDishes.length} 道`);
    
  } catch (error) {
    console.error('生成菜品数据失败:', error);
  }
}

// 执行生成
if (import.meta.url === `file://${process.argv[1]}`) {
  generateDishes().then(() => {
    process.exit(0);
  });
}

export { generateDishes };