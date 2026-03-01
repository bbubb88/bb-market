'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { db } from '@/lib/supabase';
import ListingCard from '@/components/ListingCard';

interface Listing {
  id: string;
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
  serverId: string | null;
  status: string;
  createdAt: string;
}

export default function Home() {
  const { language, t } = useI18n();
  const [activeTab, setActiveTab] = useState<'accounts' | 'items' | 'coins'>('accounts');
  const [sortBy, setSortBy] = useState('latest');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadListings();
  }, [activeTab, sortBy]);

  const loadListings = async () => {
    setLoading(true);
    try {
      const typeMap = {
        accounts: 'ACCOUNT',
        items: 'ITEM', 
        coins: 'COIN'
      };
      
      const { data } = await db.getListings({ 
        type: typeMap[activeTab],
        status: 'SELLING'
      });
      
      if (data) {
        let sorted = [...data];
        if (sortBy === 'price-low') {
          sorted = sorted.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'price-high') {
          sorted = sorted.sort((a, b) => b.price - a.price);
        } else {
          sorted = sorted.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        setListings(sorted);
      }
    } catch (error) {
      console.error('Failed to load listings:', error);
    }
    setLoading(false);
  };

  // Get hot keywords
  const hotKeywords = ['满级装备', '稀有坐骑', '强化石', '钻石批发', '时装礼包'];

  // Get latest listings for trade news
  const latestListings = [...listings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const features = [
    {
      icon: '🛡️',
      titleKey: 'features.security.title',
      descKey: 'features.security.desc',
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      icon: '⚡',
      titleKey: 'features.fast.title',
      descKey: 'features.fast.desc',
      gradient: 'from-blue-500 to-indigo-600',
    },
    {
      icon: '💬',
      titleKey: 'features.support.title',
      descKey: 'features.support.desc',
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      icon: '💰',
      titleKey: 'features.usdt.title',
      descKey: 'features.usdt.desc',
      gradient: 'from-violet-500 to-purple-600',
    },
  ];

  const steps = [
    { num: '1', titleKey: 'how.step1.title', descKey: 'how.step1.desc', icon: '📝' },
    { num: '2', titleKey: 'how.step2.title', descKey: 'how.step2.desc', icon: '🔍' },
    { num: '3', titleKey: 'how.step3.title', descKey: 'how.step3.desc', icon: '💳' },
    { num: '4', titleKey: 'how.step4.title', descKey: 'how.step4.desc', icon: '✅' },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-[500px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/30 via-transparent to-transparent" />
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-violet-400 via-cyan-400 to-violet-400 bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient">
            BB Market
          </h1>
          <p className="text-xl md:text-2xl text-white font-medium mb-3">
            {t('hero.subtitle')}
          </p>
          <p className="text-base text-slate-400 mb-8">
            {t('hero.desc')}
          </p>
          
          {/* HIT2 Quick Link */}
          <div className="mb-8">
            <Link
              href="/hit2"
              className="inline-flex items-center gap-3 px-6 py-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/50 rounded-xl transition-all hover:scale-105"
            >
              <img src="/hit2-icon.png" alt="HIT2" className="w-10 h-10" />
              <span className="text-white font-medium">HIT2 专区</span>
              <span className="text-slate-400">→</span>
            </Link>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/select-game"
              className="group px-10 py-4 text-lg font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl hover:from-violet-500 hover:to-purple-500 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-violet-500/25"
            >
              <span className="relative z-10">{t('hero.buy')}</span>
            </Link>
            <Link
              href="/create-listing"
              className="group px-10 py-4 text-lg font-semibold text-white bg-slate-800/80 border border-slate-600/50 rounded-2xl hover:bg-slate-700/80 hover:border-slate-500 transition-all duration-300 backdrop-blur-sm"
            >
              <span>{t('hero.sell')}</span>
            </Link>
          </div>
          
          {/* Trust badges */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <span className="text-emerald-500">✓</span>
              <span>资金担保</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-500">✓</span>
              <span>7×24客服</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-500">✓</span>
              <span>快速到账</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <div className="bg-slate-900/95 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-slate-400 text-sm">在线客服</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-slate-700"></div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-lg">50,000+</span>
              <span className="text-slate-400 text-sm">注册用户</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-slate-700"></div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-lg">100,000+</span>
              <span className="text-slate-400 text-sm">成功交易</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-slate-700"></div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold text-lg">99.9%</span>
              <span className="text-slate-400 text-sm">满意度</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Content */}
          <div className="flex-1">
            {/* Categories */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">交易分类</h2>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'accounts', name: '账号', nameKo: '계정', icon: '📋' },
                  { id: 'items', name: '道具', nameKo: '아이템', icon: '🎁' },
                  { id: 'coins', name: '游戏币', nameKo: '게임화폐', icon: '💰' },
                ].map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/select-game?type=${cat.id}`}
                    className="group p-4 bg-slate-800/60 rounded-xl border border-slate-700 hover:border-violet-500 transition-all"
                  >
                    <div className="text-3xl mb-2">{cat.icon}</div>
                    <div className="text-white font-medium">
                      {language === 'ko' ? cat.nameKo : cat.name}
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            

            {/* Listings from Database */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">
                  热门商品
                </h2>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500"
                >
                  <option value="latest">综合排序</option>
                  <option value="price-low">价格低→高</option>
                  <option value="price-high">价格高→低</option>
                </select>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-4">
                {([
                  { key: 'accounts', icon: '📋', label: '账号' },
                  { key: 'items', icon: '🎁', label: '道具' },
                  { key: 'coins', icon: '💰', label: '游戏币' },
                ] as const).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      activeTab === tab.key
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Grid */}
              {loading ? (
                <div className="text-center py-12 text-slate-400">
                  <div className="text-2xl mb-2">⏳</div>
                  <p>加载中...</p>
                </div>
              ) : listings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {listings.slice(0, 8).map((listing, index) => (
                    <div key={listing.id} className="animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                      <ListingCard listing={listing} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <div className="text-4xl mb-4">🔍</div>
                  <p>暂无商品</p>
                </div>
              )}
            </section>
          </div>

          {/* Right Sidebar */}
          <div className="lg:w-80">
            {/* Customer Service */}
            <div className="bg-gradient-to-r from-violet-900/50 to-purple-900/50 rounded-xl p-4 border border-violet-500/30 mb-4">
              <h3 className="text-white font-semibold mb-3">客服中心</h3>
              <div className="space-y-2 text-sm">
                <p className="text-slate-300">
                  <span className="text-violet-400">📞</span> 电话：+852 4406 0902
                </p>
                <p className="text-slate-300">
                  <span className="text-violet-400">✉️</span> Email: support@bbmarket.com
                </p>
                <p className="text-slate-300">
                  <span className="text-violet-400">✈️</span> Telegram: @bbmarket
                </p>
                <p className="text-slate-500 text-xs mt-2">
                  服务时间：全天 24小时在线
                </p>
              </div>
            </div>

            {/* Trade Stats */}
            <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700 mb-4">
              <h3 className="text-white font-semibold mb-3">交易统计</h3>
              <div className="text-center">
                <p className="text-3xl font-bold text-violet-400">50,000+</p>
                <p className="text-slate-400 text-sm">累计交易笔数</p>
              </div>
            </div>

            {/* Hot Keywords */}
            <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700 mb-4">
              <h3 className="text-white font-semibold mb-3">热门搜索</h3>
              <div className="flex flex-wrap gap-2">
                {hotKeywords.map((keyword, i) => (
                  <Link
                    key={i}
                    href={`/accounts?search=${keyword}`}
                    className="px-3 py-1.5 bg-slate-700/50 text-slate-400 text-sm rounded-lg hover:bg-violet-600 hover:text-white transition-colors"
                  >
                    {keyword}
                  </Link>
                ))}
              </div>
            </div>

            {/* Latest Trade News */}
            <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700">
              <h3 className="text-white font-semibold mb-3">最新发布</h3>
              <div className="space-y-3">
                {latestListings.map((item) => (
                  <Link
                    key={item.id}
                    href={`/listing/${item.id}`}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                  >
                    <span className="text-xl">{item.images?.[0] || '📦'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">
                        {language === 'ko' ? item.titleKo : item.title}
                      </p>
                      <p className="text-violet-400 text-sm font-medium">
                        ${item.price} USDT
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <section className="py-16 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">
            {t('features.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-4 bg-slate-800/60 rounded-xl border border-slate-700"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-text-2xl mb-3`}>
                  {feature.icon}
                </div>
                <h3 className="text-white font-medium mb-1">{t(feature.titleKey)}</h3>
                <p className="text-slate-400 text-sm">{t(feature.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">{t('how.title')}</h2>
          <div className="grid grid-cols-4 gap-4">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-text-2xl">
                  {step.icon}
                </div>
                <h3 className="text-white font-medium mb-1">{t(step.titleKey)}</h3>
                <p className="text-slate-400 text-sm">{t(step.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
