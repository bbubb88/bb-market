'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useI18n } from '@/lib/i18n';

const USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT_TRC20_ADDRESS || 'TXqY4K3QvJk9xLm2nP7rT8sUw5xYz6Gh';
const EXPIRY_MINUTES = parseInt(process.env.NEXT_PUBLIC_USDT_EXPIRY_MINUTES || '15');

interface RechargeRecord {
  id?: string;
  amount: number;
  address: string;
  status: 'pending' | 'pending_confirm' | 'completed' | 'expired' | 'rejected';
  createdAt: string;
  expiresAt: string;
  screenshotUrl?: string;
  // NowPayments 字段
  nowpaymentsId?: number;
  payAmount?: number;
  payCurrency?: string;
  // Cryptomus 字段
  cryptomusUuid?: string;
  currency?: string;
  network?: string;
  // 通用字段
  qrCodeUrl?: string;
  fallback?: boolean;
}

function RechargeContent() {
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

  // 获取金额参数和订单ID
  const orderAmount = searchParams.get('amount');
  const orderIdsParam = searchParams.get('orders');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const userObj = JSON.parse(userData);
      setUser(userObj);
    }
    setLoading(false);
  }, []);

  // 生成充值记录 - 优先使用 Cryptomus，然后 NowPayments
  const createRechargeRecord = useCallback(async () => {
    if (!user || !amount || parseFloat(amount) <= 0) return;

    setSubmitting(true);
    try {
      // 解析订单ID列表
      const orderIds = orderIdsParam ? orderIdsParam.split(',') : [];
      
      // 1. 优先尝试 Cryptomus API
      let data = null;
      let usedCryptomus = false;
      let usedNowPayments = false;
      
      const cryptomusRes = await fetch('/api/recharge/cryptomus/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          amount: parseFloat(amount),
          orderIds: orderIds.length > 0 ? orderIds : undefined,
        }),
      });

      if (cryptomusRes.ok) {
        data = await cryptomusRes.json();
        usedCryptomus = !data.fallback;
        console.log('[Recharge] Using Cryptomus:', usedCryptomus);
      }

      // 2. 如果 Cryptomus 失败，尝试 NowPayments API
      if (!usedCryptomus) {
        const nowpaymentsRes = await fetch('/api/recharge/nowpayments/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            amount: parseFloat(amount),
            orderIds: orderIds.length > 0 ? orderIds : undefined,
          }),
        });
        
        if (nowpaymentsRes.ok) {
          data = await nowpaymentsRes.json();
          usedNowPayments = !data.fallback;
          console.log('[Recharge] Using NowPayments:', usedNowPayments);
        }
      }

      // 3. 如果都失败，使用传统方式
      if (!usedCryptomus && !usedNowPayments) {
        const res = await fetch('/api/recharge/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            amount: parseFloat(amount),
            orderIds: orderIds.length > 0 ? orderIds : undefined,
          }),
        });
        data = await res.json();
      }

      if (data) {
        setRecord(data);
        
        // 使用 NowPayments 返回的二维码或生成传统二维码
        if (data.qrCodeUrl) {
          setQrCodeUrl(data.qrCodeUrl);
        } else if (data.address) {
          const usdtAmount = data.payAmount || parseFloat(amount);
          setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=trc20:${data.address}?amount=${usdtAmount}&color=ffffff&bgcolor=1a1a2e`);
        }
        
        // 使用 NowPayments 的过期时间或默认时间
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
    // 优先使用 record 中的地址，否则使用默认地址
    const address = record?.address || USDT_ADDRESS;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 支付状态轮询 (支持 NowPayments 和 Cryptomus)
  useEffect(() => {
    if (!record?.id || record.fallback) return;

    const checkStatus = async () => {
      try {
        // 根据是否有 cryptomusUuid 判断使用哪个 API
        let statusUrl = `/api/recharge/nowpayments/status?rechargeId=${record.id}`;
        if (record.cryptomusUuid) {
          statusUrl = `/api/recharge/cryptomus/status?rechargeId=${record.id}&walletUuid=${record.cryptomusUuid}`;
        }
        
        const res = await fetch(statusUrl);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'completed') {
            // 支付完成，跳转到钱包页面
            alert(language === 'ko' ? '결제가 완료되었습니다!' : '支付成功！');
            router.push('/dashboard?tab=wallet');
          }
        }
      } catch (error) {
        console.error('Status check error:', error);
      }
    };

    // 每10秒检查一次支付状态
    const pollInterval = setInterval(checkStatus, 10000);

    return () => clearInterval(pollInterval);
  }, [record]);

  // 刷新页面重新生成
  const handleRefresh = () => {
    setRecord(null);
    setAmount('');
    setQrCodeUrl('');
    setTimeLeft(EXPIRY_MINUTES * 60);
    setIsExpired(false);
  };

  // 截图上传状态
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  // 处理截图选择
  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshotFile(file);
      // 生成预览
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 上传截图并确认转账
  const handleConfirmTransfer = async () => {
    if (!record?.id) return;
    
    // 如果还没有显示上传弹窗，先显示
    if (!showUploadModal) {
      setShowUploadModal(true);
      return;
    }
    
    setUploading(true);
    try {
      let screenshotUrl = '';
      
      // 如果有截图文件，直接使用 base64 预览（简化处理）
      if (screenshotPreview) {
        screenshotUrl = screenshotPreview;
      }

      // 确认转账
      const res = await fetch('/api/recharge/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rechargeId: record.id,
          screenshotUrl: screenshotUrl,
        }),
      });

      if (res.ok) {
        alert(language === 'ko' ? '확인 요청이 제출되었습니다. 관리자 확인을 기다려주세요.' : '已提交确认请求，请等待管理员确认。');
        router.push('/dashboard?tab=wallet');
      }
    } catch (error) {
      console.error('Failed to confirm transfer:', error);
    } finally {
      setUploading(false);
      setShowUploadModal(false);
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

        {/* Screenshot Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-white mb-4">
                {language === 'ko' ? '📸转账 증빙Screenshot' : '📸 上传转账截图'}
              </h3>
              
              <p className="text-slate-400 text-sm mb-4">
                {language === 'ko' 
                  ? '转账 완료 후 스크린샷을 업로드해주세요 (선택사항)' 
                  : '请上传转账截图以便管理员核实（可选）'}
              </p>
              
              <div className="mb-4">
                <label className="block">
                  <div className="border-2 border-dashed border-slate-600 rounded-xl p-6 text-center cursor-pointer hover:border-violet-500 transition-colors">
                    {screenshotPreview ? (
                      <img src={screenshotPreview} alt="Screenshot preview" className="max-h-48 mx-auto rounded-lg" />
                    ) : (
                      <>
                        <div className="text-4xl mb-2">📎</div>
                        <p className="text-slate-400 text-sm">
                          {language === 'ko' ? '클릭하여 파일 선택' : '点击选择文件'}
                        </p>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleScreenshotChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setShowUploadModal(false);
                    setScreenshotFile(null);
                    setScreenshotPreview('');
                  }}
                  className="flex-1 py-3 bg-slate-700 text-white rounded-xl"
                >
                  {language === 'ko' ? '취소' : '取消'}
                </button>
                <button 
                  onClick={handleConfirmTransfer}
                  disabled={uploading}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl disabled:opacity-50"
                >
                  {uploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span>
                    </span>
                  ) : (
                    language === 'ko' ? '확인 요청' : '确认提交'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
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

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">⏳</div>
        <p className="text-slate-400">Loading...</p>
      </div>
    </div>
  );
}

export default function RechargePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RechargeContent />
    </Suspense>
  );
}
