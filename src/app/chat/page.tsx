'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  isAI: boolean;
  time: string;
  quickActions?: string[];
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 快捷操作映射到链接
  const quickActionLinks: Record<string, string> = {
    '如何购买商品': '/',
    '如何挂售商品': '/create-listing',
    '支付方式': '/recharge',
    '查看商品': '/items',
    '去挂售': '/create-listing',
    '手续费说明': '/help',
    '资金到账时间': '/wallet',
    '充值地址': '/wallet',
    '充值未到账': '/help',
    '联系客服': '/help',
    '资金托管说明': '/help',
    '如何防骗': '/help',
    '纠纷处理': '/help',
    '立即购买': '/items',
    '浏览商品': '/items',
    '成为卖家': '/create-listing',
    '立即登录': '/login',
    '查看订单': '/dashboard/orders',
    '投诉入口': '/help',
    '去提现': '/wallet',
    '查看余额': '/wallet',
    '了解购买流程': '/help',
    '浏览HIT2商品': '/hit2',
    '挂售游戏商品': '/create-listing',
    '查看全部游戏': '/select-game',
    '购买商品流程': '/help',
    '挂售商品流程': '/help',
    '交易安全保障': '/help',
    '阅读帮助中心常见问题': '/help',
    '了解挂售流程开始卖东西': '/create-listing',
    '查看帮助': '/help'
  };

  // 初始化欢迎消息
  useEffect(() => {
    setMessages([
      {
        id: 1,
        text: `👋 你好！欢迎来到 BB Market！

我是 BB Market 智能客服小 BB，很高兴为你服务～

我可以帮你解决：
🛒 如何购买商品
💰 如何挂售商品  
💳 支付和充值问题
🔒 交易安全保障
📋 订单和账户问题
🤝 纠纷处理

请直接告诉我你需要什么帮助？`,
        isUser: false,
        isAI: true,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        quickActions: ['如何购买商品', '如何挂售商品', '支付方式']
      }
    ]);
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || sending) return;

    const userMessage: Message = {
      id: Date.now(),
      text: messageText,
      isUser: true,
      isAI: false,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    if (!text) setInput('');
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
          message: messageText,
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
          quickActions: data.quickActions
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
                  className={`max-w-[85%] rounded-xl p-4 ${
                    msg.isUser
                      ? 'bg-violet-600 text-white'
                      : msg.isAI
                      ? 'bg-slate-700 text-slate-200 border border-violet-500/30'
                      : 'bg-slate-700 text-slate-200'
                  }`}
                >
                  {!msg.isUser && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🤖</span>
                      <span className="text-violet-400 text-sm font-medium">BB Market 客服</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-line leading-relaxed">{msg.text}</p>
                  <p className={`text-xs mt-2 ${msg.isUser ? 'text-violet-200' : 'text-slate-400'}`}>
                    {msg.time}
                  </p>
                  
                  {/* Quick Actions */}
                  {msg.quickActions && msg.quickActions.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-600">
                      <p className="text-xs text-slate-400 mb-2">💡 你可能想了解：</p>
                      <div className="flex flex-wrap gap-2">
                        {msg.quickActions.map((action, idx) => (
                          quickActionLinks[action] ? (
                            <Link
                              key={idx}
                              href={quickActionLinks[action]}
                              className="px-3 py-1.5 bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 text-xs rounded-lg transition-colors"
                            >
                              {action}
                            </Link>
                          ) : (
                            <button
                              key={idx}
                              onClick={() => sendMessage(action)}
                              className="px-3 py-1.5 bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 text-xs rounded-lg transition-colors"
                            >
                              {action}
                            </button>
                          )
                        ))}
                      </div>
                    </div>
                  )}
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
                onClick={() => sendMessage()}
                disabled={sending || !input.trim()}
                className="px-6 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
              >
                {sending ? '...' : '发送'}
              </button>
            </div>
            
            {/* Quick Question Buttons */}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => sendMessage('如何购买商品')}
                className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors"
              >
                🛒 购买流程
              </button>
              <button
                onClick={() => sendMessage('如何挂售商品')}
                className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors"
              >
                💰 挂售流程
              </button>
              <button
                onClick={() => sendMessage('支付方式')}
                className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors"
              >
                💳 支付方式
              </button>
              <button
                onClick={() => sendMessage('交易安全吗')}
                className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors"
              >
                🔒 安全问题
              </button>
              <button
                onClick={() => sendMessage('遇到纠纷怎么办')}
                className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors"
              >
                🤝 纠纷处理
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
