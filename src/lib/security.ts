type RateLimitOptions = {
	key: string;
	limit?: number;
	windowMs?: number;
};

type RateLimitState = {
	count: number;
	reset: number;
};

const rateLimitStore = new Map<string, RateLimitState>();

export function rateLimit({ key, limit = 20, windowMs = 60_000 }: RateLimitOptions) {
	const now = Date.now();
	const existing = rateLimitStore.get(key);

	if (!existing || existing.reset < now) {
		const next = { count: 1, reset: now + windowMs };
		rateLimitStore.set(key, next);
		return { allowed: true, remaining: limit - 1, reset: next.reset };
	}

	if (existing.count >= limit) {
		return { allowed: false, remaining: 0, reset: existing.reset };
	}

	existing.count += 1;
	rateLimitStore.set(key, existing);
	return { allowed: true, remaining: limit - existing.count, reset: existing.reset };
}

export function getClientIp(req: Request) {
	const forwarded = req.headers.get("x-forwarded-for");
	if (forwarded) {
		return forwarded.split(",")[0]?.trim() || "unknown";
	}
	return req.headers.get("x-real-ip") || "unknown";
}

export function isJsonRequest(req: Request) {
	const contentType = req.headers.get("content-type") || "";
	return contentType.includes("application/json");
}

export function isSameOrigin(req: Request) {
	const origin = req.headers.get("origin");
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

	if (!origin || !siteUrl) return true;

	try {
		const originHost = new URL(origin).host;
		const siteHost = new URL(siteUrl).host;
		return originHost === siteHost;
	} catch {
		return false;
	}
}
