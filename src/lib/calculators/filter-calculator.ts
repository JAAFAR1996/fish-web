import type {
  FilterCalculationInputs,
  FilterCalculationResult,
  BioloadLevel,
} from '@/types';

const BIOLOAD_MULTIPLIERS: Record<BioloadLevel, number> = {
  low: 4,
  medium: 6,
  high: 10,
};

const SAFETY_MARGIN = 1.1;
const MIN_FLOW_RATE = 100;

export function calculateFilterFlowRate(
  inputs: FilterCalculationInputs
): FilterCalculationResult {
  const { tankVolume, bioload } = inputs;
  
  const multiplier = BIOLOAD_MULTIPLIERS[bioload];
  const requiredFlowRate = tankVolume * multiplier;
  const withMargin = Math.max(requiredFlowRate * SAFETY_MARGIN, MIN_FLOW_RATE);
  const recommendedFlowRate = Math.ceil(withMargin / 50) * 50;

  return {
    requiredFlowRate: Math.round(requiredFlowRate),
    recommendedFlowRate,
    status: 'optimal',
    multiplier,
  };
}

export function getBioloadMultiplier(bioload: BioloadLevel): number {
  return BIOLOAD_MULTIPLIERS[bioload];
}

export function validateFilterInputs(
  inputs: FilterCalculationInputs
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const { tankVolume, bioload } = inputs;
  const hasTankVolume =
    typeof tankVolume === 'number' && !Number.isNaN(tankVolume);

  if (!hasTankVolume) {
    errors.push('calculators.filter.validation.tankVolumeRequired');
  } else if (tankVolume < 1) {
    errors.push('calculators.filter.validation.tankVolumeMin');
  } else if (tankVolume > 10000) {
    errors.push('calculators.filter.validation.tankVolumeMax');
  }

  if (!bioload) {
    errors.push('calculators.filter.validation.bioloadRequired');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getFilterRecommendationText(
  result: FilterCalculationResult
): string {
  return `For a tank with ${result.multiplier}\u00D7 turnover rate, we recommend a filter with at least ${result.recommendedFlowRate} L/h flow rate`;
}

export function getBioloadDescription(bioload: BioloadLevel): string {
  const descriptions: Record<BioloadLevel, string> = {
    low: 'Few fish, many plants',
    medium: 'Moderate fish population',
    high: 'Many fish, heavy feeding',
  };
  
  return descriptions[bioload];
}


