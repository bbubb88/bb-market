'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  titleKo?: string | null;
  description?: string | null;
  descriptionKo?: string | null;
  price: number;
  originalPrice?: number; // 原价，用于折扣显示
  level?: number | null;
  amount?: number | null;
  stock?: number | null; // 库存数量
  images: string[];
  badge?: string | null;
  server?: string;
  serverId?: string | null;
  status?: string;
  createdAt?: string;
  seller?: string;
}

interface ListingCardProps {
  listing: ListingData;
}

export default function ListingCard({ listing }: ListingCardProps) {
  const { language, t } = useI18n();
  const [currency, setCurrency] = useState('USDT');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setCurrency(getCurrency());
    const handleStorage = () => setCurrency(getCurrency());
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(() => setCurrency(getCurrency()), 500);
    
    // Check login status
    const token = localStorage.getItem('access_token');
    setIsLoggedIn(!!token);
    
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  const handleBuyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      router.push('/login?redirect=' + encodeURIComponent(`/listing/${listing.id}`));
      return;
    }
    router.push(`/listing/${listing.id}`);
  };

  // 加入购物车
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const cartItem = {
      id: `cart-${listing.id}-${Date.now()}`,
      listingId: listing.id,
      title: listing.title,
      titleKo: listing.titleKo || null,
      price: listing.price,
      image: listing.images?.[0] || '📦',
      type: listing.type,
      quantity: 1,
      addedAt: new Date().toISOString(),
    };
    
    // 从localStorage获取现有购物车
    const existingCart = localStorage.getItem('bbmarket_cart');
    const cart = existingCart ? JSON.parse(existingCart) : [];
    
    // 检查是否已存在
    const existingIndex = cart.findIndex((item: any) => item.listingId === listing.id);
    if (existingIndex >= 0) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push(cartItem);
    }
    
    localStorage.setItem('bbmarket_cart', JSON.stringify(cart));
    
    // 提示成功
    alert(language === 'ko' ? '장바구니에 추가되었습니다!' : '已加入购物车！');
  };

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
  const originalPrice = listing.originalPrice ? formatPrice(listing.originalPrice, currency) : null;
  const discount = listing.originalPrice && listing.originalPrice > listing.price 
    ? Math.round((1 - listing.price / listing.originalPrice) * 100) 
    : null;
  
  const type = listing.type?.toUpperCase() || 'ACCOUNT';

  // 库存状态
  const stock = listing.stock ?? listing.amount;
  const stockStatus = stock === null || stock === undefined 
    ? null 
    : stock > 100 
      ? { label: '充足', labelKo: '충분', color: 'text-emerald-400', bg: 'bg-emerald-500/20' }
      : stock > 10 
        ? { label: '有货', labelKo: '재고 있음', color: 'text-amber-400', bg: 'bg-amber-500/20' }
        : { label: '紧张', labelKo: '재고 부족', color: 'text-red-400', bg: 'bg-red-500/20' };

  return (
    <Link href={`/listing/${listing.id}`}>
      <div className="group bg-slate-800/80 rounded-2xl overflow-hidden border border-slate-700/50 hover:border-violet-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/10 hover:-translate-y-1 cursor-pointer h-full flex flex-col">
        {/* Image */}
        <div className="relative h-44 bg-gradient-to-br from-violet-600/20 to-cyan-600/20 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-500/10 to-transparent" />
          <span className="text-6xl transform group-hover:scale-110 transition-transform duration-300">
            {listing.images?.[0] || '📦'}
          </span>
          
          {/* Badge - Top Left */}
          {listing.badge && (
            <span className="absolute top-3 left-3 px-3 py-1 text-xs font-semibold bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full shadow-lg">
              {listing.badge}
            </span>
          )}
          
          {/* Discount Badge - Top Right */}
          {discount && (
            <span className="absolute top-3 right-3 px-3 py-1 text-xs font-bold bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full shadow-lg">
              -{discount}%
            </span>
          )}
          
          {/* Type Badge - Bottom Left */}
          <span className="absolute bottom-3 left-3 px-3 py-1 text-xs font-medium bg-slate-900/80 text-slate-300 rounded-full capitalize backdrop-blur-sm border border-slate-700/50">
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
              <span className="px-2.5 py-1 text-xs bg-slate-700/80 text-slate-300 rounded-lg backdrop-blur-sm border border-slate-600/30">
                {language === 'ko' ? '레벨' : '等级'}: {listing.level}
              </span>
            )}
            {listing.amount && (
              <span className="px-2.5 py-1 text-xs bg-slate-700/80 text-slate-300 rounded-lg backdrop-blur-sm border border-slate-600/30">
                {language === 'ko' ? '수량' : '数量'}: {listing.amount >= 10000 ? `${(listing.amount / 10000).toFixed(0)}万` : listing.amount.toLocaleString()}
              </span>
            )}
            {/* Stock Status */}
            {stockStatus && (
              <span className={`px-2.5 py-1 text-xs rounded-lg backdrop-blur-sm border ${stockStatus.bg} ${stockStatus.color} border-current/20`}>
                {language === 'ko' ? stockStatus.labelKo : stockStatus.label}
              </span>
            )}
          </div>

          {/* Price & Action */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
            <div className="flex flex-col">
              {originalPrice && (
                <span className="text-sm text-slate-500 line-through">
                  {originalPrice}
                </span>
              )}
              <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
                {displayPrice}
              </span>
            </div>
            <div className="flex gap-2">
              <button 
                className="px-3 py-2.5 text-lg bg-slate-700 hover:bg-slate-600 rounded-xl transition-all"
                onClick={handleAddToCart}
                title={language === 'ko' ? '장바구니에 추가' : '加入购物车'}
              >
                🛒
              </button>
              <button 
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-600/20 hover:shadow-violet-500/40 active:scale-95"
                onClick={handleBuyClick}
              >
                {language === 'ko' ? '구매' : '购买'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
