'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface RechargeRecord {
  id: string;
  userId: string;
  amount: number;
  address: string;
  status: string;
  createdAt: string;
  expiresAt?: string;
  completedAt?: string;
}

export default function AdminRechargePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pendingRecharges, setPendingRecharges] = useState<RechargeRecord[]>([]);
  const [allRecharges, setAllRecharges] = useState<RechargeRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // 验证管理密码
  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await fetch('/api/admin/recharge', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminKey: password,
        }),
      });
      
      if (res.ok) {
        setAuthenticated(true);
        localStorage.setItem('adminAuthenticated', 'true');
        localStorage.setItem('adminKey', password);
      } else {
        setError('密码错误');
      }
    } catch (err) {
      setError('验证失败，请重试');
    }
  }, [password]);

  // 加载充值记录
  const loadRecharges = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/recharge');
      const data = await res.json();
      setPendingRecharges(data);
      
      // 加载所有充值记录（历史）
      const historyRes = await fetch('/api/recharge/list?admin=true');
      const historyData = await historyRes.json();
      setAllRecharges(Array.isArray(historyData) ? historyData : []);
    } catch (err) {
      console.error('Failed to load recharges:', err);
    }
    setLoading(false);
  }, []);

  // 处理确认/拒绝充值
  const handleAction = async (rechargeId: string, action: 'approve' | 'reject') => {
    const adminKey = localStorage.getItem('adminKey');
    if (!adminKey) {
      setAuthenticated(false);
      return;
    }

    setActionLoading(rechargeId);
    try {
      const res = await fetch('/api/admin/recharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rechargeId,
          action,
          adminKey,
        }),
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        alert(action === 'approve' 
          ? `充值已确认！用户新余额: ${data.newBalance} USDT` 
          : '充值已拒绝');
        loadRecharges();
      } else {
        alert(data.error || '操作失败');
      }
    } catch (err) {
      console.error('Action failed:', err);
      alert('操作失败');
    }
    setActionLoading(null);
    setConfirmId(null);
  };

  // 检查登录状态
  useEffect(() => {
    const isAuth = localStorage.getItem('adminAuthenticated');
    if (isAuth) {
      setAuthenticated(true);
      setPassword(localStorage.getItem('adminKey') || '');
    }
    setLoading(false);
  }, []);

  // 已认证，加载数据
  useEffect(() => {
    if (authenticated) {
      loadRecharges();
    }
  }, [authenticated, loadRecharges]);

  // 格式化时间
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 获取状态标签
  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; bg: string; text: string }> = {
      pending: { label: '待确认', bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
      pending_confirm: { label: '待确认', bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
      completed: { label: '已完成', bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
      rejected: { label: '已拒绝', bg: 'bg-red-500/20', text: 'text-red-400' },
      expired: { label: '已过期', bg: 'bg-slate-500/20', text: 'text-slate-400' },
    };
    const s = map[status] || { label: status, bg: 'bg-slate-500/20', text: 'text-slate-400' };
    return <span className={`px-2 py-1 text-xs rounded-full ${s.bg} ${s.text}`}>{s.label}</span>;
  };

  // 登出
  const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated');
    localStorage.removeItem('adminKey');
    setAuthenticated(false);
    setPassword('');
  };

  // 登录页面
  if (!loading && !authenticated) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">🔐</div>
              <h1 className="text-2xl font-bold text-white mb-2">管理员登录</h1>
              <p className="text-slate-400">请输入管理密码</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="管理密码"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>
              
              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}
              
              <button
                type="submit"
                className="w-full py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-500 transition-colors"
              >
                登录
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm">
                ← 返回用户中心
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 加载状态
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

  // 过滤显示的记录
  const displayPending = pendingRecharges.filter(r => 
    r.status === 'pending' || r.status === 'pending_confirm'
  );
  const completedRecharges = allRecharges.filter(r => 
    r.status === 'completed' || r.status === 'rejected'
  );

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="w-10 h-10 flex items-center justify-center bg-slate-700 text-white rounded-lg hover:bg-slate-600"
            >
              ←
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">充值管理</h1>
              <p className="text-slate-400">确认用户 USDT 充值</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-slate-700 text-slate-400 rounded-lg hover:text-white"
          >
            退出登录
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-sm">待确认</p>
            <p className="text-3xl font-bold text-yellow-400">{displayPending.length}</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-sm">已完成</p>
            <p className="text-3xl font-bold text-emerald-400">
              {completedRecharges.filter(r => r.status === 'completed').length}
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-sm">已拒绝</p>
            <p className="text-3xl font-bold text-red-400">
              {completedRecharges.filter(r => r.status === 'rejected').length}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'pending' 
                ? 'bg-yellow-600 text-white' 
                : 'bg-slate-700 text-slate-400'
            }`}
          >
            ⏳ 待确认 ({displayPending.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'history' 
                ? 'bg-violet-600 text-white' 
                : 'bg-slate-700 text-slate-400'
            }`}
          >
            📋 充值记录
          </button>
        </div>

        {/* Pending Tab */}
        {activeTab === 'pending' && (
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
            {displayPending.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <div className="text-5xl mb-4">✅</div>
                <p>暂无待确认的充值</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-slate-400 font-medium">用户ID</th>
                    <th className="px-4 py-3 text-left text-slate-400 font-medium">金额</th>
                    <th className="px-4 py-3 text-left text-slate-400 font-medium">状态</th>
                    <th className="px-4 py-3 text-left text-slate-400 font-medium">创建时间</th>
                    <th className="px-4 py-3 text-right text-slate-400 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {displayPending.map((record) => (
                    <tr key={record.id} className="border-t border-slate-700">
                      <td className="px-4 py-4">
                        <p className="text-white font-mono text-sm">{record.userId.slice(0, 12)}...</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-xl font-bold text-emerald-400">{record.amount} USDT</p>
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(record.status)}
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-slate-400 text-sm">{formatDate(record.createdAt)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          {confirmId === record.id ? (
                            <>
                              <button
                                onClick={() => handleAction(record.id, actionType)}
                                disabled={actionLoading === record.id}
                                className="px-3 py-1 bg-emerald-600 text-white text-sm rounded-lg disabled:opacity-50"
                              >
                                {actionLoading === record.id ? '...' : '确认'}
                              </button>
                              <button
                                onClick={() => setConfirmId(null)}
                                className="px-3 py-1 bg-slate-600 text-white text-sm rounded-lg"
                              >
                                取消
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setActionType('approve');
                                  setConfirmId(record.id);
                                }}
                                disabled={actionLoading !== null}
                                className="px-3 py-1 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-500 disabled:opacity-50"
                              >
                                ✅ 确认
                              </button>
                              <button
                                onClick={() => {
                                  setActionType('reject');
                                  setConfirmId(record.id);
                                }}
                                disabled={actionLoading !== null}
                                className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-500 disabled:opacity-50"
                              >
                                ❌ 拒绝
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
            {completedRecharges.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <div className="text-5xl mb-4">📋</div>
                <p>暂无充值记录</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-slate-400 font-medium">用户ID</th>
                    <th className="px-4 py-3 text-left text-slate-400 font-medium">金额</th>
                    <th className="px-4 py-3 text-left text-slate-400 font-medium">状态</th>
                    <th className="px-4 py-3 text-left text-slate-400 font-medium">创建时间</th>
                    <th className="px-4 py-3 text-left text-slate-400 font-medium">完成时间</th>
                  </tr>
                </thead>
                <tbody>
                  {completedRecharges.map((record) => (
                    <tr key={record.id} className="border-t border-slate-700">
                      <td className="px-4 py-4">
                        <p className="text-white font-mono text-sm">{record.userId.slice(0, 12)}...</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-xl font-bold text-white">{record.amount} USDT</p>
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(record.status)}
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-slate-400 text-sm">{formatDate(record.createdAt)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-slate-400 text-sm">{formatDate(record.completedAt || '')}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
