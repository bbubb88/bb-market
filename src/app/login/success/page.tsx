'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginSuccessPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 从 URL hash 中获取 session
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken) {
      // 保存 token
      localStorage.setItem('access_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }
      
      // 获取用户信息
      fetchUserInfo(accessToken);
    } else {
      // 检查是否已经有 session
      checkSession();
    }
  }, [router]);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session) {
        localStorage.setItem('access_token', session.access_token);
        localStorage.setItem('user', JSON.stringify(session.user));
        router.push('/dashboard');
      } else {
        setError('登录失败，请重试');
      }
    } catch (err) {
      console.error('Check session error:', err);
      setError('登录失败，请重试');
    }
  };

  const fetchUserInfo = async (accessToken: string) => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(accessToken);
      
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        router.push('/dashboard');
      } else {
        setError('获取用户信息失败');
      }
    } catch (err) {
      console.error('Fetch user error:', err);
      setError('登录失败，请重试');
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
