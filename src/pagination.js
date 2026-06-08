/**
 * Print pagination helpers — force whole questions to next page when they do not fit.
 */
(function (ET) {
  "use strict";

  ET.getPrintPageUsableHeightPx = function () {
    const paper = document.documentElement.dataset.paper || "letter";
    const pxPerIn = 96;
    const pxPerMm = pxPerIn / 25.4;

    if (paper === "a4") {
      const pageMm = 297;
      const marginMm = 1.8 * 2;
      return (pageMm - marginMm) * pxPerMm;
    }

    const pageIn = 11;
    const marginIn = 0.7 * 2;
    return (pageIn - marginIn) * pxPerIn;
  };

  ET.nextVirtualPageStart = function (virtualY, pageHeight) {
    if (virtualY <= 0) return 0;
    return Math.ceil(virtualY / pageHeight) * pageHeight;
  };

  ET.questionMustStayWhole = function (block) {
    const type = block.dataset.type || "";
    if (type === "page-break") return false;
    if (
      type === "multiple-choice" ||
      type === "true-false" ||
      type === "short-answer" ||
      type === "matching"
    ) {
      return true;
    }
    return !block.classList.contains("question-block--allow-split");
  };

  ET.clearQuestionPagination = function (rootEl) {
    if (!rootEl) return;
    rootEl.querySelectorAll(".question-block--force-next-page").forEach((el) => {
      el.classList.remove("question-block--force-next-page");
    });
  };

  ET.advanceVirtualFlow = function (virtualY, pageHeight, height) {
    if (!height || height <= 0) return virtualY;
    return virtualY + height;
  };

  ET.measureFlowBlock = function (node) {
    if (!node || node.nodeType !== 1) return 0;
    if (node.classList.contains("no-print")) return 0;
    if (node.classList.contains("print-header") || node.classList.contains("print-footer")) return 0;
    return node.offsetHeight || 0;
  };

  /**
   * Simulate page flow and add break-before when a whole question does not fit
   * in the remaining space on the current page.
   */
  ET.applyQuestionPagination = function (rootEl) {
    if (!rootEl) return;

    ET.clearQuestionPagination(rootEl);

    const pageHeight = ET.getPrintPageUsableHeightPx();
    if (!pageHeight || pageHeight <= 0) return;

    let virtualY = 0;

    function bumpToNextPage() {
      virtualY = ET.nextVirtualPageStart(virtualY, pageHeight);
    }

    function maybeForceQuestionToNextPage(node) {
      const height = ET.measureFlowBlock(node);
      const topInPage = virtualY % pageHeight;
      const remaining = topInPage === 0 ? pageHeight : pageHeight - topInPage;
      const mustStayWhole = ET.questionMustStayWhole(node);

      if (mustStayWhole && height > 0 && height < pageHeight && height > remaining) {
        node.classList.add("question-block--force-next-page");
        bumpToNextPage();
      }

      virtualY = ET.advanceVirtualFlow(virtualY, pageHeight, height);
    }

    function walk(node) {
      if (!node || node.nodeType !== 1) return;
      if (node.classList.contains("no-print")) return;
      if (node.classList.contains("print-header") || node.classList.contains("print-footer")) return;

      if (node.classList.contains("exam-section") && node.classList.contains("exam-section--page-break")) {
        bumpToNextPage();
      }

      if (node.classList.contains("page-break-marker") || node.classList.contains("page-break-block")) {
        bumpToNextPage();
        return;
      }

      if (node.classList.contains("question-block")) {
        if (node.dataset.type === "page-break") {
          bumpToNextPage();
          return;
        }
        maybeForceQuestionToNextPage(node);
        return;
      }

      if (
        node.classList.contains("exam-title-block") ||
        node.classList.contains("exam-section") ||
        node.classList.contains("exam-section__keep-group") ||
        node.classList.contains("exam-section__intro")
      ) {
        Array.from(node.children).forEach(walk);
        return;
      }

      if (
        node.classList.contains("exam-section__heading") ||
        node.classList.contains("exam-section__description") ||
        node.classList.contains("exam-section__summary") ||
        node.classList.contains("mark-table") ||
        node.classList.contains("exam-end") ||
        node.classList.contains("exam-title-block__table")
      ) {
        virtualY = ET.advanceVirtualFlow(virtualY, pageHeight, ET.measureFlowBlock(node));
        return;
      }

      Array.from(node.children).forEach(walk);
    }

    walk(rootEl);
  };

  ET.scheduleQuestionPagination = function (rootEl) {
    if (!rootEl) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ET.applyQuestionPagination(rootEl);
      });
    });
  };
})(window.ExamToolkit);
