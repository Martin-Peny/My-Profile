import { expect, test, type Locator, type Page } from "@playwright/test";

const portrait = (page: Page) => page.locator(".halftone-reveal");

async function openPortrait(page: Page) {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await portrait(page).scrollIntoViewIfNeeded();
  await expect(portrait(page)).toHaveAttribute("data-ready", "true");
  await page.mouse.move(0, 0);
  await expect(portrait(page)).toHaveAttribute("data-running", "false");
}

// Inspect the composited screenshot, rather than a cleared WebGL back buffer.
async function photoPixels(target: Locator) {
  const png = (await target.screenshot()).toString("base64");
  return target.page().evaluate(async base64 => {
    const blob = await (await fetch(`data:image/png;base64,${base64}`)).blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d")!;
    context.drawImage(bitmap, 0, 0);
    const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let color = 0;
    let red = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 70 && data[i + 1] > 35 && data[i] > data[i + 1] * 1.15) color++;
      if (data[i] > 70 && data[i + 1] < data[i] * 0.3) red++;
    }
    bitmap.close();
    return { color, red };
  }, png);
}

test("About Me and My Life record fit desktop, tablet, and phones", async ({ page, request }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openPortrait(page);
  await expect(page.locator(".gallery-content-space .gallery-vinyl")).toHaveCount(0);
  await expect(page.locator("#campus-and-music .vinyl-record")).toHaveCount(0);
  await expect(page.locator("#my-life .vinyl-record")).toHaveCount(1);
  await expect(page.locator("#my-life .my-life-copy p")).toHaveCount(3);
  await expect(page.locator("#my-life .section-topline")).toContainText("04 / MY LIFE");
  await expect(page.locator("#my-life .my-life-eyebrow")).toHaveText("CONTENT / MUSIC / COLLABORATION");
  await expect(page.locator("#my-life .my-life-copy")).toContainText("2022–2023 season of Notting VOICE");
  await expect(page.locator("#creative-projects")).toHaveCount(0);
  await expect(page.locator(".section-divider")).toHaveCount(2);
  expect(await page.locator("#introduction").evaluate(element => element.previousElementSibling?.className)).toBe("section-divider");
  expect(await page.locator(".section-divider").first().evaluate(element => element.previousElementSibling?.id)).toBe("explore");
  expect(await page.locator("#my-life").evaluate(element => element.previousElementSibling?.className)).toBe("section-divider");
  const transition = page.locator(".section-divider").last();
  await expect(transition).toHaveAttribute("aria-hidden", "true");
  expect(await transition.evaluate(element => element.previousElementSibling?.className)).toBe("gallery-content-space");
  expect(await page.locator("#my-life").evaluate(element => getComputedStyle(element).backgroundColor)).toBe("rgb(24, 15, 17)");
  await expect(page.getByRole("img", { name: "Portrait of Haoyang Ling wearing glasses and dangling earrings." })).toHaveCount(1);
  for (const asset of ["about-portrait.png", "about-portrait.webp"]) {
    expect((await request.get(`/images/${asset}`)).ok()).toBe(true);
  }
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    const space = page.locator(".gallery-content-space");
    await portrait(page).scrollIntoViewIfNeeded();
    await expect(portrait(page)).toHaveAttribute("data-ready", "true");
    const imageBox = (await portrait(page).boundingBox())!;
    const textBox = (await page.locator(".about-me").boundingBox())!;
    if (width <= 1000) expect(textBox.y).toBeGreaterThanOrEqual(imageBox.y + imageBox.height + 30);
    else expect(textBox.x).toBeGreaterThan(imageBox.x + imageBox.width);
    expect(imageBox.height).toBeLessThanOrEqual(760);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await space.screenshot({ path: `artifacts/about-me-${width}.png`, style: ".skip-link, .background-music { visibility: hidden !important; }" });
    const life = page.locator("#my-life");
    await life.scrollIntoViewIfNeeded();
    const recordBox = (await life.locator(".vinyl-record").boundingBox())!;
    const titleBox = (await life.getByRole("heading", { name: "MY LIFE", exact: true }).boundingBox())!;
    const lifeBox = (await life.boundingBox())!;
    const copyBox = (await life.locator(".my-life-copy").boundingBox())!;
    const titleGap = copyBox.y - titleBox.y - titleBox.height;
    expect(titleGap).toBeGreaterThanOrEqual(20);
    expect(titleGap).toBeLessThanOrEqual(32);
    if (copyBox.y < recordBox.y + recordBox.height) {
      expect(copyBox.x + copyBox.width).toBeLessThanOrEqual(recordBox.x);
    }
    expect(copyBox.x + copyBox.width).toBeLessThanOrEqual(width);
    expect(copyBox.y + copyBox.height).toBeLessThanOrEqual(lifeBox.y + lifeBox.height);
    expect(titleBox.x + titleBox.width).toBeLessThan(recordBox.x);
    expect(Math.abs(recordBox.x + recordBox.width - width)).toBeLessThan(1);
    expect(Math.abs(recordBox.y - lifeBox.y)).toBeLessThan(1);
    expect(lifeBox.y + lifeBox.height - copyBox.y - copyBox.height).toBeGreaterThanOrEqual(80);
    expect(recordBox.y + recordBox.height).toBeLessThanOrEqual(lifeBox.y + lifeBox.height);
    const currentTextBox = (await page.locator(".about-me").boundingBox())!;
    expect(lifeBox.y).toBeGreaterThanOrEqual(currentTextBox.y + currentTextBox.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(life.locator(".vinyl-record")).toHaveAttribute("data-running", "false");
    await life.screenshot({ path: `artifacts/my-life-${width}.png`, style: ".skip-link, .background-music { visibility: hidden !important; }" });
    await transition.evaluate(element => window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - window.innerHeight * .42, behavior: "instant" }));
    const transitionBox = (await transition.boundingBox())!;
    expect(Math.abs(transitionBox.x)).toBeLessThan(1);
    expect(Math.abs(transitionBox.width - width)).toBeLessThan(1);
    for (const divider of await page.locator(".section-divider").all()) {
      const box = (await divider.boundingBox())!;
      expect(Math.abs(box.x)).toBeLessThan(1);
      expect(Math.abs(box.width - width)).toBeLessThan(1);
      expect(box.height).toBe(2);
    }
    await page.screenshot({ path: `artifacts/section-divider-${width}.png`, style: ".skip-link, .background-music { visibility: hidden !important; }" });
    const upperDivider = page.locator(".section-divider").first();
    await upperDivider.evaluate(element => window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - window.innerHeight * .42, behavior: "instant" }));
    await page.screenshot({ path: `artifacts/explore-about-divider-${width}.png`, style: ".skip-link, .background-music { visibility: hidden !important; }" });
  }
  expect(errors).toEqual([]);
});

test("red dots reveal original colors with pointer, click, and keyboard", async ({ page }) => {
  await openPortrait(page);
  const target = portrait(page);
  const printed = await photoPixels(target);
  expect(printed.red).toBeGreaterThan(1000);
  expect(printed.color).toBe(0);
  const box = (await target.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.55);
  await expect.poll(async () => (await photoPixels(target)).color).toBeGreaterThan(500);
  await page.mouse.move(0, 0);
  await expect(target).toHaveAttribute("data-running", "false");
  expect((await photoPixels(target)).color).toBe(0);
  // A click away from the face reveals photo pixels outside the hover brush.
  await page.mouse.click(box.x + box.width * 0.2, box.y + box.height * 0.2);
  await page.mouse.move(0, 0);
  await expect.poll(async () => (await photoPixels(target)).color, { intervals: [100] }).toBeGreaterThan(1000);
  await expect(target).toHaveAttribute("data-running", "false");
  await page.keyboard.press("Tab");
  await target.focus();
  await expect(target).toBeFocused();
  expect(await target.evaluate(element => element.matches(":focus-visible"))).toBe(true);
  expect((await photoPixels(target)).color).toBeGreaterThan(10000);
  await target.evaluate(element => (element as HTMLElement).blur());
  expect((await photoPixels(target)).color).toBe(0);
});

test("portrait cutout exposes the section background in print, reveal, and fallback states", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openPortrait(page);
  const target = portrait(page);
  await expect(target).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");

  const expectTransparentCorners = async () => {
    const png = (await target.screenshot({ style: ".about-earphones { visibility: hidden !important; }" })).toString("base64");
    const corners = await page.evaluate(async base64 => {
      const bitmap = await createImageBitmap(await (await fetch(`data:image/png;base64,${base64}`)).blob());
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext("2d")!;
      context.drawImage(bitmap, 0, 0);
      const pixels = [3, canvas.width - 4].map(x => Array.from(context.getImageData(x, 3, 1, 1).data));
      bitmap.close();
      return pixels;
    }, png);
    expect(corners).toEqual([[19, 31, 47, 255], [19, 31, 47, 255]]);
  };

  // A distinct dark background proves the canvas exposes its parent surface.
  await page.locator(".gallery-content-space").evaluate(element => {
    (element as HTMLElement).style.background = "rgb(19, 31, 47)";
  });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await target.scrollIntoViewIfNeeded();
    await expectTransparentCorners();
    await target.focus();
    await expectTransparentCorners();
    await target.evaluate(element => (element as HTMLElement).blur());
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await target.hover();
    await expect(target).toHaveAttribute("data-running", "true");
    await expectTransparentCorners();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(target).toHaveAttribute("data-running", "false");
  }

  await target.locator("canvas").evaluate(canvas => canvas.getContext("webgl2")!.getExtension("WEBGL_lose_context")!.loseContext());
  await expect(target).toHaveAttribute("data-ready", "false");
  await expectTransparentCorners();
});

test("halftone and record suspend and handle live motion changes", async ({ page }) => {
  await openPortrait(page);
  const target = portrait(page);
  await target.hover();
  await expect(target).toHaveAttribute("data-running", "true");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(target).toHaveAttribute("data-motion", "static");
  await expect(target).toHaveAttribute("data-running", "false");
  expect((await photoPixels(target)).color).toBe(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(target).toHaveAttribute("data-motion", "auto");
  await page.mouse.move(0, 0);
  await target.hover();
  await expect(target).toHaveAttribute("data-running", "true");
  await page.locator("#index").scrollIntoViewIfNeeded();
  await expect(target).toHaveAttribute("data-running", "false");
  const record = page.locator(".vinyl-record");
  await record.scrollIntoViewIfNeeded();
  await expect(record).toHaveAttribute("data-running", "true");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(record).toHaveAttribute("data-running", "false");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(record).toHaveAttribute("data-running", "true");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(record).toHaveAttribute("data-running", "false");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await target.scrollIntoViewIfNeeded();
  await target.hover();
  await expect(target).toHaveAttribute("data-running", "true");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(target).toHaveAttribute("data-running", "false");
  await page.evaluate(() => {
    delete (document as unknown as Record<string, unknown>).hidden;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(target).toHaveAttribute("data-running", "true");
});

test("portrait falls back during WebGL loss and renders again on restoration", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openPortrait(page);
  await page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>(".halftone-reveal-canvas")!;
    const extension = canvas.getContext("webgl2")!.getExtension("WEBGL_lose_context")!;
    (window as unknown as { portraitExtension: WEBGL_lose_context }).portraitExtension = extension;
    extension.loseContext();
  });
  await expect(portrait(page)).toHaveAttribute("data-ready", "false");
  expect((await photoPixels(portrait(page))).color).toBeGreaterThan(10000);
  await page.evaluate(() => (window as unknown as { portraitExtension: WEBGL_lose_context }).portraitExtension.restoreContext());
  await expect(portrait(page)).toHaveAttribute("data-ready", "true");
  expect((await photoPixels(portrait(page))).red).toBeGreaterThan(1000);
  expect(errors).toEqual([]);
});

test("portrait remains visible when WebGL is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
      if (type === "webgl2" && this.classList.contains("halftone-reveal-canvas")) return null;
      return getContext.apply(this, [type, ...args] as Parameters<typeof getContext>);
    } as typeof getContext;
  });
  await page.goto("/");
  await portrait(page).scrollIntoViewIfNeeded();
  await expect(portrait(page).locator("img")).toBeVisible();
  await expect.poll(() => portrait(page).locator("img").evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
  await expect(portrait(page)).toHaveAttribute("data-ready", "false");
  expect((await photoPixels(portrait(page))).color).toBeGreaterThan(10000);
});

test("shader initialization failure preserves the original portrait", async ({ page }) => {
  await page.addInitScript(() => {
    const getParameter = WebGL2RenderingContext.prototype.getShaderParameter;
    WebGL2RenderingContext.prototype.getShaderParameter = function (shader, parameter) {
      if (this.canvas instanceof HTMLCanvasElement && this.canvas.classList.contains("halftone-reveal-canvas") && parameter === this.COMPILE_STATUS) return false;
      return getParameter.call(this, shader, parameter);
    };
  });
  await page.goto("/");
  await portrait(page).scrollIntoViewIfNeeded();
  await expect.poll(() => portrait(page).locator("img").evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
  await expect(portrait(page)).toHaveAttribute("data-ready", "false");
  expect((await photoPixels(portrait(page))).color).toBeGreaterThan(10000);
});

test("touch taps reveal color while vertical swipes scroll normally", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:5199/");
  await portrait(page).scrollIntoViewIfNeeded();
  await expect(portrait(page)).toHaveAttribute("data-ready", "true");
  await expect(portrait(page)).toHaveAttribute("data-running", "false");
  const box = (await portrait(page).boundingBox())!;
  await page.touchscreen.tap(box.x + box.width * 0.45, box.y + box.height * 0.5);
  await expect.poll(async () => (await photoPixels(portrait(page))).color, { intervals: [100] }).toBeGreaterThan(500);
  await expect(portrait(page)).toHaveAttribute("data-running", "false");
  const session = await context.newCDPSession(page);
  const swipeBox = (await portrait(page).boundingBox())!;
  const initialScroll = await page.evaluate(() => scrollY);
  const x = Math.round(swipeBox.x + swipeBox.width / 2);
  const y = Math.round(swipeBox.y + swipeBox.height * 0.65);
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  for (let distance = 20; distance <= 180; distance += 20) {
    await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y - distance }] });
    await page.waitForTimeout(20);
  }
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(initialScroll + 80);
  await context.close();
});
