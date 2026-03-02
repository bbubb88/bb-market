'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useI18n } from '@/lib/i18n';

const USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT_TRC20_ADDRESS || 'TXqY4K3QvJk9xLm2nP7rT8sUw5xYz6Gh';
const EXPIRY_MINUTES = parseInt(process.env.NEXT_PUBLIC_USDT_EXPIRY_MINUTES || '15');

interface RechargeRecord {
  id?: string;
  amount: number;
  address: string;
  status: 'pending' | 'completed' | 'expired';
  createdAt: string;
  expiresAt: string;
}

export default function RechargePage() {
  const { language } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [timeLeft, setTimeLeft] = useState(EXPIRY_MINUTES * 60);
  const [isExpired, setIsExpired] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [record, setRecord] = useState<RechargeRecord | null>(null);
  const [copied, setCopied] = useState(false);

  // 获取金额参数
  const orderAmount = searchParams.get('amount');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const userObj = JSON.parse(userData);
      setUser(userObj);
    }
    setLoading(false);
  }, []);

  // 生成充值记录
  const createRechargeRecord = useCallback(async () => {
    if (!user || !amount || parseFloat(amount) <= 0) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/recharge/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          amount: parseFloat(amount),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setRecord(data);
        // 生成二维码 URL
        const usdtAmount = parseFloat(amount);
        setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=trc20:${USDT_ADDRESS}?amount=${usdtAmount}&color=ffffff&bgcolor=1a1a2e`);
        setTimeLeft(EXPIRY_MINUTES * 60);
        setIsExpired(false);
      }
    } catch (error) {
      console.error('Failed to create recharge record:', error);
    } finally {
      setSubmitting(false);
    }
  }, [user, amount]);

  // 倒计时
  useEffect(() => {
    if (timeLeft <= 0) {
      setIsExpired(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 复制地址
  const copyAddress = () => {
    navigator.clipboard.writeText(USDT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 刷新页面重新生成
  const handleRefresh = () => {
    setRecord(null);
    setAmount('');
    setQrCodeUrl('');
    setTimeLeft(EXPIRY_MINUTES * 60);
    setIsExpired(false);
  };

  // 标记已转账
  const handleConfirmTransfer = async () => {
    if (!record?.id) return;
    
    try {
      const res = await fetch('/api/recharge/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rechargeId: record.id,
        }),
      });

      if (res.ok) {
        alert(language === 'ko' ? '확인 요청이 제출되었습니다. 관리자 확인을 기다려주세요.' : '已提交确认请求，请等待管理员确认。');
        router.push('/dashboard?tab=wallet');
      }
    } catch (error) {
      console.error('Failed to confirm transfer:', error);
    }
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

  // 已创建充值记录页面
  if (record) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-2xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link
              href="/dashboard?tab=wallet"
              className="w-10 h-10 flex items-center justify-center bg-slate-700 text-white rounded-lg hover:bg-slate-600"
            >
              ←
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {language === 'ko' ? 'USDT 충전' : 'USDT 充值'}
              </h1>
              <p className="text-slate-400">
                {language === 'ko' ? 'QR코드를 스캔하여 결제하세요' : '扫描二维码完成支付'}
              </p>
            </div>
          </div>

          {/* Expiry Warning */}
          {isExpired ? (
            <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-6 mb-6">
              <div className="text-center">
                <div className="text-5xl mb-4">⏰</div>
                <h2 className="text-xl font-bold text-red-400 mb-2">
                  {language === 'ko' ? '결제 기한 만료' : '支付已过期'}
                </h2>
                <p className="text-slate-400 mb-4">
                  {language === 'ko' 
                    ? '새로운 결제 정보를 생성해주세요' 
                    : '请重新生成支付信息'}
                </p>
                <button
                  onClick={handleRefresh}
                  className="px-6 py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-500"
                >
                  {language === 'ko' ? '새로고침' : '重新生成'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Countdown Timer */}
              <div className={`rounded-2xl p-6 mb-6 text-center ${
                timeLeft < 60 ? 'bg-red-500/20 border border-red-500/50' : 'bg-slate-800/50 border border-slate-700'
              }`}>
                <p className="text-slate-400 mb-2">
                  {language === 'ko' ? '남은 시간' : '剩余时间'}
                </p>
                <p className={`text-4xl font-bold ${timeLeft < 60 ? 'text-red-400' : 'text-violet-400'}`}>
                  {formatTime(timeLeft)}
                </p>
              </div>

              {/* Amount */}
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 mb-6">
                <p className="text-slate-400 text-sm mb-2">
                  {language === 'ko' ? '결제 금액' : '支付金额'}
                </p>
                <p className="text-4xl font-bold text-white">
                  {record.amount.toFixed(2)} USDT
                </p>
              </div>

              {/* QR Code */}
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 mb-6">
                <p className="text-slate-400 text-sm mb-4 text-center">
                  {language === 'ko' ? 'QR코드' : '二维码'}
                </p>
                <div className="flex justify-center mb-4">
                  {qrCodeUrl ? (
                    <img 
                      src={qrCodeUrl} 
                      alt="USDT QR Code" 
                      className="w-48 h-48 rounded-xl"
                    />
                  ) : (
                    <div className="w-48 h-48 bg-slate-700 rounded-xl flex items-center justify-center">
                      <span className="text-slate-400">Loading...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 mb-6">
                <p className="text-slate-400 text-sm mb-2">
                  {language === 'ko' ? '수금 주소 (TRC20)' : '收款地址 (TRC20)'}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-white font-mono text-sm flex-1 break-all">
                    {USDT_ADDRESS}
                  </p>
                  <button
                    onClick={copyAddress}
                    className="px-3 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-500 whitespace-nowrap"
                  >
                    {copied ? '✓' : '📋'}
                  </button>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-amber-500/20 border border-amber-500/50 rounded-2xl p-4 mb-6">
                <p className="text-amber-400 font-medium mb-2">
                  ⚠️ {language === 'ko' ? '중요 안내' : '重要提示'}
                </p>
                <ul className="text-slate-400 text-sm space-y-1">
                  <li>• {language === 'ko' ? 'TRC20 네트워크만 지원됩니다' : '仅支持 TRC20 网络'}</li>
                  <li>• {language === 'ko' ? '다른 네트워크로 전송 시 자산을 잃을 수 있습니다' : '使用其他网络转账将导致资产丢失'}</li>
                  <li>• {language === 'ko' ? '정확한 금액을 전송해주세요' : '请精确转账指定金额'}</li>
                </ul>
              </div>

              {/* Confirm Button */}
              <button
                onClick={handleConfirmTransfer}
                className="w-full py-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-500 transition-colors"
              >
                {language === 'ko' ? '✅ 전송 완료 - 확인 요청' : '✅ 我已转账，等待确认'}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // 输入金额页面
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/dashboard?tab=wallet"
            className="w-10 h-10 flex items-center justify-center bg-slate-700 text-white rounded-lg hover:bg-slate-600"
          >
            ←
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {language === 'ko' ? 'USDT 충전' : 'USDT 充值'}
            </h1>
            <p className="text-slate-400">
              {language === 'ko' ? 'USDT를充值하여 잔액을 충전하세요' : '通过 USDT 充值到账余额'}
            </p>
          </div>
        </div>

        {/* Pre-filled amount from checkout */}
        {orderAmount && (
          <div className="bg-violet-500/20 border border-violet-500/50 rounded-xl p-4 mb-6">
            <p className="text-violet-400 text-sm">
              {language === 'ko' 
                ? `주문 결제를 위한 금액: ${orderAmount} USDT` 
                : `订单支付金额: ${orderAmount} USDT`}
            </p>
          </div>
        )}

        {/* Amount Input */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 mb-6">
          <label className="block text-white font-medium mb-4">
            {language === 'ko' ? '충전 금액 (USDT)' : '充值金额 (USDT)'}
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="5"
              step="0.01"
              className="w-full px-4 py-4 bg-slate-700 border border-slate-600 rounded-xl text-white text-2xl text-center font-bold placeholder:text-slate-500"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
              USDT
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-2">
            {language === 'ko' ? '최소充值금액: 5 USDT' : '最低充值金额: 5 USDT'}
          </p>
        </div>

        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[10, 20, 50, 100].map((val) => (
            <button
              key={val}
              onClick={() => setAmount(val.toString())}
              className="py-3 bg-slate-700 text-white font-medium rounded-xl hover:bg-slate-600"
            >
              {val} USDT
            </button>
          ))}
        </div>

        {/* Info */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 mb-6">
          <h3 className="text-white font-medium mb-4">
            {language === 'ko' ? '충전 안내' : '充值说明'}
          </h3>
          <ul className="text-slate-400 text-sm space-y-2">
            <li>• {language === 'ko' ? 'TRC20 네트워크만 지원됩니다' : '仅支持 TRC20 网络'}</li>
            <li>• {language === 'ko' ? '결제有效期: 15분' : '支付有效期: 15分钟'}</li>
            <li>• {language === 'ko' ? '区块 확인 후 잔액 반영' : '区块确认后自动到账'}</li>
            <li>• {language === 'ko' ? '문의는 관리자에게 연락하세요' : '如有疑问请联系管理员'}</li>
          </ul>
        </div>

        {/* Generate Button */}
        <button
          onClick={createRechargeRecord}
          disabled={submitting || !amount || parseFloat(amount) < 5}
          className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl hover:from-violet-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span>
              {language === 'ko' ? '생성 중...' : '生成中...'}
            </span>
          ) : (
            `${language === 'ko' ? '결제 정보 생성' : '生成支付信息'} →`
          )}
        </button>
      </div>
    </div>
  );
}
