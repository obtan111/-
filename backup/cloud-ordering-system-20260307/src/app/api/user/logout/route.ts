import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: '登出成功',
  });

  // 清除 Cookie
  response.cookies.delete('token');
  response.cookies.delete('userRole');

  return response;
}
