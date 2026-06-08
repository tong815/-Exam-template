/**
 * Exam preview rendering (student-facing document) — fault-tolerant.
 */
(function (ET) {
  "use strict";

  ET.safeMeta = function (meta) {
    const m = meta || {};
    return {
      schoolName: m.schoolName ?? "",
      testTitle: m.testTitle ?? "",
      studentNameLabel: m.studentNameLabel || "Student Name",
      dateLabel: m.dateLabel || "Date",
      timeAllowed: m.timeAllowed ?? "",
      teacher: m.teacher ?? "",
      courseLine: m.courseLine || "Examination",
      totalMarks: m.totalMarks ?? 0,
      calculatorPolicy: m.calculatorPolicy || "ALLOWED",
      paperSize: m.paperSize || "letter",
    };
  };

  ET.safePart = function (part) {
    return {
      id: part?.id ?? "part",
      label: part?.label ?? part?.id ?? "?",
      title: part?.title ?? "Section",
      description: part?.description ?? "",
      marksSummary: part?.marksSummary ?? "",
      pageBreakBefore: !!part?.pageBreakBefore,
      questions: Array.isArray(part?.questions) ? part.questions : [],
    };
  };

  ET.safeQuestion = function (q, index) {
    const type = q?.type || "custom";
    return {
      id: q?.id ?? `q-${index}`,
      number: q?.number ?? index + 1,
      type,
      stem: q?.stem ?? "[No stem provided]",
      marks: q?.marks != null ? q.marks : 0,
      options: ET.normalizeOptions(q?.options),
      answerSpace: ET.normalizeAnswerSpace(q?.answerSpace, type),
      answerKey: q?.answerKey ?? "",
      teacherNote: q?.teacherNote ?? "",
      tags: q?.tags ?? [],
    };
  };

  ET.renderExamPreview = function (view, rootEl) {
    if (!rootEl) return;
    const safeView = {
      meta: ET.safeMeta(view?.meta),
      instructions: view?.instructions || [],
      markDistribution: view?.markDistribution || [],
      parts: (view?.parts || []).map(ET.safePart),
      bonus: view?.bonus || { enabled: false },
      settings: view?.settings || {},
    };

    const parts = [];
    parts.push(ET.renderPrintChrome(safeView.meta));
    parts.push(ET.renderTitleBlock(safeView.meta));
    if (safeView.settings.showInstructions !== false) {
      parts.push(ET.renderInstructions(safeView.instructions));
    }
    if (safeView.settings.showMarkDistribution !== false) {
      parts.push(ET.renderMarkDistribution(safeView.markDistribution));
    }
    safeView.parts.forEach((p) => parts.push(ET.renderPart(p)));
    parts.push(ET.renderBonus(safeView.bonus));
    parts.push(`<p class="exam-end">— End of Examination — Good luck! / Bonne chance! —</p>`);

    rootEl.innerHTML = parts.join("\n");
  };

  ET.renderPrintChrome = function (meta) {
    const m = ET.safeMeta(meta);
    return `
      <div class="print-header" aria-hidden="true">
        ${ET.escapeHtml(m.courseLine)} &nbsp;|&nbsp; ${ET.escapeHtml(m.testTitle)}
      </div>
      <div class="print-footer" aria-hidden="true">
        ${ET.escapeHtml(m.schoolName)} — ${ET.escapeHtml(m.testTitle)}
      </div>`;
  };

  ET.renderTitleBlock = function (meta) {
    const m = ET.safeMeta(meta);
    return `
      <section class="exam-title-block">
        <table class="exam-title-block__table">
          <tbody>
            <tr><th>School Name</th><td>${ET.escapeHtml(m.schoolName)}</td></tr>
            <tr><th>Course</th><td>${ET.escapeHtml(m.courseLine)}</td></tr>
            <tr><th>Test Title</th><td>${ET.escapeHtml(m.testTitle)}</td></tr>
            <tr><th>${ET.escapeHtml(m.studentNameLabel)}</th><td><span class="field-line">&nbsp;</span></td></tr>
            <tr><th>${ET.escapeHtml(m.dateLabel)}</th><td><span class="field-line">&nbsp;</span></td></tr>
            <tr><th>Time Allowed</th><td>${ET.escapeHtml(m.timeAllowed)}</td></tr>
            <tr><th>Total Marks</th><td><strong>${ET.escapeHtml(m.totalMarks)}</strong></td></tr>
            <tr><th>Teacher</th><td>${ET.escapeHtml(m.teacher)}</td></tr>
          </tbody>
        </table>
      </section>`;
  };

  ET.renderInstructions = function (instructions) {
    const items = (instructions || []).map((t) => `<li>${ET.escapeHtml(t)}</li>`).join("");
    return `
      <section class="exam-section">
        <h2 class="exam-section__heading">Instructions</h2>
        <ol class="exam-section__instructions">${items || "<li></li>"}</ol>
      </section>`;
  };

  ET.renderMarkDistribution = function (rows) {
    const body = (rows || [])
      .map((row) => {
        const part = row.isTotal
          ? ""
          : row.isBonus
            ? `<em>${ET.escapeHtml(row.part)}</em>`
            : `<strong>${ET.escapeHtml(row.part)}</strong>`;
        const section = row.isBonus ? `<em>${ET.escapeHtml(row.section)}</em>` : ET.escapeHtml(row.section);
        const subtotal =
          row.isTotal || !row.isBonus
            ? `<strong>${ET.escapeHtml(row.subtotal)}</strong>`
            : ET.escapeHtml(row.subtotal);
        const rowClass = row.isTotal
          ? ' class="mark-table__total"'
          : row.isBonus
            ? ' class="mark-table__bonus"'
            : "";
        return `<tr${rowClass}><td>${part}</td><td>${section}</td><td class="col-num">${ET.escapeHtml(row.questions)}</td><td class="col-num">${ET.escapeHtml(row.marksPerQ)}</td><td class="col-num">${subtotal}</td></tr>`;
      })
      .join("");

    return `
      <section class="exam-section">
        <h2 class="exam-section__heading">Mark Distribution Summary</h2>
        <table class="mark-table">
          <thead>
            <tr>
              <th>Part</th>
              <th>Section</th>
              <th class="col-num">Questions</th>
              <th class="col-num">Marks per Q</th>
              <th class="col-num">Subtotal</th>
            </tr>
          </thead>
          <tbody>${body}</tbody>
        </table>
      </section>`;
  };

  ET.renderAnswerSpace = function (number, answerSpace) {
    const space = answerSpace || { type: "lines", lines: 4 };
    if (space.type === "blank" || !space.lines || space.lines === 0) return "";

    const n = Math.max(1, Number(space.lines) || 4);
    const lineEls = Array.from({ length: n }, () => `<div class="solution-space__line"></div>`).join("");
    return `
      <div class="solution-space" style="--solution-lines: ${n}">
        <div class="solution-space__label">Answer space — Question ${number}</div>
        <div class="solution-space__lines">${lineEls}</div>
      </div>`;
  };

  ET.renderQuestionBody = function (q) {
    const safe = ET.safeQuestion(q, 0);
    const options = safe.options;

    switch (safe.type) {
      case "multiple-choice": {
        const opts =
          options.length > 0
            ? options
                .map(
                  (o) =>
                    `<li><span class="option-label">${ET.escapeHtml(o.key)})</span>${ET.escapeHtml(o.text)}</li>`
                )
                .join("")
            : "<li><em>[No options provided]</em></li>";
        return `
          <ul class="options-list">${opts}</ul>
          <p class="answer-line">
            <span class="answer-line__label">Answer:</span>
            <span class="answer-line__blank">&nbsp;</span>
          </p>`;
      }
      case "short-answer":
        return `
          <p class="answer-line">
            <span class="answer-line__label">Answer:</span>
            <span class="answer-line__blank">&nbsp;</span>
          </p>
          <p class="explanation-line">
            <span class="explanation-line__label">Brief explanation (if needed):</span>
            <span class="answer-line__blank">&nbsp;</span>
          </p>`;
      case "true-false":
        return `
          <p class="answer-line">
            <span class="answer-line__label">True / False:</span>
            <span class="answer-line__blank">&nbsp;</span>
          </p>
          ${ET.renderAnswerSpace(safe.number, safe.answerSpace)}`;
      case "matching": {
        const pairs =
          options.length > 0
            ? options.map((o) => `<li>${ET.escapeHtml(o.key)}. ${ET.escapeHtml(o.text)}</li>`).join("")
            : "<li>[PLACEHOLDER: matching items]</li>";
        return `
          <ul class="options-list">${pairs}</ul>
          ${ET.renderAnswerSpace(safe.number, safe.answerSpace)}`;
      }
      case "long-answer":
      case "communication":
      case "problem-solving":
      case "custom":
        return ET.renderAnswerSpace(safe.number, safe.answerSpace);
      default:
        return `<p class="question-unsupported"><em>Unsupported question type: ${ET.escapeHtml(safe.type)}</em></p>`;
    }
  };

  ET.renderQuestion = function (q, index) {
    const safe = ET.safeQuestion(q, index ?? 0);
    const body = ET.renderQuestionBody(safe);
    const teacherNote = safe.teacherNote
      ? `<div class="teacher-note"><span class="teacher-note__label">Note:</span>${ET.escapeHtml(safe.teacherNote)}</div>`
      : "";
    const answerKey = safe.answerKey
      ? `<div class="question-block__answer-key"><strong>Answer key:</strong> ${ET.escapeHtml(safe.answerKey)}</div>`
      : "";

    return `
      <article class="question-block" data-question="${safe.number}" data-type="${safe.type}">
        <div class="question-block__header">
          <span class="question-block__number">${safe.number}.</span>
          <span class="question-block__stem">${ET.escapeHtml(safe.stem)}</span>
          <span class="question-block__marks">[${ET.escapeHtml(safe.marks)}]</span>
        </div>
        ${body}
        ${teacherNote}
        ${answerKey}
      </article>`;
  };

  ET.renderPart = function (part) {
    const safe = ET.safePart(part);
    const pageBreakClass = safe.pageBreakBefore ? " exam-section--page-break" : "";
    const questions = safe.questions.map((q, i) => ET.renderQuestion(q, i)).join("");
    return `
      <section class="exam-section${pageBreakClass}" data-part="${ET.escapeHtml(safe.id)}">
        <h2 class="exam-section__heading">Part ${ET.escapeHtml(safe.label)} — ${ET.escapeHtml(safe.title)}</h2>
        <p class="exam-section__summary">${ET.escapeHtml(safe.marksSummary)}</p>
        <p class="exam-section__description">${ET.escapeHtml(safe.description)}</p>
        ${questions}
      </section>`;
  };

  ET.renderBonus = function (bonus) {
    if (!bonus?.enabled) return "";
    const q = ET.safeQuestion(
      {
        number: bonus.number || bonus.label || "B1",
        marks: bonus.marks ?? "+___",
        type: "problem-solving",
        stem: bonus.stem,
        answerSpace: bonus.answerSpace || { type: "lines", lines: 3 },
        teacherNote: bonus.teacherNote,
        answerKey: bonus.answerKey,
      },
      0
    );
    return `
      <section class="exam-section" data-part="bonus">
        <h2 class="exam-section__heading">Bonus Question (Optional)</h2>
        ${ET.renderQuestion(q, 0)}
      </section>`;
  };
})(window.ExamToolkit);
