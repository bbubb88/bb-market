'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Message {
  id: number;
  userId: string;
  userEmail: string;
  message: string;
  isFromAdmin: boolean;
  createdAt: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 初始化用户 ID
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const user = JSON.parse(stored);
      setUserId(user.id || user.user_metadata?.id || `guest_${Date.now()}`);
    } else {
      setUserId(`guest_${Date.now()}`);
    }
  }, []);

  // 轮询获取消息
  useEffect(() => {
    if (!userId) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chat?userId=${userId}`);
        const data = await res.json();
        setMessages(data.messages || []);
      } catch (err) {
        console.error('Fetch messages error:', err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [userId]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userEmail = user?.email || user?.user_metadata?.email || '游客';

    setSending(true);
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          userEmail,
          userId,
        }),
      });
      setInput('');
    } catch (err) {
      console.error('Send message error:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 p-4 sticky top-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-violet-400 hover:text-violet-300">
            ← 返回首页
          </Link>
          <h1 className="text-white font-semibold">💬 在线客服</h1>
          <div className="w-16"></div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-slate-800 rounded-xl border border-slate-700 h-[calc(100vh-220px)] flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-slate-500 py-8">
                <p className="text-lg mb-2">👋 您好！</p>
                <p>欢迎来到 BB Market 客服中心</p>
                <p className="text-sm mt-2">请发送消息，客服会尽快回复您</p>
              </div>
            ) : (
              messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isFromAdmin ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-xl p-3 ${
                      msg.isFromAdmin
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-700 text-slate-200'
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <p className={`text-xs mt-1 ${msg.isFromAdmin ? 'text-violet-200' : 'text-slate-400'}`}>
                      {msg.isFromAdmin ? '客服' : '您'} • {new Date(msg.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入您的消息..."
                className="flex-1 p-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-violet-500"
                disabled={sending}
              />
              <button
                onClick={sendMessage}
                disabled={sending || !input.trim()}
                className="px-6 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
              >
                {sending ? '...' : '发送'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center py-4 text-slate-500 text-sm">
        <p>工作时间: 7×24 小时在线 | 或联系：📧 support@bbmarket.com</p>
      </div>
    </div>
  );
}
