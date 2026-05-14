import crypto from "crypto";

export type QstashVerifyOptions = {
  signature: string;
  body: string;
  url?: string;
  currentSigningKey?: string;
  nextSigningKey?: string;
  clockToleranceSeconds?: number;
};

type JwtPayload = {
  iss?: string;
  sub?: string;
  exp?: number;
  nbf?: number;
  body?: string;
};

const PADDING = /=+$/;

function base64UrlEncode(input: Buffer) {
  return input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(PADDING, "");
}

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, "base64");
}

function verifyJwtWithKey(token: string, key: string) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid signature format");

  const [headerB64, payloadB64, signatureB64] = parts;
  const headerJson = JSON.parse(base64UrlDecode(headerB64).toString("utf8"));

  if (headerJson.alg !== "HS256") {
    throw new Error("Unsupported signature algorithm");
  }

  const signingInput = `${headerB64}.${payloadB64}`;
  const expected = crypto.createHmac("sha256", key).update(signingInput).digest();
  const actual = base64UrlDecode(signatureB64);

  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    throw new Error("Signature mismatch");
  }

  return JSON.parse(base64UrlDecode(payloadB64).toString("utf8")) as JwtPayload;
}

function verifyClaims(payload: JwtPayload, body: string, url?: string, tolerance = 0) {
  if (payload.iss !== "Upstash") {
    throw new Error("Invalid issuer");
  }

  if (url && payload.sub !== url) {
    throw new Error("Invalid subject");
  }

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === "number" && now - tolerance >= payload.exp) {
    throw new Error("Signature expired");
  }
  if (typeof payload.nbf === "number" && now + tolerance < payload.nbf) {
    throw new Error("Signature not active");
  }

  if (!payload.body) {
    throw new Error("Missing body hash");
  }

  const bodyHash = base64UrlEncode(crypto.createHash("sha256").update(body).digest());
  if (payload.body.replace(PADDING, "") !== bodyHash.replace(PADDING, "")) {
    throw new Error("Body hash mismatch");
  }
}

export function verifyQstashSignature(options: QstashVerifyOptions) {
  const {
    signature,
    body,
    url,
    currentSigningKey,
    nextSigningKey,
    clockToleranceSeconds = 0,
  } = options;

  if (!currentSigningKey && !nextSigningKey) {
    throw new Error("Signing keys are missing");
  }

  if (!signature) {
    throw new Error("Missing signature");
  }

  try {
    if (!currentSigningKey) throw new Error("No current signing key");
    const payload = verifyJwtWithKey(signature, currentSigningKey);
    verifyClaims(payload, body, url, clockToleranceSeconds);
    return true;
  } catch (err) {
    if (!nextSigningKey) {
      throw err;
    }
    const payload = verifyJwtWithKey(signature, nextSigningKey);
    verifyClaims(payload, body, url, clockToleranceSeconds);
    return true;
  }
}
