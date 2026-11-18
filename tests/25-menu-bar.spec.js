// #25: guests open the menu from the QR code at the bar, so its phone thumb bar carries only Home: no Call, no
// Directions. Home keeps the full bar.
const { test, expect } = require('@playwright/test');
const H = require('./helpers');

const HOME = { bg: 'Начало', en: 'Home' };

for (const lang of ['bg', 'en']) {
  test(`menu ${lang.toUpperCase()} · phone: the thumb bar holds only Home, across the full width`, async ({ page }) => {
    await page.setViewportSize(H.VIEWPORTS.phone);
    await H.openPage(page, H.page(lang, 'menu').path);
    const bar = page.getByRole('navigation', { name: H.CHROME[lang].quick });
    await expect(bar).toBeVisible();
    const links = bar.getByRole('link');
    await expect(links).toHaveCount(1);
    await expect(links.first()).toHaveAccessibleName(HOME[lang]);
    await expect(links.first()).toHaveAttribute('href', '../index.html');
    await expect(bar.locator('a[href^="tel:"], a[href*="google.com/maps"]')).toHaveCount(0);
    const w = await bar.evaluate(n => ({ bar: n.getBoundingClientRect().width, link: n.querySelector('a').getBoundingClientRect().width }));
    expect(Math.abs(w.bar - w.link)).toBeLessThan(2);
    // still within thumb reach while scrolling, and gone on desktop
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight / 2));
    await expect(bar).toBeInViewport();
    await page.setViewportSize(H.VIEWPORTS.desktop);
    await expect(bar).toBeHidden();
  });

  test(`home ${lang.toUpperCase()} · phone: the thumb bar keeps Call, Directions and Menu`, async ({ page }) => {
    await page.setViewportSize(H.VIEWPORTS.phone);
    await H.openPage(page, H.page(lang, 'home').path);
    const links = page.getByRole('navigation', { name: H.CHROME[lang].quick }).getByRole('link');
    await expect(links).toHaveCount(3);
    await expect(links.nth(0)).toHaveAttribute('href', 'tel:+359899666633');
    await expect(links.nth(1)).toHaveAttribute('href', /google\.com\/maps/);
    await expect(links.nth(2)).toHaveAttribute('href', 'mainmenu/index.html');
  });
}
