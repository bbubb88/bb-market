import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // 使用 Supabase Auth API 登录
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      // 更友好的错误消息
      let errorMessage = '登录失败，请检查邮箱和密码';
      
      if (data.error_description) {
        if (data.error_description.includes('Invalid login credentials')) {
          errorMessage = '邮箱或密码错误，请重新输入';
        } else if (data.error_description.includes('Email not confirmed')) {
          errorMessage = '请先验证您的邮箱后再登录';
        } else if (data.error_description.includes('Too many requests')) {
          errorMessage = '登录尝试次数过多，请稍后再试';
        } else {
          errorMessage = data.error_description;
        }
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    return NextResponse.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user: data.user,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
