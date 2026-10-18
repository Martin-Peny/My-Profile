import { expect, test } from "@playwright/test";

test("navigation models render lazily, follow the pointer, reset, and keep keyboard navigation", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".profile-art canvas")).toHaveCount(0);
  await page.locator(".profile-grid").scrollIntoViewIfNeeded();
  const cards = page.locator(".profile-card");
  for (const card of await cards.all()) {
    const art = card.locator(".profile-art");
    await expect(art).toHaveAttribute("data-ready", "true");
    await expect(art.locator(".profile-object")).toBeHidden();
    const canvas = art.locator("canvas");
    await expect(canvas).toHaveAttribute("data-rendered", "true");
    const frame = await canvas.getAttribute("data-frame");
    await expect.poll(() => canvas.getAttribute("data-frame")).not.toBe(frame);
    const rect = (await card.boundingBox())!;
    await page.mouse.move(rect.x + rect.width * .95, rect.y + rect.height * .2);
    await expect.poll(async () => Number(await art.getAttribute("data-yaw"))).toBeGreaterThan(8);
    await expect.poll(async () => Number(await art.getAttribute("data-pitch"))).toBeLessThan(-3);
    expect(Number(await art.getAttribute("data-yaw"))).toBeLessThanOrEqual(10);
    expect(Math.abs(Number(await art.getAttribute("data-pitch")))).toBeLessThanOrEqual(6);
    await expect.poll(async () => Number(await art.getAttribute("data-highlight"))).toBeGreaterThan(.9);
    await page.mouse.move(2, 110);
    await expect.poll(async () => Math.abs(Number(await art.getAttribute("data-yaw")))).toBeLessThan(.05);
    await expect.poll(async () => Math.abs(Number(await art.getAttribute("data-pitch")))).toBeLessThan(.05);
  }
  await cards.first().focus();
  await page.keyboard.press("Tab");
  await expect(cards.nth(1)).toBeFocused();
  await expect.poll(async () => Number(await cards.nth(1).locator(".profile-art").getAttribute("data-highlight"))).toBeGreaterThan(.9);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#my-life$/);
  await expect(page.locator("#my-life")).toBeFocused();
  expect(errors).toEqual([]);
});

test("navigation animation pauses offscreen and in background, and restores a lost context", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  await page.locator(".profile-grid").scrollIntoViewIfNeeded();
  const art = page.locator(".profile-art").first();
  const canvas = art.locator("canvas");
  await expect(art).toHaveAttribute("data-ready", "true");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(art).toHaveAttribute("data-motion", "paused");
  const backgroundFrame = await canvas.getAttribute("data-frame");
  await page.waitForTimeout(180);
  await expect(canvas).toHaveAttribute("data-frame", backgroundFrame!);
  await page.evaluate(() => {
    Reflect.deleteProperty(document, "hidden");
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(art).toHaveAttribute("data-motion", "running");
  await expect.poll(() => canvas.getAttribute("data-frame")).not.toBe(backgroundFrame);
  await page.evaluate(() => document.getElementById("academic-experience")!.scrollIntoView({ behavior: "instant" }));
  await expect(art).toHaveAttribute("data-motion", "paused");
  const pausedFrame = await canvas.getAttribute("data-frame");
  await page.waitForTimeout(180);
  await expect(canvas).toHaveAttribute("data-frame", pausedFrame!);
  await page.locator(".profile-grid").scrollIntoViewIfNeeded();
  await expect(art).toHaveAttribute("data-motion", "running");
  await canvas.evaluate(element => {
    const extension = (element as HTMLCanvasElement).getContext("webgl2")!.getExtension("WEBGL_lose_context")!;
    Object.assign(window, { navigationContext: extension });
    extension.loseContext();
  });
  await expect(art).toHaveAttribute("data-ready", "false");
  await expect(art.locator(".profile-object")).toBeVisible();
  await expect(canvas).toBeHidden();
  await page.evaluate(() => (window as unknown as { navigationContext: WEBGL_lose_context }).navigationContext.restoreContext());
  await expect(art).toHaveAttribute("data-ready", "true");
  await expect(canvas).toHaveCount(1);
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute("data-rendered", "true");
  expect(errors).toEqual([]);
});

test("reduced motion keeps static SVGs and can toggle without duplicating WebGL canvases", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator(".profile-grid").scrollIntoViewIfNeeded();
  for (let cycle = 0; cycle < 2; cycle++) {
    for (const art of await page.locator(".profile-art").all()) {
      await expect(art).toHaveAttribute("data-motion", "static");
      await expect(art.locator("canvas")).toHaveCount(0);
      await expect(art.locator(".profile-object")).toBeVisible();
    }
    await page.emulateMedia({ reducedMotion: "no-preference" });
    for (const art of await page.locator(".profile-art").all()) {
      await expect(art).toHaveAttribute("data-ready", "true");
      await expect(art.locator("canvas")).toHaveCount(1);
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
  }
});

test("3D card illustrations fit desktop, tablet, and phones", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const art of await page.locator(".profile-art").all()) {
      await art.scrollIntoViewIfNeeded();
      await expect(art).toHaveAttribute("data-ready", "true");
      const box = (await art.boundingBox())!;
      expect(box.width / box.height).toBeCloseTo(360 / 260, 2);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
      await expect(art.locator("canvas")).toBeVisible();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.mouse.move(2, 110);
    // Section captures include offscreen models' most recent frames, not static fallbacks.
    await page.locator("#explore").screenshot({
      path: `artifacts/navigation-webgl-${width}.png`,
      style: ".signal-ticker, .background-music, .skip-link { visibility: hidden !important; }",
    });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  const card = page.locator(".profile-card").nth(1);
  await card.scrollIntoViewIfNeeded();
  const rect = (await card.boundingBox())!;
  await page.mouse.move(rect.x + rect.width * .9, rect.y + rect.height * .25);
  await expect.poll(async () => Number(await card.locator(".profile-art").getAttribute("data-yaw"))).toBeGreaterThan(7);
  await page.locator(".profile-grid").screenshot({ path: "artifacts/navigation-webgl-hover.png" });
});

test("touch swipes on a card scroll normally and do not rotate the model", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:5199/");
  const art = page.locator(".profile-art").first();
  await art.scrollIntoViewIfNeeded();
  await expect(art).toHaveAttribute("data-ready", "true");
  const frame = await art.locator("canvas").getAttribute("data-frame");
  await expect.poll(() => art.locator("canvas").getAttribute("data-frame")).not.toBe(frame);
  const rect = (await art.boundingBox())!;
  const x = rect.x + rect.width / 2;
  const y = rect.y + rect.height * .7;
  const before = await page.evaluate(() => scrollY);
  const session = await context.newCDPSession(page);
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  for (let n = 1; n <= 6; n++) {
    await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y - n * 22 }] });
  }
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before + 30);
  await expect(art).toHaveAttribute("data-yaw", "0.000");
  await expect(art).toHaveAttribute("data-pitch", "0.000");
  await expect(page).not.toHaveURL(/#introduction$/);
  await context.close();
});
