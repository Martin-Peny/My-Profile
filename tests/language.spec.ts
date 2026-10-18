import { expect, test } from "@playwright/test";

test("keyboard switching translates content, metadata, and accessible controls", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator(".profile-card h3")).toHaveText(["Introduction", "My life", "Academic Experience"]);
  const switcher = page.getByRole("button", { name: "切换为中文" });
  await switcher.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await expect(page).toHaveTitle("凌浩洋 — 走进我的频率");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /凌浩洋/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName("我是，凌浩洋");
  await expect(page.locator(".profile-card h3")).toHaveText(["个人介绍", "我的生活", "学术经历"]);
  await expect(page.locator(".about-me")).toHaveAttribute("lang", "zh-CN");
  await expect(page.locator(".about-me p").first()).toContainText("国际经济与贸易");
  await expect(page.locator(".my-life-copy")).toContainText("2022–2023");
  await expect(page.locator(".portrait-fallback")).toHaveAttribute("alt", /凌浩洋穿着红色连帽衫/);
  await expect(page.locator(".gallery-sequence").first().locator("img").first()).toHaveAttribute("alt", /蓝色灯光的舞台/);
  await expect(page.getByRole("group", { name: "背景音乐" })).toBeVisible();
  await expect(page.locator(".bgm-volume input")).toHaveAccessibleName("背景音乐音量");
  await expect(page.getByRole("button", { name: "Switch to English" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page).toHaveTitle("Haoyang Lin — Enter the Frequency");
  await expect(page.locator(".about-me")).toHaveAttribute("lang", "en");
  expect(errors).toEqual([]);
});

test("language links override saved preferences and preserve other query parameters and anchors", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?lang=zh&view=profile#explore");
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await page.goto("/?lang=en&view=profile#explore");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.getByRole("button", { name: "切换为中文" }).click();
  await expect(page).toHaveURL(/\?lang=zh&view=profile#explore$/);
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await page.goto("/?lang=invalid");
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
});

test("Chinese layouts, navigation, images, and book content work on mobile and desktop", async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?lang=zh");
  await page.evaluate(() => document.fonts.ready);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.locator(".language-switch").scrollIntoViewIfNeeded();
    await expect(page.locator(".language-switch")).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `page overflow at ${width}`).toBe(true);
    expect(await page.locator(".profile-card").evaluateAll(cards => cards.every(card => card.scrollWidth <= card.clientWidth)), `card overflow at ${width}`).toBe(true);
    await page.screenshot({ path: `artifacts/chinese-${width}.png` });
    if (width === 390 || width === 1440) {
      await page.locator(".explore-section").screenshot({ path: `artifacts/chinese-explore-${width}.png` });
      await page.locator(".gallery-content-space").screenshot({ path: `artifacts/chinese-about-${width}.png` });
    }
    if (width <= 760) {
      await page.getByRole("button", { name: "打开导航" }).click();
      await expect(page.getByRole("navigation", { name: "主导航" })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("button", { name: "打开导航" })).toBeFocused();
    }
    for (const id of ["introduction", "my-life", "academic-experience"]) {
      const card = page.locator(`.profile-card[href="#${id}"]`);
      await card.focus();
      await page.keyboard.press("Enter");
      await expect(page.locator(`#${id}`)).toBeFocused();
      await expect(page).toHaveURL(new RegExp(`#${id}$`));
    }
    expect(await page.locator('a[href^="#"]').evaluateAll(links => links.every(link => !!document.querySelector(link.getAttribute("href")!)))).toBe(true);
  }
  await page.getByRole("button", { name: "翻开学术笔记" }).click();
  await expect(page.locator("#academic-book-content")).toBeVisible();
  await expect(page.locator("#academic-book-content")).toContainText("宁波诺丁汉大学");
  await expect(page.locator(".academic-question-list li")).toHaveCount(3);
  await page.locator(".academic-workbench").screenshot({ path: "artifacts/chinese-academic.png" });
  await expect(page.locator(".academic-book-content")).toHaveCount(0);
  await page.locator(".academic-inbook-close").click();
  await expect(page.getByRole("button", { name: "翻开学术笔记" })).toBeFocused();
  await page.locator(".site-footer").scrollIntoViewIfNeeded();
  await expect(page.locator(".footer-background")).toHaveJSProperty("complete", true);
  await expect(page.locator(".footer-background")).not.toHaveJSProperty("naturalWidth", 0);
  await page.locator(".site-footer").screenshot({ path: "artifacts/chinese-footer.png" });
  expect(errors).toEqual([]);
});

test("switching preserves book, gallery, and audio state and rebuilds localized 3D text", async ({ page }) => {
  test.setTimeout(60_000);
  const painted: string[] = [];
  await page.exposeFunction("captureBookText", (text: string) => painted.push(text));
  await page.addInitScript(() => {
    const original = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (...args: Parameters<typeof original>) {
      void (window as unknown as { captureBookText: (text: string) => Promise<void> }).captureBookText(args[0]);
      return original.apply(this, args);
    };
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?lang=en#academic-experience");
  await page.locator(".academic-book").scrollIntoViewIfNeeded();
  await expect(page.locator(".academic-stage")).toHaveAttribute("data-scene-ready", "true");
  await page.getByRole("button", { name: "Open academic book" }).click();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator(".photo-gallery")).toHaveAttribute("data-motion", "auto");
  await page.getByRole("button", { name: "PAUSE GALLERY" }).click();
  await page.locator(".bgm-volume input").fill("62");
  await page.evaluate(() => document.querySelector("audio")!.dataset.retained = "yes");
  await page.getByRole("button", { name: "切换为中文" }).click();
  await expect(page.locator(".academic-book")).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("button", { name: "继续播放图库" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".bgm-volume input")).toHaveValue("62");
  await expect(page.locator("audio")).toHaveAttribute("data-retained", "yes");
  await expect(page.locator("audio")).toHaveJSProperty("volume", .62);
  await expect(page).toHaveURL(/lang=zh#academic-experience$/);
  await page.locator(".academic-book").scrollIntoViewIfNeeded();
  await expect(page.locator(".academic-stage")).toHaveAttribute("data-scene-ready", "true");
  await expect.poll(() => painted).toEqual(expect.arrayContaining(["学术", "宁波诺丁汉大学", "研究兴趣"]));
  await expect(page.locator("#academic-book-content")).toBeVisible();
});

test("language selection stays usable when browser storage is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new DOMException("Blocked", "SecurityError"); };
    Storage.prototype.setItem = () => { throw new DOMException("Blocked", "SecurityError"); };
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.getByRole("button", { name: "切换为中文" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
});
