'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { db } from '@/lib/supabase';

interface Listing {
  id: string;
  sellerId: string;
  seller_id?: string;
  type: string;
  title: string;
  titleKo: string | null;
  price: number;
  status: string;
  viewCount: number;
  createdAt: string;
}

export default function ListingsPage() {
  const { language, t } = useI18n();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'SELLING' | 'TRADING' | 'SOLD'>('all');
  
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : null;
  const userId = user?.id || null;

  useEffect(() => {
    if (userId) {
      loadListings();
    } else {
      setLoading(false);
    }
  }, []);

  const loadListings = async () => {
    setLoading(true);
    try {
      const { data } = await db.getListings({});
      if (data) {
        // Supabase 返回的字段是 snake_case: seller_id
        const userListings = data.filter((l: any) => 
          l.seller_id === userId || 
          l.sellerId === userId || 
          l.seller === userId
        );
        setListings(userListings);
      }
    } catch (error) {
      console.error('Failed to load listings:', error);
    }
    setLoading(false);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await db.updateListing(id, { status: newStatus });
      loadListings();
    } catch (error) {
      console.error('Failed to update:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此商品?')) return;
    try {
      await db.deleteListing(id);
      loadListings();
    } catch (error) {
      console.error('Failed to delete:', error);
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
      SOLD: { label: '已完成', color: 'bg-slate-500' },
    };
    const s = map[status] || { label: status, color: 'bg-slate-500' };
    return <span className={`px-2 py-1 text-xs rounded-full ${s.color} text-white`}>{s.label}</span>;
  };

  const filteredListings = listings.filter(l => {
    if (filter === 'all') return true;
    return l.status === filter;
  });

  const stats = {
    total: listings.length,
    selling: listings.filter(l => l.status === 'SELLING').length,
    trading: listings.filter(l => l.status === 'TRADING').length,
    sold: listings.filter(l => l.status === 'SOLD').length,
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">💰 我的挂售</h1>
            <p className="text-slate-400 mt-1">管理您发布的商品</p>
          </div>
          <Link href="/dashboard" className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">
            ← 返回用户中心
          </Link>
        </div>

        {!userId ? (
          <div className="bg-slate-800/50 rounded-2xl p-12 border border-slate-700 text-center">
            <p className="text-6xl mb-4">🔐</p>
            <h2 className="text-xl font-semibold text-white mb-2">请先登录</h2>
            <p className="text-slate-400 mb-6">登录后即可管理您的商品</p>
            <Link href="/login" className="px-6 py-3 bg-violet-600 text-white font-medium rounded-lg">
              去登录
            </Link>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-center">
                <p className="text-3xl font-bold text-white">{stats.total}</p>
                <p className="text-slate-400 text-sm">全部商品</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-center">
                <p className="text-3xl font-bold text-emerald-400">{stats.selling}</p>
                <p className="text-slate-400 text-sm">待出售</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-center">
                <p className="text-3xl font-bold text-amber-400">{stats.trading}</p>
                <p className="text-slate-400 text-sm">交易中</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-center">
                <p className="text-3xl font-bold text-slate-400">{stats.sold}</p>
                <p className="text-slate-400 text-sm">已完成</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-2">
                <button 
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium ${filter === 'all' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400'}`}
                >
                  全部
                </button>
                <button 
                  onClick={() => setFilter('SELLING')}
                  className={`px-4 py-2 rounded-lg font-medium ${filter === 'SELLING' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400'}`}
                >
                  🏪 待出售 ({stats.selling})
                </button>
                <button 
                  onClick={() => setFilter('TRADING')}
                  className={`px-4 py-2 rounded-lg font-medium ${filter === 'TRADING' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400'}`}
                >
                  🔄 交易中 ({stats.trading})
                </button>
                <button 
                  onClick={() => setFilter('SOLD')}
                  className={`px-4 py-2 rounded-lg font-medium ${filter === 'SOLD' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400'}`}
                >
                  ✅ 已完成 ({stats.sold})
                </button>
              </div>
              <Link href="/create-listing" className="px-4 py-2 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700">
                + 发布商品
              </Link>
            </div>

            {loading ? (
              <div className="bg-slate-800/50 rounded-2xl p-12 border border-slate-700 text-center">
                <p className="text-slate-400">加载中...</p>
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="bg-slate-800/50 rounded-2xl p-12 border border-slate-700 text-center">
                <p className="text-6xl mb-4">📦</p>
                <h2 className="text-xl font-semibold text-white mb-2">暂无商品</h2>
                <p className="text-slate-400 mb-6">发布您的第一个商品开始交易</p>
                <Link href="/create-listing" className="px-6 py-3 bg-violet-600 text-white font-medium rounded-lg">
                  发布商品
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredListings.map((item) => (
                  <div key={item.id} className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 hover:border-violet-500/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-slate-700 rounded-xl flex items-center justify-text-3xl">
                          {item.type === 'ACCOUNT' ? '📋' : item.type === 'ITEM' ? '🎮' : '💰'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-white font-semibold text-lg">
                              {language === 'ko' ? (item.titleKo || item.title) : item.title}
                            </h3>
                            {getStatusBadge(item.status)}
                          </div>
                          <p className="text-slate-400 text-sm">
                            浏览 {item.viewCount} • {formatDate(item.createdAt)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-violet-400">${item.price}</p>
                          <p className="text-slate-500 text-xs">USDT</p>
                        </div>
                        
                        <div className="flex gap-2">
                          <Link 
                            href={`/listing/${item.id}`}
                            className="px-3 py-2 text-sm bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                          >
                            查看
                          </Link>
                          {item.status === 'SELLING' && (
                            <button 
                              onClick={() => handleStatusChange(item.id, 'TRADING')}
                              className="px-3 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                            >
                              开始交易
                            </button>
                          )}
                          {item.status === 'TRADING' && (
                            <button 
                              onClick={() => handleStatusChange(item.id, 'SOLD')}
                              className="px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                            >
                              完成
                            </button>
                          )}
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="px-3 py-2 text-sm bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/40"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
