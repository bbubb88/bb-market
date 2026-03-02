import { NextRequest, NextResponse } from 'next/server';
import { listings } from '@/data/games';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q')?.toLowerCase() || '';
  const type = searchParams.get('type') || '';

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  // Filter listings based on search query
  let results = listings.filter((listing) => {
    const titleMatch = listing.title.toLowerCase().includes(query) || 
                       listing.titleKo.toLowerCase().includes(query);
    const descMatch = listing.description.toLowerCase().includes(query) || 
                      listing.descriptionKo.toLowerCase().includes(query);
    return titleMatch || descMatch;
  });

  // Filter by type if specified
  if (type && type !== 'all') {
    results = results.filter((listing) => listing.type === type);
  }

  return NextResponse.json({ results });
}
