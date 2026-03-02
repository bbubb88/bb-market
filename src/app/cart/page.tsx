'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';

interface CartItem {
  id: string;
  listingId: number;
  title: string;
  titleKo: string | null;
  price: number;
  image: string;
  type: string;
  quantity: number;
  addedAt: string;
}

export default function CartPage() {
  const { language, t } = useI18n();
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // 加载购物车数据
  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem('bbmarket_cart');
      if (stored) {
        setCartItems(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      setLoading(false);
    }
  };

  // 保存购物车到 localStorage
  const saveCart = (items: CartItem[]) => {
    localStorage.setItem('bbmarket_cart', JSON.stringify(items));
    setCartItems(items);
  };

  // 更新商品数量
  const updateQuantity = (listingId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setUpdating(`qty-${listingId}`);
    const updated = cartItems.map(item => 
      item.listingId === listingId 
        ? { ...item, quantity: newQuantity }
        : item
    );
    saveCart(updated);
    setTimeout(() => setUpdating(null), 300);
  };

  // 删除商品
  const removeItem = (listingId: number) => {
    setUpdating(`remove-${listingId}`);
    const updated = cartItems.filter(item => item.listingId !== listingId);
    saveCart(updated);
    setTimeout(() => setUpdating(null), 300);
  };

  // 清空购物车
  const clearCart = () => {
    if (confirm(language === 'ko' ? '장바구니를 비우시겠습니까?' : '确定要清空购物车吗？')) {
      saveCart([]);
    }
  };

  // 计算总价
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // 结算
  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    
    // 将购物车数据存入 localStorage，准备结算
    localStorage.setItem('bbmarket_checkout', JSON.stringify(cartItems));
    router.push('/cart/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-slate-400">{language === 'ko' ? '로딩 중...' : '加载中...'}</p>
        </div>
      </div>
    );
  }

  const typeLabels: Record<string, { zh: string; ko: string }> = {
    account: { zh: '账号', ko: '계정' },
    item: { zh: '道具', ko: '아이템' },
    coin: { zh: '游戏币', ko: '게임화폐' },
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {language === 'ko' ? '장바구니' : '购物车'}
            </h1>
            <p className="text-slate-400">
              {cartItems.length} {language === 'ko' ? '개의 상품' : '件商品'}
            </p>
          </div>
          
          {cartItems.length > 0 && (
            <button
              onClick={clearCart}
              className="px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg transition-colors"
            >
              {language === 'ko' ? '장바구니 비우기' : '清空购物车'}
            </button>
          )}
        </div>

        {/* Empty Cart */}
        {cartItems.length === 0 ? (
          <div className="bg-slate-800/50 rounded-2xl p-12 border border-slate-700 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {language === 'ko' ? '장바구니가 비어 있습니다' : '购物车是空的'}
            </h2>
            <p className="text-slate-400 mb-6">
              {language === 'ko' 
                ? '원하는 상품을 장바구니에 추가해보세요!' 
                : '添加心仪的商品到购物车吧！'}
            </p>
            <Link
              href="/items"
              className="inline-block px-6 py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-500 transition-colors"
            >
              {language === 'ko' ? '상품 보기' : '浏览商品'}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cart Items */}
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700 flex items-center gap-4"
              >
                {/* Image */}
                <Link
                  href={`/listing/${item.listingId}`}
                  className="w-20 h-20 flex-shrink-0 bg-gradient-to-br from-violet-600/20 to-cyan-600/20 rounded-xl flex items-center justify-center text-3xl"
                >
                  {item.image}
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-block px-2 py-0.5 text-xs font-medium bg-pink-500/20 text-pink-400 rounded-full">
                      {language === 'ko' 
                        ? typeLabels[item.type]?.ko 
                        : typeLabels[item.type]?.zh}
                    </span>
                  </div>
                  <Link
                    href={`/listing/${item.listingId}`}
                    className="text-white font-medium hover:text-violet-400 transition-colors line-clamp-1"
                  >
                    {language === 'ko' ? item.titleKo : item.title}
                  </Link>
                  <p className="text-violet-400 font-semibold mt-1">
                    ${item.price} <span className="text-slate-500 text-sm">USDT</span>
                  </p>
                </div>

                {/* Quantity */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.listingId, item.quantity - 1)}
                    disabled={updating === `qty-${item.listingId}`}
                    className="w-8 h-8 flex items-center justify-center bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
                  >
                    -
                  </button>
                  <span className="w-10 text-center text-white font-medium">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.listingId, item.quantity + 1)}
                    disabled={updating === `qty-${item.listingId}`}
                    className="w-8 h-8 flex items-center justify-center bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
                  >
                    +
                  </button>
                </div>

                {/* Subtotal */}
                <div className="w-24 text-right">
                  <p className="text-white font-bold">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.listingId)}
                  disabled={updating === `remove-${item.listingId}`}
                  className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                >
                  🗑️
                </button>
              </div>
            ))}

            {/* Summary */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 mt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400">
                  {language === 'ko' ? '합계' : '总计'}
                </span>
                <div className="text-right">
                  <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
                    ${total.toFixed(2)}
                  </span>
                  <span className="text-slate-500 ml-2">USDT</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-600/20"
              >
                {language === 'ko' ? '결제하기' : '立即结算'}
              </button>

              <p className="text-slate-500 text-sm text-center mt-4">
                {language === 'ko' 
                  ? '결제 시 사용자 센터에서 주문을 확인하실 수 있습니다' 
                  : '结算后可在用户中心查看订单'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
