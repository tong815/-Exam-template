/**
 * Exam preview rendering (student-facing document).
 */
(function (ET) {
  "use strict";

  ET.renderExamPreview = function (view, rootEl) {
    if (!rootEl) return;
    const parts = [];

    parts.push(ET.renderPrintChrome(view.meta));
    parts.push(ET.renderTitleBlock(view));
    if (view.settings?.showInstructions !== false) {
      parts.push(ET.renderInstructions(view.instructions));
    }
    if (view.settings?.showMarkDistribution !== false) {
      parts.push(ET.renderMarkDistribution(view.markDistribution));
    }
    view.parts.forEach((p) => parts.push(ET.renderPart(p)));
    parts.push(ET.renderBonus(view.bonus));
    parts.push(`<p class="exam-end">— End of Examination — Good luck! / Bonne chance! —</p>`);

    rootEl.innerHTML = parts.join("\n");
  };

  ET.renderPrintChrome = function (meta) {
    return `
      <div class="print-header" aria-hidden="true">
        ${ET.escapeHtml(meta.courseLine)} &nbsp;|&nbsp; ${ET.escapeHtml(meta.testTitle)}
      </div>
      <div class="print-footer" aria-hidden="true">
        ${ET.escapeHtml(meta.schoolName)} — ${ET.escapeHtml(meta.testTitle)}
      </div>`;
  };

  ET.renderTitleBlock = function (view) {
    const m = view.meta;
    return `
      <section class="exam-title-block">
        <table class="exam-title-block__table">
          <tbody>
            <tr><th>School Name</th><td>${ET.escapeHtml(m.schoolName)}</td></tr>
            <tr><th>Course</th><td>${ET.escapeHtml(m.courseLine)}</td></tr>
            <tr><th>Test Title</th><td>${ET.escapeHtml(m.testTitle)}</td></tr>
            <tr><th>${ET.escapeHtml(m.studentNameLabel || "Student Name")}</th><td><span class="field-line">&nbsp;</span></td></tr>
            <tr><th>${ET.escapeHtml(m.dateLabel || "Date")}</th><td><span class="field-line">&nbsp;</span></td></tr>
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
        <ol class="exam-section__instructions">${items}</ol>
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
    if (space.type === "blank" || space.lines === 0) return "";

    const n = Math.max(1, Number(space.lines) || 4);
    const lineEls = Array.from({ length: n }, () => `<div class="solution-space__line"></div>`).join("");
    return `
      <div class="solution-space" style="--solution-lines: ${n}">
        <div class="solution-space__label">Answer space — Question ${number}</div>
        <div class="solution-space__lines">${lineEls}</div>
      </div>`;
  };

  ET.renderQuestionBody = function (q) {
    const options = ET.normalizeOptions(q.options);

    switch (q.type) {
      case "multiple-choice": {
        const opts = options
          .map((o) => `<li><span class="option-label">${ET.escapeHtml(o.key)})</span>${ET.escapeHtml(o.text)}</li>`)
          .join("");
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
          ${ET.renderAnswerSpace(q.number, q.answerSpace)}`;
      case "matching": {
        const pairs = options.length
          ? options.map((o) => `<li>${ET.escapeHtml(o.key)}. ${ET.escapeHtml(o.text)}</li>`).join("")
          : "<li>[PLACEHOLDER: matching items]</li>";
        return `
          <ul class="options-list">${pairs}</ul>
          ${ET.renderAnswerSpace(q.number, q.answerSpace)}`;
      }
      case "long-answer":
      case "communication":
      case "problem-solving":
      case "custom":
        return ET.renderAnswerSpace(q.number, q.answerSpace);
      default:
        return `<p><em>Unsupported question type: ${ET.escapeHtml(q.type)}</em></p>`;
    }
  };

  ET.renderQuestion = function (q) {
    const body = ET.renderQuestionBody(q);
    const teacherNote = q.teacherNote
      ? `<div class="teacher-note"><span class="teacher-note__label">Note:</span>${ET.escapeHtml(q.teacherNote)}</div>`
      : "";
    const answerKey = q.answerKey
      ? `<div class="question-block__answer-key"><strong>Answer key:</strong> ${ET.escapeHtml(q.answerKey)}</div>`
      : "";

    return `
      <article class="question-block" data-question="${q.number}" data-type="${q.type}">
        <div class="question-block__header">
          <span class="question-block__number">${q.number}.</span>
          <span class="question-block__stem">${ET.escapeHtml(q.stem)}</span>
          <span class="question-block__marks">[${ET.escapeHtml(q.marks)}]</span>
        </div>
        ${body}
        ${teacherNote}
        ${answerKey}
      </article>`;
  };

  ET.renderPart = function (part) {
    const pageBreakClass = part.pageBreakBefore ? " exam-section--page-break" : "";
    const questions = part.questions.map(ET.renderQuestion).join("");
    return `
      <section class="exam-section${pageBreakClass}" data-part="${part.id}">
        <h2 class="exam-section__heading">Part ${ET.escapeHtml(part.label)} — ${ET.escapeHtml(part.title)}</h2>
        <p class="exam-section__summary">${ET.escapeHtml(part.marksSummary)}</p>
        <p class="exam-section__description">${ET.escapeHtml(part.description)}</p>
        ${questions}
      </section>`;
  };

  ET.renderBonus = function (bonus) {
    if (!bonus?.enabled) return "";
    const q = {
      number: bonus.number,
      marks: bonus.marks,
      type: "problem-solving",
      stem: bonus.stem,
      answerSpace: bonus.answerSpace || { type: "lines", lines: 3 },
      teacherNote: bonus.teacherNote,
      answerKey: bonus.answerKey,
    };
    return `
      <section class="exam-section" data-part="bonus">
        <h2 class="exam-section__heading">Bonus Question (Optional)</h2>
        ${ET.renderQuestion(q)}
      </section>`;
  };
})(window.ExamToolkit);
