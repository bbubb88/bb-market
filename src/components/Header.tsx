'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { Language } from '@/types';

export default function Header() {
  const { language, setLanguage, t } = useI18n();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [currency, setCurrency] = useState('USDT');

  const currencies = [
    { id: 'USDT', symbol: '$', name: 'USDT' },
    { id: 'TWD', symbol: 'NT$', name: '台币' },
    { id: 'KRW', symbol: '₩', name: '韩元' },
  ] as const;

  // Store currency in localStorage for global access
  if (typeof window !== 'undefined') {
    window.localStorage?.setItem('bbmarket-currency', currency);
  }

  const navItems = [
    { key: 'home', href: '/' },
    { key: 'dashboard', href: '/dashboard', label: '用户中心' },
    { key: 'create-listing', href: '/create-listing', label: '卖家中心' },
    { key: 'help', href: '/help' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="BB Market" className="h-10" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all duration-200"
              >
                {t(`nav.${item.key}`)}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <span>{language === 'zh-TW' ? '中文' : '한국어'}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isLangOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-slate-800 rounded-lg shadow-xl border border-slate-700 py-1">
                  <button
                    onClick={() => { setLanguage('zh-TW'); setIsLangOpen(false); }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-700 ${language === 'zh-TW' ? 'text-violet-400' : 'text-slate-300'}`}
                  >
                    中文
                  </button>
                  <button
                    onClick={() => { setLanguage('ko'); setIsLangOpen(false); }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-700 ${language === 'ko' ? 'text-violet-400' : 'text-slate-300'}`}
                  >
                    한국어
                  </button>
                </div>
              )}
            </div>

            {/* Currency Selector */}
            <button
              onClick={() => {
                const idx = currencies.findIndex(c => c.id === currency);
                const next = currencies[(idx + 1) % currencies.length];
                setCurrency(next.id);
              }}
              className="flex items-center gap-1 px-3 py-2 text-sm text-slate-300 hover:text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <span>{currencies.find(c => c.id === currency)?.symbol}</span>
              <span>{currency}</span>
            </button>

            {/* Buy & Sell Buttons */}
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/select-game"
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
              >
                {language === 'ko' ? '구매' : '购买'}
              </Link>
              <Link
                href="/create-listing"
                className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
              >
                {language === 'ko' ? '판매' : '挂售'}
              </Link>
            </div>

            {/* Login Button */}
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              {t('nav.login')}
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-slate-300 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-slate-800">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
              >
                {t(`nav.${item.key}`)}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
