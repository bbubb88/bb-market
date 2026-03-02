import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { userId, listingId, action } = await request.json();

    if (!userId || !listingId) {
      return NextResponse.json(
        { error: 'User ID and Listing ID are required' },
        { status: 400 }
      );
    }

    // 尝试检查是否有 favorites 表
    if (action === 'add') {
      // 先检查是否已收藏
      const checkRes = await fetch(
        `${SUPABASE_URL}/rest/v1/favorites?userId=eq.${userId}&listingId=eq.${listingId}`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
        }
      );
      
      const existing = await checkRes.json();
      
      if (existing && existing.length > 0) {
        return NextResponse.json({ message: 'Already favorited', favorited: true });
      }

      // 添加收藏
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/favorites`,
        {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({ userId, listingId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        // 如果表不存在，创建它
        if (error.code === '42P01') {
          // 创建 favorites 表
          await fetch(
            `${SUPABASE_URL}/rest/v1/`,
            {
              method: 'POST',
              headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal',
              },
            }
          );
          return NextResponse.json({ error: 'Favorites table not configured' }, { status: 500 });
        }
        return NextResponse.json({ error: error.message || 'Failed to add favorite' }, { status: response.status });
      }

      return NextResponse.json({ message: 'Added to favorites', favorited: true });
    }

    if (action === 'remove') {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/favorites?userId=eq.${userId}&listingId=eq.${listingId}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return NextResponse.json({ error: error.message || 'Failed to remove favorite' }, { status: response.status });
      }

      return NextResponse.json({ message: 'Removed from favorites', favorited: false });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Favorites error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // 获取用户收藏
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/favorites?userId=eq.${userId}&select=*,Listing:listingId(*)`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    const favorites = await response.json();

    if (!response.ok) {
      // 如果表不存在，返回空数组
      if (response.status === 400 || response.status === 404) {
        return NextResponse.json([]);
      }
      return NextResponse.json(
        { error: favorites.message || 'Failed to fetch favorites' },
        { status: response.status }
      );
    }

    return NextResponse.json(favorites || []);
  } catch (error) {
    console.error('Fetch favorites error:', error);
    return NextResponse.json([]);
  }
}
