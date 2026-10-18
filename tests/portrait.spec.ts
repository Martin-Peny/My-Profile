import { expect, test } from "@playwright/test";

test("portrait responds to hover, bounded dragging and keyboard, then rests", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  const portrait = page.locator(".hero-portrait");
  await expect(portrait).toHaveAttribute("data-ready", "true");
  const box = (await portrait.boundingBox())!;
  await page.mouse.move(box.x + box.width * .8, box.y + box.height * .3);
  await expect.poll(async () => Number(await portrait.getAttribute("data-yaw"))).toBeGreaterThan(1);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 2, box.y + box.height * 1.5, { steps: 12 });
  await expect.poll(async () => Number(await portrait.getAttribute("data-yaw"))).toBeGreaterThan(8.8);
  expect(Number(await portrait.getAttribute("data-yaw"))).toBeLessThanOrEqual(9);
  expect(Math.abs(Number(await portrait.getAttribute("data-pitch")))).toBeLessThanOrEqual(5);
  await page.mouse.up();
  await expect(portrait).toHaveAttribute("data-motion", "idle");
  await expect(portrait).toHaveAttribute("data-yaw", "0.000");
  const control = page.locator(".portrait-interaction");
  // The artwork participates in the normal Tab sequence after the hero CTA.
  await page.getByRole("link", { name: "EXPLORE MY STORY" }).focus();
  await page.keyboard.press("Tab");
  await expect(control).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect.poll(async () => Number(await portrait.getAttribute("data-yaw"))).toBeGreaterThan(1.8);
  await page.keyboard.press("Home");
  await expect(portrait).toHaveAttribute("data-yaw", "0.000");
  await page.keyboard.press("ArrowUp");
  await expect.poll(async () => Number(await portrait.getAttribute("data-pitch"))).toBeLessThan(-.8);
  await page.keyboard.press("Escape");
  await expect(portrait).toHaveAttribute("data-pitch", "0.000");
  const canvas = portrait.locator("canvas");
  await expect(portrait).toHaveAttribute("data-motion", "idle");
  const frame = await canvas.getAttribute("data-frame");
  await page.waitForTimeout(200);
  await expect(canvas).toHaveAttribute("data-frame", frame!);
  await control.evaluate(element => (element as HTMLElement).blur());
  await page.mouse.move(box.x + box.width * .9, box.y + box.height * .5);
  await expect(portrait).toHaveAttribute("data-motion", "idle");
  await page.screenshot({ path: "artifacts/hero-portrait-interactive.png" });
  await page.evaluate(() => document.getElementById("introduction")!.scrollIntoView({ behavior: "instant" }));
  await expect(portrait).toHaveAttribute("data-motion", "paused");
  const pausedFrame = await canvas.getAttribute("data-frame");
  await page.waitForTimeout(200);
  await expect(canvas).toHaveAttribute("data-frame", pausedFrame!);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(portrait).toHaveAttribute("data-motion", "idle");
  expect(errors).toEqual([]);
});

test("portrait survives context loss, and reduced motion uses only the photograph", async ({ page }) => {
  await page.goto("/");
  const portrait = page.locator(".hero-portrait");
  await expect(portrait).toHaveAttribute("data-ready", "true");
  await portrait.locator("canvas").evaluate(element => {
    const extension = (element as HTMLCanvasElement).getContext("webgl2")!.getExtension("WEBGL_lose_context")!;
    Object.assign(window, { portraitContext: extension });
    extension.loseContext();
  });
  await expect(portrait).toHaveAttribute("data-ready", "false");
  await expect(portrait.locator(".portrait-fallback")).toBeVisible();
  await expect(portrait.locator("canvas")).toBeHidden();
  await page.evaluate(() => (window as unknown as { portraitContext: WEBGL_lose_context }).portraitContext.restoreContext());
  await expect(portrait).toHaveAttribute("data-ready", "true");
  await expect(portrait.locator("canvas")).toHaveAttribute("data-rendered", "true");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(portrait).toHaveAttribute("data-motion", "static");
  await expect(portrait.locator("canvas")).toHaveCount(0);
  await expect(portrait.locator(".portrait-fallback")).toBeVisible();
  await expect(page.locator(".portrait-hint")).toBeHidden();
  await expect(page.locator(".portrait-interaction")).not.toHaveAttribute("tabindex");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(portrait).toHaveAttribute("data-ready", "true");
});

test("missing depth map leaves an intact, non-interactive photograph", async ({ page }) => {
  await page.route("**/hero-portrait-depth.png", route => route.abort());
  await page.goto("/");
  await expect(page.locator(".portrait-fallback")).toBeVisible();
  await expect.poll(() => page.locator(".portrait-fallback").evaluate(element =>
    (element as HTMLImageElement).naturalWidth)).toBe(630);
  await expect(page.locator(".hero-portrait")).toHaveAttribute("data-ready", "false");
  await expect(page.locator(".portrait-interaction")).not.toHaveAttribute("tabindex");
  await expect(page.locator(".portrait-hint")).toBeHidden();
  await page.getByRole("link", { name: "EXPLORE MY STORY" }).click();
  await expect(page).toHaveURL(/#explore$/);
});

test("portrait fits phone, tablet and desktop without covering the title", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(page.locator(".portrait-fallback")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const portrait = (await page.locator(".hero-portrait").boundingBox())!;
    const title = (await page.locator("#hero-title").boundingBox())!;
    expect(portrait.x).toBeGreaterThanOrEqual(0);
    expect(portrait.x + portrait.width).toBeLessThanOrEqual(width);
    if (width < 761) expect(portrait.y).toBeGreaterThan(title.y + title.height);
    else expect(portrait.x).toBeGreaterThan(title.x + title.width);
    await page.screenshot({ path: `artifacts/hero-portrait-${width}.png` });
  }
});

test("touch dragging turns the portrait while vertical swipes scroll the page", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:5199/");
  const portrait = page.locator(".hero-portrait");
  await expect(portrait).toHaveAttribute("data-ready", "true");
  const box = (await portrait.boundingBox())!;
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  const session = await context.newCDPSession(page);
  const touch = (type: "touchStart" | "touchMove" | "touchEnd", tx = x, ty = y) => session.send("Input.dispatchTouchEvent", {
    type, touchPoints: type === "touchEnd" ? [] : [{ x: tx, y: ty }],
  });
  await touch("touchStart");
  await touch("touchMove", x + 30);
  await touch("touchMove", x + 75);
  await expect.poll(async () => Number(await portrait.getAttribute("data-yaw"))).toBeGreaterThan(3);
  await touch("touchEnd");
  await expect(portrait).toHaveAttribute("data-yaw", "0.000");
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: "artifacts/hero-portrait-mobile-interactive.png", fullPage: true });
  await touch("touchStart");
  for (let step = 1; step <= 6; step++) await touch("touchMove", x, y - step * 25);
  await touch("touchEnd");
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(30);
  await context.close();
});
