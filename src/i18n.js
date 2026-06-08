/**
 * Lightweight editor UI i18n (en / zh). Does not translate exam content.
 */
(function (ET) {
  "use strict";

  ET.currentLanguage = "zh";

  ET.I18N = {
    en: {
      "app.title": "Exam JSON Studio",
      "app.subtitle": "exam-data.json editor, preview & print",
      "app.documentTitle": "{title} — Editor & Preview",

      "toolbar.template": "Template",
      "toolbar.paper": "Paper",
      "toolbar.editorLanguage": "Editor UI",
      "toolbar.openProject": "Open Project",
      "toolbar.saveProject": "Save Project",
      "toolbar.saveProjectAs": "Save Project As",
      "toolbar.saveDraft": "Save Draft",
      "toolbar.reset": "Reset to Default",
      "toolbar.print": "Print / Save as PDF",
      "toolbar.answerKey": "Toggle Answer Key Preview",
      "toolbar.teacherNotes": "Toggle Teacher Notes",
      "toolbar.langEn": "English",
      "toolbar.langZh": "中文",

      "status.currentProject": "Current Project:",
      "status.unsavedDraft": "Unsaved draft",
      "status.modifiedHint": "Unsaved changes",

      "banner.answerKey": "Answer Key Preview — placeholder answers shown below each question",

      "section.examProfile": "Course Identity",
      "section.examMeta": "Exam Meta",
      "section.displaySettings": "Display Settings",
      "section.partStructure": "Part Structure",
      "section.bonus": "Bonus Question (Optional)",
      "section.validation": "Validation",

      "field.examId": "Exam ID",
      "field.grade": "Grade",
      "field.subject": "Subject",
      "field.courseCode": "Course code",
      "field.courseName": "Course name",
      "field.region": "Region",
      "field.language": "Language",
      "field.schoolName": "School Name",
      "field.testTitle": "Test Title",
      "field.studentNameLabel": "Student name label",
      "field.dateLabel": "Date label",
      "field.timeAllowed": "Time Allowed",
      "field.totalMarksAuto": "Total Marks (auto)",
      "field.teacher": "Teacher",
      "field.calculatorPolicy": "Calculator Policy",
      "field.paperSize": "Paper Size",
      "field.showInstructions": "Show instructions",
      "field.showMarkDistribution": "Show mark distribution",
      "field.showBonus": "Show bonus section",
      "field.autoNumberQuestions": "Auto-number questions",
      "field.enabled": "Enabled",
      "field.label": "Label",
      "field.title": "Title",
      "field.description": "Description",
      "field.questionCount": "# Questions",
      "field.defaultType": "Default type",
      "field.defaultMarks": "Default marks",
      "field.defaultAnswerLines": "Default answer lines",
      "field.pageBreakBefore": "Page break before",
      "field.marks": "Marks",
      "field.type": "Type",
      "field.stemPlaceholder": "Stem (placeholder)",
      "field.answerSpaceLines": "Answer space lines",
      "field.answerKeyPlaceholder": "Answer key (placeholder)",
      "field.teacherNote": "Teacher note",
      "field.tags": "Tags (comma-separated)",
      "field.rubricAllocation": "Rubric allocation (JSON)",
      "field.attachmentsReadonly": "Attachments (read-only JSON)",
      "field.marksLabel": "Marks label",
      "field.option": "Option {key}",
      "field.matchingItem": "Item {key}",
      "field.addPart": "+ Add Part",

      "part.title": "Part {label}",
      "part.range": "Range: {range} | Subtotal: {subtotal} marks",
      "part.rangeDisabled": "disabled",
      "part.noQuestions": "No questions (part disabled or count is 0).",
      "part.structureHint": "Question numbers update automatically across enabled parts.",
      "question.head": "Question {num}",

      "policy.ALLOWED": "ALLOWED",
      "policy.NOT_ALLOWED": "NOT ALLOWED",
      "paper.letter": "Letter",
      "paper.a4": "A4",

      "questionType.multiple-choice": "Multiple Choice",
      "questionType.short-answer": "Short Answer",
      "questionType.long-answer": "Long Answer",
      "questionType.communication": "Communication",
      "questionType.problem-solving": "Problem Solving",
      "questionType.matching": "Matching",
      "questionType.true-false": "True / False",
      "questionType.custom": "Custom",

      "validation.schemaValid": "Schema valid",
      "validation.schemaValidWithWarnings": "Schema valid with {count} warning(s)",
      "validation.errorAndWarningCount": "{errors} error(s), {warnings} warning(s)",
      "validation.errors": "Errors",
      "validation.warnings": "Warnings",
      "validation.noIssues": "No issues detected.",
      "validation.fixBeforeSave": "Preview and print remain available; fix errors before saving final exams.",

      "validation.examNotObject": "Exam data is null or not an object",
      "validation.missingSchemaVersion": "Missing schemaVersion",
      "validation.missingExamId": "Missing examId",
      "validation.missingMeta": "Missing meta object",
      "validation.partsNotArray": "parts must be an array",
      "validation.missingPartId": "{path}: missing part id",
      "validation.missingPartTitle": "{path}: missing part title",
      "validation.questionsNotArray": "{path}: questions must be an array",
      "validation.missingQuestionType": "{path}: missing question type",
      "validation.emptyStem": "{path}: empty stem",
      "validation.missingMarks": "{path}: missing marks",
      "validation.invalidMarks": "{path}: marks must be a number >= 0",
      "validation.invalidAnswerLines": "{path}: answerSpace.lines must be a number >= 0",
      "validation.mcMinOptions": "{path}: multiple-choice requires at least 2 options",
      "validation.unknownQuestionType": "{path}: unknown question type \"{type}\"",
      "validation.duplicatePartQuestionId": "{path}: duplicate question id \"{id}\" within enabled part",
      "validation.duplicateGlobalQuestionId": "Duplicate global question id \"{id}\" ({first} and {second})",
      "validation.totalMarksZero": "Total marks is 0 for enabled parts",
      "validation.totalMarksComputeFailed": "Could not compute total marks for validation",
      "validation.noEnabledParts": "No enabled parts — preview will show title/instructions only",
      "validation.tagsNotArray": "{path}: tags must be an array",
      "validation.attachmentsNotArray": "{path}: attachments must be an array",
      "validation.rubricAllocationNotObject": "{path}: rubricAllocation must be an object",
      "validation.attachmentMissingSrc": "{path}: image attachment missing src",
      "validation.unknownAttachmentType": "{path}: unknown attachment type \"{type}\"",
      "validation.rubricAllocationInvalidValue": "{path}: rubricAllocation.{key} should be a non-negative number",

      "toast.savedDraft": "Draft saved to browser storage",
      "toast.projectOpened": "Opened project: {name}",
      "toast.projectOpenCancelled": "Open cancelled",
      "toast.projectOpenFailed": "Failed to open project",
      "toast.projectSaved": "Saved project: {name}",
      "toast.projectSaveCancelled": "Save cancelled",
      "toast.projectSaveFailed": "Failed to save project",
      "toast.projectFileUnsupported":
        "Your browser does not support direct project file access. Please use Chrome or Edge.",
      "toast.createdFromTemplate": "Created from template: {label}",
      "toast.createFromTemplateFailed": "Failed to load template",
      "toast.partAdded": "Part added",

      "confirm.reset": "Reset to \"{label}\" default template? Unsaved edits will be lost.",
      "confirm.createFromTemplate": "Create from template \"{label}\"? Unsaved changes may be lost.",
      "confirm.openProjectDirty": "You have unsaved changes. Open another project anyway?",
      "confirm.unsavedChanges": "You have unsaved changes.",
    },
    zh: {
      "app.title": "Exam JSON Studio",
      "app.subtitle": "exam-data.json 编辑器、预览与打印",
      "app.documentTitle": "{title} — 编辑与预览",

      "toolbar.template": "模板",
      "toolbar.paper": "纸张",
      "toolbar.editorLanguage": "界面语言",
      "toolbar.openProject": "打开项目",
      "toolbar.saveProject": "保存项目",
      "toolbar.saveProjectAs": "项目另存为",
      "toolbar.saveDraft": "保存草稿",
      "toolbar.reset": "恢复默认",
      "toolbar.print": "打印 / 另存为 PDF",
      "toolbar.answerKey": "切换答案预览",
      "toolbar.teacherNotes": "切换教师备注",
      "toolbar.langEn": "English",
      "toolbar.langZh": "中文",

      "status.currentProject": "当前项目：",
      "status.unsavedDraft": "未保存草稿",
      "status.modifiedHint": "存在未保存修改",

      "banner.answerKey": "答案预览 — 每题下方显示占位答案",

      "section.examProfile": "课程信息",
      "section.examMeta": "考试元信息",
      "section.displaySettings": "显示设置",
      "section.partStructure": "大题结构",
      "section.bonus": "加分题（可选）",
      "section.validation": "数据校验",

      "field.examId": "考试 ID",
      "field.grade": "年级",
      "field.subject": "科目",
      "field.courseCode": "课程代码",
      "field.courseName": "课程名称",
      "field.region": "地区",
      "field.language": "语言",
      "field.schoolName": "学校名称",
      "field.testTitle": "试卷标题",
      "field.studentNameLabel": "姓名字段标签",
      "field.dateLabel": "日期字段标签",
      "field.timeAllowed": "考试时长",
      "field.totalMarksAuto": "总分（自动）",
      "field.teacher": "教师",
      "field.calculatorPolicy": "计算器政策",
      "field.paperSize": "纸张尺寸",
      "field.showInstructions": "显示考试说明",
      "field.showMarkDistribution": "显示分值分布表",
      "field.showBonus": "显示加分题",
      "field.autoNumberQuestions": "自动连续题号",
      "field.enabled": "启用",
      "field.label": "标签",
      "field.title": "标题",
      "field.description": "说明",
      "field.questionCount": "题目数量",
      "field.defaultType": "默认题型",
      "field.defaultMarks": "默认分值",
      "field.defaultAnswerLines": "默认答题行数",
      "field.pageBreakBefore": "此前分页",
      "field.marks": "分值",
      "field.type": "题型",
      "field.stemPlaceholder": "题干（占位）",
      "field.answerSpaceLines": "答题区行数",
      "field.answerKeyPlaceholder": "答案（占位）",
      "field.teacherNote": "教师备注",
      "field.tags": "标签（逗号分隔）",
      "field.rubricAllocation": "评分维度分配（JSON）",
      "field.attachmentsReadonly": "附件（只读 JSON）",
      "field.marksLabel": "分值标签",
      "field.option": "选项 {key}",
      "field.matchingItem": "配对项 {key}",
      "field.addPart": "+ 添加大题",

      "part.title": "第 {label} 部分",
      "part.range": "题号范围：{range}　|　小计：{subtotal} 分",
      "part.rangeDisabled": "未启用",
      "part.noQuestions": "无题目（该部分未启用或题量为 0）。",
      "part.structureHint": "题号在已启用部分之间自动连续编号。",
      "question.head": "第 {num} 题",

      "policy.ALLOWED": "允许",
      "policy.NOT_ALLOWED": "不允许",
      "paper.letter": "Letter",
      "paper.a4": "A4",

      "questionType.multiple-choice": "选择题",
      "questionType.short-answer": "简答题",
      "questionType.long-answer": "长答题",
      "questionType.communication": "论述 / 说理",
      "questionType.problem-solving": "应用 / 解题",
      "questionType.matching": "配对题",
      "questionType.true-false": "判断题",
      "questionType.custom": "自定义",

      "validation.schemaValid": "数据结构有效",
      "validation.schemaValidWithWarnings": "有效，有 {count} 条警告",
      "validation.errorAndWarningCount": "{errors} 个错误，{warnings} 条警告",
      "validation.errors": "错误",
      "validation.warnings": "警告",
      "validation.noIssues": "未发现问题。",
      "validation.fixBeforeSave": "仍可预览和打印；保存正式试卷前请修复错误。",

      "validation.examNotObject": "考试数据为空或不是对象",
      "validation.missingSchemaVersion": "缺少 schemaVersion",
      "validation.missingExamId": "缺少 examId",
      "validation.missingMeta": "缺少 meta 对象",
      "validation.partsNotArray": "parts 必须是数组",
      "validation.missingPartId": "{path}：缺少 part id",
      "validation.missingPartTitle": "{path}：缺少 part 标题",
      "validation.questionsNotArray": "{path}：questions 必须是数组",
      "validation.missingQuestionType": "{path}：缺少题型",
      "validation.emptyStem": "{path}：题干为空",
      "validation.missingMarks": "{path}：缺少分值",
      "validation.invalidMarks": "{path}：分值必须是 >= 0 的数字",
      "validation.invalidAnswerLines": "{path}：answerSpace.lines 必须是 >= 0 的数字",
      "validation.mcMinOptions": "{path}：选择题至少需要 2 个选项",
      "validation.unknownQuestionType": "{path}：未知题型 \"{type}\"",
      "validation.duplicatePartQuestionId": "{path}：启用部分内题目 id \"{id}\" 重复",
      "validation.duplicateGlobalQuestionId": "全局题目 id \"{id}\" 重复（{first} 与 {second}）",
      "validation.totalMarksZero": "已启用部分总分为 0",
      "validation.totalMarksComputeFailed": "无法计算总分以进行校验",
      "validation.noEnabledParts": "无已启用部分 — 预览仅显示标题/说明",
      "validation.tagsNotArray": "{path}：tags 必须是数组",
      "validation.attachmentsNotArray": "{path}：attachments 必须是数组",
      "validation.rubricAllocationNotObject": "{path}：rubricAllocation 必须是对象",
      "validation.attachmentMissingSrc": "{path}：图片附件缺少 src",
      "validation.unknownAttachmentType": "{path}：未知附件类型 \"{type}\"",
      "validation.rubricAllocationInvalidValue": "{path}：rubricAllocation.{key} 应为非负数字",

      "toast.savedDraft": "草稿已保存到浏览器本地存储",
      "toast.projectOpened": "已打开项目：{name}",
      "toast.projectOpenCancelled": "已取消打开",
      "toast.projectOpenFailed": "打开项目失败",
      "toast.projectSaved": "已保存项目：{name}",
      "toast.projectSaveCancelled": "已取消保存",
      "toast.projectSaveFailed": "保存项目失败",
      "toast.projectFileUnsupported": "当前浏览器不支持项目文件直接读写，请使用 Chrome 或 Edge。",
      "toast.createdFromTemplate": "已从模板新建：{label}",
      "toast.createFromTemplateFailed": "加载模板失败",
      "toast.partAdded": "已添加大题",

      "confirm.reset": "恢复为「{label}」默认模板？未保存的编辑将丢失。",
      "confirm.createFromTemplate": "从模板「{label}」新建？未保存的修改可能丢失。",
      "confirm.openProjectDirty": "当前有未保存的修改，仍要打开其他项目吗？",
      "confirm.unsavedChanges": "存在未保存修改。",
    },
  };

  ET.t = function (key, vars, fallback) {
    const lang = ET.currentLanguage || "en";
    const dict = ET.I18N[lang] || ET.I18N.en;
    let text = dict[key];
    if (text == null) text = ET.I18N.en[key];
    if (text == null) text = fallback != null ? fallback : key;

    if (vars && typeof vars === "object") {
      Object.keys(vars).forEach((k) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(vars[k]));
      });
    }
    return text;
  };

  ET.setLanguage = function (lang) {
    if (lang !== "en" && lang !== "zh") lang = "en";
    ET.currentLanguage = lang;
    if (typeof ET.saveLanguage === "function") ET.saveLanguage(lang);
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  };

  ET.initLanguage = function () {
    const stored = typeof ET.getStoredLanguage === "function" ? ET.getStoredLanguage() : "zh";
    ET.setLanguage(stored);
  };

  ET.getLocalizedQuestionTypes = function () {
    return (ET.QUESTION_TYPES || []).map((qt) => ({
      value: qt.value,
      label: ET.t(`questionType.${qt.value}`, {}, qt.label),
    }));
  };

  ET.formatValidationIssue = function (issue) {
    if (issue == null) return "";
    if (typeof issue === "string") return issue;
    const key = `validation.${issue.code}`;
    const translated = ET.t(key, issue.vars || {});
    if (translated !== key) return translated;
    return issue.message || issue.code || "";
  };

  ET.applyToolbarI18n = function () {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.dataset.i18n;
      if (!key) return;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.placeholder = ET.t(key);
      } else {
        el.textContent = ET.t(key);
      }
    });

    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      el.setAttribute("aria-label", ET.t(el.dataset.i18nAria));
    });

    const langSelect = document.getElementById("editor-language");
    if (langSelect) langSelect.value = ET.currentLanguage;
  };
})(window.ExamToolkit);
