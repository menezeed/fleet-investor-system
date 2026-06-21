const withNextIntl = require('next-intl/plugin')('./lib/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Vercel injects VERCEL_GIT_COMMIT_SHA automatically on every deploy, but
  // only NEXT_PUBLIC_-prefixed vars reach the browser. Re-exposing it here
  // lets the UI show which commit is actually live (see lib/utils/deploy-info.ts),
  // without any manual version bumping.
  env: {
    NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA,
    NEXT_PUBLIC_VERCEL_GIT_COMMIT_MESSAGE: process.env.VERCEL_GIT_COMMIT_MESSAGE,
  },
};

module.exports = withNextIntl(nextConfig);
