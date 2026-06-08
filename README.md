# Exam Template — Generic Editor & Print Preview

通用本地考试模板工具：**通用编辑器 / 预览 / 打印** 与 **具体考试内容（Exam Profile）** 分离。

当前内置示例：**G11 Functions (MCR3U)**，位于 `exams/g11-functions/`。同一套工具可用于其他年级、科目。

---

## 项目结构

```text
Exam-template/
├─ index.html
├─ styles.css
├─ src/
│  ├─ app.js
│  ├─ editor.js
│  ├─ renderer.js
│  ├─ storage.js
│  ├─ schema.js             # schema、migrate、normalize、validate
│  ├─ i18n.js               # 编辑器 UI 中英文（不影响试卷内容）
│  ├─ templates.js          # 空白模板 + Profile 注册表（无科目内容）
│  └─ profiles/
│     └─ g11-functions.js  # G11 fallback + profile 注册
├─ docs/
│  └─ schema-v1.md          # 通用 schema 文档
├─ examples/
│  ├─ blank-exam.json
│  ├─ minimal-exam.json
│  └─ generic-math-quiz.json
├─ exams/
│  └─ g11-functions/
│     ├─ exam-template.md
│     ├─ answer-key-template.md
│     ├─ rubric-template.md
│     └─ exam-data.json
└─ README.md
```

### 两层架构

| 层 | 位置 | 职责 |
|:---|:-----|:-----|
| **通用模板层** | `src/`, `index.html`, `styles.css` | 数据结构、编辑器、预览、打印、项目文件读写 |
| **考试内容层** | `exams/<profile>/` | 某年级/科目的 markdown 模板、`exam-data.json`、rubric 等 |

通用代码（`src/schema.js`、`src/templates.js` 等）**不写死** Grade 11、Functions、MCR3U、Ontario、KTCA 等；这些只出现在 `exams/` 与 `src/profiles/` 等内容文件中。

**`profile` vs `meta`：** `profile` 表示课程/年级/科目身份（通常不随每次考试变）；`meta` 表示本次考试实例（标题、教师、时长、纸张等）。不要把 `courseCode` 放进 `meta`，也不要把 `testTitle` 放进 `profile`。详见 `docs/schema-v1.md`。

---

## Schema hardening v1

稳固项目根基，便于长期扩展：

| 能力 | 位置 | 说明 |
|:-----|:-----|:-----|
| **Schema 文档** | `docs/schema-v1.md` | 顶层 / part / question 字段说明、示例链接 |
| **示例 JSON** | `examples/` | 空白、最小、通用数学小测（无 G11/Ontario） |
| **migrateExamData** | `src/schema.js` | 旧字段迁移（`solutionLines`、legacy `options` 等） |
| **normalizeExamData** | `src/schema.js` | 补默认值、标准化结构 |
| **validateExamData** | `src/schema.js` | 返回 `{ ok, errors, warnings }`，不阻止预览/打印 |
| **Validation UI** | Editor 顶部 | ✅ / ⚠️ / ❌ 状态，可展开查看列表 |
| **Renderer 容错** | `src/renderer.js` | 缺字段、未知题型不崩溃 |
| **Profile 解耦** | `src/profiles/g11-functions.js` | G11 fallback 与注册独立于 `templates.js` |

调试 API：

```javascript
ExamToolkitAPI.validate()        // 当前试卷校验结果
ExamToolkitAPI.openProject()     // 打开项目文件
ExamToolkitAPI.saveProject()     // 保存项目（覆盖）
ExamToolkitAPI.saveProjectAs()   // 项目另存为
ExamToolkitAPI.getProjectInfo()  // { fileName, isDirty, hasFileHandle }
ExamToolkitAPI.setLanguage("zh") // 切换编辑器界面语言
ExamToolkitAPI.t("toolbar.saveProject") // 翻译 key
```

---

## Editor UI Language / 编辑器界面语言

工具栏 **界面语言 / Editor UI** 可在 **English** 与 **中文** 之间切换。

| 会翻译 | 不会翻译 |
|:-------|:---------|
| 工具栏按钮与标签 | `examData` 中的题干 `stem` |
| 左侧编辑器字段名、分区标题 | Instructions 正文 |
| Validation 错误/警告说明 | 右侧 Preview 试卷内容 |
| Toast、确认对话框 | Title Block、Part 标题/说明（考试内容） |

- **默认语言：** 中文（`zh`）；若曾切换过，则读取 `localStorage` 键 `exam-template-editor-language`
- **学生试卷语言** 完全由 `examData` 内容决定，界面语言**不会**自动翻译题目
- 翻译字典：`src/i18n.js`（轻量 `ET.t(key, vars)`，无第三方 i18n 库）

---

## 打开方式

### 方式 A：直接双击（可用）

双击 `index.html`。编辑器与预览可正常使用；**Load Exam Profile** 在无法 `fetch` 本地 JSON 时会自动使用 `src/profiles/g11-functions.js` 中的内置回退数据。

### 方式 B：VS Code Live Server（推荐）

若希望从 `exams/g11-functions/exam-data.json` **文件**加载（而非内置回退）：

1. 在 VS Code 中安装 **Live Server**
2. 右键 `index.html` → **Open with Live Server**
3. 工具栏 **Profile → G11 Functions** 将从 JSON 文件加载

---

## 通用 examData 结构（schema v1.0）

```json
{
  "schemaVersion": "1.0",
  "examId": "g11-functions-unit-test",
  "profile": {
    "grade": "Grade 11",
    "subject": "Mathematics",
    "courseCode": "MCR3U",
    "courseName": "Functions",
    "region": "Ontario",
    "language": "en"
  },
  "meta": {
    "schoolName": "",
    "testTitle": "",
    "studentNameLabel": "Student Name",
    "dateLabel": "Date",
    "timeAllowed": "",
    "teacher": "",
    "calculatorPolicy": "ALLOWED",
    "paperSize": "letter"
  },
  "instructions": [],
  "parts": [],
  "bonus": {},
  "rubric": {},
  "settings": {
    "showMarkDistribution": true,
    "showInstructions": true,
    "showBonus": false,
    "autoNumberQuestions": true
  }
}
```

### Part（通用）

- 不限于 A/B/C/D；使用 `id` + `label`（显示用，如 `A`、`1`、`I`）
- 每 Part 含 `questions[]` 数组

### Question 类型

`multiple-choice` · `short-answer` · `long-answer` · `communication` · `problem-solving` · `matching` · `true-false` · `custom`

```json
{
  "id": "q-001",
  "number": 1,
  "type": "multiple-choice",
  "stem": "",
  "marks": 1,
  "options": [{ "key": "A", "text": "" }],
  "answerSpace": { "type": "lines", "lines": 2 },
  "answerKey": "",
  "teacherNote": "",
  "tags": [],
  "attachments": [],
  "rubricAllocation": {}
}
```

每题可选：`tags`（逗号编辑）、`attachments`（JSON 只读，预览占位渲染）、`rubricAllocation`（JSON 编辑，如 `{ "K": 2, "T": 1 }`）。

---

## 编辑器使用说明

### 界面

| 区域 | 说明 |
|:-----|:-----|
| **Toolbar** | Profile、纸张、打开/保存项目、保存草稿、重置、打印、答案/备注切换；顶部显示当前项目名 |
| **左侧 Editor** | Profile、Meta、显示设置、Part 结构、每题字段 |
| **右侧 Preview** | 学生卷实时预览 |

打印时**仅输出右侧试卷**；工具栏与编辑器自动隐藏。

### Load Exam Profile

工具栏 **Profile** 下拉：

| Profile | 说明 |
|:--------|:-----|
| **Blank Template** | 通用空白骨架（1 个 Section） |
| **G11 Functions** | 加载 `exams/g11-functions/exam-data.json`（或内置回退） |

切换 Profile 会提示确认（避免误覆盖未保存编辑）。

### 推荐工作流（Project File）

编辑器按 **Word 式项目文件** 工作：`exam-data.json` 是真实工程文件，不再以下载 JSON 为主流程。

**打开已有考试：**

```text
Open Project（打开项目）
    ↓
选择 exam-data.json（例如 C:\Users\chena\Desktop\试卷json\...\exam-data.json）
    ↓
编辑
    ↓
Save Project（保存项目）→ 直接覆盖原文件
    ↓
Print / Save as PDF
```

**新建考试：**

```text
Load Profile（或 Blank Template）
    ↓
编辑骨架
    ↓
Save Project As（项目另存为）
    ↓
保存到例如：C:\Users\chena\Desktop\试卷json\G11 Functions\Final 2026\exam-data.json
```

| 操作 | 说明 |
|:-----|:-----|
| **Open Project** | 用系统文件选择器打开 `.json` 项目文件 |
| **Save Project** | 若有已打开文件则直接覆盖；否则自动走 **Save Project As** |
| **Save Project As** | 另存为新 `exam-data.json` 或 `<examId>.json` |
| **Save Draft** | 仅写入 `localStorage`（浏览器恢复草稿，非磁盘工程） |
| **Reset to Default** | 恢复当前 Profile 默认数据 |

工具栏显示 **当前项目：** 文件名；有未保存修改时显示 `*`（例如 `exam-data.json *`）。未打开项目时显示 **未保存草稿**。离开页面前若有未保存修改会触发 `beforeunload` 提示。

**浏览器要求：** Open / Save Project 依赖 Chrome 或 Edge 的 [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/Window/showOpenFilePicker)（`showOpenFilePicker` / `showSaveFilePicker`）。Firefox / Safari 等不支持时会 toast 提示，程序不崩溃。

### 考试工程目录建议

真实考试建议放在固定根目录，例如：

```text
C:\Users\chena\Desktop\试卷json\
│
├─ G11 Functions/
│   ├─ Final 2026/
│   │   ├─ exam-data.json
│   │   ├─ exam.pdf
│   │   └─ notes.md
│   │
│   └─ Unit Test 1/
│
├─ G12 Advanced Functions/
│
└─ Physics/
```

### 修改题量与分值

1. 在 **Part Structure** 找到对应 Part
2. 勾选 **Enabled** / 修改 **# Questions**
3. 题号在已启用 Part 间**自动连续**（`settings.autoNumberQuestions`）
4. **Default marks** / **Default answer lines** 影响新题；单题可在题目列表中覆盖

**Total Marks** 自动计算（不含 Bonus 加分计入总分表）。

### 草稿自动保存（localStorage）

每次编辑仍会写入 `localStorage`（键：`exam-template-editor-v1`），用于刷新页面后恢复上次编辑。**Save Draft** 可手动触发同一机制。磁盘上的正式工程文件请用 **Save Project**。

### 打印 PDF

1. 右侧确认预览
2. 选择 **Letter**（加拿大常用）或 **A4**
3. **Print / Save as PDF** → 系统对话框选「另存为 PDF」

---

## 新建一个考试 Profile

例如新建 **G12 Advanced Functions**：

### 1. 创建文件夹

```text
exams/g12-advanced-functions/
├─ exam-data.json
├─ exam-template.md        # 可选：Markdown 参考模板
├─ answer-key-template.md  # 可选
└─ rubric-template.md      # 可选
```

### 2. 复制并修改 exam-data.json

```bash
# 从 G11 复制作为起点
cp exams/g11-functions/exam-data.json exams/g12-advanced-functions/exam-data.json
```

修改：

- `examId` → 如 `g12-advanced-functions-midterm`
- `profile` → grade、courseCode、courseName 等
- `meta.testTitle`、`instructions`
- `parts` → 题量、题型、分值
- `rubric` → 该考试适用的评价框架（若有）

### 3. 注册 Profile（可选，便于工具栏加载）

**步骤：**

1. 新建 `exams/<profile>/exam-data.json`
2. 若需 `file://` 回退，新建 `src/profiles/<profile>.js`
3. 在 profile 文件中调用 `ET.registerProfile({ ... })`
4. 在 `index.html` 中于 `templates.js` 之后加载该 profile 脚本

`src/profiles/g12-advanced-functions.js` 示例：

```javascript
(function (ET) {
  ET.defaultG12ExamData = function () {
    return { /* 完整 examData 对象 */ };
  };
  ET.registerProfile({
    id: "g12-advanced-functions",
    label: "G12 Advanced Functions",
    dataPath: "exams/g12-advanced-functions/exam-data.json",
    getData: function () { return ET.defaultG12ExamData(); },
  });
})(window.ExamToolkit);
```

`src/templates.js` 只保留 `registerProfile` 与 Blank Template，**不要**把科目内容写进去。

也可跳过注册，用 **Open Project** 打开 `exam-data.json`。

### 4. 参考 examples/

| 文件 | 用途 |
|:-----|:-----|
| `examples/blank-exam.json` | 通用空白骨架 |
| `examples/minimal-exam.json` | 最小可渲染考试（1 题） |
| `examples/generic-math-quiz.json` | 通用数学小测（无地区/年级绑定） |

字段说明见 `docs/schema-v1.md`。

### 5. 工作流建议

1. 在编辑器中搭好骨架（题量、分值、答题行数）
2. **Save Project As** 到 `试卷json/<课程>/<考试名>/exam-data.json`
3. 将 JSON 交给 ChatGPT / 其他工具生成正式题干
4. 用 Cursor 按同一 JSON 结构填回 `stem`、`options`、`answerKey`
5. **Open Project** 继续编辑，**Save Project** 覆盖保存
6. 打印 PDF 或继续用 Markdown 模板出卷

---

## G11 Functions 示例（当前）

| Part | 内容 | 题量 | 分值 |
|:-----|:-----|:-----|:-----|
| A | Multiple Choice | 10 | 10 |
| B | Short Answer | 8 | 16 |
| C | Communication / Reasoning | 3 | 12 |
| D | Problem Solving | 4 | 6+6+8+8 = 28 |
| Bonus | 可选 | 1 | 自定 |
| | **Total** | **25** | **66** |

Markdown 模板与 Ontario KTCA rubric 说明见 `exams/g11-functions/`。

---

## 开发说明

- 纯原生 HTML / CSS / JS，无构建工具
- 模块通过 `window.ExamToolkit` 命名空间挂载，兼容 `file://`
- 调试：`window.ExamToolkitAPI.getState()` / `getView()`

---

## 许可

通用框架可自由修改复用；`exams/` 下具体题目内容版权归出题教师所有。

*Last updated: Project file editor — Open / Save Project workflow*
