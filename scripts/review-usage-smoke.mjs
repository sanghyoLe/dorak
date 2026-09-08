import assert from "node:assert/strict";
import puppeteer from "puppeteer-core";

// Only run against a freshly started, isolated demo server. Never publish test reviews to Postgres.
const origin = "http://localhost:3000";
const health = await (await fetch(`${origin}/api/health`)).json();
assert.equal(health.data.dataMode, "memory");
const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH ??
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});

try {
  const page = await browser.newPage();
  const cases = [
    ["delivery", "br_Zk8sD1mP4qR7vT2xN5cA"],
    ["takeout", "br_R5tM1aX8gK3dP7vN2qWc"],
    ["dine_in", "br_C9hS4zJ1uE7mL2kF6pGa"],
  ];
  for (const [usageType, branch] of cases) {
    const url = `${origin}/restaurants/${branch}`;
    await page.goto(url, { waitUntil: "networkidle0" });
    await page.type('[name="authorName"]', "이용방식테스터");
    await page.type(
      '[name="body"]',
      "직접 먹은 메뉴의 맛과 온도, 포장 상태를 확인하는 로컬 테스트 리뷰입니다.",
    );
    await page.$eval('[name="visitedOn"]', (element) => {
      element.value = "2026-09-01";
    });
    await page.click('[name="rating"][value="4"]');
    await page.click('[name="visitAttested"]');
    await page.click('[name="independentVisitAttested"]');
    assert.equal(
      await page.$eval(".review-form", (form) => form.checkValidity()),
      false,
    );
    await page.select('[name="usageType"]', usageType);
    assert.equal(
      await page.$eval(".review-form", (form) => form.checkValidity()),
      true,
    );
    if (usageType !== "dine_in") {
      assert.match(
        await page.$eval('[name="body"]', (element) => element.placeholder),
        /포장 상태/,
      );
    }
    const responsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url().endsWith("/reviews"),
    );
    await page.click('.review-form button[type="submit"]');
    const response = await responsePromise;
    assert.equal(response.status(), 201);
    const persisted = await (
      await fetch(`${origin}/api/v1/branches/${branch}/reviews`)
    ).json();
    assert.equal(
      persisted.data.find((review) => review.authorName === "이용방식테스터")
        ?.usageType,
      usageType,
    );
    await page.waitForFunction(() =>
      document.querySelector('.review-form__submit [data-state="success"]'),
    );
    assert.equal(
      await page.$eval('[name="usageType"]', (element) => element.value),
      "",
    );
    await page.goto(`${url}?usage=${usageType}#reviews`, {
      waitUntil: "networkidle0",
    });
    assert.equal(
      await page.$$eval(".review-list > li", (items) => items.length),
      1,
    );
    assert.match(
      await page.$eval(
        '.review-usage-filter [aria-current="page"]',
        (element) => element.textContent,
      ),
      /4.0점 · 1건/,
    );

    for (const width of [320, 375, 414, 768]) {
      await page.setViewport({ width, height: 900 });
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      );
      assert.equal(overflow, false, `${usageType} at ${width}: overflow`);
      await page.screenshot({
        path: `/private/tmp/dorak-visual/usage-${usageType}-${width}.png`,
        fullPage: true,
      });
    }
    await page.click('.review-usage-filter a[href*="usage=unknown"]');
    await page.waitForFunction(
      () => new URL(location.href).searchParams.get("usage") === "unknown",
    );
    assert.equal(
      await page.$$eval(".review-entry__body", (items) =>
        items.some((element) => element.textContent.includes("로컬 테스트")),
      ),
      false,
    );
    console.log(
      `${usageType}: required input, submit, reset, separate score, filter and mobile passed`,
    );
  }
} finally {
  await browser.close();
}
