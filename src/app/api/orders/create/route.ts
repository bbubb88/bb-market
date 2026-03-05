import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

// 创建订单 API
// 支持单个或多个商品下单
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, buyerId } = body;

    // 支持两种格式：
    // 1. 单个商品: { listingId, buyerId }
    // 2. 多个商品: { items: [{ listingId }], buyerId }
    
    let orderItems: Array<{ listingId: string | number }> = [];
    
    if (items && Array.isArray(items)) {
      // 多个商品格式
      orderItems = items.map((item: any) => ({ listingId: String(item.listingId) }));
    } else {
      // 单个商品格式 - 支持UUID和数字ID
      const { listingId } = body;
      if (!listingId || !buyerId) {
        return NextResponse.json(
          { error: 'Missing required fields: listingId and buyerId' },
          { status: 400 }
        );
      }
      orderItems = [{ listingId: String(listingId) }]; // 转换为字符串，支持UUID
    }

    if (!buyerId) {
      return NextResponse.json(
        { error: 'Missing buyerId' },
        { status: 400 }
      );
    }

    if (orderItems.length === 0) {
      return NextResponse.json(
        { error: 'No items to order' },
        { status: 400 }
      );
    }

    // 确保用户存在，如果不存在则创建
    let validBuyerId = buyerId;
    const userCheck = await fetch(
      `${SUPABASE_URL}/rest/v1/User?id=eq.${buyerId}`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    const existingUsers = await userCheck.json();
    if (!existingUsers || existingUsers.length === 0) {
      // 创建新用户
      const createUser = await fetch(
        `${SUPABASE_URL}/rest/v1/User`,
        {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            id: buyerId,
            email: buyerId + '@temp.local',
          }),
        }
      );
    }

    // 获取所有商品信息
    const listingIds = orderItems.map(item => String(item.listingId)).join(',');
    const listingRes = await fetch(
      `${SUPABASE_URL}/rest/v1/Listing?id=in.(${listingIds})&select=*`,
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
        { error: 'No listings found' },
        { status: 404 }
      );
    }

    // 创建订单
    const orders = [];
    const errors = [];

    for (const item of orderItems) {
      const listing = listings.find((l: any) => String(l.id) === String(item.listingId));
      
      if (!listing) {
        errors.push({ listingId: item.listingId, error: 'Listing not found' });
        continue;
      }

      if (listing.status !== 'SELLING') {
        errors.push({ listingId: item.listingId, error: 'Listing is not available' });
        continue;
      }

      const orderData = {
        listingId: item.listingId,
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
        errors.push({ listingId: item.listingId, error: order.message || 'Failed to create order' });
        continue;
      }

      orders.push(order[0] || order);
    }

    if (orders.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create any orders', details: errors },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      orders,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('Create orders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 获取订单详情
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');
  const userId = searchParams.get('userId');

  try {
    if (orderId) {
      // 获取单个订单
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/Order?id=eq.${orderId}&select=*,Listing:listingId(*)`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
        }
      );
      
      const orders = await response.json();
      
      if (!orders || orders.length === 0) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(orders[0]);
    }

    if (userId) {
      // 获取用户的所有订单
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/Order?or=(buyerId.eq.${userId},sellerId.eq.${userId})&select=*,Listing:listingId(*)&order=createdAt.desc`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
        }
      );

      const orders = await response.json();
      return NextResponse.json(orders);
    }

    return NextResponse.json(
      { error: 'Missing orderId or userId' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
