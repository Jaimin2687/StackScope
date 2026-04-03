"use client";

import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { motion } from "framer-motion";

interface MermaidDiagramProps {
  chart: string;
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgStr, setSvgStr] = useState<string>("");
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (!chart) return;
    
    // Initialize mermaid settings
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      securityLevel: "loose",
      fontFamily: "var(--font-mono), monospace",
      themeVariables: {
        primaryColor: "#0a0a0a",
        primaryTextColor: "#ffffff",
        primaryBorderColor: "#333333",
        lineColor: "#666666",
        secondaryColor: "#111111",
        tertiaryColor: "#1a1a1a",
      }
    });

    const renderGraph = async () => {
      try {
        setError(false);
        // Clean up common AI hallucinations in Mermaid syntax
        let cleanChart = chart
          .replace(/```mermaid\n?/g, "") // remove code block fences
          .replace(/```\n?/g, "")
          .replace(/-->\|([^|]+)\|>/g, "-->|$1|") // fix invalid edge labels like `-->|label|>`
          .replace(/^(graph\s+[A-Z]+);/i, "$1\n") // clean semicolons directly after graph declaration
          .trim();

        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, cleanChart);
        setSvgStr(svg);
      } catch (err) {
        console.error("Mermaid parsing failed", err);
        setError(true);
      }
    };

    renderGraph();
  }, [chart]);

  if (error) {
    return (
      <div className="p-4 border border-red-900/30 bg-red-900/10 rounded-md text-red-500 text-sm font-mono flex flex-col gap-2">
        <span>Diagram Generation Failed. The AI output invalid mermaid syntax.</span>
        <pre className="text-xs text-red-700 overflow-auto">{chart}</pre>
      </div>
    );
  }

  if (!svgStr) {
    return <div className="h-48 animate-pulse bg-[#111] rounded-md border border-[#222]"></div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex justify-center items-center w-full p-6 bg-[#050505] rounded-xl border border-[#222] overflow-x-auto custom-scrollbar"
    >
      <div 
        id="architecture-diagram"
        ref={containerRef}
        dangerouslySetInnerHTML={{ __html: svgStr }} 
        className="w-full flex justify-center [&>svg]:max-w-full [&>svg]:h-auto"
      />
    </motion.div>
  );
}