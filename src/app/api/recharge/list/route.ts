import { NextRequest, NextResponse } from 'next/server';

// 使用 Supabase Admin
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ytsqawvrgzxgfluuadao.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function supabaseRequest(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Prefer': options.headers?.['Prefer'] || 'return=representation',
      ...options.headers,
    },
  });
  const data = await res.json();
  return { status: res.status, data };
}

// 获取用户充值记录
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const admin = searchParams.get('admin');

    try {
      let query = 'recharge?select=*&order=createdAt.desc';
      
      if (userId && !admin) {
        query = `recharge?userId=eq.${userId}&select=*&order=createdAt.desc`;
      }

      const { status, data } = await supabaseRequest(query);

      if (status >= 400) {
        console.error('Supabase error:', data);
        // 返回空数组作为 fallback
        return NextResponse.json([]);
      }

      return NextResponse.json(data || []);
    } catch (supabaseError) {
      console.error('Supabase error:', supabaseError);
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('List recharge error:', error);
    return NextResponse.json([]);
  }
}
