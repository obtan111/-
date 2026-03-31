import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { hashPassword } from '@/lib/auth/auth';
import path from 'path';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

// 初始化示例数据
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();

    // 获取当前文件目录
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const outputPath = path.join(__dirname, '../../../../output');
    console.log('数据文件路径:', {
      __dirname,
      outputPath,
      dishesPath: path.join(outputPath, 'dishes.json'),
      orderItemsPath: path.join(outputPath, 'order_items.json')
    });
    
    // 检查文件是否存在
    const fs = require('fs');
    console.log('文件存在性检查:', {
      dishesExists: fs.existsSync(path.join(outputPath, 'dishes.json')),
      orderItemsExists: fs.existsSync(path.join(outputPath, 'order_items.json'))
    });

    // 1. 创建分类
    const categories = [
      { name: '热菜', icon: '🔥', sort_order: 1 },
      { name: '凉菜', icon: '🥗', sort_order: 2 },
      { name: '汤品', icon: '🍲', sort_order: 3 },
      { name: '主食', icon: '🍚', sort_order: 4 },
      { name: '小吃', icon: '🍢', sort_order: 5 },
      { name: '饮料', icon: '🥤', sort_order: 6 },
      { name: '水果', icon: '🍎', sort_order: 7 },
    ];

    // 删除不在新分类列表中的旧分类（如甜品）
    const categoryNames = categories.map(c => c.name);
    const { data: existingCategories } = await client
      .from('categories')
      .select('name');
    
    if (existingCategories) {
      const categoriesToDelete = existingCategories
        .filter(c => !categoryNames.includes(c.name))
        .map(c => c.name);
      
      if (categoriesToDelete.length > 0) {
        const { error: deleteCatError } = await client
          .from('categories')
          .delete()
          .in('name', categoriesToDelete);
        
        if (deleteCatError) {
          console.error('删除旧分类失败:', deleteCatError);
        } else {
          console.log('已删除旧分类:', categoriesToDelete);
        }
      }
    }

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

    // 3. 读取生成的数据集
    let dishesData = [];
    let usersData = [];
    let ordersData = [];
    let orderItemsData = [];

    try {
      const dishesPath = path.join(outputPath, 'dishes.json');
      const usersPath = path.join(outputPath, 'users.json');
      const ordersPath = path.join(outputPath, 'orders.json');
      const orderItemsPath = path.join(outputPath, 'order_items.json');

      if (require('fs').existsSync(dishesPath)) {
        try {
          const dishesContent = readFileSync(dishesPath, 'utf8');
          dishesData = JSON.parse(dishesContent);
          console.log('读取菜品数据成功:', dishesData.length, '条');
        } catch (e) {
          console.error('解析菜品数据失败:', e instanceof Error ? e.message : String(e));
        }
      }

      if (require('fs').existsSync(usersPath)) {
        try {
          const usersContent = readFileSync(usersPath, 'utf8');
          usersData = JSON.parse(usersContent);
          console.log('读取用户数据成功:', usersData.length, '条');
        } catch (e) {
          console.error('解析用户数据失败:', e instanceof Error ? e.message : String(e));
        }
      }

      if (require('fs').existsSync(ordersPath)) {
        try {
          const ordersContent = readFileSync(ordersPath, 'utf8');
          ordersData = JSON.parse(ordersContent);
          console.log('读取订单数据成功:', ordersData.length, '条');
        } catch (e) {
          console.error('解析订单数据失败:', e instanceof Error ? e.message : String(e));
        }
      }

      if (require('fs').existsSync(orderItemsPath)) {
        try {
          const orderItemsContent = readFileSync(orderItemsPath, 'utf8');
          orderItemsData = JSON.parse(orderItemsContent);
          console.log('读取订单菜品数据成功:', orderItemsData.length, '条');
        } catch (e) {
          console.error('解析订单菜品数据失败:', e instanceof Error ? e.message : String(e));
        }
      }
    } catch (readError) {
      console.error('读取数据集失败:', readError);
    }

    // 4. 插入菜品数据（先清空现有菜品，再导入新数据）
    let dishesInserted = 0;
    console.log('初始化数据准备:', {
      merchant: !!merchant,
      dishesDataLength: dishesData.length,
      usersDataLength: usersData.length,
      ordersDataLength: ordersData.length,
      orderItemsDataLength: orderItemsData.length
    });
    
    if (merchant && dishesData.length > 0) {
      // 先删除该商家的所有现有菜品
      const { error: deleteError } = await client
        .from('dishes')
        .delete()
        .eq('merchant_id', merchant.id);
      
      if (deleteError) {
        console.error('删除现有菜品失败:', deleteError);
      }
      
      // 批量插入新菜品（只包含数据库表中存在的字段，过滤掉id字段让数据库自动生成）
      const dishesToInsert = dishesData.map((dish: any) => {
        const { 
          id, name, description, price, stock, sales, rating, review_count, 
          is_active, category_id, created_at, updated_at
        } = dish;
        return {
          name,
          description,
          price,
          stock,
          sales,
          rating,
          review_count,
          is_active: true,
          category_id,
          merchant_id: merchant.id,
          created_at,
          updated_at
        };
      });
      
      // 分批插入，每批50条
      const batchSize = 50;
      for (let i = 0; i < dishesToInsert.length; i += batchSize) {
        const batch = dishesToInsert.slice(i, i + batchSize);
        const { error: dishError } = await client
          .from('dishes')
          .insert(batch);
        
        if (!dishError) {
          dishesInserted += batch.length;
          console.log(`成功导入第 ${i/batchSize + 1} 批菜品，共 ${batch.length} 条`);
        } else {
          console.error(`批量创建菜品失败:`, dishError);
        }
      }
      console.log(`菜品导入完成，共导入 ${dishesInserted} 条`);
    }

    // 5. 插入用户数据
    let usersInserted = 0;
    if (usersData.length > 0) {
      for (const user of usersData) {
        // 检查用户是否已存在
        const { data: existing } = await client
          .from('users')
          .select('id')
          .eq('username', user.username)
          .single();

        if (!existing) {
          const { error: userError } = await client
            .from('users')
            .insert({
              ...user,
              password: hashedPassword,
              is_active: true,
            });

          if (!userError) {
            usersInserted++;
          } else {
            console.error(`创建用户失败: ${user.username}`, userError);
          }
        }
      }
      console.log(`用户导入完成，共导入 ${usersInserted} 条`);
    }

    // 6. 插入订单数据（先清空再导入）
    let ordersInserted = 0;
    if (merchant && ordersData.length > 0) {
      try {
        // 先删除所有现有订单
        const { error: deleteOrdersError } = await client
          .from('orders')
          .delete()
          .eq('merchant_id', merchant.id);
        
        if (deleteOrdersError) {
          console.error('删除现有订单失败:', deleteOrdersError);
        }
        
        // 批量插入新订单（只包含数据库表中存在的字段，过滤掉id字段让数据库自动生成）
        const ordersToInsert = ordersData.map((order: any) => {
          const { 
            id, user_id, total_amount, status, 
            payment_method, item_count, created_at, updated_at
          } = order;
          // 生成订单号
          const orderNo = `ORD${Date.now()}${Math.random().toString(36).substring(2, 8)}`.toUpperCase();
          return {
            order_no: orderNo,
            user_id,
            merchant_id: merchant.id,
            total_price: total_amount,
            status,
            payment_method,
            created_at,
            updated_at
          };
        });
        
        // 分批插入，每批50条
        const batchSize = 50;
        for (let i = 0; i < ordersToInsert.length; i += batchSize) {
          const batch = ordersToInsert.slice(i, i + batchSize);
          const { error: orderError } = await client
            .from('orders')
            .insert(batch);
          
          if (!orderError) {
            ordersInserted += batch.length;
            console.log(`成功导入第 ${i/batchSize + 1} 批订单，共 ${batch.length} 条`);
          } else {
            console.error(`批量创建订单失败:`, orderError);
          }
        }
        console.log(`订单导入完成，共导入 ${ordersInserted} 条`);
      } catch (error) {
        console.error('订单导入异常:', error instanceof Error ? error.message : String(error));
      }
    }

    // 7. 插入订单菜品数据（先清空再导入）
    let orderItemsInserted = 0;
    if (orderItemsData.length > 0) {
      try {
        // 先删除所有现有订单菜品
        const { error: deleteItemsError } = await client
          .from('order_items')
          .delete()
          .neq('id', 0);  // 删除所有记录
        
        if (deleteItemsError) {
          console.error('删除现有订单菜品失败:', deleteItemsError);
        } else {
          // 重置order_items表的序列
          try {
            const { error: sequenceError } = await client
              .rpc('execute_sql', {
                sql: 'SELECT setval(\'order_items_id_seq\', 1, false);'
              });
            if (sequenceError) {
              console.error('重置序列失败:', sequenceError);
            } else {
              console.log('序列重置成功');
            }
          } catch (sequenceCatchError) {
            console.error('重置序列时出错:', sequenceCatchError);
          }
        }
        
        // 批量插入新订单菜品（过滤掉id字段，让数据库自动生成）
        const batchSize = 50;
        for (let i = 0; i < orderItemsData.length; i += batchSize) {
          const batch = orderItemsData.slice(i, i + batchSize).map(item => {
            const { id, ...itemWithoutId } = item;
            return itemWithoutId;
          });
          const { error: itemError } = await client
            .from('order_items')
            .insert(batch);
          
          if (!itemError) {
            orderItemsInserted += batch.length;
            console.log(`成功导入第 ${i/batchSize + 1} 批订单菜品，共 ${batch.length} 条`);
          } else {
            console.error(`批量创建订单菜品失败:`, itemError);
          }
        }
        console.log(`订单菜品导入完成，共导入 ${orderItemsInserted} 条`);
      } catch (error) {
        console.error('订单菜品导入异常:', error instanceof Error ? error.message : String(error));
      }
    }

    // 8. 初始化向量嵌入
    try {
      const { batchGenerateDishEmbeddings } = await import('@/lib/recommend/embedding');
      await batchGenerateDishEmbeddings();
      console.log('向量嵌入初始化完成');
    } catch (embeddingError) {
      console.error('初始化向量嵌入失败:', embeddingError);
    }

    return NextResponse.json({
      success: true,
      message: '初始化数据成功',
      data: {
        categories: insertedCategories?.length || 0,
        merchant: merchant ? '已就绪' : '创建失败',
        dishes: `已添加 ${dishesInserted} 道菜品`,
        users: `已添加 ${usersInserted} 个用户`,
        orders: `已添加 ${ordersInserted} 个订单`,
        order_items: `已添加 ${orderItemsInserted} 个订单菜品`,
        total_dishes: dishesData.length,
        total_users: usersData.length,
        total_orders: ordersData.length,
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
