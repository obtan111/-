-- =====================================================
-- Supabase RLS (Row Level Security) 安全策略配置
-- 为云点餐系统启用数据安全保护
-- 注意：使用实际的列名（下划线命名）
-- =====================================================

-- 1. 菜品表 (dishes)
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;

-- 允许所有人查看已上架的菜品
CREATE POLICY "允许公众查看已上架菜品" ON dishes
  FOR SELECT USING (is_active = true);

-- 允许商家管理自己的菜品（使用 merchant_id）
CREATE POLICY "允许商家管理菜品" ON dishes
  FOR ALL USING (merchant_id IN (
    SELECT id FROM merchants WHERE id::text = auth.uid()::text
  ));

-- 2. 分类表 (categories)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 允许所有人查看分类
CREATE POLICY "允许公众查看分类" ON categories
  FOR SELECT USING (true);

-- 3. 用户表 (users)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 允许用户查看自己的信息（使用 id 列匹配 auth.uid()）
CREATE POLICY "允许用户查看自己的信息" ON users
  FOR SELECT USING (id::text = auth.uid()::text);

-- 允许用户更新自己的信息
CREATE POLICY "允许用户更新自己的信息" ON users
  FOR UPDATE USING (id::text = auth.uid()::text);

-- 4. 商家表 (merchants)
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;

-- 允许所有人查看商家信息
CREATE POLICY "允许公众查看商家" ON merchants
  FOR SELECT USING (true);

-- 允许商家管理自己的信息
CREATE POLICY "允许商家管理自己的信息" ON merchants
  FOR ALL USING (id::text = auth.uid()::text);

-- 5. 订单表 (orders)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 允许用户查看自己的订单（使用 user_id）
CREATE POLICY "允许用户查看自己的订单" ON orders
  FOR SELECT USING (user_id::text = auth.uid()::text);

-- 允许商家查看相关订单（使用 merchant_id）
CREATE POLICY "允许商家查看相关订单" ON orders
  FOR SELECT USING (merchant_id IN (
    SELECT id FROM merchants WHERE id::text = auth.uid()::text
  ));

-- 允许用户创建订单
CREATE POLICY "允许用户创建订单" ON orders
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

-- 允许商家更新订单状态
CREATE POLICY "允许商家更新订单" ON orders
  FOR UPDATE USING (merchant_id IN (
    SELECT id FROM merchants WHERE id::text = auth.uid()::text
  ));

-- 6. 订单详情表 (order_items)
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 允许用户查看自己的订单详情
CREATE POLICY "允许用户查看订单详情" ON order_items
  FOR SELECT USING (order_id IN (
    SELECT id FROM orders WHERE user_id::text = auth.uid()::text
  ));

-- 允许商家查看相关订单详情
CREATE POLICY "允许商家查看订单详情" ON order_items
  FOR SELECT USING (order_id IN (
    SELECT id FROM orders WHERE merchant_id IN (
      SELECT id FROM merchants WHERE id::text = auth.uid()::text
    )
  ));

-- 7. 购物车表 (cart_items)
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- 允许用户管理自己的购物车（使用 user_id）
CREATE POLICY "允许用户管理购物车" ON cart_items
  FOR ALL USING (user_id::text = auth.uid()::text);

-- 8. 评价表 (reviews)
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 允许所有人查看评价
CREATE POLICY "允许公众查看评价" ON reviews
  FOR SELECT USING (true);

-- 允许用户创建自己的评价（使用 user_id）
CREATE POLICY "允许用户创建评价" ON reviews
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

-- 允许用户删除自己的评价
CREATE POLICY "允许用户删除自己的评价" ON reviews
  FOR DELETE USING (user_id::text = auth.uid()::text);

-- 9. 菜品向量表 (dish_embeddings)
ALTER TABLE dish_embeddings ENABLE ROW LEVEL SECURITY;

-- 允许所有人查看菜品向量（用于推荐）
CREATE POLICY "允许公众查看菜品向量" ON dish_embeddings
  FOR SELECT USING (true);

-- 只允许系统插入向量
CREATE POLICY "只允许系统插入向量" ON dish_embeddings
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- 完成！所有表已启用 RLS 保护
-- =====================================================
