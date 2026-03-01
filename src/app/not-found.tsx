import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-9xl mb-8">😕</div>
        <h1 className="text-4xl font-bold text-white mb-4">404</h1>
        <p className="text-xl text-slate-400 mb-8">页面不存在 | 페이지가 존재하지 않습니다</p>
        <Link
          href="/"
          className="inline-block px-8 py-4 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 transition-colors"
        >
          返回首页 | 홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
