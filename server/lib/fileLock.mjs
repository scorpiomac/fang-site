import fs from "node:fs";
import path from "node:path";

/**
 * Verrou de fichier simple via création exclusive d'un .lock voisin.
 * Boucle d'attente courte avec back-off ; abandonne après `timeoutMs`.
 */
export function withFileLock(filePath, fn, { timeoutMs = 3000, retryMs = 10 } = {}) {
  const lockPath = `${filePath}.lock`;
  const start = Date.now();
  // Acquérir
  // O_EXCL crée le fichier seulement si absent → fail si déjà pris.
  while (true) {
    try {
      const fd = fs.openSync(lockPath, "wx");
      fs.writeSync(fd, String(process.pid));
      fs.closeSync(fd);
      break;
    } catch (err) {
      if (err.code !== "EEXIST") throw err;
      // Lock orphelin ? Si plus vieux que le timeout, on l'écrase.
      try {
        const st = fs.statSync(lockPath);
        if (Date.now() - st.mtimeMs > timeoutMs * 2) {
          fs.unlinkSync(lockPath);
          continue;
        }
      } catch {
        /* ignore */
      }
      if (Date.now() - start > timeoutMs) {
        throw new Error(`File lock timeout: ${path.basename(filePath)}`);
      }
      // attente courte (busy wait synchrone via Atomics.wait sur SharedArrayBuffer non dispo en module standard → on simule via deasync minimal)
      const end = Date.now() + retryMs;
      while (Date.now() < end) {
        /* spin */
      }
    }
  }
  try {
    return fn();
  } finally {
    try {
      fs.unlinkSync(lockPath);
    } catch {
      /* ignore */
    }
  }
}
