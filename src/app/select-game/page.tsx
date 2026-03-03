'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { db } from '@/lib/supabase';
import Link from 'next/link';

interface Game {
  id: string;
  name: string;
  nameKo: string;
  icon: string | null;
  iconUrl: string | null;
  status: string;
}

interface Server {
  id: string;
  gameId: string;
  name: string;
  nameKo: string;
}

export default function SelectGamePage() {
  const { language, t } = useI18n();
  const [games, setGames] = useState<Game[]>([]);
  const [servers, setServers] = useState<Record<string, Server[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    setLoading(true);
    try {
      const { data } = await db.getGames();
      if (data) {
        const activeGames = data.filter((g: Game) => g.status === 'ACTIVE');
        setGames(activeGames);
        
        // 加载每个游戏的服务器
        for (const game of activeGames) {
          const { data: serverData } = await db.getServers(game.id);
          if (serverData) {
            setServers(prev => ({ ...prev, [game.id]: serverData }));
          }
        }
      }
    } catch (error) {
      console.error('Failed to load games:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-slate-400">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">选择游戏</h1>
          <p className="text-slate-400">选择您要交易的游戏</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {games.map((game) => (
            <Link
              key={game.id}
              href={`/create-listing?game=${game.id}`}
              className="group bg-slate-800/60 rounded-2xl p-8 border border-slate-700 hover:border-violet-500 transition-all hover:-translate-y-2"
            >
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center overflow-hidden shadow-lg">
                  {game.iconUrl ? (
                    <img src={game.iconUrl} alt={game.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">{game.icon || '🎮'}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-violet-400 transition-colors">
                    {language === 'ko' ? game.nameKo : game.name}
                  </h2>
                  <p className="text-slate-400 text-sm mb-3">
                    {servers[game.id]?.length || 0} {language === 'ko' ? '개 서버' : '个服务器'}
                  </p>
                  <div className="flex gap-2">
                    <Link
                      href={`/create-listing?game=${game.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-4 py-2 text-sm bg-violet-600/20 text-violet-300 rounded-lg hover:bg-violet-600/30 transition-colors"
                    >
                      发布商品
                    </Link>
                    <Link
                      href={`/accounts?game=${game.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-4 py-2 text-sm bg-violet-600/20 text-violet-300 rounded-lg hover:bg-violet-600/30 transition-colors"
                    >
                      账号交易
                    </Link>
                    <Link
                      href={`/items?game=${game.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-4 py-2 text-sm bg-cyan-600/20 text-cyan-300 rounded-lg hover:bg-cyan-600/30 transition-colors"
                    >
                      道具交易
                    </Link>
                    <Link
                      href={`/coins?game=${game.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-4 py-2 text-sm bg-amber-600/20 text-amber-300 rounded-lg hover:bg-amber-600/30 transition-colors"
                    >
                      游戏币
                    </Link>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link href="/" className="text-violet-400 hover:text-violet-300">
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
