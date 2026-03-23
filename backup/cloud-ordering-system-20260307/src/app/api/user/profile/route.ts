import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth/auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取当前用户信息
export async function GET(request: NextRequest) {
  const authResult = await authenticateUser(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const client = getSupabaseClient();
    const { data: user, error } = await client
      .from('users')
      .select('id, username, email, phone, avatar, real_name, address, is_active, created_at, updated_at')
      .eq('id', authResult.id)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    return NextResponse.json(
      { success: false, error: '获取用户信息失败' },
      { status: 500 }
    );
  }
}

// 更新用户信息
export async function PUT(request: NextRequest) {
  const authResult = await authenticateUser(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const body = await request.json();
    const { phone, avatar, real_name, address } = body;

    const client = getSupabaseClient();
    const { data: user, error } = await client
      .from('users')
      .update({
        phone,
        avatar,
        real_name,
        address,
        updated_at: new Date().toISOString(),
      })
      .eq('id', authResult.id)
      .select('id, username, email, phone, avatar, real_name, address, is_active, created_at, updated_at')
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: '更新失败' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
      message: '更新成功',
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    return NextResponse.json(
      { success: false, error: '更新失败，请稍后重试' },
      { status: 500 }
    );
  }
}
