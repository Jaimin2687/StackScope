function normalizeBaseUrl(url: string) {
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

export async function enqueueScopeJob(jobId: string, destinationOverride?: string) {
  const qstashToken = process.env.QSTASH_TOKEN;
  const baseUrl = process.env.QSTASH_BASE_URL || "https://qstash.upstash.io";
  const siteUrl = destinationOverride || process.env.NEXT_PUBLIC_SITE_URL;
  const queueSecret = process.env.SCOPE_JOB_QUEUE_SECRET;

  if (!qstashToken || !siteUrl || !queueSecret) {
    throw new Error("QStash configuration is missing");
  }

  const normalizedSiteUrl = normalizeBaseUrl(siteUrl).replace(/\/$/, "");
  const destination = `${normalizedSiteUrl}/api/generate-scope/worker`;
  const publishUrl = `${baseUrl.replace(/\/$/, "")}/v2/publish/${destination}`;

  const response = await fetch(publishUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${qstashToken}`,
      "Content-Type": "application/json",
      "Upstash-Method": "POST",
      "Upstash-Forward-X-Queue-Token": queueSecret,
      "Upstash-Retries": "2",
      "Upstash-Timeout": "3m",
    },
    body: JSON.stringify({ jobId }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`QStash publish failed: ${response.status} ${text}`);
  }
}
