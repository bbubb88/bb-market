import { NextRequest, NextResponse } from 'next/server';

// 直接 Discord OAuth，不经过 Supabase
const DISCORD_CLIENT_ID = '1478033689853300746';
const DISCORD_CLIENT_SECRET = 'yIpU5iIvNo8C-TeSjm9QD5OHrLbYFszP';
const REDIRECT_URI = 'https://bb-market-next.vercel.app/api/auth/discord/callback';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // 错误处理
  if (error) {
    console.error('Discord OAuth error:', error);
    return NextResponse.redirect(new URL('/login?error=discord_' + error, request.url));
  }

  // 没有 code，说明是第一步：引导用户去 Discord 授权
  if (!code) {
    const scopes = ['identify', 'email'].join('%20');
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${scopes}`;
    return NextResponse.redirect(new URL(authUrl, request.url));
  }

  // 第二步：用 code 换取 access_token
  try {
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Token exchange error:', tokenData);
      return NextResponse.redirect(new URL('/login?error=token_failed', request.url));
    }

    const accessToken = tokenData.access_token;

    // 第三步：获取用户信息
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const userData = await userResponse.json();

    if (!userResponse.ok) {
      console.error('Get user error:', userData);
      return NextResponse.redirect(new URL('/login?error=user_failed', request.url));
    }

    // 获取用户邮箱（需要 scope 有 email）
    let email = userData.email;
    if (!email) {
      // 单独请求邮箱
      const emailResponse = await fetch('https://discord.com/api/users/@me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      const emailData = await emailResponse.json();
      email = emailData.email;
    }

    // 生成简单的 session token
    const sessionData = {
      id: userData.id,
      username: userData.username,
      email: email || `${userData.id}@discord.user`,
      avatar: userData.avatar,
      provider: 'discord',
    };

    const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString('base64');

    // 跳转到成功页面
    return NextResponse.redirect(
      new URL(`/login/success?token=${sessionToken}`, request.url)
    );
  } catch (err) {
    console.error('OAuth error:', err);
    return NextResponse.redirect(new URL('/login?error=internal', request.url));
  }
}
