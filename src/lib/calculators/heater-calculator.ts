import type {
  HeaterCalculationInputs,
  HeaterCalculationResult,
} from '@/types';

const BASE_WATTAGE_PER_LITER = 1;
const WATTAGE_PER_DEGREE_PER_LITER = 0.025;
const SAFETY_MARGIN = 1.1;
const COMMON_WATTAGES = [25, 50, 75, 100, 150, 200, 250, 300, 500];

export function calculateHeaterWattage(
  inputs: HeaterCalculationInputs
): HeaterCalculationResult {
  const { tankVolume, currentTemp, targetTemp } = inputs;
  
  const tempRise = targetTemp - currentTemp;
  const baseWattage = tankVolume * BASE_WATTAGE_PER_LITER;
  const additionalWattage = tankVolume * tempRise * WATTAGE_PER_DEGREE_PER_LITER;
  const requiredWattage = baseWattage + additionalWattage;
  const withMargin = requiredWattage * SAFETY_MARGIN;
  const recommendedWattage = findNearestWattage(withMargin);

  return {
    requiredWattage: Math.round(requiredWattage),
    recommendedWattage,
    status: 'optimal',
    temperatureRise: tempRise,
  };
}

function findNearestWattage(wattage: number): number {
  for (const commonWattage of COMMON_WATTAGES) {
    if (commonWattage >= wattage) {
      return commonWattage;
    }
  }
  
  return Math.ceil(wattage / 100) * 100;
}

export function validateHeaterInputs(
  inputs: HeaterCalculationInputs
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const { tankVolume, currentTemp, targetTemp } = inputs;

  const hasTankVolume =
    typeof tankVolume === 'number' && !Number.isNaN(tankVolume);

  if (!hasTankVolume) {
    errors.push('calculators.heater.validation.tankVolumeRequired');
  } else if (tankVolume < 1) {
    errors.push('calculators.heater.validation.tankVolumeMin');
  } else if (tankVolume > 10000) {
    errors.push('calculators.heater.validation.tankVolumeMax');
  }

  const hasCurrentTemp =
    typeof currentTemp === 'number' && !Number.isNaN(currentTemp);
  const hasTargetTemp =
    typeof targetTemp === 'number' && !Number.isNaN(targetTemp);

  if (!hasCurrentTemp || !hasTargetTemp) {
    errors.push('calculators.heater.validation.tempRequired');
  } else {
    const tempOutOfRange =
      currentTemp < 0 ||
      currentTemp > 40 ||
      targetTemp < 0 ||
      targetTemp > 40;

    if (tempOutOfRange) {
      errors.push('calculators.heater.validation.tempOutOfRange');
    }

    if (targetTemp <= currentTemp) {
      errors.push('calculators.heater.validation.targetHigher');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getHeaterRecommendationText(
  result: HeaterCalculationResult
): string {
  return `For a tank with ${result.temperatureRise}\u00B0C temperature rise, we recommend a ${result.recommendedWattage}W heater`;
}



