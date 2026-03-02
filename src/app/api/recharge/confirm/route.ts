import { NextRequest, NextResponse } from 'next/server';

// 使用 Supabase Admin
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ytsqawvrgzxgfluuadao.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function supabaseRequest(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Prefer': 'return=representation',
  };
  
  if (options.headers) {
    const optHeaders = options.headers as Record<string, string>;
    if (optHeaders['Prefer']) {
      headers['Prefer'] = optHeaders['Prefer'];
    }
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
    ...options,
    headers,
  });
  const data = await res.json();
  return { status: res.status, data };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rechargeId } = body;

    if (!rechargeId) {
      return NextResponse.json(
        { error: 'Recharge ID required' },
        { status: 400 }
      );
    }

    // 更新充值记录状态为 pending_confirm（等待确认）
    try {
      const { status, data } = await supabaseRequest(`recharge?id=eq.${rechargeId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'pending_confirm',
        }),
      });

      if (status >= 400) {
        console.error('Supabase error:', data);
        // 本地模式返回成功
        return NextResponse.json({ 
          success: true,
          message: 'Confirmation requested (local mode)'
        });
      }

      return NextResponse.json({ 
        success: true,
        message: 'Confirmation requested, waiting for admin approval'
      });
    } catch (supabaseError) {
      console.error('Supabase error:', supabaseError);
      return NextResponse.json({ 
        success: true,
        message: 'Confirmation requested (local mode)'
      });
    }
  } catch (error) {
    console.error('Confirm recharge error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
