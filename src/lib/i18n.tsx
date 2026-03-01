'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language } from '@/types';

type TranslationKey = string;

interface Translations {
  [key: string]: {
    [lang in Language]: string;
  };
}

const translations: Translations = {
  // Navigation
  'nav.home': { 'zh-TW': '首页', 'ko': '홈' },
  'nav.hit2': { 'zh-TW': 'HIT2', 'ko': 'HIT2' },
  'nav.accounts': { 'zh-TW': '账号', 'ko': '계정' },
  'nav.items': { 'zh-TW': '道具', 'ko': '아이템' },
  'nav.coins': { 'zh-TW': '游戏币', 'ko': '골드' },
  'nav.help': { 'zh-TW': '帮助', 'ko': '고객센터' },
  'nav.login': { 'zh-TW': '登录', 'ko': '로그인' },
  'nav.selectGame': { 'zh-TW': '选择游戏', 'ko': '게임 선택' },
  'nav.dashboard': { 'zh-TW': '用户中心', 'ko': '마이페이지' },
  'nav.create-listing': { 'zh-TW': '卖家中心', 'ko': '판매센터' },
  
  // Select Game Page
  'selectGame.title': { 'zh-TW': '选择游戏', 'ko': '게임 선택' },
  'selectGame.desc': { 'zh-TW': '选择您要交易的游戏', 'ko': '거래할 게임을 선택하세요' },
  'selectGame.coming': { 'zh-TW': '即将上线', 'ko': '업데이트 예정' },
  
  // Hero
  'hero.title': { 'zh-TW': 'BB Market', 'ko': 'BB Market' },
  'hero.subtitle': { 'zh-TW': '游戏道具交易平台', 'ko': '게임 아이템 거래 플랫폼' },
  'hero.desc': { 'zh-TW': '安全交易 · 快速到账 · 诚信保障', 'ko': '안전 거래 · 빠른 입금 · 신뢰 보장' },
  'hero.buy': { 'zh-TW': '购买', 'ko': '구매' },
  'hero.sell': { 'zh-TW': '挂售', 'ko': '판매' },
  'hero.free': { 'zh-TW': '免费', 'ko': '무료' },
  
  // Search
  'search.placeholder': { 'zh-TW': '搜索商品...', 'ko': '상품 검색...' },
  'search.btn': { 'zh-TW': '搜索', 'ko': '검색' },
  'search.selectServer': { 'zh-TW': '选择服务器', 'ko': '서버 선택' },
  'search.selectType': { 'zh-TW': '选择类型', 'ko': '유형 선택' },
  
  // Games
  'games.title': { 'zh-TW': '游戏专区', 'ko': '게임专区' },
  'games.hit2.desc': { 'zh-TW': '账号 | 道具 | 游戏币', 'ko': '계정 | 아이템 | 골드' },
  'games.coming': { 'zh-TW': '即将上线', 'ko': '업데이트 예정' },
  'games.coming.desc': { 'zh-TW': '更多游戏，敬请期待', 'ko': '더 많은 게임,敬请期待' },
  
  // Categories
  'category.accounts': { 'zh-TW': '账号交易', 'ko': '계정 거래' },
  'category.accounts.desc': { 'zh-TW': '买卖游戏账号', 'ko': '게임 계정 매매' },
  'category.items': { 'zh-TW': '道具交易', 'ko': '아이템 거래' },
  'category.items.desc': { 'zh-TW': '装备、材料、时装', 'ko': '장비, 재료, 의상' },
  'category.coins': { 'zh-TW': '游戏币交易', 'ko': '골드 거래' },
  'category.coins.desc': { 'zh-TW': '游戏金币买卖', 'ko': '게임 골드 매매' },
  
  // Trading
  'trading.title': { 'zh-TW': '热门商品', 'ko': '인기 상품' },
  'trading.accounts': { 'zh-TW': '账号', 'ko': '계정' },
  'trading.items': { 'zh-TW': '道具', 'ko': '아이템' },
  'trading.coins': { 'zh-TW': '游戏币', 'ko': '골드' },
  'trading.level': { 'zh-TW': '等级', 'ko': '레벨' },
  'trading.server': { 'zh-TW': '服务器', 'ko': '서버' },
  'trading.amount': { 'zh-TW': '数量', 'ko': '수량' },
  'trading.buy': { 'zh-TW': '购买', 'ko': '구매' },
  'trading.noResults': { 'zh-TW': '暂无商品', 'ko': '검색 결과 없음' },
  
  // Features
  'features.title': { 'zh-TW': '为什么选择我们', 'ko': '왜 우리를 선택하세요' },
  'features.security.title': { 'zh-TW': '安全保障', 'ko': '안전 보장' },
  'features.security.desc': { 'zh-TW': '资金担保交易，安全无忧', 'ko': '자금 보호 거래, 안심하세요' },
  'features.fast.title': { 'zh-TW': '快速交易', 'ko': '빠른 거래' },
  'features.fast.desc': { 'zh-TW': '即时交易，快速到账', 'ko': '즉시 거래, 빠른 입금' },
  'features.support.title': { 'zh-TW': '客服支持', 'ko': '고객 지원' },
  'features.support.desc': { 'zh-TW': '7x24小时在线客服', 'ko': '7x24시간 온라인 고객센터' },
  'features.usdt.title': { 'zh-TW': 'USDT支付', 'ko': 'USDT 결제' },
  'features.usdt.desc': { 'zh-TW': '支持USDT安全支付', 'ko': 'USDT 안전 결제 지원' },
  
  // How it works
  'how.title': { 'zh-TW': '交易流程', 'ko': '거래 과정' },
  'how.step1.title': { 'zh-TW': '注册账号', 'ko': '회원가입' },
  'how.step1.desc': { 'zh-TW': '快速注册账号', 'ko': '빠르게 회원가입' },
  'how.step2.title': { 'zh-TW': '选择商品', 'ko': '상품 선택' },
  'how.step2.desc': { 'zh-TW': '浏览热门商品', 'ko': '인기 상품 탐색' },
  'how.step3.title': { 'zh-TW': 'USDT支付', 'ko': 'USDT 결제' },
  'how.step3.desc': { 'zh-TW': '完成支付', 'ko': '결제 완료' },
  'how.step4.title': { 'zh-TW': '完成交易', 'ko': '거래 완료' },
  'how.step4.desc': { 'zh-TW': '快速获得商品', 'ko': '빠르게 상품 획득' },
  
  // Footer
  'footer.about': { 'zh-TW': '专业的游戏账号道具交易平台', 'ko': '전문 게임 계정 아이템 거래 플랫폼' },
  'footer.links': { 'zh-TW': '快速链接', 'ko': '빠른 링크' },
  'footer.help': { 'zh-TW': '帮助中心', 'ko': '고객센터' },
  'footer.terms': { 'zh-TW': '服务条款', 'ko': '이용약관' },
  'footer.privacy': { 'zh-TW': '隐私政策', 'ko': '개인정보처리방침' },
  'footer.contact': { 'zh-TW': '联系我们', 'ko': '联系我们' },
  'footer.copyright': { 'zh-TW': '© 2026 BB Market. All rights reserved.', 'ko': '© 2026 BB Market. All rights reserved.' },
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('zh-TW');

  useEffect(() => {
    const saved = localStorage.getItem('bbmarket-language') as Language;
    if (saved && (saved === 'zh-TW' || saved === 'ko')) {
      setLanguage(saved);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('bbmarket-language', lang);
  };

  const t = (key: TranslationKey): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
