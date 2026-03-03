'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginSuccessPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 从 URL query 参数获取 token（我们的 API 回调方式）
    const searchParams = new URLSearchParams(window.location.search);
    
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const userJson = searchParams.get('user');

    if (!accessToken) {
      // 如果没有 token，检查 hash（Supabase 直接回调方式）
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      const hashAccessToken = hashParams.get('access_token');
      const hashRefreshToken = hashParams.get('refresh_token');
      
      if (!hashAccessToken) {
        setError('登录失败，请重试');
        return;
      }
      
      // 保存 hash 中的 token
      localStorage.setItem('access_token', hashAccessToken);
      if (hashRefreshToken) {
        localStorage.setItem('refresh_token', hashRefreshToken);
      }
      
      // 获取用户信息
      fetchUserInfo(hashAccessToken);
      return;
    }

    // 保存 query 参数中的 token
    localStorage.setItem('access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
    if (userJson) {
      try {
        const userData = JSON.parse(decodeURIComponent(userJson));
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (e) {
        console.error('Parse user error:', e);
      }
    }

    // 跳转到 dashboard
    router.push('/dashboard');
  }, [router]);

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
