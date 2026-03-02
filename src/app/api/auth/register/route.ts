import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const RESEND_API_KEY = process.env.RESEND_API_KEY!;

const resend = new Resend(RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // 生成随机 ID
    const userId = crypto.randomUUID();

    // 使用 Supabase Admin API 直接创建用户（不发邮件）
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({
        id: userId,
        email,
        password,
        email_confirm: true, // 直接确认，不发邮件
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Admin create user error:', data);
      return NextResponse.json(
        { error: data.error_description || 'Registration failed' },
        { status: response.status }
      );
    }

    // 发送欢迎邮件（使用 Resend）
    try {
      await resend.emails.send({
        from: 'BB Market <noreply@bbmarket.com>',
        to: email,
        subject: '欢迎加入 BB Market',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #1a1a2e; color: #fff; padding: 40px; }
                .container { max-width: 500px; margin: 0 auto; background: #16213e; border-radius: 16px; padding: 40px; }
                .logo { text-align: center; margin-bottom: 30px; }
                .logo img { height: 60px; }
                h1 { text-align: center; color: #fff; margin-bottom: 20px; }
                p { color: #a0a0b0; line-height: 1.6; margin-bottom: 20px; }
                .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="logo">
                  <img src="https://bb-market-next.vercel.app/logo.svg" alt="BB Market" />
                </div>
                <h1>欢迎加入 BB Market</h1>
                <p>感谢您注册 BB Market！您的账号已创建成功。</p>
                <p>现在您可以登录并开始交易游戏账号和道具了。</p>
                <div class="footer">
                  <p>© 2026 BB Market. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    return NextResponse.json({
      message: 'Registration successful',
      user: { id: userId, email },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
