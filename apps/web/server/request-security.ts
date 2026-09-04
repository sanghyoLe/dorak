export function isCrossSiteMutation(request: Request): boolean {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  const deployed = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);

  return (
    fetchSite === "cross-site" ||
    (origin !== null && origin !== requestUrl.origin) ||
    (deployed && origin === null)
  );
}
