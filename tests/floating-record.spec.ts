import { expect, test, type Page } from "@playwright/test";

test.use({ baseURL: "http://127.0.0.1:5200", launchOptions: { args: ["--autoplay-policy=document-user-activation-required"] } });
const fixture = "/tests/fixtures/music-player.html";
const circle = (page: Page) => page.locator(".music-record-toggle");

async function drag(page: Page, x: number, y: number) {
  const bounds = (await circle(page).boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(x, y, { steps: 12 });
  await page.mouse.up();
}

async function expectInViewport(page: Page, selector: string) {
  const viewport = page.viewportSize()!;
  await expect.poll(async () => {
    const b = (await page.locator(selector).boundingBox())!;
    return b.x >= 0 && b.y >= 0 && b.x + b.width <= viewport.width + .5 && b.y + b.height <= viewport.height + .5;
  }).toBe(true);
}

for (const width of [390, 1440]) {
  for (const locale of ["en", "zh"]) {
    test(`record starts left-center and drags without opening (${locale}, ${width}px)`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(`${fixture}?lang=${locale}`);
      const initial = (await circle(page).boundingBox())!;
      expect(initial.x).toBe(width <= 760 ? 12 : 20);
      expect(initial.y + initial.height / 2).toBe(450);
      await drag(page, width - 80, 650);
      await expect(page.locator(".music-panel")).toBeHidden();
      const moved = (await circle(page).boundingBox())!;
      expect(moved.x).toBeGreaterThan(initial.x);
      expect(moved.y).toBeGreaterThan(initial.y);
      await circle(page).click();
      await expect(page.locator(".music-panel")).toBeVisible();
      await expectInViewport(page, ".music-panel");
      await page.locator(".music-main-play").click();
      await expect(page.locator(".background-music")).toHaveAttribute("data-playing", "true");
      await page.locator("audio").evaluate((a: HTMLAudioElement) => { a.dataset.retained = "yes"; a.currentTime = 12; });
      await drag(page, 100, 160);
      await expect(page.locator(".music-panel")).toBeVisible();
      await expectInViewport(page, ".music-panel");
      await expect(page.locator("audio")).toHaveAttribute("data-retained", "yes");
      await expect(page.locator("audio")).toHaveJSProperty("paused", false);
      await page.getByRole("button", { name: locale === "en" ? "切换为中文" : "Switch to English" }).click();
      const retained = (await circle(page).boundingBox())!;
      expect(retained.x).toBeCloseTo(100 - retained.width / 2);
      expect(retained.y).toBeCloseTo(160 - retained.height / 2);
      await page.screenshot({ path: `artifacts/floating-record-dragged-${locale}-${width}.png` });
      await circle(page).click();
      await expect(page.locator(".music-panel")).toBeHidden();
      await page.reload();
      const reset = (await circle(page).boundingBox())!;
      expect(reset.x).toBe(initial.x);
      expect(reset.y).toBe(initial.y);
      expect(errors).toEqual([]);
    });
  }
}

test("edges, scrolling, resize and keyboard activation keep the circle and playlist reachable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(fixture);
  for (const [x, y] of [[0, 0], [1440, 0], [1440, 900], [0, 900]]) {
    await drag(page, x, y);
    await expect(page.locator(".music-panel")).toBeHidden();
    await expectInViewport(page, ".music-record-toggle");
    await circle(page).click();
    await expectInViewport(page, ".music-panel");
    await circle(page).click();
  }
  await drag(page, 1300, 800);
  await page.setViewportSize({ width: 320, height: 568 });
  await expectInViewport(page, ".music-record-toggle");
  await circle(page).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".music-panel")).toBeVisible();
  await expectInViewport(page, ".music-panel");
  await page.getByRole("searchbox").focus();
  await page.keyboard.press("Escape");
  await expect(circle(page)).toBeFocused();
  const beforeScroll = await circle(page).boundingBox();
  await page.evaluate(() => { document.body.style.minHeight = "2400px"; window.scrollTo(0, 600); });
  expect(await circle(page).boundingBox()).toEqual(beforeScroll);
  await page.keyboard.press("Space");
  await expect(page.locator(".music-panel")).toBeVisible();
  await expectInViewport(page, ".music-panel");
  await page.setViewportSize({ width: 667, height: 375 });
  await expectInViewport(page, ".music-record-toggle");
  await expectInViewport(page, ".music-panel");
});

test("touch drag does not scroll the page or open the playlist; tap and cancelled gestures still work", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:5200${fixture}`);
  await page.evaluate(() => document.body.style.minHeight = "2400px");
  const session = await context.newCDPSession(page);
  const initial = (await circle(page).boundingBox())!;
  const start = { x: initial.x + initial.width / 2, y: initial.y + initial.height / 2 };
  const touch = (type: string, x = 0, y = 0) => session.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" || type === "touchCancel" ? [] : [{ x, y, id: 1 }] });
  await touch("touchStart", start.x, start.y);
  await touch("touchMove", 200, 220);
  await touch("touchEnd");
  await expect(page.locator(".music-panel")).toBeHidden();
  expect(await page.evaluate(() => scrollY)).toBe(0);
  const moved = (await circle(page).boundingBox())!;
  expect(moved.x).toBeGreaterThan(initial.x + 80);
  expect(moved.y).toBeLessThan(initial.y - 80);
  await circle(page).tap();
  await expect(page.locator(".music-panel")).toBeVisible();
  await expectInViewport(page, ".music-panel");
  await circle(page).tap();
  await touch("touchStart", moved.x + moved.width / 2, moved.y + moved.height / 2);
  await touch("touchMove", 250, 300);
  await touch("touchCancel");
  await expect(page.locator(".background-music")).toHaveAttribute("data-dragging", "false");
  await circle(page).tap();
  await expect(page.locator(".music-panel")).toBeVisible();
  await context.close();
});
