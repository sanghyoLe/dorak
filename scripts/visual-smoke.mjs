import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

import puppeteer from "puppeteer-core";

const chromePath =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const outputDir =
  process.env.DORAK_SCREENSHOT_DIR ?? "/private/tmp/dorak-visual";
const baseUrl = process.env.DORAK_BASE_URL ?? "http://localhost:3000";
const branchResponse = await fetch(`${baseUrl}/api/v1/branches?limit=20`);
assert.equal(branchResponse.status, 200, "branch fixture request failed");
const branchPayload = await branchResponse.json();
const detailBranch = branchPayload.data?.[0];
assert.ok(detailBranch, "visual smoke requires at least one public branch");
const nearbyOrigin = branchPayload.data?.find(
  (branch) =>
    typeof branch.latitude === "number" && typeof branch.longitude === "number",
);
assert.ok(nearbyOrigin, "visual smoke requires a coordinate-bearing branch");
const detailUrl = `${baseUrl}/restaurants/${detailBranch.publicId}`;

const targets = [
  { name: "web-320", url: baseUrl, width: 320, height: 900 },
  { name: "web-375", url: baseUrl, width: 375, height: 900 },
  { name: "web-414", url: baseUrl, width: 414, height: 900 },
  { name: "web-768", url: baseUrl, width: 768, height: 1000 },
  { name: "web-1280", url: baseUrl, width: 1280, height: 800 },
  { name: "web-1440", url: baseUrl, width: 1440, height: 1000 },
  { name: "detail-320", url: detailUrl, width: 320, height: 900 },
  { name: "detail-375", url: detailUrl, width: 375, height: 900 },
  { name: "detail-414", url: detailUrl, width: 414, height: 900 },
  { name: "detail-768", url: detailUrl, width: 768, height: 1000 },
  ...[320, 375, 414, 768].map((width) => ({
    name: `review-policy-${width}`,
    url: `${baseUrl}/review-policy`,
    width,
    height: 1000,
  })),
  ...[320, 375, 414, 768].map((width) => ({
    name: `saved-${width}`,
    url: `${baseUrl}/saved`,
    width,
    height: 1000,
  })),
  ...[320, 375, 414, 768].map((width) => ({
    name: `nearby-${width}`,
    url: `${baseUrl}/nearby`,
    width,
    height: 1000,
  })),
  { name: "detail-1440", url: detailUrl, width: 1440, height: 1000 },
  {
    name: "ops-375",
    url: `${baseUrl}/ops`,
    width: 375,
    height: 900,
  },
  {
    name: "ops-1440",
    url: `${baseUrl}/ops`,
    width: 1440,
    height: 1000,
  },
  {
    name: "privacy-375",
    url: `${baseUrl}/privacy`,
    width: 375,
    height: 900,
  },
  {
    name: "privacy-1440",
    url: `${baseUrl}/privacy`,
    width: 1440,
    height: 1000,
  },
];

const opsUsername = process.env.DORAK_OPS_USERNAME;
const opsPassword = process.env.DORAK_OPS_PASSWORD;

await mkdir(outputDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: true,
  args: ["--disable-gpu", "--no-first-run"],
});

try {
  await browser
    .defaultBrowserContext()
    .overridePermissions(baseUrl, ["geolocation"]);

  for (const target of targets) {
    const page = await browser.newPage();
    await page.setViewport({
      width: target.width,
      height: target.height,
      deviceScaleFactor: 1,
      isMobile: target.width < 768,
      hasTouch: target.width < 768,
    });
    if (target.url.includes("/ops") && opsUsername && opsPassword) {
      await page.authenticate({ username: opsUsername, password: opsPassword });
    }
    if (target.url.endsWith("/nearby")) {
      await page.setGeolocation({
        latitude: nearbyOrigin.latitude,
        longitude: nearbyOrigin.longitude,
      });
    }
    const response = await page.goto(target.url, { waitUntil: "networkidle0" });
    assert.equal(
      response?.status(),
      200,
      `${target.name}: page returned an error`,
    );

    if (target.url.endsWith("/nearby")) {
      await page.click(".nearby-locate-button");
      await page.waitForSelector(".nearby-list");
      const firstDistance = await page.$eval(
        ".nearby-list__distance strong",
        (element) => element.textContent?.trim(),
      );
      assert.equal(
        firstDistance,
        "10m",
        `${target.name}: nearest result drifted`,
      );
    }

    const audit = await page.evaluate(() => {
      const root = document.documentElement;
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const context = canvas.getContext("2d", { willReadFrequently: true });

      function toRgba(color) {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
        return [...context.getImageData(0, 0, 1, 1).data];
      }

      function effectiveBackground(element) {
        let current = element;
        while (current) {
          const color = toRgba(getComputedStyle(current).backgroundColor);
          if (color[3] > 250) return color;
          current = current.parentElement;
        }
        return [255, 255, 255, 255];
      }

      function luminance([red, green, blue]) {
        const channels = [red, green, blue].map((value) => {
          const channel = value / 255;
          return channel <= 0.04045
            ? channel / 12.92
            : ((channel + 0.055) / 1.055) ** 2.4;
        });
        return (
          0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
        );
      }

      function contrast(foreground, background) {
        const foregroundLuminance = luminance(foreground);
        const backgroundLuminance = luminance(background);
        return (
          (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
          (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
        );
      }

      const wrappedAffordances = [...document.querySelectorAll("a, button")]
        .filter((element) => {
          const textNodes = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
          );
          let current = textNodes.nextNode();
          while (current) {
            if (current.textContent?.trim()) {
              const range = document.createRange();
              range.selectNodeContents(current);
              if (range.getClientRects().length > 1) return true;
            }
            current = textNodes.nextNode();
          }
          return false;
        })
        .map((element) => element.textContent?.trim() ?? "");

      const contrastViolations = [...document.querySelectorAll("body *")]
        .filter((element) => {
          const style = getComputedStyle(element);
          if (style.display === "none" || style.visibility === "hidden")
            return false;
          if (element.matches(":disabled")) return false;
          if (element.tagName.toLowerCase() === "svg") return true;
          return [...element.childNodes].some(
            (node) =>
              node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
          );
        })
        .map((element) => {
          const style = getComputedStyle(element);
          const foreground = toRgba(style.color);
          const background = effectiveBackground(element);
          const ratio = contrast(foreground, background);
          const fontSize = Number.parseFloat(style.fontSize);
          const fontWeight = Number.parseInt(style.fontWeight, 10) || 400;
          const isIcon = element.tagName.toLowerCase() === "svg";
          const isLarge =
            fontSize >= 24 || (fontSize >= 18 && fontWeight >= 700);
          const threshold = isIcon || isLarge ? 3 : 4.5;
          return {
            selector: `${element.tagName.toLowerCase()}.${element.className || ""}`,
            text: element.textContent?.trim().slice(0, 50) ?? "icon",
            ratio,
            threshold,
          };
        })
        .filter((result) => result.ratio + 0.01 < result.threshold);

      return {
        clientWidth: root.clientWidth,
        scrollWidth: root.scrollWidth,
        wrappedAffordances,
        contrastViolations,
      };
    });

    assert.equal(
      audit.scrollWidth,
      audit.clientWidth,
      `${target.name}: root horizontal overflow (${audit.scrollWidth} > ${audit.clientWidth})`,
    );
    assert.deepEqual(
      audit.wrappedAffordances,
      [],
      `${target.name}: clickable label wrapped`,
    );
    assert.deepEqual(
      audit.contrastViolations,
      [],
      `${target.name}: text or icon contrast failed`,
    );

    await page.screenshot({
      path: `${outputDir}/${target.name}.png`,
      fullPage: true,
    });
    console.log(
      `${target.name}: ${audit.clientWidth}px, overflow/wrap/contrast passed`,
    );
    await page.close();
  }

  const web = await browser.newPage();
  await web.setViewport({ width: 375, height: 900, deviceScaleFactor: 1 });
  await web.setRequestInterception(true);
  web.on("request", (request) => {
    const url = new URL(request.url());
    if (
      url.pathname === "/api/v1/saved" ||
      (url.pathname.startsWith("/api/v1/branches/") &&
        url.pathname.endsWith("/saved"))
    ) {
      void request.respond({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: { code: "SIGN_IN_REQUIRED" } }),
      });
      return;
    }
    void request.continue();
  });
  await web.goto(baseUrl, { waitUntil: "networkidle0" });
  await web.type("#branch-search", detailBranch.name);
  await web.click(".home-search .search-button");
  await web.waitForFunction(() => window.location.pathname === "/r");
  await web.waitForSelector(".result-heading");
  const resultSummary = await web.$eval(".result-heading", (element) =>
    element.textContent?.replace(/\s+/g, " ").trim(),
  );
  assert.match(resultSummary ?? "", /[1-9][0-9,]*곳/);
  await web.click(".save-button");
  await web.waitForFunction(
    (publicId) => {
      const stored = window.localStorage.getItem("dorak:saved-branches:v1");
      return stored ? JSON.parse(stored).includes(publicId) : false;
    },
    {},
    detailBranch.publicId,
  );
  const saveLabel = await web.$eval(".save-button", (element) =>
    element.textContent?.trim(),
  );
  assert.equal(saveLabel, "저장됨");
  await web.click(".restaurant-main h3 a");
  await web.waitForSelector(".branch-heading h1");
  const detailHeading = await web.$eval(".branch-heading h1", (element) =>
    element.textContent?.trim(),
  );
  assert.equal(detailHeading, detailBranch.name);
  console.log("web-interaction: search, save, and detail navigation passed");
  await web.close();

  const saved = await browser.newPage();
  await saved.setViewport({ width: 375, height: 900, deviceScaleFactor: 1 });
  await saved.goto(`${baseUrl}/saved`, {
    waitUntil: "networkidle0",
  });
  await saved.waitForSelector(".saved-restaurant-list");
  const savedCount = await saved.$eval(
    ".saved-page__heading > span",
    (element) => element.textContent?.trim(),
  );
  assert.equal(savedCount, "1곳");
  await saved.click(".saved-restaurant-list .save-button");
  await saved.waitForSelector(".saved-page__empty");
  const emptySavedCount = await saved.$eval(
    ".saved-page__heading > span",
    (element) => element.textContent?.trim(),
  );
  assert.equal(emptySavedCount, "0곳");
  console.log("saved-interaction: local list, count, and removal passed");
  await saved.close();

  const ops = await browser.newPage();
  if (opsUsername && opsPassword) {
    await ops.authenticate({ username: opsUsername, password: opsPassword });
  }
  await ops.setViewport({ width: 375, height: 900, deviceScaleFactor: 1 });
  await ops.setRequestInterception(true);
  ops.on("request", (request) => {
    if (
      request.method() === "POST" &&
      request.url().includes("/api/v1/ops/candidates/")
    ) {
      void request.respond({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { status: "approved" } }),
      });
      return;
    }

    void request.continue();
  });
  await ops.goto(`${baseUrl}/ops`, { waitUntil: "networkidle0" });
  const before = await ops.$$eval(".candidate", (elements) => elements.length);
  if (before > 0) {
    await ops.click(".decision-button--approve");
    await ops.waitForFunction(
      (expected) => document.querySelectorAll(".candidate").length === expected,
      {},
      before - 1,
    );
    const after = await ops.$$eval(".candidate", (elements) => elements.length);
    assert.equal(after, before - 1);
    console.log(`ops-interaction: approve changed queue ${before} → ${after}`);
  } else {
    console.log(
      "ops-interaction: skipped; no pending candidate in current data",
    );
  }
  await ops.close();
} finally {
  await browser.close();
}
