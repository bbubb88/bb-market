import { NextRequest, NextResponse } from 'next/server';

const USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT_TRC20_ADDRESS || 'TXqY4K3QvJk9xLm2nP7rT8sUw5xYz6Gh';
const EXPIRY_MINUTES = parseInt(process.env.NEXT_PUBLIC_USDT_EXPIRY_MINUTES || '15');

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

// 生成唯一 ID
function generateId(): string {
  return 'rc_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount, orderIds } = body;

    if (!userId || !amount || amount < 5) {
      return NextResponse.json(
        { error: 'Invalid amount or user' },
        { status: 400 }
      );
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + EXPIRY_MINUTES * 60 * 1000);

    // 构建充值记录数据
    const rechargeData: any = {
      userId,
      amount: parseFloat(amount),
      address: USDT_ADDRESS,
      status: 'pending',
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
    
    // 如果有订单ID，保存到充值记录中
    if (orderIds && Array.isArray(orderIds)) {
      rechargeData.orderIds = orderIds.join(',');
    }

    // 尝试创建充值记录到 Supabase
    try {
      const { status, data } = await supabaseRequest('recharge', {
        method: 'POST',
        body: JSON.stringify(rechargeData),
      });

      if (status >= 400) {
        // 如果 Supabase 失败，记录到响应中
        console.error('Supabase error:', data);
        // 返回客户端需要的信息（用于 localStorage）
      }
      
      if (status >= 200 && status < 300) {
        const record = Array.isArray(data) ? data[0] : data;
        return NextResponse.json({
          id: record.id,
          amount: record.amount,
          address: record.address,
          status: record.status,
          createdAt: record.createdAt,
          expiresAt: record.expiresAt,
        });
      }
    } catch (supabaseError) {
      console.error('Supabase error:', supabaseError);
    }

    // Fallback: 返回客户端信息，本地存储
    const localId = generateId();
    return NextResponse.json({
      id: localId,
      amount: parseFloat(amount),
      address: USDT_ADDRESS,
      status: 'pending',
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      local: true // 标记为本地存储
    });
  } catch (error) {
    console.error('Create recharge error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
