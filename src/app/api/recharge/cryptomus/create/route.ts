import { NextRequest, NextResponse } from 'next/server';
import { createWallet, getPaymentStatus, CryptomusWallet } from '@/lib/cryptomus';

// Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ytsqawvrgzxgfluuadao.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 获取站点 URL
const getSiteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || 'https://bb-market-next.vercel.app';

async function supabaseRequest(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Prefer': 'return=representation',
  };

  const res = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
    ...options,
    headers,
  });
  const data = await res.json();
  return { status: res.status, data };
}

/**
 * 创建 Cryptomus 充值
 * POST /api/recharge/cryptomus/create
 * 
 * 使用静态钱包模式：用户直接转账到钱包地址
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount, orderIds } = body;

    if (!userId || !amount || parseFloat(amount) < 5) {
      return NextResponse.json(
        { error: 'Invalid amount or user. Minimum is 5 USDT' },
        { status: 400 }
      );
    }

    const siteUrl = getSiteUrl();
    const rechargeId = 'cm_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

    console.log('[Cryptomus] Creating payment for user:', userId, 'amount:', amount);

    // 使用静态钱包模式（用户直接转账到地址，类似传统方式但有自动确认）
    const wallet = await createWallet(rechargeId, 'USDT', 'TRX');

    if (!wallet) {
      console.error('[Cryptomus] Failed to create wallet, falling back to manual mode');
      // 如果 Cryptomus 失败，回退到手动转账模式
      return NextResponse.json({
        fallback: true,
        amount: parseFloat(amount),
        address: process.env.NEXT_PUBLIC_USDT_TRC20_ADDRESS || 'TXqY4K3QvJk9xLm2nP7rT8sUw5xYz6Gh',
        message: 'Cryptomus unavailable, please use manual transfer',
      });
    }

    // 保存充值记录到数据库
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // 30分钟有效期

    const rechargeData = {
      id: rechargeId,
      userId,
      amount: parseFloat(amount),
      address: wallet.address,
      status: 'pending',
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      // Cryptomus 特定字段
      cryptomusUuid: wallet.wallet_uuid,
      cryptomusCurrency: wallet.currency,
      cryptomusNetwork: wallet.network,
      orderIds: orderIds ? orderIds.join(',') : null,
    };

    try {
      await supabaseRequest('recharge', {
        method: 'POST',
        body: JSON.stringify(rechargeData),
      });
    } catch (dbError) {
      console.error('[Cryptomus] Database error:', dbError);
    }

    // 生成二维码
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=trc20:${wallet.address}?amount=${amount}&color=ffffff&bgcolor=1a1a2e`;

    // 返回给前端
    return NextResponse.json({
      id: rechargeId,
      amount: parseFloat(amount),
      address: wallet.address,
      currency: wallet.currency,
      network: wallet.network,
      walletUuid: wallet.wallet_uuid,
      status: wallet.status,
      expiresAt: expiresAt.toISOString(),
      qrCodeUrl,
    });
  } catch (error) {
    console.error('[Cryptomus] Create error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
