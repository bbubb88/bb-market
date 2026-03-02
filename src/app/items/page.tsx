'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { listings, games } from '@/data/games';
import ListingCard from '@/components/ListingCard';

export default function ItemsPage() {
  const { language, t } = useI18n();
  const [selectedServer, setSelectedServer] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  
  const items = listings.filter(l => l.type === 'item');
  
  let filtered = items;
  if (selectedServer) {
    filtered = filtered.filter(l => l.server === selectedServer || l.server === 'all');
  }
  
  if (sortBy === 'price-low') {
    filtered = [...filtered].sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-high') {
    filtered = [...filtered].sort((a, b) => b.price - a.price);
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-2xl">🎁</span>
                {language === 'ko' ? '아이템 거래' : '道具交易'}
              </h1>
              <p className="text-slate-400">
                {language === 'ko' ? '안전하고 빠른 HIT2 아이템 거래' : '安全快捷的 HIT2 道具交易'}
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="flex gap-4">
              <div className="px-4 py-2 bg-slate-800/60 rounded-xl border border-slate-700/50">
                <div className="text-2xl font-bold text-violet-400">{items.length}</div>
                <div className="text-xs text-slate-500">{language === 'ko' ? '총 상품' : '商品总数'}</div>
              </div>
              <div className="px-4 py-2 bg-slate-800/60 rounded-xl border border-slate-700/50">
                <div className="text-2xl font-bold text-emerald-400">
                  {items.filter(i => i.badge === '热门' || i.badge === '限时').length}
                </div>
                <div className="text-xs text-slate-500">{language === 'ko' ? '핫 상품' : '热卖商品'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex-1 min-w-[200px]">
            <select
              value={selectedServer}
              onChange={(e) => setSelectedServer(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
            >
              <option value="">{language === 'ko' ? '전체 서버' : '全部服务器'}</option>
              {games[0].servers.slice(0, 10).map((server) => (
                <option key={server.id} value={server.id}>
                  {language === 'ko' ? server.nameKo : server.name}
                </option>
              ))}
              <option value="all">{language === 'ko' ? '전체 서버' : '全服务器'}</option>
            </select>
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
          >
            <option value="latest">{language === 'ko' ? '최신 순' : '最新发布'}</option>
            <option value="price-low">{language === 'ko' ? '가격 낮은 순' : '价格低→高'}</option>
            <option value="price-high">{language === 'ko' ? '가격 높은 순' : '价格高→低'}</option>
          </select>
        </div>

        {/* Items Grid - Enhanced */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((listing, index) => (
            <div 
              key={listing.id} 
              className="animate-fadeIn" 
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <ListingCard listing={listing} />
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-4 bg-slate-800/60 rounded-full flex items-center justify-center">
              <p className="text-4xl">📭</p>
            </div>
            <p className="text-slate-400 text-lg">{language === 'ko' ? '검색 결과가 없습니다' : '暂无商品'}</p>
            <p className="text-slate-500 text-sm mt-2">{language === 'ko' ? '다른 서버나 필터를 시도해 보세요' : '请尝试其他服务器或筛选条件'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
