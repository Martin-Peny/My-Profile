import { expect, test } from "@playwright/test";

test.use({ launchOptions: { args: ["--enable-unsafe-swiftshader", "--autoplay-policy=document-user-activation-required"] } });

test("background track plays on request, pauses, resumes, loops, and survives navigation", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const audio = page.locator(".background-music audio");
  const waveform = page.locator(".hero-title-wave > svg");
  expect(await audio.evaluate((element: HTMLAudioElement) => element.paused)).toBe(true);
  await expect(waveform).not.toHaveClass(/waveform-animated/);
  await expect(page.getByRole("status")).toBeEmpty();

  await page.getByRole("button", { name: "Play background music" }).click();
  await expect(page.getByRole("button", { name: "Pause background music" })).toHaveAttribute("aria-pressed", "true");
  await expect(waveform).toHaveClass(/waveform-animated/);
  await expect(waveform.locator(".waveform-bar").first()).toHaveCSS("animation-name", "none");
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.currentTime)).toBeGreaterThan(0.1);
  expect(await audio.evaluate((element: HTMLAudioElement) => element.volume)).toBeCloseTo(0.35);
  const volume = page.getByRole("slider", { name: "Background music volume" });
  await volume.focus();
  await page.keyboard.press("ArrowRight");
  await expect(volume).toHaveValue("36");
  expect(await audio.evaluate((element: HTMLAudioElement) => element.volume)).toBeCloseTo(0.36);

  await page.getByRole("link", { name: "02 EXPLORE" }).click();
  await expect(page).toHaveURL(/#explore$/);
  expect(await audio.evaluate((element: HTMLAudioElement) => element.paused)).toBe(false);
  const pause = page.getByRole("button", { name: "Pause background music" });
  await pause.focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Play background music" })).toBeVisible();
  await expect(waveform).not.toHaveClass(/waveform-animated/);
  const pausedAt = await audio.evaluate((element: HTMLAudioElement) => element.currentTime);
  await page.waitForTimeout(150);
  expect(await audio.evaluate((element: HTMLAudioElement) => element.currentTime)).toBe(pausedAt);
  await page.keyboard.press("Enter");
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.currentTime)).toBeGreaterThan(pausedAt);

  await audio.evaluate((element: HTMLAudioElement) => { element.currentTime = element.duration - 0.3; });
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.currentTime), { timeout: 10000 }).toBeLessThan(2);
  expect(await audio.evaluate((element: HTMLAudioElement) => element.paused)).toBe(false);
  await page.getByRole("button", { name: "Pause background music" }).click();
  expect(errors).toEqual([]);
});

test("Hero waveform keeps moving during playback and stops on pause at desktop and mobile sizes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const waveform = page.locator(".hero-title-wave > svg");
  const bar = waveform.locator("path").nth(41);
  const transform = () => bar.evaluate(element => getComputedStyle(element).transform);

  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(bar).toHaveCSS("animation-name", "none");
    await expect(bar).toHaveAttribute("d", "M300 58v4");
    await expect(bar).toHaveAttribute("stroke-width", "3");
    await expect(waveform.locator("path").first()).toHaveAttribute("stroke", "none");
    await page.screenshot({ path: `artifacts/hero-wave-paused-${width}.png` });
    await page.getByRole("button", { name: "Play background music" }).click();
    await expect(bar).toHaveCSS("animation-name", "hero-wave-pulse");
    await expect(bar).not.toHaveAttribute("d", "M300 58v4");
    const initialTransform = await transform();
    await expect.poll(transform).not.toBe(initialTransform);
    await expect.poll(() => page.locator(".background-music audio").evaluate((element: HTMLAudioElement) => element.currentTime)).toBeGreaterThan(1.2);
    const laterTransform = await transform();
    await expect.poll(transform).not.toBe(laterTransform);
    await page.screenshot({ path: `artifacts/hero-wave-playing-${width}.png`, animations: "allow" });

    await page.getByRole("button", { name: "Pause background music" }).click();
    await expect(bar).toHaveCSS("animation-name", "none");
    await expect(bar).toHaveCSS("transform", "none");
    await expect(bar).toHaveAttribute("d", "M300 58v4");
    await page.waitForTimeout(150);
    expect(await transform()).toBe("none");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test("music controls remain usable on mobile and desktop", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    const player = page.getByRole("group", { name: "Background music" });
    const bounds = (await player.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    expect(844 - bounds.y - bounds.height).toBeCloseTo(width <= 760 ? 10 : 16);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `artifacts/background-music-${width}.png` });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("link", { name: "03 INTRODUCTION" }).click();
  await expect(page.getByRole("button", { name: "Pause background music" })).toBeVisible();
  await page.getByRole("button", { name: "Pause background music" }).click();
  await page.locator(".site-footer").getByRole("link", { name: "BACK TO EXPLORE", exact: true }).click();
  await expect(page.getByRole("button", { name: "Play background music" })).toBeVisible();
});

test("failed audio offers a working retry", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/audio/background-music.mp3", route => route.fulfill({ status: 404, body: "" }), { times: 1 });
  await page.goto("/");
  await expect(page.getByRole("status")).toHaveText("Music unavailable. Press play to retry.");
  await expect(page.getByRole("button", { name: "Play background music" })).toBeEnabled();
  await page.getByRole("button", { name: "Play background music" }).click();
  await expect(page.getByRole("button", { name: "Pause background music" })).toBeVisible();
  await expect(page.getByRole("status")).toBeEmpty();
});

test("music starts automatically when the browser permits autoplay", async ({ playwright }) => {
  const browser = await playwright.chromium.launch({ channel: "chrome", args: ["--autoplay-policy=no-user-gesture-required"] });
  try {
    const page = await browser.newPage({ baseURL: test.info().project.use.baseURL });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Pause background music" })).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => page.locator(".background-music audio").evaluate((element: HTMLAudioElement) => element.currentTime)).toBeGreaterThan(0.1);
    expect(await page.locator(".background-music audio").evaluate((element: HTMLAudioElement) => element.volume)).toBeCloseTo(0.35);
  } finally {
    await browser.close();
  }
});
