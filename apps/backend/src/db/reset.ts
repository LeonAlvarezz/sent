import { Database } from "bun:sqlite";
import { existsSync, readdirSync, rmSync, writeFileSync, unlinkSync } from "fs";
import { join, resolve } from "path";
import { execSync } from "child_process";
import { applyLocalMigrations, seed } from "./seed";

const TABLES_TO_DROP = [
  "campaign_queue",
  "campaign",
  "__new_campaign",
  "outreach_log",
  "email",
  "email_list",
  "seo_partner",
  "sender_identity",
  "pitch_profile",
  "user_settings",
  "session",
  "account",
  "two_factor",
  "verification",
  "user",
  "__new_user",
  "d1_migrations",
];

export interface ResetOptions {
  remote?: boolean;
}

export async function resetDatabase(options?: ResetOptions) {
  const isRemote = options?.remote ?? process.argv.includes("--remote");
  const backendDir = resolve(__dirname, "../../");
  const migrationsDir = resolve(__dirname, "../../d1-migrations");

  if (isRemote) {
    console.log("⚠️  Resetting REMOTE D1 database (sent-db)...");

    const dropStatements = [
      "PRAGMA foreign_keys = OFF;",
      ...TABLES_TO_DROP.map((table) => `DROP TABLE IF EXISTS \`${table}\`;`),
      "PRAGMA foreign_keys = ON;",
    ].join("\n");

    const tempDropFile = resolve(__dirname, `.drop.${Date.now()}.tmp.sql`);
    try {
      writeFileSync(tempDropFile, dropStatements, "utf8");
      console.log("🗑️  Dropping all remote tables...");
      execSync(`wrangler d1 execute sent-db --remote -y --file="${tempDropFile}"`, {
        cwd: backendDir,
        stdio: "inherit",
      });
      console.log("✅ Remote tables dropped.");
    } finally {
      if (existsSync(tempDropFile)) {
        unlinkSync(tempDropFile);
      }
    }

    console.log("📦 Applying remote migrations...");
    execSync("wrangler d1 migrations apply sent-db --remote", {
      cwd: backendDir,
      stdio: "inherit",
    });

    console.log("🌱 Seeding remote database...");
    await seed({ remote: true });

    console.log("\n✨ Remote database reset, migrated, and seeded successfully!");
  } else {
    console.log("🔄 Resetting LOCAL D1 database...");

    const d1Dir = resolve(
      __dirname,
      "../../.wrangler/state/v3/d1/miniflare-D1DatabaseObject",
    );
    let localResetDone = false;

    if (existsSync(d1Dir)) {
      const sqliteFiles = readdirSync(d1Dir).filter(
        (f) => f.endsWith(".sqlite") && f !== "metadata.sqlite",
      );

      for (const file of sqliteFiles) {
        const dbPath = join(d1Dir, file);
        try {
          const db = new Database(dbPath);
          console.log(`🗑️  Dropping all tables in local SQLite: ${file}`);
          db.run("PRAGMA foreign_keys = OFF;");
          for (const table of TABLES_TO_DROP) {
            db.run(`DROP TABLE IF EXISTS \`${table}\`;`);
          }
          db.run("PRAGMA foreign_keys = ON;");

          console.log("📦 Applying local migrations...");
          applyLocalMigrations(db, migrationsDir);
          db.close();
          localResetDone = true;
        } catch (err) {
          console.warn(`⚠️ Could not reset local database at ${dbPath}:`, err);
        }
      }
    }

    if (!localResetDone) {
      // If miniflare state was missing or failed, wipe and let wrangler handle it
      const parentD1Dir = resolve(backendDir, ".wrangler/state/v3/d1");
      if (existsSync(parentD1Dir)) {
        rmSync(parentD1Dir, { recursive: true, force: true });
        console.log("🧹 Cleaned local D1 state directory");
      }
      try {
        console.log("📦 Applying local migrations via wrangler...");
        execSync("wrangler d1 migrations apply sent-db --local", {
          cwd: backendDir,
          stdio: "inherit",
        });
      } catch (err) {
        console.warn("⚠️ wrangler migration fallback encountered an issue:", err);
      }
    }

    console.log("🌱 Seeding local database...");
    await seed({ remote: false });

    console.log("\n✨ Local database reset, migrated, and seeded successfully!");
  }
}

if (import.meta.main) {
  resetDatabase().catch((err) => {
    console.error("❌ Reset failed:", err);
    process.exit(1);
  });
}
