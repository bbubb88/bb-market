'use client';

import { useI18n } from '@/lib/i18n';

export default function TermsPage() {
  const { language } = useI18n();

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
          <h1 className="text-3xl font-bold text-white mb-8">服务条款</h1>
          
          <div className="space-y-6 text-slate-300">
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">1. 服务条款的接受</h2>
              <p>
                欢迎使用 BB Market！通过访问或使用我们的服务，您同意遵守并受这些服务条款的约束。如果您不同意这些条款的任何部分，请勿使用我们的服务。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">2. 服务描述</h2>
              <p>
                BB Market 提供游戏账号、道具和游戏币的交易平台服务。我们致力于为用户提供安全、快捷、可靠的交易环境。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">3. 用户账户</h2>
              <p>
                您需要注册账户才能使用我们的服务。您负责维护账户的机密性，并对其下发生的所有活动负责              </p>
。
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">4. 交易规则</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>所有交易必须通过平台进行，禁止私下交易</li>
                <li>卖家必须保证商品描述的真实性</li>
                <li>买家确认收货后，款项将释放给卖家</li>
                <li>禁止发布违法或违规商品</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">5. 费用</h2>
              <p>
                我们收取交易手续费：账号交易 3%、道具交易 2%、游戏币交易 1%。具体费用以平台实际展示为准。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">6. 免责声明</h2>
              <p>
                我们不对任何交易中的损失负责。用户在进行交易时应自行承担风险。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">7. 联系我们</h2>
              <p>
                如有问题，请联系：support@bbmarket.com
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-700 text-slate-500 text-sm">
            <p>最后更新：2026年2月28日</p>
          </div>
        </div>
      </div>
    </div>
  );
}
