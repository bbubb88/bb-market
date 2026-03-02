'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

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

export default function OrdersPage() {
  const { language, t } = useI18n();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'buyer' | 'seller'>('all');
  
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : null;
  const userId = user?.id || null;

  useEffect(() => {
    if (userId) {
      loadOrders();
    } else {
      setLoading(false);
    }
  }, [filter]);

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
    setLoading(false);
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('zh-TW', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const getStatusInfo = (status: string) => {
    const map: Record<string, { label: string; labelKo: string; color: string }> = {
      PENDING: { label: '待付款', labelKo: '결제 대기', color: 'bg-yellow-500/20 text-yellow-400' },
      PAID: { label: '已付款', labelKo: '결제 완료', color: 'bg-blue-500/20 text-blue-400' },
      COMPLETED: { label: '已完成', labelKo: '거래 완료', color: 'bg-emerald-500/20 text-emerald-400' },
      CANCELLED: { label: '已取消', labelKo: '취소됨', color: 'bg-red-500/20 text-red-400' },
    };
    const info = map[status] || { label: status, labelKo: status, color: 'bg-slate-500/20 text-slate-400' };
    return {
      label: language === 'ko' ? info.labelKo : info.label,
      color: info.color
    };
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'buyer') return order.buyerId === userId;
    if (filter === 'seller') return order.sellerId === userId;
    return true;
  });

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">
              {language === 'ko' ? '📋 주문 목록' : '📋 订单列表'}
            </h1>
            <p className="text-slate-400 mt-1">
              {language === 'ko' ? '구매 및 판매 내역 확인' : '查看您的购买和销售记录'}
            </p>
          </div>
          <Link href="/dashboard" className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">
            {language === 'ko' ? '← 마이페이지' : '← 返回用户中心'}
          </Link>
        </div>

        {!userId ? (
          <div className="bg-slate-800/50 rounded-2xl p-12 border border-slate-700 text-center">
            <p className="text-6xl mb-4">🔐</p>
            <h2 className="text-xl font-semibold text-white mb-2">
              {language === 'ko' ? '로그인이 필요합니다' : '请先登录'}
            </h2>
            <p className="text-slate-400 mb-6">
              {language === 'ko' ? '로그인 후 주문 내역을 확인할 수 있습니다' : '登录后即可查看您的订单'}
            </p>
            <Link href="/login" className="px-6 py-3 bg-violet-600 text-white font-medium rounded-lg">
              {language === 'ko' ? '로그인 하러가기' : '去登录'}
            </Link>
          </div>
        ) : loading ? (
          <div className="bg-slate-800/50 rounded-2xl p-12 border border-slate-700 text-center">
            <p className="text-slate-400">{language === 'ko' ? '로딩 중...' : '加载中...'}</p>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-6">
              <button 
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium ${filter === 'all' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400'}`}
              >
                {language === 'ko' ? '전체' : '全部订单'}
              </button>
              <button 
                onClick={() => setFilter('buyer')}
                className={`px-4 py-2 rounded-lg font-medium ${filter === 'buyer' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400'}`}
              >
                🛒 {language === 'ko' ? '구매' : '购买'}
              </button>
              <button 
                onClick={() => setFilter('seller')}
                className={`px-4 py-2 rounded-lg font-medium ${filter === 'seller' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400'}`}
              >
                💰 {language === 'ko' ? '판매' : '销售'}
              </button>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="bg-slate-800/50 rounded-2xl p-12 border border-slate-700 text-center">
                <p className="text-6xl mb-4">📋</p>
                <h2 className="text-xl font-semibold text-white mb-2">
                  {language === 'ko' ? '주문 내역이 없습니다' : '暂无订单'}
                </h2>
                <p className="text-slate-400 mb-6">
                  {language === 'ko' ? '마음에 드는 상품을 구매해보세요!' : '快去挑选心仪的商品吧'}
                </p>
                <Link href="/select-game" className="px-6 py-3 bg-violet-600 text-white font-medium rounded-lg">
                  {language === 'ko' ? '상품 보러가기' : '去购物'}
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const statusInfo = getStatusInfo(order.status);
                  const isBuyer = order.buyerId === userId;
                  
                  return (
                    <div key={order.id} className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 hover:border-violet-500/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-slate-700 rounded-xl flex items-center justify-center text-3xl">
                            {order.Listing?.type === 'ACCOUNT' ? '📋' : order.Listing?.type === 'ITEM' ? '🎮' : '💰'}
                          </div>
                          <div>
                            <h3 className="text-white font-semibold text-lg">
                              {order.Listing?.title || (language === 'ko' ? '상품' : '商品')}
                            </h3>
                            <p className="text-slate-400 text-sm">
                              {language === 'ko' ? '주문번호: ' : '订单号: '}{order.id.slice(0, 12)}...
                            </p>
                            <p className="text-slate-500 text-xs">
                              {formatDate(order.createdAt)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-xs text-slate-400 mb-1">
                              {language === 'ko' ? '역할' : '角色'}
                            </p>
                            <p className={`font-medium ${isBuyer ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {isBuyer 
                                ? (language === 'ko' ? '🛒 구매자' : '🛒 买家')
                                : (language === 'ko' ? '💰 판매자' : '💰 卖家')
                              }
                            </p>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-xs text-slate-400 mb-1">
                              {language === 'ko' ? '금액' : '金额'}
                            </p>
                            <p className="text-xl font-bold text-violet-400">{order.price} USDT</p>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-xs text-slate-400 mb-1">
                              {language === 'ko' ? '상태' : '状态'}
                            </p>
                            <span className={`px-3 py-1 text-sm rounded-full ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                          
                          <Link 
                            href={`/listing/${order.listingId}`}
                            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                          >
                            {language === 'ko' ? '상품 보기' : '查看商品'}
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
