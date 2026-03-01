'use client';

import { useI18n } from '@/lib/i18n';

export default function PrivacyPage() {
  const { language } = useI18n();

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
          <h1 className="text-3xl font-bold text-white mb-8">隐私政策</h1>
          
          <div className="space-y-6 text-slate-300">
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">1. 信息收集</h2>
              <p>
                我们收集您在使用服务时提供的信息，包括但不限于：注册信息、交易记录、联系方式等。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">2. 信息使用</h2>
              <p>
                我们使用收集的信息来：提供和改进我们的服务、处理交易、向您发送重要通知、保护您的账户安全。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">3. 信息保护</h2>
              <p>
                我们采用各种安全措施来保护您的个人信息，包括数据加密、安全存储和访问控制。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">4. 信息共享</h2>
              <p>
                我们不会出售您的个人信息。在以下情况下，我们可能共享信息：法律要求、为了提供服务、保护我们的权利。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">5. Cookie</h2>
              <p>
                我们使用 Cookie 来改善您的用户体验。您可以通过浏览器设置禁用 Cookie，但这可能影响服务的某些功能。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">6. 您的权利</h2>
              <p>
                您有权访问、更正或删除您的个人信息。如需行使这些权利，请联系我们。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">7. 联系我们</h2>
              <p>
                如有任何隐私相关问题，请联系：support@bbmarket.com
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
