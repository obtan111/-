import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'merchant';
}

// 密码加密
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// 密码验证
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// 生成 JWT Token
export function generateToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// 验证 JWT Token
export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch (error) {
    return null;
  }
}

// 从请求中提取 Token
export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // 从 Cookie 中获取
  const tokenCookie = request.cookies.get('token');
  if (tokenCookie) {
    return tokenCookie.value;
  }
  
  return null;
}

// 验证用户认证
export async function authenticateUser(request: NextRequest): Promise<AuthUser | NextResponse> {
  const token = extractToken(request);
  
  if (!token) {
    return NextResponse.json(
      { success: false, error: '未提供认证令牌' },
      { status: 401 }
    );
  }
  
  const user = verifyToken(token);
  
  if (!user) {
    return NextResponse.json(
      { success: false, error: '无效的认证令牌' },
      { status: 401 }
    );
  }
  
  return user;
}

// 验证商家认证
export async function authenticateMerchant(request: NextRequest): Promise<AuthUser | NextResponse> {
  const authResult = await authenticateUser(request);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  if (authResult.role !== 'merchant') {
    return NextResponse.json(
      { success: false, error: '需要商家权限' },
      { status: 403 }
    );
  }
  
  return authResult;
}

// 用户注册
export async function registerUser(
  username: string,
  email: string,
  password: string,
  phone?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const client = getSupabaseClient();
    
    // 检查用户名是否已存在
    const { data: existingUsername } = await client
      .from('users')
      .select('id')
      .eq('username', username)
      .single();
    
    if (existingUsername) {
      return { success: false, error: '用户名已存在' };
    }
    
    // 检查邮箱是否已存在
    const { data: existingEmail } = await client
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (existingEmail) {
      return { success: false, error: '邮箱已被注册' };
    }
    
    // 加密密码
    const hashedPassword = await hashPassword(password);
    
    // 创建用户
    const { data: newUser, error } = await client
      .from('users')
      .insert({
        username,
        email,
        password: hashedPassword,
        phone,
        is_active: true,
      })
      .select()
      .single();
    
    if (error) {
      return { success: false, error: '注册失败，请稍后重试' };
    }
    
    // 生成 Token
    const token = generateToken({
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: 'user',
    });
    
    // 移除密码字段
    const { password: _, ...userWithoutPassword } = newUser;
    
    return {
      success: true,
      data: {
        user: userWithoutPassword,
        token,
      },
    };
  } catch (error) {
    console.error('注册错误:', error);
    return { success: false, error: '注册失败，请稍后重试' };
  }
}

// 用户登录
export async function loginUser(
  username: string,
  password: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const client = getSupabaseClient();
    
    // 查找用户（支持用户名或邮箱登录）
    const { data: user, error } = await client
      .from('users')
      .select('*')
      .or(`username.eq.${username},email.eq.${username}`)
      .eq('is_active', true)
      .single();
    
    if (error || !user) {
      return { success: false, error: '用户名或密码错误' };
    }
    
    // 验证密码
    const isValid = await verifyPassword(password, user.password);
    
    if (!isValid) {
      return { success: false, error: '用户名或密码错误' };
    }
    
    // 生成 Token
    const token = generateToken({
      id: user.id,
      username: user.username,
      email: user.email,
      role: 'user',
    });
    
    // 移除密码字段
    const { password: _, ...userWithoutPassword } = user;
    
    return {
      success: true,
      data: {
        user: userWithoutPassword,
        token,
      },
    };
  } catch (error) {
    console.error('登录错误:', error);
    return { success: false, error: '登录失败，请稍后重试' };
  }
}

// 商家注册
export async function registerMerchant(
  username: string,
  email: string,
  password: string,
  shopName: string,
  phone: string,
  address?: string,
  description?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const client = getSupabaseClient();
    
    // 检查用户名是否已存在
    const { data: existingUsername } = await client
      .from('merchants')
      .select('id')
      .eq('username', username)
      .single();
    
    if (existingUsername) {
      return { success: false, error: '用户名已存在' };
    }
    
    // 检查邮箱是否已存在
    const { data: existingEmail } = await client
      .from('merchants')
      .select('id')
      .eq('email', email)
      .single();
    
    if (existingEmail) {
      return { success: false, error: '邮箱已被注册' };
    }
    
    // 加密密码
    const hashedPassword = await hashPassword(password);
    
    // 创建商家
    const { data: newMerchant, error } = await client
      .from('merchants')
      .insert({
        username,
        email,
        password: hashedPassword,
        shop_name: shopName,
        phone,
        address,
        description,
        is_active: true,
        rating: '0.00',
        total_sales: 0,
      })
      .select()
      .single();
    
    if (error) {
      return { success: false, error: '注册失败，请稍后重试' };
    }
    
    // 生成 Token
    const token = generateToken({
      id: newMerchant.id,
      username: newMerchant.username,
      email: newMerchant.email,
      role: 'merchant',
    });
    
    // 移除密码字段
    const { password: _, ...merchantWithoutPassword } = newMerchant;
    
    return {
      success: true,
      data: {
        merchant: merchantWithoutPassword,
        token,
      },
    };
  } catch (error) {
    console.error('商家注册错误:', error);
    return { success: false, error: '注册失败，请稍后重试' };
  }
}

// 商家登录
export async function loginMerchant(
  username: string,
  password: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const client = getSupabaseClient();
    
    // 查找商家
    const { data: merchant, error } = await client
      .from('merchants')
      .select('*')
      .or(`username.eq.${username},email.eq.${username}`)
      .eq('is_active', true)
      .single();
    
    if (error || !merchant) {
      return { success: false, error: '用户名或密码错误' };
    }
    
    // 验证密码
    const isValid = await verifyPassword(password, merchant.password);
    
    if (!isValid) {
      return { success: false, error: '用户名或密码错误' };
    }
    
    // 生成 Token
    const token = generateToken({
      id: merchant.id,
      username: merchant.username,
      email: merchant.email,
      role: 'merchant',
    });
    
    // 移除密码字段
    const { password: _, ...merchantWithoutPassword } = merchant;
    
    return {
      success: true,
      data: {
        merchant: merchantWithoutPassword,
        token,
      },
    };
  } catch (error) {
    console.error('商家登录错误:', error);
    return { success: false, error: '登录失败，请稍后重试' };
  }
}
