'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';

type TabType = 'profile' | 'orders' | 'listings' | 'wallet' | 'security';
type OrderSubTab = 'active' | 'completed' | 'favorites';
type ListingSubTab = 'trading' | 'selling' | 'completed';

export default function DashboardPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [orderSubTab, setOrderSubTab] = useState<OrderSubTab>('active');
  const [listingSubTab, setListingSubTab] = useState<ListingSubTab>('trading');
  
  const tabs = [
    { id: 'profile', label: '个人资料', labelKo: '프로필' },
    { id: 'orders', label: '我的订单', labelKo: '주문 목록' },
    { id: 'listings', label: '我的挂售', labelKo: '내 판매' },
    { id: 'wallet', label: '钱包', labelKo: '지갑' },
    { id: 'security', label: '安全设置', labelKo: '보안 설정' },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-8">用户中心</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
              {/* User Info */}
              <div className="text-center pb-4 border-b border-slate-700 mb-4">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-violet-500 to-cyan-500 rounded-full flex items-center justify-center text-3xl font-bold text-white mb-3">
                  U
                </div>
                <h3 className="text-white font-semibold">User123</h3>
                <p className="text-slate-400 text-sm">user@example.com</p>
                <div className="mt-2 inline-block px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                  ✅ 已验证
                </div>
              </div>
              
              {/* Tabs */}
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-violet-600/20 text-violet-400'
                        : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
          
          {/* Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                <h2 className="text-xl font-bold text-white mb-6">个人资料</h2>
                <form className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">用户名</label>
                    <input
                      type="text"
                      defaultValue="User123"
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">邮箱</label>
                    <input
                      type="email"
                      defaultValue="user@example.com"
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Discord <span className="text-slate-500">(接收交易通知)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="绑定 Discord 账号"
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      手机号 <span className="text-slate-500">(选填)</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="+852 4406 0902"
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                    />
                    <p className="text-slate-500 text-xs mt-1">可选填写，便于紧急联系</p>
                  </div>
                  <button className="px-6 py-3 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition-colors">
                    保存修改
                  </button>
                </form>
              </div>
            )}
            
            {activeTab === 'orders' && (
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                <h2 className="text-xl font-bold text-white mb-6">我的订单</h2>
                
                {/* Sub Tabs */}
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setOrderSubTab('active')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      orderSubTab === 'active'
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    🔄 正在交易
                  </button>
                  <button
                    onClick={() => setOrderSubTab('completed')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      orderSubTab === 'completed'
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    ✅ 已完成
                  </button>
                  <button
                    onClick={() => setOrderSubTab('favorites')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      orderSubTab === 'favorites'
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    ⭐ 收藏
                  </button>
                </div>

                {/* Content */}
                <div className="text-center py-12 text-slate-400">
                  {orderSubTab === 'active' && (
                    <>
                      <p className="text-4xl mb-4">🔄</p>
                      <p>暂无正在交易的订单</p>
                    </>
                  )}
                  {orderSubTab === 'completed' && (
                    <>
                      <p className="text-4xl mb-4">✅</p>
                      <p>暂无已完成的订单</p>
                    </>
                  )}
                  {orderSubTab === 'favorites' && (
                    <>
                      <p className="text-4xl mb-4">⭐</p>
                      <p>暂无收藏的商品</p>
                    </>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'listings' && (
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white">我的挂售</h2>
                  <button className="px-4 py-2 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition-colors">
                    发布新商品
                  </button>
                </div>

                {/* Sub Tabs */}
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setListingSubTab('trading')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      listingSubTab === 'trading'
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    🔄 正在交易
                  </button>
                  <button
                    onClick={() => setListingSubTab('selling')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      listingSubTab === 'selling'
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    🏪 待出售
                  </button>
                  <button
                    onClick={() => setListingSubTab('completed')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      listingSubTab === 'completed'
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    ✅ 已完成
                  </button>
                </div>

                {/* Content */}
                <div className="text-center py-12 text-slate-400">
                  {listingSubTab === 'trading' && (
                    <>
                      <p className="text-4xl mb-4">🔄</p>
                      <p>暂无正在交易的商品</p>
                    </>
                  )}
                  {listingSubTab === 'selling' && (
                    <>
                      <p className="text-4xl mb-4">🏪</p>
                      <p>暂无待出售的商品</p>
                    </>
                  )}
                  {listingSubTab === 'completed' && (
                    <>
                      <p className="text-4xl mb-4">✅</p>
                      <p>暂无已完成的商品</p>
                    </>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'wallet' && (
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                <h2 className="text-xl font-bold text-white mb-6">钱包</h2>
                
                {/* USDT Balance */}
                <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl p-6 mb-6">
                  <p className="text-white/80 text-sm mb-1">USDT 余额</p>
                  <p className="text-3xl font-bold text-white">0.00 USDT</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <button className="py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors">
                    充值
                  </button>
                  <button className="py-3 bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-600 transition-colors">
                    提现
                  </button>
                </div>
                
                {/* Transactions */}
                <div className="mt-6">
                  <h3 className="text-white font-semibold mb-4">交易记录</h3>
                  <div className="text-center py-8 text-slate-400">
                    <p>暂无交易记录</p>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'security' && (
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                <h2 className="text-xl font-bold text-white mb-6">安全设置</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <div>
                      <p className="text-white font-medium">登录密码</p>
                      <p className="text-slate-400 text-sm">定期更换密码更安全</p>
                    </div>
                    <button className="px-4 py-2 text-sm bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors">
                      修改
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <div>
                      <p className="text-white font-medium">两步验证 (2FA)</p>
                      <p className="text-slate-400 text-sm">保护您的账户安全</p>
                    </div>
                    <button className="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors">
                      开启
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <div>
                      <p className="text-white font-medium">Telegram 绑定</p>
                      <p className="text-slate-400 text-sm">接收交易通知</p>
                    </div>
                    <button className="px-4 py-2 text-sm bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors">
                      绑定
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
