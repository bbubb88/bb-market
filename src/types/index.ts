// BB Market - Types

export interface Game {
  id: string;
  name: string;
  nameKo: string;
  icon: string;
  iconUrl?: string;
  status: 'active' | 'coming';
  servers: Server[];
}

export interface Server {
  id: string;
  name: string;
  nameKo: string;
  zone: string;
}

export interface Listing {
  id: number;
  type: 'account' | 'item' | 'coin';
  title: string;
  titleKo: string;
  description: string;
  descriptionKo: string;
  price: number;
  images: string[];
  image?: string;
  badge?: string;
  server?: string;
  level?: number;
  amount?: number;
  seller?: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  telegram?: string;
  avatar?: string;
  rating: number;
  verified: boolean;
  joinedAt: string;
}

export type Language = 'zh-TW' | 'ko';
