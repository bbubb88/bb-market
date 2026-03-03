'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Message {
  id: number;
  userId: string;
  userEmail: string;
  message: string;
  isFromAdmin: boolean;
  adminId: string;
  createdAt: string;
  read: boolean;
}

export default function AdminChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // 轮询获取新消息
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [refreshKey]);

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/chat?admin=true');
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Fetch messages error:', err);
    }
  };

  const getUserMessages = (userId: string) => {
    return messages.filter(m => m.userId === userId);
  };

  const getUniqueUsers = () => {
    const users = new Map();
    messages.forEach(m => {
      if (!m.isFromAdmin) {
        users.set(m.userId, {
          userId: m.userId,
          userEmail: m.userEmail,
          lastMessage: m.message,
          createdAt: m.createdAt,
          unread: !m.read
        });
      }
    });
    return Array.from(users.values());
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selectedUser || sending) return;

    setSending(true);
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: replyText,
          userId: selectedUser,
          adminId: 'admin',
          adminMode: 'true'
        }),
      });
      setReplyText('');
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error('Send reply error:', err);
    } finally {
      setSending(false);
    }
  };

  const users = getUniqueUsers();

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-violet-400 hover:text-violet-300">← 返回</Link>
            <h1 className="text-white font-bold text-xl">🎧 客服管理中心</h1>
          </div>
          <div className="text-slate-400 text-sm">
            在线用户: {users.length}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 flex gap-4 h-[calc(100vh-80px)]">
        {/* 用户列表 */}
        <div className="w-80 bg-slate-800 rounded-xl border border-slate-700 flex flex-col">
          <div className="p-3 border-b border-slate-700">
            <h2 className="text-white font-semibold">用户列表</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {users.length === 0 ? (
              <p className="text-slate-500 text-center p-4">暂无消息</p>
            ) : (
              users.map(user => (
                <div
                  key={user.userId}
                  onClick={() => setSelectedUser(user.userId)}
                  className={`p-3 border-b border-slate-700 cursor-pointer hover:bg-slate-700 ${
                    selectedUser === user.userId ? 'bg-slate-700' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">{user.userEmail}</span>
                    {user.unread && <span className="w-2 h-2 bg-violet-500 rounded-full"></span>}
                  </div>
                  <p className="text-slate-400 text-sm truncate mt-1">{user.lastMessage}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 聊天区域 */}
        <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 flex flex-col">
          {selectedUser ? (
            <>
              {/* 消息列表 */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {getUserMessages(selectedUser).map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isFromAdmin ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] rounded-xl p-3 ${
                      msg.isFromAdmin ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-200'
                    }`}>
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-xs mt-1 ${msg.isFromAdmin ? 'text-violet-200' : 'text-slate-400'}`}>
                        {msg.isFromAdmin ? '客服' : msg.userEmail} • {new Date(msg.createdAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 回复输入 */}
              <div className="p-4 border-t border-slate-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && sendReply()}
                    placeholder="输入回复..."
                    className="flex-1 p-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-violet-500"
                    disabled={sending}
                  />
                  <button
                    onClick={sendReply}
                    disabled={sending || !replyText.trim()}
                    className="px-6 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold rounded-xl"
                  >
                    {sending ? '发送中' : '发送'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              选择一个用户开始对话
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
