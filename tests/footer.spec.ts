import { expect, test } from "@playwright/test";

test("Academic ends the content and the portrait footer supports responsive keyboard navigation", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const footer = page.getByRole("contentinfo");
  await expect(page.locator("#creative-projects, #campus-and-music, .about-bottom")).toHaveCount(0);
  expect(await page.locator("#academic-experience").evaluate(element => element.nextElementSibling)).toBeNull();
  await expect(footer.getByRole("heading")).toHaveText("THANKS FORTUNING IN.");

  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await footer.scrollIntoViewIfNeeded();
    await expect.poll(() => footer.locator(".footer-background").evaluate(image =>
      (image as HTMLImageElement).naturalWidth)).toBe(2022);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `page overflow at ${width}`).toBe(true);
    expect(await footer.locator(".footer-copy, .footer-nav, .footer-bottom").evaluateAll(elements =>
      elements.every(element => element.scrollWidth <= element.clientWidth)), `footer overflow at ${width}`).toBe(true);
    await footer.screenshot({ path: `artifacts/footer-${width}.png`, style: ".skip-link, .background-music { visibility: hidden !important; }" });
  }

  const links = footer.getByRole("navigation").getByRole("link");
  const targets = ["introduction", "my-life", "academic-experience"];
  for (let index = 0; index < targets.length; index++) {
    await links.nth(index).focus();
    await expect(links.nth(index)).toBeFocused();
    expect(await links.nth(index).evaluate(element => getComputedStyle(element).outlineStyle)).toBe("solid");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(new RegExp(`#${targets[index]}$`));
    await expect(page.locator(`#${targets[index]}`)).toBeFocused();
  }
  await footer.getByRole("link", { name: "BACK TO EXPLORE" }).click();
  await expect(page).toHaveURL(/#explore$/);
  await footer.getByRole("link", { name: "BACK TO TOP" }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#index$/);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  expect(errors).toEqual([]);
});
