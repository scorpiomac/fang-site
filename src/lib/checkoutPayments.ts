export const CHECKOUT_PAYMENT_OPTIONS = [
  {
    id: "wave",
    label: "Wave",
    hint: "Paiement mobile Wave",
    brand: "wave" as const,
  },
  {
    id: "orange_money",
    label: "Orange Money",
    hint: "Mobile Money Orange",
    brand: "orange" as const,
  },
  {
    id: "card",
    label: "Carte bancaire",
    hint: "Visa · Mastercard",
    brand: "card" as const,
  },
] as const;

export type CheckoutPaymentId = (typeof CHECKOUT_PAYMENT_OPTIONS)[number]["id"];

const CHECKOUT_PAYMENT_IDS = new Set<string>(
  CHECKOUT_PAYMENT_OPTIONS.map((m) => m.id)
);

export function isCheckoutPaymentId(id: string): id is CheckoutPaymentId {
  return CHECKOUT_PAYMENT_IDS.has(id);
}

export function isOnlinePaymentMethod(id: string): boolean {
  return isCheckoutPaymentId(id);
}

export function paytechTargetForMethod(id: string): string | undefined {
  const map: Record<CheckoutPaymentId, string> = {
    wave: "Wave",
    orange_money: "OrangeMoney",
    card: "Card",
  };
  return isCheckoutPaymentId(id) ? map[id] : undefined;
}

export type CheckoutPaymentChoice = {
  id: string;
  label: string;
  hint: string;
  brand: "wave" | "orange" | "card";
};

export function resolveCheckoutPaymentChoices(
  methods: { id: string; label: string; instructions?: string }[]
): CheckoutPaymentChoice[] {
  const fromSettings = methods
    .filter((m) => isCheckoutPaymentId(m.id))
    .map((m) => {
      const meta = CHECKOUT_PAYMENT_OPTIONS.find((o) => o.id === m.id);
      return {
        id: m.id,
        label: m.label,
        hint: m.instructions?.trim() || meta?.hint || "",
        brand: meta?.brand ?? ("card" as const),
      };
    });

  if (fromSettings.length > 0) return fromSettings;

  return CHECKOUT_PAYMENT_OPTIONS.map((m) => ({
    id: m.id,
    label: m.label,
    hint: m.hint,
    brand: m.brand,
  }));
}
