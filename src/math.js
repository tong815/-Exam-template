/**
 * KaTeX inline math rendering for exam preview (\( ... \) delimiters).
 * Legacy shorthand (x^2, 2^(x+1), sqrt(3)/2) is preprocessed when no \( is present.
 */
(function (ET) {
  "use strict";

  ET.wrapInlineMath = function (latex) {
    return `\\(${latex}\\)`;
  };

  /**
   * Migration layer for old plain-text math (skip if \( already used).
   */
  ET.preprocessLegacyMath = function (text) {
    if (text == null || typeof text !== "string") return "";
    if (text.includes("\\(")) return text;

    let s = text;

    s = s.replace(/sqrt\(([^)]+)\)\s*\/\s*(\d+)/gi, (_, radicand, denom) =>
      ET.wrapInlineMath(`\\sqrt{${radicand}}/${denom}`)
    );
    s = s.replace(/sqrt\(([^)]+)\)/gi, (_, radicand) => ET.wrapInlineMath(`\\sqrt{${radicand}}`));
    s = s.replace(/\(([^)]+)\)\^\(([^)]+)\)/g, (_, base, exp) =>
      ET.wrapInlineMath(`${base}^{${exp}}`)
    );
    s = s.replace(/\b(\d+)\^\(([^)]+)\)/g, (_, base, exp) =>
      ET.wrapInlineMath(`${base}^{${exp}}`)
    );
    s = s.replace(/\b([a-zA-Z])\^(\d+)\b/g, (_, variable, exp) =>
      ET.wrapInlineMath(`${variable}^{${exp}}`)
    );
    s = s.replace(/\b([a-zA-Z])\^\(([^)]+)\)/g, (_, variable, exp) =>
      ET.wrapInlineMath(`${variable}^{${exp}}`)
    );

    return s;
  };

  ET.splitMathSegments = function (text) {
    const normalized = ET.preprocessLegacyMath(String(text ?? ""));
    const parts = [];
    let i = 0;

    while (i < normalized.length) {
      const start = normalized.indexOf("\\(", i);
      if (start === -1) {
        if (i < normalized.length) {
          parts.push({ type: "text", content: normalized.slice(i) });
        }
        break;
      }

      if (start > i) {
        parts.push({ type: "text", content: normalized.slice(i, start) });
      }

      const end = normalized.indexOf("\\)", start + 2);
      if (end === -1) {
        parts.push({ type: "text", content: normalized.slice(start) });
        break;
      }

      parts.push({ type: "math", content: normalized.slice(start + 2, end) });
      i = end + 2;
    }

    if (!parts.length) {
      parts.push({ type: "text", content: normalized });
    }

    return parts;
  };

  ET.renderMathToHtml = function (latex) {
    const katex = typeof window !== "undefined" ? window.katex : null;
    if (!katex) {
      return `<span class="math-fallback">${ET.escapeHtml(ET.wrapInlineMath(latex))}</span>`;
    }

    try {
      return katex.renderToString(latex, {
        throwOnError: false,
        displayMode: false,
        strict: "ignore",
        trust: false,
      });
    } catch (err) {
      console.warn("KaTeX render failed:", latex, err);
      return `<span class="math-fallback">${ET.escapeHtml(ET.wrapInlineMath(latex))}</span>`;
    }
  };

  /**
   * Render mixed plain text + inline math to safe HTML for preview/print.
   */
  ET.renderMathText = function (text) {
    if (text == null || text === "") return "";

    return ET.splitMathSegments(text)
      .map((part) => {
        if (part.type === "math") {
          return ET.renderMathToHtml(part.content);
        }
        return ET.escapeHtml(part.content);
      })
      .join("");
  };

  ET.hasKatex = function () {
    return typeof window !== "undefined" && typeof window.katex !== "undefined";
  };
})(window.ExamToolkit);
