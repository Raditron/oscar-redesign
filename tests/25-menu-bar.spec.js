// #25 / #26: guests open the menu from the QR code at the bar, so Call and Directions are no use there (#25), and
// a bar holding only Home duplicated the header's link home (#26). The menu has no thumb bar; home keeps its own.
const { test, expect } = require('@playwright/test');
const H = require('./helpers');

for (const lang of ['bg', 'en']) {
  for (const vp of ['phone', 'desktop']) {
    test(`menu ${lang.toUpperCase()} · ${vp}: no thumb bar at all`, async ({ page }) => {
      await page.setViewportSize(H.VIEWPORTS[vp]);
      await H.openPage(page, H.page(lang, 'menu').path);
      await expect(page.getByRole('navigation', { name: H.CHROME[lang].quick })).toHaveCount(0);
      await expect(page.locator('.v2-abar')).toHaveCount(0);
    });
  }

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
