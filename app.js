/**
 * G11 Functions Exam Editor & Preview — v1
 * Structure editor + live preview + localStorage + JSON import/export
 */

(function () {
  "use strict";

  const STORAGE_KEY = "g11-exam-editor-v1";

  // ===========================================================================
  // defaultConfig / defaultExamData
  // ===========================================================================

  const DEFAULT_INSTRUCTIONS = [
    "Show all work for full marks. A correct final answer without supporting work may receive partial or no credit.",
    "Calculators: ALLOWED / NOT ALLOWED — confirm policy before the test.",
    "Round decimal answers to 2 decimal places unless otherwise stated.",
    "Clearly state restrictions, domain, and range when required.",
    "Write legibly. Use proper mathematical notation (e.g. f(x), ℝ).",
    "Manage your time. Marks are shown in [ ] beside each question.",
  ];

  function createDefaultQuestionOverride(partId, index) {
    const n = index + 1;
    const base = {
      marks: null,
      type: null,
      stem: null,
      solutionLines: null,
      teacherNote: null,
      answerKey: null,
      options: null,
    };

    if (partId === "A") {
      const stems = [
        "domain of a rational function, transformation, or exponent rule",
        "identifying function type from a graph",
        "evaluating a composite function",
        "solving a simple exponential equation",
        "determining the range of a quadratic",
        "vertical asymptote of a rational function",
        "effect of a horizontal translation",
        "inverse of a linear function",
        "degree vs. leading coefficient behaviour",
        "restrictions on the domain of a root function",
      ];
      return {
        ...base,
        stem: `[PLACEHOLDER: ${stems[index] || `Insert stem (Q${n})`}]`,
        teacherNote: index === 0 ? "教师备注：替换题干与干扰项后检查唯一正确答案。" : null,
      };
    }

    if (partId === "B") {
      return { ...base, stem: `[PLACEHOLDER: Short answer — evaluate, simplify, or state a value]` };
    }

    if (partId === "C") {
      const stems = [
        "A student claims that [PLACEHOLDER statement]. Explain whether this is correct and why.",
        "Compare the representations below: [PLACEHOLDER — table, graph, or equation]. State one similarity and one difference.",
        "The following solution contains an error: [PLACEHOLDER]. Identify the error, explain why it is wrong, and provide a corrected step.",
      ];
      return {
        ...base,
        stem: stems[index] || `[PLACEHOLDER: Communication / reasoning question ${n}]`,
        teacherNote:
          index === 0
            ? "Focus on justification, not length."
            : index === 1
              ? "Require reference to specific features."
              : index === 2
                ? "Award partial credit for identification only."
                : null,
      };
    }

    if (partId === "D") {
      const stems = [
        "Modelling — [PLACEHOLDER: Write an equation from a real-world context and define all variables.]",
        "Graphing — [PLACEHOLDER: Sketch or analyse key features of a transformed function.]",
        "Parameters — [PLACEHOLDER: Explain how a parameter affects the graph or model. Support with an example.]",
        "Application — [PLACEHOLDER: Solve a real-world problem and interpret the result in context with units.]",
      ];
      const notes = ["Modelling / function setup", "Graphing / transformations", "Parameter analysis", "Real-world application"];
      return {
        ...base,
        stem: stems[index] || `[PLACEHOLDER: Problem solving question ${n}]`,
        teacherNote: notes[index] || null,
      };
    }

    return base;
  }

  function defaultPartConfig(id, overrides) {
    const defaults = {
      A: {
        id: "A",
        enabled: true,
        title: "Multiple Choice",
        description: "Choose the best answer. Write the letter (A, B, C, or D) on the line provided.",
        questionCount: 10,
        defaultMarks: 1,
        defaultSolutionLines: 0,
        pageBreakBefore: false,
        questionType: "multiple-choice",
      },
      B: {
        id: "B",
        enabled: true,
        title: "Short Answer / Fill in the Blank",
        description: "Provide a concise answer. Show brief work or a one-sentence explanation where indicated.",
        questionCount: 8,
        defaultMarks: 2,
        defaultSolutionLines: 0,
        pageBreakBefore: false,
        questionType: "short-answer",
      },
      C: {
        id: "C",
        enabled: true,
        title: "Communication / Reasoning",
        description:
          "Explain your thinking clearly. Use complete sentences and correct notation. You may be asked to compare, justify, identify errors, or explain why a statement is true or false.",
        questionCount: 3,
        defaultMarks: 4,
        defaultSolutionLines: 4,
        pageBreakBefore: true,
        questionType: "communication",
      },
      D: {
        id: "D",
        enabled: true,
        title: "Problem Solving / Applications",
        description: "Show all steps. Diagrams, models, and labelled graphs are encouraged where appropriate.",
        questionCount: 4,
        defaultMarks: 6,
        defaultSolutionLines: 6,
        pageBreakBefore: true,
        questionType: "problem-solving",
      },
    }[id];

    const part = { ...defaults, questions: [], ...overrides };
    syncPartQuestionsArray(part);
    return part;
  }

  function getDefaultConfig() {
    const parts = ["A", "B", "C", "D"].map((id) => defaultPartConfig(id));

    // Part D mixed marks in default overrides
    parts[3].questions = [6, 6, 8, 8].map((marks, i) => ({
      ...createDefaultQuestionOverride("D", i),
      marks,
      solutionLines: marks,
    }));

    return {
      meta: {
        schoolName: "[SCHOOL NAME]",
        course: "Grade 11 Functions / MCR3U",
        testTitle: "[UNIT / TOPIC TEST TITLE]",
        timeAllowed: "75 minutes",
        teacher: "[TEACHER NAME]",
        calculatorPolicy: "ALLOWED",
        paperSize: "letter",
      },
      instructions: [...DEFAULT_INSTRUCTIONS],
      parts,
      bonus: {
        enabled: true,
        marks: "+___",
        stem: "Optional enrichment — [PLACEHOLDER: challenge proof, extension, or synthesis across units]",
        solutionLines: 3,
        teacherNote: "Bonus only if main sections attempted.",
        answerKey: "[PLACEHOLDER]",
      },
    };
  }

  // ===========================================================================
  // Utilities
  // ===========================================================================

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function escapeHtml(text) {
    if (text == null) return "";
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function showToast(message) {
    const el = document.getElementById("toast");
    el.textContent = message;
    el.classList.remove("is-hidden");
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => el.classList.add("is-hidden"), 2200);
  }

  function getPathValue(obj, path) {
    return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
  }

  function setPathValue(obj, path, value) {
    const keys = path.split(".");
    let cur = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (cur[keys[i]] == null) cur[keys[i]] = {};
      cur = cur[keys[i]];
    }
    cur[keys[keys.length - 1]] = value;
  }

  // ===========================================================================
  // Question generation
  // ===========================================================================

  function syncPartQuestionsArray(part) {
    const count = Math.max(0, parseInt(part.questionCount, 10) || 0);
    if (!Array.isArray(part.questions)) part.questions = [];

    while (part.questions.length < count) {
      part.questions.push(createDefaultQuestionOverride(part.id, part.questions.length));
    }
    if (part.questions.length > count) {
      part.questions.length = count;
    }
  }

  function defaultStemForType(type, number, partId) {
    if (type === "multiple-choice") return `[PLACEHOLDER: Multiple choice question ${number}]`;
    if (type === "short-answer") return `[PLACEHOLDER: Short answer — Q${number}]`;
    if (type === "communication") return `[PLACEHOLDER: Explain or justify — Q${number}]`;
    return `[PLACEHOLDER: Problem solving — Q${number}]`;
  }

  function defaultOptions() {
    return { A: "[OPTION A]", B: "[OPTION B]", C: "[OPTION C]", D: "[OPTION D]" };
  }

  function resolveQuestion(part, index, number) {
    const override = part.questions[index] || {};
    const type = override.type || part.questionType;
    const marks = override.marks != null && override.marks !== "" ? Number(override.marks) : part.defaultMarks;
    const solutionLines =
      override.solutionLines != null && override.solutionLines !== ""
        ? Number(override.solutionLines)
        : part.defaultSolutionLines;

    const q = {
      number,
      marks,
      type,
      stem: override.stem || defaultStemForType(type, number, part.id),
      solutionLines: type === "multiple-choice" || type === "short-answer" ? 0 : solutionLines,
      teacherNote: override.teacherNote || null,
      answerKey:
        override.answerKey ||
        (type === "multiple-choice" ? "[A/B/C/D]" : type === "short-answer" ? "[ANSWER]" : "[See answer key]"),
    };

    if (type === "multiple-choice") {
      q.options = { ...defaultOptions(), ...(override.options || {}) };
    }

    return q;
  }

  function buildEnabledParts(config) {
    return config.parts.filter((p) => p.enabled);
  }

  function assignQuestionNumbers(config) {
    let num = 1;
    const map = new Map();
    buildEnabledParts(config).forEach((part) => {
      syncPartQuestionsArray(part);
      const numbers = [];
      for (let i = 0; i < part.questionCount; i++) {
        numbers.push(num++);
      }
      map.set(part.id, numbers);
    });
    return map;
  }

  // ===========================================================================
  // Totals calculation
  // ===========================================================================

  function sumMarks(questions) {
    return questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
  }

  function formatMarksPerQ(questions, defaultMarks) {
    if (!questions.length) return "—";
    const marks = questions.map((q) => q.marks);
    const allSame = marks.every((m) => m === marks[0]);
    if (allSame) return String(marks[0] ?? defaultMarks);
    return marks.join(", ");
  }

  function buildMarksSummary(part, questions) {
    const n = questions.length;
    if (!n) return "0 questions";
    const total = sumMarks(questions);
    const marks = questions.map((q) => q.marks);
    const allSame = marks.every((m) => m === marks[0]);
    const unit = marks[0] === 1 ? "mark" : "marks";
    if (allSame) return `${n} question${n > 1 ? "s" : ""} × ${marks[0]} ${unit} = ${total} marks`;
    return `${n} questions: ${marks.join(" + ")} = ${total} marks`;
  }

  function buildInstructions(config) {
    const policy = config.meta.calculatorPolicy || "ALLOWED";
    return config.instructions.map((line, i) => {
      if (i === 1) return `Calculators: ${policy} — confirm policy before the test.`;
      return line;
    });
  }

  function buildMarkDistribution(config, builtParts) {
    const rows = builtParts.map(({ part, questions }) => ({
      part: part.id,
      section: part.title,
      questions: questions.length,
      marksPerQ: formatMarksPerQ(questions, part.defaultMarks),
      subtotal: sumMarks(questions),
    }));

    const totalMarks = rows.reduce((s, r) => s + r.subtotal, 0);
    rows.push({ part: "", section: "", questions: "", marksPerQ: "Total", subtotal: totalMarks, isTotal: true });

    if (config.bonus.enabled) {
      rows.push({
        part: "Bonus",
        section: "Optional",
        questions: 1,
        marksPerQ: "[BONUS]",
        subtotal: config.bonus.marks || "+___",
        isBonus: true,
      });
    }

    return { rows, totalMarks };
  }

  function buildExamFromConfig(config) {
    const numberMap = assignQuestionNumbers(config);
    const builtParts = [];
    const instructions = buildInstructions(config);

    buildEnabledParts(config).forEach((part) => {
      const numbers = numberMap.get(part.id) || [];
      const questions = numbers.map((num, i) => resolveQuestion(part, i, num));
      builtParts.push({
        part: {
          id: part.id,
          title: part.title,
          description: part.description,
          marksSummary: buildMarksSummary(part, questions),
          pageBreakBefore: !!part.pageBreakBefore,
        },
        questions,
      });
    });

    const { rows, totalMarks } = buildMarkDistribution(config, builtParts);

    return {
      meta: {
        ...config.meta,
        totalMarks,
      },
      instructions,
      markDistribution: rows,
      parts: builtParts.map((bp) => ({ ...bp.part, questions: bp.questions })),
      bonus: config.bonus.enabled
        ? {
            enabled: true,
            number: "B1",
            marks: config.bonus.marks || "+___",
            stem: config.bonus.stem,
            solutionLines: config.bonus.solutionLines || 3,
            teacherNote: config.bonus.teacherNote,
            answerKey: config.bonus.answerKey,
          }
        : { enabled: false },
    };
  }

  // ===========================================================================
  // State management
  // ===========================================================================

  let state = deepClone(getDefaultConfig());
  let paperStyleEl = null;
  let skipEditorRender = false;

  const examRoot = document.getElementById("exam-root");
  const editorRoot = document.getElementById("editor-root");

  function getBuiltExam() {
    return buildExamFromConfig(state);
  }

  function refreshAll(options = {}) {
    const { rerenderEditor = true } = options;
    buildEnabledParts(state).forEach(syncPartQuestionsArray);
    const examData = getBuiltExam();

    renderExamPreview(examData);

    if (rerenderEditor && !skipEditorRender) {
      renderEditor(state, examData);
    }

    syncToolbar(state.meta);
    saveToStorage(state);
    return examData;
  }

  function updateFromField(path, rawValue, inputType) {
    let value = rawValue;
    if (inputType === "number") {
      value = rawValue === "" ? "" : Number(rawValue);
    } else if (inputType === "checkbox") {
      value = !!rawValue;
    }

    setPathValue(state, path, value);

    const structural =
      path.includes("questionCount") ||
      path.includes(".enabled") ||
      path.endsWith("bonus.enabled") ||
      path.endsWith(".type");

    if (path.includes("questionCount")) {
      const match = path.match(/^parts\.(\d+)\.questionCount$/);
      if (match) syncPartQuestionsArray(state.parts[Number(match[1])]);
    }

    if (path === "meta.paperSize") {
      applyPaperSize(value);
    }

    refreshAll({ rerenderEditor: structural });
  }

  // ===========================================================================
  // Preview render
  // ===========================================================================

  function renderTitleBlock(meta) {
    return `
      <section class="exam-title-block">
        <table class="exam-title-block__table">
          <tbody>
            <tr><th>School Name</th><td>${escapeHtml(meta.schoolName)}</td></tr>
            <tr><th>Course</th><td>${escapeHtml(meta.course)}</td></tr>
            <tr><th>Test Title</th><td>${escapeHtml(meta.testTitle)}</td></tr>
            <tr><th>Student Name</th><td><span class="field-line">&nbsp;</span></td></tr>
            <tr><th>Date</th><td><span class="field-line">&nbsp;</span></td></tr>
            <tr><th>Time Allowed</th><td>${escapeHtml(meta.timeAllowed)}</td></tr>
            <tr><th>Total Marks</th><td><strong>${escapeHtml(meta.totalMarks)}</strong></td></tr>
            <tr><th>Teacher</th><td>${escapeHtml(meta.teacher)}</td></tr>
          </tbody>
        </table>
      </section>`;
  }

  function renderInstructions(instructions) {
    const items = instructions.map((t) => `<li>${escapeHtml(t)}</li>`).join("");
    return `
      <section class="exam-section">
        <h2 class="exam-section__heading">Instructions</h2>
        <ol class="exam-section__instructions">${items}</ol>
      </section>`;
  }

  function renderMarkDistribution(rows) {
    const body = rows
      .map((row) => {
        const part = row.isTotal
          ? ""
          : row.isBonus
            ? `<em>${escapeHtml(row.part)}</em>`
            : `<strong>${escapeHtml(row.part)}</strong>`;
        const section = row.isBonus ? `<em>${escapeHtml(row.section)}</em>` : escapeHtml(row.section);
        const subtotal =
          row.isTotal || !row.isBonus ? `<strong>${escapeHtml(row.subtotal)}</strong>` : escapeHtml(row.subtotal);
        const rowClass = row.isTotal ? ' class="mark-table__total"' : row.isBonus ? ' class="mark-table__bonus"' : "";
        return `<tr${rowClass}><td>${part}</td><td>${section}</td><td class="col-num">${escapeHtml(row.questions)}</td><td class="col-num">${escapeHtml(row.marksPerQ)}</td><td class="col-num">${subtotal}</td></tr>`;
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
  }

  function renderSolutionSpace(number, lines) {
    const n = Math.max(1, lines || 4);
    const lineEls = Array.from({ length: n }, () => `<div class="solution-space__line"></div>`).join("");
    return `
      <div class="solution-space" style="--solution-lines: ${n}">
        <div class="solution-space__label">Solution space — Question ${number}</div>
        <div class="solution-space__lines">${lineEls}</div>
      </div>`;
  }

  function renderQuestion(q) {
    const marksLabel = `[${q.marks}]`;
    let body = "";

    switch (q.type) {
      case "multiple-choice": {
        const opts = ["A", "B", "C", "D"]
          .map((key) => `<li><span class="option-label">${key})</span>${escapeHtml(q.options?.[key] || "")}</li>`)
          .join("");
        body = `
          <ul class="options-list">${opts}</ul>
          <p class="answer-line">
            <span class="answer-line__label">Answer:</span>
            <span class="answer-line__blank">&nbsp;</span>
          </p>`;
        break;
      }
      case "short-answer":
        body = `
          <p class="answer-line">
            <span class="answer-line__label">Answer:</span>
            <span class="answer-line__blank">&nbsp;</span>
          </p>
          <p class="explanation-line">
            <span class="explanation-line__label">Brief explanation (if needed):</span>
            <span class="explanation-line__blank">&nbsp;</span>
          </p>`;
        break;
      case "communication":
      case "problem-solving":
        body = renderSolutionSpace(q.number, q.solutionLines || 4);
        break;
      default:
        body = `<p><em>Unknown question type: ${escapeHtml(q.type)}</em></p>`;
    }

    const teacherNote = q.teacherNote
      ? `<div class="teacher-note"><span class="teacher-note__label">教师备注:</span>${escapeHtml(q.teacherNote)}</div>`
      : "";

    const answerKey = q.answerKey
      ? `<div class="question-block__answer-key"><strong>Answer key:</strong> ${escapeHtml(q.answerKey)}</div>`
      : "";

    return `
      <article class="question-block" data-question="${q.number}" data-type="${q.type}">
        <div class="question-block__header">
          <span class="question-block__number">${q.number}.</span>
          <span class="question-block__stem">${escapeHtml(q.stem)}</span>
          <span class="question-block__marks">${marksLabel}</span>
        </div>
        ${body}
        ${teacherNote}
        ${answerKey}
      </article>`;
  }

  function renderPart(part) {
    const pageBreakClass = part.pageBreakBefore ? " exam-section--page-break" : "";
    const questions = part.questions.map(renderQuestion).join("");
    return `
      <section class="exam-section${pageBreakClass}" data-part="${part.id}">
        <h2 class="exam-section__heading">Part ${part.id} — ${escapeHtml(part.title)}</h2>
        <p class="exam-section__summary">${escapeHtml(part.marksSummary)}</p>
        <p class="exam-section__description">${escapeHtml(part.description)}</p>
        ${questions}
      </section>`;
  }

  function renderBonus(bonus) {
    if (!bonus?.enabled) return "";
    const q = {
      number: bonus.number,
      marks: bonus.marks,
      type: "problem-solving",
      stem: bonus.stem,
      solutionLines: bonus.solutionLines || 3,
      teacherNote: bonus.teacherNote,
      answerKey: bonus.answerKey,
    };
    return `
      <section class="exam-section" data-part="bonus">
        <h2 class="exam-section__heading">Bonus Question (Optional)</h2>
        ${renderQuestion(q)}
      </section>`;
  }

  function renderPrintChrome(meta) {
    return `
      <div class="print-header" aria-hidden="true">
        ${escapeHtml(meta.course)} &nbsp;|&nbsp; ${escapeHtml(meta.testTitle)}
      </div>
      <div class="print-footer" aria-hidden="true">
        ${escapeHtml(meta.schoolName)} — ${escapeHtml(meta.testTitle)}
      </div>`;
  }

  function renderExamPreview(data) {
    examRoot.innerHTML = [
      renderPrintChrome(data.meta),
      renderTitleBlock(data.meta),
      renderInstructions(data.instructions),
      renderMarkDistribution(data.markDistribution),
      ...data.parts.map(renderPart),
      renderBonus(data.bonus),
      `<p class="exam-end">— End of Examination — Good luck! / Bonne chance! —</p>`,
    ].join("\n");
  }

  // ===========================================================================
  // Editor render
  // ===========================================================================

  function fieldText(label, path, value, attrs = "") {
    return `
      <div class="editor-field">
        <label for="f-${path.replace(/\./g, "-")}">${label}</label>
        <input type="text" id="f-${path.replace(/\./g, "-")}" data-path="${path}" value="${escapeHtml(value ?? "")}" ${attrs}>
      </div>`;
  }

  function fieldNumber(label, path, value, min, max) {
    const minAttr = min != null ? `min="${min}"` : "";
    const maxAttr = max != null ? `max="${max}"` : "";
    return `
      <div class="editor-field">
        <label for="f-${path.replace(/\./g, "-")}">${label}</label>
        <input type="number" id="f-${path.replace(/\./g, "-")}" data-path="${path}" value="${value ?? ""}" ${minAttr} ${maxAttr}>
      </div>`;
  }

  function fieldTextarea(label, path, value, rows = 2) {
    return `
      <div class="editor-field editor-field--full">
        <label for="f-${path.replace(/\./g, "-")}">${label}</label>
        <textarea id="f-${path.replace(/\./g, "-")}" data-path="${path}" rows="${rows}">${escapeHtml(value ?? "")}</textarea>
      </div>`;
  }

  function fieldSelect(label, path, value, options) {
    const opts = options
      .map((o) => `<option value="${escapeHtml(o.value)}"${o.value === value ? " selected" : ""}>${escapeHtml(o.label)}</option>`)
      .join("");
    return `
      <div class="editor-field">
        <label for="f-${path.replace(/\./g, "-")}">${label}</label>
        <select id="f-${path.replace(/\./g, "-")}" data-path="${path}">${opts}</select>
      </div>`;
  }

  function renderQuestionEditor(partIndex, qIndex, qNum, override, part) {
    const base = `parts.${partIndex}.questions.${qIndex}`;
    const type = override.type || part.questionType;
    const marks = override.marks != null && override.marks !== "" ? override.marks : part.defaultMarks;
    const solutionLines =
      override.solutionLines != null && override.solutionLines !== ""
        ? override.solutionLines
        : part.defaultSolutionLines;
    const options = override.options || defaultOptions();

    const optionsHtml =
      type === "multiple-choice"
        ? `
        <div class="editor-options">
          ${["A", "B", "C", "D"]
            .map(
              (key) => fieldText(`Option ${key}`, `${base}.options.${key}`, options[key] || `[OPTION ${key}]`)
            )
            .join("")}
        </div>`
        : "";

    const solutionField =
      type === "multiple-choice" || type === "short-answer"
        ? ""
        : fieldNumber("Solution lines", `${base}.solutionLines`, solutionLines, 1, 30);

    return `
      <div class="editor-question">
        <div class="editor-question__head">Question ${qNum}</div>
        <div class="editor-question__grid">
          ${fieldNumber("Marks", `${base}.marks`, marks, 0, 100)}
          ${fieldSelect("Type", `${base}.type`, type, [
            { value: "multiple-choice", label: "Multiple Choice" },
            { value: "short-answer", label: "Short Answer" },
            { value: "communication", label: "Communication" },
            { value: "problem-solving", label: "Problem Solving" },
          ])}
          ${fieldTextarea("Stem (placeholder)", `${base}.stem`, override.stem || "", 2)}
          ${solutionField}
          ${fieldText("Answer key (placeholder)", `${base}.answerKey`, override.answerKey || "")}
          ${fieldTextarea("Teacher note", `${base}.teacherNote`, override.teacherNote || "", 2)}
        </div>
        ${optionsHtml}
      </div>`;
  }

  function renderPartEditor(partIndex, part, numberMap, examData) {
    const numbers = numberMap.get(part.id) || [];
    const startQ = numbers[0] ?? "—";
    const endQ = numbers[numbers.length - 1] ?? "—";
    const rangeLabel =
      numbers.length > 0 ? (numbers.length === 1 ? `Q${startQ}` : `Q${startQ}–Q${endQ}`) : "disabled";

    const built = examData.parts.find((p) => p.id === part.id);
    const subtotal = built ? sumMarks(built.questions) : 0;

    const questionsHtml =
      part.enabled && part.questionCount > 0
        ? Array.from({ length: part.questionCount }, (_, qi) =>
            renderQuestionEditor(partIndex, qi, numbers[qi] ?? "?", part.questions[qi] || {}, part)
          ).join("")
        : `<p class="editor-section__subtitle">No questions (part disabled or count is 0).</p>`;

    return `
      <div class="editor-part${part.enabled ? "" : " is-disabled"}" data-part-index="${partIndex}">
        <div class="editor-part__header">
          <h3 class="editor-part__title">Part ${part.id}</h3>
          <div class="editor-field editor-field--inline">
            <input type="checkbox" id="f-parts-${partIndex}-enabled" data-path="parts.${partIndex}.enabled" data-input-type="checkbox" ${part.enabled ? "checked" : ""}>
            <label for="f-parts-${partIndex}-enabled">Enabled</label>
          </div>
        </div>
        <p class="editor-part__meta">Question range: <strong>${rangeLabel}</strong> &nbsp;|&nbsp; Subtotal: <strong>${subtotal}</strong> marks</p>
        ${fieldText("Title", `parts.${partIndex}.title`, part.title)}
        ${fieldTextarea("Description", `parts.${partIndex}.description`, part.description, 3)}
        <div class="editor-question__grid">
          ${fieldNumber("# Questions", `parts.${partIndex}.questionCount`, part.questionCount, 0, 50)}
          ${fieldNumber("Default marks", `parts.${partIndex}.defaultMarks`, part.defaultMarks, 0, 100)}
          ${fieldNumber("Default solution lines", `parts.${partIndex}.defaultSolutionLines`, part.defaultSolutionLines, 0, 30)}
          <div class="editor-field editor-field--inline">
            <input type="checkbox" id="f-parts-${partIndex}-pagebreak" data-path="parts.${partIndex}.pageBreakBefore" data-input-type="checkbox" ${part.pageBreakBefore ? "checked" : ""}>
            <label for="f-parts-${partIndex}-pagebreak">Page break before</label>
          </div>
        </div>
        ${questionsHtml}
      </div>`;
  }

  function renderEditor(config, examData) {
    const numberMap = assignQuestionNumbers(config);
    const m = config.meta;

    const partsHtml = config.parts
      .map((part, i) => renderPartEditor(i, part, numberMap, examData))
      .join("");

    editorRoot.innerHTML = `
      <section class="editor-section">
        <h2 class="editor-section__title">Exam Meta</h2>
        ${fieldText("School Name", "meta.schoolName", m.schoolName)}
        ${fieldText("Course", "meta.course", m.course)}
        ${fieldText("Test Title", "meta.testTitle", m.testTitle)}
        ${fieldText("Time Allowed", "meta.timeAllowed", m.timeAllowed)}
        <div class="editor-field">
          <label>Total Marks (auto)</label>
          <input type="text" readonly value="${examData.meta.totalMarks}">
        </div>
        ${fieldText("Teacher", "meta.teacher", m.teacher)}
        ${fieldSelect("Calculator Policy", "meta.calculatorPolicy", m.calculatorPolicy, [
          { value: "ALLOWED", label: "ALLOWED" },
          { value: "NOT ALLOWED", label: "NOT ALLOWED" },
        ])}
        ${fieldSelect("Paper Size", "meta.paperSize", m.paperSize, [
          { value: "letter", label: "Letter" },
          { value: "a4", label: "A4" },
        ])}
      </section>

      <section class="editor-section">
        <h2 class="editor-section__title">Part Structure</h2>
        <p class="editor-section__subtitle">Adjust question counts and defaults. Question numbers update automatically across enabled parts.</p>
        ${partsHtml}
      </section>

      <section class="editor-section">
        <h2 class="editor-section__title">Bonus Question (Optional)</h2>
        <div class="editor-field editor-field--inline">
          <input type="checkbox" id="f-bonus-enabled" data-path="bonus.enabled" data-input-type="checkbox" ${config.bonus.enabled ? "checked" : ""}>
          <label for="f-bonus-enabled">Enabled</label>
        </div>
        ${fieldText("Marks label", "bonus.marks", config.bonus.marks)}
        ${fieldTextarea("Stem (placeholder)", "bonus.stem", config.bonus.stem, 2)}
        ${fieldNumber("Solution lines", "bonus.solutionLines", config.bonus.solutionLines, 1, 30)}
        ${fieldText("Answer key (placeholder)", "bonus.answerKey", config.bonus.answerKey)}
        ${fieldTextarea("Teacher note", "bonus.teacherNote", config.bonus.teacherNote, 2)}
      </section>`;
  }

  // ===========================================================================
  // localStorage
  // ===========================================================================

  function saveToStorage(config) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (err) {
      console.warn("Could not save to localStorage:", err);
    }
  }

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return normalizeImportedConfig(parsed);
    } catch (err) {
      console.warn("Could not load from localStorage:", err);
      return null;
    }
  }

  // ===========================================================================
  // Import / export
  // ===========================================================================

  function normalizeImportedConfig(data) {
    const defaults = getDefaultConfig();
    if (!data || typeof data !== "object") return defaults;

    const merged = deepClone(defaults);

    if (data.meta) Object.assign(merged.meta, data.meta);
    if (Array.isArray(data.instructions)) merged.instructions = data.instructions;

    if (Array.isArray(data.parts)) {
      data.parts.forEach((imported, i) => {
        if (!merged.parts[i]) return;
        Object.assign(merged.parts[i], imported);
        if (Array.isArray(imported.questions)) {
          merged.parts[i].questions = imported.questions;
        }
        syncPartQuestionsArray(merged.parts[i]);
      });
    }

    if (data.bonus) Object.assign(merged.bonus, data.bonus);

    return merged;
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const slug = (state.meta.testTitle || "exam").replace(/[^\w\-]+/g, "-").slice(0, 40);
    a.href = url;
    a.download = `${slug || "exam-data"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Exported exam-data.json");
  }

  function importJsonFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        state = normalizeImportedConfig(data);
        applyPaperSize(state.meta.paperSize || "letter");
        refreshAll({ rerenderEditor: true });
        showToast("Imported JSON successfully");
      } catch (err) {
        showToast("Import failed: invalid JSON");
        console.error(err);
      }
    };
    reader.readAsText(file);
  }

  function resetToDefault() {
    if (!confirm("Reset all editor fields to default? This cannot be undone (unless you exported a backup).")) return;
    state = deepClone(getDefaultConfig());
    applyPaperSize(state.meta.paperSize);
    refreshAll({ rerenderEditor: true });
    showToast("Reset to default");
  }

  // ===========================================================================
  // Controls
  // ===========================================================================

  function applyPaperSize(size) {
    document.documentElement.dataset.paper = size;
    if (!paperStyleEl) {
      paperStyleEl = document.createElement("style");
      paperStyleEl.id = "paper-size-style";
      document.head.appendChild(paperStyleEl);
    }
    const pageSize = size === "a4" ? "A4" : "letter";
    const margin = size === "a4" ? "1.8cm 1.5cm" : "0.7in 0.65in";
    paperStyleEl.textContent = `@media print { @page { size: ${pageSize}; margin: ${margin}; } }`;
  }

  function syncToolbar(meta) {
    const paperSelect = document.getElementById("paper-size");
    if (paperSelect && paperSelect.value !== meta.paperSize) {
      paperSelect.value = meta.paperSize || "letter";
    }
    applyPaperSize(meta.paperSize || "letter");
  }

  function initEditorEvents() {
    editorRoot.addEventListener("input", onEditorInput);
    editorRoot.addEventListener("change", onEditorInput);
  }

  function onEditorInput(event) {
    const el = event.target;
    const path = el.dataset.path;
    if (!path) return;

    const inputType = el.dataset.inputType || el.type;
    let value;

    if (inputType === "checkbox") {
      value = el.checked;
    } else {
      value = el.value;
    }

    const needsEditorRerender =
      path.includes("questionCount") ||
      path.endsWith(".enabled") ||
      path.endsWith("bonus.enabled") ||
      path.endsWith(".type");
    skipEditorRender = !needsEditorRerender && inputType !== "checkbox";
    updateFromField(path, value, inputType);
    skipEditorRender = false;
  }

  function initControls() {
    const btnPrint = document.getElementById("btn-print");
    const btnAnswerKey = document.getElementById("btn-answer-key");
    const btnTeacherNotes = document.getElementById("btn-teacher-notes");
    const btnSave = document.getElementById("btn-save");
    const btnReset = document.getElementById("btn-reset");
    const btnExport = document.getElementById("btn-export");
    const btnImport = document.getElementById("btn-import");
    const importFile = document.getElementById("import-file");
    const banner = document.getElementById("answer-key-banner");
    const paperSelect = document.getElementById("paper-size");

    paperSelect.addEventListener("change", () => {
      updateFromField("meta.paperSize", paperSelect.value, "text");
    });

    btnPrint.addEventListener("click", () => window.print());

    btnAnswerKey.addEventListener("click", () => {
      const on = document.body.classList.toggle("show-answer-key");
      btnAnswerKey.setAttribute("aria-pressed", String(on));
      banner.classList.toggle("is-hidden", !on);
    });

    btnTeacherNotes.addEventListener("click", () => {
      const on = document.body.classList.toggle("show-teacher-notes");
      btnTeacherNotes.setAttribute("aria-pressed", String(on));
    });

    btnSave.addEventListener("click", () => {
      saveToStorage(state);
      showToast("Saved to browser storage");
    });

    btnReset.addEventListener("click", resetToDefault);
    btnExport.addEventListener("click", exportJson);

    btnImport.addEventListener("click", () => importFile.click());
    importFile.addEventListener("change", () => {
      const file = importFile.files?.[0];
      if (file) importJsonFile(file);
      importFile.value = "";
    });
  }

  // ===========================================================================
  // Boot
  // ===========================================================================

  function boot() {
    const saved = loadFromStorage();
    if (saved) state = saved;

    initEditorEvents();
    initControls();
    applyPaperSize(state.meta.paperSize || "letter");
    refreshAll({ rerenderEditor: true });

    window.ExamPreview = {
      getConfig: () => deepClone(state),
      getExam: getBuiltExam,
      refresh: refreshAll,
      reset: resetToDefault,
      exportJson,
      setPaperSize: applyPaperSize,
    };
  }

  boot();
})();
