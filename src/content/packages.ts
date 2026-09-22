export type PackageId = "basic" | "premium" | "pro";

export type PackageDefinition = {
  id: PackageId;
  name: string;
  priceRsd: number;
  tagline: string;
  highlighted: boolean;
  activeDays: number;
  storageLimitGB: number;
  allowVideo: boolean;
  allowGuestDownload: boolean;
  features: string[];
};

export const packages: PackageDefinition[] = [
  {
    id: "basic",
    name: "Osnovni",
    priceRsd: 3490,
    tagline: "Idealno za manje proslave",
    highlighted: false,
    activeDays: 30,
    storageLimitGB: 5,
    allowVideo: false,
    allowGuestDownload: false,
    features: [
      "1 događaj",
      "Neograničeno fotografija",
      "30 dana skladištenja",
      "Galerija otvorena gostima",
      "Prilagodljiva stranica događaja",
      "ZIP preuzimanje svih slika",
      "Podrška putem e-pošte",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    priceRsd: 5990,
    tagline: "Za venčanja i veće proslave",
    highlighted: true,
    activeDays: 90,
    storageLimitGB: 10,
    allowVideo: true,
    allowGuestDownload: true,
    features: [
      "Sve iz Osnovnog paketa",
      "Video snimci (do 100 MB)",
      "90 dana skladištenja",
      "Privatna ili javna galerija",
      "Lajk i sakrivanje slika",
      "Prioritetna podrška",
    ],
  },
  {
    id: "pro",
    name: "Profesionalni",
    priceRsd: 16990,
    tagline: "Kompletno rešenje za venčanje",
    highlighted: false,
    activeDays: 180,
    storageLimitGB: 20,
    allowVideo: true,
    allowGuestDownload: true,
    features: [
      "Sve iz Premium paketa",
      "180 dana skladištenja (6 meseci)",
      "20 GB prostora",
      "Prioritetna aktivacija",
      "Prioritetna podrška",
    ],
  },
];

export function getPackage(id: string): PackageDefinition {
  return packages.find((p) => p.id === id) ?? packages[0];
}

export const categoryLabels: Record<string, string> = {
  WEDDING: "Venčanje",
  BIRTHDAY: "Rođendan",
  CORPORATE: "Korporativni",
  CHRISTENING: "Krštenje",
};
