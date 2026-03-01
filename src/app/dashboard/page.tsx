'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { db } from '@/lib/supabase';
import Link from 'next/link';

type TabType = 'buyer' | 'seller' | 'wallet' | 'profile' | 'security';
type BuyerSubTab = 'orders' | 'purchases' | 'favorites';
type SellerSubTab = 'listings' | 'trading' | 'sold';

interface Listing {
  id: string;
  type: string;
  title: string;
  titleKo: string | null;
  price: number;
  status: string;
  viewCount: number;
  createdAt: string;
}

interface Order {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  price: number;
  fee: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  Listing?: {
    title: string;
    images: string[];
    serverId: string;
    type: string;
  };
}

export default function DashboardPage() {
  const { language, t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabType>('buyer');
  const [buyerSubTab, setBuyerSubTab] = useState<BuyerSubTab>('orders');
  const [sellerSubTab, setSellerSubTab] = useState<SellerSubTab>('listings');
  const [listings, setListings] = useState<Listing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 从 localStorage 获取用户信息
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : null;
  const userId = user?.id || null;

  useEffect(() => {
    loadData();
    if (buyerSubTab === 'orders' || buyerSubTab === 'purchases') {
      loadOrders();
    }
  }, [sellerSubTab, buyerSubTab]);

  const loadOrders = async () => {
    if (!userId) return;
    try {
      const res = await fetch('/api/order/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(data);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const { data } = await db.getListings({});
      if (data) {
        const filtered = data.filter((l: Listing) => {
          if (sellerSubTab === 'listings') return l.status === 'SELLING';
          if (sellerSubTab === 'trading') return l.status === 'TRADING';
          if (sellerSubTab === 'sold') return l.status === 'SOLD';
          return true;
        });
        setListings(filtered);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await db.updateListing(id, { status: newStatus });
      loadData();
    } catch (error) {
      console.error('Failed to update:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除?')) return;
    try {
      await db.deleteListing(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('zh-TW', { year: 'numeric', month: 'short', day: 'numeric' });

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      SELLING: { label: '待售中', color: 'bg-emerald-500' },
      TRADING: { label: '交易中', color: 'bg-amber-500' },
      SOLD: { label: '已完成', color: 'bg-slate-500' },
    };
    const s = map[status] || { label: status, color: 'bg-slate-500' };
    return <span className={`px-2 py-1 text-xs rounded-full ${s.color} text-white`}>{s.label}</span>;
  };

  const tabs = [
    { id: 'buyer', label: '买家中心', icon: '🛒' },
    { id: 'seller', label: '我的挂售', icon: '💰' },
    { id: 'wallet', label: '钱包', icon: '💳' },
    { id: 'profile', label: '个人资料', icon: '👤' },
    { id: 'security', label: '安全设置', icon: '🔒' },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-8">用户中心</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700 sticky top-24">
              <div className="text-center pb-4 border-b border-slate-700 mb-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-violet-500 to-cyan-500 rounded-full flex items-center justify-text-3xl mb-3">👤</div>
                <h3 className="text-white font-semibold">TestUser</h3>
                <div className="mt-2 inline-block px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">✅ 已验证</div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-4 pb-4 border-b border-slate-700">
                <div className="text-center p-2 bg-slate-700/50 rounded-lg">
                  <p className="text-2xl font-bold text-white">{listings.length}</p>
                  <p className="text-xs text-slate-400">在售</p>
                </div>
                <div className="text-center p-2 bg-slate-700/50 rounded-lg">
                  <p className="text-2xl font-bold text-white">{listings.filter(l => l.status === 'SOLD').length}</p>
                  <p className="text-xs text-slate-400">成交</p>
                </div>
              </div>
              
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 ${activeTab === tab.id ? 'bg-violet-600/20 text-violet-400' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}>
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
          
          <div className="lg:col-span-3">
            {activeTab === 'buyer' && (
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                <h2 className="text-xl font-bold text-white mb-6">🛒 买家中心</h2>
                <div className="flex gap-2 mb-6">
                  <button onClick={() => setBuyerSubTab('orders')} className={`px-4 py-2 rounded-lg font-medium ${buyerSubTab === 'orders' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400'}`}>📋 我的订单</button>
                  <button onClick={() => setBuyerSubTab('purchases')} className={`px-4 py-2 rounded-lg font-medium ${buyerSubTab === 'purchases' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400'}`}>🛍️ 已购买</button>
                  <button onClick={() => setBuyerSubTab('favorites')} className={`px-4 py-2 rounded-lg font-medium ${buyerSubTab === 'favorites' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400'}`}>⭐ 收藏夹</button>
                </div>
                
                {!userId ? (
                  <div className="text-center py-12 text-slate-400">
                    <p className="text-4xl mb-4">🔐</p><p>请先登录</p>
                    <Link href="/login" className="mt-4 inline-block px-6 py-3 bg-violet-600 text-white font-medium rounded-lg">去登录</Link>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <p className="text-4xl mb-4">📋</p><p>暂无订单</p>
                    <Link href="/select-game" className="inline-block mt-4 px-6 py-3 bg-violet-600 text-white font-medium rounded-lg">去购物</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <div key={order.id} className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-xl">
                        <div className="w-14 h-14 bg-slate-600 rounded-lg flex items-center justify-center text-2xl">
                          {order.Listing?.type === 'ACCOUNT' ? '📋' : order.Listing?.type === 'ITEM' ? '🎮' : '💰'}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-medium">{order.Listing?.title || '商品'}</h4>
                          <p className="text-slate-400 text-sm">订单号: {order.id.slice(0, 8)}...</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">{order.price} USDT</p>
                          <span className={`text-xs px-2 py-1 rounded ${
                            order.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                            order.status === 'PAID' ? 'bg-blue-500/20 text-blue-400' :
                            order.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {order.status === 'PENDING' ? '待付款' :
                             order.status === 'PAID' ? '已付款' :
                             order.status === 'COMPLETED' ? '已完成' : '已取消'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'seller' && (
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white">💰 我的挂售</h2>
                  <Link href="/create-listing" className="px-4 py-2 bg-violet-600 text-white font-medium rounded-lg">+ 发布商品</Link>
                </div>
                <div className="flex gap-2 mb-6">
                  <button onClick={() => setSellerSubTab('listings')} className={`px-4 py-2 rounded-lg font-medium ${sellerSubTab === 'listings' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400'}`}>🏪 待出售 ({listings.filter(l => l.status === 'SELLING').length})</button>
                  <button onClick={() => setSellerSubTab('trading')} className={`px-4 py-2 rounded-lg font-medium ${sellerSubTab === 'trading' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400'}`}>🔄 交易中 ({listings.filter(l => l.status === 'TRADING').length})</button>
                  <button onClick={() => setSellerSubTab('sold')} className={`px-4 py-2 rounded-lg font-medium ${sellerSubTab === 'sold' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400'}`}>✅ 已完成 ({listings.filter(l => l.status === 'SOLD').length})</button>
                </div>
                {loading ? <div className="text-center py-12 text-slate-400">加载中...</div> : listings.length > 0 ? (
                  <div className="space-y-3">
                    {listings.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-xl">
                        <div className="w-14 h-14 bg-slate-600 rounded-lg flex items-center justify-text-2xl">{item.type === 'ACCOUNT' ? '📋' : item.type === 'ITEM' ? '🎮' : '💰'}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2"><h4 className="text-white font-medium">{item.title}</h4>{getStatusBadge(item.status)}</div>
                          <p className="text-slate-400 text-sm">浏览 {item.viewCount} • {formatDate(item.createdAt)}</p>
                        </div>
                        <div className="text-right"><p className="text-xl font-bold text-violet-400">${item.price}</p></div>
                        <div className="flex gap-2">
                          <Link href={`/listing/${item.id}`} className="px-3 py-2 text-sm bg-slate-600 text-white rounded-lg">查看</Link>
                          {item.status === 'SELLING' && <button onClick={() => handleStatusChange(item.id, 'TRADING')} className="px-3 py-2 text-sm bg-amber-600 text-white rounded-lg">开始交易</button>}
                          {item.status === 'TRADING' && <button onClick={() => handleStatusChange(item.id, 'SOLD')} className="px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg">完成</button>}
                          <button onClick={() => handleDelete(item.id)} className="px-3 py-2 text-sm bg-red-600/20 text-red-400 rounded-lg">删除</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12"><p className="text-4xl mb-4">📦</p><p className="text-slate-400 mb-4">暂无商品</p><Link href="/create-listing" className="inline-block px-6 py-3 bg-violet-600 text-white font-medium rounded-lg">发布第一个商品</Link></div>
                )}
              </div>
            )}
            
            {activeTab === 'wallet' && (
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                <h2 className="text-xl font-bold text-white mb-6">💳 钱包</h2>
                <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl p-6 mb-6">
                  <p className="text-white/80 text-sm mb-1">USDT 余额</p>
                  <p className="text-4xl font-bold text-white">0.00</p>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button className="py-3 bg-emerald-600 text-white font-medium rounded-lg">💰 充值</button>
                  <button className="py-3 bg-slate-700 text-white font-medium rounded-lg">💸 提现</button>
                </div>
                <div><h3 className="text-white font-semibold mb-4">近期交易</h3><div className="text-center py-8 text-slate-400">暂无记录</div></div>
              </div>
            )}
            
            {activeTab === 'profile' && (
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                <h2 className="text-xl font-bold text-white mb-6">👤 个人资料</h2>
                <form className="space-y-4 max-w-md">
                  <div><label className="block text-sm font-medium text-slate-300 mb-2">用户名</label><input type="text" defaultValue="TestUser" className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white" /></div>
                  <div><label className="block text-sm font-medium text-slate-300 mb-2">邮箱</label><input type="email" defaultValue="test@example.com" className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white" /></div>
                  <button className="px-6 py-3 bg-violet-600 text-white font-medium rounded-lg">保存修改</button>
                </form>
              </div>
            )}
            
            {activeTab === 'security' && (
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                <h2 className="text-xl font-bold text-white mb-6">🔒 安全设置</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg"><div><p className="text-white font-medium">🔐 登录密码</p><p className="text-slate-400 text-sm">定期更换密码更安全</p></div><button className="px-4 py-2 bg-slate-600 text-white rounded-lg">修改</button></div>
                  <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg"><div><p className="text-white font-medium">📱 两步验证 (2FA)</p><p className="text-slate-400 text-sm">保护您的账户安全</p></div><button className="px-4 py-2 bg-violet-600 text-white rounded-lg">开启</button></div>
                  <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg"><div><p className="text-white font-medium">💬 Discord 绑定</p><p className="text-slate-400 text-sm">接收交易通知</p></div><button className="px-4 py-2 bg-slate-600 text-white rounded-lg">绑定</button></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
