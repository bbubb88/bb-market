'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { db } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { listings } from '@/data/games';

interface ListingData {
  id: string;
  sellerId: string;
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

export default function ListingDetailPage() {
  const { language, t } = useI18n();
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;
  
  const [listing, setListing] = useState<ListingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [buying, setBuying] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check login status client-side only
    const checkAuth = () => {
      const token = localStorage.getItem('access_token');
      const userDataStr = localStorage.getItem('user');
      
      setIsLoggedIn(!!token);
      
      if (userDataStr) {
        try {
          const userData = JSON.parse(userDataStr);
          setUser(userData);
        } catch (e) {
          console.error('Failed to parse user data:', e);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };
    
    // Run immediately
    checkAuth();
    
    // Also listen for storage changes (for when user logs in/out in another tab)
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  // 立即购买
  const handleBuy = async () => {
    console.log('handleBuy called, isLoggedIn:', isLoggedIn, 'user:', user);
    
    if (!isLoggedIn || !user?.id) {
      // 直接跳转到登录页
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    if (!listing) {
      setError('商品信息加载中，请稍候再试');
      return;
    }

    if (!user?.id) {
      setError('用户信息无效，请重新登录');
      return;
    }

    if (listing.sellerId === user.id || listing.sellerId === user.id?.toString()) {
      setError('不能购买自己的商品');
      return;
    }

    setBuying(true);
    setError('');
    setShowLoginPrompt(false);

    try {
      // 获取用户ID（兼容不同登录方式）
      const buyerId = user?.id || user?.user_metadata?.sub;
      const listingId = listing?.id;
      
      console.log('Creating order - buyerId:', buyerId, 'listingId:', listingId, 'user:', user);
      
      if (!buyerId) {
        setError('用户未登录，请先登录');
        setBuying(false);
        router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
        return;
      }
      
      if (!listingId) {
        setError('商品信息无效');
        setBuying(false);
        return;
      }

      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: parseInt(listingId, 10),
          buyerId: buyerId,
        }),
      });

      const data = await res.json();
      console.log('Order response:', res.status, data);

      if (!res.ok) {
        setError(data.error || `创建订单失败 (${res.status})`);
        return;
      }

      setOrderCreated(true);
      setSuccessMessage('订单创建成功！');
      // 延迟跳转到订单页面，让用户看到成功提示
      setTimeout(() => {
        router.push('/dashboard?tab=orders');
      }, 1500);
    } catch (err) {
      console.error('Order error:', err);
      setError('网络错误，请检查网络后重试');
    } finally {
      setBuying(false);
    }
  };

  useEffect(() => {
    loadListing();
  }, [listingId]);

  const loadListing = async () => {
    setLoading(true);
    try {
      // 首先尝试从静态数据获取
      const numericId = parseInt(listingId, 10);
      const staticListing = listings.find(l => l.id === numericId);
      
      if (staticListing) {
        // 转换为详情页需要的格式
        const listingData: ListingData = {
          id: String(staticListing.id),
          sellerId: staticListing.seller || 'unknown',
          type: staticListing.type?.toUpperCase() || 'ACCOUNT',
          title: staticListing.title,
          titleKo: staticListing.titleKo || null,
          description: staticListing.description || null,
          descriptionKo: staticListing.descriptionKo || null,
          price: staticListing.price,
          level: staticListing.level || null,
          amount: null,
          images: staticListing.images || ['📦'],
          badge: staticListing.badge || null,
          serverId: staticListing.server || null,
          status: 'SELLING',
          createdAt: staticListing.createdAt || new Date().toISOString(),
        };
        setListing(listingData);
        setLoading(false);
        return;
      }

      // 如果静态数据没有，尝试从 Supabase 获取
      const { data } = await db.getListing(listingId);
      if (data) {
        setListing(data);
      }
    } catch (error) {
      console.error('Failed to load listing:', error);
    }
    setLoading(false);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-slate-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-white mb-4">商品不存在</h1>
          <p className="text-slate-400">The listing does not exist.</p>
        </div>
      </div>
    );
  }

  const title = language === 'ko' ? listing.titleKo : listing.title;
  const description = language === 'ko' ? listing.descriptionKo : listing.description;
  
  const images = listing.images && listing.images.length > 0 ? listing.images : ['📦'];

  const typeLabels: Record<string, { zh: string; ko: string }> = {
    ACCOUNT: { zh: '账号', ko: '계정' },
    ITEM: { zh: '道具', ko: '아이템' },
    COIN: { zh: '游戏币', ko: '게임화폐' },
  };

  const type = listing.type?.toUpperCase() || 'ACCOUNT';

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left - Images */}
          <div className="lg:col-span-2">
            {/* Main Image */}
            <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 mb-4">
              <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-violet-600/20 to-cyan-600/20 rounded-xl">
                <span className="text-9xl">{images[selectedImageIndex]}</span>
              </div>
            </div>
            
            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="grid grid-cols-6 gap-2 mb-6">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square rounded-xl border-2 flex items-center justify-center text-2xl transition-all ${
                      selectedImageIndex === index 
                        ? 'border-violet-500 bg-violet-500/20' 
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
                  >
                    {img}
                  </button>
                ))}
              </div>
            )}
            
            {/* Description */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">商品描述</h2>
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{description}</p>
              
              <div className="mt-6 grid grid-cols-2 gap-4">
                {listing.level && (
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <span className="text-slate-400 text-sm">等级</span>
                    <p className="text-white font-semibold text-lg">Lv. {listing.level}</p>
                  </div>
                )}
                {listing.amount && (
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <span className="text-slate-400 text-sm">数量</span>
                    <p className="text-white font-semibold text-lg">{listing.amount >= 10000 ? `${(listing.amount / 10000).toFixed(0)}万` : listing.amount.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right - Purchase */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 sticky top-24">
              {/* Badge */}
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-block px-3 py-1 text-xs font-medium bg-pink-500/20 text-pink-400 rounded-full">
                  {language === 'ko' ? typeLabels[type]?.ko : typeLabels[type]?.zh}
                </span>
                {listing.badge && (
                  <span className="inline-block px-3 py-1 text-xs font-medium bg-violet-500/20 text-violet-400 rounded-full">
                    {listing.badge}
                  </span>
                )}
              </div>
              
              <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
              <p className="text-slate-400 text-sm mb-6">ID: {listing.id}</p>
              
              {/* Price */}
              <div className="mb-6">
                <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">${listing.price}</span>
                <span className="text-lg text-slate-500 ml-2">USDT</span>
              </div>
              
              {/* Actions */}
              <button 
                type="button"
                onClick={handleBuy}
                disabled={buying || !listing || listing.status !== 'SELLING'}
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl hover:from-violet-500 hover:to-purple-500 transition-all mb-3 shadow-lg shadow-violet-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {buying ? '⏳ 处理中...' : !listing ? '加载中...' : listing.status !== 'SELLING' ? '已下架' : '立即购买'}
              </button>

              {error && (
                <div className="mb-3 p-3 bg-red-900/30 border border-red-500/50 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="mb-3 p-4 bg-emerald-900/30 border border-emerald-500/50 rounded-xl">
                  <p className="text-emerald-400 font-medium">✅ {successMessage}</p>
                  <p className="text-slate-300 text-sm mt-1">正在跳转到订单页面...</p>
                </div>
              )}

              {orderCreated && !successMessage && (
                <div className="mb-3 p-4 bg-emerald-900/30 border border-emerald-500/50 rounded-xl">
                  <p className="text-emerald-400 font-medium mb-2">✅ 订单创建成功！</p>
                  <p className="text-slate-300 text-sm mb-3">
                    请前往用户中心完成付款
                  </p>
                  <Link
                    href="/dashboard?tab=orders"
                    className="inline-block px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-500"
                  >
                    查看订单
                  </Link>
                </div>
              )}

              {/* Login Prompt */}
              {showLoginPrompt && !orderCreated && (
                <div className="mb-6 p-4 bg-amber-900/30 border border-amber-500/50 rounded-xl">
                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto mb-3 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <p className="text-white font-medium mb-2">⚠️ 请先登录</p>
                    <p className="text-slate-300 text-sm mb-4">
                      购买商品前请先登录您的账号
                    </p>
                    <Link
                      href="/login"
                      className="inline-block px-6 py-2 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-500 transition-colors"
                    >
                      立即登录
                    </Link>
                    <button
                      onClick={() => setShowLoginPrompt(false)}
                      className="block w-full mt-3 text-slate-500 text-sm hover:text-slate-400"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
              
              <button 
                onClick={() => setShowContact(!showContact)}
                className="w-full py-4 bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-600 transition-all mb-6"
              >
                💬 联系卖家
              </button>

              {/* Contact Info */}
              {showContact && (
                <div className="mb-6 p-4 bg-amber-900/30 border border-amber-500/30 rounded-xl">
                  <p className="text-amber-400 text-sm font-medium mb-3">⚠️ 安全交易提示</p>
                  <p className="text-slate-300 text-sm mb-3">
                    为保障您的资金安全，请勿私下交易！所有沟通请通过平台AI客服进行。
                  </p>
                  
                  <a 
                    href="/chat"
                    className="flex items-center gap-3 p-3 bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors"
                  >
                    <span className="text-xl">🤖</span>
                    <span className="text-white font-medium">联系AI客服</span>
                  </a>
                </div>
              )}
                      <div>
                        <p className="text-white font-medium">💬 在线客服 (Discord)</p>
                        <p className="text-white/70 text-xs">点击进入客服频道</p>
                      </div>
                    </a>
                    
                    <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                      <span className="text-2xl">💬</span>
                      <div>
                        <p className="text-white font-medium">WhatsApp客服</p>
                        <p className="text-slate-400 text-xs">+852 4406 0902</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                      <span className="text-2xl">✈️</span>
                      <div>
                        <p className="text-white font-medium">Telegram客服</p>
                        <p className="text-slate-400 text-xs">@bbmarket</p>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-amber-400 text-xs mt-3">
                    ⚡ 联系时请注明商品ID: {listing.id}
                  </p>
                </div>
              )}
              
              {/* Security */}
              <div className="pt-6 border-t border-slate-700 space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <span className="text-emerald-400 text-lg">✓</span>
                  <span>资金担保交易</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <span className="text-emerald-400 text-lg">✓</span>
                  <span>安全快捷</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <span className="text-emerald-400 text-lg">✓</span>
                  <span>7×24客服</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <span className="text-emerald-400 text-lg">✓</span>
                  <span>正品保障</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
