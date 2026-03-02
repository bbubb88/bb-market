import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export async function POST(request: NextRequest) {
  try {
    const { redirectUri } = await request.json();

    if (!redirectUri) {
      return NextResponse.json(
        { error: 'redirectUri is required' },
        { status: 400 }
      );
    }

    // 使用 Supabase 生成 Discord OAuth URL
    // Supabase 会自动处理 Discord OAuth 流程
    const authorizeUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=discord&redirect_to=${encodeURIComponent(redirectUri)}`;

    // 返回授权 URL，前端会跳转到这个 URL
    return NextResponse.json({ url: authorizeUrl });
  } catch (error) {
    console.error('Discord authorize error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
