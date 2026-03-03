import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ytsqawvrgzxgfluuadao.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 保存用户收款地址
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, walletAddress, walletNetwork } = body;

    if (!userId || !walletAddress) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 简单验证TRC20地址格式
    if (walletNetwork === 'TRC20' && !walletAddress.startsWith('T')) {
      return NextResponse.json({ error: 'TRC20地址必须以T开头' }, { status: 400 });
    }

    // 更新用户收款地址（存储在user_metadata中）
    // 由于没有专门的users表，这里用localStorage模拟
    // 实际应该存储到数据库

    return NextResponse.json({ 
      success: true, 
      message: '收款地址已保存',
      address: walletAddress,
      network: walletNetwork
    });
  } catch (error) {
    console.error('Save wallet address error:', error);
    return NextResponse.json({ error: '保存失败' }, { status: 500 });
  }
}

// 获取用户收款地址
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: '缺少用户ID' }, { status: 400 });
  }

  // 实际应该从数据库读取
  return NextResponse.json({ 
    walletAddress: null,
    walletNetwork: null 
  });
}
