import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiDir = path.resolve(__dirname, "..");
const localNodeModules = path.resolve(apiDir, "node_modules");

function ensurePackage(pkgName, targetRelPath) {
  let sourceDir = null;
  try {
    const req = createRequire(import.meta.url);
    const pkgPath = req.resolve(`${pkgName}/package.json`);
    sourceDir = path.dirname(pkgPath);
  } catch {
    const candidates = [
      path.resolve(apiDir, `../node_modules/${pkgName}`),
      path.resolve(apiDir, `../../node_modules/${pkgName}`),
      path.resolve(apiDir, `node_modules/${pkgName}`),
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        sourceDir = c;
        break;
      }
    }
  }

  if (!sourceDir) {
    console.warn(`[ensure-prisma] Could not locate package: ${pkgName}`);
    return;
  }

  const targetDir = path.resolve(localNodeModules, targetRelPath);

  // If source and target are the same physical path, nothing to do
  if (path.resolve(sourceDir) === path.resolve(targetDir)) {
    console.log(`[ensure-prisma] Package ${pkgName} already in place at ${targetDir}`);
    return;
  }

  fs.mkdirSync(path.dirname(targetDir), { recursive: true });

  try {
    if (fs.existsSync(targetDir)) {
      if (fs.existsSync(path.join(targetDir, "package.json"))) {
        return;
      }
      fs.rmSync(targetDir, { recursive: true, force: true });
    }

    fs.cpSync(sourceDir, targetDir, { recursive: true, dereference: true });
    console.log(`[ensure-prisma] Copied ${pkgName} -> ${targetDir}`);
  } catch (err) {
    console.warn(`[ensure-prisma] Error copying ${pkgName}:`, err.message);
  }
}

// Ensure @prisma/client, @prisma/client-runtime-utils, and prisma CLI are in api/node_modules
ensurePackage("@prisma/client", "@prisma/client");
ensurePackage("@prisma/client-runtime-utils", "@prisma/client-runtime-utils");
ensurePackage("prisma", "prisma");
