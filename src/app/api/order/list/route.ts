import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // 获取用户作为买家或卖家的订单
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/Order?or=(buyerId.eq.${userId},sellerId.eq.${userId})&select=*,Listing:listingId(title,images,serverId,type),User_seller:User!sellerId(email,discordTag),User_buyer:User!buyerId(email,discordTag)&order=createdAt.desc`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    const orders = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: orders.message || 'Failed to fetch orders' },
        { status: response.status }
      );
    }

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Fetch orders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
