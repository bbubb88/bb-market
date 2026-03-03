import { NextRequest, NextResponse } from 'next/server';
import { getWalletStatus } from '@/lib/cryptomus';

// Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ytsqawvrgzxgfluuadao.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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
 * 查询 Cryptomus 充值状态
 * GET /api/recharge/cryptomus/status?rechargeId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rechargeId = searchParams.get('rechargeId');
    const walletUuid = searchParams.get('walletUuid');

    if (!rechargeId) {
      return NextResponse.json(
        { error: 'Missing rechargeId parameter' },
        { status: 400 }
      );
    }

    // 查询充值记录
    const { data: recharge } = await supabaseRequest(`recharge?id=eq.${rechargeId}&select=*`, {
      method: 'GET',
    });

    if (!recharge || recharge.length === 0) {
      return NextResponse.json(
        { error: 'Recharge not found' },
        { status: 404 }
      );
    }

    const rechargeRecord = recharge[0];

    // 如果已完成或已拒绝，直接返回状态
    if (rechargeRecord.status === 'completed' || rechargeRecord.status === 'rejected') {
      return NextResponse.json({
        status: rechargeRecord.status,
        amount: rechargeRecord.amount,
      });
    }

    // 如果有 walletUuid，尝试查询 Cryptomus 状态
    const walletUuidToCheck = walletUuid || rechargeRecord.cryptomusUuid;

    if (walletUuidToCheck) {
      try {
        const walletInfo = await getWalletStatus(walletUuidToCheck);

        if (walletInfo) {
          console.log('[Cryptomus Status] Wallet info:', walletInfo);

          // 根据钱包状态更新本地状态
          const newStatus = walletInfo.status;

          if (newStatus === 'paid' || newStatus === 'completed') {
            // 更新本地状态为已完成
            await supabaseRequest(`recharge?id=eq.${rechargeId}`, {
              method: 'PATCH',
              body: JSON.stringify({
                status: 'completed',
                cryptomusStatus: newStatus,
                completedAt: new Date().toISOString(),
              }),
            });

            return NextResponse.json({
              status: 'completed',
              amount: rechargeRecord.amount,
              walletStatus: newStatus,
            });
          } else if (newStatus === 'failed' || newStatus === 'expired') {
            await supabaseRequest(`recharge?id=eq.${rechargeId}`, {
              method: 'PATCH',
              body: JSON.stringify({
                status: 'rejected',
                cryptomusStatus: newStatus,
              }),
            });

            return NextResponse.json({
              status: 'rejected',
              walletStatus: newStatus,
            });
          }
        }
      } catch (error) {
        console.error('[Cryptomus Status] Error checking wallet:', error);
        // 继续返回本地状态
      }
    }

    // 返回本地状态
    return NextResponse.json({
      status: rechargeRecord.status,
      amount: rechargeRecord.amount,
    });
  } catch (error) {
    console.error('[Cryptomus Status] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
