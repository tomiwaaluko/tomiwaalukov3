#!/usr/bin/env node
/**
 * Vercel Ignored Build Step.
 * Exit 0 = skip this deployment; exit 1 = build it.
 *
 * Dependabot PRs were creating a full ~522 MB preview of this site for
 * package bumps. Skip those; production and human-authored previews still build.
 */
const author = process.env.VERCEL_GIT_COMMIT_AUTHOR_LOGIN ?? '';
const ref = process.env.VERCEL_GIT_COMMIT_REF ?? '';
const skip =
  author === 'dependabot[bot]' ||
  author.startsWith('dependabot') ||
  ref.startsWith('dependabot/');

if (skip) {
  console.log(`[ignore] skipping Dependabot deployment (${author} / ${ref})`);
  process.exit(0);
}

process.exit(1);
