import { readFileSync } from "fs";

// Read .env manually (no dependency needed)
const env = Object.fromEntries(
  readFileSync(".env", "utf-8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => l.split("=").map((s) => s.trim()))
);

const token = env.REFRESH_SECRET;
if (!token) {
  console.error("REFRESH_SECRET not found in .env");
  process.exit(1);
}

const url = `https://llm-prices.llm-prices.workers.dev/api/refresh?token=${token}`;
console.log("Refreshing model prices...");

const res = await fetch(url, { method: "POST" });
const data = await res.json();
console.log(JSON.stringify(data, null, 2));

if (!data.ok) process.exit(1);
