import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  issueCertificatesForOrder,
  getCertificate,
  certificateVerifyUrl,
  renderCertificateHtml,
} from "../../server/lib/authenticity.mjs";

const sampleOrder = {
  id: "FANG-TEST-0001",
  customer: { name: "Test Client", email: "test@example.com" },
  lines: [
    {
      productKey: "passage/gue-am",
      title: "Gue Am — Passage",
      variationLabel: "gue am 1",
      size: "M",
      qty: 1,
      chapterLabel: "Ohasso a roka",
      characterName: "Gue Am",
    },
  ],
};

describe("authenticity certificates", () => {
  it("émet un certificat par ligne de commande", () => {
    const { certificates, error } = issueCertificatesForOrder(sampleOrder, {
      baseUrl: "https://fang.tickets-place.net",
    });
    assert.equal(error, undefined);
    assert.equal(certificates.length, 1);
    assert.match(certificates[0].id, /^FANG-CERT-/);
    assert.equal(certificates[0].orderId, sampleOrder.id);
    assert.ok(certificates[0].verifyUrl.includes("/api/store/authenticity/"));
  });

  it("est idempotent pour une même commande", () => {
    const first = issueCertificatesForOrder(sampleOrder, {
      baseUrl: "https://fang.tickets-place.net",
    });
    const second = issueCertificatesForOrder(sampleOrder, {
      baseUrl: "https://fang.tickets-place.net",
    });
    assert.equal(second.alreadyIssued, true);
    assert.equal(second.certificates[0].id, first.certificates[0].id);
  });

  it("génère une page HTML avec QR", () => {
    const cert = getCertificate(
      issueCertificatesForOrder({
        ...sampleOrder,
        id: "FANG-TEST-0002",
      }).certificates[0].id
    );
    const html = renderCertificateHtml(cert, { brand: { name: "FANG" } }, {
      qrDataUrl: "data:image/png;base64,abc",
    });
    assert.match(html, /Certificat d'authenticité/);
    assert.match(html, /data:image\/png;base64,abc/);
    assert.match(html, new RegExp(cert.id));
  });

  it("construit une URL de vérification publique", () => {
    const url = certificateVerifyUrl("FANG-CERT-TEST", "https://fang.tickets-place.net");
    assert.equal(
      url,
      "https://fang.tickets-place.net/api/store/authenticity/FANG-CERT-TEST/view"
    );
  });
});
