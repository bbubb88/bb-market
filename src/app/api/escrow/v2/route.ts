import { NextRequest, NextResponse } from 'next/server';

// Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ytsqawvrgzxgfluuadao.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

// 平台配置
const PLATFORM_WALLET = 'TXqY4K3QvJk9xLm2nP7rT8sUw5xYz6Gh'; // 平台收款地址 (TRC20)
const WITHDRAWAL_FEE_PERCENT = 5; // 提现手续费 5%

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
 * 资金托管 API - 完整流程
 * 
 * 支持的操作:
 * 1. deposit - 充值到冻结账户 (买家充值到平台)
 * 2. lock - 锁定资金用于订单支付
 * 3. release - 确认收货后放行资金给卖家
 * 4. refund - 取消订单时返还资金给买家
 * 5. withdraw - 提现 (从余额提取到钱包)
 * 6. status - 查询托管状态
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, orderId, amount, sellerId, orderIds, address, addressType } = body;

    if (!action) {
      return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 });
    }

    switch (action) {
      case 'deposit':
        return await handleDeposit(userId, amount, body);
      case 'lock':
        return await handleLock(userId, amount, orderId, orderIds);
      case 'release':
        return await handleRelease(orderId, sellerId);
      case 'refund':
        return await handleRefund(orderId);
      case 'withdraw':
        return await handleWithdraw(userId, amount, address, addressType);
      case 'withdrawStatus':
        return await handleWithdrawStatus(body.withdrawalId);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Escrow error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * ============================================
 * 1. 充值 (Deposit) - 买家充值到平台
 * 买家付款 → 第三方平台代收 → 进入冻结余额
 * ============================================
 */
async function handleDeposit(userId: string, amount: number, body: any) {
  if (!userId || !amount || amount <= 0) {
    return NextResponse.json({ error: 'Invalid userId or amount' }, { status: 400 });
  }

  // 获取或创建钱包
  let { status, data: wallets } = await supabaseRequest(`Wallet?userId=eq.${userId}&select=*`);

  let wallet;
  if (status !== 200 || !wallets || wallets.length === 0) {
    const { status: createStatus, data: newWallets } = await supabaseRequest('Wallet', {
      method: 'POST',
      body: JSON.stringify({ userId, balance: 0, frozen: 0, locked: 0 }),
    });
    if (createStatus >= 400) {
      return NextResponse.json({ error: 'Failed to create wallet' }, { status: 500 });
    }
    wallet = newWallets[0];
  } else {
    wallet = wallets[0];
  }

  // 更新冻结余额 (充值资金进入冻结状态作为托管)
  const currentFrozen = parseFloat(wallet.frozen || '0');
  const newFrozen = currentFrozen + amount;

  const { status: updateStatus } = await supabaseRequest(`Wallet?id=eq.${wallet.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ frozen: newFrozen, updatedAt: new Date().toISOString() }),
  });

  if (updateStatus >= 400) {
    return NextResponse.json({ error: 'Failed to update frozen balance' }, { status: 500 });
  }

  // 记录托管交易
  await supabaseRequest('EscrowTransaction', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      type: 'DEPOSIT',
      amount: amount,
      status: 'COMPLETED',
      description: `充值托管 - ${amount} USDT (TRC20)`,
      txHash: body.txHash || null,
      orderId: body.orderIds ? body.orderIds.join(',') : null,
      createdAt: new Date().toISOString(),
    }),
  });

  return NextResponse.json({
    success: true,
    action: 'deposit',
    frozen: newFrozen,
    message: `成功充值 ${amount} USDT 到托管账户`,
  });
}

/**
 * ============================================
 * 2. 锁定 (Lock) - 支付订单时锁定冻结资金
 * ============================================
 */
async function handleLock(userId: string, amount: number, orderId?: string, orderIds?: string[]) {
  if (!userId || !amount || amount <= 0) {
    return NextResponse.json({ error: 'Invalid userId or amount' }, { status: 400 });
  }

  const { status, data: wallets } = await supabaseRequest(`Wallet?userId=eq.${userId}&select=*`);

  if (status !== 200 || !wallets || wallets.length === 0) {
    return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
  }

  const wallet = wallets[0];
  const currentFrozen = parseFloat(wallet.frozen || '0');

  if (currentFrozen < amount) {
    return NextResponse.json({
      error: 'Insufficient frozen balance',
      currentFrozen,
      required: amount
    }, { status: 400 });
  }

  // 更新冻结余额和锁定余额
  const newFrozen = currentFrozen - amount;
  const currentLocked = parseFloat(wallet.locked || '0');
  const newLocked = currentLocked + amount;

  const { status: updateStatus } = await supabaseRequest(`Wallet?id=eq.${wallet.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      frozen: newFrozen,
      locked: newLocked,
      updatedAt: new Date().toISOString(),
    }),
  });

  if (updateStatus >= 400) {
    return NextResponse.json({ error: 'Failed to lock funds' }, { status: 500 });
  }

  // 创建锁定记录
  const targetOrderIds = orderId ? [orderId] : (orderIds || []);
  
  for (const oid of targetOrderIds) {
    await supabaseRequest('EscrowLock', {
      method: 'POST',
      body: JSON.stringify({
        orderId: oid,
        buyerId: userId,
        amount: amount,
        fee: 0,
        totalAmount: amount,
        status: 'LOCKED',
        createdAt: new Date().toISOString(),
      }),
    });
  }

  return NextResponse.json({
    success: true,
    action: 'lock',
    locked: newLocked,
    orderIds: targetOrderIds,
  });
}

/**
 * ============================================
 * 3. 放行 (Release) - 确认收货后转给卖家
 * 交易成功 → 余额转入卖家钱包账户
 * ============================================
 */
async function handleRelease(orderId: string, sellerId: string) {
  if (!orderId || !sellerId) {
    return NextResponse.json({ error: 'Missing orderId or sellerId' }, { status: 400 });
  }

  const { status: orderStatus, data: orders } = await supabaseRequest(`Order?id=eq.${orderId}&select=*`);

  if (orderStatus !== 200 || !orders || orders.length === 0) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const order = orders[0];
  const amount = parseFloat(order.price);
  const fee = parseFloat(order.fee || '0');
  const totalAmount = amount + fee;

  const { status: lockStatus, data: locks } = await supabaseRequest(
    `EscrowLock?orderId=eq.${orderId}&status=eq.LOCKED&select=*`
  );

  if (lockStatus !== 200 || !locks || locks.length === 0) {
    return NextResponse.json({ error: 'No escrow lock found for this order' }, { status: 404 });
  }

  const lock = locks[0];

  // 获取买家钱包
  const { status: buyerWalletStatus, data: buyerWallets } = await supabaseRequest(
    `Wallet?userId=eq.${order.buyerId}&select=*`
  );

  if (buyerWalletStatus !== 200 || !buyerWallets || buyerWallets.length === 0) {
    return NextResponse.json({ error: 'Buyer wallet not found' }, { status: 404 });
  }

  const buyerWallet = buyerWallets[0];
  const buyerLocked = parseFloat(buyerWallet.locked || '0');

  // 更新买家钱包 - 减少锁定金额
  await supabaseRequest(`Wallet?id=eq.${buyerWallet.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      locked: Math.max(0, buyerLocked - totalAmount),
      updatedAt: new Date().toISOString(),
    }),
  });

  // 获取或创建卖家钱包
  let { status: sellerWalletStatus, data: sellerWallets } = await supabaseRequest(
    `Wallet?userId=eq.${sellerId}&select=*`
  );

  let sellerWallet;
  if (sellerWalletStatus !== 200 || !sellerWallets || sellerWallets.length === 0) {
    const { status: createStatus, data: newWallets } = await supabaseRequest('Wallet', {
      method: 'POST',
      body: JSON.stringify({
        userId: sellerId,
        balance: amount, // 卖家收到商品价格
        frozen: 0,
        locked: 0,
      }),
    });
    if (createStatus >= 400) {
      return NextResponse.json({ error: 'Failed to create seller wallet' }, { status: 500 });
    }
    sellerWallet = newWallets[0];
  } else {
    sellerWallet = sellerWallets[0];
    const sellerBalance = parseFloat(sellerWallet.balance || '0');
    await supabaseRequest(`Wallet?id=eq.${sellerWallet.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        balance: sellerBalance + amount,
        updatedAt: new Date().toISOString(),
      }),
    });
  }

  // 更新锁定记录状态
  await supabaseRequest(`EscrowLock?id=eq.${lock.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'RELEASED', releasedAt: new Date().toISOString() }),
  });

  // 记录放行交易
  await supabaseRequest('EscrowTransaction', {
    method: 'POST',
    body: JSON.stringify({
      userId: sellerId,
      orderId: orderId,
      type: 'RELEASE',
      amount: amount,
      fee: fee,
      status: 'COMPLETED',
      description: `订单完成 - 放行 ${amount} USDT 给卖家`,
      createdAt: new Date().toISOString(),
    }),
  });

  // 记录手续费收入
  if (fee > 0) {
    await supabaseRequest('EscrowTransaction', {
      method: 'POST',
      body: JSON.stringify({
        userId: 'PLATFORM',
        orderId: orderId,
        type: 'FEE',
        amount: fee,
        status: 'COMPLETED',
        description: `交易手续费`,
        createdAt: new Date().toISOString(),
      }),
    });
  }

  return NextResponse.json({
    success: true,
    action: 'release',
    amount: amount,
    fee: fee,
    sellerId: sellerId,
    message: `成功放行 ${amount} USDT 给卖家`,
  });
}

/**
 * ============================================
 * 4. 退款 (Refund) - 取消订单时返还给买家
 * 资金由第三方原路径退回（全额退款，平台不扣钱）
 * ============================================
 */
async function handleRefund(orderId: string) {
  if (!orderId) {
    return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
  }

  const { status: orderStatus, data: orders } = await supabaseRequest(`Order?id=eq.${orderId}&select=*`);

  if (orderStatus !== 200 || !orders || orders.length === 0) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const order = orders[0];
  const amount = parseFloat(order.price);
  const fee = parseFloat(order.fee || '0');
  const totalAmount = amount + fee;

  const { status: lockStatus, data: locks } = await supabaseRequest(
    `EscrowLock?orderId=eq.${orderId}&status=eq.LOCKED&select=*`
  );

  if (lockStatus !== 200 || !locks || locks.length === 0) {
    return NextResponse.json({ error: 'No escrow lock found for this order' }, { status: 404 });
  }

  const lock = locks[0];

  const { status: buyerWalletStatus, data: buyerWallets } = await supabaseRequest(
    `Wallet?userId=eq.${order.buyerId}&select=*`
  );

  if (buyerWalletStatus !== 200 || !buyerWallets || buyerWallets.length === 0) {
    return NextResponse.json({ error: 'Buyer wallet not found' }, { status: 404 });
  }

  const buyerWallet = buyerWallets[0];
  const buyerLocked = parseFloat(buyerWallet.locked || '0');
  const buyerFrozen = parseFloat(buyerWallet.frozen || '0');

  // 将锁定金额转回冻结余额（全额返还，平台不扣钱）
  await supabaseRequest(`Wallet?id=eq.${buyerWallet.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      locked: Math.max(0, buyerLocked - totalAmount),
      frozen: buyerFrozen + totalAmount,
      updatedAt: new Date().toISOString(),
    }),
  });

  // 更新锁定记录状态
  await supabaseRequest(`EscrowLock?id=eq.${lock.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'REFUNDED', releasedAt: new Date().toISOString() }),
  });

  // 记录返还交易
  await supabaseRequest('EscrowTransaction', {
    method: 'POST',
    body: JSON.stringify({
      userId: order.buyerId,
      orderId: orderId,
      type: 'REFUND',
      amount: totalAmount,
      status: 'COMPLETED',
      description: `订单取消 - 全额返还 ${totalAmount} USDT (平台不扣费)`,
      createdAt: new Date().toISOString(),
    }),
  });

  return NextResponse.json({
    success: true,
    action: 'refund',
    amount: totalAmount,
    buyerId: order.buyerId,
    message: `成功全额返还 ${totalAmount} USDT 给买家`,
  });
}

/**
 * ============================================
 * 5. 提现 (Withdraw) - 从余额提取到钱包
 * 买家提现 → 第三方平台直接发放到买家账户
 * 提现收取 5% 手续费
 * ============================================
 */
async function handleWithdraw(userId: string, amount: number, address: string, addressType: string = 'TRC20') {
  if (!userId || !amount || !address) {
    return NextResponse.json({ error: 'Missing required fields: userId, amount, address' }, { status: 400 });
  }

  if (amount <= 0) {
    return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 });
  }

  // 验证地址格式 (TRC20)
  if (addressType === 'TRC20' && !address.startsWith('T')) {
    return NextResponse.json({ error: 'Invalid TRC20 address format' }, { status: 400 });
  }

  // 获取用户钱包
  const { status, data: wallets } = await supabaseRequest(`Wallet?userId=eq.${userId}&select=*`);

  if (status !== 200 || !wallets || wallets.length === 0) {
    return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
  }

  const wallet = wallets[0];
  const currentBalance = parseFloat(wallet.balance || '0');

  // 检查余额是否充足
  if (currentBalance < amount) {
    return NextResponse.json({
      error: 'Insufficient balance',
      balance: currentBalance,
      required: amount
    }, { status: 400 });
  }

  // 计算手续费 (5%)
  const fee = Math.round(amount * WITHDRAWAL_FEE_PERCENT / 100 * 100) / 100;
  const netAmount = Math.round((amount - fee) * 100) / 100;

  // 创建提现记录
  const { status: createStatus, data: withdrawals } = await supabaseRequest('Withdrawal', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      amount,
      fee,
      netAmount,
      address,
      addressType,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    }),
  });

  if (createStatus >= 400) {
    return NextResponse.json({ error: 'Failed to create withdrawal request' }, { status: 500 });
  }

  const withdrawal = withdrawals[0];

  // 扣除用户余额
  const newBalance = currentBalance - amount;
  
  const { status: updateStatus } = await supabaseRequest(`Wallet?id=eq.${wallet.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      balance: newBalance,
      updatedAt: new Date().toISOString(),
    }),
  });

  if (updateStatus >= 400) {
    // 回滚提现记录
    await supabaseRequest(`Withdrawal?id=eq.${withdrawal.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'FAILED', errorMessage: 'Failed to update wallet balance' }),
    });
    return NextResponse.json({ error: 'Failed to process withdrawal' }, { status: 500 });
  }

  // 记录交易
  await supabaseRequest('EscrowTransaction', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      type: 'WITHDRAWAL',
      amount: -amount,
      fee: fee,
      status: 'COMPLETED',
      description: `提现 ${amount} USDT 到 ${address} (手续费 ${fee} USDT, 到账 ${netAmount} USDT)`,
      createdAt: new Date().toISOString(),
    }),
  });

  // 记录手续费收入
  await supabaseRequest('EscrowTransaction', {
    method: 'POST',
    body: JSON.stringify({
      userId: 'PLATFORM',
      type: 'WITHDRAWAL_FEE',
      amount: fee,
      status: 'COMPLETED',
      description: `提现手续费收入 ${fee} USDT`,
      createdAt: new Date().toISOString(),
    }),
  });

  // TODO: 这里应该调用第三方支付API实际打款
  // 在生产环境中，需要调用 TRC20 支付接口
  // const paymentResult = await processTRC20Transfer(address, netAmount);
  
  // 模拟处理完成
  await supabaseRequest(`Withdrawal?id=eq.${withdrawal.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'PROCESSING',
      processedAt: new Date().toISOString(),
    }),
  });

  return NextResponse.json({
    success: true,
    action: 'withdraw',
    withdrawalId: withdrawal.id,
    amount,
    fee,
    netAmount,
    address,
    message: `提现申请已提交，扣除手续费 ${fee} USDT，实际到账 ${netAmount} USDT`,
  });
}

/**
 * 查询提现状态
 */
async function handleWithdrawStatus(withdrawalId: string) {
  if (!withdrawalId) {
    return NextResponse.json({ error: 'Missing withdrawalId' }, { status: 400 });
  }

  const { status, data } = await supabaseRequest(`Withdrawal?id=eq.${withdrawalId}&select=*`);

  if (status !== 200 || !data || data.length === 0) {
    return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 });
  }

  return NextResponse.json(data[0]);
}

/**
 * ============================================
 * GET - 查询状态
 * ============================================
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const orderId = searchParams.get('orderId');
  const withdrawalId = searchParams.get('withdrawalId');

  try {
    if (withdrawalId) {
      const { status, data } = await supabaseRequest(`Withdrawal?id=eq.${withdrawalId}&select=*`);
      if (status !== 200) {
        return NextResponse.json({ error: 'Failed to query withdrawal' }, { status: 500 });
      }
      return NextResponse.json(data?.[0] || null);
    }

    if (orderId) {
      const { status, data: locks } = await supabaseRequest(`EscrowLock?orderId=eq.${orderId}&select=*`);
      if (status !== 200) {
        return NextResponse.json({ error: 'Failed to query escrow status' }, { status: 500 });
      }
      return NextResponse.json({ orderId, locks: locks || [] });
    }

    if (userId) {
      const { status, data: wallets } = await supabaseRequest(`Wallet?userId=eq.${userId}&select=*`);

      if (status !== 200 || !wallets || wallets.length === 0) {
        return NextResponse.json({ userId, balance: 0, frozen: 0, locked: 0 });
      }

      const wallet = wallets[0];

      // 获取交易记录
      const { data: transactions } = await supabaseRequest(
        `EscrowTransaction?userId=eq.${userId}&order=createdAt.desc&limit=20`
      );

      // 获取提现记录
      const { data: withdrawals } = await supabaseRequest(
        `Withdrawal?userId=eq.${userId}&order=createdAt.desc&limit=10`
      );

      return NextResponse.json({
        userId,
        balance: wallet.balance || 0,
        frozen: wallet.frozen || 0,
        locked: wallet.locked || 0,
        transactions: transactions || [],
        withdrawals: withdrawals || [],
        config: {
          withdrawalFeePercent: WITHDRAWAL_FEE_PERCENT,
          platformWallet: PLATFORM_WALLET,
        },
      });
    }

    return NextResponse.json({ error: 'Missing userId, orderId, or withdrawalId' }, { status: 400 });

  } catch (error) {
    console.error('Get escrow status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
