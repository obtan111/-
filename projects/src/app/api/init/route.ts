import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { hashPassword } from '@/lib/auth/auth';

// 初始化示例数据
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();

    // 1. 创建分类
    const categories = [
      { name: '热菜', icon: '🔥', sort_order: 1 },
      { name: '凉菜', icon: '🥗', sort_order: 2 },
      { name: '汤品', icon: '🍲', sort_order: 3 },
      { name: '主食', icon: '🍚', sort_order: 4 },
      { name: '小吃', icon: '🥟', sort_order: 5 },
      { name: '甜品', icon: '🍰', sort_order: 6 },
      { name: '饮料', icon: '🥤', sort_order: 7 },
      { name: '水果', icon: '🍎', sort_order: 8 },
    ];

    const { data: insertedCategories, error: catError } = await client
      .from('categories')
      .upsert(categories, { onConflict: 'name' })
      .select();

    if (catError) {
      console.error('创建分类失败:', catError);
    }

    // 2. 创建测试商家
    const hashedPassword = await hashPassword('123456');
    
    // 检查商家是否已存在
    const { data: existingMerchant } = await client
      .from('merchants')
      .select('*')
      .eq('username', 'demo_merchant')
      .single();

    let merchant = existingMerchant;
    
    if (!existingMerchant) {
      const { data: newMerchant, error: merchantError } = await client
        .from('merchants')
        .insert({
          username: 'demo_merchant',
          email: 'merchant@example.com',
          password: hashedPassword,
          shop_name: '美味餐厅',
          phone: '13800138000',
          description: '这是一家提供各种美食的餐厅',
          address: '北京市朝阳区xxx路xxx号',
          is_active: true,
        })
        .select()
        .single();

      if (merchantError) {
        console.error('创建商家失败:', merchantError);
      } else {
        merchant = newMerchant;
      }
    }

    // 3. 创建测试用户
    const { data: existingUser } = await client
      .from('users')
      .select('*')
      .eq('username', 'demo_user')
      .single();

    if (!existingUser) {
      const { error: userError } = await client
        .from('users')
        .insert({
          username: 'demo_user',
          email: 'user@example.com',
          password: hashedPassword,
          phone: '13900139000',
          is_active: true,
        });

      if (userError) {
        console.error('创建用户失败:', userError);
      }
    }

    // 4. 创建丰富的示例菜品
    if (merchant && insertedCategories && insertedCategories.length > 0) {
      const categoryMap = new Map(insertedCategories.map(c => [c.name, c.id]));
      
      const dishes = [
        // 热菜
        {
          merchant_id: merchant.id,
          category_id: categoryMap.get('热菜'),
          name: '宫保鸡丁',
          description: '经典川菜，鸡肉嫩滑，花生香脆，微辣开胃',
          price: '38.00',
          stock: 100,
          sales: 258,
        },
        {
          merchant_id: merchant.id,
          category_id: categoryMap.get('热菜'),
          name: '水煮鱼',
          description: '鲜嫩鱼片，麻辣鲜香，回味无穷',
          price: '68.00',
          stock: 50,
          sales: 186,
        },
        {
          merchant_id: merchant.id,
          category_id: categoryMap.get('热菜'),
          name: '麻婆豆腐',
          description: '麻辣鲜香，豆腐嫩滑，下饭必备',
          price: '28.00',
          stock: 80,
          sales: 320,
        },
        {
          merchant_id: merchant.id,
          category_id: categoryMap.get('热菜'),
          name: '红烧肉',
          description: '肥而不腻，入口即化，传统美味',
          price: '48.00',
          stock: 40,
          sales: 156,
        },
        {
          merchant_id: merchant.id,
          category_id: categoryMap.get('热菜'),
          name: '糖醋里脊',
          description: '外酥里嫩，酸甜可口，老少皆宜',
          price: '42.00',
          stock: 60,
          sales: 198,
        },
        {
          merchant_id: merchant.id,
          category_id: categoryMap.get('热菜'),
          name: '干锅花菜',
          description: '香辣爽脆，下饭神器',
          price: '26.00',
          stock: 70,
          sales: 245,
        },
        // 凉菜
        {
          merchant_id: merchant.id,
          category_id: categoryMap.get('凉菜'),
          name: '凉拌黄瓜',
          description: '清脆爽口，蒜香浓郁',
          price: '18.00',
          stock: 200,
          sales: 320,
        },
        {
          merchant_id: merchant.id,
          category_id: categoryMap.get('凉菜'),
          name: '皮蛋豆腐',
          description: '滑嫩爽口，开胃解腻',
          price: '22.00',
          stock: 100,
          sales: 180,
        },
        {
          merchant_id: merchant.id,
          category_id: categoryMap.get('凉菜'),
          name: '夫妻肺片',
          description: '麻辣鲜香，口感劲道',
          price: '35.00',
          stock: 50,
          sales: 145,
        },
        {
          merchant_id: merchant.id,
          category_id: categoryMap.get('凉菜'),
          name: '口水鸡',
          description: '麻辣鲜香，鸡肉嫩滑',
          price: '38.00',
          stock: 45,
          sales: 167,
        },
        // 汤品
        {
          merchant_id: merchant.id,
          category_id: categoryMap.get('汤品'),
          name: '番茄蛋汤',
          description: '酸甜开胃，营养丰富',
          price: '18.00',
          stock: 150,
          sales: 280,
        },
        {
          merchant_id: merchant.id,
          category_id: categoryMap.get('汤品'),
          name: '紫菜蛋花汤',
          description: '清淡鲜美，家常美味',
          price: '15.00',
          stock: 180,
          sales: 310,
        },
        {
          merchant_id: merchant.id,
          category_id: categoryMap.get('汤品'),
          name: '酸辣汤',
          description: '酸辣开胃，暖胃首选',
          price: '22.00',
          stock: 80,
          sales: 195,
        },
        // 主食
        {
          merchant_id: merchant.id,
          category_id: categoryMap.get('主食'),
          name: '扬州炒饭',
          description: '粒粒分明，蛋香四溢',
          price: '28.00',
          stock: 150,
          sales: 456,
        },
        {
          merchant_id: merchant.id,
          category_id: categoryMap.get('主食'),
          name: '葱油拌面',
          description: '葱香浓郁，面条劲道',
          price: '18.00',
          stock: 120,
          sales: 389,
        },
        {
          merchant_id: merchant.id,
          category_id: categoryMap.get('主食'),
          name: '蛋炒饭',
          description: '简单美味，家常味道',
          price: '15.00',
          stock: 200,
          sales: 520,
        },
        {
          merchant_id: merchant.id,
          category_id: categoryMap.get('主食'),
          name: '酸辣粉',
          description: '酸辣开胃，红薯粉劲道',
          price: '22.00',
          stock: 100,
          sales: 278,
        },
        // 小吃
        {
          merchant_id: merchant.id,
          category_id: categoryMap.get('小吃'),
          name: '煎饺',
          description: '皮脆馅嫩，鲜香美味',
          price: '15.00',
          stock: 200,
          sales: 423,
        },
        {
          merchant_id: merchant.id,
          category_id: categoryMap.get('小吃'),
          name: '小笼包',
          description: '皮薄馅大，汤汁鲜美',
          price: '18.00',
          stock: 150,
          sales: 367,
        },
        {
          merchant_id: merchant.id,
          category_id: categoryMap.get('小吃'),
          name: '春卷',
          description: '外酥里嫩，香脆可口',
          price: '12.00',
          stock: 180,
          sales: 298,
        },
        // 甜品
        {
          merchant_id: merchant.id,
          category_id: categoryMap.get('甜品'),
          name: '芒果布丁',
          description: '香甜细腻，入口即化',
          price: '22.00',
          stock: 60,
          sales: 145,
        },
        {
          merchant_id: merchant.id,
          category_id: categoryMap.get('甜品'),
          name: '红豆沙',
          description: '香甜绵密，暖心暖胃',
          price: '15.00',
          stock: 80,
          sales: 189,
        },
        {
          merchant_id: merchant.id,
          category_id: categoryMap.get('甜品'),
          name: '双皮奶',
          description: '奶香浓郁，口感细腻',
          price: '18.00',
          stock: 70,
          sales: 156,
        },
        // 饮料
        {
          merchant_id: merchant.id,
          category_id: categoryMap.get('饮料'),
          name: '鲜榨橙汁',
          description: '新鲜橙子现榨，健康美味',
          price: '15.00',
          stock: 80,
          sales: 189,
        },
        {
          merchant_id: merchant.id,
          category_id: categoryMap.get('饮料'),
          name: '酸梅汤',
          description: '酸甜解腻，夏日必备',
          price: '8.00',
          stock: 200,
          sales: 456,
        },
        {
          merchant_id: merchant.id,
          category_id: categoryMap.get('饮料'),
          name: '柠檬水',
          description: '清新解渴，维C满满',
          price: '10.00',
          stock: 180,
          sales: 378,
        },
        {
          merchant_id: merchant.id,
          category_id: categoryMap.get('饮料'),
          name: '可乐',
          description: '经典饮料，冰爽解渴',
          price: '6.00',
          stock: 300,
          sales: 567,
        },
        // 水果
        {
          merchant_id: merchant.id,
          category_id: categoryMap.get('水果'),
          name: '水果拼盘',
          description: '多种新鲜水果，营养丰富',
          price: '28.00',
          stock: 50,
          sales: 123,
        },
        {
          merchant_id: merchant.id,
          category_id: categoryMap.get('水果'),
          name: '西瓜切块',
          description: '新鲜西瓜，清凉解暑',
          price: '15.00',
          stock: 80,
          sales: 234,
        },
      ];

      // 批量插入菜品
      for (const dish of dishes) {
        if (dish.category_id) {
          // 检查菜品是否已存在
          const { data: existing } = await client
            .from('dishes')
            .select('id')
            .eq('name', dish.name)
            .eq('merchant_id', dish.merchant_id)
            .single();

          if (!existing) {
            const { error: dishError } = await client
              .from('dishes')
              .insert(dish);

            if (dishError) {
              console.error(`创建菜品失败: ${dish.name}`, dishError);
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: '初始化数据成功',
      data: {
        categories: insertedCategories?.length || 0,
        merchant: merchant ? '已就绪' : '创建失败',
        user: '已就绪',
        dishes: '已添加丰富菜品数据',
      },
    });
  } catch (error) {
    console.error('初始化数据错误:', error);
    return NextResponse.json(
      { success: false, error: '初始化数据失败' },
      { status: 500 }
    );
  }
}
