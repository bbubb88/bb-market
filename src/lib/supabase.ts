import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ytsqawvrgzxgfluuadao.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_G8mPUnYitGdICVH4Xm7cKA_e6Fi0Jya';

// 客户端（用于前端读取）
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 服务端 Admin（有写入权限）
export const getSupabaseAdmin = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) {
    // 如果没有 service key，使用 anon key（只读）
    console.warn('SUPABASE_SERVICE_KEY not set, using anon key (read-only)');
    return createClient(supabaseUrl, supabaseAnonKey);
  }
  return createClient(supabaseUrl, serviceKey);
};

// 默认导出用 anon key（安全）
export const db = {
  // Games - 使用 anon key 读取
  async getGames() {
    const client = getSupabaseAdmin();
    const { data, error } = await client.from('Game').select('*');
    return { data, error };
  },

  async getGame(id: string) {
    const client = getSupabaseAdmin();
    const { data, error } = await client.from('Game').select('*').eq('id', id).single();
    return { data, error };
  },

  // Servers - 使用 anon key 读取
  async getServers(gameId?: string) {
    const client = getSupabaseAdmin();
    let query = client.from('Server').select('*');
    if (gameId) query = query.eq('gameId', gameId);
    const { data, error } = await query;
    return { data, error };
  },

  // Listings - 使用 anon key 读取
  async getListings(filters?: { gameId?: string; serverId?: string; type?: string; status?: string }) {
    const client = getSupabaseAdmin();
    let query = client.from('Listing').select('*');
    if (filters?.gameId) query = query.eq('gameId', filters.gameId);
    if (filters?.serverId) query = query.eq('serverId', filters.serverId);
    if (filters?.type) query = query.eq('type', filters.type);
    if (filters?.status) query = query.eq('status', filters.status);
    const { data, error } = await query;
    return { data, error };
  },

  async getListing(id: string) {
    const client = getSupabaseAdmin();
    const { data, error } = await client.from('Listing').select('*').eq('id', id).single();
    return { data, error };
  },

  // 需要写入的操作 - 这些需要 service key
  async createListing(listing: any) {
    const client = getSupabaseAdmin();
    const { data, error } = await client.from('Listing').insert(listing).select();
    return { data, error };
  },

  async updateListing(id: string, listing: any) {
    const client = getSupabaseAdmin();
    const { data, error } = await client.from('Listing').update(listing).eq('id', id).select();
    return { data, error };
  },

  async deleteListing(id: string) {
    const client = getSupabaseAdmin();
    const { error } = await client.from('Listing').delete().eq('id', id);
    return { error };
  },

  // Orders
  async getOrders(userId: string, type: 'buyer' | 'seller') {
    const client = getSupabaseAdmin();
    const column = type === 'buyer' ? 'buyerId' : 'sellerId';
    const { data, error } = await client.from('Order').select('*').eq(column, userId);
    return { data, error };
  },

  // Users
  async getUser(id: string) {
    const client = getSupabaseAdmin();
    const { data, error } = await client.from('User').select('*').eq('id', id).single();
    return { data, error };
  },

  async getUserByDiscord(discordId: string) {
    const client = getSupabaseAdmin();
    const { data, error } = await client.from('User').select('*').eq('discordId', discordId).single();
    return { data, error };
  },

  async createUser(user: any) {
    const client = getSupabaseAdmin();
    const { data, error } = await client.from('User').insert(user).select();
    return { data, error };
  },
};

export default db;
