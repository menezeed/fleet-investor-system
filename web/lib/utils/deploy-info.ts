// Vercel automatically injects these at build time for every deployment —
// no manual version bumping needed. They are undefined when running locally
// (npm run dev), so we fall back to "dev" in that case.
// Docs: https://vercel.com/docs/projects/environment-variables/system-environment-variables

export function getDeployInfo() {
  const commitSha = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA;
  const commitMessage = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_MESSAGE;

  if (!commitSha) {
    return { shortSha: 'dev', commitMessage: null };
  }

  return {
    shortSha: commitSha.slice(0, 7),
    commitMessage: commitMessage ?? null,
  };
}
