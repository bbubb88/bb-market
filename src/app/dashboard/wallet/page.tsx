'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'buy' | 'sell' | 'fee';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  description?: string;
}

interface RechargeRecord {
  id: string;
  amount: number;
  address: string;
  status: 'pending' | 'pending_confirm' | 'completed' | 'expired' | 'rejected';
  createdAt: string;
  expiresAt?: string;
  completedAt?: string;
  screenshotUrl?: string;
}

export default function WalletPage() {
  const { t } = useI18n();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rechargeRecords, setRechargeRecords] = useState<RechargeRecord[]>([]);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Safe userId extraction - handles SSR and client-side
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          setUserId(user?.id || null);
        } else {
          setUserId(null);
        }
      } catch (e) {
        console.error('Error parsing user:', e);
        setUserId(null);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (userId) {
      loadWalletData();
    }
  }, [userId]);

  const loadWalletData = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    try {
      // 从 API 获取钱包数据
      const res = await fetch(`/api/wallet?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setBalance(data?.balance || 0);
        setTransactions(data?.transactions || []);
      } else {
        // 如果没有数据，使用默认值
        setBalance(0);
        setTransactions([]);
      }

      // 获取充值记录
      try {
        const rechargeRes = await fetch(`/api/recharge/list?userId=${userId}`);
        if (rechargeRes.ok) {
          const rechargeData = await rechargeRes.json();
          setRechargeRecords(Array.isArray(rechargeData) ? rechargeData : []);
        } else {
          setRechargeRecords([]);
        }
      } catch (e) {
        console.log('Recharge API not available');
        setRechargeRecords([]);
      }
    } catch (err) {
      console.error('Wallet load error:', err);
      setError('加载钱包数据失败');
      setBalance(0);
      setTransactions([]);
      setRechargeRecords([]);
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

  const getTransactionIcon = (type: string) => {
    const map: Record<string, string> = {
      deposit: '💰',
      withdraw: '💸',
      buy: '🛒',
      sell: '💰',
      fee: '📝',
    };
    return map[type] || '💳';
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      pending: { label: '处理中', color: 'bg-yellow-500/20 text-yellow-400' },
      completed: { label: '已完成', color: 'bg-emerald-500/20 text-emerald-400' },
      failed: { label: '失败', color: 'bg-red-500/20 text-red-400' },
    };
    const s = map[status] || { label: status, color: 'bg-slate-500/20 text-slate-400' };
    return <span className={`px-2 py-1 text-xs rounded-full ${s.color}`}>{s.label}</span>;
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">💳 钱包</h1>
            <p className="text-slate-400 mt-1">管理您的 USDT 资产</p>
          </div>
          <Link href="/dashboard" className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">
            ← 返回用户中心
          </Link>
        </div>

        {!userId ? (
          <div className="bg-slate-800/50 rounded-2xl p-12 border border-slate-700 text-center">
            <p className="text-6xl mb-4">🔐</p>
            <h2 className="text-xl font-semibold text-white mb-2">请先登录</h2>
            <p className="text-slate-400 mb-6">登录后即可查看钱包</p>
            <Link href="/login" className="px-6 py-3 bg-violet-600 text-white font-medium rounded-lg">
              去登录
            </Link>
          </div>
        ) : (
          <>
            {/* Balance Card */}
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-8 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm mb-2">USDT 余额</p>
                  <p className="text-5xl font-bold text-white">{balance.toFixed(2)}</p>
                  <p className="text-white/60 text-sm mt-2">≈ ${balance.toFixed(2)} USD</p>
                </div>
                <div className="text-8xl opacity-50">💰</div>
              </div>
              
              <div className="flex gap-4 mt-8">
                <Link 
                  href="/recharge"
                  className="flex-1 py-3 bg-white/20 text-white font-medium rounded-xl hover:bg-white/30 transition-colors text-center"
                >
                  💰 充值
                </Link>
                <button 
                  onClick={() => setShowWithdrawModal(true)}
                  className="flex-1 py-3 bg-white/20 text-white font-medium rounded-xl hover:bg-white/30 transition-colors"
                >
                  💸 提现
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-center">
                <p className="text-2xl mb-1">📋</p>
                <p className="text-slate-400 text-sm">待确认</p>
                <p className="text-yellow-400 font-bold">{rechargeRecords.filter(r => r.status === 'pending' || r.status === 'pending_confirm').length}</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-center">
                <p className="text-2xl mb-1">✅</p>
                <p className="text-slate-400 text-sm">已完成</p>
                <p className="text-emerald-400 font-bold">{rechargeRecords.filter(r => r.status === 'completed').length}</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-center">
                <p className="text-2xl mb-1">💳</p>
                <p className="text-slate-400 text-sm">累计充值</p>
                <p className="text-violet-400 font-bold">{rechargeRecords.length}</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-center">
                <p className="text-2xl mb-1">💰</p>
                <p className="text-slate-400 text-sm">累计交易</p>
                <p className="text-cyan-400 font-bold">{transactions.length}</p>
              </div>
            </div>

            {/* Recharge Records */}
            {rechargeRecords.length > 0 && (
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 mb-8">
                <h2 className="text-xl font-bold text-white mb-6">💰 充值记录</h2>
                <div className="space-y-3">
                  {rechargeRecords.slice(0, 5).map((recharge) => (
                    <div key={recharge.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-2xl">
                          ₮
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            充值 {recharge.amount.toFixed(2)} USDT
                          </p>
                          <p className="text-slate-400 text-sm">{formatDate(recharge.createdAt)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {recharge.status === 'pending' && (
                          <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400">等待转账</span>
                        )}
                        {recharge.status === 'pending_confirm' && (
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400">等待确认</span>
                        )}
                        {recharge.status === 'completed' && (
                          <span className="px-2 py-1 text-xs rounded-full bg-emerald-500/20 text-emerald-400">已完成</span>
                        )}
                        {recharge.status === 'expired' && (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">已过期</span>
                        )}
                        {recharge.status === 'rejected' && (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">已拒绝</span>
                        )}
                        {recharge.screenshotUrl && (
                          <button
                            onClick={() => setSelectedScreenshot(recharge.screenshotUrl!)}
                            className="px-2 py-1 text-xs rounded-full bg-violet-500/20 text-violet-400 hover:bg-violet-500/30"
                          >
                            📷 截图
                          </button>
                        )}
                        <p className="text-lg font-bold text-emerald-400">
                          +{recharge.amount.toFixed(2)} USDT
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transaction History */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-6">📝 交易记录</h2>
              
              {loading ? (
                <div className="text-center py-8 text-slate-400">加载中...</div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-4xl mb-4">📝</p>
                  <p className="text-slate-400">暂无交易记录</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-600 rounded-xl flex items-center justify-center text-2xl">
                          {getTransactionIcon(tx.type)}
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {tx.type === 'deposit' && '充值'}
                            {tx.type === 'withdraw' && '提现'}
                            {tx.type === 'buy' && '购买商品'}
                            {tx.type === 'sell' && '出售商品'}
                            {tx.type === 'fee' && '手续费'}
                          </p>
                          <p className="text-slate-400 text-sm">{formatDate(tx.createdAt)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {getStatusBadge(tx.status)}
                        <p className={`text-lg font-bold ${
                          tx.type === 'deposit' || tx.type === 'sell' 
                            ? 'text-emerald-400' 
                            : 'text-white'
                        }`}>
                          {tx.type === 'deposit' || tx.type === 'sell' ? '+' : '-'}{tx.amount} USDT
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Deposit Modal */}
            {showDepositModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full">
                  <h3 className="text-xl font-bold text-white mb-4">💰 充值 USDT</h3>
                  <div className="bg-slate-700 rounded-xl p-4 mb-4">
                    <p className="text-slate-400 text-sm mb-2">充值地址 (TRC20)</p>
                    <p className="text-white font-mono text-sm break-all">TXqY4K3QvJk9xLm2nP7rT8sUw5xYz6Gh</p>
                  </div>
                  <p className="text-slate-400 text-sm mb-4">
                    请向以上地址转入 USDT (TRC20)，确认后会自动到账。预计到账时间: 5-30分钟
                  </p>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowDepositModal(false)}
                      className="flex-1 py-3 bg-slate-700 text-white rounded-xl"
                    >
                      关闭
                    </button>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText('TXqY4K3QvJk9xLm2nP7rT8sUw5xYz6Gh');
                        alert('地址已复制');
                      }}
                      className="flex-1 py-3 bg-violet-600 text-white rounded-xl"
                    >
                      复制地址
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Withdraw Modal */}
            {showWithdrawModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full">
                  <h3 className="text-xl font-bold text-white mb-4">💸 提现 USDT</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">提现地址 (TRC20)</label>
                      <input 
                        type="text" 
                        placeholder="输入您的钱包地址"
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">提现数量</label>
                      <input 
                        type="number" 
                        placeholder="最小 10 USDT"
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white"
                      />
                    </div>
                    <div className="bg-slate-700/50 rounded-xl p-3">
                      <p className="text-slate-400 text-sm">手续费: 1 USDT</p>
                      <p className="text-slate-400 text-sm">预计到账: - USDT</p>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button 
                      onClick={() => setShowWithdrawModal(false)}
                      className="flex-1 py-3 bg-slate-700 text-white rounded-xl"
                    >
                      取消
                    </button>
                    <button 
                      className="flex-1 py-3 bg-emerald-600 text-white rounded-xl"
                    >
                      确认提现
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Screenshot Modal */}
            {selectedScreenshot && (
              <div 
                className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                onClick={() => setSelectedScreenshot(null)}
              >
                <div className="bg-slate-800 rounded-2xl p-4 max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">转账截图</h3>
                    <button 
                      onClick={() => setSelectedScreenshot(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  <img 
                    src={selectedScreenshot} 
                    alt="Transfer screenshot" 
                    className="w-full rounded-lg"
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
