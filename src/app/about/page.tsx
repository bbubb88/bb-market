'use client';

import { useI18n } from '@/lib/i18n';

export default function AboutPage() {
  const { language } = useI18n();

  const features = [
    {
      icon: '🛡️',
      title: '安全保障',
      titleKo: '안전 보장',
      desc: '资金担保交易，保障买卖双方权益',
      descKo: '자금 보호 거래, 매도 매수双方 권리 보장',
    },
    {
      icon: '⚡',
      title: '快速交易',
      titleKo: '빠른 거래',
      desc: '即时交易，快速到账，省时省力',
      descKo: '즉시 거래, 빠른 입금, 시간과 노력 절약',
    },
    {
      icon: '💰',
      title: 'USDT支付',
      titleKo: 'USDT 결제',
      desc: '支持USDT支付，便捷安全',
      descKo: 'USDT 결제 지원, 편리하고 안전',
    },
    {
      icon: '🌍',
      title: '全球服务',
      titleKo: '글로벌 서비스',
      desc: '支持韩国、台湾、大陆玩家',
      descKo: '대만, 대륙 플레이어 지원',
    },
    {
      icon: '💬',
      title: '客服支持',
      titleKo: '고객 지원',
      desc: '7×24小时在线客服',
      descKo: '7×24시간 온라인 고객센터',
    },
    {
      icon: '🤖',
      title: 'AI智能',
      titleKo: 'AI智能化',
      desc: 'AI智能推荐和客服服务',
      descKo: 'AI智能化 추천 및 고객 서비스',
    },
  ];

  const stats = [
    { value: '50K+', label: '注册用户', labelKo: '등록 사용자' },
    { value: '100K+', label: '成功交易', labelKo: '성공적인 거래' },
    { value: '99.9%', label: '满意度', labelKo: '만족도' },
    { value: '24/7', label: '客服在线', labelKo: '고객센터 온라인' },
  ];

  return (
    <div className="min-h-screen py-8">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950 via-slate-900 to-cyan-950" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-violet-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
            BB Market
          </h1>
          <p className="text-2xl text-slate-300 mb-4">
            {language === 'ko' ? '게임 계정 및 아이템 거래 플랫폼' : '游戏账号道具交易平台'}
          </p>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            {language === 'ko' 
              ? '안전하고 빠른 게임 거래 플랫폼 - HIT2를 포함한 다양한 게임의 계정, 아이템, 골드를 거래하세요.'
              : '安全、快捷、诚信的游戏交易平台 - 交易 HIT2 等游戏的账号、道具、游戏币'}
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-violet-400 mb-2">{stat.value}</div>
                <div className="text-slate-400">
                  {language === 'ko' ? stat.labelKo : stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            {language === 'ko' ? '왜 우리를 선택하세요' : '为什么选择我们'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 hover:border-violet-500 transition-all"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {language === 'ko' ? feature.titleKo : feature.title}
                </h3>
                <p className="text-slate-400">
                  {language === 'ko' ? feature.descKo : feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">
            {language === 'ko' ? '우리의 미션' : '我们的使命'}
          </h2>
          <p className="text-lg text-slate-300 leading-relaxed mb-8">
            {language === 'ko'
              ? 'BB Market은 게임 거래의 새로운 기준을确立하려 합니다. 가장先进的技术と、最高のセキュリティを組み合わせ、お客様に究極の取引体験を提供します。'
              : 'BB Market 致力于建立游戏交易的新标准。结合最先进的技术和最高级别的安全，为玩家提供终极交易体验。'}
          </p>
          <div className="flex justify-center gap-4">
            <div className="px-4 py-2 bg-slate-800 rounded-lg text-slate-400 text-sm">
              🤖 AI 智能
            </div>
            <div className="px-4 py-2 bg-slate-800 rounded-lg text-slate-400 text-sm">
              🔒 安全第一
            </div>
            <div className="px-4 py-2 bg-slate-800 rounded-lg text-slate-400 text-sm">
              ⚡ 快速便捷
            </div>
            <div className="px-4 py-2 bg-slate-800 rounded-lg text-slate-400 text-sm">
              🌏 全球服务
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            {language === 'ko' ? '지금 시작하세요' : '立即开始'}
          </h2>
          <p className="text-slate-400 mb-8">
            {language === 'ko'
              ? '안전하고 빠른 게임 거래의 미래를 경험해보세요.'
              : '体验安全快捷的游戏交易未来'}
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="/login"
              className="px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl hover:from-violet-500 hover:to-purple-500 transition-all"
            >
              {language === 'ko' ? '지금 가입' : '立即注册'}
            </a>
            <a
              href="/help"
              className="px-8 py-4 bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-600 transition-all"
            >
              {language === 'ko' ? '더 알아보기' : '了解更多'}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
