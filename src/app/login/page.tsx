'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';

export default function LoginPage() {
  const { language } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '登录失败');
        return;
      }

      // 保存 token
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // 跳转到用户中心
      router.push('/dashboard');
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.svg" alt="BB Market" className="h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white">
            {language === 'ko' ? '로그인' : '登录'}
          </h1>
          <p className="text-slate-400 mt-2">
            {language === 'ko' ? 'BB Market에 오신 것을 환영합니다' : '欢迎来到 BB Market'}
          </p>
        </div>

        {/* Login Form */}
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 mb-3"
              required
              autoComplete="email"
            />
            
            <input
              type="password"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 mb-4"
              required
              minLength={6}
              autoComplete="current-password"
            />

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
            >
              {loading ? '处理中...' : '登录'}
            </button>
          </form>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mt-6">
          <div className="flex-1 h-px bg-slate-700"></div>
          <span className="text-slate-500 text-sm">或</span>
          <div className="flex-1 h-px bg-slate-700"></div>
        </div>

        {/* Discord Login */}
        <button
          onClick={() => alert('Discord 登录功能即将上线')}
          className="w-full mt-6 p-4 bg-[#5865F2] hover:bg-[#4752C4] rounded-xl transition-colors"
        >
          <div className="flex items-center justify-center gap-3">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="white">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            <span className="text-white font-semibold text-lg">
              {language === 'ko' ? 'Discord로 시작' : 'Discord 登录'}
            </span>
          </div>
        </button>

        {/* Register Link */}
        <p className="text-center text-slate-400 text-sm mt-6">
          {language === 'ko' 
            ? '계정이 없나요?' : '没有账号？'}
          <Link href="/register" className="text-violet-400 hover:text-violet-300 ml-1">
            {language === 'ko' ? '회원가입' : '立即注册'}
          </Link>
        </p>

        {/* Terms */}
        <p className="text-center text-slate-500 text-sm mt-6">
          {language === 'ko' 
            ? '로그インすると，利用規約に同意したことになります'
            : '登录即表示同意我们的服务条款'}
        </p>

        {/* Back */}
        <div className="text-center mt-6">
          <Link href="/" className="text-violet-400 hover:text-violet-300 text-sm">
            ← {language === 'ko' ? '메인으로 돌아가기' : '返回首页'}
          </Link>
        </div>
      </div>
    </div>
  );
}
