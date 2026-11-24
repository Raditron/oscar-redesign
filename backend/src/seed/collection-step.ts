import type { SeedStep } from './seed-step.ts';

export interface CollectionStepOptions<T> {
  /** What it loads, in the words the seed reports: "events". */
  readonly name: string;
  /** The admin path that lists them (GET) and adds one (POST): "/admin/events". */
  readonly path: string;
  /** The site's content of this kind, as the admin API takes it. */
  readonly content: readonly T[];
  /** Whether one already there is the same as one of the site's, so the seed skips it. */
  readonly isSame: (there: T, site: T) => boolean;
}

/**
 * A step for a kind there are many of (Events, Categories, Cocktails): it has content when the admin list isn't
 * empty, and adds, one by one, the site's ones that match none already there. Each kind says only what "the same"
 * means for it, which is the one thing they differ in.
 */
export function collectionStep<T>({ name, path, content, isSame }: CollectionStepOptions<T>): SeedStep {
  return {
    name,

    async hasContent(api) {
      const there = (await api.get(path)) as unknown[];
      return there.length > 0;
    },

    async load(api) {
      const there = (await api.get(path)) as T[];
      const missing = content.filter((site) => !there.some((existing) => isSame(existing, site)));
      for (const site of missing) await api.post(path, site);
      return { added: missing.length, skipped: content.length - missing.length };
    },
  };
}

/** For a kind with a Slug: one already there is the same when it has the same slug, whatever else an Admin changed. */
export const sameSlug = (there: { readonly slug: string }, site: { readonly slug: string }): boolean => there.slug === site.slug;
