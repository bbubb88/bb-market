'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginSuccessPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Supabase OAuth 回调会将 token 放在 URL hash 中
    // 格式: #access_token=xxx&refresh_token=xxx&expires_in=xxx&token_type=bearer
    const hash = window.location.hash.substring(1); // 去掉 #
    const params = new URLSearchParams(hash);
    
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const expiresIn = params.get('expires_in');

    if (!accessToken) {
      // 如果没有 token，可能是用户取消了或者出错了
      setError('登录失败，请重试');
      return;
    }

    // 保存 token 到 localStorage
    localStorage.setItem('access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
    if (expiresIn) {
      localStorage.setItem('token_expires_in', expiresIn);
    }

    // 获取用户信息
    fetchUserInfo(accessToken);
  }, []);

  const fetchUserInfo = async (accessToken: string) => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ytsqawvrgzxgfluuadao.supabase.co';
      const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        },
      });

      if (res.ok) {
        const userData = await res.json();
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (err) {
      console.error('Failed to fetch user info:', err);
    } finally {
      // 跳转到 dashboard
      router.push('/dashboard');
    }
  };

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
