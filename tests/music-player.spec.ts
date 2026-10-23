import { expect, test, type Page } from "@playwright/test";

test.use({ baseURL: "http://127.0.0.1:5200", launchOptions: { args: ["--autoplay-policy=document-user-activation-required"] } });

const fixture = "/tests/fixtures/music-player.html";
const audio = (page: Page) => page.locator(".background-music audio");
const selected = (page: Page) => page.locator('.music-track[aria-current="true"]');
async function openPlayer(page: Page, query = "") {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${fixture}${query}`);
  await page.getByRole("button", { name: "Open playlist" }).click();
}
async function expectPlaying(page: Page) {
  await expect(page.locator(".background-music")).toHaveAttribute("data-playing", "true");
  await expect(page.getByTestId("playing-state")).toHaveText("true");
}

test("opening only reveals controls; playback, seeking, volume and mute use one audio element", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const requested: string[] = [];
  page.on("request", request => { if (request.url().includes("/audio/")) requested.push(request.url()); });
  await openPlayer(page);
  await expect(audio(page)).toHaveJSProperty("paused", true);
  await expect(page.locator(".music-intro-hint")).toHaveCount(0);
  await expect(page.locator("audio")).toHaveCount(1);
  await expect(page.getByRole("status")).toBeEmpty();
  await page.locator(".music-main-play").click();
  await expectPlaying(page);
  await expect.poll(() => audio(page).evaluate((a: HTMLAudioElement) => a.currentTime)).toBeGreaterThan(.1);
  await expect(audio(page)).toHaveJSProperty("volume", .35);
  await expect(page.getByRole("slider", { name: "Playback position" })).toBeEnabled();
  await page.locator(".music-main-play").click();
  await page.getByRole("slider", { name: "Playback position" }).fill("12.5");
  await expect(audio(page)).toHaveJSProperty("currentTime", 12.5);
  const volume = page.getByRole("slider", { name: "Music volume" });
  await volume.fill("62");
  await volume.focus();
  await page.keyboard.press("ArrowRight");
  await expect(audio(page)).toHaveJSProperty("volume", .63);
  await page.getByRole("button", { name: "Mute music", exact: true }).click();
  await expect(audio(page)).toHaveJSProperty("muted", true);
  await page.getByRole("button", { name: "Unmute music", exact: true }).click();
  await expect(audio(page)).toHaveJSProperty("muted", false);
  await expect(audio(page)).toHaveJSProperty("volume", .63);
  await volume.fill("0");
  await page.getByRole("button", { name: "Unmute music", exact: true }).click();
  await expect(audio(page)).toHaveJSProperty("volume", .35);
  await page.locator(".music-main-play").click();
  await expectPlaying(page);
  expect(requested.every(url => url.includes("fixture=0"))).toBe(true);
  expect(errors).toEqual([]);
});

test("ordered playback, search, history, end-of-track and rapid source changes", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await openPlayer(page);
  await page.getByRole("button", { name: "Next track" }).click();
  await expect(selected(page)).toContainText("Fixture song 02");
  await expectPlaying(page);
  await expect(page.locator(".music-cover img")).toHaveJSProperty("naturalWidth", 256);
  await audio(page).evaluate(a => a.dataset.retained = "yes");
  await page.getByRole("searchbox", { name: "Search songs" }).fill("no such song");
  await expect(page.locator(".music-empty")).toHaveText("No songs match your search.");
  await expectPlaying(page);
  await page.getByRole("searchbox").fill("fixture song 03");
  await page.getByRole("button", { name: /^Play track:/ }).click();
  await expectPlaying(page);
  await expect(page.locator(".music-current-copy h3")).toContainText("Fixture song 03");
  await page.getByRole("searchbox").fill("");
  await page.getByRole("button", { name: "Previous track" }).click();
  await expect(selected(page)).toContainText("Fixture song 02");
  await page.getByRole("button", { name: "Next track" }).click();
  await expect(selected(page)).toContainText("Fixture song 03");
  await expectPlaying(page);
  await audio(page).evaluate((a: HTMLAudioElement) => a.currentTime = a.duration - .15);
  await expect(selected(page)).toContainText("Background music");
  await expectPlaying(page);
  await page.locator(".music-track").nth(1).click();
  await page.locator(".music-track").nth(2).click();
  await page.locator(".music-track").nth(0).click();
  await expectPlaying(page);
  await expect(selected(page)).toContainText("Background music");
  await expect(audio(page)).toHaveAttribute("data-retained", "yes");
  await expect(page.getByRole("status")).toBeEmpty();
  expect(errors).toEqual([]);
});

test("shuffle visits the whole round without repetition and previous returns through history", async ({ page }) => {
  await openPlayer(page, "?count=5");
  await page.getByRole("button", { name: "Playback mode: In order", exact: true }).click();
  const played = [await selected(page).getAttribute("aria-label")];
  for (let i = 0; i < 4; i++) {
    await page.getByRole("button", { name: "Next track" }).click();
    await expectPlaying(page);
    played.push(await selected(page).getAttribute("aria-label"));
  }
  expect(new Set(played).size).toBe(5);
  await page.getByRole("button", { name: "Previous track" }).click();
  await expect(selected(page)).toHaveAttribute("aria-label", played[3]!);
  await page.getByRole("button", { name: "Next track" }).click();
  await expect(selected(page)).toHaveAttribute("aria-label", played[4]!);
  await page.getByRole("button", { name: "Playback mode: Shuffle", exact: true }).click();
  await expect(audio(page)).toHaveJSProperty("loop", true);
  await expectPlaying(page);
  await audio(page).evaluate((a: HTMLAudioElement) => a.currentTime = a.duration - .15);
  await expect.poll(() => audio(page).evaluate((a: HTMLAudioElement) => a.currentTime)).toBeLessThan(2);
  await expect(selected(page)).toHaveAttribute("aria-label", played[4]!);
  await page.getByRole("button", { name: "Playback mode: Repeat one", exact: true }).click();
  await expect(audio(page)).toHaveJSProperty("loop", false);
});

test("failed track can be retried or replaced without blocking the playlist", async ({ page }) => {
  await openPlayer(page);
  await page.route("**/audio/background-music.mp3?fixture=0", route => route.fulfill({ status: 404, body: "" }), { times: 1 });
  await page.locator(".music-main-play").click();
  await expect(page.getByRole("status")).toContainText("Music unavailable.");
  await page.getByRole("button", { name: "Retry playback" }).click();
  await expectPlaying(page);
  await expect(page.getByRole("status")).toBeEmpty();
  await page.goto(`${fixture}?broken`);
  await page.getByRole("button", { name: "Open playlist" }).click();
  await page.locator(".music-main-play").click();
  await expect(page.getByRole("status")).toContainText("Music unavailable.");
  await page.getByRole("button", { name: "Next track" }).click();
  await expectPlaying(page);
  await expect(selected(page)).toContainText("Fixture song 02");
  await expect(page.getByRole("status")).toBeEmpty();
});

test("buffering follows real media events and a pause cancels a pending load", async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/audio/background-music.mp3?fixture=1", async route => { await gate; await route.continue(); });
  await openPlayer(page);
  await page.locator(".music-track").nth(1).click();
  await expect(page.locator(".background-music")).toHaveAttribute("data-loading", "true");
  await expect(page.getByTestId("playing-state")).toHaveText("false");
  await page.locator(".music-main-play").click();
  release();
  await expect(audio(page)).toHaveJSProperty("paused", true);
  await expect(page.locator(".background-music")).toHaveAttribute("data-loading", "false");
  await page.locator(".music-main-play").click();
  await expectPlaying(page);
});

test("empty playlist is localized and disables transport", async ({ page }) => {
  await openPlayer(page, "?count=0");
  await expect(page.locator(".music-current-copy h3")).toHaveText("No songs yet");
  await expect(page.locator(".music-main-play")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Next track" })).toBeDisabled();
  await expect(page.getByRole("slider", { name: "Playback position" })).toBeDisabled();
  await page.getByRole("button", { name: "切换为中文" }).click();
  await expect(page.locator(".music-panel")).toBeVisible();
  await expect(page.locator(".music-empty")).toHaveText("录音添加后会显示在这里。");
  await expect(page.locator(".music-current-copy h3")).toHaveText("暂无歌曲");
  await expect(page.getByRole("status")).toBeEmpty();
});

test("many songs stay scrollable and load only the selected recording", async ({ page }) => {
  const requested = new Set<string>();
  page.on("request", request => { if (request.url().includes("/audio/")) requested.add(request.url()); });
  await openPlayer(page, "?count=80");
  await expect(page.locator(".music-track")).toHaveCount(80);
  expect(await page.locator(".music-track-list").evaluate(e => e.scrollHeight > e.clientHeight)).toBe(true);
  const currentBounds = await page.locator(".music-now-playing").boundingBox();
  await page.locator(".music-track").last().scrollIntoViewIfNeeded();
  expect(await page.locator(".music-now-playing").boundingBox()).toEqual(currentBounds);
  await page.locator(".music-track").last().click();
  await expectPlaying(page);
  expect([...requested].every(url => url.includes("fixture=79"))).toBe(true);
  await page.getByRole("searchbox").fill("Fixture song 02");
  await expect(page.locator(".music-track")).toHaveCount(1);
  await page.locator(".music-track").click();
  await expectPlaying(page);
  await expect(page.locator(".music-current-copy h3")).toHaveText("Fixture song 02");
});

test("late completion of an abandoned recording cannot replace the selected track", async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/audio/background-music.mp3?fixture=1", async route => { await gate; await route.continue().catch(() => {}); });
  await openPlayer(page);
  await page.locator(".music-track").nth(1).click();
  await expect(page.locator(".background-music")).toHaveAttribute("data-loading", "true");
  await page.locator(".music-track").nth(2).click();
  await expectPlaying(page);
  release();
  await expect(selected(page)).toContainText("Fixture song 03");
  await expect(audio(page)).toHaveJSProperty("paused", false);
  await expect(page.getByRole("status")).toBeEmpty();
  await expect(page.locator(".background-music")).toHaveAttribute("data-loading", "false");
});

test("record rotation follows playback, freezes on pause and respects live reduced motion", async ({ page }) => {
  await openPlayer(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const record = page.locator(".music-record-toggle .music-record");
  const transform = () => record.evaluate(element => getComputedStyle(element).transform);
  await page.locator(".music-main-play").click();
  await expectPlaying(page);
  await expect(record).toHaveCSS("animation-play-state", "running");
  const initial = await transform();
  await expect.poll(transform).not.toBe(initial);
  await page.locator(".music-main-play").click();
  await expect(record).toHaveCSS("animation-play-state", "paused");
  const paused = await transform();
  await page.waitForTimeout(150);
  expect(await transform()).toBe(paused);
  await page.locator(".music-main-play").click();
  await expectPlaying(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(record).toHaveCSS("animation-name", "none");
  await expect(page.locator(".music-panel")).toHaveCSS("animation-name", "none");
  await expect(audio(page)).toHaveJSProperty("paused", false);
});
