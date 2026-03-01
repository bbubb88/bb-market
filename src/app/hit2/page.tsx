'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import Link from 'next/link';

export default function HIT2Page() {
  const { language } = useI18n();
  const [enhanceLevel, setEnhanceLevel] = useState(0);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceResult, setEnhanceResult] = useState<'success' | 'fail' | null>(null);
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, color: string}>>([]);

  // 强化成功率
  const successRates: Record<number, number> = {
    1: 100, 2: 100, 3: 100, 4: 100, 5: 90,
    6: 80, 7: 70, 8: 60, 9: 50, 10: 40,
    11: 30, 12: 20, 13: 10, 14: 5, 15: 1
  };

  // 强化特效颜色
  const enhanceColors: Record<number, { primary: string; secondary: string; glow: string }> = {
    0: { primary: '#6b7280', secondary: '#9ca3af', glow: 'rgba(156, 163, 175, 0.5)' },
    1: { primary: '#6b7280', secondary: '#9ca3af', glow: 'rgba(156, 163, 175, 0.5)' },
    2: { primary: '#6b7280', secondary: '#9ca3af', glow: 'rgba(156, 163, 175, 0.5)' },
    3: { primary: '#6b7280', secondary: '#9ca3af', glow: 'rgba(156, 163, 175, 0.5)' },
    4: { primary: '#3b82f6', secondary: '#60a5fa', glow: 'rgba(96, 165, 250, 0.5)' },
    5: { primary: '#3b82f6', secondary: '#60a5fa', glow: 'rgba(96, 165, 250, 0.6)' },
    6: { primary: '#3b82f6', secondary: '#60a5fa', glow: 'rgba(96, 165, 250, 0.7)' },
    7: { primary: '#8b5cf6', secondary: '#a78bfa', glow: 'rgba(167, 139, 250, 0.7)' },
    8: { primary: '#8b5cf6', secondary: '#a78bfa', glow: 'rgba(167, 139, 250, 0.8)' },
    9: { primary: '#ec4899', secondary: '#f472b6', glow: 'rgba(244, 114, 182, 0.8)' },
    10: { primary: '#f59e0b', secondary: '#fbbf24', glow: 'rgba(251, 191, 36, 0.8)' },
    11: { primary: '#ef4444', secondary: '#f87171', glow: 'rgba(248, 113, 113, 0.9)' },
    12: { primary: '#ef4444', secondary: '#fbbf24', glow: 'rgba(251, 191, 36, 1)' },
    13: { primary: '#dc2626', secondary: '#fb923c', glow: 'rgba(252, 129, 57, 1)' },
    14: { primary: '#991b1b', secondary: '#f59e0b', glow: 'rgba(245, 158, 11, 1)' },
    15: { primary: '#7f1d1d', secondary: '#fbbf24', glow: 'rgba(251, 191, 36, 1)' },
  };

  const handleEnhance = () => {
    if (enhanceLevel >= 15 || isEnhancing) return;
    
    setIsEnhancing(true);
    setEnhanceResult(null);
    
    // 生成粒子
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: enhanceColors[enhanceLevel]?.primary || '#fff'
    }));
    setParticles(newParticles);
    
    setTimeout(() => {
      const successRate = successRates[enhanceLevel + 1] || 50;
      const random = Math.random() * 100;
      
      if (random <= successRate) {
        setEnhanceLevel(prev => prev + 1);
        setEnhanceResult('success');
      } else {
        setEnhanceResult('fail');
      }
      setParticles([]);
      setIsEnhancing(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen py-8">
      <style jsx>{`
        @keyframes fire-glow {
          0%, 100% { 
            box-shadow: 0 0 20px var(--glow), 0 0 40px var(--glow);
            filter: brightness(1);
          }
          50% { 
            box-shadow: 0 0 40px var(--glow), 0 0 80px var(--glow), 0 0 120px var(--glow);
            filter: brightness(1.2);
          }
        }
        @keyframes rainbow-shift {
          0% { filter: hue-rotate(0deg) brightness(1.5); }
          50% { filter: hue-rotate(180deg) brightness(2); }
          100% { filter: hue-rotate(360deg) brightness(1.5); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        @keyframes particle-rise {
          0% { transform: translateY(100%) scale(0); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(-200%) scale(1); opacity: 0; }
        }
        .enhance-fire {
          animation: fire-glow 1s ease-in-out infinite;
          --glow: rgba(255, 69, 0, 0.8);
        }
        .enhance-rainbow {
          animation: rainbow-shift 2s linear infinite;
        }
        .enhance-shake {
          animation: shake 0.5s ease-in-out;
        }
        .particle {
          animation: particle-rise 2s ease-out infinite;
        }
      `}</style>

      <div className="max-w-6xl mx-auto px-4">
        {/* HIT2 标题 */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 rounded-2xl overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-amber-500 flex items-center justify-center">
            <img src="/hit2-icon.png" alt="HIT2" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-4xl font-bold text-white">HIT2</h1>
        </div>

        {/* 交易入口 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Link href="/accounts" className="group p-8 bg-gradient-to-br from-emerald-600/20 to-cyan-600/20 rounded-2xl border border-emerald-500/30 hover:border-emerald-400 transition-all hover:scale-105">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-text-4xl">🛒</div>
              <h2 className="text-2xl font-bold text-white">{language === 'ko' ? '구매' : '购买'}</h2>
              <p className="text-slate-400">{language === 'ko' ? '계정, 아이템, 게임화폐 구매' : '账号、道具、游戏币'}</p>
            </div>
          </Link>
          <Link href="/create-listing" className="group p-8 bg-gradient-to-br from-amber-600/20 to-orange-600/20 rounded-2xl border border-amber-500/30 hover:border-amber-400 transition-all hover:scale-105">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-text-4xl">💰</div>
              <h2 className="text-2xl font-bold text-white">{language === 'ko' ? '판매' : '挂售'}</h2>
              <p className="text-slate-400">{language === 'ko' ? '계정, 아이템, 게임화폐 판매' : '发布账号、道具、游戏币'}</p>
            </div>
          </Link>
        </div>

        {/* 武器强化模拟器 */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-white text-center mb-6">⚔️ {language === 'ko' ? '강화 시뮬레이터' : '武器强化模拟器'}</h3>
          
          <div className="max-w-md mx-auto">
            {/* 武器展示 */}
            <div 
              className={`relative p-12 rounded-2xl transition-all duration-500 ${
                isEnhancing ? 'enhance-shake' : ''
              } ${
                enhanceLevel >= 12 ? 'enhance-fire' : ''
              } ${
                enhanceLevel >= 13 ? 'enhance-rainbow' : ''
              }`}
              style={{
                background: `linear-gradient(135deg, ${enhanceColors[enhanceLevel]?.primary}, ${enhanceColors[enhanceLevel]?.secondary})`,
                boxShadow: `0 0 ${enhanceLevel >= 12 ? 60 : 30}px ${enhanceColors[enhanceLevel]?.glow}`
              }}
            >
              {/* 粒子效果 */}
              {particles.map((p) => (
                <div
                  key={p.id}
                  className="particle absolute w-3 h-3 rounded-full"
                  style={{
                    left: `${p.x}%`,
                    bottom: '20%',
                    background: p.color,
                  }}
                />
              ))}
              
              {/* 强化等级 */}
              <div className="absolute top-4 left-4 px-4 py-2 bg-black/60 rounded-full">
                <span className="text-white font-bold text-xl">+{enhanceLevel}</span>
              </div>
              
              {/* 武器图标 */}
              <div className={`text-8xl text-center transition-all duration-300 ${
                isEnhancing ? 'scale-150' : 'scale-100'
              } ${enhanceLevel >= 13 ? 'enhance-rainbow' : ''}`}>
                ⚔️
              </div>
              
              {/* 成功/失败 */}
              {enhanceResult === 'success' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-6xl animate-bounce">✨</span>
                </div>
              )}
              {enhanceResult === 'fail' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <span className="text-6xl">💥</span>
                </div>
              )}
            </div>

            {/* 按钮 */}
            <div className="mt-6 text-center">
              <button
                onClick={handleEnhance}
                disabled={enhanceLevel >= 15 || isEnhancing}
                className={`px-10 py-5 rounded-xl font-bold text-xl transition-all ${
                  enhanceLevel >= 15 
                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                    : isEnhancing
                    ? 'bg-violet-600 text-white animate-pulse'
                    : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:scale-105 hover:shadow-lg hover:shadow-violet-500/50'
                }`}
              >
                {isEnhancing ? (language === 'ko' ? '강화 중...' : '强化中...') : 
                 enhanceLevel >= 15 ? (language === 'ko' ? '최대 강화' : '已满级') :
                 (language === 'ko' ? '강화하기 (+' + (enhanceLevel + 1) + ')' : '开始强化 (+' + (enhanceLevel + 1) + ')')}
              </button>
              
              {enhanceLevel < 15 && (
                <p className="mt-3 text-slate-400">
                  {language === 'ko' ? '성공률' : '成功率'}: <span className="text-emerald-400 font-bold">{successRates[enhanceLevel + 1]}%</span>
                </p>
              )}
            </div>

            {/* 强化进度条 */}
            <div className="mt-6 p-4 bg-slate-800/50 rounded-xl">
              <div className="flex flex-wrap gap-1 justify-center">
                {Array.from({ length: 15 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                      i < enhanceLevel
                        ? i >= 11 ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/50'
                        : i >= 7 ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50'
                        : i >= 4 ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/50'
                        : 'bg-slate-600 text-white'
                        : 'bg-slate-700 text-slate-500'
                    }`}
                  >
                    +{i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 分类 */}
        <div>
          <h3 className="text-xl font-bold text-white text-center mb-6">
            {language === 'ko' ? '카테고리' : '分类'}
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <Link href="/accounts" className="p-6 bg-slate-800/60 rounded-xl border border-slate-700 hover:border-violet-500 transition-all text-center">
              <div className="text-3xl mb-2">📋</div>
              <div className="text-white font-medium">{language === 'ko' ? '계정' : '账号'}</div>
            </Link>
            <Link href="/items" className="p-6 bg-slate-800/60 rounded-xl border border-slate-700 hover:border-violet-500 transition-all text-center">
              <div className="text-3xl mb-2">🎮</div>
              <div className="text-white font-medium">{language === 'ko' ? '아이템' : '道具'}</div>
            </Link>
            <Link href="/coins" className="p-6 bg-slate-800/60 rounded-xl border border-slate-700 hover:border-violet-500 transition-all text-center">
              <div className="text-3xl mb-2">💎</div>
              <div className="text-white font-medium">{language === 'ko' ? '게임화폐' : '游戏币'}</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
