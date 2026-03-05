'use client';

import { useI18n } from '@/lib/i18n';
import Link from 'next/link';

export default function HIT2Page() {
  const { language } = useI18n();

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* HIT2 标题 */}
        <div className="text-center mb-12">
          <div className="w-32 h-32 mx-auto mb-4 rounded-2xl overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-amber-500 flex items-center justify-center">
            <img 
              src="/hit2-icon.png" 
              alt="HIT2"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">HIT2</h1>
        </div>

        {/* 交易入口 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 购买 */}
          <Link
            href="/accounts"
            className="group p-8 bg-gradient-to-br from-emerald-600/20 to-cyan-600/20 rounded-2xl border border-emerald-500/30 hover:border-emerald-400 transition-all hover:scale-105"
          >
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center text-4xl">
                🛒
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {language === 'ko' ? '구매' : '购买'}
              </h2>
              <p className="text-slate-400">
                {language === 'ko' ? '계정, 아이템, 게임화폐 구매' : '账号、道具、游戏币'}
              </p>
            </div>
          </Link>

          {/* 账号 */}
          <Link
            href="/accounts"
            className="group p-8 bg-gradient-to-br from-violet-600/20 to-purple-600/20 rounded-2xl border border-violet-500/30 hover:border-violet-400 transition-all hover:scale-105"
          >
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-violet-500 to-purple-500 rounded-2xl flex items-center justify-center text-4xl">
                📋
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {language === 'ko' ? '계정' : '账号'}
              </h2>
              <p className="text-slate-400">
                {language === 'ko' ? '계정 구매' : '账号交易'}
              </p>
            </div>
          </Link>

          {/* 道具 */}
          <Link
            href="/items"
            className="group p-8 bg-gradient-to-br from-cyan-600/20 to-blue-600/20 rounded-2xl border border-cyan-500/30 hover:border-cyan-400 transition-all hover:scale-105"
          >
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center text-4xl">
                🎁
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {language === 'ko' ? '아이템' : '道具'}
              </h2>
              <p className="text-slate-400">
                {language === 'ko' ? '아이템 구매' : '道具交易'}
              </p>
            </div>
          </Link>

          {/* 游戏币 */}
          <Link
            href="/coins"
            className="group p-8 bg-gradient-to-br from-amber-600/20 to-orange-600/20 rounded-2xl border border-amber-500/30 hover:border-amber-400 transition-all hover:scale-105"
          >
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center text-4xl">
                💰
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {language === 'ko' ? '게임화학' : '游戏币'}
              </h2>
              <p className="text-slate-400">
                {language === 'ko' ? '골드 구매' : '游戏币交易'}
              </p>
            </div>
          </Link>
        </div>

        {/* 快捷分类 */}
        <div className="mt-12">
          <h3 className="text-xl font-bold text-white mb-6 text-center">
            {language === 'ko' ? '카테고리' : '分类'}
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <Link
              href="/accounts"
              className="p-6 bg-slate-800/60 rounded-xl border border-slate-700 hover:border-violet-500 transition-all text-center"
            >
              <div className="text-3xl mb-2">📋</div>
              <div className="text-white font-medium">
                {language === 'ko' ? '계정' : '账号'}
              </div>
            </Link>
            <Link
              href="/items"
              className="p-6 bg-slate-800/60 rounded-xl border border-slate-700 hover:border-violet-500 transition-all text-center"
            >
              <div className="text-3xl mb-2">🎮</div>
              <div className="text-white font-medium">
                {language === 'ko' ? '아이템' : '道具'}
              </div>
            </Link>
            <Link
              href="/coins"
              className="p-6 bg-slate-800/60 rounded-xl border border-slate-700 hover:border-violet-500 transition-all text-center"
            >
              <div className="text-3xl mb-2">💎</div>
              <div className="text-white font-medium">
                {language === 'ko' ? '게임화폐' : '游戏币'}
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
