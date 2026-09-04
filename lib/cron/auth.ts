export function validateCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) {
    return true;
  }

  const cronHeader = request.headers.get("x-cron-secret");
  if (cronHeader === secret) {
    return true;
  }

  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");
  if (querySecret === secret) {
    return true;
  }

  return false;
}

export function cronUnauthorizedResponse(): Response {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
