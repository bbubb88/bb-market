'use client';

import { useI18n } from '@/lib/i18n';
import { games } from '@/data/games';
import Link from 'next/link';

export default function SelectGamePage() {
  const { language, t } = useI18n();
  const activeGames = games.filter(g => g.status === 'active');

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">{t('selectGame.title')}</h1>
          <p className="text-slate-400">{t('selectGame.desc')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeGames.map((game) => (
            <Link
              key={game.id}
              href={`/accounts?game=${game.id}`}
              className="group bg-slate-800/60 rounded-2xl p-8 border border-slate-700 hover:border-violet-500 transition-all hover:-translate-y-2"
            >
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center overflow-hidden shadow-lg">
                  {game.iconUrl ? (
                    <img src={game.iconUrl} alt={game.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">{game.icon}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-violet-400 transition-colors">
                    {language === 'ko' ? game.nameKo : game.name}
                  </h2>
                  <p className="text-slate-400 text-sm mb-3">
                    {language === 'ko' 
                      ? `${game.servers.length}개 서버` 
                      : `${game.servers.length} 个服务器`}
                  </p>
                  <div className="flex gap-2">
                    <Link
                      href={`/accounts?game=${game.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-4 py-2 text-sm bg-violet-600/20 text-violet-300 rounded-lg hover:bg-violet-600/30 transition-colors"
                    >
                      {language === 'ko' ? '계정 구매' : '账号交易'}
                    </Link>
                    <Link
                      href={`/coins?game=${game.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-4 py-2 text-sm bg-amber-600/20 text-amber-300 rounded-lg hover:bg-amber-600/30 transition-colors"
                    >
                      {language === 'ko' ? '골드 구매' : '金币交易'}
                    </Link>
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {/* Coming Soon Games */}
          {games.filter(g => g.status === 'coming').map((game) => (
            <div
              key={game.id}
              className="bg-slate-800/30 rounded-2xl p-8 border border-slate-700 opacity-60"
            >
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-slate-700 flex items-center justify-center overflow-hidden grayscale">
                  {game.iconUrl ? (
                    <img src={game.iconUrl} alt={game.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">{game.icon}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {language === 'ko' ? game.nameKo : game.name}
                  </h2>
                  <span className="inline-block px-3 py-1 text-xs bg-slate-600 text-slate-300 rounded-full">
                    {t('selectGame.coming')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-500 text-sm">
            更多游戏敬请期待...
          </p>
        </div>
      </div>
    </div>
  );
}
