export const complementaryCategoryMap: Record<string, string[]> = {
  filtration: ['heating', 'waterCare'],
  heating: ['filtration', 'waterCare'],
  lighting: ['plantsFertilizers', 'waterCare'],
  waterCare: ['filtration', 'tests'],
  plantsFertilizers: ['lighting', 'waterCare'],
};