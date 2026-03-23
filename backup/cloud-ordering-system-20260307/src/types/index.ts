// 用户类型
export interface User {
  id: number;
  username: string;
  email: string;
  phone?: string;
  avatar?: string;
  real_name?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 商家类型
export interface Merchant {
  id: number;
  username: string;
  shop_name: string;
  email: string;
  phone: string;
  address?: string;
  logo?: string;
  description?: string;
  rating: string;
  total_sales: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 菜品分类类型
export interface Category {
  id: number;
  name: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

// 菜品类型
export interface Dish {
  id: number;
  merchant_id: number;
  category_id: number;
  name: string;
  description?: string;
  price: string;
  image?: string;
  stock: number;
  sales: number;
  rating: string;
  review_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 购物车项类型
export interface CartItem {
  id: number;
  user_id: number;
  dish_id: number;
  merchant_id: number;
  quantity: number;
  created_at: string;
  updated_at: string;
  dish?: Dish;
}

// 订单类型
export interface Order {
  id: number;
  order_no: string;
  user_id: number;
  merchant_id: number;
  total_price: string;
  status: 'pending' | 'paid' | 'preparing' | 'delivering' | 'completed' | 'cancelled';
  payment_method?: string;
  paid_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  cancel_reason?: string;
  address?: string;
  phone?: string;
  remark?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

// 订单明细类型
export interface OrderItem {
  id: number;
  order_id: number;
  dish_id: number;
  dish_name: string;
  price: string;
  quantity: number;
  subtotal: string;
  created_at: string;
}

// 评价类型
export interface Review {
  id: number;
  user_id: number;
  dish_id: number;
  order_id: number;
  rating: number;
  content?: string;
  images?: string[];
  is_active: boolean;
  created_at: string;
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 认证响应类型
export interface AuthResponse {
  user: User | Merchant;
  token: string;
}
