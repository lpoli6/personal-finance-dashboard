import { execSync } from "child_process";
import * as path from "path";

const scripts = [
  "seed-overview.ts",
  "seed-subscriptions.ts",
  "seed-budget.ts",
  "seed-planned-expenses.ts",
  "seed-property.ts",
];

console.log("=== Running all seed scripts ===\n");

for (const script of scripts) {
  const scriptPath = path.resolve(__dirname, script);
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Running: ${script}`);
  console.log("=".repeat(60));

  try {
    execSync(`npx tsx --env-file=.env.local "${scriptPath}"`, {
      stdio: "inherit",
      cwd: path.resolve(__dirname, "../.."),
    });
  } catch (error) {
    console.error(`\n✗ ${script} failed!`);
    process.exit(1);
  }
}

console.log(`\n${"=".repeat(60)}`);
console.log("All seed scripts completed successfully ✓");
console.log("=".repeat(60));
