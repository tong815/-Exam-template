/**
 * Generic exam data schema — no grade/subject-specific content.
 */
(function (ET) {
  "use strict";

  ET.SCHEMA_VERSION = "1.0";

  ET.QUESTION_TYPES = [
    { value: "multiple-choice", label: "Multiple Choice" },
    { value: "short-answer", label: "Short Answer" },
    { value: "long-answer", label: "Long Answer" },
    { value: "communication", label: "Communication" },
    { value: "problem-solving", label: "Problem Solving" },
    { value: "matching", label: "Matching" },
    { value: "true-false", label: "True / False" },
    { value: "custom", label: "Custom" },
  ];

  ET.usesAnswerLines = function (type) {
    return ["long-answer", "communication", "problem-solving", "custom", "matching"].includes(type);
  };

  ET.defaultAnswerSpaceForType = function (type) {
    if (type === "multiple-choice" || type === "true-false") return { type: "blank", lines: 0 };
    if (type === "short-answer") return { type: "blank", lines: 0 };
    if (type === "matching") return { type: "lines", lines: 4 };
    return { type: "lines", lines: 4 };
  };

  ET.createQuestion = function (overrides = {}) {
    const type = overrides.type || "short-answer";
    return {
      id: overrides.id || ET.uid("q"),
      number: overrides.number ?? null,
      type,
      stem: overrides.stem ?? "",
      marks: overrides.marks ?? 1,
      options: overrides.options ?? (type === "multiple-choice" ? ET.defaultMcOptions() : []),
      answerSpace: overrides.answerSpace ?? ET.defaultAnswerSpaceForType(type),
      answerKey: overrides.answerKey ?? "",
      teacherNote: overrides.teacherNote ?? "",
      tags: overrides.tags ?? [],
    };
  };

  ET.createPart = function (overrides = {}) {
    const questionType = overrides.defaultQuestionType || overrides.questionType || "short-answer";
    return {
      id: overrides.id || ET.uid("part"),
      label: overrides.label ?? overrides.id ?? "1",
      enabled: overrides.enabled !== false,
      title: overrides.title ?? "Section",
      description: overrides.description ?? "",
      defaultQuestionType: questionType,
      defaultMarks: overrides.defaultMarks ?? 1,
      defaultAnswerSpace: overrides.defaultAnswerSpace ?? ET.defaultAnswerSpaceForType(questionType),
      pageBreakBefore: !!overrides.pageBreakBefore,
      questions: Array.isArray(overrides.questions) ? overrides.questions.map((q) => ET.createQuestion(q)) : [],
    };
  };

  ET.createBlankExam = function (overrides = {}) {
    return {
      schemaVersion: ET.SCHEMA_VERSION,
      examId: overrides.examId || "new-exam",
      profile: {
        grade: "",
        subject: "",
        courseCode: "",
        courseName: "",
        region: "",
        language: "en",
        ...(overrides.profile || {}),
      },
      meta: {
        schoolName: "",
        testTitle: "",
        studentNameLabel: "Student Name",
        dateLabel: "Date",
        timeAllowed: "",
        teacher: "",
        calculatorPolicy: "ALLOWED",
        paperSize: "letter",
        ...(overrides.meta || {}),
      },
      instructions: overrides.instructions || [
        "Show all work for full marks unless otherwise stated.",
        "Calculators: ALLOWED / NOT ALLOWED — confirm policy before the test.",
        "Write legibly and use proper notation.",
      ],
      parts: overrides.parts || [
        ET.createPart({
          id: "section-1",
          label: "1",
          title: "Section 1",
          description: "Answer all questions in this section.",
          defaultQuestionType: "short-answer",
          defaultMarks: 2,
          questions: [ET.createQuestion({ stem: "[PLACEHOLDER: Question 1]" })],
        }),
      ],
      bonus: {
        enabled: false,
        id: "bonus-1",
        label: "B1",
        marks: "+___",
        stem: "",
        answerSpace: { type: "lines", lines: 3 },
        answerKey: "",
        teacherNote: "",
        ...(overrides.bonus || {}),
      },
      rubric: overrides.rubric || {},
      settings: {
        showMarkDistribution: true,
        showInstructions: true,
        showBonus: false,
        autoNumberQuestions: true,
        ...(overrides.settings || {}),
      },
    };
  };

  ET.uid = function (prefix) {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
  };

  ET.defaultMcOptions = function () {
    return [
      { key: "A", text: "[OPTION A]" },
      { key: "B", text: "[OPTION B]" },
      { key: "C", text: "[OPTION C]" },
      { key: "D", text: "[OPTION D]" },
    ];
  };

  ET.normalizeOptions = function (options) {
    if (!options) return [];
    if (Array.isArray(options)) {
      return options.map((o, i) =>
        typeof o === "string"
          ? { key: String.fromCharCode(65 + i), text: o }
          : { key: o.key || String.fromCharCode(65 + i), text: o.text ?? "" }
      );
    }
    if (typeof options === "object") {
      return Object.entries(options).map(([key, text]) => ({ key, text: String(text) }));
    }
    return [];
  };

  ET.normalizeAnswerSpace = function (space, type, legacyLines) {
    if (space && typeof space === "object") {
      return {
        type: space.type || "lines",
        lines: Number(space.lines) || 0,
      };
    }
    if (legacyLines != null && legacyLines !== "") {
      return { type: "lines", lines: Number(legacyLines) || 0 };
    }
    return ET.defaultAnswerSpaceForType(type);
  };

  /** Migrate legacy editor config or partial JSON into current schema. */
  ET.normalizeExamData = function (raw, fallback) {
    const base = ET.deepClone(fallback || ET.createBlankExam());
    if (!raw || typeof raw !== "object") return base;

    const data = ET.deepClone(base);

    data.schemaVersion = raw.schemaVersion || ET.SCHEMA_VERSION;
    data.examId = raw.examId || data.examId;
    if (raw.profile) Object.assign(data.profile, raw.profile);
    if (raw.meta) Object.assign(data.meta, ET.migrateMeta(raw.meta));
    if (Array.isArray(raw.instructions)) data.instructions = raw.instructions;
    if (raw.rubric) data.rubric = raw.rubric;
    if (raw.settings) Object.assign(data.settings, raw.settings);

    if (Array.isArray(raw.parts)) {
      data.parts = raw.parts.map((p, i) => ET.normalizePart(p, i, data.parts[i]));
    }

    if (raw.bonus) {
      data.bonus = ET.normalizeBonus(raw.bonus, data.bonus);
      data.settings.showBonus = raw.bonus.enabled ?? data.settings.showBonus;
    }

    return data;
  };

  ET.migrateMeta = function (meta) {
    const m = { ...meta };
    if (meta.course && !m.testTitle) {
      /* legacy combined course field — keep in profile via separate migration */
    }
    delete m.course;
    delete m.totalMarks;
    return m;
  };

  ET.normalizePart = function (raw, index, fallbackPart) {
    const fb = fallbackPart || ET.createPart();
    const questionType = raw.defaultQuestionType || raw.questionType || fb.defaultQuestionType;

    const part = {
      id: raw.id || fb.id || `part-${index}`,
      label: raw.label ?? raw.id ?? fb.label,
      enabled: raw.enabled !== false,
      title: raw.title ?? fb.title,
      description: raw.description ?? fb.description,
      defaultQuestionType: questionType,
      defaultMarks: raw.defaultMarks ?? fb.defaultMarks,
      defaultAnswerSpace: ET.normalizeAnswerSpace(
        raw.defaultAnswerSpace,
        questionType,
        raw.defaultSolutionLines
      ),
      pageBreakBefore: raw.pageBreakBefore ?? fb.pageBreakBefore,
      questions: [],
    };

    const count = raw.questionCount != null ? Math.max(0, Number(raw.questionCount) || 0) : null;
    let sourceQuestions = Array.isArray(raw.questions) ? raw.questions : [];

    if (count != null && sourceQuestions.length === 0 && count > 0) {
      sourceQuestions = Array.from({ length: count }, (_, qi) => ({
        type: questionType,
        marks: part.defaultMarks,
        stem: `[PLACEHOLDER: Question ${qi + 1}]`,
      }));
    }

    if (count != null && sourceQuestions.length !== count) {
      while (sourceQuestions.length < count) {
        sourceQuestions.push({
          type: questionType,
          marks: part.defaultMarks,
          stem: `[PLACEHOLDER: Question ${sourceQuestions.length + 1}]`,
        });
      }
      if (sourceQuestions.length > count) sourceQuestions = sourceQuestions.slice(0, count);
    }

    part.questions = sourceQuestions.map((q, qi) => ET.normalizeQuestion(q, part, qi));

    return part;
  };

  ET.normalizeQuestion = function (raw, part, index) {
    const type = raw.type || part.defaultQuestionType;
    return ET.createQuestion({
      id: raw.id || ET.uid("q"),
      number: raw.number ?? null,
      type,
      stem: raw.stem ?? `[PLACEHOLDER: Question ${index + 1}]`,
      marks: raw.marks != null && raw.marks !== "" ? Number(raw.marks) : part.defaultMarks,
      options: ET.normalizeOptions(raw.options),
      answerSpace: ET.normalizeAnswerSpace(raw.answerSpace, type, raw.solutionLines),
      answerKey: raw.answerKey ?? "",
      teacherNote: raw.teacherNote ?? "",
      tags: raw.tags ?? [],
    });
  };

  ET.normalizeBonus = function (raw, fallback) {
    const fb = fallback || {};
    return {
      enabled: !!raw.enabled,
      id: raw.id || fb.id || "bonus-1",
      label: raw.label || raw.number || fb.label || "B1",
      marks: raw.marks ?? fb.marks ?? "+___",
      stem: raw.stem ?? fb.stem ?? "",
      answerSpace: ET.normalizeAnswerSpace(raw.answerSpace, "problem-solving", raw.solutionLines),
      answerKey: raw.answerKey ?? fb.answerKey ?? "",
      teacherNote: raw.teacherNote ?? fb.teacherNote ?? "",
    };
  };

  ET.formatCourseLine = function (profile) {
    const bits = [profile.grade, profile.courseName, profile.courseCode].filter(Boolean);
    return bits.join(" / ").replace(" /  / ", " / ") || profile.subject || "Examination";
  };

  ET.getEnabledParts = function (exam) {
    return (exam.parts || []).filter((p) => p.enabled);
  };

  ET.syncPartQuestionCount = function (part, targetCount) {
    const count = Math.max(0, Number(targetCount) || 0);
    while (part.questions.length < count) {
      part.questions.push(
        ET.createQuestion({
          type: part.defaultQuestionType,
          marks: part.defaultMarks,
          answerSpace: ET.deepClone(part.defaultAnswerSpace),
          stem: `[PLACEHOLDER: Question ${part.questions.length + 1}]`,
        })
      );
    }
    if (part.questions.length > count) part.questions.length = count;
  };

  ET.assignQuestionNumbers = function (exam) {
    let num = 1;
    const map = new Map();
    if (!exam.settings.autoNumberQuestions) {
      ET.getEnabledParts(exam).forEach((part) => {
        map.set(
          part.id,
          part.questions.map((q) => q.number ?? num++)
        );
      });
      return map;
    }
    ET.getEnabledParts(exam).forEach((part) => {
      const numbers = part.questions.map(() => num++);
      part.questions.forEach((q, i) => {
        q.number = numbers[i];
      });
      map.set(part.id, numbers);
    });
    return map;
  };

  ET.sumMarks = function (questions) {
    return questions.reduce((s, q) => s + (Number(q.marks) || 0), 0);
  };

  ET.formatMarksPerQ = function (questions, defaultMarks) {
    if (!questions.length) return "—";
    const marks = questions.map((q) => q.marks);
    if (marks.every((m) => m === marks[0])) return String(marks[0] ?? defaultMarks);
    return marks.join(", ");
  };

  ET.buildMarksSummary = function (part, questions) {
    const n = questions.length;
    if (!n) return "0 questions";
    const total = ET.sumMarks(questions);
    const marks = questions.map((q) => q.marks);
    const allSame = marks.every((m) => m === marks[0]);
    const unit = marks[0] === 1 ? "mark" : "marks";
    if (allSame) return `${n} question${n > 1 ? "s" : ""} × ${marks[0]} ${unit} = ${total} marks`;
    return `${n} questions: ${marks.join(" + ")} = ${total} marks`;
  };

  ET.buildInstructions = function (exam) {
    const policy = exam.meta.calculatorPolicy || "ALLOWED";
    return (exam.instructions || []).map((line, i) => {
      if (i === 1 && /calculator/i.test(line)) {
        return `Calculators: ${policy} — confirm policy before the test.`;
      }
      return line;
    });
  };

  ET.buildExamView = function (exam) {
    const numberMap = ET.assignQuestionNumbers(exam);
    const builtParts = [];

    ET.getEnabledParts(exam).forEach((part) => {
      const numbers = numberMap.get(part.id) || [];
      const questions = part.questions.map((q, i) => ({
        ...q,
        number: numbers[i] ?? q.number,
        options: ET.normalizeOptions(q.options),
        answerSpace: ET.normalizeAnswerSpace(q.answerSpace, q.type),
      }));

      builtParts.push({
        part: {
          id: part.id,
          label: part.label,
          title: part.title,
          description: part.description,
          marksSummary: ET.buildMarksSummary(part, questions),
          pageBreakBefore: !!part.pageBreakBefore,
        },
        questions,
      });
    });

    const rows = builtParts.map(({ part, questions }) => ({
      part: part.label,
      section: part.title,
      questions: questions.length,
      marksPerQ: ET.formatMarksPerQ(questions, 1),
      subtotal: ET.sumMarks(questions),
    }));

    const totalMarks = rows.reduce((s, r) => s + r.subtotal, 0);
    const markDistribution = [...rows];

    if (exam.settings.showMarkDistribution !== false) {
      markDistribution.push({
        part: "",
        section: "",
        questions: "",
        marksPerQ: "Total",
        subtotal: totalMarks,
        isTotal: true,
      });
    }

    if (exam.bonus?.enabled && exam.settings.showBonus !== false) {
      markDistribution.push({
        part: "Bonus",
        section: "Optional",
        questions: 1,
        marksPerQ: "[BONUS]",
        subtotal: exam.bonus.marks || "+___",
        isBonus: true,
      });
    }

    return {
      examId: exam.examId,
      profile: exam.profile,
      meta: {
        ...exam.meta,
        courseLine: ET.formatCourseLine(exam.profile),
        totalMarks,
      },
      instructions: ET.buildInstructions(exam),
      markDistribution,
      parts: builtParts.map((bp) => ({ ...bp.part, questions: bp.questions })),
      bonus:
        exam.bonus?.enabled && exam.settings.showBonus !== false
          ? {
              enabled: true,
              number: exam.bonus.label || "B1",
              marks: exam.bonus.marks,
              type: "problem-solving",
              stem: exam.bonus.stem,
              answerSpace: exam.bonus.answerSpace,
              teacherNote: exam.bonus.teacherNote,
              answerKey: exam.bonus.answerKey,
            }
          : { enabled: false },
      settings: exam.settings,
      rubric: exam.rubric,
    };
  };

  ET.deepClone = function (obj) {
    return JSON.parse(JSON.stringify(obj));
  };

  ET.escapeHtml = function (text) {
    if (text == null) return "";
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  };

  ET.setPathValue = function (obj, path, value) {
    const keys = path.split(".");
    let cur = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (cur[keys[i]] == null) cur[keys[i]] = {};
      cur = cur[keys[i]];
    }
    cur[keys[keys.length - 1]] = value;
  };
})( (window.ExamToolkit = window.ExamToolkit || {}) );
