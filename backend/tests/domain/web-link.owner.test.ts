// Seam: the domain layer, without HTTP or a database. A WebLink is a link to a web page the site sends guests to (the
// bar's Facebook page, its directions on Google Maps): http or https only, since the site writes it into an <a href>.
import { describe, expect, it } from 'vitest';
import { InvalidWebLinkError, WebLink } from '../../src/domain/venue-settings/web-link.ts';
import { expectRefusal } from '../support/expect-refusal.ts';

describe('WebLink', () => {
  it.each([
    'https://www.facebook.com/OscarClub.sf',
    'https://www.google.com/maps/dir/?api=1&destination=Oscar+Club+Cocktail+bar%2C+Slavyanska+15%2C+Sofia',
    'http://oscarclubsofia.com/',
  ])('keeps %s', (text) => {
    expect(WebLink.parse(text).toString()).toBe(text);
  });

  it.each([
    ['a script', 'javascript:alert(1)'],
    ['an email link', 'mailto:oscarclub.sf@gmail.com'],
    ['a link without its scheme', 'www.facebook.com/OscarClub.sf'],
    ['a path on the site', '/en/'],
    ['nothing', ''],
  ])('refuses %s', (_case, text) => {
    expectRefusal(() => WebLink.parse(text), InvalidWebLinkError);
  });
});
