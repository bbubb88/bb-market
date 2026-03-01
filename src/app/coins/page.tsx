'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { listings, games } from '@/data/games';
import ListingCard from '@/components/ListingCard';

export default function CoinsPage() {
  const { language, t } = useI18n();
  const [selectedServer, setSelectedServer] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  
  const coins = listings.filter(l => l.type === 'coin');
  
  let filtered = coins;
  if (selectedServer) {
    filtered = filtered.filter(l => l.server === selectedServer);
  }
  
  if (sortBy === 'price-low') {
    filtered = [...filtered].sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-high') {
    filtered = [...filtered].sort((a, b) => b.price - a.price);
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            {language === 'ko' ? '골드 거래' : '游戏币交易'}
          </h1>
          <p className="text-slate-400">
            {language === 'ko' ? '안전하고 빠른 HIT2 골드 거래' : '安全快捷的 HIT2 游戏币交易'}
          </p>
        </div>

        <div className="flex flex-wrap gap-4 mb-8">
          <select
            value={selectedServer}
            onChange={(e) => setSelectedServer(e.target.value)}
            className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
          >
            <option value="">{language === 'ko' ? '전체 서버' : '全部服务器'}</option>
            {games[0].servers.map((server) => (
              <option key={server.id} value={server.id}>
                {language === 'ko' ? server.nameKo : server.name}
              </option>
            ))}
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
          >
            <option value="latest">{language === 'ko' ? '최신 순' : '最新发布'}</option>
            <option value="price-low">{language === 'ko' ? '가격 낮은 순' : '价格低→高'}</option>
            <option value="price-high">{language === 'ko' ? '가격 높은 순' : '价格高→低'}</option>
          </select>
        </div>

        {/* Price Info */}
        <div className="bg-gradient-to-r from-amber-600/20 to-yellow-600/20 rounded-xl p-4 mb-8 border border-amber-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">{language === 'ko' ? '오늘의 시세' : '今日行情'}</p>
              <p className="text-2xl font-bold text-amber-400">1M GOLD = $8-10 USDT</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm">{language === 'ko' ? '변화' : '变化'}</p>
              <p className="text-emerald-400">+2.5%</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <p className="text-4xl mb-4">📭</p>
            <p>{language === 'ko' ? '검색 결과가 없습니다' : '暂无商品'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
