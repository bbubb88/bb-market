import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ytsqawvrgzxgfluuadao.supabase.co';
// 使用 Service Role Key 来绕过 RLS
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_4ynjxIudgE1ydSb3SR1a5A_gJGbGN5o';

// 客户端（用于前端，只读）
export const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_G8mPUnYitGdICVH4Xm7cKA_e6Fi0Jya');

// 服务端（用于后端写入，有写权限）
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Helper functions for database operations - 使用正确的表名（大写）
export const db = {
  // Games
  async getGames() {
    const { data, error } = await supabaseAdmin.from('Game').select('*');
    return { data, error };
  },

  async getGame(id: string) {
    const { data, error } = await supabaseAdmin.from('Game').select('*').eq('id', id).single();
    return { data, error };
  },

  async createGame(game: any) {
    const { data, error } = await supabaseAdmin.from('Game').insert(game).select();
    return { data, error };
  },

  // Servers
  async getServers(gameId?: string) {
    let query = supabaseAdmin.from('Server').select('*');
    if (gameId) query = query.eq('gameId', gameId);
    const { data, error } = await query;
    return { data, error };
  },

  async createServer(server: any) {
    const { data, error } = await supabaseAdmin.from('Server').insert(server).select();
    return { data, error };
  },

  // Listings
  async getListings(filters?: { gameId?: string; serverId?: string; type?: string; status?: string }) {
    let query = supabaseAdmin.from('Listing').select('*');
    if (filters?.gameId) query = query.eq('gameId', filters.gameId);
    if (filters?.serverId) query = query.eq('serverId', filters.serverId);
    if (filters?.type) query = query.eq('type', filters.type);
    if (filters?.status) query = query.eq('status', filters.status);
    const { data, error } = await query;
    return { data, error };
  },

  async getListing(id: string) {
    const { data, error } = await supabaseAdmin.from('Listing').select('*').eq('id', id).single();
    return { data, error };
  },

  async createListing(listing: any) {
    const { data, error } = await supabaseAdmin.from('Listing').insert(listing).select();
    return { data, error };
  },

  async updateListing(id: string, listing: any) {
    const { data, error } = await supabaseAdmin.from('Listing').update(listing).eq('id', id).select();
    return { data, error };
  },

  async deleteListing(id: string) {
    const { error } = await supabaseAdmin.from('Listing').delete().eq('id', id);
    return { error };
  },

  // Users
  async getUser(id: string) {
    const { data, error } = await supabaseAdmin.from('User').select('*').eq('id', id).single();
    return { data, error };
  },

  async getUserByDiscord(discordId: string) {
    const { data, error } = await supabaseAdmin.from('User').select('*').eq('discordId', discordId).single();
    return { data, error };
  },

  async createUser(user: any) {
    const { data, error } = await supabaseAdmin.from('User').insert(user).select();
    return { data, error };
  },

  async updateUser(id: string, user: any) {
    const { data, error } = await supabaseAdmin.from('User').update(user).eq('id', id).select();
    return { data, error };
  },

  // Orders
  async createOrder(order: any) {
    const { data, error } = await supabaseAdmin.from('Order').insert(order).select();
    return { data, error };
  },

  async getOrders(userId: string, type: 'buyer' | 'seller') {
    const column = type === 'buyer' ? 'buyerId' : 'sellerId';
    const { data, error } = await supabaseAdmin.from('Order').select('*').eq(column, userId);
    return { data, error };
  },

  async getOrder(id: string) {
    const { data, error } = await supabaseAdmin.from('Order').select('*').eq('id', id).single();
    return { data, error };
  },

  async updateOrder(id: string, order: any) {
    const { data, error } = await supabaseAdmin.from('Order').update(order).eq('id', id).select();
    return { data, error };
  },

  // Favorites
  async getFavorites(userId: string) {
    const { data, error } = await supabaseAdmin.from('Favorite').select('*, Listing(*)').eq('userId', userId);
    return { data, error };
  },

  async addFavorite(favorite: any) {
    const { data, error } = await supabaseAdmin.from('Favorite').insert(favorite).select();
    return { data, error };
  },

  async removeFavorite(userId: string, listingId: string) {
    const { error } = await supabaseAdmin.from('Favorite').delete().eq('userId', userId).eq('listingId', listingId);
    return { error };
  },

  // Wallet
  async getWallet(userId: string) {
    const { data, error } = await supabaseAdmin.from('Wallet').select('*').eq('userId', userId).single();
    return { data, error };
  },

  async createWallet(wallet: any) {
    const { data, error } = await supabaseAdmin.from('Wallet').insert(wallet).select();
    return { data, error };
  },

  async updateWallet(userId: string, wallet: any) {
    const { data, error } = await supabaseAdmin.from('Wallet').update(wallet).eq('userId', userId).select();
    return { data, error };
  },

  // Settings
  async getSetting(key: string) {
    const { data, error } = await supabaseAdmin.from('Setting').select('*').eq('key', key).single();
    return { data, error };
  },

  async setSetting(key: string, value: string) {
    const { data, error } = await supabaseAdmin.from('Setting').upsert({ key, value }).select();
    return { data, error };
  },
};

export default db;
