'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

interface Listing {
  id: string;
  type: string;
  title: string;
  titleKo: string | null;
  price: number;
  status: string;
  images: string[];
  viewCount: number;
  createdAt: string;
}

interface Favorite {
  id: string;
  listingId: string;
  listing?: Listing;
}

export default function FavoritesPage() {
  const { language, t } = useI18n();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : null;
  const userId = user?.id || null;

  // 使用 localStorage 作为收藏夹存储
  const getStoredFavorites = (): string[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('bbmarket-favorites');
    return stored ? JSON.parse(stored) : [];
  };

  const setStoredFavorites = (favoriteIds: string[]) => {
    localStorage.setItem('bbmarket-favorites', JSON.stringify(favoriteIds));
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    
    try {
      // 尝试从 API 获取
      const res = await fetch(`/api/favorites?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setFavorites(data);
          // 获取收藏的商品详情
          const listingIds = data.map((f: Favorite) => f.listingId);
          await loadListings(listingIds);
          setLoading(false);
          return;
        }
      }
    } catch (error) {
      console.log('API not available, using localStorage');
    }
    
    // 使用 localStorage 作为后备
    const storedFavorites = getStoredFavorites();
    if (storedFavorites.length > 0) {
      await loadListings(storedFavorites);
    }
    
    setLoading(false);
  };

  const loadListings = async (ids: string[]) => {
    try {
      // 从 supabase 获取商品
      const { db } = await import('@/lib/supabase');
      const { data } = await db.getListings({});
      if (data) {
        const favoriteListings = data.filter((l: Listing) => ids.includes(String(l.id)));
        setListings(favoriteListings);
      }
    } catch (error) {
      console.error('Failed to load listings:', error);
    }
  };

  const removeFavorite = async (listingId: string) => {
    // 从 localStorage 移除
    const stored = getStoredFavorites();
    const updated = stored.filter(id => id !== listingId);
    setStoredFavorites(updated);
    setListings(prev => prev.filter(l => String(l.id) !== listingId));

    // 尝试从 API 移除
    if (userId) {
      try {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, listingId, action: 'remove' }),
        });
      } catch (error) {
        console.log('API not available');
      }
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('zh-TW', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  });

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      SELLING: { label: '待售中', color: 'bg-emerald-500' },
      TRADING: { label: '交易中', color: 'bg-amber-500' },
      SOLD: { label: '已售出', color: 'bg-slate-500' },
    };
    const s = map[status] || { label: status, color: 'bg-slate-500' };
    return <span className={`px-2 py-1 text-xs rounded-full ${s.color} text-white`}>{s.label}</span>;
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">⭐ 收藏夹</h1>
            <p className="text-slate-400 mt-1">您收藏的商品</p>
          </div>
          <Link href="/dashboard" className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">
            ← 返回用户中心
          </Link>
        </div>

        {!userId ? (
          <div className="bg-slate-800/50 rounded-2xl p-12 border border-slate-700 text-center">
            <p className="text-6xl mb-4">🔐</p>
            <h2 className="text-xl font-semibold text-white mb-2">请先登录</h2>
            <p className="text-slate-400 mb-6">登录后即可查看收藏的商品</p>
            <Link href="/login" className="px-6 py-3 bg-violet-600 text-white font-medium rounded-lg">
              去登录
            </Link>
          </div>
        ) : loading ? (
          <div className="bg-slate-800/50 rounded-2xl p-12 border border-slate-700 text-center">
            <p className="text-slate-400">加载中...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-slate-800/50 rounded-2xl p-12 border border-slate-700 text-center">
            <p className="text-6xl mb-4">⭐</p>
            <h2 className="text-xl font-semibold text-white mb-2">暂无收藏</h2>
            <p className="text-slate-400 mb-6">浏览商品并收藏您喜欢的</p>
            <Link href="/select-game" className="px-6 py-3 bg-violet-600 text-white font-medium rounded-lg">
              去浏览
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((item) => (
              <div key={item.id} className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden hover:border-violet-500/50 transition-colors">
                <Link href={`/listing/${item.id}`}>
                  <div className="aspect-video bg-slate-700 relative">
                    {item.images && item.images.length > 0 ? (
                      <img 
                        src={item.images[0]} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">
                        {item.type === 'ACCOUNT' ? '📋' : item.type === 'ITEM' ? '🎮' : '💰'}
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(item.status)}
                    </div>
                  </div>
                </Link>
                
                <div className="p-4">
                  <Link href={`/listing/${item.id}`}>
                    <h3 className="text-white font-semibold text-lg mb-2 hover:text-violet-400 transition-colors">
                      {language === 'ko' ? (item.titleKo || item.title) : item.title}
                    </h3>
                  </Link>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-violet-400">${item.price}</p>
                      <p className="text-slate-500 text-xs">USDT</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => removeFavorite(String(item.id))}
                        className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/40 transition-colors"
                        title="取消收藏"
                      >
                        ❤️
                      </button>
                      <Link 
                        href={`/listing/${item.id}`}
                        className="px-3 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                      >
                        查看
                      </Link>
                    </div>
                  </div>
                  
                  <p className="text-slate-500 text-xs mt-3">
                    浏览 {item.viewCount} • {formatDate(item.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
