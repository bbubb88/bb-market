'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';

// 详细的FAQ数据
const faqs = [
  {
    category: 'purchase',
    icon: '🛒',
    question: '如何购买商品？',
    questionKo: '상품을 어떻게 구매하나요?',
    answer: `**BB Market 购买流程详解：**

**1. 注册账号**
• 访问 BB Market 首页
• 点击"登录" → 使用 Discord 账号授权
• 首次登录即自动注册

**2. 选购商品**
• 选择游戏类型（如 HIT2）
• 浏览心仪的商品列表
• 点击商品查看详细信息

**3. 下单支付**
• 确认商品信息（价格、描述、有效期）
• 点击"立即购买"
• 使用 USDT (TRC20) 完成支付
• 支付成功后，商品信息将显示

**4. 收货确认**
• 根据商品类型获取账号密码/道具
• 登录游戏确认商品无误
• 在订单页面点击"确认收货"
• 资金才会释放给卖家

**5. 交易完成**
• 可对卖家进行评价
• 如有问题可申请售后

---
💡 **小贴士**：新用户首单可享手续费优惠，热门商品下手要快！`,
    answerKo: `**BB Market 구매流程 상세 설명:**

**1. 회원가입**
• BB Market 메인 페이지 방문
• "로그인" 클릭 → Discord 계정 승인
• 최초 로그인 시 자동 등록

**2. 상품 선택**
• 게임 유형 선택 (HIT2 등)
• 원하는 상품 목록 탐색
• 상품 클릭하여 상세 정보 확인

**3. 주문 및 결제**
• 상품 정보 확인 (가격, 설명, 유효기간)
• "구매하기" 클릭
• USDT (TRC20)로 결제
• 결제成功后 商品 정보 표시

**4. 수령 확인**
•的商品类型获取账号密码/道具
• 게임에 로그인하여 상품 확인
• 주문 페이지에서 "수령 확인" 클릭
• 판매자에게资金发放

**5. 거래 완료**
• 판매자에게 평가 가능
• 문제 발생 시 AS 신청 가능

---
💡 **팁**: 신규 사용자 첫 주문은 수수료 할인!`
  },
  {
    category: 'sell',
    icon: '💰',
    question: '如何挂售商品？',
    questionKo: '상품을 어떻게 등록하나요?',
    answer: `**BB Market 挂售流程详解：**

**1. 登录账号**
• 使用 Discord 账号登录
• 进入个人中心

**2. 创建商品**
• 点击"挂售"或"发布商品"
• 选择商品类型：
  - 📦 账号交易
  - 🎁 道具装备
  - 💰 游戏金币

**3. 填写商品信息**
• 商品标题（简洁明了）
• 商品描述（详细说明）
• 设置价格（USDT）
• 上传商品图片（可选）
• 设置商品分类和标签

**4. 发布商品**
• 确认信息无误
• 点击"发布商品"
• 商品上架成功，等待买家

**5. 交易完成**
• 买家购买后收到通知
• 交付商品给买家
• 买家确认收货后资金到账

---
💡 **小贴士**：
• ✅ 卖家免手续费！
• ✅ 商品描述越详细越容易卖出
• ✅ 价格合理更受欢迎
• ✅ 可设置促销折扣`,
    answerKo: `**BB Market 등록流程 상세 설명:**

**1. 로그인**
• Discord 계정으로 로그인
• 마이페이지로 이동

**2. 상품 생성**
• "등록" 또는 "상품 등록" 클릭
• 상품 유형 선택:
  - 📦 계정 거래
  - 🎁 아이템 장비
  - 💰 게임金币

**3. 상품 정보 입력**
• 상품 제목 (간결하고 명확하게)
• 상품 설명 (상세히 기재)
• 가격 설정 (USDT)
• 상품 이미지 업로드 (선택)
• 상품 분류 및 태그 설정

**4. 상품 등록**
• 정보 확인
• "상품 등록" 클릭
• 상품 등록 성공, 구매자 대기

**5. 거래 완료**
• 구매자 구매 시 알림 수신
• 구매자에게 상품 전달
• 구매자 수령 확인 후 금액 입금

---
💡 **팁**:
• ✅ 판매자 무료!
• ✅ 상품 설명이 상세할수록 판매되기 쉽음
• ✅ 합리적인 가격!
• ✅ 프로모션 할인 설정 가능`
  },
  {
    category: 'payment',
    icon: '💳',
    question: '支持哪些支付方式？',
    questionKo: '어떤 결제 방식을 지원하나요?',
    answer: `**BB Market 支付方式说明：**

**支持的加密货币：**

📌 **USDT (泰达币)**
• 推荐网络：TRC20（手续费低、到账快）
• 备选网络：ERC20
• 最低充值：5 USDT
• 到账时间：1-5 分钟

---
**充值步骤：**

1. 登录账号 → 进入"钱包"
2. 点击"充值"
3. 复制 USDT 充值地址
4. 从你的钱包转账 USDT
5. 等待网络确认后自动到账

---
**⚠️ 重要提示：**
• ❌ 请勿充值除 USDT 以外的其他币种
• ❌ 充值错误币种无法找回
• ✅ TRC20 网络手续费最低（≈1 USDT）
• ✅ 充值前仔细核对地址和网络类型
• ✅ 小额测试后再转大额

---
**支付常见问题：**

Q: 支付后多久到账？
A: 通常 1-5 分钟，最长不超过 30 分钟

Q: 可以用人民币支付吗？
A: 目前仅支持 USDT 加密货币支付

Q: 支付限额是多少？
A: 单笔最低 5 USDT，无上限`,
    answerKo: `**BB Market 결제 방식 설명:**

**지원하는 암호화폐:**

📌 **USDT (테더)**
• 추천 네트워크: TRC20 (수수료 낮음, 빠른 입금)
• 대안 네트워크: ERC20
•最低充值: 5 USDT
• 입금 시간: 1-5분

---
**충전 단계:**

1. 로그인 → "지갑"으로 이동
2. "충전" 클릭
3. USDT 충전 주소 복사
4. 지갑에서 USDT 전송
5. 네트워크 확인 후 자동 입금

---
**⚠️ 중요 안내:**
• ❌ USDT 이외의 다른币种充值禁止
• ❌ 잘못된币种充值 시找回불가
• ✅ TRC20 네트워크 수수료最低 (≈1 USDT)
• ✅ 충전 전 주소 및 네트워크 유형 확인
• ✅ 소액 테스트 후 대액 전송`
  },
  {
    category: 'security',
    icon: '🔒',
    question: '交易安全吗？',
    questionKo: '거래가 안전한가요?',
    answer: `**BB Market 安全保障说明：**

**🛡️ 资金托管机制**
• 买家付款后，资金由平台托管
• 卖家交付商品后，买家需确认收货
• 确认无误后资金才会释放给卖家
• 全程保障资金安全

**⏰ 7×24 小时客服**
• 智能客服随时在线解答
• 工作时间人工客服响应
• 紧急问题可电话联系

**📋 交易保障**
• 纠纷先行赔付机制
• 商品纠纷有专人对接
• 投诉处理有记录可查

**✅ 平台资质**
• 正规游戏道具交易平台
• Discord 账号登录验证身份
• 运营多年，口碑良好

---
**🔐 防骗提示：**
• ❗ 不要私下交易
• ❗ 不要点击陌生链接
• ❗ 认准官方平台域名
• ❗ 如遇诈骗立即报警

---
**💬 用户评价**
• 累计服务 thousands+ 用户
• 好评率高，交易纠纷率低

交易安全是我们最重视的！`,
    answerKo: `**BB Market 안전 보장 설명:**

**🛡️資金托管 메커니즘**
• 구매자 결제 후, 자금은 플랫폼이 보관
• 판매자 상품 전달 후, 구매자 수령 확인 필요
• 확인 후 자금을 판매자에게 지급
•全程保障资金安全

**⏰ 24시간 고객센터**
•智能客服随时在线解答
•工作时间客服响应
•紧急问题可电话联系

**📋 거래 보장**
•纠纷先行赔付机制
•商品纠纷专人对接
•投诉处理有记录

**✅ 플랫폼 자격**
•正规游戏道具交易平台
•Discord账号登录验证
•运营多年，口碑良好

---
**🔐 방범 안내:**
• ❗ 사기 거래 금지
• ❗ 모르는 링크 클릭 금지
• ❗ 공식 도메인 확인
• ❗ 사기 발생 시 즉시 신고

---
交易安全是我们最重视的！`
  },
  {
    category: 'fee',
    icon: '💵',
    question: '手续费是多少？',
    questionKo: '수수료는 얼마인가요?',
    answer: `**BB Market 费用说明：**

**💰 卖家：免费！**
• 挂售商品完全免费
• 成交后无需支付任何费用
• 收入 100% 到账

**🛒 买家：5% 手续费**
• 商品价格的 5%
• 支付时自动计算
• 包含在订单总价中

---
**💡 费用计算示例：**

购买 100 USDT 的商品：
• 商品价格：100 USDT
• 手续费：5 USDT (5%)
• 总计支付：105 USDT

---
**🔹 其他费用：**

**USDT 网络转账矿工费：**
• TRC20：约 1 USDT（推荐）
• ERC20：约 5-10 USDT

**提现手续费：1%**
• 最低提现 10 USDT

---
**🌟 VIP 优惠：**
• 交易量大的用户可申请降低手续费
• 联系客服了解详情`,
    answerKo: `**BB Market 수수료 설명:**

**💰 판매자: 무료!**
• 商品挂牌完全免费
• 成交后无需支付费用
• 收入 100% 到账

**🛒 구매자: 5% 수수료**
• 商品价格的 5%
• 支付时自动计算
• 包含在订单总价中

---
**💡 费用计算示例:**

购买 100 USDT 的商品:
• 商品价格: 100 USDT
• 手续费: 5 USDT (5%)
• 总计支付: 105 USDT

---
**🔹 其他费用:**

**USDT 网络转账矿工费:**
• TRC20: 约 1 USDT (推荐)
• ERC20: 约 5-10 USDT

**提现手续费: 1%**
• 最低提现 10 USDT

---
**🌟 VIP优惠:**
交易量大的用户可申请降低手续费`
  },
  {
    category: 'dispute',
    icon: '🤝',
    question: '遇到纠纷怎么办？',
    questionKo: '분쟁이 발생하면 어떻게 해야 하나요?',
    answer: `**BB Market 纠纷处理指南：**

**📞 联系客服**
• 在线客服随时响应
• 邮件：support@bbmarket.com
• 电话：+852 4406 0902

**📝 提交证据**
• 聊天记录截图
• 商品截图/对比图
• 交易凭证
• 其他相关证据

**⏰ 处理时间**
• 简单问题：24 小时内
• 复杂案件：3-5 个工作日

---
**🔸 常见纠纷类型及处理：**

**商品与描述不符**
→ 提供对比截图
→ 可申请退款或部分退款

**买家未确认收货**
→ 联系买家提醒确认
→ 超过7天自动确认

**付款未到账**
→ 核对支付地址
→ 提供转账凭证

**卖家未发货**
→ 联系卖家催促
→ 可申请取消订单

---
**⚖️ 处理原则：**
• ✅ 公平公正
• ✅ 证据说话
• ✅ 先行赔付
• ✅ 保护双方权益`,
    answerKo: `**BB Market 분쟁 처리 가이드:**

**📞 고객센터 联系**
• 在线客服随时响应
• 邮件: support@bbmarket.com
• 电话: +852 4406 0902

**📝 제출 증거**
• 聊天记录截图
• 商品截图/对比图
• 交易凭证
• 其他相关证据

**⏰ 处理时间**
• 简单问题: 24小时内
• 复杂案件: 3-5个工作日

---
**🔸常见纠纷类型及处理:**

**商品与描述不符**
→ 提供对比截图
→ 可申请退款或部分退款

**买家未确认收货**
→ 联系买家提醒确认
→ 超过7天自动确认

**付款未到账**
→ 核对支付地址
→ 提供转账凭证

**卖家未发货**
→ 联系卖家催促
→ 可申请取消订单`
  },
  {
    category: 'account',
    icon: '👤',
    question: '如何联系客服？',
    questionKo: '고객센터는 어떻게 연결하나요?',
    answer: `**BB Market 联系客服方式：**

**💬 在线客服**
• 点击页面右下角聊天按钮
• AI 客服 7×24 小时在线
• 可解答大部分常见问题

**📧 邮件客服**
• support@bbmarket.com
• 工作时间：周一至周五 9:00-18:00
• 24 小时内回复

**📞 电话客服**
• +852 4406 0902
• 工作时间：周一至周五 9:00-18:00
• 紧急问题优先处理

**💬 Telegram**
• @bbmarket
• 24 小时响应

---
**⏰ 客服工作时间：**
• 在线客服：7×24 小时
• 人工客服：周一至周五 9:00-18:00
• 节假日正常休息

---
**📝 联系时请提供：**
• 订单号（如有）
• 问题的详细描述
• 相关截图或证据`,
    answerKo: `**BB Market 고객센터 연락처:**

**💬 온라인 고객센터**
• 点击页面右下角聊天按钮
• AI客服 7×24小时在线
• 可解答大部分常见问题

**📧 이메일 고객센터**
• support@bbmarket.com
• 工作时间: 周一至周五 9:00-18:00
• 24小时内回复

**📞 전화 고객센터**
• +852 4406 0902
• 工作时间: 周一至周五 9:00-18:00
• 紧急问题优先处理

**💬 Telegram**
• @bbmarket
• 24小时响应

---
**⏰ 고객센터工作时间:**
• 在线客服: 7×24小时
• 인공客服:周一至周五 9:00-18:00
• 공휴일 정상 휴무`
  },
  {
    category: 'escrow',
    icon: '🔐',
    question: '资金托管是什么？',
    questionKo: '자금托管이란 무엇인가요?',
    answer: `**资金托管说明：**

**🔐 什么是资金托管？**

资金托管是一种交易保障机制：
• 买家付款后，资金暂时由平台保管
• 卖家交付商品并被确认后
• 平台将资金释放给卖家

---
**🏃 托管流程：**

1️⃣ 买家下单并支付
2️⃣ 资金进入平台托管账户
3️⃣ 卖家交付商品给买家
4️⃣ 买家确认收到商品
5️⃣ 平台将资金释放给卖家

---
**💡 为什么选择托管？**

✅ 买家：不用担心付款后收不到货
✅ 卖家：不用担心发货后收不到钱
✅ 平台：监督交易，保障双方

---
**💰 托管费用：**
• 托管服务：**免费！**
• 仅收取交易手续费（买家5%）

---
**🛡️ 托管安全：**
• 资金由平台托管，不进入私人账户
• 交易纠纷时，平台有权介入处理
• 证据充分可申请先行赔付

这是 BB Market 保障交易安全的核心机制！`,
    answerKo: `**자금托管 설명:**

**🔐什么是资金托管?**

资金托管是一种交易保障机制:
• 买家付款后，资金暂时由平台保管
• 卖家交付商品并被确认后
• 平台将资金释放给卖家

---
**🏃托管流程:**

1️⃣ 买家下单并支付
2️⃣ 资金进入平台托管账户
3️⃣ 卖家交付商品给买家
4️⃣ 买家确认收到商品
5️⃣ 平台将资金释放给卖家

---
**💡为什么选择托管?**

✅ 买家:不用担心付款后收不到货
✅ 卖家:不用担心发货后收不到钱
✅ 平台:监督交易，保障双方

---
**💰托管费用:**
• 托管服务:**免费!**
• 仅收取交易手续费(买家5%)

---
**🛡️托管安全:**
资金由平台托管，不进入私人账户`
  }
];

export default function HelpPage() {
  const { language } = useI18n();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'purchase', icon: '🛒', name: '购买指南', nameKo: '구매 가이드' },
    { id: 'sell', icon: '💰', name: '出售指南', nameKo: '판매 가이드' },
    { id: 'payment', icon: '💳', name: '支付问题', nameKo: '결제 문제' },
    { id: 'security', icon: '🔒', name: '安全保障', nameKo: '안전 보장' },
    { id: 'fee', icon: '💵', name: '费用说明', nameKo: '수수료 안내' },
    { id: 'dispute', icon: '🤝', name: '纠纷处理', nameKo: '분쟁 처리' },
  ];

  // 过滤搜索
  const filteredFaqs = searchQuery
    ? faqs.filter(faq => 
        (language === 'ko' ? faq.questionKo : faq.question).includes(searchQuery) ||
        (language === 'ko' ? faq.answerKo : faq.answer).includes(searchQuery)
      )
    : faqs;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-white text-center mb-4">帮助中心</h1>
        <p className="text-slate-400 text-center mb-12">常见问题解答 | 자주 묻는 질문</p>

        {/* Categories */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-12">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700 hover:border-violet-500 transition-colors cursor-pointer"
            >
              <div className="text-3xl mb-2">{cat.icon}</div>
              <div className="text-white font-medium text-sm">
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
          {filteredFaqs.map((faq, index) => (
            <div
              key={index}
              className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-700/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{faq.icon}</span>
                  <span className="text-white font-medium">
                    {language === 'ko' ? faq.questionKo : faq.question}
                  </span>
                </div>
                <span className={`text-slate-400 transform transition-transform ${openIndex === index ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-6 text-slate-300 whitespace-pre-line leading-relaxed">
                  {language === 'ko' ? faq.answerKo : faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredFaqs.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <p className="text-xl mb-2">🔍 没有找到相关问题</p>
            <p>请尝试其他关键词或联系客服</p>
          </div>
        )}

        {/* Contact */}
        <div className="mt-12 bg-gradient-to-r from-violet-600/20 to-purple-600/20 rounded-2xl p-8 border border-violet-500/30">
          <h2 className="text-2xl font-bold text-white text-center mb-4">联系我们</h2>
          <p className="text-slate-400 text-center mb-6">
            没找到答案？联系我们获取帮助
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <a
              href="mailto:support@bbmarket.com"
              className="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors flex items-center gap-2"
            >
              📧 邮件客服
            </a>
            <a
              href="https://t.me/bbmarket"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2"
            >
              ✈️ Telegram
            </a>
            <a
              href="/chat"
              className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2"
            >
              💬 在线客服
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
