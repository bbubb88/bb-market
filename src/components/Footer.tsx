'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

export default function Footer() {
  const { t } = useI18n();

  const footerLinks = [
    {
      title: '快速链接',
      links: [
        { text: '帮助中心', href: '/help' },
        { text: '服务条款', href: '/terms' },
        { text: '隐私政策', href: '/privacy' },
        { text: '关于我们', href: '/about' },
      ],
    },
    {
      title: '联系方式',
      links: [
        { text: 'Email: support@bbmarket.com', href: 'mailto:support@bbmarket.com' },
        { text: 'Telegram: @bbmarket', href: 'https://t.me/bbmarket' },
      ],
    },
  ];

  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.svg" alt="BB Market" className="h-8" />
            </div>
            <p className="text-slate-400 text-sm mb-4">
              {t('footer.about')}
            </p>
            {/* Social */}
            <div className="flex gap-3">
              <a href="https://t.me/bbmarket" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-lg hover:bg-slate-700 transition-colors">
                ✈️
              </a>
              <a href="mailto:support@bbmarket.com" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-lg hover:bg-slate-700 transition-colors">
                📧
              </a>
            </div>
          </div>

          {/* Links */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="text-white font-semibold mb-4">
                {section.title === 'footer.links' ? t(section.title) : section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link, index) => (
                  <li key={index}>
                    {link.href ? (
                      <Link
                        href={link.href}
                        className="text-slate-400 hover:text-violet-400 text-sm transition-colors"
                      >
                        {(link as any).key ? t((link as any).key) : (link as any).text}
                      </Link>
                    ) : (
                      <span className="text-slate-400 text-sm">{(link as any).text}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Status */}
        <div className="mt-8 pt-8 border-t border-slate-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">
              {t('footer.copyright')}
            </p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                <span className="text-slate-400">系统正常</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                <span className="text-slate-400">客服在线</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
