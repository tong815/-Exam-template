/**
 * Structure editor UI.
 */
(function (ET) {
  "use strict";

  ET.fieldText = function (label, path, value, attrs = "") {
    const id = `f-${path.replace(/\./g, "-")}`;
    return `
      <div class="editor-field">
        <label for="${id}">${label}</label>
        <input type="text" id="${id}" data-path="${path}" value="${ET.escapeHtml(value ?? "")}" ${attrs}>
      </div>`;
  };

  ET.fieldNumber = function (label, path, value, min, max) {
    const id = `f-${path.replace(/\./g, "-")}`;
    const minAttr = min != null ? `min="${min}"` : "";
    const maxAttr = max != null ? `max="${max}"` : "";
    return `
      <div class="editor-field">
        <label for="${id}">${label}</label>
        <input type="number" id="${id}" data-path="${path}" value="${value ?? ""}" ${minAttr} ${maxAttr}>
      </div>`;
  };

  ET.fieldTextarea = function (label, path, value, rows = 2) {
    const id = `f-${path.replace(/\./g, "-")}`;
    return `
      <div class="editor-field editor-field--full">
        <label for="${id}">${label}</label>
        <textarea id="${id}" data-path="${path}" rows="${rows}">${ET.escapeHtml(value ?? "")}</textarea>
      </div>`;
  };

  ET.fieldSelect = function (label, path, value, options) {
    const id = `f-${path.replace(/\./g, "-")}`;
    const opts = options
      .map(
        (o) =>
          `<option value="${ET.escapeHtml(o.value)}"${o.value === value ? " selected" : ""}>${ET.escapeHtml(o.label)}</option>`
      )
      .join("");
    return `
      <div class="editor-field">
        <label for="${id}">${label}</label>
        <select id="${id}" data-path="${path}">${opts}</select>
      </div>`;
  };

  ET.fieldCheckbox = function (label, path, checked, idSuffix = "") {
    const id = `f-${path.replace(/\./g, "-")}${idSuffix}`;
    return `
      <div class="editor-field editor-field--inline">
        <input type="checkbox" id="${id}" data-path="${path}" data-input-type="checkbox" ${checked ? "checked" : ""}>
        <label for="${id}">${label}</label>
      </div>`;
  };

  ET.renderQuestionEditor = function (partIndex, qIndex, qNum, question, part) {
    const base = `parts.${partIndex}.questions.${qIndex}`;
    const type = question.type || part.defaultQuestionType;
    const options = ET.normalizeOptions(question.options);
    const lines = question.answerSpace?.lines ?? part.defaultAnswerSpace?.lines ?? 4;

    const optionsHtml =
      type === "multiple-choice" || type === "matching"
        ? `
        <div class="editor-options">
          ${(options.length ? options : ET.defaultMcOptions())
            .map((o, oi) =>
              ET.fieldText(
                type === "matching" ? `Item ${o.key}` : `Option ${o.key}`,
                `${base}.options.${oi}.text`,
                o.text,
                `data-option-key="${o.key}"`
              )
            )
            .join("")}
        </div>`
        : "";

    const linesField = ET.usesAnswerLines(type)
      ? ET.fieldNumber("Answer space lines", `${base}.answerSpace.lines`, lines, 1, 40)
      : "";

    return `
      <div class="editor-question">
        <div class="editor-question__head">Question ${qNum}</div>
        <div class="editor-question__grid">
          ${ET.fieldNumber("Marks", `${base}.marks`, question.marks, 0, 100)}
          ${ET.fieldSelect("Type", `${base}.type`, type, ET.QUESTION_TYPES)}
          ${ET.fieldTextarea("Stem (placeholder)", `${base}.stem`, question.stem, 2)}
          ${linesField}
          ${ET.fieldText("Answer key (placeholder)", `${base}.answerKey`, question.answerKey)}
          ${ET.fieldTextarea("Teacher note", `${base}.teacherNote`, question.teacherNote, 2)}
        </div>
        ${optionsHtml}
      </div>`;
  };

  ET.renderPartEditor = function (partIndex, part, numberMap, view) {
    const numbers = numberMap.get(part.id) || [];
    const startQ = numbers[0] ?? "—";
    const endQ = numbers[numbers.length - 1] ?? "—";
    const rangeLabel =
      numbers.length > 0 ? (numbers.length === 1 ? `Q${startQ}` : `Q${startQ}–Q${endQ}`) : "disabled";

    const built = view.parts.find((p) => p.id === part.id);
    const subtotal = built ? ET.sumMarks(built.questions) : 0;
    const qCount = part.questions.length;

    const questionsHtml =
      part.enabled && qCount > 0
        ? part.questions
            .map((q, qi) =>
              ET.renderQuestionEditor(partIndex, qi, numbers[qi] ?? "?", q, part)
            )
            .join("")
        : `<p class="editor-section__subtitle">No questions (part disabled or count is 0).</p>`;

    return `
      <div class="editor-part${part.enabled ? "" : " is-disabled"}" data-part-index="${partIndex}">
        <div class="editor-part__header">
          <h3 class="editor-part__title">Part ${ET.escapeHtml(part.label)}</h3>
          ${ET.fieldCheckbox("Enabled", `parts.${partIndex}.enabled`, part.enabled, `-en`)}
        </div>
        <p class="editor-part__meta">Range: <strong>${rangeLabel}</strong> &nbsp;|&nbsp; Subtotal: <strong>${subtotal}</strong> marks</p>
        ${ET.fieldText("Label", `parts.${partIndex}.label`, part.label)}
        ${ET.fieldText("Title", `parts.${partIndex}.title`, part.title)}
        ${ET.fieldTextarea("Description", `parts.${partIndex}.description`, part.description, 3)}
        <div class="editor-question__grid">
          ${ET.fieldNumber("# Questions", `parts.${partIndex}.__questionCount`, qCount, 0, 50)}
          ${ET.fieldSelect("Default type", `parts.${partIndex}.defaultQuestionType`, part.defaultQuestionType, ET.QUESTION_TYPES)}
          ${ET.fieldNumber("Default marks", `parts.${partIndex}.defaultMarks`, part.defaultMarks, 0, 100)}
          ${ET.fieldNumber("Default answer lines", `parts.${partIndex}.defaultAnswerSpace.lines`, part.defaultAnswerSpace?.lines ?? 0, 0, 40)}
          ${ET.fieldCheckbox("Page break before", `parts.${partIndex}.pageBreakBefore`, part.pageBreakBefore, `-pb`)}
        </div>
        ${questionsHtml}
      </div>`;
  };

  ET.renderEditor = function (exam, view, rootEl) {
    if (!rootEl) return;
    const numberMap = ET.assignQuestionNumbers(exam);
    const m = exam.meta;
    const p = exam.profile;

    const partsHtml = exam.parts.map((part, i) => ET.renderPartEditor(i, part, numberMap, view)).join("");

    rootEl.innerHTML = `
      <section class="editor-section">
        <h2 class="editor-section__title">Exam Profile</h2>
        ${ET.fieldText("Exam ID", "examId", exam.examId)}
        <div class="editor-question__grid">
          ${ET.fieldText("Grade", "profile.grade", p.grade)}
          ${ET.fieldText("Subject", "profile.subject", p.subject)}
          ${ET.fieldText("Course code", "profile.courseCode", p.courseCode)}
          ${ET.fieldText("Course name", "profile.courseName", p.courseName)}
          ${ET.fieldText("Region", "profile.region", p.region)}
          ${ET.fieldText("Language", "profile.language", p.language)}
        </div>
      </section>

      <section class="editor-section">
        <h2 class="editor-section__title">Exam Meta</h2>
        ${ET.fieldText("School Name", "meta.schoolName", m.schoolName)}
        ${ET.fieldText("Test Title", "meta.testTitle", m.testTitle)}
        ${ET.fieldText("Student name label", "meta.studentNameLabel", m.studentNameLabel)}
        ${ET.fieldText("Date label", "meta.dateLabel", m.dateLabel)}
        ${ET.fieldText("Time Allowed", "meta.timeAllowed", m.timeAllowed)}
        <div class="editor-field">
          <label>Total Marks (auto)</label>
          <input type="text" readonly value="${view.meta.totalMarks}">
        </div>
        ${ET.fieldText("Teacher", "meta.teacher", m.teacher)}
        ${ET.fieldSelect("Calculator Policy", "meta.calculatorPolicy", m.calculatorPolicy, [
          { value: "ALLOWED", label: "ALLOWED" },
          { value: "NOT ALLOWED", label: "NOT ALLOWED" },
        ])}
        ${ET.fieldSelect("Paper Size", "meta.paperSize", m.paperSize, [
          { value: "letter", label: "Letter" },
          { value: "a4", label: "A4" },
        ])}
      </section>

      <section class="editor-section">
        <h2 class="editor-section__title">Display Settings</h2>
        ${ET.fieldCheckbox("Show instructions", "settings.showInstructions", exam.settings.showInstructions !== false, "-si")}
        ${ET.fieldCheckbox("Show mark distribution", "settings.showMarkDistribution", exam.settings.showMarkDistribution !== false, "-sm")}
        ${ET.fieldCheckbox("Show bonus section", "settings.showBonus", !!exam.settings.showBonus, "-sb")}
        ${ET.fieldCheckbox("Auto-number questions", "settings.autoNumberQuestions", exam.settings.autoNumberQuestions !== false, "-an")}
      </section>

      <section class="editor-section">
        <h2 class="editor-section__title">Part Structure</h2>
        <p class="editor-section__subtitle">Question numbers update automatically across enabled parts.</p>
        ${partsHtml}
        <button type="button" class="btn btn--secondary" data-action="add-part" style="margin-top:0.5rem;width:100%">+ Add Part</button>
      </section>

      <section class="editor-section">
        <h2 class="editor-section__title">Bonus Question (Optional)</h2>
        ${ET.fieldCheckbox("Enabled", "bonus.enabled", exam.bonus.enabled, "-bonus")}
        ${ET.fieldText("Label", "bonus.label", exam.bonus.label)}
        ${ET.fieldText("Marks label", "bonus.marks", exam.bonus.marks)}
        ${ET.fieldTextarea("Stem (placeholder)", "bonus.stem", exam.bonus.stem, 2)}
        ${ET.fieldNumber("Answer space lines", "bonus.answerSpace.lines", exam.bonus.answerSpace?.lines ?? 3, 1, 40)}
        ${ET.fieldText("Answer key (placeholder)", "bonus.answerKey", exam.bonus.answerKey)}
        ${ET.fieldTextarea("Teacher note", "bonus.teacherNote", exam.bonus.teacherNote, 2)}
      </section>`;
  };
})(window.ExamToolkit);
