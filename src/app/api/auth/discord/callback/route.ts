import { NextRequest, NextResponse } from 'next/server';

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1478033689853300746';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || 'yIpU5iIvNo8C-TeSjm9QD5OHrLbYFszP';
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || 'https://bb-market-next.vercel.app/api/auth/discord/callback';

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
      // 没有 code，说明是第一步：引导用户去 Discord 授权
      const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20email&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}`;
      return NextResponse.redirect(new URL(discordAuthUrl, request.url));
    }

    // 第二步：用 code 换取 access_token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID!,
        client_secret: DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: DISCORD_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Token exchange error:', tokenData);
      return NextResponse.redirect(new URL('/login?error=token_exchange_failed', request.url));
    }

    const accessToken = tokenData.access_token;

    // 第三步：用 access_token 获取用户信息
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const userData = await userResponse.json();

    if (!userResponse.ok) {
      console.error('Get user error:', userData);
      return NextResponse.redirect(new URL('/login?error=get_user_failed', request.url));
    }

    // 生成简单的 session token（实际应该用 JWT）
    const sessionToken = Buffer.from(JSON.stringify({
      discordId: userData.id,
      email: userData.email,
      username: userData.username,
      avatar: userData.avatar,
    })).toString('base64');

    // 跳转到成功页面，带上 session token
    return NextResponse.redirect(
      new URL(`/login/success?token=${sessionToken}`, request.url)
    );
  } catch (error) {
    console.error('Discord callback error:', error);
    return NextResponse.redirect(new URL('/login?error=internal_error', request.url));
  }
}
