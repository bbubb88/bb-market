import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { orderId, status, userId } = await request.json();

    if (!orderId || !status || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 获取订单信息
    const orderRes = await fetch(
      `${SUPABASE_URL}/rest/v1/Order?id=eq.${orderId}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    const orders = await orderRes.json();
    
    if (!orders || orders.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = orders[0];

    // 验证权限
    if (order.buyerId !== userId && order.sellerId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // 状态转换验证
    const validTransitions: Record<string, string[]> = {
      'PENDING': ['PAID', 'CANCELLED'],
      'PAID': ['COMPLETED', 'CANCELLED'],
    };

    if (!validTransitions[order.status]?.includes(status)) {
      return NextResponse.json(
        { error: `Cannot change from ${order.status} to ${status}` },
        { status: 400 }
      );
    }

    // 更新订单
    const updateData: any = { 
      status,
      updatedAt: new Date().toISOString(),
    };

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date().toISOString();
    }

    const updateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/Order?id=eq.${orderId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(updateData),
      }
    );

    const updatedOrder = await updateRes.json();

    if (!updateRes.ok) {
      return NextResponse.json(
        { error: updatedOrder.message || 'Failed to update order' },
        { status: updateRes.status }
      );
    }

    // 如果订单完成或取消，更新商品状态
    if (status === 'COMPLETED' || status === 'CANCELLED') {
      await fetch(
        `${SUPABASE_URL}/rest/v1/Listing?id=eq.${order.listingId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
          body: JSON.stringify({ 
            status: status === 'COMPLETED' ? 'SOLD' : 'SELLING' 
          }),
        }
      );
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
