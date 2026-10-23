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

  await page.getByRole("button", { name: "Open playlist" }).click();
  await page.getByRole("button", { name: "Play music" }).click();
  await expect(page.getByRole("button", { name: "Pause music" })).toHaveAttribute("aria-pressed", "true");
  await expect(waveform).toHaveClass(/waveform-animated/);
  await expect(waveform.locator(".waveform-bar").first()).toHaveCSS("animation-name", "none");
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.currentTime)).toBeGreaterThan(0.1);
  expect(await audio.evaluate((element: HTMLAudioElement) => element.volume)).toBeCloseTo(0.35);
  const volume = page.getByRole("slider", { name: "Music volume" });
  await volume.focus();
  await page.keyboard.press("ArrowRight");
  await expect(volume).toHaveValue("36");
  expect(await audio.evaluate((element: HTMLAudioElement) => element.volume)).toBeCloseTo(0.36);

  await page.locator(".music-record-toggle").click();
  await page.getByRole("link", { name: "EXPLORE MY STORY" }).click();
  await expect(page).toHaveURL(/#explore$/);
  expect(await audio.evaluate((element: HTMLAudioElement) => element.paused)).toBe(false);
  await page.getByRole("button", { name: "Open playlist" }).click();
  const pause = page.getByRole("button", { name: "Pause music" });
  await pause.focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Play music" })).toBeVisible();
  await expect(waveform).not.toHaveClass(/waveform-animated/);
  const pausedAt = await audio.evaluate((element: HTMLAudioElement) => element.currentTime);
  await page.waitForTimeout(150);
  expect(await audio.evaluate((element: HTMLAudioElement) => element.currentTime)).toBe(pausedAt);
  await page.keyboard.press("Enter");
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.currentTime)).toBeGreaterThan(pausedAt);

  await page.getByRole("button", { name: "Playback mode: In order", exact: true }).click();
  await page.getByRole("button", { name: "Playback mode: Shuffle", exact: true }).click();
  await audio.evaluate((element: HTMLAudioElement) => { element.currentTime = element.duration - 0.3; });
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.currentTime), { timeout: 10000 }).toBeLessThan(2);
  expect(await audio.evaluate((element: HTMLAudioElement) => element.paused)).toBe(false);
  await page.getByRole("button", { name: "Pause music" }).click();
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
    await page.getByRole("button", { name: "Open playlist" }).click();
    await page.getByRole("button", { name: "Play music" }).click();
    await expect(bar).toHaveCSS("animation-name", "hero-wave-pulse");
    await expect(bar).not.toHaveAttribute("d", "M300 58v4");
    const initialTransform = await transform();
    await expect.poll(transform).not.toBe(initialTransform);
    await expect.poll(() => page.locator(".background-music audio").evaluate((element: HTMLAudioElement) => element.currentTime)).toBeGreaterThan(1.2);
    const laterTransform = await transform();
    await expect.poll(transform).not.toBe(laterTransform);
    await page.screenshot({ path: `artifacts/hero-wave-playing-${width}.png`, animations: "allow" });

    await page.getByRole("button", { name: "Pause music" }).click();
    await expect(bar).toHaveCSS("animation-name", "none");
    await expect(bar).toHaveCSS("transform", "none");
    await expect(bar).toHaveAttribute("d", "M300 58v4");
    await page.waitForTimeout(150);
    expect(await transform()).toBe("none");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator(".music-record-toggle").click();
  }
});

test("music controls remain usable on mobile and desktop", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    const player = page.getByRole("group", { name: "Music player" });
    const bounds = (await player.boundingBox())!;
    const diameter = width <= 760 ? 76 : 92;
    expect(bounds.width).toBe(diameter);
    expect(bounds.height).toBe(diameter);
    await expect(player.getByRole("button")).toHaveCount(1);
    await expect(page.locator(".music-record-toggle")).toHaveCSS("border-radius", "50%");
    await expect(player).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    expect(bounds.x).toBe(width <= 760 ? 12 : 20);
    expect(bounds.y + bounds.height / 2).toBeCloseTo(844 / 2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `artifacts/background-music-${width}.png` });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("link", { name: "02 INTRODUCTION" }).click();
  await page.getByRole("button", { name: "Open playlist" }).click();
  await expect(page.getByRole("button", { name: "Pause music" })).toBeVisible();
  await page.getByRole("button", { name: "Pause music" }).click();
  await page.locator(".music-record-toggle").click();
  await page.locator(".site-footer").getByRole("link", { name: "BACK TO EXPLORE", exact: true }).click();
  await page.getByRole("button", { name: "Open playlist" }).click();
  await expect(page.getByRole("button", { name: "Play music" })).toBeVisible();
});

test("failed audio offers a working retry", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/audio/background-music.mp3", route => route.fulfill({ status: 404, body: "" }), { times: 1 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open playlist" }).click();
  await page.getByRole("button", { name: "Play music" }).click();
  await expect(page.getByRole("status")).toContainText("Music unavailable. Press play to retry.");
  await expect(page.getByRole("button", { name: "Play music" })).toBeEnabled();
  await page.getByRole("button", { name: "Play music" }).click();
  await expect(page.getByRole("button", { name: "Pause music" })).toBeVisible();
  await expect(page.getByRole("status")).toBeEmpty();
});

test("music starts automatically when the browser permits autoplay", async ({ playwright }) => {
  const browser = await playwright.chromium.launch({ channel: "chrome", args: ["--autoplay-policy=no-user-gesture-required"] });
  try {
    const page = await browser.newPage({ baseURL: test.info().project.use.baseURL });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.getByRole("button", { name: "Open playlist" }).click();
    await expect(page.getByRole("button", { name: "Pause music" })).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => page.locator(".background-music audio").evaluate((element: HTMLAudioElement) => element.currentTime)).toBeGreaterThan(0.1);
    expect(await page.locator(".background-music audio").evaluate((element: HTMLAudioElement) => element.volume)).toBeCloseTo(0.35);
  } finally {
    await browser.close();
  }
});
