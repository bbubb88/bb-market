import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ytsqawvrgzxgfluuadao.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 客户端（用于前端，只读）
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 服务端（用于后端写入，有写权限）- 仅在服务端可用
export const getSupabaseAdmin = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_KEY is not set');
  }
  return createClient(supabaseUrl, serviceKey);
};

// Helper functions for database operations
export const db = {
  // Games
  async getGames() {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('Game').select('*');
    return { data, error };
  },

  async getGame(id: string) {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('Game').select('*').eq('id', id).single();
    return { data, error };
  },

  async createGame(game: any) {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('Game').insert(game).select();
    return { data, error };
  },

  // Servers
  async getServers(gameId?: string) {
    const supabaseAdmin = getSupabaseAdmin();
    let query = supabaseAdmin.from('Server').select('*');
    if (gameId) query = query.eq('gameId', gameId);
    const { data, error } = await query;
    return { data, error };
  },

  async createServer(server: any) {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('Server').insert(server).select();
    return { data, error };
  },

  // Listings
  async getListings(filters?: { gameId?: string; serverId?: string; type?: string; status?: string }) {
    const supabaseAdmin = getSupabaseAdmin();
    let query = supabaseAdmin.from('Listing').select('*');
    if (filters?.gameId) query = query.eq('gameId', filters.gameId);
    if (filters?.serverId) query = query.eq('serverId', filters.serverId);
    if (filters?.type) query = query.eq('type', filters.type);
    if (filters?.status) query = query.eq('status', filters.status);
    const { data, error } = await query;
    return { data, error };
  },

  async getListing(id: string) {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('Listing').select('*').eq('id', id).single();
    return { data, error };
  },

  async createListing(listing: any) {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('Listing').insert(listing).select();
    return { data, error };
  },

  async updateListing(id: string, listing: any) {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('Listing').update(listing).eq('id', id).select();
    return { data, error };
  },

  async deleteListing(id: string) {
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.from('Listing').delete().eq('id', id);
    return { error };
  },

  // Users
  async getUser(id: string) {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('User').select('*').eq('id', id).single();
    return { data, error };
  },

  async getUserByDiscord(discordId: string) {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('User').select('*').eq('discordId', discordId).single();
    return { data, error };
  },

  async createUser(user: any) {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('User').insert(user).select();
    return { data, error };
  },

  async updateUser(id: string, user: any) {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('User').update(user).eq('id', id).select();
    return { data, error };
  },

  // Orders
  async createOrder(order: any) {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('Order').insert(order).select();
    return { data, error };
  },

  async getOrders(userId: string, type: 'buyer' | 'seller') {
    const supabaseAdmin = getSupabaseAdmin();
    const column = type === 'buyer' ? 'buyerId' : 'sellerId';
    const { data, error } = await supabaseAdmin.from('Order').select('*').eq(column, userId);
    return { data, error };
  },

  async getOrder(id: string) {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('Order').select('*').eq('id', id).single();
    return { data, error };
  },

  async updateOrder(id: string, order: any) {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('Order').update(order).eq('id', id).select();
    return { data, error };
  },

  // Favorites
  async getFavorites(userId: string) {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('Favorite').select('*, Listing(*)').eq('userId', userId);
    return { data, error };
  },

  async addFavorite(favorite: any) {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('Favorite').insert(favorite).select();
    return { data, error };
  },

  async removeFavorite(userId: string, listingId: string) {
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.from('Favorite').delete().eq('userId', userId).eq('listingId', listingId);
    return { error };
  },

  // Wallet
  async getWallet(userId: string) {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('Wallet').select('*').eq('userId', userId).single();
    return { data, error };
  },

  async createWallet(wallet: any) {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('Wallet').insert(wallet).select();
    return { data, error };
  },

  async updateWallet(userId: string, wallet: any) {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('Wallet').update(wallet).eq('userId', userId).select();
    return { data, error };
  },

  // Settings
  async getSetting(key: string) {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('Setting').select('*').eq('key', key).single();
    return { data, error };
  },

  async setSetting(key: string, value: string) {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('Setting').upsert({ key, value }).select();
    return { data, error };
  },
};

export default db;
