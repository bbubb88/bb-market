'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

export default function LoginPage() {
  const { language } = useI18n();
  const [step, setStep] = useState<'select' | 'email'>('select');

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

        {step === 'select' && (
          <>
            {/* Login Options */}
            <div className="space-y-4">
              {/* Discord Login */}
              <button
                onClick={() => setStep('email')}
                className="w-full p-4 bg-[#5865F2] hover:bg-[#4752C4] rounded-xl transition-colors"
              >
                <div className="flex items-center justify-center gap-3">
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="white">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  <div className="text-left">
                    <p className="text-white font-semibold text-lg">
                      {language === 'ko' ? 'Discord로 시작' : 'Discord 登录'}
                    </p>
                    <p className="text-white/70 text-sm">
                      {language === 'ko' ? '로그인 후 이메일 연결' : '登录后绑定邮箱'}
                    </p>
                  </div>
                </div>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-slate-700"></div>
                <span className="text-slate-500 text-sm">或</span>
                <div className="flex-1 h-px bg-slate-700"></div>
              </div>

              {/* Email Register */}
              <button
                onClick={() => setStep('email')}
                className="w-full p-4 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">📧</span>
                  <div className="text-left">
                    <p className="text-white font-semibold text-lg">
                      {language === 'ko' ? '이메일로 가입' : '邮箱注册'}
                    </p>
                    <p className="text-slate-400 text-sm">
                      {language === 'ko' ? '이메일로 계정 만들기' : '用邮箱创建账号'}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </>
        )}

        {step === 'email' && (
          <div className="space-y-4">
            <div className="p-4 bg-violet-900/30 border border-violet-500/30 rounded-xl">
              <p className="text-white font-medium mb-2">📧 邮箱注册/绑定</p>
              <p className="text-slate-400 text-sm">
                输入您的邮箱，后续可以绑定 Discord 账号
              </p>
            </div>
            
            <input
              type="email"
              placeholder="your@email.com"
              className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
            
            <input
              type="password"
              placeholder="设置密码"
              className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />

            <button className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors">
              {language === 'ko' ? '계정 생성' : '创建账号'}
            </button>
            
            <button
              onClick={() => setStep('select')}
              className="w-full py-3 text-slate-400 hover:text-white transition-colors"
            >
              ← 返回
            </button>
          </div>
        )}

        {/* Terms */}
        <p className="text-center text-slate-500 text-sm mt-6">
          {language === 'ko' 
            ? 'ログインすると，利用規約に同意したことになります'
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
