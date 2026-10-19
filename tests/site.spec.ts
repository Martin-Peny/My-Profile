import { expect, test } from "@playwright/test";

test("desktop renders, anchors resolve, and the artist identity stays correct", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveTitle("Haoyang Ling — Enter the Frequency");
  await expect(
    page.locator('.hero-portrait canvas[data-rendered="true"]'),
  ).toBeVisible();
  await expect(page.locator(".profile-card")).toHaveCount(3);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    await page
      .locator('a[href^="#"]')
      .evaluateAll((links) =>
        links.every(
          (link) => !!document.querySelector(link.getAttribute("href")!),
        ),
      ),
  ).toBe(true);
  await page.screenshot({ path: "artifacts/desktop.png", fullPage: true });
  await page.getByRole("link", { name: "02 EXPLORE" }).click();
  await expect(page).toHaveURL(/#explore$/);
  expect(errors).toEqual([]);
});

test("profile cards navigate as whole links with keyboard access and unobscured targets", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const targets = ["introduction", "my-life", "academic-experience"];
  expect(await page.locator("main").innerText()).not.toMatch(/[\u3400-\u9fff]/);
  await expect(page.locator(".profile-card h3")).toHaveText(["Introduction", "My life", "Academic Experience"]);
  await expect(page.locator("#sound-console, .audio-console, .study-card")).toHaveCount(0);
  await expect(page.locator(".profile-card button, .profile-card a")).toHaveCount(0);
  await expect(page.locator(".academic-workbench")).toHaveCount(1);
  const cards = page.locator(".profile-card");
  await cards.first().focus();
  for (let i = 0; i < targets.length; i++) {
    await expect(cards.nth(i)).toBeFocused();
    expect(await cards.nth(i).evaluate(element => getComputedStyle(element).outlineStyle)).toBe("solid");
    if (i < targets.length - 1) await page.keyboard.press("Tab");
  }
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (let i = 0; i < targets.length; i++) {
      const card = cards.nth(i);
      await card.focus();
      await expect(card).toHaveAttribute("href", `#${targets[i]}`);
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(new RegExp(`#${targets[i]}$`));
      const target = page.locator(`#${targets[i]}`);
      await expect(target).toBeFocused();
      const header = (await page.locator(".site-header").boundingBox())!;
      await expect.poll(async () => (await target.getByRole("heading").first().boundingBox())!.y).toBeGreaterThanOrEqual(Math.max(0, header.y + header.height));
      expect((await target.getByRole("heading").first().boundingBox())!.y).toBeLessThan(900);
      const returns = page.locator(".site-footer").locator('a[href="#explore"]');
      await returns.click();
      await expect(page).toHaveURL(/#explore$/);
      await card.locator(".profile-art").click();
      await expect(page).toHaveURL(new RegExp(`#${targets[i]}$`));
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow at ${width}`).toBe(true);
    expect(await cards.evaluateAll(elements => elements.every(element => element.scrollWidth <= element.clientWidth)), `card text overflow at ${width}`).toBe(true);
  }
  await cards.first().focus();
  await expect(cards.first().locator(".profile-art")).toHaveAttribute("data-motion", "static");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await cards.first().hover();
  await expect(cards.first().locator(".profile-art")).toHaveAttribute("data-ready", "true");
  await expect(cards.first().locator(".profile-art canvas")).toHaveAttribute("data-rendered", "true");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(cards.first().locator(".profile-art")).toHaveAttribute("data-motion", "static");
  await expect(cards.first().locator(".profile-art canvas")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("mobile navigation, focus, layouts, and reduced motion work", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("link", { name: "03 INTRODUCTION" }).click();
  await expect(page).toHaveURL(/#introduction$/);
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeHidden();
  await page.goto("/");
  await expect(
    page.locator('.portrait-fallback'),
  ).toBeVisible();
  await page.screenshot({ path: "artifacts/mobile.png", fullPage: true });
  for (const width of [320, 390, 600, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `horizontal overflow at ${width}px`,
    ).toBe(true);
  }
  expect(
    await page
      .locator(".signal-ticker > div")
      .evaluateAll((elements) => elements.every(element => getComputedStyle(element).transform === "none")),
  ).toBe(true);
});

test("portrait remains visible without WebGL", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type.includes("webgl")) return null;
      return original.call(this, type as "2d", ...(args as []));
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.goto("/");
  await expect(page.locator(".portrait-fallback")).toBeVisible();
  expect(await page.locator(".portrait-fallback").evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator(".profile-art")).toHaveCount(3);
  await page.locator(".profile-grid").scrollIntoViewIfNeeded();
  for (const art of await page.locator(".profile-art").all()) {
    await expect(art).toHaveAttribute("data-motion", "fallback");
    await expect(art.locator(".profile-object")).toBeVisible();
    await expect(art.locator("canvas")).toHaveCount(0);
  }
  await expect(page.locator(".topography-fallback")).toBeVisible();
  await expect(page.locator(".topography")).toHaveAttribute("data-motion", "fallback");
  await expect(page.locator(".topography canvas")).toHaveCount(0);
  await expect(page.locator(".hero-ether")).toHaveAttribute("data-ready", "false");
  await expect(page.locator(".hero-ether")).toHaveAttribute("data-motion", "fallback");
  await page.locator('.profile-card[href="#my-life"]').click();
  await expect(page).toHaveURL(/#my-life$/);
});

test("hero fluid renders, pauses offscreen, restores its context, and respects reduced motion", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  const ether = page.locator(".hero-ether");
  const canvas = ether.locator("canvas");
  await expect(ether).toHaveAttribute("data-ready", "true");
  await expect(ether).toHaveAttribute("data-motion", "running");
  const firstFrame = await canvas.getAttribute("data-frame");
  await expect.poll(() => canvas.getAttribute("data-frame")).not.toBe(firstFrame);
  await page.mouse.move(850, 280);
  await page.mouse.move(1050, 480, { steps: 12 });
  await page.mouse.click(1050, 480);
  await page.screenshot({ path: "artifacts/hero-liquid-ether-desktop.png" });
  await page.evaluate(() => document.getElementById("introduction")!.scrollIntoView({ behavior: "instant" }));
  await expect(ether).toHaveAttribute("data-motion", "paused");
  const pausedFrame = await canvas.getAttribute("data-frame");
  await page.waitForTimeout(250);
  await expect(canvas).toHaveAttribute("data-frame", pausedFrame!);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(ether).toHaveAttribute("data-motion", "running");
  const canLoseContext = await canvas.evaluate(element => {
    const gl = (element as HTMLCanvasElement).getContext("webgl2")!;
    const extension = gl.getExtension("WEBGL_lose_context");
    if (!extension) return false;
    Object.assign(window, { heroContextExtension: extension });
    extension.loseContext();
    return true;
  });
  expect(canLoseContext).toBe(true);
  await expect(ether).toHaveAttribute("data-ready", "false");
  await expect(canvas).toBeHidden();
  await page.evaluate(() => {
    (window as unknown as { heroContextExtension: WEBGL_lose_context }).heroContextExtension.restoreContext();
  });
  await expect(ether).toHaveAttribute("data-ready", "true");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(ether).toHaveAttribute("data-motion", "static");
  await expect(canvas).toBeHidden();
  const staticFrame = await canvas.getAttribute("data-frame");
  await page.mouse.move(850, 280);
  await page.mouse.click(1050, 480);
  await page.waitForTimeout(250);
  await expect(canvas).toHaveAttribute("data-frame", staticFrame!);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(ether).toHaveAttribute("data-ready", "true");
  await expect(ether).toHaveAttribute("data-motion", "running");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(ether).toHaveAttribute("data-ready", "true");
  await page.screenshot({ path: "artifacts/hero-liquid-ether-mobile.png", fullPage: true });
  await page.getByRole("link", { name: "EXPLORE MY STORY" }).click();
  await expect(page).toHaveURL(/#explore$/);
  expect(errors).toEqual([]);
});

test("terrain animates only on screen, stays static with reduced motion, and survives context loss", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator(".section-heading").scrollIntoViewIfNeeded();
  const terrain = page.locator(".topography");
  const canvas = terrain.locator("canvas");
  await expect(canvas).toHaveAttribute("data-rendered", "true");
  await expect(terrain).toHaveAttribute("data-motion", "static");
  await expect(page.locator(".topography-fallback")).toBeHidden();
  const staticFrame = await canvas.getAttribute("data-frame");
  await page.waitForTimeout(180);
  await expect(canvas).toHaveAttribute("data-frame", staticFrame!);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(terrain).toHaveAttribute("data-motion", "running");
  await expect.poll(() => canvas.getAttribute("data-frame")).not.toBe(staticFrame);
  // Moving on decorative space never creates a click-blocking overlay.
  const heading = await page.locator("#explore-title").boundingBox();
  await page.mouse.move(heading!.x + 20, heading!.y + 30);
  await page.mouse.click(heading!.x + 20, heading!.y + 30);
  await page.locator('.profile-card[href="#my-life"]').click();
  await expect(page).toHaveURL(/#my-life$/);
  // Use a lower section to put the entire terrain outside the viewport.
  await page.evaluate(() => {
    (document.activeElement as HTMLElement)?.blur();
    document.getElementById("academic-experience")!.scrollIntoView({ behavior: "instant" });
  });
  await expect.poll(() => terrain.evaluate(element => element.getBoundingClientRect().bottom)).toBeLessThan(0);
  await expect(terrain).toHaveAttribute("data-motion", "paused");
  const pausedFrame = await canvas.getAttribute("data-frame");
  await page.waitForTimeout(180);
  await expect(canvas).toHaveAttribute("data-frame", pausedFrame!);
  await canvas.evaluate((element) => {
    const gl = (element as HTMLCanvasElement).getContext("webgl2")!;
    Object.assign(window, { terrainTestContext: gl.getExtension("WEBGL_lose_context") });
    gl.getExtension("WEBGL_lose_context")!.loseContext();
  });
  await expect(terrain).toHaveAttribute("data-motion", "fallback");
  await expect(page.locator(".topography-fallback")).toBeVisible();
  await expect(canvas).toBeHidden();
  await page.evaluate(() => {
    (window as unknown as { terrainTestContext: WEBGL_lose_context }).terrainTestContext.restoreContext();
  });
  await expect(terrain).toHaveAttribute("data-ready", "true");
  await expect(canvas).toBeVisible();
  expect(errors).toEqual([]);
});

test("all page surfaces and hover states stay dark, with readable profile copy", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const darkSurfaces = ":root, .site-header, .hero, .explore-section, .profile-card, .about-section, .experience-section, .site-footer";
  const checkSurfaces = async () => {
    const lightSurfaces = await page.locator(darkSurfaces).evaluateAll((elements) =>
      elements.filter((element) => {
        const rgba = getComputedStyle(element).backgroundColor.match(/[\d.]+/g)!.map(Number);
        return (rgba[3] ?? 1) > .5 && Math.max(...rgba.slice(0, 3)) > 100;
      }).map((element) => element.className || element.tagName));
    expect(lightSurfaces).toEqual([]);
  };
  await checkSurfaces();
  await page.locator(".profile-card").nth(1).hover();
  await checkSurfaces();
  await page.locator('.profile-card[href="#my-life"]').click();
  await checkSurfaces();
  // Verify contrast against the lightest card surface for ordinary copy.
  const contrast = await page.locator(".profile-description").first().evaluate((element) => {
    const color = getComputedStyle(element).color.match(/[\d.]+/g)!.slice(0, 3).map(Number);
    const luminance = (channels: number[]) => channels.map((channel) => {
      const s = channel / 255;
      return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4;
    }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
    return (luminance(color) + .05) / (luminance([36, 39, 39]) + .05);
  });
  expect(contrast).toBeGreaterThanOrEqual(4.5);
  const outline = page.locator(".site-footer").getByRole("link", { name: "BACK TO EXPLORE", exact: true });
  await outline.hover();
  await page.waitForTimeout(250);
  expect(await outline.evaluate((element) => {
    const rgb = getComputedStyle(element).backgroundColor.match(/[\d.]+/g)!.slice(0, 3).map(Number);
    return Math.max(...rgb);
  })).toBeLessThan(100);
  await page.locator(".section-heading").scrollIntoViewIfNeeded();
  await expect(page.locator(".topography canvas")).toHaveAttribute("data-rendered", "true");
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.screenshot({ path: "artifacts/explore-desktop-full.png", fullPage: true });
  // Section previews omit fixed global overlays; full-page captures above retain them.
  const sectionPreviewStyle = ".skip-link { visibility: hidden !important; }";
  await page.locator("#explore").screenshot({ path: "artifacts/explore-desktop.png", style: sectionPreviewStyle });
  await page.setViewportSize({ width: 390, height: 844 });
  await checkSurfaces();
  await page.screenshot({ path: "artifacts/explore-mobile-full.png", fullPage: true });
  await page.locator("#explore").screenshot({ path: "artifacts/explore-mobile.png", style: sectionPreviewStyle });
});
