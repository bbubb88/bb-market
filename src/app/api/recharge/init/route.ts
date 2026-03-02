import { NextRequest, NextResponse } from 'next/server';

// 使用 Supabase Admin
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ytsqawvrgzxgfluuadao.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 创建表的 SQL
const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS recharge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId VARCHAR(255) NOT NULL,
  address VARCHAR(255) NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "expiresAt" TIMESTAMP WITH TIME ZONE,
  "completedAt" TIMESTAMP WITH TIME ZONE
);
`;

const CREATE_INDEX_SQL = `
CREATE INDEX IF NOT EXISTS idx_recharge_userId ON recharge(userId);
CREATE INDEX IF NOT EXISTS idx_recharge_status ON recharge(status);
`;

async function supabaseRpc(method: string, params: object = {}) {
  // 尝试使用 pg_catalog 创建表
  const endpoint = `${supabaseUrl}/rest/v1/rpc/exec_sql`;
  
  // 首先检查表是否存在
  const checkRes = await fetch(`${supabaseUrl}/rest/v1/recharge?select=id&limit=1`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    },
  });
  
  if (checkRes.status === 200) {
    return { success: true, message: 'Table already exists' };
  }
  
  // 返回需要手动创建表的信息
  return { 
    success: false, 
    message: 'Table does not exist. Please create it manually or run the SQL.',
    sql: CREATE_TABLE_SQL + CREATE_INDEX_SQL
  };
}

export async function GET() {
  try {
    const result = await supabaseRpc('check');
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      sql: CREATE_TABLE_SQL + CREATE_INDEX_SQL
    }, { status: 500 });
  }
}
