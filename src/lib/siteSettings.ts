export type PublicSettings = {
  brand: {
    name: string;
    tagline: string;
    legalName: string;
    address: string;
    siteUrl?: string;
  };
  checkout?: {
    paymentProvider: "off" | "paytech" | "paydunya";
    allowSimulated?: boolean;
    minOnlineAmount?: number;
  };
  contact: {
    email: string;
    phone: string;
    whatsapp: string;
    supportHours: string;
  };
  social: {
    instagram: string;
    facebook: string;
    tiktok: string;
    youtube: string;
  };
  currency: {
    code: string;
    label: string;
    symbol: string;
    locale: string;
  };
  tax: {
    enabled: boolean;
    rate: number;
    included: boolean;
    label: string;
  };
  production: {
    leadTime: string;
    showLeadTime: boolean;
  };
  payments: {
    methods: { id: string; label: string; instructions: string }[];
  };
  maintenance: {
    enabled: boolean;
    message: string;
  };
  legal: {
    siret: string;
    rcs: string;
    vatNumber: string;
  };
};

export const DEFAULT_PUBLIC_SETTINGS: PublicSettings = {
  brand: {
    name: "FANG",
    tagline: "Nel Fang Te Dundu",
    legalName: "FANG — Fallou Ngom",
    address: "Dakar, Sénégal",
    siteUrl: "",
  },
  checkout: {
    paymentProvider: "off",
    allowSimulated: false,
    minOnlineAmount: 200,
  },
  contact: {
    email: "elhadjifalloungom7@gmail.com",
    phone: "+221 78 187 97 38",
    whatsapp: "221781879738",
    supportHours: "Lun–Ven · 9h–18h GMT",
  },
  social: {
    instagram: "https://www.instagram.com/fanglamarque/",
    facebook: "",
    tiktok: "",
    youtube: "",
  },
  currency: {
    code: "XOF",
    label: "FCFA",
    symbol: "FCFA",
    locale: "fr-SN",
  },
  tax: {
    enabled: false,
    rate: 18,
    included: true,
    label: "TVA",
  },
  production: {
    leadTime: "2 à 6 semaines",
    showLeadTime: true,
  },
  payments: {
    methods: [
      { id: "wave", label: "Wave", instructions: "Paiement mobile sécurisé via Wave." },
      { id: "orange_money", label: "Orange Money", instructions: "Paiement mobile sécurisé via Orange Money." },
      { id: "card", label: "Carte bancaire", instructions: "Visa, Mastercard et cartes internationales." },
    ],
  },
  maintenance: {
    enabled: false,
    message: "Le site est en maintenance.",
  },
  legal: {
    siret: "",
    rcs: "",
    vatNumber: "",
  },
};

export async function fetchPublicSettings(): Promise<PublicSettings> {
  try {
    const res = await fetch("/api/store/settings");
    if (!res.ok) return DEFAULT_PUBLIC_SETTINGS;
    const { settings } = (await res.json()) as { settings: PublicSettings };
    return settings;
  } catch {
    return DEFAULT_PUBLIC_SETTINGS;
  }
}

export function formatMoney(value: number, settings: PublicSettings): string {
  const formatter = new Intl.NumberFormat(settings.currency.locale, {
    style: "decimal",
    maximumFractionDigits: 0,
  });
  return `${formatter.format(value)} ${settings.currency.label}`;
}
