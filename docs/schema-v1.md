# Exam Data Schema v1.0

This document describes the **generic** exam JSON structure used by Exam Template Editor.

The schema is **not** tied to any grade, subject, region, or curriculum. Values such as `Grade 11`, `MCR3U`, or `Ontario` belong in **exam profile content** (`exams/<profile>/exam-data.json`), not in the core schema definition.

---

## Top-level `examData`

| Field | Type | Required | Description |
|:------|:-----|:---------|:------------|
| `schemaVersion` | string | yes | Schema version, currently `"1.0"` |
| `examId` | string | yes | Stable identifier, e.g. `g11-functions-unit-test` |
| `profile` | object | recommended | Curriculum / course context (display & export) |
| `meta` | object | yes | Printable header fields |
| `instructions` | string[] | recommended | Ordered instruction lines |
| `parts` | Part[] | yes | Exam sections |
| `bonus` | object | optional | Optional bonus question |
| `rubric` | object | optional | Teacher rubric metadata (free-form) |
| `settings` | object | recommended | Editor / preview display flags |

---

## `profile` vs `meta` — boundary

| | `profile` | `meta` |
|:--|:----------|:-------|
| **Meaning** | Course / grade / subject **identity** — who this exam belongs to | **This instance** of an exam — title, date, teacher, paper |
| **Changes** | Usually stable across tests in the same course | Changes every test you print |
| **Examples** | `grade`, `subject`, `courseCode`, `courseName`, `region` | `testTitle`, `teacher`, `timeAllowed`, `schoolName`, `paperSize` |

Do **not** put `courseCode` / `grade` / `subject` in `meta`.  
Do **not** put `testTitle` / `teacher` / `timeAllowed` in `profile`.

---

## `profile`

Describes **which exam** this is. All fields are optional strings unless noted.

| Field | Description |
|:------|:------------|
| `grade` | e.g. `Grade 11`, `Year 9` |
| `subject` | e.g. `Mathematics`, `Science` |
| `courseCode` | e.g. `MCR3U` |
| `courseName` | e.g. `Functions` |
| `region` | e.g. `Ontario` (profile content only) |
| `language` | BCP-47 style code, default `en` |

**Course line** on the printed exam is derived from `grade`, `courseName`, and `courseCode` — not stored in `meta`.

---

## `meta`

Printable exam header (student-facing).

| Field | Type | Default | Description |
|:------|:-----|:--------|:------------|
| `schoolName` | string | `""` | School name |
| `testTitle` | string | `""` | Test / unit title |
| `studentNameLabel` | string | `Student Name` | Label for name field |
| `dateLabel` | string | `Date` | Label for date field |
| `timeAllowed` | string | `""` | e.g. `75 minutes` |
| `teacher` | string | `""` | Teacher name |
| `calculatorPolicy` | string | `ALLOWED` | `ALLOWED` or `NOT ALLOWED` |
| `paperSize` | string | `letter` | `letter` or `a4` |

`totalMarks` is **computed** at render time — do not store in `meta`.

---

## `settings`

| Field | Type | Default | Description |
|:------|:-----|:--------|:------------|
| `showMarkDistribution` | boolean | `true` | Show marks summary table |
| `showInstructions` | boolean | `true` | Show instructions block |
| `showBonus` | boolean | `false` | Show bonus section when enabled |
| `autoNumberQuestions` | boolean | `true` | Auto-number across enabled parts |

---

## `parts[]` — Part

| Field | Type | Required | Description |
|:------|:-----|:---------|:------------|
| `id` | string | yes | Stable unique id, e.g. `part-a` |
| `label` | string | recommended | Display label, e.g. `A`, `1`, `I` |
| `enabled` | boolean | default `true` | Include in numbering & preview |
| `title` | string | yes | Section title |
| `description` | string | optional | Student directions for section |
| `defaultQuestionType` | string | recommended | Default type for new questions |
| `defaultMarks` | number | recommended | Default marks per question |
| `defaultAnswerSpace` | answerSpace | optional | Default answer area |
| `pageBreakBefore` | boolean | default `false` | Print page break before section |
| `questions` | Question[] | yes | Questions in this part |

Parts are **not** limited to A/B/C/D. Use any `id` / `label` pattern.

---

## `questions[]` — Question

| Field | Type | Required | Description |
|:------|:-----|:---------|:------------|
| `id` | string | recommended | Stable unique id (validated globally) |
| `number` | number | optional | Display number; auto-assigned if omitted |
| `type` | string | yes | See question types below |
| `stem` | string | yes | Question text (may be placeholder) |
| `marks` | number | yes | Points, must be `>= 0` |
| `options` | `{key,text}[]` | conditional | Required for MC / matching |
| `answerSpace` | answerSpace | optional | Student answer area |
| `answerKey` | string | optional | Teacher answer placeholder |
| `teacherNote` | string | optional | Internal note |
| `tags` | string[] | optional | Topic / skill / difficulty tags for future analytics |
| `attachments` | object[] | optional | Figures, tables, graphs (see below) |
| `rubricAllocation` | object | optional | Per-question rubric weights, e.g. `{ "K": 2, "T": 1 }` |

### `attachments[]` (placeholder rendering)

| `type` | Fields | Preview behaviour |
|:-------|:-------|:------------------|
| `image` | `src`, `alt?` | Renders `<img>` if `src` present; else placeholder |
| `table` | — | Placeholder text (no table engine yet) |
| `graph` | — | Placeholder text (no graph engine yet) |
| other | — | "Unsupported attachment type" |

Example:

```json
{
  "type": "image",
  "src": "assets/graph-q5.png",
  "alt": "Parabola sketch"
}
```

### Question types

| `type` | Description |
|:-------|:------------|
| `multiple-choice` | A/B/C/D style options |
| `short-answer` | Line + optional brief explanation |
| `long-answer` | Multi-line answer space |
| `communication` | Explanation / reasoning space |
| `problem-solving` | Extended worked solution space |
| `matching` | Match items + answer space |
| `true-false` | True/False line |
| `custom` | Free-form; uses answer space |

---

## `answerSpace`

| Field | Type | Description |
|:------|:-----|:------------|
| `type` | string | `blank` or `lines` |
| `lines` | number | Number of ruled lines (`>= 0`) |

Examples:

```json
{ "type": "blank", "lines": 0 }
{ "type": "lines", "lines": 6 }
```

---

## `bonus`

| Field | Type | Description |
|:------|:-----|:------------|
| `enabled` | boolean | Include bonus section |
| `id` | string | Stable id |
| `label` | string | Display label, e.g. `B1` |
| `marks` | string/number | Marks label, e.g. `+2` or `+___` |
| `stem` | string | Question text |
| `answerSpace` | answerSpace | Answer area |
| `answerKey` | string | Teacher key |
| `teacherNote` | string | Internal note |

---

## `rubric`

Free-form object for teacher / regional rubric metadata. The core editor does not render rubric on the student paper.

Example (profile-specific):

```json
{
  "framework": "KTCA",
  "region": "Ontario",
  "categories": [
    { "code": "K", "name": "Knowledge & Understanding" }
  ],
  "notes": "See rubric-template.md"
}
```

---

## Minimal valid JSON

See [`examples/minimal-exam.json`](../examples/minimal-exam.json) — smallest exam that renders with one short-answer question.

## Blank template JSON

See [`examples/blank-exam.json`](../examples/blank-exam.json) — matches the built-in Blank Template profile.

## Generic math quiz (no regional profile)

See [`examples/generic-math-quiz.json`](../examples/generic-math-quiz.json) — Year 9 algebra quiz without Ontario / G11 references.

## G11 Functions full example

See [`exams/g11-functions/exam-data.json`](../exams/g11-functions/exam-data.json) — complete 66-mark Functions unit test skeleton with Ontario KTCA rubric metadata in the profile layer.

---

## Migration (legacy fields)

`migrateExamData()` transforms older shapes before normalization:

| Legacy | Current |
|:-------|:--------|
| `solutionLines` | `answerSpace.lines` |
| `options: { A: "..." }` | `options: [{ key, text }]` |
| `meta.course` | hints → `profile` (then removed from meta) |
| `meta.totalMarks` | removed (computed) |
| `part.questionType` | `defaultQuestionType` |
| `part.defaultSolutionLines` | `defaultAnswerSpace.lines` |
| `part.questionCount` | length of `questions[]` |
| `bonus.number` | `bonus.label` |

---

## Validation

`validateExamData(exam)` returns:

```json
{
  "ok": true,
  "errors": [],
  "warnings": []
}
```

Validation does **not** block preview or print. Errors and warnings are shown in the editor Validation panel.

---

*Schema version: 1.0 — Exam Template project*
