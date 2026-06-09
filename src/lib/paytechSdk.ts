/**
 * Helper PayTech Web SDK.
 * Charge paytech.min.js depuis paytech.sn et ouvre une popup/iframe.
 *
 * IMPORTANT : le paramètre s'appelle bien `prensentationMode` (typo PayTech).
 */

const SDK_URL = "https://paytech.sn/cdn/paytech.min.js";

declare global {
  interface Window {
    paytech?: any;
  }
}

let sdkPromise: Promise<void> | null = null;

function loadSdk(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("PayTech SDK : window indisponible."));
  if (window.paytech) return Promise.resolve();
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SDK_URL}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Chargement PayTech SDK échoué")), { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = SDK_URL;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Chargement PayTech SDK échoué"));
    document.head.appendChild(s);
  });
  return sdkPromise;
}

export type PaytechSdkOptions = {
  ref: string;
  itemPrice: number; // XOF entier
  itemName: string;
  customField?: Record<string, unknown>;
  mode?: "popup" | "iframe";
  env?: "test" | "prod";
  onSuccess?: () => void;
  onCancel?: () => void;
};

/**
 * Ouvre la popup de paiement PayTech.
 * Le SDK appelle `requestTokenUrl` (notre endpoint serveur) pour obtenir un token.
 * Une fois payé, l'IPN serveur finalise la commande, et `onSuccess` est déclenché
 * via le retour SDK.
 */
export async function openPaytechPopup(opts: PaytechSdkOptions): Promise<void> {
  await loadSdk();
  if (!window.paytech) throw new Error("PayTech SDK indisponible");

  // `paytech.withOption({...})` retourne un objet avec `send()` pour ouvrir
  const config = {
    requestTokenUrl: "/api/store/checkout/paytech/token",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    formFields: { ref: opts.ref },
    customField: JSON.stringify(opts.customField ?? {}),
    prensentationMode: opts.mode ?? "popup", // sic — typo PayTech
    env: opts.env ?? "test",
    ref_command: opts.ref,
    item_name: opts.itemName,
    item_price: opts.itemPrice,
    currency: "XOF",
    onSuccess: opts.onSuccess,
    onCancel: opts.onCancel,
  };

  try {
    const instance = window.paytech.withOption(config);
    if (instance && typeof instance.send === "function") {
      instance.send();
    } else if (typeof window.paytech.send === "function") {
      window.paytech.send(config);
    } else {
      throw new Error("PayTech SDK : méthode send() introuvable");
    }
  } catch (err) {
    throw err instanceof Error ? err : new Error(String(err));
  }
}
