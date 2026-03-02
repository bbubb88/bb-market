'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';

export default function RegisterPage() {
  const { language } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      setError('密码长度至少6位');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '注册失败，请稍后重试');
        return;
      }

      // 注册成功
      setSuccess(true);
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 注册成功提示
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <span className="text-6xl">✅</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">
            {language === 'ko' ? '회원가입 완료' : '注册成功'}
          </h1>
          <p className="text-slate-400 mb-8">
            {language === 'ko' 
              ? '입력한 이메일로 인증 메일을 보냈습니다. 이메일을 확인해 주세요.' 
              : '我们已向您的邮箱发送了验证邮件，请查收并点击链接完成验证。'}
          </p>
          <Link 
            href="/login" 
            className="inline-block py-4 px-8 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors"
          >
            {language === 'ko' ? '로그인 하러가기' : '去登录'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.svg" alt="BB Market" className="h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white">
            {language === 'ko' ? '회원가입' : '注册'}
          </h1>
          <p className="text-slate-400 mt-2">
            {language === 'ko' ? 'BB Market에 오신 것을 환영합니다' : '欢迎来到 BB Market'}
          </p>
        </div>

        {/* Register Form */}
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleRegister}>
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
              placeholder="设置密码（至少6位）"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 mb-3"
              required
              minLength={6}
              autoComplete="new-password"
            />

            <input
              type="password"
              placeholder="确认密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 mb-4"
              required
              minLength={6}
              autoComplete="new-password"
            />

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
            >
              {loading ? '处理中...' : (language === 'ko' ? '회원가입' : '创建账号')}
            </button>
          </form>
        </div>

        {/* Login Link */}
        <p className="text-center text-slate-400 text-sm mt-6">
          {language === 'ko' 
            ? '이미 계정이 있으신가요?' : '已有账号？'}
          <Link href="/login" className="text-violet-400 hover:text-violet-300 ml-1">
            {language === 'ko' ? '로그인' : '立即登录'}
          </Link>
        </p>

        {/* Terms */}
        <p className="text-center text-slate-500 text-sm mt-6">
          {language === 'ko' 
            ? '회원가입하면，利用規約에 동의합니다'
            : '注册即表示同意我们的服务条款'}
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
