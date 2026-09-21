import { readFile } from "node:fs/promises";

const required = [
  "index.html",
  "assets/styles.css",
  "assets/app.js",
  "assets/shield.svg",
  "manifest.webmanifest",
  "sw.js"
];

const contents = Object.fromEntries(
  await Promise.all(required.map(async (file) => [file, await readFile(file, "utf8")]))
);

const failures = [];

for (const [file, content] of Object.entries(contents)) {
  if (!content.trim()) failures.push(file + " is empty");
}

if (!contents["index.html"].includes('id="openCaseButton"')) {
  failures.push("new case entry point missing");
}

if (!contents["index.html"].includes('id="trendChart"')) {
  failures.push("trend chart missing");
}

if (!contents["assets/app.js"].includes("localStorage")) {
  failures.push("local persistence missing");
}

if (/eval\s*\(|new\s+Function\s*\(/.test(contents["assets/app.js"])) {
  failures.push("dynamic code execution detected");
}

if (failures.length) {
  console.error("Smoke checks failed:");
  failures.forEach((failure) => console.error(" - " + failure));
  process.exit(1);
}

console.log("SOC DASH smoke checks passed.");
