'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { db } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  zone: string | null;
}

export default function CreateListingPage() {
  const { language, t } = useI18n();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [games, setGames] = useState<Game[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [selectedGame, setSelectedGame] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [zones, setZones] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    type: 'ACCOUNT',
    gameId: '',
    serverId: '',
    title: '',
    description: '',
    price: '',
    level: '',
    amount: '',
    images: [] as string[],
  });
  
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    loadGames();
  }, []);

  useEffect(() => {
    if (selectedGame) {
      loadServers(selectedGame);
    }
  }, [selectedGame]);

  const loadGames = async () => {
    setLoading(true);
    try {
      const { data, error } = await db.getGames();
      if (error) {
        console.error('Failed to load games from DB:', error);
      }
      if (data && data.length > 0) {
        // 去重：按ID过滤
        const uniqueGames = data.filter((g: Game) => g.status === 'ACTIVE');
        const seen = new Set();
        const deduped = uniqueGames.filter((g: Game) => {
          if (seen.has(g.id)) return false;
          seen.add(g.id);
          return true;
        });
        setGames(deduped);
      } else {
        // 使用默认游戏列表作为后备（已去重）
        setGames([
          { id: 'hit2', name: 'HIT2', nameKo: '히트2', icon: '🎮', iconUrl: null, status: 'ACTIVE' },
        ]);
      }
    } catch (error) {
      console.error('Failed to load games:', error);
      // 使用默认游戏列表作为后备（已去重）
      setGames([
        { id: 'hit2', name: 'HIT2', nameKo: '히트2', icon: '🎮', iconUrl: null, status: 'ACTIVE' },
      ]);
    }
    setLoading(false);
  };

  const loadServers = async (gameId: string) => {
    try {
      const { data } = await db.getServers(gameId);
      if (data) {
        // 按服务器名排序
        const sorted = data.sort((a: Server, b: Server) => a.name.localeCompare(b.name, 'zh-CN'));
        setServers(sorted);
        // 提取所有大区
        const uniqueZones = [...new Set(data.map((s: Server) => s.zone).filter(Boolean))];
        setZones(uniqueZones as string[]);
      }
    } catch (error) {
      console.error('Failed to load servers:', error);
    }
  };

  // 当大区改变时，重置服务器选择
  const handleZoneChange = (zone: string) => {
    setSelectedZone(zone);
    setFormData({ ...formData, serverId: '' });
  };

  // Step 1: Select Game
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

  if (step === 1) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-white text-center mb-8">选择游戏</h1>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {games.map((game) => (
              <button
                key={game.id}
                onClick={() => {
                  setSelectedGame(game.id);
                  setFormData({ ...formData, gameId: game.id });
                  setStep(2);
                }}
                className="p-6 bg-slate-800/60 rounded-2xl border border-slate-700 hover:border-violet-500 transition-all hover:scale-105 text-center"
              >
                <div className="text-5xl mb-3">
                  {game.iconUrl ? (
                    <img src={game.iconUrl} alt={game.name} className="w-16 h-16 mx-auto rounded-xl" />
                  ) : (
                    game.icon || '🎮'
                  )}
                </div>
                <h3 className="text-white font-semibold text-lg">
                  {language === 'ko' ? game.nameKo : game.name}
                </h3>
              </button>
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

  const listingTypes = [
    { id: 'ACCOUNT', name: '账号', nameKo: '계정', icon: '📋' },
    { id: 'ITEM', name: '道具', nameKo: '아이템', icon: '🎮' },
    { id: 'COIN', name: '游戏币', nameKo: '게임화폐', icon: '💰' },
  ];

  const addImage = () => {
    if (imageUrl.trim()) {
      setFormData({ ...formData, images: [...formData.images, imageUrl.trim()] });
      setImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // 创建测试用户（如果不存在）
      const testUserId = 'test-seller-1';
      
      const listingData = {
        sellerId: testUserId,
        gameId: formData.gameId,
        serverId: formData.serverId || null,
        type: formData.type,
        title: formData.title,
        description: formData.description || null,
        price: parseFloat(formData.price),
        level: formData.level ? parseInt(formData.level) : null,
        amount: formData.amount ? parseInt(formData.amount) : null,
        images: formData.images.length > 0 ? formData.images : ['📦'],
        status: 'SELLING',
      };

      const { data, error } = await db.createListing(listingData);
      
      if (error) {
        alert('发布失败: ' + error.message);
      } else {
        alert('发布成功！');
        router.push('/');
      }
    } catch (error: any) {
      alert('发布失败: ' + error.message);
    }
    
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-white mb-8">发布商品</h1>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-10">
          {[
            { num: 1, label: '选择游戏' },
            { num: 2, label: '填写信息' },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= s.num ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400'
              }`}>
                {s.num}
              </div>
              <span className={`ml-2 mr-4 ${step >= s.num ? 'text-white' : 'text-slate-400'}`}>
                {s.label}
              </span>
              {i < 1 && <span className="text-slate-600 mr-4">→</span>}
            </div>
          ))}
        </div>

        {/* Step 1: Selected Game */}
        <div className="mb-8 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">已选游戏:</span>
            <button 
              onClick={() => setStep(1)}
              className="text-violet-400 hover:text-violet-300 text-sm"
            >
              更换
            </button>
          </div>
          <div className="text-white font-medium mt-1">
            {games.find(g => g.id === selectedGame)?.name}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Listing Type */}
          <div>
            <label className="block text-white font-medium mb-3">商品类型 *</label>
            <div className="grid grid-cols-3 gap-3">
              {listingTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.id })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.type === type.id
                      ? 'border-violet-500 bg-violet-500/20'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }`}
                >
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="text-white font-medium">
                    {language === 'ko' ? type.nameKo : type.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Zone */}
          {zones.length > 0 && (
            <div>
              <label className="block text-white font-medium mb-2">大区</label>
              <select
                value={selectedZone}
                onChange={(e) => handleZoneChange(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-violet-500"
              >
                <option value="">选择大区</option>
                {zones.map((zone) => (
                  <option key={zone} value={zone}>{zone}</option>
                ))}
              </select>
            </div>
          )}

          {/* Server */}
          {selectedZone && (
            <div>
              <label className="block text-white font-medium mb-2">服务器</label>
              <select
                value={formData.serverId}
                onChange={(e) => setFormData({ ...formData, serverId: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-violet-500"
              >
                <option value="">选择服务器</option>
                {servers.filter(s => s.zone === selectedZone).map((server) => (
                  <option key={server.id} value={server.id}>
                    {language === 'ko' && server.nameKo ? server.nameKo : server.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-white font-medium mb-2">标题 *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-violet-500"
              placeholder="商品标题"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-white font-medium mb-2">描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-violet-500 h-32"
              placeholder="商品详细描述"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-white font-medium mb-2">价格 (USDT) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-violet-500"
              placeholder="0.00"
              required
            />
          </div>

          {/* Level / Amount */}
          <div className="grid grid-cols-2 gap-4">
            {formData.type === 'ACCOUNT' && (
              <div>
                <label className="block text-white font-medium mb-2">等级</label>
                <input
                  type="number"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-violet-500"
                  placeholder="角色等级"
                />
              </div>
            )}
            {formData.type === 'COIN' && (
              <div>
                <label className="block text-white font-medium mb-2">数量</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-violet-500"
                  placeholder="游戏币数量"
                />
              </div>
            )}
          </div>

          {/* Images */}
          <div>
            <label className="block text-white font-medium mb-2">商品详情图片</label>
            <div className="border-2 border-dashed border-slate-600 rounded-xl p-6 text-center hover:border-violet-500 transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={async (e) => {
                  const files = e.target.files;
                  if (files) {
                    for (let i = 0; i < files.length; i++) {
                      const file = files[i];
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const result = event.target?.result as string;
                        setFormData({ ...formData, images: [...formData.images, result] });
                      };
                      reader.readAsDataURL(file);
                    }
                  }
                }}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <div className="text-4xl mb-2">📁</div>
                <p className="text-slate-400">点击上传图片</p>
                <p className="text-slate-500 text-sm mt-1">支持 PNG、JPG、GIF</p>
              </label>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {formData.images.map((img, i) => (
                <div key={i} className="relative">
                  <img src={img} alt="" className="w-20 h-20 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl hover:from-violet-500 hover:to-purple-500 transition-all disabled:opacity-50"
          >
            {submitting ? '发布中...' : '发布商品'}
          </button>
        </form>
      </div>
    </div>
  );
}
