/**
 * NowPayments API Service
 * 文档: https://nowpayments.io/api
 */

const NOWPAYMENTS_API_URL = 'https://api.nowpayments.io/v1';

// 环境变量中配置
const getApiKey = () => process.env.NOWPAYMENTS_API_KEY;
const getIpnSecret = () => process.env.NOWPAYMENTS_IPN_SECRET;

export interface CreatePaymentParams {
  price_amount: number;
  price_currency: string;
  pay_currency?: string;
  order_id?: string;
  order_description?: string;
  ipn_callback_url?: string;
  payout_address?: string;
  payout_currency?: string;
}

export interface PaymentStatus {
  id: number;
  order_id: string;
  order_description: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  created_at: string;
  updated_at: string;
  status: 'waiting' | 'confirming' | 'confirmed' | 'finished' | 'failed' | 'refunded';
  timeout: number;
  pay_address: string;
  'payer-pay-address'?: string;
  payment_status?: string;
  actual_paid_amount?: number;
  payment_type?: string;
}

/**
 * 创建支付请求
 */
export async function createPayment(params: CreatePaymentParams): Promise<PaymentStatus | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error('[NowPayments] API key not configured');
    return null;
  }

  try {
    const response = await fetch(`${NOWPAYMENTS_API_URL}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[NowPayments] Create payment error:', error);
      return null;
    }

    const data = await response.json();
    console.log('[NowPayments] Payment created:', data);
    return data as PaymentStatus;
  } catch (error) {
    console.error('[NowPayments] Create payment error:', error);
    return null;
  }
}

/**
 * 查询支付状态
 */
export async function getPaymentStatus(paymentId: number): Promise<PaymentStatus | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error('[NowPayments] API key not configured');
    return null;
  }

  try {
    const response = await fetch(`${NOWPAYMENTS_API_URL}/payment/${paymentId}`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[NowPayments] Get payment status error:', error);
      return null;
    }

    const data = await response.json();
    return data as PaymentStatus;
  } catch (error) {
    console.error('[NowPayments] Get payment status error:', error);
    return null;
  }
}

/**
 * 获取支持的货币列表
 */
export async function getAvailableCurrencies(): Promise<any | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch(`${NOWPAYMENTS_API_URL}/min-amount?currency=USDT`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('[NowPayments] Get currencies error:', error);
    return null;
  }
}

/**
 * 验证 IPN 签名
 */
export function verifyIpnSignature(body: string, signature: string): boolean {
  const ipnSecret = getIpnSecret();
  if (!ipnSecret) {
    console.warn('[NowPayments] IPN secret not configured');
    return false;
  }

  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha512', ipnSecret)
    .update(body)
    .digest('hex');

  return signature === expectedSignature;
}

/**
 * 检查支付是否完成（已确认）
 */
export function isPaymentCompleted(status: PaymentStatus): boolean {
  return status.status === 'finished' || status.status === 'confirmed';
}

/**
 * 检查支付是否失败
 */
export function isPaymentFailed(status: PaymentStatus): boolean {
  return status.status === 'failed' || status.status === 'refunded';
}
