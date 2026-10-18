import { expect, test } from "@playwright/test";
import { academicNotebook } from "../src/content";
import chinese from "../src/locales/zh.json";

test("physical book opens on its hinge, responds to hover and keyboard, and sleeps when settled", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  const stage = page.locator(".academic-stage");
  const scene = page.locator(".academic-scene");
  const button = page.locator(".academic-book");
  await stage.scrollIntoViewIfNeeded();
  await expect(stage).toHaveAttribute("data-scene-ready", "true");
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await expect(scene).toHaveAttribute("data-hinge", "0.000");
  await page.mouse.move(10, 10);
  await expect(scene).toHaveAttribute("data-motion", "idle");
  const frames = await scene.getAttribute("data-frames");
  await page.waitForTimeout(300);
  expect(await scene.getAttribute("data-frames")).toBe(frames);
  await button.hover();
  await expect.poll(async () => Number(await scene.getAttribute("data-frames"))).toBeGreaterThan(Number(frames));
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await page.mouse.move(10, 10);
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await expect.poll(async () => Number(await scene.getAttribute("data-book-height"))).toBeGreaterThan(.3);
  expect(Number(await scene.getAttribute("data-book-height"))).toBeLessThan(2.2);
  expect(Number(await scene.getAttribute("data-book-scale"))).toBeLessThan(2.05);
  await expect.poll(async () => Number(await scene.getAttribute("data-hinge"))).toBeGreaterThan(3);
  await expect(page.locator(".academic-book-content")).toHaveCount(0);
  await expect(page.locator("#academic-book-content")).toHaveClass("sr-only");
  await expect(scene).toHaveAttribute("data-motion", "idle");
  await expect(scene).toHaveAttribute("data-book-height", "2.200");
  await expect(scene).toHaveAttribute("data-book-scale", "2.050");
  await stage.screenshot({ path: "artifacts/academic-book-3d-open.png", style: ".background-music { visibility: hidden !important; }" });
  await page.locator(".academic-inbook-close").click();
  await expect(button).toBeFocused();
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await expect.poll(async () => Number(await scene.getAttribute("data-hinge"))).toBeLessThan(.01);
  await page.mouse.move(10, 10);
  await button.blur();
  await expect(scene).toHaveAttribute("data-motion", "idle");
  await stage.screenshot({ path: "artifacts/academic-book-3d-closed.png", style: ".background-music { visibility: hidden !important; }" });
  expect(errors).toEqual([]);
});

for (const language of ["en", "zh"]) {
  test(`book stays proportional on phones and desktops and reduced motion snaps to the open state (${language})`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/?lang=${language}`);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      const stage = page.locator(".academic-stage");
      const scene = page.locator(".academic-scene");
      const book = page.locator(".academic-book");
      await stage.scrollIntoViewIfNeeded();
      await expect(stage).toHaveAttribute("data-scene-ready", "true");
      await expect(scene).toHaveAttribute("data-book-scale", "1.000");
      const stageBox = (await stage.boundingBox())!;
      const bookBox = (await book.boundingBox())!;
      expect(Math.abs(stageBox.width - stageBox.height)).toBeLessThan(1);
      expect(bookBox.width / stageBox.width).toBeLessThan(.33);
      expect(bookBox.height).toBeGreaterThan(bookBox.width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await stage.screenshot({ path: `artifacts/academic-book-3d-${language}-${width}.png`, style: ".background-music { visibility: hidden !important; }" });
      await book.focus();
      await book.press("Space");
      await expect(book).toHaveAttribute("aria-expanded", "true");
      await expect(scene).toHaveAttribute("data-hinge", "3.094");
      await expect(scene).toHaveAttribute("data-motion", "static");
      const openBox = (await book.boundingBox())!;
      expect(openBox.width).toBeGreaterThan(bookBox.width * 2);
      expect(openBox.x).toBeGreaterThanOrEqual(0);
      expect(openBox.x + openBox.width).toBeLessThanOrEqual(width);
      await expect(page.locator(".academic-book-content")).toHaveCount(0);
      expect((await page.locator("#academic-book-content").boundingBox())!.height).toBeLessThanOrEqual(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.locator(".academic-page-hit-right").click();
      await expect(scene).toHaveAttribute("data-page-turn", "3.142");
      await expect(page.locator(".academic-reader-page h3")).toHaveText(language === "zh" ? ["研究项目", "实践经历"] : ["Research Projects", "Professional Experience"]);
      await stage.screenshot({ path: `artifacts/academic-book-second-${language}-${width}.png`, style: ".background-music { visibility: hidden !important; }" });
      await page.locator(".academic-page-hit-left").click();
      await expect(scene).toHaveAttribute("data-page-turn", "0.000");
      await stage.screenshot({ path: `artifacts/academic-book-3d-open-${language}-${width}.png`, style: ".background-music { visibility: hidden !important; }" });
      await page.locator(".academic-inbook-close").click();
      await expect(book).toHaveAttribute("aria-expanded", "false");
      await expect(scene).toHaveAttribute("data-hinge", "0.000");
      await expect(scene).toHaveAttribute("data-book-scale", "1.000");
      await book.blur();
      await page.mouse.move(10, 10);
      await expect(scene).toHaveAttribute("data-book-height", "0.100");
      expect((await book.boundingBox())!.width).toBeCloseTo(bookBox.width, 0);
    }
  });
}

test("microphone and headphones lift on hover and focus without opening the book", async ({ page }) => {
  await page.goto("/");
  const stage = page.locator(".academic-stage");
  const scene = page.locator(".academic-scene");
  await stage.scrollIntoViewIfNeeded();
  await expect(stage).toHaveAttribute("data-scene-ready", "true");
  for (const prop of ["microphone", "headphones"]) {
    const target = page.locator(`.academic-prop-${prop}`);
    await target.hover();
    await expect(scene).toHaveAttribute(`data-${prop}`, "1.000");
    await target.click();
    await expect(page.locator(".academic-book")).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#academic-book-content")).toBeHidden();
    await page.mouse.move(10, 10);
    await target.blur();
    await expect(scene).toHaveAttribute(`data-${prop}`, "0.000");
    await page.keyboard.press("Tab");
    await target.focus();
    await expect(scene).toHaveAttribute(`data-${prop}`, "1.000");
    expect(await target.evaluate(el => getComputedStyle(el).outlineStyle)).toBe("solid");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Space");
    await expect(page.locator(".academic-book")).toHaveAttribute("aria-expanded", "false");
    await target.blur();
    await expect(scene).toHaveAttribute(`data-${prop}`, "0.000");
  }
  await expect(scene).toHaveAttribute("data-motion", "idle");
});

test("book reverses its flight and responds immediately to a changed motion preference", async ({ page }) => {
  await page.goto("/");
  const stage = page.locator(".academic-stage");
  const scene = page.locator(".academic-scene");
  const book = page.locator(".academic-book");
  await stage.scrollIntoViewIfNeeded();
  await expect(stage).toHaveAttribute("data-scene-ready", "true");
  await book.focus();
  await book.press("Enter");
  await expect.poll(async () => Number(await scene.getAttribute("data-book-scale"))).toBeGreaterThan(1.05);
  await book.press("Enter");
  await expect(scene).toHaveAttribute("data-hinge", "0.000");
  await book.blur();
  await page.mouse.move(10, 10);
  await expect(scene).toHaveAttribute("data-book-height", "0.100");
  await book.press("Enter");
  await expect.poll(async () => Number(await scene.getAttribute("data-book-scale"))).toBeGreaterThan(1.05);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(scene).toHaveAttribute("data-motion", "static");
  await expect(scene).toHaveAttribute("data-book-height", "2.200");
  await expect(scene).toHaveAttribute("data-book-scale", "2.050");
  await expect(scene).toHaveAttribute("data-hinge", "3.094");
});

test("context loss keeps the fallback and book controls usable and restoration rebuilds the book", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const stage = page.locator(".academic-stage");
  await stage.scrollIntoViewIfNeeded();
  await expect(stage).toHaveAttribute("data-scene-ready", "true");
  const supported = await page.locator(".academic-scene canvas").evaluate(canvas => {
    const gl = (canvas as HTMLCanvasElement).getContext("webgl2");
    const extension = gl?.getExtension("WEBGL_lose_context");
    if (!extension) return false;
    (window as Window & { restoreAcademicContext?: () => void }).restoreAcademicContext = () => extension.restoreContext();
    extension.loseContext();
    return true;
  });
  expect(supported).toBe(true);
  await expect(stage).toHaveAttribute("data-scene-ready", "false");
  await expect(page.locator(".academic-book-fallback")).toBeVisible();
  await page.locator(".academic-book").press("Enter");
  await expect(page.locator("#academic-book-content")).toBeVisible();
  await page.locator(".academic-page-hit-right").click();
  await expect(page.locator("#academic-book-content")).toContainText("115");
  await page.evaluate(() => (window as Window & { restoreAcademicContext?: () => void }).restoreAcademicContext?.());
  await expect(stage).toHaveAttribute("data-scene-ready", "true");
  await expect(page.locator(".academic-scene canvas")).toHaveCount(1);
  await expect(page.locator(".academic-book-fallback")).toBeHidden();
  await expect(page.locator(".academic-scene")).toHaveAttribute("data-hinge", "3.094");
  await expect(page.locator(".academic-scene")).toHaveAttribute("data-page-turn", "3.142");
  await page.locator(".academic-inbook-close").click();
  await expect(page.locator(".academic-book")).toHaveAttribute("aria-expanded", "false");
});

for (const language of ["en", "zh"] as const) {
  test(`all four physical pages contain the complete supplied copy within their printed frames (${language})`, async ({ page }) => {
    await page.addInitScript(() => {
      type PrintedPage = { text: string[]; right: number; bottom: number };
      const pages: PrintedPage[] = [];
      (window as unknown as { notebookPrints: PrintedPage[] }).notebookPrints = pages;
      const canvases = new WeakMap<HTMLCanvasElement, PrintedPage>();
      const original = CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText = function (...args: Parameters<typeof original>) {
        if (this.canvas.width === 1440 && this.canvas.height === 2040) {
          let printed = canvases.get(this.canvas);
          if (!printed) { printed = { text: [], right: 0, bottom: 0 }; pages.push(printed); canvases.set(this.canvas, printed); }
          const matrix = this.getTransform();
          printed.text.push(args[0]);
          printed.right = Math.max(printed.right, matrix.e + (args[1] + this.measureText(args[0]).width) * matrix.a);
          printed.bottom = Math.max(printed.bottom, matrix.f + args[2] * matrix.d);
        }
        return original.apply(this, args);
      };
    });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/?lang=${language}#academic-experience`);
    await page.locator(".academic-stage").scrollIntoViewIfNeeded();
    await expect(page.locator(".academic-stage")).toHaveAttribute("data-scene-ready", "true");
    const printed = await page.evaluate(() => (window as unknown as { notebookPrints: { text: string[]; right: number; bottom: number }[] }).notebookPrints);
    expect(printed).toHaveLength(4);
    const { education, skills, interests, projects, experience } = academicNotebook;
    const expected = [
      ["Education", ...Object.values(education), "Skills", ...skills.flatMap(skill => [skill.title, skill.description, ...(skill.note ? [skill.note] : [])])],
      ["Research Interests", ...interests.flatMap(interest => [interest.title, interest.description])],
      ["Research Projects", ...projects.flatMap(project => [project.title, project.role, project.location, project.period, ...project.bullets])],
      ["Professional Experience", ...experience.flatMap(item => [item.title, item.role, item.location, item.period, ...item.bullets])],
    ];
    const dictionary: Record<string, string> = chinese;
    const normalize = (text: string) => text.replace(/\s+/gu, "");
    expected.forEach((strings, index) => {
      const actual = normalize(printed[index].text.join(""));
      strings.forEach(source => {
        if (language === "zh") expect(dictionary[source], `missing translation: ${source}`).toBeTruthy();
        expect(actual).toContain(normalize(language === "zh" ? dictionary[source] : source));
      });
      expect(printed[index].right).toBeLessThan(1390);
      expect(printed[index].bottom).toBeLessThan(1980);
    });
  });
}

test("in-book page clicks reverse the sheet, keyboard controls work, and language switching preserves the spread", async ({ page }) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/?lang=en#academic-experience");
  const scene = page.locator(".academic-scene");
  await page.locator(".academic-stage").scrollIntoViewIfNeeded();
  await expect(page.locator(".academic-stage")).toHaveAttribute("data-scene-ready", "true");
  await page.locator(".academic-book").click();
  await expect(scene).toHaveAttribute("data-motion", "idle");
  const next = page.locator(".academic-page-hit-right");
  const previous = page.locator(".academic-page-hit-left");
  await expect(previous).toBeDisabled();
  await expect(next.locator(".academic-page-cue")).toHaveText(">>");
  await next.click();
  await expect.poll(async () => Number(await scene.getAttribute("data-page-turn"))).toBeGreaterThan(.1);
  expect(Number(await scene.getAttribute("data-page-turn"))).toBeLessThan(Math.PI);
  await previous.click();
  await expect(scene).toHaveAttribute("data-page-turn", "0.000");
  await next.focus();
  await next.press("Enter");
  await expect(scene).toHaveAttribute("data-page-turn", "3.142");
  await expect(scene).toHaveAttribute("data-motion", "idle");
  await page.getByRole("button", { name: "切换为中文" }).click();
  await page.locator(".academic-stage").scrollIntoViewIfNeeded();
  await expect(scene).toHaveAttribute("data-spread", "2");
  await expect(page.locator("#academic-book-content")).toContainText("广西玉柴");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(previous.locator(".academic-page-cue")).toHaveCSS("animation-name", "none");
  await previous.focus();
  await previous.press("Space");
  await expect(scene).toHaveAttribute("data-page-turn", "0.000");
  await page.locator(".academic-inbook-close").focus();
  await page.keyboard.press("Escape");
  await expect(page.locator(".academic-book")).toBeFocused();
  await expect(page.locator(".academic-book")).toHaveAttribute("aria-expanded", "false");
  expect(errors).toEqual([]);
});
