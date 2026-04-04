import type { GeneratedScope } from "./types";

export async function downloadScopePDF(scope: GeneratedScope, paymentLink?: string) {
  // Dynamically import jsPDF to avoid massive 400KB+ client bundle bloat on initial page loads
  const { jsPDF } = await import("jspdf");

  // Attempt to capture Mermaid Diagram from DOM
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
      
      canvas.width = Math.max(width, 800); // give it good resolution
      canvas.height = canvas.width * (height / width);
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      // Fill background
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

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });


  const PAGE_WIDTH = 210;
  const PAGE_HEIGHT = 297;
  const MARGIN_X = 24;
  const MARGIN_Y = 30;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
  
  let currentY = MARGIN_Y;

  // PREMIUM BRANDING COLORS
  const COLORS = {
    brand: [0, 0, 0] as [number, number, number],          // Pure Black for luxury feel
    accent: [100, 100, 100] as [number, number, number],  // Dark Gray
    primary: [20, 20, 20] as [number, number, number],    // Very dark text
    secondary: [80, 80, 80] as [number, number, number],  // Muted text
    light: [240, 240, 240] as [number, number, number],   // Light Gray for backgrounds
    white: [255, 255, 255] as [number, number, number],
  };

  const addFooter = (doc: any) => {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Footer Line
      doc.setDrawColor(...COLORS.light);
      doc.setLineWidth(0.5);
      doc.line(MARGIN_X, PAGE_HEIGHT - 20, PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.secondary);
      
      const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      
      doc.text(`STACKSCOPE AI ARCHITECTURE`, MARGIN_X, PAGE_HEIGHT - 12);
      doc.text(`DATE: ${dateStr.toUpperCase()}`, PAGE_WIDTH / 2, PAGE_HEIGHT - 12, { align: "center" });
      doc.text(`PAGE ${i} OF ${pageCount}`, PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - 12, { align: "right" });
    }
  };

  const checkPageBreak = (neededY: number) => {
    if (currentY + neededY > PAGE_HEIGHT - 30) {
      doc.addPage();
      currentY = MARGIN_Y;
    }
  };

  // ---------------------------------------------------------
  // COVER PAGE (PREMIUM LUXURY VIBE)
  // ---------------------------------------------------------
  
  // Big black block at the top
  doc.setFillColor(...COLORS.brand);
  doc.rect(0, 0, PAGE_WIDTH, 140, 'F');
  
  // Brand name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.white);
  doc.setCharSpace(2);
  doc.text("S T A C K S C O P E", PAGE_WIDTH / 2, 40, { align: "center" });
  doc.setCharSpace(0);

  // Document Type
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.setCharSpace(1.5);
  doc.text("A R C H I T E C T U R A L   B L U E P R I N T", PAGE_WIDTH / 2, 50, { align: "center" });
  doc.setCharSpace(0);

  // Main Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  doc.setTextColor(...COLORS.white);
  const titleLines = doc.splitTextToSize((scope.proposal?.title || "Project Architecture").toUpperCase(), CONTENT_WIDTH - 20);
  doc.text(titleLines, PAGE_WIDTH / 2, 85, { align: "center" });

  // Subtitle / Date
  doc.setFont("helvetica", "italic");
  doc.setFontSize(11);
  doc.setTextColor(180, 180, 180);
  doc.text(`Prepared on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric'})}`, PAGE_WIDTH / 2, 125, { align: "center" });

  // Executive Summary on Cover
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.primary);
  doc.setCharSpace(1);
  doc.text("EXECUTIVE SUMMARY", MARGIN_X, 165);
  doc.setCharSpace(0);
  
  doc.setDrawColor(...COLORS.brand);
  doc.setLineWidth(1.5);
  doc.line(MARGIN_X, 170, MARGIN_X + 25, 170);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.secondary);
  const summaryText = doc.splitTextToSize(scope.proposal?.summary || "No summary provided.", CONTENT_WIDTH);
  doc.text(summaryText, MARGIN_X, 185, { lineHeightFactor: 1.6 });

  // ---------------------------------------------------------
  // PAGE 2: OBJECTIVES & ESTIMATES
  // ---------------------------------------------------------
  doc.addPage();
  currentY = MARGIN_Y;

  const printSectionHeader = (title: string) => {
    checkPageBreak(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...COLORS.primary);
    doc.setCharSpace(1);
    doc.text(title.toUpperCase(), MARGIN_X, currentY);
    doc.setCharSpace(0);
    
    doc.setDrawColor(...COLORS.brand);
    doc.setLineWidth(1);
    doc.line(MARGIN_X, currentY + 4, MARGIN_X + 20, currentY + 4);
    currentY += 16;
  };

  printSectionHeader("Core Objectives");
  if (scope.proposal?.objectives && scope.proposal.objectives.length > 0) {
    scope.proposal.objectives.forEach((obj) => {
      checkPageBreak(12);
      doc.setFillColor(...COLORS.brand);
      doc.circle(MARGIN_X + 2, currentY - 1.5, 1.5, 'F');
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(...COLORS.secondary);
      const lines = doc.splitTextToSize(obj, CONTENT_WIDTH - 10);
      doc.text(lines, MARGIN_X + 8, currentY, { lineHeightFactor: 1.5 });
      currentY += (lines.length * 6) + 4;
    });
  } else {
    doc.text("Specific objectives not outlined.", MARGIN_X, currentY);
    currentY += 12;
  }
  
  currentY += 10;

  // --- ESTIMATES ---
  printSectionHeader("Resource Estimates");
  
  const est = scope.estimates || {};
  const teamSize = est.team_size || 2;
  const weeks = est.total_weeks || est.base_weeks || "TBD";
  const cost = est.cost_estimate_inr || (est.base_cost_inr ? `₹${est.base_cost_inr.toLocaleString()}` : "TBD");
  
  // Draw an elegant box for estimates
  doc.setFillColor(...COLORS.light);
  doc.setDrawColor(...COLORS.accent);
  doc.setLineWidth(0.3);
  doc.rect(MARGIN_X, currentY, CONTENT_WIDTH, 26, 'FD'); // Fill and stroke
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.primary);
  
  // Columns
  const col1 = MARGIN_X + 15;
  const col2 = MARGIN_X + (CONTENT_WIDTH / 2) - 10;
  const col3 = MARGIN_X + CONTENT_WIDTH - 45;

  doc.text("TIMELINE", col1, currentY + 10);
  doc.text("TEAM SIZE", col2, currentY + 10);
  doc.text("ESTIMATED COST", col3, currentY + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.secondary);
  
  doc.text(`${weeks} ${typeof weeks === 'number' ? 'Weeks' : ''}`, col1, currentY + 18);
  doc.text(`${teamSize} Members`, col2, currentY + 18);
  doc.text(`${cost}`, col3, currentY + 18);

  if (paymentLink) {
    currentY += 36;
    checkPageBreak(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...COLORS.primary);
    doc.setCharSpace(1);
    doc.text("SLA & PAYMENT AUTHORIZATION".toUpperCase(), MARGIN_X, currentY);
    doc.setCharSpace(0);
    
    doc.setDrawColor(...COLORS.brand);
    doc.setLineWidth(1);
    doc.line(MARGIN_X, currentY + 4, MARGIN_X + 20, currentY + 4);
    currentY += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.secondary);
    doc.text("To finalize this scope and trigger the first sprint, please proceed with the securing milestone deposit.", MARGIN_X, currentY);
    currentY += 10;
    
    // Draw payment button
    doc.setFillColor(20, 20, 20); // Dark sleek button
    doc.rect(MARGIN_X, currentY, 110, 14, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text("CLICK HERE TO PROCEED TO PAYMENT", MARGIN_X + 55, currentY + 9.5, { align: "center" });
    
    // Add clickable link over the button
    doc.link(MARGIN_X, currentY, 110, 14, { url: paymentLink });
    
    currentY += 22;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 250);
    doc.textWithLink(paymentLink, MARGIN_X, currentY, { url: paymentLink });

    currentY += 15;
  } else {
    currentY += 40;
  }

  // ---------------------------------------------------------
  // ARCHITECTURE DIAGRAM
  // ---------------------------------------------------------
  if (mermaidDataUrl) {
    doc.addPage();
    currentY = MARGIN_Y;
    printSectionHeader("Architectural Diagram");

    const availableHeight = PAGE_HEIGHT - currentY - 50; 
    // Fit the image within CONTENT_WIDTH and availableHeight, keeping aspect ratio
    const imgProps = doc.getImageProperties(mermaidDataUrl);
    const imgRatio = imgProps.height / imgProps.width;
    
    let drawWidth = CONTENT_WIDTH;
    let drawHeight = drawWidth * imgRatio;

    if (drawHeight > availableHeight) {
      drawHeight = availableHeight;
      drawWidth = drawHeight / imgRatio;
    }

    const xOffset = MARGIN_X + (CONTENT_WIDTH - drawWidth) / 2;

    doc.setFillColor(5, 5, 5);
    doc.roundedRect(xOffset - 2, currentY - 2, drawWidth + 4, drawHeight + 4, 3, 3, "FD");
    
    doc.addImage(mermaidDataUrl, "PNG", xOffset, currentY, drawWidth, drawHeight);
    
    currentY += drawHeight + 20;

    // A subtle note about generated architecture
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Fig 1: Systems Topology & Integration Workflow", PAGE_WIDTH / 2, currentY - 10, { align: "center" });
    
    // reset currentY, but usually the image takes the whole page
    if (currentY > PAGE_HEIGHT - 60) {
      doc.addPage();
      currentY = MARGIN_Y;
    }
  }

  // ---------------------------------------------------------
  // TECH STACK
  // ---------------------------------------------------------
  printSectionHeader("Technology Stack");
  
  if (scope.tech_stack) {
    const drawTechBox = (label: string, items: string[], xPos: number, yPos: number, width: number) => {
      doc.setFillColor(...COLORS.light);
      doc.rect(xPos, yPos, width, 32, 'F');
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.primary);
      doc.setCharSpace(0.5);
      doc.text(label.toUpperCase(), xPos + 6, yPos + 8);
      doc.setCharSpace(0);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.secondary);
      const text = items && items.length > 0 ? items.join(", ") : "N/A";
      const lines = doc.splitTextToSize(text, width - 12);
      doc.text(lines, xPos + 6, yPos + 16, { lineHeightFactor: 1.4 });
    };

    const boxWidth = (CONTENT_WIDTH - 10) / 2;
    
    checkPageBreak(80);
    drawTechBox("Frontend", scope.tech_stack.frontend || [], MARGIN_X, currentY, boxWidth);
    drawTechBox("Backend", scope.tech_stack.backend || [], MARGIN_X + boxWidth + 10, currentY, boxWidth);
    
    currentY += 42;
    checkPageBreak(40);
    drawTechBox("Database", [scope.tech_stack.database || "PostgreSQL"], MARGIN_X, currentY, boxWidth);
    drawTechBox("Infrastructure", scope.tech_stack.infra || [], MARGIN_X + boxWidth + 10, currentY, boxWidth);
    
    currentY += 42;
  }

  // ---------------------------------------------------------
  // SPRINT TIMELINE
  // ---------------------------------------------------------
  checkPageBreak(50);
  printSectionHeader("Execution Roadmap");

  if (scope.sprint_timeline && scope.sprint_timeline.length > 0) {
    scope.sprint_timeline.forEach((sprint) => {
      checkPageBreak(30);
      
      // Sprint Header Box
      doc.setFillColor(...COLORS.brand);
      doc.rect(MARGIN_X, currentY, CONTENT_WIDTH, 10, 'F');
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.white);
      doc.text(`PHASE ${sprint.sprint} — ${sprint.duration.toUpperCase()}`, MARGIN_X + 6, currentY + 7);
      
      currentY += 16;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.secondary);
      
      sprint.tasks.forEach((task) => {
        checkPageBreak(10);
        doc.setDrawColor(...COLORS.brand);
        doc.circle(MARGIN_X + 4, currentY - 1.2, 1, 'F');
        const lines = doc.splitTextToSize(task, CONTENT_WIDTH - 12);
        doc.text(lines, MARGIN_X + 10, currentY, { lineHeightFactor: 1.4 });
        currentY += (lines.length * 5) + 3;
      });
      
      currentY += 6;
    });
  } else {
    doc.text("Timeline will be determined post-consultation.", MARGIN_X, currentY);
    currentY += 10;
  }

  // ---------------------------------------------------------
  // SQL SCHEMA (APPENDIX)
  // ---------------------------------------------------------
  if (scope.sql_schema) {
    doc.addPage();
    currentY = MARGIN_Y;
    printSectionHeader("Appendix A: Database Schema");
    
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.setTextColor(50, 50, 50);
    
    doc.setFillColor(...COLORS.light);
    // Draw a subtle background for code
    doc.rect(MARGIN_X, currentY, CONTENT_WIDTH, PAGE_HEIGHT - currentY - 30, 'F');
    
    const lines = doc.splitTextToSize(scope.sql_schema, CONTENT_WIDTH - 10);
    
    let codeY = currentY + 6;
    lines.forEach((line: string) => {
      if (codeY > PAGE_HEIGHT - 40) {
        doc.addPage();
        currentY = MARGIN_Y;
        doc.setFillColor(...COLORS.light);
        doc.rect(MARGIN_X, currentY, CONTENT_WIDTH, PAGE_HEIGHT - currentY - 30, 'F');
        codeY = currentY + 6;
      }
      doc.text(line, MARGIN_X + 5, codeY);
      codeY += 4;
    });
  }

  addFooter(doc);

  const safeTitle = (scope.proposal.title || "StackScope_Architecture").replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`${safeTitle}.pdf`);
}
