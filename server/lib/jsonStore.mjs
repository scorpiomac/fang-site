import fs from "node:fs";
import path from "node:path";

export function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

export function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", { mode: 0o600 });
}

export function ensureFile(file, defaultValue) {
  if (!fs.existsSync(file)) writeJson(file, defaultValue);
}
