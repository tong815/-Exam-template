/**
 * Print pagination helpers — force whole questions to next page when they do not fit.
 */
(function (ET) {
  "use strict";

  /** Set true in console: ExamToolkit.PAGINATION_DEBUG = true */
  ET.PAGINATION_DEBUG = ET.PAGINATION_DEBUG === true;

  ET.PAGINATION_ADJACENT_GAP_PX = 150;

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

  ET.getRemainingSpaceAfterY = function (y, pageHeight) {
    const pageIndex = Math.floor(y / pageHeight);
    const pageEnd = (pageIndex + 1) * pageHeight;
    return Math.max(0, pageEnd - y);
  };

  ET.shouldForceQuestionToNextPage = function (questionHeight, remainingSpace, pageHeight, mustStayWhole) {
    if (!mustStayWhole || questionHeight <= 0) return false;
    if (questionHeight <= remainingSpace) return false;
    if (questionHeight >= pageHeight) return false;
    return true;
  };

  ET.getPreviousQuestionBlock = function (block) {
    let node = block.previousElementSibling;
    while (node) {
      if (node.classList.contains("question-block") && node.dataset.type !== "page-break") {
        return node;
      }
      if (node.classList.contains("page-break-block")) {
        return null;
      }
      node = node.previousElementSibling;
    }
    return null;
  };

  ET.areAdjacentInFlow = function (prevEl, block, rootEl) {
    const gap =
      ET.getOffsetInRoot(block, rootEl).top - ET.getOffsetInRoot(prevEl, rootEl).bottom;
    return gap >= -4 && gap < ET.PAGINATION_ADJACENT_GAP_PX;
  };

  ET.startsOnFreshPrintPage = function (block) {
    if (block.previousElementSibling?.classList.contains("page-break-marker")) {
      return true;
    }
    if (block.previousElementSibling?.classList.contains("page-break-block")) {
      return true;
    }

    const section = block.closest(".exam-section");
    if (!section?.classList.contains("exam-section--page-break")) {
      return false;
    }

    const keepGroup = section.querySelector(":scope > .exam-section__keep-group");
    if (keepGroup && keepGroup.contains(block)) {
      return block === keepGroup.querySelector('.question-block:not([data-type="page-break"])');
    }

    return block === section.querySelector('.question-block:not([data-type="page-break"])');
  };

  ET.getRemainingSpaceForQuestion = function (block, rootEl, pageHeight) {
    const prevQuestion = ET.getPreviousQuestionBlock(block);
    if (prevQuestion && ET.areAdjacentInFlow(prevQuestion, block, rootEl)) {
      const { bottom } = ET.getOffsetInRoot(prevQuestion, rootEl);
      return ET.getRemainingSpaceAfterY(bottom, pageHeight);
    }

    if (ET.startsOnFreshPrintPage(block)) {
      return pageHeight;
    }

    const section = block.closest(".exam-section");
    const sectionRelative =
      section && section.classList.contains("exam-section--page-break");

    if (prevQuestion) {
      const anchorTop = sectionRelative ? ET.getOffsetInRoot(section, rootEl).top : 0;
      const yBefore = ET.getOffsetInRoot(prevQuestion, rootEl).bottom - anchorTop;
      const posInPage = yBefore % pageHeight;
      return posInPage === 0 ? pageHeight : pageHeight - posInPage;
    }

    const prevFlow = block.previousElementSibling;
    if (prevFlow) {
      const anchorTop = sectionRelative ? ET.getOffsetInRoot(section, rootEl).top : 0;
      const yBefore = ET.getOffsetInRoot(prevFlow, rootEl).bottom - anchorTop;
      const posInPage = yBefore % pageHeight;
      return posInPage === 0 ? pageHeight : pageHeight - posInPage;
    }

    const anchorTop = sectionRelative ? ET.getOffsetInRoot(section, rootEl).top : 0;
    const yBefore = ET.getOffsetInRoot(block, rootEl).top - anchorTop;
    return ET.getRemainingSpaceAfterY(yBefore, pageHeight);
  };

  ET.applyQuestionPagination = function (rootEl) {
    if (!rootEl) return;

    ET.clearQuestionPagination(rootEl);

    const pageHeight = ET.getPrintPageUsableHeightPx();
    if (!pageHeight || pageHeight <= 0) return;

    rootEl.classList.add("is-measuring-print");
    rootEl.offsetHeight;

    try {
      const questions = rootEl.querySelectorAll(
        '.question-block:not([data-type="page-break"])'
      );

      questions.forEach((block) => {
        const prevQuestion = ET.getPreviousQuestionBlock(block);
        const adjacentToPrev =
          prevQuestion && ET.areAdjacentInFlow(prevQuestion, block, rootEl);

        if (adjacentToPrev) {
          if (ET.PAGINATION_DEBUG) {
            console.log({
              q: block.dataset.question || block.dataset.type,
              questionHeight: ET.measureQuestionHeight(block),
              remainingSpace: "adjacent-skip",
              pageHeight,
              mustStayWhole: ET.questionMustStayWhole(block),
              forceNext: false,
            });
          }
          return;
        }

        const questionHeight = ET.measureQuestionHeight(block);
        const remainingSpace = ET.getRemainingSpaceForQuestion(block, rootEl, pageHeight);
        const mustStayWhole = ET.questionMustStayWhole(block);
        const forceNext = ET.shouldForceQuestionToNextPage(
          questionHeight,
          remainingSpace,
          pageHeight,
          mustStayWhole
        );

        if (ET.PAGINATION_DEBUG) {
          console.log({
            q: block.dataset.question || block.dataset.type,
            questionHeight,
            remainingSpace,
            pageHeight,
            mustStayWhole,
            forceNext,
            freshPage: ET.startsOnFreshPrintPage(block),
          });
        }

        if (forceNext) {
          block.classList.add("question-block--force-next-page");
        }
      });
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
