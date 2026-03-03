/**
 * Cryptomus API Service
 * 文档: https://doc.cryptomus.com/
 * NPM: https://www.npmjs.com/package/cryptomus-js
 */

import { CryptomusClient } from 'cryptomus-js';

// 环境变量
const getMerchantId = (): string | undefined => process.env.CRYPTOMUS_MERCHANT_ID;
const getPaymentKey = (): string | undefined => process.env.CRYPTOMUS_PAYMENT_KEY;
const getPayoutKey = (): string | undefined => process.env.CRYPTOMUS_PAYOUT_KEY;

// 获取站点 URL
const getSiteUrl = (): string => process.env.NEXT_PUBLIC_SITE_URL || 'https://bb-market-next.vercel.app';

/**
 * 创建 Cryptomus 客户端
 */
export function getCryptomusClient(): CryptomusClient | null {
  const merchantId = getMerchantId();
  const paymentKey = getPaymentKey();
  const payoutKey = getPayoutKey();

  if (!merchantId || !paymentKey) {
    console.error('[Cryptomus] API keys not configured');
    return null;
  }

  try {
    return new CryptomusClient({
      merchantId: merchantId,
      paymentKey: paymentKey,
      payoutKey: payoutKey || undefined,
    } as any);
  } catch (error) {
    console.error('[Cryptomus] Failed to create client:', error);
    return null;
  }
}

export interface CreatePaymentParams {
  amount: string;
  currency?: string;
  order_id?: string;
  url_callback?: string;
  url_return?: string;
  is_payment_multiple?: boolean;
  lifetime?: number;
  network?: string;
}

export interface CryptomusPayment {
  uuid: string;
  order_id: string;
  amount: string;
  currency: string;
  network?: string;
  address?: string;
  url?: string;
  status: string;
  created_at: string;
  expired_at?: string;
}

export interface CryptomusWallet {
  uuid: string;
  wallet_uuid: string;
  address: string;
  currency: string;
  network: string;
  status: string;
  order_id: string;
  created_at: string;
}

/**
 * 创建支付 (生成支付页面链接)
 */
export async function createPayment(params: CreatePaymentParams): Promise<CryptomusPayment | null> {
  const client = getCryptomusClient();
  if (!client) {
    console.error('[Cryptomus] Client not available');
    return null;
  }

  try {
    const payment = await client.payments.create({
      amount: params.amount,
      currency: params.currency || 'USDT',
      order_id: params.order_id || '',
      url_callback: params.url_callback || `${getSiteUrl()}/api/recharge/cryptomus/ipn`,
      url_return: params.url_return || `${getSiteUrl()}/dashboard?tab=wallet`,
      is_payment_multiple: params.is_payment_multiple || false,
      lifetime: params.lifetime || 3600, // 默认1小时
    } as any);

    console.log('[Cryptomus] Payment created:', payment);
    return payment as unknown as CryptomusPayment;
  } catch (error) {
    console.error('[Cryptomus] Create payment error:', error);
    return null;
  }
}

/**
 * 创建静态钱包 (用户直接转账到钱包地址)
 */
export async function createWallet(orderId: string, currency = 'USDT', network = 'TRX'): Promise<CryptomusWallet | null> {
  const client = getCryptomusClient();
  if (!client) {
    console.error('[Cryptomus] Client not available');
    return null;
  }

  try {
    const wallet = await client.payments.createWallet({
      currency,
      network,
      order_id: orderId,
      url_callback: `${getSiteUrl()}/api/recharge/cryptomus/ipn`,
    });

    console.log('[Cryptomus] Wallet created:', wallet);
    return wallet as unknown as CryptomusWallet;
  } catch (error) {
    console.error('[Cryptomus] Create wallet error:', error);
    return null;
  }
}

/**
 * 查询支付状态
 */
export async function getPaymentStatus(uuid: string, orderId?: string): Promise<any | null> {
  const client = getCryptomusClient();
  if (!client) {
    return null;
  }

  try {
    const info = await client.payments.getInfo({ uuid, order_id: orderId || `order_${uuid}` });
    return info;
  } catch (error) {
    console.error('[Cryptomus] Get payment status error:', error);
    return null;
  }
}

/**
 * 查询钱包状态
 */
export async function getWalletStatus(walletUuid: string): Promise<any | null> {
  const client = getCryptomusClient();
  if (!client) {
    return null;
  }

  try {
    // 使用 getInfo 获取钱包信息，需要同时提供 uuid 和 order_id
    const info = await (client.payments.getInfo as any)({ 
      uuid: walletUuid,
      order_id: `wallet_${walletUuid}`
    });
    return info;
  } catch (error) {
    console.error('[Cryptomus] Get wallet status error:', error);
    return null;
  }
}

/**
 * 验证 Webhook 签名
 */
export async function verifyWebhookSignature(ipAddress: string, request: any): Promise<boolean> {
  const client = getCryptomusClient();
  if (!client) {
    return false;
  }

  try {
    const result = await client.payments.verifyWebhookSignature({
      ipAddress,
      request,
    });
    return result === true;
  } catch (error) {
    console.error('[Cryptomus] Verify webhook error:', error);
    return false;
  }
}

/**
 * 获取支付服务列表
 */
export async function listPaymentServices(): Promise<any> {
  const client = getCryptomusClient();
  if (!client) {
    return null;
  }

  try {
    const services = await client.payments.listServices();
    return services;
  } catch (error) {
    console.error('[Cryptomus] List services error:', error);
    return null;
  }
}

/**
 * 检查支付是否完成
 */
export function isPaymentCompleted(status: string): boolean {
  return status === 'paid' || status === 'completed';
}

/**
 * 检查支付是否失败
 */
export function isPaymentFailed(status: string): boolean {
  return status === 'failed' || status === 'cancel' || status === 'expired';
}
