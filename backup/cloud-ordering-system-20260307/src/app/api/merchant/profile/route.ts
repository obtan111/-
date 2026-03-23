import { NextRequest, NextResponse } from 'next/server';
import { authenticateMerchant } from '@/lib/auth/auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取商家信息
export async function GET(request: NextRequest) {
  const authResult = await authenticateMerchant(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const client = getSupabaseClient();
    const { data: merchant, error } = await client
      .from('merchants')
      .select('id, username, shop_name, email, phone, address, logo, description, rating, total_sales, is_active, created_at, updated_at')
      .eq('id', authResult.id)
      .single();

    if (error || !merchant) {
      return NextResponse.json(
        { success: false, error: '商家不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: merchant,
    });
  } catch (error) {
    console.error('获取商家信息错误:', error);
    return NextResponse.json(
      { success: false, error: '获取商家信息失败' },
      { status: 500 }
    );
  }
}

// 更新商家信息
export async function PUT(request: NextRequest) {
  const authResult = await authenticateMerchant(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const body = await request.json();
    const { shop_name, phone, address, logo, description } = body;

    const client = getSupabaseClient();
    const { data: merchant, error } = await client
      .from('merchants')
      .update({
        shop_name,
        phone,
        address,
        logo,
        description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', authResult.id)
      .select('id, username, shop_name, email, phone, address, logo, description, rating, total_sales, is_active, created_at, updated_at')
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: '更新失败' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: merchant,
      message: '更新成功',
    });
  } catch (error) {
    console.error('更新商家信息错误:', error);
    return NextResponse.json(
      { success: false, error: '更新失败，请稍后重试' },
      { status: 500 }
    );
  }
}
