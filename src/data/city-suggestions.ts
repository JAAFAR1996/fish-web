const CITY_SUGGESTIONS: Record<string, string[]> = {
  Baghdad: ['Baghdad', 'Mansour', 'Karrada', 'Kadhimiya', 'Dora'],
  Basra: ['Basra', 'Ashar', 'Tanuma', 'Zubair'],
  Nineveh: ['Mosul', 'Bartella', 'Tal Afar'],
  Erbil: ['Erbil', 'Shaqlawa', 'Soran'],
  Sulaymaniyah: ['Sulaymaniyah', 'Halabja', 'Ranya'],
  Dohuk: ['Duhok', 'Zakho', 'Amedi'],
  Anbar: ['Ramadi', 'Fallujah', 'Haditha'],
  Diyala: ['Baqubah', 'Khalis', 'Muqdadiyah'],
  Saladin: ['Tikrit', 'Samarra', 'Baiji'],
  Kirkuk: ['Kirkuk', 'Hawija', 'Daquq'],
  Najaf: ['Najaf', 'Kufa', 'Manathera'],
  Karbala: ['Karbala', 'Ain al-Tamur', 'Hindia'],
  Wasit: ['Kut', 'Hay', 'Numaniyah'],
  Maysan: ['Amarah', 'Qalat Saleh', 'Majar al-Kabir'],
  'Dhi Qar': ['Nasiriyah', 'Shatrah', "Rifa'i"],
  Muthanna: ['Samawah', 'Rumaitha', 'Al Khidhir'],
  Qadisiyyah: ['Diwaniyah', 'Hamza', 'Shamiya'],
  Babil: ['Hilla', 'Musayyib', 'Mahawil'],
};

export function getCitySuggestions(governorate: string): string[] {
  return CITY_SUGGESTIONS[governorate] ?? [];
}
