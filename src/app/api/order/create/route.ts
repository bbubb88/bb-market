import { NextRequest, NextResponse } from 'next/server';
import { notifyBuyerOfOrder } from '@/lib/discord';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { listingId, buyerId } = await request.json();

    if (!listingId || !buyerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 获取商品信息
    const listingRes = await fetch(
      `${SUPABASE_URL}/rest/v1/Listing?id=eq.${listingId}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    const listings = await listingRes.json();
    
    if (!listings || listings.length === 0) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    const listing = listings[0];
    
    if (listing.status !== 'SELLING') {
      return NextResponse.json(
        { error: 'Listing is not available' },
        { status: 400 }
      );
    }

    // 创建订单
    const orderData = {
      listingId,
      buyerId,
      sellerId: listing.sellerId,
      price: listing.price,
      fee: Math.round(listing.price * 0.03 * 100) / 100,
      status: 'PENDING',
    };

    const orderRes = await fetch(`${SUPABASE_URL}/rest/v1/Order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(orderData),
    });

    const order = await orderRes.json();

    if (!orderRes.ok) {
      return NextResponse.json(
        { error: order.message || 'Failed to create order' },
        { status: orderRes.status }
      );
    }

    // 获取买家信息（用于发送 Discord 通知）
    const buyerRes = await fetch(
      `${SUPABASE_URL}/rest/v1/User?id=eq.${buyerId}&select=id,discordId,username`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    const buyers = await buyerRes.json();
    
    // 获取卖家信息
    const sellerRes = await fetch(
      `${SUPABASE_URL}/rest/v1/User?id=eq.${listing.sellerId}&select=id,username`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    const sellers = await sellerRes.json();

    // 异步发送 Discord 通知（不阻塞响应）
    if (buyers && buyers.length > 0 && buyers[0].discordId) {
      const buyer = buyers[0];
      const seller = sellers && sellers.length > 0 ? sellers[0] : { username: 'Unknown' };
      
      // 异步发送通知，不等待结果
      notifyBuyerOfOrder(buyer.discordId, {
        orderId: order[0]?.id || 'Unknown',
        listingTitle: listing.title,
        price: listing.price,
        sellerName: seller.username || 'Unknown',
      }).then(success => {
        if (success) {
          console.log('Discord notification sent to buyer:', buyer.discordId);
        }
      }).catch(err => {
        console.error('Failed to send Discord notification:', err);
      });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
