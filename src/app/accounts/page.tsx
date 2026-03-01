'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { listings, games } from '@/data/games';
import ListingCard from '@/components/ListingCard';

export default function AccountsPage() {
  const { language, t } = useI18n();
  const [selectedServer, setSelectedServer] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  
  const accounts = listings.filter(l => l.type === 'account');
  
  let filtered = accounts;
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            {language === 'ko' ? '계정 거래' : '账号交易'}
          </h1>
          <p className="text-slate-400">
            {language === 'ko' ? '안전하고 빠른 HIT2 계정 거래' : '安全快捷的 HIT2 账号交易'}
          </p>
        </div>

        {/* Filters */}
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

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="text-2xl font-bold text-violet-400">{filtered.length}</div>
            <div className="text-slate-400 text-sm">{language === 'ko' ? '등록된 계정' : '在售账号'}</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="text-2xl font-bold text-emerald-400">100+</div>
            <div className="text-slate-400 text-sm">{language === 'ko' ? '오늘 거래' : '今日成交'}</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="text-2xl font-bold text-cyan-400">500+</div>
            <div className="text-slate-400 text-sm">{language === 'ko' ? '총 거래' : '总交易量'}</div>
          </div>
        </div>

        {/* Grid */}
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
