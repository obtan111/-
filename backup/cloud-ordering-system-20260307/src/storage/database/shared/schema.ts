import { pgTable, serial, varchar, text, integer, decimal, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// ==================== 用户表 ====================
export const users = pgTable("users", {
  id: serial().notNull(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  avatar: text("avatar"),
  realName: varchar("real_name", { length: 50 }),
  address: text("address"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  index("idx_users_username").on(table.username),
  index("idx_users_email").on(table.email),
]);

// ==================== 商家表 ====================
export const merchants = pgTable("merchants", {
  id: serial().notNull(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  shopName: varchar("shop_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }).notNull(),
  address: text("address"),
  logo: text("logo"),
  description: text("description"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  totalSales: integer("total_sales").default(0),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  index("idx_merchants_username").on(table.username),
  index("idx_merchants_email").on(table.email),
]);

// ==================== 菜品分类表 ====================
export const categories = pgTable("categories", {
  id: serial().notNull(),
  name: varchar("name", { length: 50 }).notNull(),
  icon: varchar("icon", { length: 100 }),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  index("idx_categories_name").on(table.name),
]);

// ==================== 菜品表 ====================
export const dishes = pgTable("dishes", {
  id: serial().notNull(),
  merchantId: integer("merchant_id").notNull(),
  categoryId: integer("category_id").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  image: text("image"),
  stock: integer("stock").default(999),
  sales: integer("sales").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  reviewCount: integer("review_count").default(0),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  index("idx_dishes_merchant_id").on(table.merchantId),
  index("idx_dishes_category_id").on(table.categoryId),
  index("idx_dishes_name").on(table.name),
]);

// ==================== 购物车表 ====================
export const cartItems = pgTable("cart_items", {
  id: serial().notNull(),
  userId: integer("user_id").notNull(),
  dishId: integer("dish_id").notNull(),
  merchantId: integer("merchant_id").notNull(),
  quantity: integer("quantity").default(1).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  index("idx_cart_items_user_id").on(table.userId),
  index("idx_cart_items_dish_id").on(table.dishId),
]);

// ==================== 订单表 ====================
export const orders = pgTable("orders", {
  id: serial().notNull(),
  orderNo: varchar("order_no", { length: 32 }).notNull().unique(),
  userId: integer("user_id").notNull(),
  merchantId: integer("merchant_id").notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, paid, preparing, delivering, completed, cancelled
  paymentMethod: varchar("payment_method", { length: 20 }),
  paidAt: timestamp("paid_at", { withTimezone: true, mode: 'string' }),
  completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true, mode: 'string' }),
  cancelReason: text("cancel_reason"),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  remark: text("remark"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  index("idx_orders_order_no").on(table.orderNo),
  index("idx_orders_user_id").on(table.userId),
  index("idx_orders_merchant_id").on(table.merchantId),
  index("idx_orders_status").on(table.status),
]);

// ==================== 订单明细表 ====================
export const orderItems = pgTable("order_items", {
  id: serial().notNull(),
  orderId: integer("order_id").notNull(),
  dishId: integer("dish_id").notNull(),
  dishName: varchar("dish_name", { length: 100 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  index("idx_order_items_order_id").on(table.orderId),
]);

// ==================== 评价表 ====================
export const reviews = pgTable("reviews", {
  id: serial().notNull(),
  userId: integer("user_id").notNull(),
  dishId: integer("dish_id").notNull(),
  orderId: integer("order_id").notNull(),
  rating: integer("rating").notNull(), // 1-5
  content: text("content"),
  images: jsonb("images").default([]),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  index("idx_reviews_user_id").on(table.userId),
  index("idx_reviews_dish_id").on(table.dishId),
  index("idx_reviews_order_id").on(table.orderId),
]);

// ==================== 菜品向量嵌入表（用于 AI 推荐） ====================
export const dishEmbeddings = pgTable("dish_embeddings", {
  id: serial().notNull(),
  dishId: integer("dish_id").notNull().unique(),
  embedding: jsonb("embedding").notNull(), // 存储向量数组
  embeddingModel: varchar("embedding_model", { length: 100 }).default("doubao-embedding-vision-251215"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  index("idx_dish_embeddings_dish_id").on(table.dishId),
]);

// ==================== 用户行为记录表（用于协同过滤） ====================
export const userBehaviors = pgTable("user_behaviors", {
  id: serial().notNull(),
  userId: integer("user_id").notNull(),
  dishId: integer("dish_id").notNull(),
  behaviorType: varchar("behavior_type", { length: 20 }).notNull(), // view, cart, purchase, review
  score: decimal("score", { precision: 3, scale: 2 }).default("1.00"), // 行为权重分数
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  index("idx_user_behaviors_user_id").on(table.userId),
  index("idx_user_behaviors_dish_id").on(table.dishId),
]);

// 健康检查表
export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});
