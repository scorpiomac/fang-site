#!/usr/bin/env node
import { verifyPaytechIpn, paytechAmountMatches } from "../server/lib/paytech.mjs";
import { verifyPaydunyaHash, paydunyaAmountMatches } from "../server/lib/paydunya.mjs";
import crypto from "node:crypto";

let pass = 0, fail = 0;
const t = (label, ok) => {
  if (ok) { pass++; console.log("  ✓", label); }
  else { fail++; console.log("  ✗", label); }
};

// ─── PayTech HMAC ───
process.env.PAYTECH_API_KEY = "test_api_key";
process.env.PAYTECH_API_SECRET = "test_api_secret";
const ref = "CHK-20260609-DEADBE";
const price = 7000;
const msg = `${price}|${ref}|${process.env.PAYTECH_API_KEY}`;
const sig = crypto.createHmac("sha256", process.env.PAYTECH_API_SECRET).update(msg).digest("hex");

const ok = verifyPaytechIpn({ type_event: "sale_complete", ref_command: ref, item_price: price, hmac_compute: sig });
t("PayTech HMAC valide accepté", ok.ok === true);

const bad = verifyPaytechIpn({ type_event: "sale_complete", ref_command: ref, item_price: price, hmac_compute: "ffff" });
t("PayTech HMAC invalide rejeté", bad.ok === false);

t("PayTech amount match", paytechAmountMatches(7000, { item_price: 7000 }));
t("PayTech amount mismatch", !paytechAmountMatches(7000, { item_price: 6999 }));

// ─── PayDunya hash ───
process.env.PAYDUNYA_MASTER_KEY = "test_master_key";
const hash = crypto.createHash("sha512").update("test_master_key").digest("hex");
t("PayDunya hash valide accepté", verifyPaydunyaHash({ hash }).ok === true);
t("PayDunya hash invalide rejeté", verifyPaydunyaHash({ hash: "ffff" }).ok === false);

t("PayDunya amount match invoice.total_amount", paydunyaAmountMatches(7000, { invoice: { total_amount: 7000 } }));
t("PayDunya amount match total_amount fallback", paydunyaAmountMatches(7000, { total_amount: 7000 }));
t("PayDunya amount mismatch", !paydunyaAmountMatches(7000, { invoice: { total_amount: 6500 } }));

// ─── CheckoutPending ref format ───
const { generateRefCommand } = await import("../server/lib/checkoutPending.mjs");
const r = generateRefCommand();
t("Ref format CHK-...", /^CHK-\d{14}-[A-F0-9]{6}$/.test(r));

console.log(`\n${pass} ✓ / ${fail} ✗`);
process.exit(fail === 0 ? 0 : 1);
