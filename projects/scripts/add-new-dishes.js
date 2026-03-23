#!/usr/bin/env node

/**
 * 直接添加新菜品
 * 运行方式：node scripts/add-new-dishes.js
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

// 新菜品数据
const NEW_DISHES = [
  // 热菜
  { name: '鱼香茄子', description: '川菜经典，茄子软嫩，鱼香味浓，酸甜可口', price: 26, sales: 128, category_id: CATEGORIES.hot },
  { name: '糖醋排骨', description: '传统名菜，排骨酥脆，酸甜可口，老少皆宜', price: 42, sales: 115, category_id: CATEGORIES.hot },
  { name: '青椒土豆丝', description: '家常小炒，土豆丝爽脆，青椒鲜香，清淡爽口', price: 22, sales: 108, category_id: CATEGORIES.hot },
  { name: '蒜苔炒肉', description: '经典家常菜，蒜苔脆嫩，肉片鲜香，咸香适口', price: 28, sales: 95, category_id: CATEGORIES.hot },
  { name: '可乐鸡翅', description: '甜香可口，鸡翅嫩滑，可乐香气浓郁', price: 32, sales: 102, category_id: CATEGORIES.hot },
  { name: '椒盐排骨', description: '外酥里嫩，椒盐味浓，口感丰富', price: 38, sales: 88, category_id: CATEGORIES.hot },
  { name: '啤酒鸭', description: '鸭肉酥烂，啤酒香气浓郁，口感醇厚', price: 45, sales: 92, category_id: CATEGORIES.hot },
  { name: '小炒黄牛肉', description: '湘菜经典，牛肉嫩滑，辣椒鲜香，下饭神器', price: 36, sales: 110, category_id: CATEGORIES.hot },
  { name: '辣子鸡', description: '川菜经典，鸡肉酥脆，麻辣鲜香，回味无穷', price: 38, sales: 105, category_id: CATEGORIES.hot },
  { name: '洋葱炒蛋', description: '家常小炒，洋葱甜脆，鸡蛋嫩滑，营养丰富', price: 20, sales: 98, category_id: CATEGORIES.hot },
  { name: '胡萝卜炒肉', description: '营养丰富，胡萝卜甜脆，肉片鲜香', price: 24, sales: 85, category_id: CATEGORIES.hot },
  { name: '白萝卜炖排骨', description: '汤清味鲜，排骨软烂，白萝卜清甜', price: 32, sales: 82, category_id: CATEGORIES.hot },
  { name: '梅菜扣肉', description: '粤菜经典，五花肉肥而不腻，梅菜香浓', price: 40, sales: 90, category_id: CATEGORIES.hot },
  { name: '粉蒸肉', description: '传统名菜，肉质软糯，米粉香糯，口感丰富', price: 36, sales: 88, category_id: CATEGORIES.hot },
  { name: '红烧肉丸', description: '传统家常菜，肉丸软糯，汤汁浓郁，甜咸适中', price: 32, sales: 95, category_id: CATEGORIES.hot },
  
  // 凉菜
  { name: '拍黄瓜', description: '清爽开胃，黄瓜脆嫩，蒜香浓郁，酸辣可口', price: 16, sales: 135, category_id: CATEGORIES.cold },
  { name: '凉拌木耳', description: '木耳爽脆，酸辣可口，营养丰富', price: 18, sales: 122, category_id: CATEGORIES.cold },
  { name: '红油耳丝', description: '猪耳爽脆，红油香辣，口感丰富', price: 30, sales: 105, category_id: CATEGORIES.cold },
  { name: '凉拌海带丝', description: '海带丝爽脆，酸辣可口，营养丰富', price: 16, sales: 118, category_id: CATEGORIES.cold },
  { name: '凉拌豆芽', description: '豆芽爽脆，酸辣可口，清爽开胃', price: 14, sales: 125, category_id: CATEGORIES.cold },
  { name: '凉拌土豆丝', description: '土豆丝爽脆，酸辣可口，清爽开胃', price: 16, sales: 112, category_id: CATEGORIES.cold },
  { name: '凉拌莴笋', description: '莴笋爽脆，酸辣可口，清爽开胃', price: 16, sales: 108, category_id: CATEGORIES.cold },
  { name: '凉拌粉丝', description: '粉丝爽滑，酸辣可口，清爽开胃', price: 18, sales: 115, category_id: CATEGORIES.cold },
  { name: '凉拌腐竹', description: '腐竹爽脆，酸辣可口，营养丰富', price: 20, sales: 102, category_id: CATEGORIES.cold },
  { name: '凉拌猪耳朵', description: '猪耳朵爽脆，香辣可口，下酒神器', price: 32, sales: 98, category_id: CATEGORIES.cold },
  
  // 汤品
  { name: '冬瓜排骨汤', description: '汤清味鲜，排骨软烂，冬瓜清甜，营养丰富', price: 30, sales: 115, category_id: CATEGORIES.soup },
  { name: '玉米排骨汤', description: '汤清味鲜，排骨软烂，玉米香甜', price: 32, sales: 122, category_id: CATEGORIES.soup },
  { name: '鱼头豆腐汤', description: '汤白味鲜，鱼头香浓，豆腐嫩滑', price: 38, sales: 105, category_id: CATEGORIES.soup },
  { name: '香菇鸡汤', description: '汤清味鲜，鸡肉嫩滑，香菇香浓', price: 40, sales: 98, category_id: CATEGORIES.soup },
  { name: '萝卜牛肉汤', description: '汤清味鲜，牛肉软烂，萝卜清甜', price: 36, sales: 102, category_id: CATEGORIES.soup },
  { name: '番茄牛肉汤', description: '汤汁浓郁，牛肉嫩滑，番茄酸甜', price: 34, sales: 95, category_id: CATEGORIES.soup },
  { name: '南瓜汤', description: '南瓜香甜，汤汁浓稠，营养丰富', price: 20, sales: 118, category_id: CATEGORIES.soup },
  { name: '银耳莲子汤', description: '银耳软糯，莲子香甜，滋阴润燥', price: 22, sales: 125, category_id: CATEGORIES.soup },
  { name: '百合汤', description: '百合香甜，汤汁清爽，滋阴润燥', price: 20, sales: 108, category_id: CATEGORIES.soup },
  { name: '菠菜汤', description: '汤清味鲜，菠菜鲜嫩，营养丰富', price: 18, sales: 112, category_id: CATEGORIES.soup },
  
  // 主食
  { name: '西红柿鸡蛋面', description: '经典面食，西红柿酸甜，鸡蛋嫩滑，面条劲道', price: 20, sales: 135, category_id: CATEGORIES.主食 },
  { name: '红烧牛肉面', description: '牛肉软烂，汤汁浓郁，面条劲道', price: 28, sales: 128, category_id: CATEGORIES.主食 },
  { name: '炸酱面', description: '传统面食，炸酱香浓，面条劲道', price: 24, sales: 122, category_id: CATEGORIES.主食 },
  { name: '油泼面', description: '陕西特色，辣椒香浓，面条劲道，口感丰富', price: 22, sales: 115, category_id: CATEGORIES.主食 },
  { name: '刀削面', description: '山西特色，面条劲道，口感丰富', price: 24, sales: 108, category_id: CATEGORIES.主食 },
  { name: '兰州拉面', description: '传统名吃，面条劲道，汤汁浓郁', price: 26, sales: 112, category_id: CATEGORIES.主食 },
  { name: '重庆小面', description: '麻辣鲜香，面条劲道，口感丰富', price: 24, sales: 118, category_id: CATEGORIES.主食 },
  { name: '担担面', description: '川菜经典，麻辣鲜香，面条劲道', price: 22, sales: 105, category_id: CATEGORIES.主食 },
  { name: '烩面', description: '河南特色，面条劲道，汤汁浓郁', price: 26, sales: 98, category_id: CATEGORIES.主食 },
  { name: '米线', description: '云南特色，米线爽滑，汤汁浓郁', price: 22, sales: 102, category_id: CATEGORIES.主食 },
  
  // 小吃
  { name: '炸鸡翅', description: '外酥里嫩，鸡肉鲜香，口感丰富', price: 18, sales: 135, category_id: CATEGORIES.snack },
  { name: '炸鸡腿', description: '外酥里嫩，鸡腿多汁，口感丰富', price: 20, sales: 128, category_id: CATEGORIES.snack },
  { name: '炸鸡米花', description: '外酥里嫩，鸡肉鲜香，口感丰富', price: 16, sales: 122, category_id: CATEGORIES.snack },
  { name: '薯条', description: '外酥里嫩，土豆香糯，口感丰富', price: 14, sales: 118, category_id: CATEGORIES.snack },
  { name: '洋葱圈', description: '外酥里嫩，洋葱甜脆，口感丰富', price: 16, sales: 112, category_id: CATEGORIES.snack },
  { name: '春卷', description: '传统小吃，外皮酥脆，内馅丰富', price: 12, sales: 105, category_id: CATEGORIES.snack },
  { name: '煎饺', description: '底部酥脆，内馅鲜美，口感丰富', price: 15, sales: 108, category_id: CATEGORIES.snack },
  { name: '小笼包', description: '传统名吃，皮薄馅大，汤汁鲜美', price: 18, sales: 115, category_id: CATEGORIES.snack },
  { name: '烧麦', description: '传统小吃，皮薄馅大，口感丰富', price: 16, sales: 98, category_id: CATEGORIES.snack },
  { name: '锅贴', description: '底部酥脆，内馅鲜美，口感丰富', price: 15, sales: 102, category_id: CATEGORIES.snack },
  
  // 甜品
  { name: '提拉米苏', description: '经典意式甜点，口感层次丰富，咖啡香气浓郁', price: 32, sales: 95, category_id: CATEGORIES.dessert },
  { name: '巧克力蛋糕', description: '巧克力香浓，口感绵密，甜而不腻', price: 28, sales: 102, category_id: CATEGORIES.dessert },
  { name: '草莓蛋糕', description: '草莓香甜，蛋糕松软，口感丰富', price: 30, sales: 108, category_id: CATEGORIES.dessert },
  { name: '芒果蛋糕', description: '芒果香甜，蛋糕松软，口感丰富', price: 32, sales: 112, category_id: CATEGORIES.dessert },
  { name: '芝士蛋糕', description: '芝士香浓，口感绵密，甜而不腻', price: 34, sales: 98, category_id: CATEGORIES.dessert },
  { name: '冰淇淋', description: '口感细腻，口味丰富，清凉解暑', price: 18, sales: 125, category_id: CATEGORIES.dessert },
  { name: '布丁', description: '口感嫩滑，口味丰富，甜而不腻', price: 15, sales: 115, category_id: CATEGORIES.dessert },
  { name: '果冻', description: '口感Q弹，口味丰富，清凉解暑', price: 10, sales: 118, category_id: CATEGORIES.dessert },
  { name: '奶昔', description: '口感细腻，口味丰富，营养丰富', price: 18, sales: 105, category_id: CATEGORIES.dessert },
  { name: '双皮奶', description: '传统甜点，口感嫩滑，奶香浓郁', price: 16, sales: 112, category_id: CATEGORIES.dessert },
  
  // 饮料
  { name: '雪碧', description: '柠檬味碳酸饮料，口感清爽，气泡丰富', price: 8, sales: 158, category_id: CATEGORIES.drink },
  { name: '芬达', description: '橙味碳酸饮料，口感清爽，气泡丰富', price: 8, sales: 145, category_id: CATEGORIES.drink },
  { name: '美年达', description: '果味碳酸饮料，口感清爽，气泡丰富', price: 8, sales: 132, category_id: CATEGORIES.drink },
  { name: '冰红茶', description: '红茶香气浓郁，口感清爽', price: 10, sales: 128, category_id: CATEGORIES.drink },
  { name: '绿茶', description: '绿茶香气浓郁，口感清爽', price: 10, sales: 122, category_id: CATEGORIES.drink },
  { name: '茉莉花茶', description: '茉莉花香气浓郁，口感清爽', price: 10, sales: 115, category_id: CATEGORIES.drink },
  { name: '蜂蜜柚子茶', description: '蜂蜜香甜，柚子清香，口感丰富', price: 12, sales: 118, category_id: CATEGORIES.drink },
  { name: '柠檬茶', description: '柠檬清香，口感清爽', price: 12, sales: 125, category_id: CATEGORIES.drink },
  { name: '奶茶', description: '奶香浓郁，茶香清新，口感丰富', price: 15, sales: 135, category_id: CATEGORIES.drink },
  { name: '咖啡', description: '咖啡香气浓郁，口感醇厚', price: 18, sales: 108, category_id: CATEGORIES.drink },
  
  // 水果
  { name: '苹果', description: '新鲜苹果，口感脆甜，营养丰富', price: 6, sales: 138, category_id: CATEGORIES.fruit },
  { name: '香蕉', description: '新鲜香蕉，口感软糯，香甜可口', price: 5, sales: 145, category_id: CATEGORIES.fruit },
  { name: '橙子', description: '新鲜橙子，口感酸甜，富含维生素C', price: 6, sales: 132, category_id: CATEGORIES.fruit },
  { name: '草莓', description: '新鲜草莓，口感鲜甜，香气浓郁', price: 12, sales: 125, category_id: CATEGORIES.fruit },
  { name: '蓝莓', description: '新鲜蓝莓，口感酸甜，富含花青素', price: 25, sales: 98, category_id: CATEGORIES.fruit },
  { name: '葡萄', description: '新鲜葡萄，口感鲜甜，汁水丰富', price: 8, sales: 122, category_id: CATEGORIES.fruit },
  { name: '西瓜', description: '新鲜西瓜，口感清甜，消暑解渴', price: 3, sales: 158, category_id: CATEGORIES.fruit },
  { name: '哈密瓜', description: '新鲜哈密瓜，口感香甜，香气浓郁', price: 4, sales: 142, category_id: CATEGORIES.fruit },
  { name: '菠萝', description: '新鲜菠萝，口感酸甜，香气浓郁', price: 5, sales: 135, category_id: CATEGORIES.fruit },
  { name: '猕猴桃', description: '新鲜猕猴桃，口感酸甜，富含维生素C', price: 8, sales: 118, category_id: CATEGORIES.fruit }
];

async function addNewDishes() {
  console.log('开始添加新菜品...');
  console.log(`准备添加 ${NEW_DISHES.length} 道新菜品`);
  
  try {
    // 分批插入，每批10条
    const batchSize = 10;
    let successCount = 0;
    
    for (let i = 0; i < NEW_DISHES.length; i += batchSize) {
      const batch = NEW_DISHES.slice(i, i + batchSize);
      
      console.log(`\n插入第 ${Math.floor(i / batchSize) + 1} 批菜品...`);
      
      const { error } = await client
        .from('dishes')
        .insert(batch.map(dish => ({
          merchant_id: 1,
          category_id: dish.category_id,
          name: dish.name,
          description: dish.description,
          price: dish.price,
          stock: Math.floor(Math.random() * 100) + 50,
          sales: dish.sales,
          rating: 0,
          review_count: 0,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })));
      
      if (error) {
        console.error('插入菜品失败:', error);
      } else {
        successCount += batch.length;
        console.log(`成功插入 ${successCount} 道菜品`);
      }
      
      // 避免API限流
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n=== 菜品添加完成 ===`);
    console.log(`成功添加: ${successCount} 道新菜品`);
    console.log(`总计划添加: ${NEW_DISHES.length} 道新菜品`);
    
  } catch (error) {
    console.error('添加菜品失败:', error);
  }
}

// 执行添加
addNewDishes().then(() => {
  process.exit(0);
});