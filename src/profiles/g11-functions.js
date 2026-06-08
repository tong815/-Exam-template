/**
 * G11 Functions (MCR3U) — starter template provider.
 * Built-in fallback for file:// or when templates/g11-functions-template.json cannot be fetched.
 */
(function (ET) {
  "use strict";

  function g11McStem(index) {
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
    return `[PLACEHOLDER: ${stems[index] || `Insert stem (Q${index + 1})`}]`;
  }

  function g11PartAQuestions() {
    return Array.from({ length: 10 }, (_, i) =>
      ET.createQuestion({
        id: `g11-a-q${i + 1}`,
        type: "multiple-choice",
        marks: 1,
        stem: g11McStem(i),
        options: ET.defaultMcOptions(),
        answerKey: "[A/B/C/D]",
        teacherNote: i === 0 ? "教师备注：替换题干与干扰项后检查唯一正确答案。" : "",
      })
    );
  }

  function g11PartBQuestions() {
    return Array.from({ length: 8 }, (_, i) =>
      ET.createQuestion({
        id: `g11-b-q${i + 1}`,
        type: "short-answer",
        marks: 2,
        stem: "[PLACEHOLDER: Short answer — evaluate, simplify, or state a value]",
        answerKey: "[ANSWER]",
      })
    );
  }

  function g11PartCQuestions() {
    const stems = [
      "A student claims that [PLACEHOLDER statement]. Explain whether this is correct and why.",
      "Compare the representations below: [PLACEHOLDER — table, graph, or equation]. State one similarity and one difference.",
      "The following solution contains an error: [PLACEHOLDER]. Identify the error, explain why it is wrong, and provide a corrected step.",
    ];
    const notes = [
      "Focus on justification, not length.",
      "Require reference to specific features.",
      "Award partial credit for identification only.",
    ];
    return stems.map((stem, i) =>
      ET.createQuestion({
        id: `g11-c-q${i + 1}`,
        type: "communication",
        marks: 4,
        stem,
        answerSpace: { type: "lines", lines: 4 },
        answerKey: "[Model response — see answer key]",
        teacherNote: notes[i] || "",
      })
    );
  }

  function g11PartDQuestions() {
    const stems = [
      "Modelling — [PLACEHOLDER: Write an equation from a real-world context and define all variables.]",
      "Graphing — [PLACEHOLDER: Sketch or analyse key features of a transformed function.]",
      "Parameters — [PLACEHOLDER: Explain how a parameter affects the graph or model. Support with an example.]",
      "Application — [PLACEHOLDER: Solve a real-world problem and interpret the result in context with units.]",
    ];
    const notes = [
      "Modelling / function setup",
      "Graphing / transformations",
      "Parameter analysis",
      "Real-world application",
    ];
    const marks = [6, 6, 8, 8];
    return stems.map((stem, i) =>
      ET.createQuestion({
        id: `g11-d-q${i + 1}`,
        type: "problem-solving",
        marks: marks[i],
        stem,
        answerSpace: { type: "lines", lines: marks[i] },
        answerKey: "[See answer key for steps]",
        teacherNote: notes[i] || "",
      })
    );
  }

  ET.defaultG11FunctionsExamData = function () {
    return {
      schemaVersion: ET.SCHEMA_VERSION,
      examId: "g11-functions-unit-test",
      profile: {
        grade: "Grade 11",
        subject: "Mathematics",
        courseCode: "MCR3U",
        courseName: "Functions",
        region: "Ontario",
        language: "en",
      },
      meta: {
        schoolName: "[SCHOOL NAME]",
        testTitle: "[UNIT / TOPIC TEST TITLE]",
        studentNameLabel: "Student Name",
        dateLabel: "Date",
        timeAllowed: "75 minutes",
        teacher: "[TEACHER NAME]",
        calculatorPolicy: "ALLOWED",
        paperSize: "letter",
      },
      instructions: [
        "Show all work for full marks. A correct final answer without supporting work may receive partial or no credit.",
        "Calculators: ALLOWED / NOT ALLOWED — confirm policy before the test.",
        "Round decimal answers to 2 decimal places unless otherwise stated.",
        "Clearly state restrictions, domain, and range when required.",
        "Write legibly. Use proper mathematical notation (e.g. f(x), ℝ).",
        "Manage your time. Marks are shown in [ ] beside each question.",
      ],
      parts: [
        ET.createPart({
          id: "part-a",
          label: "A",
          title: "Multiple Choice",
          description:
            "Choose the best answer. Write the letter (A, B, C, or D) on the line provided.",
          defaultQuestionType: "multiple-choice",
          defaultMarks: 1,
          defaultAnswerSpace: { type: "blank", lines: 0 },
          pageBreakBefore: false,
          questions: g11PartAQuestions(),
        }),
        ET.createPart({
          id: "part-b",
          label: "B",
          title: "Short Answer / Fill in the Blank",
          description:
            "Provide a concise answer. Show brief work or a one-sentence explanation where indicated.",
          defaultQuestionType: "short-answer",
          defaultMarks: 2,
          defaultAnswerSpace: { type: "blank", lines: 0 },
          pageBreakBefore: false,
          questions: g11PartBQuestions(),
        }),
        ET.createPart({
          id: "part-c",
          label: "C",
          title: "Communication / Reasoning",
          description:
            "Explain your thinking clearly. Use complete sentences and correct notation. You may be asked to compare, justify, identify errors, or explain why a statement is true or false.",
          defaultQuestionType: "communication",
          defaultMarks: 4,
          defaultAnswerSpace: { type: "lines", lines: 4 },
          pageBreakBefore: true,
          questions: g11PartCQuestions(),
        }),
        ET.createPart({
          id: "part-d",
          label: "D",
          title: "Problem Solving / Applications",
          description:
            "Show all steps. Diagrams, models, and labelled graphs are encouraged where appropriate.",
          defaultQuestionType: "problem-solving",
          defaultMarks: 6,
          defaultAnswerSpace: { type: "lines", lines: 6 },
          pageBreakBefore: true,
          questions: g11PartDQuestions(),
        }),
      ],
      bonus: {
        enabled: true,
        id: "bonus-1",
        label: "B1",
        marks: "+___",
        stem: "Optional enrichment — [PLACEHOLDER: challenge proof, extension, or synthesis across units]",
        answerSpace: { type: "lines", lines: 3 },
        teacherNote: "Bonus only if main sections attempted.",
        answerKey: "[PLACEHOLDER]",
      },
      rubric: {
        framework: "KTCA",
        region: "Ontario",
        categories: [
          { code: "K", name: "Knowledge & Understanding" },
          { code: "T", name: "Thinking" },
          { code: "C", name: "Communication" },
          { code: "A", name: "Application" },
        ],
        notes: "See docs/reference/g11-functions/rubric-template.md for full descriptors.",
      },
      settings: {
        showMarkDistribution: true,
        showInstructions: true,
        showBonus: true,
        autoNumberQuestions: true,
      },
    };
  };

  ET.registerProfile({
    id: "g11-functions",
    label: "G11 Functions Template",
    dataPath: "templates/g11-functions-template.json",
    getData: function () {
      return ET.defaultG11FunctionsExamData();
    },
  });
})(window.ExamToolkit);
