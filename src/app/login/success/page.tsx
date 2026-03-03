'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginSuccessPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get('token');

    if (!token) {
      setError('登录失败，请重试');
      return;
    }

    try {
      // 解析我们的 session token
      const userData = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
      
      // 保存用户信息
      localStorage.setItem('access_token', token);
      localStorage.setItem('user', JSON.stringify({
        id: userData.discordId,
        email: userData.email,
        user_metadata: {
          full_name: userData.username,
          avatar_url: userData.avatar ? `https://cdn.discordapp.com/avatars/${userData.discordId}/${userData.avatar}.png` : null
        }
      }));

      // 跳转到 dashboard
      router.push('/dashboard');
    } catch (e) {
      console.error('Parse token error:', e);
      setError('登录失败，请重试');
    }
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">登录失败</h1>
          <p className="text-slate-400">{error}</p>
          <a href="/login" className="text-violet-400 hover:text-violet-300 mt-4 inline-block">
            返回登录
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto mb-4"></div>
        <p className="text-slate-400">正在登录...</p>
      </div>
    </div>
  );
}
