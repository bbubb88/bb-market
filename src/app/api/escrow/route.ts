import { NextRequest, NextResponse } from 'next/server';

// 使用 Supabase Admin
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ytsqawvrgzxgfluuadao.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

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

/**
 * 资金托管 API v2
 * 
 * 核心逻辑:
 * 1. 买家充值 -> 资金由第三方托管（不在平台账户）
 * 2. 交易成功 -> 资金转入卖家钱包
 * 3. 退款 -> 资金原路退回给买家（不退平台）
 * 4. 提现 -> 第三方平台直接发放（收取5%佣金）
 */

const WITHDRAWAL_FEE_RATE = 0.05; // 5% 提现手续费

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, orderId, amount, sellerId, orderIds, withdrawAddress } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Missing action parameter' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'deposit':
        // 充值到托管账户（资金由第三方托管，不进入平台）
        return await handleEscrowDeposit(userId, amount, body);
      case 'create_escrow':
        // 创建托管订单（锁定买家资金）
        return await handleCreateEscrow(userId, amount, orderId, orderIds);
      case 'release':
        // 确认收货 - 资金释放给卖家
        return await handleReleaseEscrow(orderId, sellerId);
      case 'refund':
        // 退款 - 资金原路退回给买家
        return await handleRefundEscrow(orderId);
      case 'withdraw':
        // 提现 - 资金通过第三方平台发放
        return await handleWithdraw(userId, amount, withdrawAddress);
      case 'confirm_deposit':
        // 管理员确认充值到账（资金进入托管）
        return await handleConfirmDeposit(body);
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Escrow error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * 处理充值到托管账户
 * 买家转账到平台地址，管理员确认后资金进入托管状态
 */
async function handleEscrowDeposit(userId: string, amount: number, body: any) {
  if (!userId || !amount || amount <= 0) {
    return NextResponse.json(
      { error: 'Invalid userId or amount' },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();

  // 创建托管充值记录
  const { status, data } = await supabaseRequest('EscrowDeposit', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      amount: amount,
      status: 'PENDING', // PENDING, CONFIRMED, FAILED
      txHash: body.txHash || null,
      orderId: body.orderIds ? body.orderIds.join(',') : null,
      description: `USDT 托管充值 - ${amount} USDT`,
      createdAt: now,
    }),
  });

  if (status >= 400) {
    return NextResponse.json(
      { error: 'Failed to create escrow deposit' },
      { status: 500 }
    );
  }

  const deposit = Array.isArray(data) ? data[0] : data;

  return NextResponse.json({
    success: true,
    action: 'deposit',
    depositId: deposit.id,
    status: 'PENDING',
    message: 'Deposit pending confirmation',
  });
}

/**
 * 管理员确认充值到账
 * 资金进入托管状态，但不在平台账户中
 */
async function handleConfirmDeposit(body: any) {
  const { depositId, action } = body;

  if (!depositId) {
    return NextResponse.json(
      { error: 'Missing depositId' },
      { status: 400 }
    );
  }

  // 获取充值记录
  const { status: getStatus, data: deposits } = await supabaseRequest(
    `EscrowDeposit?id=eq.${depositId}&select=*`
  );

  if (getStatus >= 400 || !deposits || deposits.length === 0) {
    return NextResponse.json(
      { error: 'Deposit not found' },
      { status: 404 }
    );
  }

  const deposit = deposits[0];

  if (action === 'approve') {
    // 更新状态为已确认
    await supabaseRequest(`EscrowDeposit?id=eq.${depositId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'CONFIRMED',
        confirmedAt: new Date().toISOString(),
      }),
    });

    // 更新用户的托管余额（资金在第三方托管，不在平台账户）
    // 这里记录的是"可用的托管资金"而不是实际余额
    const { status: walletStatus, data: wallets } = await supabaseRequest(
      `Wallet?userId=eq.${deposit.userId}&select=*`
    );

    let wallet;
    if (walletStatus !== 200 || !wallets || wallets.length === 0) {
      const { data: newWallets } = await supabaseRequest('Wallet', {
        method: 'POST',
        body: JSON.stringify({
          userId: deposit.userId,
          balance: 0,
          escrowBalance: deposit.amount, // 托管余额
        }),
      });
      wallet = newWallets[0];
    } else {
      wallet = wallets[0];
      const currentEscrow = parseFloat(wallet.escrowBalance || '0');
      await supabaseRequest(`Wallet?id=eq.${wallet.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          escrowBalance: currentEscrow + deposit.amount,
        }),
      });
    }

    // 记录交易
    await supabaseRequest('EscrowTransaction', {
      method: 'POST',
      body: JSON.stringify({
        userId: deposit.userId,
        type: 'DEPOSIT',
        amount: deposit.amount,
        status: 'COMPLETED',
        description: `托管充值确认 - ${deposit.amount} USDT`,
        createdAt: new Date().toISOString(),
      }),
    });

    return NextResponse.json({
      success: true,
      message: 'Deposit confirmed, funds in escrow',
      escrowBalance: deposit.amount,
    });

  } else if (action === 'reject') {
    await supabaseRequest(`EscrowDeposit?id=eq.${depositId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'FAILED',
        confirmedAt: new Date().toISOString(),
      }),
    });

    return NextResponse.json({
      success: true,
      message: 'Deposit rejected',
    });
  }

  return NextResponse.json(
    { error: 'Invalid action' },
    { status: 400 }
  );
}

/**
 * 创建托管订单（锁定买家资金）
 */
async function handleCreateEscrow(userId: string, amount: number, orderId?: string, orderIds?: string[]) {
  if (!userId || !amount || amount <= 0) {
    return NextResponse.json(
      { error: 'Invalid userId or amount' },
      { status: 400 }
    );
  }

  // 获取用户钱包
  const { status: walletStatus, data: wallets } = await supabaseRequest(
    `Wallet?userId=eq.${userId}&select=*`
  );

  if (walletStatus !== 200 || !wallets || wallets.length === 0) {
    return NextResponse.json(
      { error: 'Wallet not found' },
      { status: 404 }
    );
  }

  const wallet = wallets[0];
  const escrowBalance = parseFloat(wallet.escrowBalance || '0');

  // 验证托管余额是否充足
  if (escrowBalance < amount) {
    return NextResponse.json(
      { 
        error: 'Insufficient escrow balance', 
        escrowBalance, 
        required: amount,
        tip: 'Please deposit USDT to escrow first'
      },
      { status: 400 }
    );
  }

  // 锁定资金
  const newEscrowBalance = escrowBalance - amount;
  const locked = parseFloat(wallet.locked || '0');

  await supabaseRequest(`Wallet?id=eq.${wallet.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      escrowBalance: newEscrowBalance,
      locked: locked + amount,
      updatedAt: new Date().toISOString(),
    }),
  });

  // 为每个订单创建托管锁定记录
  const targetOrderIds = orderId ? [orderId] : (orderIds || []);
  const now = new Date().toISOString();

  for (const oid of targetOrderIds) {
    // 获取订单金额
    const { data: orders } = await supabaseRequest(`Order?id=eq.${oid}&select=*`);
    
    if (orders && orders.length > 0) {
      const order = orders[0];
      const orderTotal = order.price + (order.fee || 0);

      await supabaseRequest('EscrowLock', {
        method: 'POST',
        body: JSON.stringify({
          orderId: oid,
          buyerId: userId,
          amount: order.price,
          fee: order.fee || 0,
          totalAmount: orderTotal,
          status: 'LOCKED',
          createdAt: now,
        }),
      });

      // 记录锁定交易
      await supabaseRequest('EscrowTransaction', {
        method: 'POST',
        body: JSON.stringify({
          userId: userId,
          orderId: oid,
          type: 'LOCK',
          amount: orderTotal,
          status: 'COMPLETED',
          description: `订单支付锁定 - ${orderTotal} USDT`,
          createdAt: now,
        }),
      });
    }
  }

  return NextResponse.json({
    success: true,
    action: 'create_escrow',
    escrowBalance: newEscrowBalance,
    locked: locked + amount,
    orderIds: targetOrderIds,
  });
}

/**
 * 确认收货 - 释放资金给卖家
 */
async function handleReleaseEscrow(orderId: string, sellerId: string) {
  if (!orderId || !sellerId) {
    return NextResponse.json(
      { error: 'Missing orderId or sellerId' },
      { status: 400 }
    );
  }

  // 获取订单信息
  const { status: orderStatus, data: orders } = await supabaseRequest(
    `Order?id=eq.${orderId}&select=*`
  );

  if (orderStatus !== 200 || !orders || orders.length === 0) {
    return NextResponse.json(
      { error: 'Order not found' },
      { status: 404 }
    );
  }

  const order = orders[0];
  const amount = parseFloat(order.price);
  const fee = parseFloat(order.fee || '0');
  const totalAmount = amount + fee;

  // 获取托管锁定记录
  const { status: lockStatus, data: locks } = await supabaseRequest(
    `EscrowLock?orderId=eq.${orderId}&status=eq.LOCKED&select=*`
  );

  if (lockStatus !== 200 || !locks || locks.length === 0) {
    return NextResponse.json(
      { error: 'No escrow lock found for this order' },
      { status: 404 }
    );
  }

  const lock = locks[0];

  // 获取买家钱包，减少锁定金额
  const { status: buyerWalletStatus, data: buyerWallets } = await supabaseRequest(
    `Wallet?userId=eq.${order.buyerId}&select=*`
  );

  if (buyerWalletStatus === 200 && buyerWallets && buyerWallets.length > 0) {
    const buyerWallet = buyerWallets[0];
    const buyerLocked = parseFloat(buyerWallet.locked || '0');

    await supabaseRequest(`Wallet?id=eq.${buyerWallet.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        locked: Math.max(0, buyerLocked - totalAmount),
        updatedAt: new Date().toISOString(),
      }),
    });
  }

  // 更新锁定记录状态
  await supabaseRequest(`EscrowLock?id=eq.${lock.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'RELEASED',
      releasedAt: new Date().toISOString(),
    }),
  });

  // 获取或创建卖家钱包，转入资金
  let { status: sellerWalletStatus, data: sellerWallets } = await supabaseRequest(
    `Wallet?userId=eq.${sellerId}&select=*`
  );

  const now = new Date().toISOString();

  if (sellerWalletStatus !== 200 || !sellerWallets || sellerWallets.length === 0) {
    // 创建卖家钱包，资金到账
    await supabaseRequest('Wallet', {
      method: 'POST',
      body: JSON.stringify({
        userId: sellerId,
        balance: amount, // 卖家收到商品价格（不含手续费）
        escrowBalance: 0,
        locked: 0,
      }),
    });
  } else {
    const sellerWallet = sellerWallets[0];
    const sellerBalance = parseFloat(sellerWallet.balance || '0');

    await supabaseRequest(`Wallet?id=eq.${sellerWallet.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        balance: sellerBalance + amount,
        updatedAt: now,
      }),
    });
  }

  // 记录资金释放交易
  await supabaseRequest('EscrowTransaction', {
    method: 'POST',
    body: JSON.stringify({
      userId: sellerId,
      orderId: orderId,
      type: 'RELEASE',
      amount: amount,
      fee: fee,
      status: 'COMPLETED',
      description: `订单完成 - 收入 ${amount} USDT`,
      createdAt: now,
    }),
  });

  // 记录平台手续费
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
        createdAt: now,
      }),
    });
  }

  return NextResponse.json({
    success: true,
    action: 'release',
    amount: amount,
    fee: fee,
    sellerId: sellerId,
    message: 'Funds released to seller',
  });
}

/**
 * 退款 - 资金原路退回给买家
 */
async function handleRefundEscrow(orderId: string) {
  if (!orderId) {
    return NextResponse.json(
      { error: 'Missing orderId' },
      { status: 400 }
    );
  }

  // 获取订单信息
  const { status: orderStatus, data: orders } = await supabaseRequest(
    `Order?id=eq.${orderId}&select=*`
  );

  if (orderStatus !== 200 || !orders || orders.length === 0) {
    return NextResponse.json(
      { error: 'Order not found' },
      { status: 404 }
    );
  }

  const order = orders[0];
  const amount = parseFloat(order.price);
  const fee = parseFloat(order.fee || '0');
  const totalAmount = amount + fee;

  // 获取托管锁定记录
  const { status: lockStatus, data: locks } = await supabaseRequest(
    `EscrowLock?orderId=eq.${orderId}&status=eq.LOCKED&select=*`
  );

  if (lockStatus !== 200 || !locks || locks.length === 0) {
    return NextResponse.json(
      { error: 'No escrow lock found for this order' },
      { status: 404 }
    );
  }

  const lock = locks[0];

  // 获取买家钱包
  const { status: buyerWalletStatus, data: buyerWallets } = await supabaseRequest(
    `Wallet?userId=eq.${order.buyerId}&select=*`
  );

  const now = new Date().toISOString();

  if (buyerWalletStatus === 200 && buyerWallets && buyerWallets.length > 0) {
    const buyerWallet = buyerWallets[0];
    const buyerLocked = parseFloat(buyerWallet.locked || '0');
    const buyerEscrow = parseFloat(buyerWallet.escrowBalance || '0');

    // 锁定金额转回托管余额（原路返回）
    await supabaseRequest(`Wallet?id=eq.${buyerWallet.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        locked: Math.max(0, buyerLocked - totalAmount),
        escrowBalance: buyerEscrow + totalAmount,
        updatedAt: now,
      }),
    });
  }

  // 更新锁定记录状态
  await supabaseRequest(`EscrowLock?id=eq.${lock.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'REFUNDED',
      releasedAt: now,
    }),
  });

  // 记录退款交易
  await supabaseRequest('EscrowTransaction', {
    method: 'POST',
    body: JSON.stringify({
      userId: order.buyerId,
      orderId: orderId,
      type: 'REFUND',
      amount: totalAmount,
      status: 'COMPLETED',
      description: `订单取消 - 退款 ${totalAmount} USDT（原路返回）`,
      createdAt: now,
    }),
  });

  return NextResponse.json({
    success: true,
    action: 'refund',
    amount: totalAmount,
    buyerId: order.buyerId,
    message: 'Funds refunded to buyer (original path)',
  });
}

/**
 * 提现 - 资金通过第三方平台发放（收取5%佣金）
 */
async function handleWithdraw(userId: string, amount: number, withdrawAddress: string) {
  if (!userId || !amount || amount <= 0 || !withdrawAddress) {
    return NextResponse.json(
      { error: 'Invalid parameters' },
      { status: 400 }
    );
  }

  // 获取用户钱包
  const { status: walletStatus, data: wallets } = await supabaseRequest(
    `Wallet?userId=eq.${userId}&select=*`
  );

  if (walletStatus !== 200 || !wallets || wallets.length === 0) {
    return NextResponse.json(
      { error: 'Wallet not found' },
      { status: 404 }
    );
  }

  const wallet = wallets[0];
  const balance = parseFloat(wallet.balance || '0');

  // 验证余额
  if (balance < amount) {
    return NextResponse.json(
      { error: 'Insufficient balance', balance, required: amount },
      { status: 400 }
    );
  }

  // 计算手续费和实际到账金额
  const fee = Math.round(amount * WITHDRAWAL_FEE_RATE * 100) / 100;
  const actualAmount = amount - fee;

  const now = new Date().toISOString();

  // 创建提现记录
  const { status: withdrawStatus, data: withdrawData } = await supabaseRequest('Withdrawal', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      amount: amount,
      fee: fee,
      actualAmount: actualAmount,
      address: withdrawAddress,
      status: 'PENDING', // PENDING, PROCESSING, COMPLETED, FAILED
      createdAt: now,
    }),
  });

  if (withdrawStatus >= 400) {
    return NextResponse.json(
      { error: 'Failed to create withdrawal request' },
      { status: 500 }
    );
  }

  const withdrawal = Array.isArray(withdrawData) ? withdrawData[0] : withdrawData;

  // 冻结余额（等待第三方平台处理）
  await supabaseRequest(`Wallet?id=eq.${wallet.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      balance: balance - amount,
      locked: (wallet.locked || 0) + amount,
      updatedAt: now,
    }),
  });

  // 记录交易
  await supabaseRequest('EscrowTransaction', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      type: 'WITHDRAW',
      amount: -amount,
      fee: fee,
      status: 'PENDING',
      description: `提现申请 - ${amount} USDT（手续费 ${fee} USDT，实际到账 ${actualAmount} USDT）`,
      createdAt: now,
    }),
  });

  return NextResponse.json({
    success: true,
    action: 'withdraw',
    withdrawalId: withdrawal.id,
    amount: amount,
    fee: fee,
    actualAmount: actualAmount,
    address: withdrawAddress,
    status: 'PENDING',
    message: 'Withdrawal request submitted, pending processing',
  });
}

/**
 * 管理员确认提现（实际打款）
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { withdrawalId, action, txHash } = body;

    if (!withdrawalId || !action) {
      return NextResponse.json(
        { error: 'Missing withdrawalId or action' },
        { status: 400 }
      );
    }

    // 获取提现记录
    const { status: getStatus, data: withdrawals } = await supabaseRequest(
      `Withdrawal?id=eq.${withdrawalId}&select=*`
    );

    if (getStatus >= 400 || !withdrawals || withdrawals.length === 0) {
      return NextResponse.json(
        { error: 'Withdrawal not found' },
        { status: 404 }
      );
    }

    const withdrawal = withdrawals[0];

    if (action === 'complete') {
      // 完成提现
      await supabaseRequest(`Withdrawal?id=eq.${withdrawalId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'COMPLETED',
          txHash: txHash || null,
          completedAt: new Date().toISOString(),
        }),
      });

      // 减少锁定金额
      const { data: wallets } = await supabaseRequest(
        `Wallet?userId=eq.${withdrawal.userId}&select=*`
      );

      if (wallets && wallets.length > 0) {
        const wallet = wallets[0];
        const locked = parseFloat(wallet.locked || '0');

        await supabaseRequest(`Wallet?id=eq.${wallet.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            locked: Math.max(0, locked - withdrawal.amount),
          }),
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Withdrawal completed',
      });

    } else if (action === 'reject') {
      // 拒绝提现，返还余额
      const { data: wallets } = await supabaseRequest(
        `Wallet?userId=eq.${withdrawal.userId}&select=*`
      );

      if (wallets && wallets.length > 0) {
        const wallet = wallets[0];
        const balance = parseFloat(wallet.balance || '0');
        const locked = parseFloat(wallet.locked || '0');

        await supabaseRequest(`Wallet?id=eq.${wallet.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            balance: balance + withdrawal.amount,
            locked: Math.max(0, locked - withdrawal.amount),
          }),
        });
      }

      await supabaseRequest(`Withdrawal?id=eq.${withdrawalId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'FAILED',
          completedAt: new Date().toISOString(),
        }),
      });

      return NextResponse.json({
        success: true,
        message: 'Withdrawal rejected, balance refunded',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Withdraw confirm error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET - 查询托管状态
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const orderId = searchParams.get('orderId');
  const type = searchParams.get('type'); // deposit, withdrawal, escrow

  try {
    if (type === 'withdrawal' && userId) {
      // 查询用户的提现记录
      const { status, data } = await supabaseRequest(
        `Withdrawal?userId=eq.${userId}&order=createdAt.desc&limit=20`
      );
      
      return NextResponse.json({
        withdrawals: data || [],
      });
    }

    if (type === 'deposit' && userId) {
      // 查询用户的充值记录
      const { status, data } = await supabaseRequest(
        `EscrowDeposit?userId=eq.${userId}&order=createdAt.desc&limit=20`
      );
      
      return NextResponse.json({
        deposits: data || [],
      });
    }

    if (orderId) {
      // 查询订单的托管状态
      const { status, data: locks } = await supabaseRequest(
        `EscrowLock?orderId=eq.${orderId}&select=*`
      );

      return NextResponse.json({
        orderId,
        locks: locks || [],
      });
    }

    if (userId) {
      // 查询用户的钱包状态
      const { status, data: wallets } = await supabaseRequest(
        `Wallet?userId=eq.${userId}&select=*`
      );

      if (status !== 200 || !wallets || wallets.length === 0) {
        return NextResponse.json({
          userId,
          balance: 0,
          escrowBalance: 0,
          locked: 0,
        });
      }

      const wallet = wallets[0];

      // 获取交易记录
      const { data: transactions } = await supabaseRequest(
        `EscrowTransaction?userId=eq.${userId}&order=createdAt.desc&limit=20`
      );

      return NextResponse.json({
        userId,
        balance: wallet.balance || 0,
        escrowBalance: wallet.escrowBalance || 0,
        locked: wallet.locked || 0,
        transactions: transactions || [],
      });
    }

    return NextResponse.json(
      { error: 'Missing userId, orderId, or type' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Get escrow status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
