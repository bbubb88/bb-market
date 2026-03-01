'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import Link from 'next/link';

// Currency rates
const exchangeRates: Record<string, number> = {
  USDT: 1,
  TWD: 32.5,
  KRW: 1350,
};

const currencySymbols: Record<string, string> = {
  USDT: '$',
  TWD: 'NT$',
  KRW: '₩',
};

function getCurrency(): string {
  if (typeof window === 'undefined') return 'USDT';
  return (window.localStorage?.getItem('bbmarket-currency') as string) || 'USDT';
}

function formatPrice(usdtPrice: number, currency: string): string {
  const rate = exchangeRates[currency] || 1;
  const converted = usdtPrice * rate;
  
  if (currency === 'USDT') {
    return `$${converted.toFixed(2)}`;
  } else if (currency === 'TWD') {
    return `NT$${Math.round(converted).toLocaleString()}`;
  } else if (currency === 'KRW') {
    return `₩${Math.round(converted).toLocaleString()}`;
  }
  return `$${converted.toFixed(2)}`;
}

// 支持两种数据格式：数据库格式和静态数据格式
interface ListingData {
  id: string | number;
  type: string;
  title: string;
  titleKo: string | null;
  description: string | null;
  descriptionKo: string | null;
  price: number;
  level: number | null;
  amount: number | null;
  images: string[];
  badge: string | null;
  server?: string;
  serverId?: string | null;
  status?: string;
  createdAt?: string;
}

interface ListingCardProps {
  listing: ListingData;
}

export default function ListingCard({ listing }: ListingCardProps) {
  const { language, t } = useI18n();
  const [currency, setCurrency] = useState('USDT');

  useEffect(() => {
    setCurrency(getCurrency());
    const handleStorage = () => setCurrency(getCurrency());
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(() => setCurrency(getCurrency()), 500);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  const title = language === 'ko' ? listing.titleKo : listing.title;
  const description = language === 'ko' ? listing.descriptionKo : listing.description;
  
  const typeLabels: Record<string, { zh: string; ko: string }> = {
    ACCOUNT: { zh: '账号', ko: '계정' },
    ITEM: { zh: '道具', ko: '아이템' },
    COIN: { zh: '游戏币', ko: '게임화폐' },
    account: { zh: '账号', ko: '계정' },
    item: { zh: '道具', ko: '아이템' },
    coin: { zh: '游戏币', ko: '게임화폐' },
  };

  const displayPrice = formatPrice(listing.price, currency);
  const type = listing.type?.toUpperCase() || 'ACCOUNT';

  return (
    <Link href={`/listing/${listing.id}`}>
      <div className="group bg-slate-800/60 rounded-xl overflow-hidden border border-slate-700 hover:border-violet-500 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/10 hover:-translate-y-2 cursor-pointer h-full flex flex-col">
        {/* Image */}
        <div className="relative h-44 bg-gradient-to-br from-violet-600/20 to-cyan-600/20 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-500/10 to-transparent" />
          <span className="text-6xl transform group-hover:scale-110 transition-transform duration-300">
            {listing.images?.[0] || '📦'}
          </span>
          
          {listing.badge && (
            <span className="absolute top-3 left-3 px-3 py-1 text-xs font-semibold bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full shadow-lg">
              {listing.badge}
            </span>
          )}
          
          <span className="absolute top-3 right-3 px-3 py-1 text-xs font-medium bg-slate-900/80 text-slate-300 rounded-full capitalize backdrop-blur-sm">
            {language === 'ko' ? typeLabels[type]?.ko : typeLabels[type]?.zh}
          </span>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="text-white font-semibold mb-2 line-clamp-1 group-hover:text-violet-400 transition-colors">
            {title}
          </h3>
          <p className="text-slate-400 text-sm mb-4 line-clamp-2 flex-1">
            {description}
          </p>

          {/* Meta */}
          <div className="flex flex-wrap gap-2 mb-4">
            {listing.level && (
              <span className="px-2.5 py-1 text-xs bg-slate-700/80 text-slate-300 rounded-lg backdrop-blur-sm">
                {language === 'ko' ? '레벨' : '等级'}: {listing.level}
              </span>
            )}
            {listing.amount && (
              <span className="px-2.5 py-1 text-xs bg-slate-700/80 text-slate-300 rounded-lg backdrop-blur-sm">
                {language === 'ko' ? '수량' : '数量'}: {listing.amount >= 10000 ? `${(listing.amount / 10000).toFixed(0)}万` : listing.amount.toLocaleString()}
              </span>
            )}
          </div>

          {/* Price & Action */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
            <div>
              <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">{displayPrice}</span>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-purple-600 rounded-lg hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-600/20">
              {language === 'ko' ? '구매' : '购买'}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
