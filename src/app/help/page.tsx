'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';

const faqs = [
  {
    question: '如何购买商品？',
    questionKo: '상품을 어떻게 구매하나요?',
    answer: '浏览商品后点击"立即购买"，完成USDT支付即可。',
    answerKo: '상품을 보고 "구매하기"를 클릭하면 USDT 결제를 완료하면 됩니다.',
  },
  {
    question: '支持哪些支付方式？',
    questionKo: '어떤 결제 방식을 지원하나요?',
    answer: '目前支持USDT（TRC20/ERC20）支付，后续将支持更多加密货币。',
    answerKo: '현재 USDT(TRC20/ERC20) 결제를 지원하며, 향후 더 많은 암호화폐를 지원할 예정입니다.',
  },
  {
    question: '交易安全吗？',
    questionKo: '거래가 안전한가요?',
    answer: '是的！我们提供资金担保交易，买家确认收货后才释放款项给卖家。',
    answerKo: '네! 자금 보호 거래를 제공하며, 구매자가 확인后才释放款项给卖家.',
  },
  {
    question: '如何发布商品？',
    questionKo: '상품을 어떻게 등록하나요?',
    answer: '注册账号后，进入"发布商品"页面，按提示填写商品信息即可。',
    answerKo: '회원가입 후 "상품 등록" 페이지에서 상품 정보를 입력하면 됩니다.',
  },
  {
    question: '手续费是多少？',
    questionKo: '수수료는 얼마인가요?',
    answer: '卖家免手续费，买家承担5%手续费。',
    answerKo: '판매자 무료, 구매자 5% 수수료 부담.',
  },
  {
    question: '如何联系客服？',
    questionKo: '고객센터는 어떻게 연결하나요?',
    answer: '可以通过Telegram @bbmarket 或邮件 support@bbmarket.com 联系客服。',
    answerKo: 'Telegram @bbmarket 또는 이메일 support@bbmarket.com으로 연락할 수 있습니다.',
  },
];

export default function HelpPage() {
  const { language } = useI18n();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const categories = [
    { id: 'buy', icon: '🛒', name: '购买指南', nameKo: '구매 가이드' },
    { id: 'sell', icon: '💰', name: '出售指南', nameKo: '판매 가이드' },
    { id: 'security', icon: '🔒', name: '安全保障', nameKo: '안전 보장' },
    { id: 'payment', icon: '💳', name: '支付问题', nameKo: '결제 문제' },
    { id: 'account', icon: '👤', name: '账号问题', nameKo: '계정 문제' },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-white text-center mb-4">帮助中心</h1>
        <p className="text-slate-400 text-center mb-12">常见问题解答 | 자주 묻는 질문</p>

        {/* Categories */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700 hover:border-violet-500 transition-colors cursor-pointer"
            >
              <div className="text-3xl mb-2">{cat.icon}</div>
              <div className="text-white font-medium">
                {language === 'ko' ? cat.nameKo : cat.name}
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-12">
          <div className="relative">
            <input
              type="text"
              placeholder={language === 'ko' ? '검색...' : '搜索问题...'}
              className="w-full px-6 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 text-lg"
            />
            <button className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-white">
              🔍
            </button>
          </div>
        </div>

        {/* FAQs */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between"
              >
                <span className="text-white font-medium">
                  {language === 'ko' ? faq.questionKo : faq.question}
                </span>
                <span className={`text-slate-400 transform transition-transform ${openIndex === index ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4 text-slate-300">
                  {language === 'ko' ? faq.answerKo : faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-12 bg-gradient-to-r from-violet-600/20 to-purple-600/20 rounded-2xl p-8 border border-violet-500/30">
          <h2 className="text-2xl font-bold text-white text-center mb-4">联系我们</h2>
          <p className="text-slate-400 text-center mb-6">
            没找到答案？联系我们获取帮助
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="mailto:support@bbmarket.com"
              className="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
            >
              📧 邮件客服
            </a>
            <a
              href="https://t.me/bbmarket"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              ✈️ Telegram
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
