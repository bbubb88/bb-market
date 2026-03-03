'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  isAI: boolean;
  time: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 初始化欢迎消息
  useEffect(() => {
    setMessages([
      {
        id: 1,
        text: '你好！我是 BB Market 智能客服 🤖\n\n有什么可以帮助你的？',
        isUser: false,
        isAI: true,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    const userMessage: Message = {
      id: Date.now(),
      text: input,
      isUser: true,
      isAI: false,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      // 获取用户信息
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const userEmail = user?.email || user?.user_metadata?.email || null;
      const userId = user?.id || null;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          userEmail,
          userId,
        }),
      });

      const data = await res.json();

      if (data.success && data.reply) {
        // 添加 AI 回复
        const aiReply: Message = {
          id: Date.now() + 1,
          text: data.reply,
          isUser: false,
          isAI: true,
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, aiReply]);
      }
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
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <h1 className="text-white font-semibold">🤖 智能客服</h1>
          </div>
          <div className="w-16"></div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-slate-800 rounded-xl border border-slate-700 h-[calc(100vh-220px)] flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl p-3 ${
                    msg.isUser
                      ? 'bg-violet-600 text-white'
                      : msg.isAI
                      ? 'bg-slate-700 text-slate-200 border border-violet-500/30'
                      : 'bg-slate-700 text-slate-200'
                  }`}
                >
                  {!msg.isUser && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">🤖</span>
                      <span className="text-violet-400 text-sm font-medium">BB Market 客服</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-line">{msg.text}</p>
                  <p className={`text-xs mt-1 ${msg.isUser ? 'text-violet-200' : 'text-slate-400'}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
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
                placeholder="输入你的问题..."
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
        <p>💡 智能客服 7×24 小时在线 | 发送邮件至 support@bbmarket.com</p>
      </div>
    </div>
  );
}
