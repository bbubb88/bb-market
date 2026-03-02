'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Banner {
  id: number;
  title: string;
  titleKo: string;
  subtitle: string;
  subtitleKo: string;
  image: string;
  link: string;
  badge?: string;
  badgeColor?: string;
}

const banners: Banner[] = [
  {
    id: 1,
    title: '🎮 HIT2 游戏专区',
    titleKo: '🎮 HIT2 게임专区',
    subtitle: '热门账号道具交易',
    subtitleKo: '热门账号道具交易',
    image: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
    link: '/hit2',
    badge: 'HOT',
    badgeColor: 'from-red-500 to-orange-500',
  },
  {
    id: 2,
    title: '💰 安全交易',
    titleKo: '💰 안전한 거래',
    subtitle: '资金担保交易',
    subtitleKo: '资金担保交易',
    image: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
    link: '/help',
    badge: '安全',
    badgeColor: 'from-emerald-500 to-cyan-500',
  },
  {
    id: 3,
    title: '📞 7×24客服',
    titleKo: '📞 7×24 고객센터',
    subtitle: '随时为您服务',
    subtitleKo: '随时为您服务',
    image: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    link: '/help',
    badge: '客服',
    badgeColor: 'from-violet-500 to-purple-500',
  },
  {
    id: 4,
    title: '⚡ 快速到账',
    titleKo: '⚡ 빠른 입금',
    subtitle: 'USDT支付',
    subtitleKo: 'USDT支付',
    image: 'linear-gradient(135deg, #f59e0b 0%, #eab308 100%)',
    link: '/help',
    badge: '支付',
    badgeColor: 'from-amber-500 to-yellow-500',
  },
];
    badgeColor: 'from-violet-500 to-purple-500',
  },
];

export default function Banner() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isHovered]);

  const goToSlide = (index: number) => {
    setActiveIndex(index);
  };

  const goToPrev = () => {
    setActiveIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setActiveIndex((prev) => (prev + 1) % banners.length);
  };

  return (
    <div 
      className="relative w-full h-48 md:h-64 rounded-2xl overflow-hidden mb-8"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Banner Slides */}
      <div className="relative w-full h-full">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-all duration-700 ease-in-out ${
              index === activeIndex 
                ? 'opacity-100 translate-x-0' 
                : 'opacity-0 translate-x-full'
            }`}
          >
            <Link href={banner.link} className="block w-full h-full">
              <div 
                className="w-full h-full flex items-center justify-center"
                style={{ background: banner.image }}
              >
                <div className="text-center px-4">
                  {banner.badge && (
                    <span className={`inline-block px-4 py-1.5 text-sm font-bold text-white rounded-full mb-4 bg-gradient-to-r ${banner.badgeColor}`}>
                      {banner.badge}
                    </span>
                  )}
                  <h3 className="text-2xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
                    {banner.title}
                  </h3>
                  <p className="text-lg md:text-xl text-white/90 drop-shadow">
                    {banner.subtitle}
                  </p>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrev}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-all"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={goToNext}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-all"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === activeIndex 
                ? 'w-8 bg-white' 
                : 'bg-white/50 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
