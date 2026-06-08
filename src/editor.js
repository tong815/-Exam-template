/**
 * Structure editor UI (labels via i18n; exam content values unchanged).
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

  ET.fieldTextarea = function (label, path, value, rows = 2, attrs = "") {
    const id = `f-${path.replace(/\./g, "-")}`;
    return `
      <div class="editor-field editor-field--full">
        <label for="${id}">${label}</label>
        <textarea id="${id}" data-path="${path}" rows="${rows}" ${attrs}>${ET.escapeHtml(value ?? "")}</textarea>
      </div>`;
  };

  ET.fieldReadonlyJson = function (label, value, rows = 2) {
    const text = typeof value === "string" ? value : JSON.stringify(value ?? [], null, 2);
    return `
      <div class="editor-field editor-field--full">
        <label>${label}</label>
        <textarea readonly rows="${rows}" class="editor-field__readonly">${ET.escapeHtml(text)}</textarea>
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
                type === "matching"
                  ? ET.t("field.matchingItem", { key: o.key })
                  : ET.t("field.option", { key: o.key }),
                `${base}.options.${oi}.text`,
                o.text,
                `data-option-key="${o.key}"`
              )
            )
            .join("")}
        </div>`
        : "";

    const linesField = ET.usesAnswerLines(type)
      ? ET.fieldNumber(ET.t("field.answerSpaceLines"), `${base}.answerSpace.lines`, lines, 1, 40)
      : "";

    return `
      <div class="editor-question">
        <div class="editor-question__head">${ET.t("question.head", { num: qNum })}</div>
        <div class="editor-question__grid">
          ${ET.fieldNumber(ET.t("field.marks"), `${base}.marks`, question.marks, 0, 100)}
          ${ET.fieldSelect(ET.t("field.type"), `${base}.type`, type, ET.getLocalizedQuestionTypes())}
          ${ET.fieldTextarea(ET.t("field.stemPlaceholder"), `${base}.stem`, question.stem, 2)}
          ${linesField}
          ${ET.fieldText(ET.t("field.answerKeyPlaceholder"), `${base}.answerKey`, question.answerKey)}
          ${ET.fieldTextarea(ET.t("field.teacherNote"), `${base}.teacherNote`, question.teacherNote, 2)}
          ${ET.fieldText(ET.t("field.tags"), `${base}.__tagsCsv`, (question.tags || []).join(", "), 'data-input-type="tags-csv"')}
          ${ET.fieldTextarea(ET.t("field.rubricAllocation"), `${base}.__rubricJson`, JSON.stringify(question.rubricAllocation || {}, null, 2), 2, 'data-input-type="json-object"')}
        </div>
        ${ET.fieldReadonlyJson(ET.t("field.attachmentsReadonly"), question.attachments || [], 2)}
        ${optionsHtml}
      </div>`;
  };

  ET.renderPartEditor = function (partIndex, part, numberMap, view) {
    const numbers = numberMap.get(part.id) || [];
    const startQ = numbers[0] ?? "—";
    const endQ = numbers[numbers.length - 1] ?? "—";
    const rangeLabel =
      numbers.length > 0
        ? numbers.length === 1
          ? `Q${startQ}`
          : `Q${startQ}–Q${endQ}`
        : ET.t("part.rangeDisabled");

    const built = view.parts.find((p) => p.id === part.id);
    const subtotal = built ? ET.sumMarks(built.questions) : 0;
    const qCount = part.questions.length;

    const questionsHtml =
      part.enabled && qCount > 0
        ? part.questions
            .map((q, qi) => ET.renderQuestionEditor(partIndex, qi, numbers[qi] ?? "?", q, part))
            .join("")
        : `<p class="editor-section__subtitle">${ET.escapeHtml(ET.t("part.noQuestions"))}</p>`;

    return `
      <div class="editor-part${part.enabled ? "" : " is-disabled"}" data-part-index="${partIndex}">
        <div class="editor-part__header">
          <h3 class="editor-part__title">${ET.escapeHtml(ET.t("part.title", { label: part.label }))}</h3>
          ${ET.fieldCheckbox(ET.t("field.enabled"), `parts.${partIndex}.enabled`, part.enabled, `-en`)}
        </div>
        <p class="editor-part__meta">${ET.escapeHtml(ET.t("part.range", { range: rangeLabel, subtotal }))}</p>
        ${ET.fieldText(ET.t("field.label"), `parts.${partIndex}.label`, part.label)}
        ${ET.fieldText(ET.t("field.title"), `parts.${partIndex}.title`, part.title)}
        ${ET.fieldTextarea(ET.t("field.description"), `parts.${partIndex}.description`, part.description, 3)}
        <div class="editor-question__grid">
          ${ET.fieldNumber(ET.t("field.questionCount"), `parts.${partIndex}.__questionCount`, qCount, 0, 50)}
          ${ET.fieldSelect(ET.t("field.defaultType"), `parts.${partIndex}.defaultQuestionType`, part.defaultQuestionType, ET.getLocalizedQuestionTypes())}
          ${ET.fieldNumber(ET.t("field.defaultMarks"), `parts.${partIndex}.defaultMarks`, part.defaultMarks, 0, 100)}
          ${ET.fieldNumber(ET.t("field.defaultAnswerLines"), `parts.${partIndex}.defaultAnswerSpace.lines`, part.defaultAnswerSpace?.lines ?? 0, 0, 40)}
          ${ET.fieldCheckbox(ET.t("field.pageBreakBefore"), `parts.${partIndex}.pageBreakBefore`, part.pageBreakBefore, `-pb`)}
        </div>
        ${questionsHtml}
      </div>`;
  };

  ET.renderValidationSummary = function (validation) {
    const v = validation || { ok: true, errors: [], warnings: [] };
    const hasErrors = v.errors.length > 0;
    const hasWarnings = v.warnings.length > 0;
    const statusClass = hasErrors
      ? "validation-summary--error"
      : hasWarnings
        ? "validation-summary--warn"
        : "validation-summary--ok";
    const statusIcon = hasErrors ? "❌" : hasWarnings ? "⚠️" : "✅";
    const statusText = hasErrors
      ? ET.t("validation.errorAndWarningCount", {
          errors: v.errors.length,
          warnings: v.warnings.length,
        })
      : hasWarnings
        ? ET.t("validation.schemaValidWithWarnings", { count: v.warnings.length })
        : ET.t("validation.schemaValid");

    const errorList =
      v.errors.length > 0
        ? `<ul class="validation-summary__list validation-summary__list--errors">${v.errors
            .map((e) => `<li>${ET.escapeHtml(ET.formatValidationIssue(e))}</li>`)
            .join("")}</ul>`
        : "";
    const warnList =
      v.warnings.length > 0
        ? `<ul class="validation-summary__list validation-summary__list--warnings">${v.warnings
            .map((w) => `<li>${ET.escapeHtml(ET.formatValidationIssue(w))}</li>`)
            .join("")}</ul>`
        : "";

    return `
      <details class="validation-summary ${statusClass}" open>
        <summary class="validation-summary__head">
          <span class="validation-summary__icon">${statusIcon}</span>
          <span class="validation-summary__title">${ET.escapeHtml(ET.t("section.validation"))}</span>
          <span class="validation-summary__status">${ET.escapeHtml(statusText)}</span>
        </summary>
        <div class="validation-summary__body">
          ${hasErrors ? `<p class="validation-summary__label">${ET.escapeHtml(ET.t("validation.errors"))}</p>${errorList}` : ""}
          ${hasWarnings ? `<p class="validation-summary__label">${ET.escapeHtml(ET.t("validation.warnings"))}</p>${warnList}` : ""}
          ${!hasErrors && !hasWarnings ? `<p class="validation-summary__hint">${ET.escapeHtml(ET.t("validation.noIssues"))}</p>` : ""}
          ${hasErrors ? `<p class="validation-summary__hint">${ET.escapeHtml(ET.t("validation.fixBeforeSave"))}</p>` : ""}
        </div>
      </details>`;
  };

  ET.renderEditor = function (exam, view, rootEl, validation) {
    if (!rootEl) return;
    const numberMap = ET.assignQuestionNumbers(exam);
    const m = exam.meta || {};
    const p = exam.profile || {};

    const partsHtml = (exam.parts || [])
      .map((part, i) => ET.renderPartEditor(i, part, numberMap, view))
      .join("");

    rootEl.innerHTML = `
      ${ET.renderValidationSummary(validation)}

      <section class="editor-section">
        <h2 class="editor-section__title">${ET.escapeHtml(ET.t("section.examProfile"))}</h2>
        ${ET.fieldText(ET.t("field.examId"), "examId", exam.examId)}
        <div class="editor-question__grid">
          ${ET.fieldText(ET.t("field.grade"), "profile.grade", p.grade)}
          ${ET.fieldText(ET.t("field.subject"), "profile.subject", p.subject)}
          ${ET.fieldText(ET.t("field.courseCode"), "profile.courseCode", p.courseCode)}
          ${ET.fieldText(ET.t("field.courseName"), "profile.courseName", p.courseName)}
          ${ET.fieldText(ET.t("field.region"), "profile.region", p.region)}
          ${ET.fieldText(ET.t("field.language"), "profile.language", p.language)}
        </div>
      </section>

      <section class="editor-section">
        <h2 class="editor-section__title">${ET.escapeHtml(ET.t("section.examMeta"))}</h2>
        ${ET.fieldText(ET.t("field.schoolName"), "meta.schoolName", m.schoolName)}
        ${ET.fieldText(ET.t("field.testTitle"), "meta.testTitle", m.testTitle)}
        ${ET.fieldText(ET.t("field.studentNameLabel"), "meta.studentNameLabel", m.studentNameLabel)}
        ${ET.fieldText(ET.t("field.dateLabel"), "meta.dateLabel", m.dateLabel)}
        ${ET.fieldText(ET.t("field.timeAllowed"), "meta.timeAllowed", m.timeAllowed)}
        <div class="editor-field">
          <label>${ET.escapeHtml(ET.t("field.totalMarksAuto"))}</label>
          <input type="text" readonly value="${view.meta.totalMarks}">
        </div>
        ${ET.fieldText(ET.t("field.teacher"), "meta.teacher", m.teacher)}
        ${ET.fieldSelect(ET.t("field.calculatorPolicy"), "meta.calculatorPolicy", m.calculatorPolicy, [
          { value: "ALLOWED", label: ET.t("policy.ALLOWED") },
          { value: "NOT ALLOWED", label: ET.t("policy.NOT_ALLOWED") },
        ])}
        ${ET.fieldSelect(ET.t("field.paperSize"), "meta.paperSize", m.paperSize, [
          { value: "letter", label: ET.t("paper.letter") },
          { value: "a4", label: ET.t("paper.a4") },
        ])}
      </section>

      <section class="editor-section">
        <h2 class="editor-section__title">${ET.escapeHtml(ET.t("section.displaySettings"))}</h2>
        ${ET.fieldCheckbox(ET.t("field.showInstructions"), "settings.showInstructions", exam.settings.showInstructions !== false, "-si")}
        ${ET.fieldCheckbox(ET.t("field.showMarkDistribution"), "settings.showMarkDistribution", exam.settings.showMarkDistribution !== false, "-sm")}
        ${ET.fieldCheckbox(ET.t("field.showBonus"), "settings.showBonus", !!exam.settings.showBonus, "-sb")}
        ${ET.fieldCheckbox(ET.t("field.autoNumberQuestions"), "settings.autoNumberQuestions", exam.settings.autoNumberQuestions !== false, "-an")}
      </section>

      <section class="editor-section">
        <h2 class="editor-section__title">${ET.escapeHtml(ET.t("section.partStructure"))}</h2>
        <p class="editor-section__subtitle">${ET.escapeHtml(ET.t("part.structureHint"))}</p>
        ${partsHtml}
        <button type="button" class="btn btn--secondary" data-action="add-part" style="margin-top:0.5rem;width:100%">${ET.escapeHtml(ET.t("field.addPart"))}</button>
      </section>

      <section class="editor-section">
        <h2 class="editor-section__title">${ET.escapeHtml(ET.t("section.bonus"))}</h2>
        ${ET.fieldCheckbox(ET.t("field.enabled"), "bonus.enabled", exam.bonus.enabled, "-bonus")}
        ${ET.fieldText(ET.t("field.label"), "bonus.label", exam.bonus.label)}
        ${ET.fieldText(ET.t("field.marksLabel"), "bonus.marks", exam.bonus.marks)}
        ${ET.fieldTextarea(ET.t("field.stemPlaceholder"), "bonus.stem", exam.bonus.stem, 2)}
        ${ET.fieldNumber(ET.t("field.answerSpaceLines"), "bonus.answerSpace.lines", exam.bonus.answerSpace?.lines ?? 3, 1, 40)}
        ${ET.fieldText(ET.t("field.answerKeyPlaceholder"), "bonus.answerKey", exam.bonus.answerKey)}
        ${ET.fieldTextarea(ET.t("field.teacherNote"), "bonus.teacherNote", exam.bonus.teacherNote, 2)}
      </section>`;
  };
})(window.ExamToolkit);
