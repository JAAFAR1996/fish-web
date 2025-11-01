import { NextRequest, NextResponse } from 'next/server';
import { getRecommendedHeaters } from '@/lib/calculators/product-recommendations';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const wattage = searchParams.get('wattage');
    const limit = searchParams.get('limit');

    if (!wattage) {
      return NextResponse.json(
        { error: 'Wattage parameter is required' },
        { status: 400 }
      );
    }

    const requiredWattage = parseFloat(wattage);
    const productLimit = limit ? parseInt(limit, 10) : 4;

    if (isNaN(requiredWattage) || requiredWattage <= 0) {
      return NextResponse.json(
        { error: 'Invalid wattage value' },
        { status: 400 }
      );
    }

    const products = await getRecommendedHeaters(requiredWattage, productLimit);

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching recommended heaters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommended heaters' },
      { status: 500 }
    );
  }
}
