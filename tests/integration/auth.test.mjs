import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { http, adminLogin, adminFetch, baseUrl, adminEmail, uniqueEmail } from "../helpers/http.mjs";

describe("Authentification — admin", () => {
  it("GET /api/admin/ping est public", async () => {
    const res = await http("/api/admin/ping");
    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
  });

  it("POST /api/admin/login avec mauvais mot de passe → 401", async () => {
    const res = await http("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, password: "wrong" }),
    });
    assert.equal(res.status, 401);
    assert.ok(res.body.error);
  });

  it("POST /api/admin/login OK retourne sessionToken", async () => {
    const token = await adminLogin();
    assert.ok(token);
    assert.match(token, /^[a-f0-9]{32,}$/);
  });

  it("GET /api/admin/me sans token → 401", async () => {
    const res = await http("/api/admin/me");
    assert.equal(res.status, 401);
  });

  it("GET /api/admin/me avec token → user", async () => {
    const token = await adminLogin();
    const res = await adminFetch(token, "/api/admin/me");
    assert.equal(res.status, 200);
    assert.equal(res.body.user.email, adminEmail);
    assert.ok(["owner", "admin"].includes(res.body.user.role));
  });

  it("GET /api/admin/catalog sans token → 401", async () => {
    const res = await http("/api/admin/catalog");
    assert.equal(res.status, 401);
  });

  it("GET /api/admin/orders sans token → 401", async () => {
    const res = await http("/api/admin/orders");
    assert.equal(res.status, 401);
  });

  it("Token invalide → 401", async () => {
    const res = await http("/api/admin/me", {
      headers: { Authorization: "Bearer fake-token-xxx" },
    });
    assert.equal(res.status, 401);
  });

  it("POST /api/admin/logout invalide la session", async () => {
    const token = await adminLogin();
    const ok = await adminFetch(token, "/api/admin/me");
    assert.equal(ok.status, 200);
    const out = await adminFetch(token, "/api/admin/logout", { method: "POST" });
    assert.equal(out.status, 200);
    const after = await adminFetch(token, "/api/admin/me");
    assert.equal(after.status, 401);
  });
});

describe("Authentification — client (storefront)", () => {
  it("POST /api/store/auth/register crée un compte", async () => {
    const email = uniqueEmail("reg");
    const res = await http("/api/store/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: "TestPassword2026!",
        name: "Client Test",
        phone: "+221770000000",
        city: "Dakar",
      }),
    });
    assert.equal(res.status, 201);
    assert.ok(res.body.sessionToken);
    assert.equal(res.body.customer.email, email);
  });

  it("POST /api/store/auth/register refuse mot de passe trop court", async () => {
    const res = await http("/api/store/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: uniqueEmail("short"),
        password: "123",
        name: "X",
      }),
    });
    assert.ok(res.status >= 400);
  });

  it("POST /api/store/auth/register refuse e-mail invalide", async () => {
    const res = await http("/api/store/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "not-an-email",
        password: "GoodPassword2026!",
        name: "X",
      }),
    });
    assert.ok(res.status >= 400);
  });

  it("POST /api/store/auth/login OK puis /auth/me", async () => {
    const email = uniqueEmail("login");
    const password = "LoginPass2026!";
    await http("/api/store/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name: "Tester" }),
    });
    const login = await http("/api/store/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    assert.equal(login.status, 200);
    const token = login.body.sessionToken;
    const me = await http("/api/store/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(me.status, 200);
    assert.equal(me.body.customer.email, email);
  });

  it("Login client mauvais mot de passe → 401", async () => {
    const email = uniqueEmail("badlogin");
    await http("/api/store/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "RealPass2026!", name: "X" }),
    });
    const res = await http("/api/store/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "wrong" }),
    });
    assert.equal(res.status, 401);
  });

  it("GET /api/store/account/orders requiert auth", async () => {
    const res = await http("/api/store/account/orders");
    assert.equal(res.status, 401);
  });
});

describe("Configuration base", () => {
  it("baseUrl est défini", () => {
    assert.ok(baseUrl.startsWith("http"));
  });
});
