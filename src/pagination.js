/**
 * Deterministic exam preview pagination — explicit .exam-page containers.
 */
(function (ET) {
  "use strict";

  ET.PAGINATION_DEBUG = ET.PAGINATION_DEBUG === true;

  ET.isAtomicQuestionType = function (type) {
    return (
      type === "multiple-choice" ||
      type === "true-false" ||
      type === "short-answer" ||
      type === "matching"
    );
  };

  ET.isAtomicQuestion = function (q) {
    const type = q?.type || "custom";
    if (ET.isAtomicQuestionType(type)) return true;
    return ET.normalizeBreakInside(q?.breakInside, type) === "avoid";
  };

  ET.createPaginationBlock = function (kind, html, options = {}) {
    const el = document.createElement("div");
    el.className = `pagination-block pagination-block--${kind}`;
    el.dataset.blockKind = kind;
    if (options.partId) el.dataset.partId = options.partId;
    if (options.forceNewPage) el.dataset.forceNewPage = "true";
    if (options.atomic) el.dataset.atomic = "true";
    el.innerHTML = html;
    return el;
  };

  ET.buildExamBlockElements = function (view) {
    const safeView = {
      meta: ET.safeMeta(view?.meta),
      instructions: view?.instructions || [],
      markDistribution: view?.markDistribution || [],
      parts: (view?.parts || []).map(ET.safePart),
      bonus: view?.bonus || { enabled: false },
      settings: view?.settings || {},
    };

    const blocks = [];

    blocks.push(
      ET.createPaginationBlock("title", ET.renderTitleBlock(safeView.meta), { forceNewPage: false })
    );

    if (safeView.settings.showInstructions !== false) {
      blocks.push(
        ET.createPaginationBlock("instructions", ET.renderInstructions(safeView.instructions))
      );
    }

    if (safeView.settings.showMarkDistribution !== false) {
      blocks.push(
        ET.createPaginationBlock("marks", ET.renderMarkDistribution(safeView.markDistribution))
      );
    }

    safeView.parts.forEach((part) => {
      const safe = ET.safePart(part);
      if (!safe.questions.length && !safe.title) return;

      blocks.push(
        ET.createPaginationBlock(
          "part-intro",
          `<section class="exam-section" data-part="${ET.escapeHtml(safe.id)}"><div class="exam-section__intro">${ET.renderPartIntro(safe)}</div></section>`,
          { partId: safe.id, forceNewPage: !!safe.pageBreakBefore }
        )
      );

      safe.questions.forEach((q, index) => {
        const question = ET.safeQuestion(q, index);

        if (question.type === "page-break") {
          blocks.push(
            ET.createPaginationBlock("page-break", ET.renderPageBreakBlock(question), {
              partId: safe.id,
            })
          );
          return;
        }

        if (question.pageBreakBefore) {
          blocks.push(
            ET.createPaginationBlock("page-break", ET.renderPageBreakMarker(), { partId: safe.id })
          );
        }

        const questionHtml = ET.renderQuestion(q, index);
        blocks.push(
          ET.createPaginationBlock(
            "question",
            `<section class="exam-section" data-part="${ET.escapeHtml(safe.id)}">${questionHtml}</section>`,
            {
              partId: safe.id,
              atomic: ET.isAtomicQuestion(q),
            }
          )
        );
      });
    });

    if (safeView.bonus?.enabled) {
      blocks.push(
        ET.createPaginationBlock(
          "part-intro",
          `<section class="exam-section" data-part="bonus"><h2 class="exam-section__heading">Bonus Question (Optional)</h2></section>`,
          { partId: "bonus", forceNewPage: true }
        )
      );

      const bonusQ = ET.safeQuestion(
        {
          number: safeView.bonus.number || safeView.bonus.label || "B1",
          marks: safeView.bonus.marks ?? "+___",
          type: "problem-solving",
          stem: safeView.bonus.stem,
          answerSpace: safeView.bonus.answerSpace || { type: "lines", lines: 3 },
          teacherNote: safeView.bonus.teacherNote,
          answerKey: safeView.bonus.answerKey,
        },
        0
      );

      blocks.push(
        ET.createPaginationBlock(
          "question",
          `<section class="exam-section" data-part="bonus">${ET.renderQuestion(bonusQ, 0)}</section>`,
          { partId: "bonus", atomic: false }
        )
      );
    }

    blocks.push(
      ET.createPaginationBlock(
        "end",
        `<p class="exam-end">— End of Examination — Good luck! / Bonne chance! —</p>`
      )
    );

    return blocks;
  };

  ET.createExamPageElement = function () {
    const page = document.createElement("div");
    page.className = "exam-page";
    page.dataset.examPage = "true";
    return page;
  };

  ET.measurePageMaxScrollHeight = function (sandbox) {
    const probe = ET.createExamPageElement();
    sandbox.appendChild(probe);
    const maxScrollHeight = probe.scrollHeight;
    sandbox.removeChild(probe);
    return maxScrollHeight;
  };

  ET.pageHasContent = function (pageEl) {
    return pageEl.childNodes.length > 0;
  };

  ET.flushPage = function (pages, pageEl) {
    if (ET.pageHasContent(pageEl)) {
      pages.push(pageEl);
    }
  };

  ET.startNewPage = function (sandbox) {
    const pageEl = ET.createExamPageElement();
    sandbox.appendChild(pageEl);
    return pageEl;
  };

  ET.tryAppendBlock = function (pageEl, blockEl, maxScrollHeight) {
    pageEl.appendChild(blockEl);
    const fits = pageEl.scrollHeight <= maxScrollHeight + 1;
    if (!fits) {
      pageEl.removeChild(blockEl);
    }
    return fits;
  };

  ET.paginateBlockElements = function (blockElements, sandbox) {
    const maxScrollHeight = ET.measurePageMaxScrollHeight(sandbox);
    const pages = [];
    let pageEl = ET.startNewPage(sandbox);

    blockElements.forEach((block) => {
      const kind = block.dataset.blockKind;

      if (kind === "page-break") {
        ET.flushPage(pages, pageEl);
        pageEl = ET.startNewPage(sandbox);
        return;
      }

      if (block.dataset.forceNewPage === "true") {
        if (ET.pageHasContent(pageEl)) {
          ET.flushPage(pages, pageEl);
          pageEl = ET.startNewPage(sandbox);
        }
      }

      const node = block.cloneNode(true);

      if (ET.tryAppendBlock(pageEl, node, maxScrollHeight)) {
        if (ET.PAGINATION_DEBUG) {
          console.log("[pagination] kept on page", kind, block.dataset.partId || "", pageEl.scrollHeight);
        }
        return;
      }

      if (ET.pageHasContent(pageEl)) {
        ET.flushPage(pages, pageEl);
        pageEl = ET.startNewPage(sandbox);
      }

      pageEl.appendChild(node);

      if (pageEl.scrollHeight > maxScrollHeight + 1) {
        pageEl.classList.add("exam-page--tall");
        if (ET.PAGINATION_DEBUG) {
          console.log("[pagination] oversized block on new page", kind, pageEl.scrollHeight, maxScrollHeight);
        }
      }
    });

    ET.flushPage(pages, pageEl);
    return pages;
  };

  ET.layoutExamPreviewPages = function (view, rootEl) {
    if (!rootEl) return;

    const blockElements = ET.buildExamBlockElements(view);
    const sandbox = document.createElement("div");
    sandbox.className = "exam-pagination-sandbox";
    sandbox.setAttribute("aria-hidden", "true");
    document.body.appendChild(sandbox);

    try {
      const pages = ET.paginateBlockElements(blockElements, sandbox);
      const chrome = ET.renderPrintChrome(ET.safeMeta(view?.meta));

      rootEl.innerHTML = "";
      rootEl.insertAdjacentHTML("afterbegin", chrome);

      pages.forEach((page, index) => {
        page.classList.remove("exam-page--measure");
        if (index === pages.length - 1) {
          page.classList.add("exam-page--last");
        }
        rootEl.appendChild(page);
      });
    } finally {
      sandbox.remove();
    }
  };

  ET.scheduleExamPageLayout = function (view, rootEl) {
    if (!rootEl) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ET.layoutExamPreviewPages(view, rootEl);
      });
    });
  };

  /** @deprecated Use scheduleExamPageLayout — kept for app.js beforeprint hook */
  ET.applyQuestionPagination = function (rootEl) {
    if (!rootEl || typeof ET.ExamToolkitAPI?.getView !== "function") return;
    ET.layoutExamPreviewPages(ET.ExamToolkitAPI.getView(), rootEl);
  };

  ET.scheduleQuestionPagination = function (rootEl) {
    /* no-op: layout driven by renderExamPreview + scheduleExamPageLayout */
  };
})(window.ExamToolkit);
