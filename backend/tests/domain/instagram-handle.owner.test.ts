// Seam: the domain layer, without HTTP or a database. An InstagramHandle is the bar's name on Instagram, the handle
// alone: the site builds every link and the "@…" it shows from it.
import { describe, expect, it } from 'vitest';
import { InstagramHandle, InvalidInstagramHandleError } from '../../src/domain/venue-settings/instagram-handle.ts';
import { expectRefusal } from '../support/expect-refusal.ts';

describe('InstagramHandle', () => {
  it.each(['oscarclub_official', 'oscar.club', 'oscar2026'])('keeps %s', (text) => {
    expect(InstagramHandle.parse(text).toString()).toBe(text);
  });

  it.each([
    ['a link to the profile', 'https://www.instagram.com/oscarclub_official/'],
    ['a space inside', 'oscar club'],
    ['nothing', ''],
  ])('refuses %s', (_case, text) => {
    expectRefusal(() => InstagramHandle.parse(text), InvalidInstagramHandleError);
  });
});
