'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import Link from 'next/link';

export default function HIT2Page() {
  const { language } = useI18n();
  const [enhanceLevel, setEnhanceLevel] = useState(0);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceResult, setEnhanceResult] = useState<'success' | 'fail' | null>(null);
  const [transformActive, setTransformActive] = useState(false);
  const [selectedTransform, setSelectedTransform] = useState(0);

  // 强化成功率
  const successRates: Record<number, number> = {
    1: 100, 2: 100, 3: 100, 4: 100, 5: 90,
    6: 80, 7: 70, 8: 60, 9: 50, 10: 40,
    11: 30, 12: 20, 13: 10, 14: 5, 15: 1
  };

  const handleEnhance = () => {
    if (enhanceLevel >= 15 || isEnhancing) return;
    
    setIsEnhancing(true);
    setEnhanceResult(null);
    
    // 模拟强化过程
    setTimeout(() => {
      const successRate = successRates[enhanceLevel + 1] || 50;
      const random = Math.random() * 100;
      
      if (random <= successRate) {
        setEnhanceLevel(prev => prev + 1);
        setEnhanceResult('success');
      } else {
        setEnhanceResult('fail');
      }
      setIsEnhancing(false);
    }, 1500);
  };

  const getEnhanceColor = (level: number) => {
    if (level >= 12) return 'from-red-500 via-orange-500 to-yellow-500';
    if (level >= 10) return 'from-purple-500 via-pink-500 to-red-500';
    if (level >= 7) return 'from-blue-500 via-cyan-500 to-green-500';
    if (level >= 4) return 'from-slate-500 via-slate-400 to-slate-300';
    return 'from-slate-700 via-slate-600 to-slate-500';
  };

  // 不灭变身效果
  const transforms = [
    { name: '불꽃의 분노', nameKo: '火焰之怒', nameZh: '火焰之怒', emoji: '🔥', colors: ['#ff6b6b', '#ffd93d'] },
    { name: '얼음 심장', nameKo: '冰霜之心', nameZh: '冰霜之心', emoji: '❄️', colors: ['#74b9ff', '#0984e3'] },
    { name: '번개의 속도', nameKo: '雷电之力', nameZh: '雷电之力', emoji: '⚡', colors: ['#ffeaa7', '#fdcb6e'] },
    { name: '어둠의 힘', nameKo: '黑暗之力', nameZh: '黑暗之力', emoji: '🌑', colors: ['#2d3436', '#636e72'] },
    { name: '신성한 빛', nameKo: '神圣之光', nameZh: '神圣之光', emoji: '✨', colors: ['#ffeaa7', '#ffffff'] },
  ];

  return (
    <div className="min-h-screen py-8">
      {/* 强化特效动画 */}
      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(255, 107, 107, 0.5); }
          50% { box-shadow: 0 0 60px rgba(255, 107, 107, 0.8), 0 0 100px rgba(255, 217, 61, 0.4); }
        }
        @keyframes rainbow-glow {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }
        @keyframes transform-active {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        @keyframes particle-float {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-100px) rotate(360deg); opacity: 0; }
        }
        .enhance-glow { animation: pulse-glow 1.5s ease-in-out infinite; }
        .rainbow-anim { animation: rainbow-glow 3s linear infinite; }
        .transform-active { animation: transform-active 2s ease-in-out infinite; }
        
        .enhance-12 { 
          background: linear-gradient(135deg, #ff6b6b, #ffd93d);
          animation: pulse-glow 1s ease-in-out infinite;
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

        {/* 强化模拟器 */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-white text-center mb-6">⚔️ {language === 'ko' ? '강화 시뮬레이터' : '武器强化模拟器'}</h3>
          
          <div className="max-w-md mx-auto">
            {/* 武器展示 */}
            <div className={`relative p-12 rounded-2xl bg-gradient-to-br ${getEnhanceColor(enhanceLevel)} ${enhanceLevel >= 12 ? 'enhance-12' : ''} transition-all duration-500`}>
              {/* 强化等级显示 */}
              <div className="absolute top-4 left-4 px-4 py-2 bg-black/50 rounded-full">
                <span className="text-white font-bold">+{enhanceLevel}</span>
              </div>
              
              {/* 武器图标 */}
              <div className={`text-8xl text-center transform transition-all ${isEnhancing ? 'scale-150 rotate-12' : ''} ${enhanceLevel >= 12 ? 'rainbow-anim' : ''}`}>
                ⚔️
              </div>
              
              {/* 成功/失败特效 */}
              {enhanceResult === 'success' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-6xl animate-bounce">✨</span>
                </div>
              )}
              {enhanceResult === 'fail' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-6xl">💥</span>
                </div>
              )}
            </div>

            {/* 强化按钮 */}
            <div className="mt-6 text-center">
              <button
                onClick={handleEnhance}
                disabled={enhanceLevel >= 15 || isEnhancing}
                className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${
                  enhanceLevel >= 15 
                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                    : isEnhancing
                    ? 'bg-violet-600 text-white animate-pulse'
                    : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:scale-105'
                }`}
              >
                {isEnhancing ? (language === 'ko' ? '강화 중...' : '强化中...') : 
                 enhanceLevel >= 15 ? (language === 'ko' ? '최대 강화' : '已满级') :
                 (language === 'ko' ? '강화하기' : '开始强化')}
              </button>
              
              {/* 成功率 */}
              {enhanceLevel < 15 && (
                <p className="mt-3 text-slate-400">
                  {language === 'ko' ? '성공률' : '成功率'}: <span className="text-emerald-400 font-bold">{successRates[enhanceLevel + 1]}%</span>
                </p>
              )}
            </div>

            {/* 强化历史 */}
            <div className="mt-6 p-4 bg-slate-800/50 rounded-xl">
              <div className="flex flex-wrap gap-2 justify-center">
                {Array.from({ length: 15 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                      i < enhanceLevel
                        ? i >= 11 ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                        : i >= 7 ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
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

        {/* 不灭变身特效展示 */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-white text-center mb-6">🦸 {language === 'ko' ? '불멸 변환' : '不灭变身'}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            {transforms.map((t, i) => (
              <button
                key={i}
                onClick={() => setSelectedTransform(i)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedTransform === i
                    ? 'border-violet-500 bg-violet-500/20 scale-105'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                <div className="text-3xl text-center mb-2">{t.emoji}</div>
                <div className="text-white text-sm text-center">
                  {language === 'ko' ? t.nameKo : t.nameZh}
                </div>
              </button>
            ))}
          </div>

          {/* 变身效果展示 */}
          <div 
            className={`relative h-64 rounded-2xl overflow-hidden ${
              transformActive ? 'transform-active' : ''
            }`}
            style={{
              background: `linear-gradient(135deg, ${transforms[selectedTransform].colors[0]}, ${transforms[selectedTransform].colors[1]})`,
              boxShadow: transformActive ? `0 0 40px ${transforms[selectedTransform].colors[0]}80` : 'none'
            }}
          >
            {/* 粒子效果 */}
            {transformActive && (
              <div className="absolute inset-0">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      background: transforms[selectedTransform].colors[i % 2],
                      left: `${Math.random() * 100}%`,
                      bottom: 0,
                      animation: `particle-float ${1 + Math.random() * 2}s ease-out infinite`,
                      animationDelay: `${Math.random() * 2}s`
                    }}
                  />
                ))}
              </div>
            )}

            {/* 角色 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-8xl transform transition-all hover:scale-110 cursor-pointer"
                   onClick={() => setTransformActive(!transformActive)}>
                {transformActive ? '🦸' : '🧙'}
              </div>
            </div>

            {/* 提示 */}
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <span className="text-white/80 text-sm">
                {language === 'ko' ? '클릭하여 변환 활성화/비활성화' : '点击切换变身特效'}
              </span>
            </div>
          </div>
        </div>

        {/* 快捷分类 */}
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
