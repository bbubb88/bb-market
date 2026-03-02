import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('Discord OAuth error:', error);
      return NextResponse.redirect(new URL('/login?error=discord_auth_failed', request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/login?error=no_code', request.url));
    }

    // 构建 Discord OAuth 回调 URL
    const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/discord/callback`;

    // 使用 Supabase 的 OAuth 交换 code
    // 先获取 provider token
    const tokenResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=convert_session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({
        grant_type: 'convert_session',
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Token exchange error:', tokenData);
      return NextResponse.redirect(new URL('/login?error=token_exchange_failed', request.url));
    }

    // 获取用户信息
    const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();

    if (!userResponse.ok) {
      console.error('Get user error:', userData);
      return NextResponse.redirect(new URL('/login?error=get_user_failed', request.url));
    }

    // 登录成功，返回 token 和用户信息
    // 将 token 和 user 存入 URL 参数传递给前端（简化处理）
    const userJson = encodeURIComponent(JSON.stringify(userData));
    
    // 跳转到登录成功页面，带上 token
    return NextResponse.redirect(
      new URL(`/login/success?access_token=${tokenData.access_token}&refresh_token=${tokenData.refresh_token || ''}&user=${userJson}`, request.url)
    );
  } catch (error) {
    console.error('Discord callback error:', error);
    return NextResponse.redirect(new URL('/login?error=internal_error', request.url));
  }
}
