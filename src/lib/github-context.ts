import { estimateTokenCount, type TierLimits } from "@/lib/billing";

export type GitTreeItem = {
  path: string;
  type: string;
  size?: number;
};

export type GitTreeTrimResult = {
  items: GitTreeItem[];
  rawEstimatedTokens: number;
  estimatedTokens: number;
  trimmed: boolean;
  droppedCount: number;
};

const NON_ESSENTIAL_EXTENSIONS = [
  ".md",
  ".markdown",
  ".lock",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".webp",
  ".ico",
  ".pdf",
  ".mp4",
  ".mov",
  ".mp3",
  ".wav",
  ".zip",
  ".tar",
  ".gz",
  ".7z",
  ".bin",
];

const NON_ESSENTIAL_DIRS = [
  "/.git/",
  "/node_modules/",
  "/dist/",
  "/build/",
  "/.next/",
  "/.turbo/",
  "/coverage/",
  "/assets/",
  "/asset/",
  "/images/",
  "/image/",
  "/static/",
  "/public/",
  "/docs/",
  "/doc/",
  "/examples/",
  "/example/",
  "/test/",
  "/tests/",
  "/__tests__/",
  "/__fixtures__/",
];

const CONFIG_FILE_REGEX =
  /(pom\.xml|package\.json|build\.gradle|build\.gradle\.kts|application\.properties|requirements\.txt|pyproject\.toml|setup\.py|Pipfile|composer\.json|CMakeLists\.txt|Makefile|go\.mod|go\.sum|Cargo\.toml|Gemfile|mix\.exs|rebar\.config|project\.clj|Package\.swift|pubspec\.yaml|docker-compose\.ya?ml|Dockerfile)$/i;

export function parseGitHubRepoFromText(text: string): { owner: string; repo: string } | null {
  const match = text.match(/https?:\/\/(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/i);
  if (!match) return null;
  const owner = match[1];
  const repo = match[2].replace(/[.,;!?]+$/, "").replace(/\.git$/, "");
  return { owner, repo };
}

export function selectConfigCandidates(treeItems: GitTreeItem[]) {
  return treeItems.filter((item) => item.type === "blob" && CONFIG_FILE_REGEX.test(item.path));
}

function isNonEssentialPath(path: string) {
  const lower = path.toLowerCase();
  if (NON_ESSENTIAL_EXTENSIONS.some((ext) => lower.endsWith(ext))) return true;
  return NON_ESSENTIAL_DIRS.some((dir) => lower.includes(dir));
}

function depthOfPath(path: string) {
  return path.split("/").filter(Boolean).length;
}

export function trimGitTreePayload(treeItems: GitTreeItem[], limits: TierLimits): GitTreeTrimResult {
  const rawEstimatedTokens = estimateTokenCount(JSON.stringify(treeItems));

  let items = treeItems.filter((item) => item.type === "blob");
  let trimmed = false;
  const originalCount = items.length;

  if (rawEstimatedTokens > limits.maxTreeTokens || items.length > limits.maxTreeItems) {
    trimmed = true;
    items = items.filter((item) => !isNonEssentialPath(item.path));
    items = items.filter((item) => depthOfPath(item.path) <= limits.maxTreeDepth);
  }

  // Prioritize config files and shallow paths
  items.sort((a, b) => {
    const aIsConfig = CONFIG_FILE_REGEX.test(a.path);
    const bIsConfig = CONFIG_FILE_REGEX.test(b.path);
    if (aIsConfig !== bIsConfig) return aIsConfig ? -1 : 1;
    const depthDiff = depthOfPath(a.path) - depthOfPath(b.path);
    if (depthDiff !== 0) return depthDiff;
    return a.path.length - b.path.length;
  });

  if (items.length > limits.maxTreeItems) {
    trimmed = true;
    items = items.slice(0, limits.maxTreeItems);
  }

  const estimatedTokens = estimateTokenCount(JSON.stringify(items));

  return {
    items,
    rawEstimatedTokens,
    estimatedTokens,
    trimmed,
    droppedCount: Math.max(0, originalCount - items.length),
  };
}
