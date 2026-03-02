import { NextResponse } from 'next/server';

// Cart item type
interface CartItem {
  id: string;
  listingId: number;
  title: string;
  titleKo: string | null;
  price: number;
  image: string;
  type: string;
  quantity: number;
  addedAt: string;
}

// GET - 获取购物车
export async function GET() {
  // 由于是客户端 localStorage，API 端返回空数组
  // 实际购物车数据存储在客户端 localStorage
  return NextResponse.json({ items: [], message: 'Cart is stored in localStorage' });
}

// POST - 添加商品到购物车
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { listingId, title, titleKo, price, image, type, quantity = 1 } = body;

    if (!listingId || !title || !price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 返回添加成功信息，实际存储由客户端处理
    return NextResponse.json({
      success: true,
      message: 'Item added to cart',
      item: {
        listingId,
        title,
        titleKo,
        price,
        image,
        type,
        quantity,
        addedAt: new Date().toISOString(),
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

// PUT - 更新购物车商品数量
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { listingId, quantity } = body;

    if (!listingId || quantity === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (quantity < 1) {
      return NextResponse.json(
        { error: 'Quantity must be at least 1' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Cart updated',
      listingId,
      quantity
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

// DELETE - 删除购物车商品或清空购物车
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');
    const clearAll = searchParams.get('clearAll');

    if (clearAll === 'true') {
      return NextResponse.json({
        success: true,
        message: 'Cart cleared'
      });
    }

    if (!listingId) {
      return NextResponse.json(
        { error: 'Missing listingId' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Item removed from cart',
      listingId
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
