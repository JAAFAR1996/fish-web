import { NextRequest, NextResponse } from 'next/server';
import { getRecommendedFilters } from '@/lib/calculators/product-recommendations';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const flowRate = searchParams.get('flowRate');
    const tankVolume = searchParams.get('tankVolume');
    const limit = searchParams.get('limit');

    if (!flowRate || !tankVolume) {
      return NextResponse.json(
        { error: 'flowRate and tankVolume parameters are required' },
        { status: 400 }
      );
    }

    const requiredFlowRate = parseFloat(flowRate);
    const volume = parseFloat(tankVolume);
    const productLimit = limit ? parseInt(limit, 10) : 4;

    if (isNaN(requiredFlowRate) || requiredFlowRate <= 0 || isNaN(volume) || volume <= 0) {
      return NextResponse.json(
        { error: 'Invalid parameter values' },
        { status: 400 }
      );
    }

    const products = await getRecommendedFilters(requiredFlowRate, volume, productLimit);

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching recommended filters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommended filters' },
      { status: 500 }
    );
  }
}
