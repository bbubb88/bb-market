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

interface User {
  id: string;
  email: string;
  username: string;
  balance?: number;
}

export default function CheckoutPage() {
  const { language, t } = useI18n();
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'usdt'>('wallet');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load user
      const userData = localStorage.getItem('user');
      if (userData) {
        const userObj = JSON.parse(userData);
        setUser(userObj);
        
        // Fetch wallet balance from API
        try {
          const walletRes = await fetch(`/api/orders/pay?userId=${userObj.id}`);
          if (walletRes.ok) {
            const walletData = await walletRes.json();
            setBalance(walletData.balance || 0);
          }
        } catch (e) {
          console.log('Wallet API error, using local balance');
          setBalance(userObj.balance || 0);
        }
      }

      // Load cart items from checkout storage
      const checkoutData = localStorage.getItem('bbmarket_checkout');
      if (checkoutData) {
        setCartItems(JSON.parse(checkoutData));
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const fee = Math.round(subtotal * 0.03 * 100) / 100; // 3% fee
  const total = subtotal + fee;

  // Handle payment
  const handlePayment = async () => {
    if (!user || cartItems.length === 0) return;
    
    // USDT 直接支付选项
    if (paymentMethod === 'usdt') {
      setProcessing(true);
      setError('');
      
      try {
        // 1. 先创建订单（状态为 PENDING，等待支付确认后更新为 PAID）
        const orderResults = [];
        for (const item of cartItems) {
          const orderRes = await fetch('/api/orders/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              listingId: item.listingId,
              buyerId: user.id,
              quantity: item.quantity,
            }),
          });

          const orderData = await orderRes.json();
          
          if (!orderRes.ok) {
            throw new Error(orderData.error || 'Failed to create order');
          }
          
          orderResults.push(orderData[0] || orderData);
        }

        // 2. 保存订单ID和金额到本地存储，用于充值确认后更新订单状态
        const pendingPaymentData = {
          orderIds: orderResults.map((o: any) => o.id),
          userId: user.id,
          totalAmount: total,
          paymentMethod: 'usdt',
          items: cartItems,
        };
        localStorage.setItem('bbmarket_pending_payment', JSON.stringify(pendingPaymentData));
        
        // 3. 跳转到充值页面
        router.push(`/recharge?amount=${total.toFixed(2)}&orders=${orderResults.map((o: any) => o.id).join(',')}`);
        return;
      } catch (err: any) {
        setError(err.message || (language === 'ko' ? '주문 생성 중 오류가 발생했습니다' : '创建订单时出错'));
        setProcessing(false);
        return;
      }
    }
    
    // 钱包余额支付
    if (balance < total) {
      setError(language === 'ko' 
        ? '잔액이 부족합니다. 충전 후 다시 시도해주세요.' 
        : '余额不足，请先充值后再试');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      // 1. Create orders for each cart item
      const orderResults = [];
      for (const item of cartItems) {
        const orderRes = await fetch('/api/orders/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listingId: item.listingId,
            buyerId: user.id,
            quantity: item.quantity,
          }),
        });

        const orderData = await orderRes.json();
        
        if (!orderRes.ok) {
          throw new Error(orderData.error || 'Failed to create order');
        }
        
        orderResults.push(orderData[0] || orderData);
      }

      // 2. Process payment - deduct balance and update order status
      const payRes = await fetch('/api/orders/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderIds: orderResults.map((o: any) => o.id),
          userId: user.id,
          totalAmount: total,
        }),
      });

      const payData = await payRes.json();

      if (!payRes.ok) {
        throw new Error(payData.error || 'Payment failed');
      }

      // 3. Clear cart after successful payment
      localStorage.removeItem('bbmarket_cart');
      localStorage.removeItem('bbmarket_checkout');

      // 4. Update local user balance
      const newBalance = payData.newBalance || (balance - total);
      const userObj = JSON.parse(localStorage.getItem('user') || '{}');
      if (userObj.id) {
        userObj.balance = newBalance;
        localStorage.setItem('user', JSON.stringify(userObj));
      }
      
      // 5. Show success
      setSuccess(true);

    } catch (err: any) {
      setError(err.message || (language === 'ko' ? '결제 중 오류가 발생했습니다' : '支付过程出错'));
    } finally {
      setProcessing(false);
    }
  };

  // Go back to cart
  const handleBackToCart = () => {
    router.push('/cart');
  };

  const typeLabels: Record<string, { zh: string; ko: string }> = {
    account: { zh: '账号', ko: '계정' },
    item: { zh: '道具', ko: '아이템' },
    coin: { zh: '游戏币', ko: '게임화폐' },
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

  // Success state
  if (success) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-bold text-white mb-4">
              {language === 'ko' ? '결제 완료!' : '支付成功！'}
            </h1>
            <p className="text-slate-400 mb-6">
              {language === 'ko' 
                ? '주문이 성공적으로 생성되었습니다. 주문 목록에서 확인해주세요.' 
                : '您的订单已创建成功，可前往订单列表查看'}
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/dashboard?tab=orders"
                className="px-6 py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-500 transition-colors"
              >
                {language === 'ko' ? '주문 목록 보기' : '查看订单'}
              </Link>
              <Link
                href="/"
                className="px-6 py-3 bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-600 transition-colors"
              >
                {language === 'ko' ? '메인으로' : '返回首页'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty cart check
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h1 className="text-2xl font-bold text-white mb-4">
              {language === 'ko' ? '장바구니가 비어 있습니다' : '购物车是空的'}
            </h1>
            <Link
              href="/cart"
              className="inline-block px-6 py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-500 transition-colors"
            >
              {language === 'ko' ? '장바구니로 돌아가기' : '返回购物车'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 text-center">
            <div className="text-6xl mb-4">🔐</div>
            <h1 className="text-2xl font-bold text-white mb-4">
              {language === 'ko' ? '로그인이 필요합니다' : '请先登录'}
            </h1>
            <Link
              href="/login"
              className="inline-block px-6 py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-500 transition-colors"
            >
              {language === 'ko' ? '로그인 하러가기' : '去登录'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleBackToCart}
            className="w-10 h-10 flex items-center justify-center bg-slate-700 text-white rounded-lg hover:bg-slate-600"
          >
            ←
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {language === 'ko' ? '주문 확인' : '确认订单'}
            </h1>
            <p className="text-slate-400">
              {cartItems.length} {language === 'ko' ? '개의 상품' : '件商品'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Order Items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">
                {language === 'ko' ? '주문 상품' : '订单商品'}
              </h2>
              
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-xl">
                    <div className="w-16 h-16 flex-shrink-0 bg-gradient-to-br from-violet-600/20 to-cyan-600/20 rounded-xl flex items-center justify-center text-2xl">
                      {item.image}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-block px-2 py-0.5 text-xs font-medium bg-pink-500/20 text-pink-400 rounded-full">
                          {language === 'ko' 
                            ? typeLabels[item.type]?.ko 
                            : typeLabels[item.type]?.zh}
                        </span>
                      </div>
                      <p className="text-white font-medium truncate">
                        {language === 'ko' ? item.titleKo : item.title}
                      </p>
                      <p className="text-slate-400 text-sm">
                        ${item.price} × {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">
                {language === 'ko' ? '결제 수단' : '支付方式'}
              </h2>
              
              <div className="space-y-3">
                <label className={`flex items-center gap-4 p-4 bg-slate-700/50 rounded-xl cursor-pointer border-2 ${paymentMethod === 'wallet' ? 'border-violet-500' : 'border-transparent'}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="wallet"
                    checked={paymentMethod === 'wallet'}
                    onChange={() => setPaymentMethod('wallet')}
                    className="w-5 h-5 text-violet-500"
                  />
                  <div className="flex-1">
                    <p className="text-white font-medium">
                      {language === 'ko' ? 'USDT 지갑 잔액' : 'USDT 钱包余额'}
                    </p>
                    <p className="text-slate-400 text-sm">
                      {language === 'ko' ? '잔액으로 결제' : '使用余额支付'}
                    </p>
                  </div>
                  <div className="text-2xl">💰</div>
                </label>
                
                <label className={`flex items-center gap-4 p-4 bg-slate-700/50 rounded-xl cursor-pointer border-2 ${paymentMethod === 'usdt' ? 'border-violet-500' : 'border-transparent'}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="usdt"
                    checked={paymentMethod === 'usdt'}
                    onChange={() => setPaymentMethod('usdt')}
                    className="w-5 h-5 text-violet-500"
                  />
                  <div className="flex-1">
                    <p className="text-white font-medium">
                      {language === 'ko' ? 'USDT 직접 결제' : 'USDT 直接支付'}
                    </p>
                    <p className="text-slate-400 text-sm">
                      {language === 'ko' ? 'TRC20 네트워크로 즉시 결제' : '通过 TRC20 网络即时支付'}
                    </p>
                  </div>
                  <div className="text-2xl">₮</div>
                </label>
              </div>

              {/* Wallet Balance Warning */}
              {balance < total && (
                <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
                  <p className="text-red-400 text-sm">
                    {language === 'ko' 
                      ? '⚠️ 잔액이 부족합니다. 충전 후 다시 시도해주세요.' 
                      : '⚠️ 余额不足，请先充值后再试'}
                  </p>
                  <Link 
                    href="/dashboard?tab=wallet" 
                    className="inline-block mt-2 text-violet-400 hover:text-violet-300 text-sm"
                  >
                    {language === 'ko' ? '지갑으로 이동 →' : '前往钱包充值 →'}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right: Summary */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 sticky top-8">
              <h2 className="text-xl font-bold text-white mb-4">
                {language === 'ko' ? '결제 요약' : '支付摘要'}
              </h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-slate-400">
                  <span>{language === 'ko' ? '소계' : '小计'}</span>
                  <span>${subtotal.toFixed(2)} USDT</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>{language === 'ko' ? '서비스 수수료 (3%)' : '服务费 (3%)'}</span>
                  <span>${fee.toFixed(2)} USDT</span>
                </div>
                <div className="border-t border-slate-600 pt-3 flex justify-between">
                  <span className="text-white font-medium">
                    {language === 'ko' ? '총액' : '总计'}
                  </span>
                  <span className="text-2xl font-bold text-violet-400">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Pay Button */}
              <button
                onClick={handlePayment}
                disabled={processing || (paymentMethod === 'wallet' && balance < total)}
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    {language === 'ko' ? '처리 중...' : '处理中...'}
                  </span>
                ) : paymentMethod === 'usdt' ? (
                  <span>₮ {total.toFixed(2)} USDT {language === 'ko' ? '결제하기' : '立即支付'} →</span>
                ) : (
                  `$${total.toFixed(2)} USDT ${language === 'ko' ? '결제하기' : '立即支付'}`
                )}
              </button>

              <p className="text-slate-500 text-xs text-center mt-4">
                {language === 'ko' 
                  ? '결제 완료 후에는 취소가 불가능합니다' 
                  : '支付完成后无法取消订单'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
