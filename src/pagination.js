/**
 * Print pagination helpers — sequential page packing for question blocks.
 */
(function (ET) {
  "use strict";

  /** Set true in console: ExamToolkit.PAGINATION_DEBUG = true */
  ET.PAGINATION_DEBUG = ET.PAGINATION_DEBUG === true;

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

  ET.getOffsetInRoot = function (el, root) {
    const rootRect = root.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    return {
      top: elRect.top - rootRect.top + root.scrollTop,
      bottom: elRect.bottom - rootRect.top + root.scrollTop,
    };
  };

  ET.measureQuestionHeight = function (node) {
    if (!node || node.nodeType !== 1) return 0;
    const style = getComputedStyle(node);
    const marginBottom = parseFloat(style.marginBottom) || 0;
    return (node.offsetHeight || 0) + marginBottom;
  };

  ET.getPositionInPage = function (top, pageHeight) {
    return ((top % pageHeight) + pageHeight) % pageHeight;
  };

  ET.getRemainingSpaceOnPage = function (top, pageHeight) {
    const positionInPage = ET.getPositionInPage(top, pageHeight);
    if (positionInPage === 0) return pageHeight;
    return pageHeight - positionInPage;
  };

  ET.getNextPageStart = function (top, pageHeight) {
    const pageIndex = Math.floor(top / pageHeight);
    return (pageIndex + 1) * pageHeight;
  };

  ET.questionAllowsInternalSplit = function (block) {
    const type = block.dataset.type || "";
    if (
      type === "multiple-choice" ||
      type === "true-false" ||
      type === "short-answer" ||
      type === "matching"
    ) {
      return false;
    }
    return true;
  };

  ET.clearQuestionPagination = function (rootEl) {
    if (!rootEl) return;
    rootEl
      .querySelectorAll(
        ".question-block--force-next-page, .question-block--allow-internal-split"
      )
      .forEach((el) => {
        el.classList.remove("question-block--force-next-page");
        el.classList.remove("question-block--allow-internal-split");
      });
  };

  /**
   * Pack questions sequentially. Each decision accounts for prior forced page breaks.
   * break-before: page does not reflow screen layout, so printShift simulates print positions.
   */
  ET.applyQuestionPagination = function (rootEl) {
    if (!rootEl) return;

    ET.clearQuestionPagination(rootEl);

    const pageHeight = ET.getPrintPageUsableHeightPx();
    if (!pageHeight || pageHeight <= 0) return;

    rootEl.classList.add("is-measuring-print");
    rootEl.offsetHeight;

    try {
      const questions = [...rootEl.querySelectorAll('.question-block:not([data-type="page-break"])')];
      let printShift = 0;

      for (const block of questions) {
        const questionHeight = ET.measureQuestionHeight(block);
        const layoutTop = ET.getOffsetInRoot(block, rootEl).top;
        const top = layoutTop + printShift;

        if (questionHeight >= pageHeight) {
          if (ET.questionAllowsInternalSplit(block)) {
            block.classList.add("question-block--allow-internal-split");
          }
          if (ET.PAGINATION_DEBUG) {
            console.log({
              q: block.dataset.question || block.dataset.type,
              questionHeight,
              remainingSpace: null,
              pageHeight,
              layoutTop,
              printTop: top,
              printShift,
              forceNext: false,
              allowInternalSplit: ET.questionAllowsInternalSplit(block),
            });
          }
          continue;
        }

        const remainingSpace = ET.getRemainingSpaceOnPage(top, pageHeight);
        const forceNext = questionHeight > remainingSpace;

        if (ET.PAGINATION_DEBUG) {
          console.log({
            q: block.dataset.question || block.dataset.type,
            questionHeight,
            remainingSpace,
            pageHeight,
            layoutTop,
            printTop: top,
            printShift,
            forceNext,
          });
        }

        if (forceNext) {
          block.classList.add("question-block--force-next-page");
          printShift += ET.getNextPageStart(top, pageHeight) - top;
          block.offsetHeight;
        }
      }
    } finally {
      rootEl.classList.remove("is-measuring-print");
    }
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
