'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import ListingCard from '@/components/ListingCard';
import { Listing } from '@/types';

function SearchContent() {
  const { language, t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const typeFilter = searchParams.get('type') || '';
  
  const [results, setResults] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(query);

  useEffect(() => {
    if (!query) {
      setResults([]);
      setLoading(false);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('q', query);
        if (typeFilter) params.set('type', typeFilter);
        
        const response = await fetch(`/api/search?${params.toString()}`);
        const data = await response.json();
        setResults(data.results || []);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, typeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const typeOptions = [
    { value: '', label: language === 'ko' ? '전체' : '全部' },
    { value: 'account', label: language === 'ko' ? '계정' : '账号' },
    { value: 'item', label: language === 'ko' ? '아이템' : '道具' },
    { value: 'coin', label: language === 'ko' ? '게임화폐' : '游戏币' },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            {language === 'ko' ? '검색' : '搜索'}
          </h1>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-3 mb-6">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={language === 'ko' ? '검색어를 입력하세요...' : '输入搜索关键词...'}
                className="w-full px-5 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 text-lg"
              />
            </div>
            <button
              type="submit"
              className="px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-colors"
            >
              {language === 'ko' ? '검색' : '搜索'}
            </button>
          </form>

          {/* Type Filter */}
          <div className="flex gap-2 flex-wrap">
            {typeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  const params = new URLSearchParams();
                  params.set('q', query);
                  if (option.value) params.set('type', option.value);
                  router.push(`/search?${params.toString()}`);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  (typeFilter === option.value || (!typeFilter && !option.value))
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
            <p className="text-slate-400 mt-4">{language === 'ko' ? '검색 중...' : '搜索中...'}</p>
          </div>
        ) : query ? (
          <>
            <p className="text-slate-400 mb-6">
              {language === 'ko' 
                ? `"${query}" 검색 결과: ${results.length}개`
                : `"${query}" 的搜索结果：${results.length} 个`}
            </p>
            
            {results.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-800/50 rounded-xl">
                <p className="text-slate-400 text-lg">
                  {language === 'ko' 
                    ? '검색 결과가 없습니다.'
                    : '没有找到相关结果'}
                </p>
                <p className="text-slate-500 mt-2">
                  {language === 'ko' 
                    ? '다른 검색어를 시도해 보세요.'
                    : '请尝试其他关键词'}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-slate-800/50 rounded-xl">
            <p className="text-slate-400 text-lg">
              {language === 'ko' 
                ? '검색어를 입력해 주세요.'
                : '请输入搜索关键词'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
