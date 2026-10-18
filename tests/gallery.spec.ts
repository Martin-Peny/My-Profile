import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const images = JSON.parse(readFileSync(new URL("../src/gallery-images.json", import.meta.url), "utf8")) as {
  row: string; width: number; height: number; alt: string;
  variants: { src: string; width: number; height: number }[];
}[];

const translations = (page: Page) => page.locator(".gallery-track").evaluateAll(tracks =>
  tracks.map(track => new DOMMatrixReadOnly(getComputedStyle(track).transform).m41));

const tickerTranslations = (page: Page) => page.locator(".ticker-track").evaluateAll(tracks =>
  tracks.map(track => new DOMMatrixReadOnly(getComputedStyle(track).transform).m41));

const scrollTo = (page: Page, top: number) => page.evaluate(y => window.scrollTo({ top: y, behavior: "instant" }), top);

test("gallery preserves three rows, image proportions, responsive layout, and navigation", async ({ page, request }) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".photo-gallery")).toHaveAttribute("data-motion", "auto");
  await expect(page.locator(".gallery-row")).toHaveCount(3);
  await expect(page.locator(".signal-ticker")).toHaveCount(4);
  expect(await page.locator(".photo-gallery > .signal-ticker, .photo-gallery > .gallery-row")
    .evaluateAll(elements => elements.map(element => element.className)))
    .toEqual(["signal-ticker", "gallery-row", "signal-ticker", "gallery-row", "signal-ticker", "gallery-row", "signal-ticker"]);
  for (const [index, count] of [12, 25, 12].entries()) {
    await expect(page.locator(".gallery-row").nth(index).locator(".gallery-sequence:not([aria-hidden]) img")).toHaveCount(count);
  }
  expect(images).toHaveLength(49);
  for (const image of images) {
    const ratio = image.width / image.height;
    expect(ratio).toBeGreaterThanOrEqual(image.row === "middle" ? .60 : 1.25);
    expect(ratio).toBeLessThanOrEqual(image.row === "middle" ? .80 : 1.90);
    expect(image.alt.length).toBeGreaterThan(15);
  }
  // Check every generated variant, including photographs outside the current viewport.
  await Promise.all(images.flatMap(image => image.variants.map(async variant => {
    const response = await request.get(`/${variant.src}`);
    expect(response.ok(), variant.src).toBe(true);
    expect(response.headers()["content-type"]).toContain("image/webp");
  })));

  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: width < 760 ? 844 : 1000 });
    await page.locator("#introduction").evaluate(element => element.scrollIntoView({ behavior: "instant" }));
    await page.waitForTimeout(700);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow at ${width}`).toBe(true);
    const geometry = await page.locator(".gallery-row").evaluateAll(rows => rows.map(row => {
      const bounds = row.getBoundingClientRect();
      const track = row.querySelector(".gallery-track")!.getBoundingClientRect();
      return { top: bounds.top, bottom: bounds.bottom, height: bounds.height,
        covered: track.left <= bounds.left + 1 && track.right >= bounds.right - 1 };
    }));
    expect(geometry.every(row => row.covered)).toBe(true);
    const tickerGeometry = await page.locator(".signal-ticker").evaluateAll(tickers => tickers.map(ticker => {
      const bounds = ticker.getBoundingClientRect();
      const track = ticker.querySelector(".ticker-track")!.getBoundingClientRect();
      const groups = [...ticker.querySelectorAll(".ticker-sequence")];
      return { x: bounds.x, width: bounds.width, height: bounds.height, top: bounds.top, bottom: bounds.bottom,
        covered: track.left <= bounds.left + 1 && track.right >= bounds.right - 1,
        seam: Math.abs(groups[0].getBoundingClientRect().right - groups[1].getBoundingClientRect().left),
        identical: groups[0].innerHTML === groups[1].innerHTML,
        position: getComputedStyle(ticker).position, hidden: ticker.getAttribute("aria-hidden") };
    }));
    tickerGeometry.forEach((ticker, index) => {
      expect(Math.abs(ticker.x)).toBeLessThan(1);
      expect(Math.abs(ticker.width - width)).toBeLessThan(2);
      expect(ticker.height).toBe(width <= 760 ? 45 : 55);
      expect(ticker.covered).toBe(true);
      expect(ticker.seam).toBeLessThan(1);
      expect(ticker.identical).toBe(true);
      expect(ticker.position).toBe("relative");
      expect(ticker.hidden).toBe("true");
      if (index < 3) expect(ticker.bottom).toBeLessThanOrEqual(geometry[index].top);
      if (index > 0) expect(ticker.top).toBeGreaterThanOrEqual(geometry[index - 1].bottom);
    });
    const edges = await page.locator(".gallery-row").first().boundingBox();
    expect(edges!.x).toBeLessThan(1);
    expect(Math.abs(edges!.width - width)).toBeLessThan(2);
    expect(geometry[0].height).toBeGreaterThanOrEqual(width < 760 ? 220 : 320);
    expect(geometry[0].bottom).toBeLessThan(geometry[1].top);
    expect(geometry[1].bottom).toBeLessThan(geometry[2].top);
    expect(Math.abs(geometry[0].height - geometry[1].height)).toBeLessThan(1);
    expect(await page.locator(".gallery-photo img").evaluateAll(elements => elements.every(element => {
      const img = element as HTMLImageElement;
      const bounds = img.getBoundingClientRect();
      return Math.abs(bounds.width / bounds.height - Number(img.getAttribute("width")) / Number(img.getAttribute("height"))) < .01;
    }))).toBe(true);
    await expect.poll(() => page.locator(".gallery-photo img").evaluateAll(elements => elements.filter(element => {
      const rect = element.getBoundingClientRect();
      return rect.top < innerHeight && rect.bottom > 0 && rect.left < innerWidth && rect.right > 0;
    }).every(element => (element as HTMLImageElement).naturalWidth > 0))).toBe(true);
    await page.screenshot({ path: `artifacts/gallery-${width}.png`, fullPage: true });
    await page.locator(".photo-gallery").screenshot({ path: `artifacts/gallery-tickers-${width}.png` });
  }
  await page.locator('.site-footer a[href="#explore"]').click();
  await expect(page).toHaveURL(/#explore$/);
  await page.locator('.profile-card[href="#introduction"]').focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#introduction$/);
  await expect(page.locator("#introduction")).toBeFocused();
  await expect(page.locator("#introduction-title")).toHaveText("ABOUT ME");
  expect(errors).toEqual([]);
});

test("gallery loops slowly without scrolling, pauses, and ignores scroll direction", async ({ page }) => {
  await page.goto("/");
  const gallery = page.locator(".photo-gallery");
  await expect(gallery).toHaveAttribute("data-motion", "auto");
  await page.locator("#introduction").evaluate(element => element.scrollIntoView({ behavior: "instant" }));
  await expect(gallery).toHaveAttribute("data-running", "true");
  await page.waitForTimeout(300);
  const before = await translations(page);
  const tickerBefore = await tickerTranslations(page);
  const initialScroll = await page.evaluate(() => scrollY);
  await page.waitForTimeout(1000);
  const after = await translations(page);
  expect(await page.evaluate(() => scrollY)).toBe(initialScroll);
  expect(after[0]).toBeLessThan(before[0] - 5);
  expect(after[1]).toBeLessThan(before[1] - 5);
  expect(after[2]).toBeLessThan(before[2] - 5);
  after.forEach((value, index) => expect(Math.abs(value - before[index])).toBeLessThan(30));
  (await tickerTranslations(page)).forEach((value, index) => expect(value).toBeGreaterThan(tickerBefore[index] + 5));

  await page.getByRole("button", { name: "PAUSE GALLERY" }).click();
  await expect(gallery).toHaveAttribute("data-running", "false");
  const paused = await translations(page);
  const tickerPaused = await tickerTranslations(page);
  await scrollTo(page, initialScroll + 160);
  await page.waitForTimeout(400);
  await scrollTo(page, initialScroll - 100);
  await page.waitForTimeout(400);
  (await translations(page)).forEach((value, index) => expect(Math.abs(value - paused[index])).toBeLessThan(.5));
  (await tickerTranslations(page)).forEach((value, index) => expect(Math.abs(value - tickerPaused[index])).toBeLessThan(.5));
  await page.getByRole("button", { name: "RESUME GALLERY" }).click();
  await expect(gallery).toHaveAttribute("data-running", "true");
  await expect.poll(async () => (await translations(page))[0]).toBeLessThan(paused[0] - 2);
  await expect.poll(async () => (await tickerTranslations(page))[0]).toBeGreaterThan(tickerPaused[0] + 2);

  // Exercise the visibility event used by background tabs without changing scroll position.
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(gallery).toHaveAttribute("data-running", "false");
  const background = [...await translations(page), ...await tickerTranslations(page)];
  await page.waitForTimeout(400);
  [...await translations(page), ...await tickerTranslations(page)]
    .forEach((value, index) => expect(Math.abs(value - background[index])).toBeLessThan(.5));
  await page.evaluate(() => {
    Reflect.deleteProperty(document, "hidden");
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(gallery).toHaveAttribute("data-running", "true");
  await expect.poll(async () => (await tickerTranslations(page))[0]).toBeGreaterThan(background[3] + 2);

  // Two identical sequences share a boundary with the same gap as adjacent photographs.
  for (const row of await page.locator(".gallery-row").all()) {
    const groups = row.locator(".gallery-sequence");
    await expect(groups).toHaveCount(2);
    expect(await groups.first().locator("img").evaluateAll(elements => elements.map(element => element.getAttribute("src"))))
      .toEqual(await groups.last().locator("img").evaluateAll(elements => elements.map(element => element.getAttribute("src"))));
    const seam = await groups.evaluateAll(elements => {
      const first = elements[0].getBoundingClientRect();
      const second = elements[1].getBoundingClientRect();
      return Math.abs(first.right - second.left);
    });
    expect(seam).toBeLessThan(1);
  }
  await scrollTo(page, 0);
  await expect(gallery).toHaveAttribute("data-running", "false");
  const offscreen = await translations(page);
  const tickerOffscreen = await tickerTranslations(page);
  await page.waitForTimeout(400);
  (await translations(page)).forEach((value, index) => expect(Math.abs(value - offscreen[index])).toBeLessThan(.5));
  (await tickerTranslations(page)).forEach((value, index) => expect(Math.abs(value - tickerOffscreen[index])).toBeLessThan(.5));
});

test("reduced motion supports keyboard browsing and live preference changes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const gallery = page.locator(".photo-gallery");
  const rows = page.locator(".gallery-row");
  await expect(gallery).toHaveAttribute("data-motion", "static");
  await expect(page.locator(".gallery-browse-hint")).toBeVisible();
  expect(await translations(page)).toEqual([0, 0, 0]);
  expect(await tickerTranslations(page)).toEqual([0, 0, 0, 0]);
  for (const row of await rows.all()) {
    await expect(row).toHaveAttribute("tabindex", "0");
    await row.focus();
    await expect(row).toBeFocused();
    expect(await row.evaluate(element => getComputedStyle(element).outlineStyle)).toBe("solid");
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => row.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  }
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(gallery).toHaveAttribute("data-motion", "auto");
  await expect(rows.first()).toHaveAttribute("tabindex", "-1");
  expect(await rows.evaluateAll(elements => elements.every(element => element.scrollLeft === 0))).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(gallery).toHaveAttribute("data-motion", "static");
  expect(await translations(page)).toEqual([0, 0, 0]);
  expect(await tickerTranslations(page)).toEqual([0, 0, 0, 0]);
});

test("touch scrolling retains ordinary vertical page navigation", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  try {
    await page.goto("http://127.0.0.1:5199/");
    await page.locator("#introduction").evaluate(element => element.scrollIntoView({ behavior: "instant" }));
    await expect(page.locator(".photo-gallery")).toHaveAttribute("data-motion", "auto");
    const before = await page.evaluate(() => scrollY);
    const session = await context.newCDPSession(page);
    await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 195, y: 600 }] });
    for (let y = 560; y >= 300; y -= 40) {
      await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 195, y }] });
    }
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before + 50);
    await page.emulateMedia({ reducedMotion: "reduce" });
    const row = page.locator(".gallery-row").first();
    await row.scrollIntoViewIfNeeded();
    const rect = (await row.boundingBox())!;
    const y = Math.max(120, rect.y + rect.height / 2);
    await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 310, y }] });
    for (let x = 270; x >= 70; x -= 40) {
      await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y }] });
    }
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(() => row.evaluate(element => element.scrollLeft)).toBeGreaterThan(30);
  } finally {
    await context.close();
  }
});
