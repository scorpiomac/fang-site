#!/usr/bin/env node
/**
 * Script CLI pour les backups data/.
 *
 * Usage :
 *   node scripts/backup.mjs create        # crée un backup maintenant
 *   node scripts/backup.mjs list          # liste les backups disponibles
 *   node scripts/backup.mjs restore <fichier>   # restaure un backup (snapshot avant)
 */
import { createBackup, listBackups, restoreBackup } from "../server/lib/backup.mjs";

const [, , cmd, ...args] = process.argv;

async function main() {
  switch (cmd) {
    case "create": {
      const file = await createBackup();
      console.log(`✓ Backup créé : ${file}`);
      break;
    }
    case "list": {
      const list = listBackups();
      if (!list.length) {
        console.log("Aucun backup.");
        return;
      }
      for (const b of list) {
        console.log(`${b.name}  (${(b.size / 1024).toFixed(1)} ko, ${b.createdAt})`);
      }
      break;
    }
    case "restore": {
      const name = args[0];
      if (!name) {
        console.error("Usage: restore <nom-du-fichier>");
        process.exit(1);
      }
      const r = await restoreBackup(name);
      console.log(`✓ Restauration de ${r.restoredFiles.length} fichier(s).`);
      console.log(`  Snapshot des fichiers précédents : ${r.snapshotDir}`);
      break;
    }
    default:
      console.log(`Usage:
  node scripts/backup.mjs create
  node scripts/backup.mjs list
  node scripts/backup.mjs restore <fichier>`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
