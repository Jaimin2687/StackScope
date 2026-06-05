import type { GeneratedScope } from "./types";
import { isRoutingEnabled } from "./feature-flags";

/**
 * Converts a raw string to Title Case while preserving known acronyms.
 * "CODEPRACTICE PLATFORM" → "CodePractice Platform"
 * "ai powered api" → "AI Powered API"
 */
function toTitleCase(str: string): string {
  const acronyms = new Set(["AI", "API", "SQL", "UI", "UX", "SLA", "MVP", "B2B", "B2C", "CRM", "ERP", "SDK", "CDN", "CI", "CD", "AWS", "GCP", "JWT", "OTP", "SMS", "PDF"]);
  return str
    .toLowerCase()
    .replace(/\b\w+/g, (word) => {
      const upper = word.toUpperCase();
      return acronyms.has(upper) ? upper : word.charAt(0).toUpperCase() + word.slice(1);
    });
}

export async function downloadScopePDF(scope: GeneratedScope, paymentLink?: string) {
  const { jsPDF } = await import("jspdf");

  // Capture Mermaid Diagram from DOM
  const getMermaidImage = async () => {
    if (typeof document === "undefined") return null;
    try {
      const container = document.getElementById("architecture-diagram");
      if (!container) return null;
      const svg = container.querySelector("svg");
      if (!svg) return null;

      const svgString = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const rect = svg.getBoundingClientRect();
      const width = svg.width?.baseVal?.value || rect.width || 800;
      const height = svg.height?.baseVal?.value || rect.height || 600;
      canvas.width = Math.max(width, 800);
      canvas.height = canvas.width * (height / width);
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const img = new window.Image();
      const encoded = btoa(unescape(encodeURIComponent(svgString)));
      return new Promise<string | null>((resolve) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/png", 1.0));
        };
        img.onerror = () => resolve(null);
        img.src = "data:image/svg+xml;base64," + encoded;
      });
    } catch {
      return null;
    }
  };

  const mermaidDataUrl = await getMermaidImage();

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const PAGE_W   = 210;
  const PAGE_H   = 297;
  const MARGIN_X = 22;
  const MARGIN_Y = 28;
  const CONTENT_W = PAGE_W - MARGIN_X * 2;

  let y = MARGIN_Y;

  // ─── Design tokens ────────────────────────────────────────────────────────
  const C = {
    ink:      [14, 14, 14]   as [number, number, number],  // headlines
    body:     [55, 55, 65]   as [number, number, number],  // body copy
    muted:    [130, 130, 140] as [number, number, number], // captions, footnotes
    rule:     [210, 210, 215] as [number, number, number], // dividers
    bg:       [248, 248, 250] as [number, number, number], // card backgrounds
    cover:    [10, 10, 14]   as [number, number, number],  // cover block
    white:    [255, 255, 255] as [number, number, number],
    accentFg: [255, 255, 255] as [number, number, number],
    accentBg: [14, 14, 14]   as [number, number, number],  // sprint pill bg
  };

  const LEGAL_FOOTER =
    "StackScope AI provides technical scoping and architectural blueprint generation. StackScope is not a party to this engagement. All services, deliverables, and refund obligations are strictly between the Client and the Developer.";

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /** Horizontal rule */
  const hr = (yPos: number, width = CONTENT_W, color = C.rule) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.25);
    doc.line(MARGIN_X, yPos, MARGIN_X + width, yPos);
  };

  /** Check page break and add new page if needed */
  const needsBreak = (needed: number) => {
    if (y + needed > PAGE_H - 36) {
      doc.addPage();
      y = MARGIN_Y;
      return true;
    }
    return false;
  };

  /** Section header: small-caps label + thin rule */
  const sectionHeader = (title: string) => {
    needsBreak(22);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...C.muted);
    doc.setCharSpace(1.8);
    doc.text(title.toUpperCase(), MARGIN_X, y);
    doc.setCharSpace(0);
    y += 5;
    hr(y, 40, C.ink);
    y += 10;
  };

  /** Footer on every page */
  const addFooter = () => {
    const total = doc.getNumberOfPages();
    const dateStr = new Date().toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    }).toUpperCase();

    for (let i = 1; i <= total; i++) {
      doc.setPage(i);

      // Legal text
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(...C.muted);
      const legalWrapped = doc.splitTextToSize(LEGAL_FOOTER, CONTENT_W);
      doc.text(legalWrapped, MARGIN_X, PAGE_H - 22, { maxWidth: CONTENT_W });

      hr(PAGE_H - 14);

      // Page meta bar
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...C.muted);
      doc.text("StackScope · Architectural Blueprint", MARGIN_X, PAGE_H - 9);
      doc.text(dateStr, PAGE_W / 2, PAGE_H - 9, { align: "center" });
      doc.text(`${i} / ${total}`, PAGE_W - MARGIN_X, PAGE_H - 9, { align: "right" });
    }
  };

  // =========================================================================
  // PAGE 1 — COVER
  // =========================================================================

  // Full-bleed dark cover band (top 55%)
  const COVER_H = 162;
  doc.setFillColor(...C.cover);
  doc.rect(0, 0, PAGE_W, COVER_H, "F");

  // Thin top accent line
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, PAGE_W, 0.6, "F");

  // Brand wordmark
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...C.white);
  doc.setCharSpace(4);
  doc.text("STACKSCOPE", PAGE_W / 2, 30, { align: "center" });
  doc.setCharSpace(0);

  // Sub-label
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 170);
  doc.setCharSpace(2.5);
  doc.text("ARCHITECTURAL BLUEPRINT", PAGE_W / 2, 40, { align: "center" });
  doc.setCharSpace(0);

  // Thin divider under brand
  doc.setDrawColor(60, 60, 70);
  doc.setLineWidth(0.4);
  doc.line(MARGIN_X + 30, 47, PAGE_W - MARGIN_X - 30, 47);

  // Project title — properly title-cased, max 2 lines
  const rawTitle = scope.proposal?.title || "Project Architecture";
  const prettyTitle = toTitleCase(rawTitle);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...C.white);
  const titleLines = doc.splitTextToSize(prettyTitle, CONTENT_W - 10);
  // Vertical center in the dark band
  const titleBlockH = titleLines.length * 11;
  const titleY = 47 + (COVER_H - 47 - 30 - titleBlockH) / 2 + 11;
  doc.text(titleLines, PAGE_W / 2, titleY, { align: "center", lineHeightFactor: 1.25 });

  // Prepared date — bottom of dark band
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 160);
  doc.text(
    `Prepared  ·  ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    PAGE_W / 2,
    COVER_H - 16,
    { align: "center" }
  );

  // ── Executive Summary section (on white, below dark band) ────────────────
  y = COVER_H + 22;

  sectionHeader("Executive Summary");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...C.body);
  const summaryLines = doc.splitTextToSize(
    scope.proposal?.summary || "No summary provided.",
    CONTENT_W
  );
  doc.text(summaryLines, MARGIN_X, y, { lineHeightFactor: 1.65 });
  y += summaryLines.length * 7.2 + 10;

  // =========================================================================
  // PAGE 2 — OBJECTIVES & ESTIMATES
  // =========================================================================
  doc.addPage();
  y = MARGIN_Y;

  // ── Core Objectives ───────────────────────────────────────────────────────
  sectionHeader("Core Objectives");

  if (scope.proposal?.objectives && scope.proposal.objectives.length > 0) {
    scope.proposal.objectives.forEach((obj, idx) => {
      needsBreak(14);

      // Index pill
      doc.setFillColor(...C.ink);
      doc.roundedRect(MARGIN_X, y - 4.5, 6, 6, 1, 1, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...C.white);
      doc.text(String(idx + 1), MARGIN_X + 3, y - 0.5, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(...C.body);
      const lines = doc.splitTextToSize(obj, CONTENT_W - 12);
      doc.text(lines, MARGIN_X + 10, y, { lineHeightFactor: 1.55 });
      y += lines.length * 6 + 5;
    });
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(...C.muted);
    doc.text("Specific objectives will be defined post-consultation.", MARGIN_X, y);
    y += 12;
  }

  y += 8;

  // ── Resource Estimates ────────────────────────────────────────────────────
  sectionHeader("Resource Estimates");

  const est    = scope.estimates || {};
  const teamSz = est.team_size || 2;
  const weeks  = est.total_weeks || est.base_weeks || "TBD";
  const cost   = est.cost_estimate_inr || (est.base_cost_inr ? `₹${Number(est.base_cost_inr).toLocaleString("en-IN")}` : "TBD");

  needsBreak(34);

  // Card background
  doc.setFillColor(...C.bg);
  doc.setDrawColor(...C.rule);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN_X, y, CONTENT_W, 30, 2, 2, "FD");

  const colW = CONTENT_W / 3;
  const cells = [
    { label: "Timeline",       value: `${weeks}${typeof weeks === "number" ? " weeks" : ""}` },
    { label: "Team Size",      value: `${teamSz} members` },
    { label: "Estimated Cost", value: String(cost) },
  ];

  cells.forEach((cell, i) => {
    const cx = MARGIN_X + colW * i + colW / 2;

    // Vertical divider
    if (i > 0) {
      doc.setDrawColor(...C.rule);
      doc.setLineWidth(0.25);
      doc.line(MARGIN_X + colW * i, y + 6, MARGIN_X + colW * i, y + 24);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.muted);
    doc.setCharSpace(0.8);
    doc.text(cell.label.toUpperCase(), cx, y + 10, { align: "center" });
    doc.setCharSpace(0);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...C.ink);
    doc.text(cell.value, cx, y + 22, { align: "center" });
  });

  y += 38;

  // ── Payment link (routing-gated) ──────────────────────────────────────────
  const effectivePaymentLink = isRoutingEnabled() ? paymentLink : undefined;

  if (effectivePaymentLink) {
    needsBreak(40);
    sectionHeader("SLA & Payment Authorization");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(...C.body);
    doc.text(
      "To finalise this scope and trigger the first sprint, please proceed with the securing milestone deposit.",
      MARGIN_X, y, { maxWidth: CONTENT_W }
    );
    y += 10;

    // CTA button
    doc.setFillColor(...C.accentBg);
    doc.roundedRect(MARGIN_X, y, 110, 13, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...C.white);
    doc.text("Proceed to Payment →", MARGIN_X + 55, y + 8.5, { align: "center" });
    doc.link(MARGIN_X, y, 110, 13, { url: effectivePaymentLink });

    y += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 200);
    doc.textWithLink(effectivePaymentLink, MARGIN_X, y, { url: effectivePaymentLink });
    y += 14;
  } else {
    y += 8;
  }

  // =========================================================================
  // ARCHITECTURE DIAGRAM
  // =========================================================================
  if (mermaidDataUrl) {
    doc.addPage();
    y = MARGIN_Y;
    sectionHeader("Architecture Diagram");

    const imgProps  = doc.getImageProperties(mermaidDataUrl);
    const imgRatio  = imgProps.height / imgProps.width;
    const available = PAGE_H - y - 48;
    let dw = CONTENT_W;
    let dh = dw * imgRatio;
    if (dh > available) { dh = available; dw = dh / imgRatio; }
    const xOff = MARGIN_X + (CONTENT_W - dw) / 2;

    doc.setFillColor(8, 8, 12);
    doc.roundedRect(xOff - 3, y - 3, dw + 6, dh + 6, 3, 3, "F");
    doc.addImage(mermaidDataUrl, "PNG", xOff, y, dw, dh);
    y += dh + 8;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...C.muted);
    doc.text("Fig. 1 — Systems Topology & Integration Workflow", PAGE_W / 2, y, { align: "center" });
    y += 12;
  }

  // =========================================================================
  // TECHNOLOGY STACK
  // =========================================================================
  needsBreak(90);
  sectionHeader("Technology Stack");

  if (scope.tech_stack) {
    const drawTechCard = (label: string, items: string[], x: number, cardY: number, w: number) => {
      doc.setFillColor(...C.bg);
      doc.setDrawColor(...C.rule);
      doc.setLineWidth(0.25);
      doc.roundedRect(x, cardY, w, 34, 2, 2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...C.muted);
      doc.setCharSpace(0.8);
      doc.text(label.toUpperCase(), x + 7, cardY + 9);
      doc.setCharSpace(0);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...C.body);
      const txt   = items && items.length > 0 ? items.join(", ") : "—";
      const lines = doc.splitTextToSize(txt, w - 14);
      doc.text(lines, x + 7, cardY + 17, { lineHeightFactor: 1.4, maxWidth: w - 14 });
    };

    const bw = (CONTENT_W - 8) / 2;

    needsBreak(44);
    drawTechCard("Frontend",       scope.tech_stack.frontend || [],              MARGIN_X,          y, bw);
    drawTechCard("Backend",        scope.tech_stack.backend  || [],              MARGIN_X + bw + 8, y, bw);
    y += 42;

    needsBreak(44);
    drawTechCard("Database",       [scope.tech_stack.database || "PostgreSQL"],  MARGIN_X,          y, bw);
    drawTechCard("Infrastructure", scope.tech_stack.infra    || [],              MARGIN_X + bw + 8, y, bw);
    y += 42;
  }

  // =========================================================================
  // SPRINT ROADMAP
  // =========================================================================
  needsBreak(50);
  sectionHeader("Execution Roadmap");

  if (scope.sprint_timeline && scope.sprint_timeline.length > 0) {
    scope.sprint_timeline.forEach((sprint) => {
      needsBreak(28);

      // Sprint header pill
      doc.setFillColor(...C.ink);
      doc.roundedRect(MARGIN_X, y, CONTENT_W, 9, 1.5, 1.5, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...C.white);
      const sprintLabel = `Sprint ${sprint.sprint}  ·  ${sprint.duration}`;
      doc.text(sprintLabel, MARGIN_X + 7, y + 6.2);
      y += 14;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...C.body);

      sprint.tasks.forEach((task) => {
        needsBreak(10);
        // Bullet dot
        doc.setFillColor(...C.muted);
        doc.circle(MARGIN_X + 4.5, y - 1.5, 1.2, "F");
        const lines = doc.splitTextToSize(task, CONTENT_W - 14);
        doc.text(lines, MARGIN_X + 11, y, { lineHeightFactor: 1.45 });
        y += lines.length * 5.2 + 2.5;
      });

      y += 5;
    });
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(...C.muted);
    doc.text("Timeline will be determined post-consultation.", MARGIN_X, y);
    y += 12;
  }

  // =========================================================================
  // APPENDIX — SQL SCHEMA
  // =========================================================================
  if (scope.sql_schema) {
    doc.addPage();
    y = MARGIN_Y;
    sectionHeader("Appendix A — Database Schema");

    const schemaLines = doc.splitTextToSize(scope.sql_schema, CONTENT_W - 10);

    // Code block background
    const estimatedH = Math.min(schemaLines.length * 4 + 12, PAGE_H - y - 36);
    doc.setFillColor(22, 22, 28);
    doc.roundedRect(MARGIN_X, y, CONTENT_W, estimatedH, 2, 2, "F");

    doc.setFont("courier", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(180, 230, 180); // green-tint monospace

    let codeY = y + 8;
    schemaLines.forEach((line: string) => {
      if (codeY > PAGE_H - 40) {
        doc.addPage();
        y = MARGIN_Y;
        doc.setFillColor(22, 22, 28);
        doc.roundedRect(MARGIN_X, y, CONTENT_W, PAGE_H - y - 36, 2, 2, "F");
        codeY = y + 8;
      }
      doc.text(line, MARGIN_X + 6, codeY);
      codeY += 4;
    });
  }

  // ─── Stamp footers ────────────────────────────────────────────────────────
  addFooter();

  const safeTitle = (scope.proposal?.title || "StackScope_Architecture")
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase();
  doc.save(`${safeTitle}.pdf`);
}
