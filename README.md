# Exam Template — Generic Editor & Print Preview

通用本地考试模板工具：**通用编辑器 / 预览 / 打印** 与 **具体考试内容（Exam Profile）** 分离。

当前内置示例：**G11 Functions (MCR3U)**，位于 `exams/g11-functions/`。同一套工具可用于其他年级、科目。

---

## 项目结构

```text
Exam-template/
├─ index.html              # 入口（双击打开，或用 Live Server）
├─ styles.css              # 屏幕布局 + 打印样式
├─ src/                    # 通用逻辑（不含年级/科目硬编码）
│  ├─ app.js               # 入口：状态、控件、事件
│  ├─ editor.js            # 编辑器 UI
│  ├─ renderer.js          # 试卷预览渲染
│  ├─ storage.js           # localStorage、导入/导出、Profile 加载
│  ├─ schema.js            # 通用 examData 结构与计算
│  └─ templates.js         # 空白默认模板 + Profile 注册表
│
├─ exams/                  # 具体考试内容层（按考试分文件夹）
│  └─ g11-functions/
│     ├─ exam-template.md
│     ├─ answer-key-template.md
│     ├─ rubric-template.md
│     └─ exam-data.json    # G11 示例骨架（编辑器可加载）
│
└─ README.md
```

### 两层架构

| 层 | 位置 | 职责 |
|:---|:-----|:-----|
| **通用模板层** | `src/`, `index.html`, `styles.css` | 数据结构、编辑器、预览、打印、JSON 导入导出 |
| **考试内容层** | `exams/<profile>/` | 某年级/科目的 markdown 模板、`exam-data.json`、rubric 等 |

通用代码中**不写死** Grade 11、Functions、MCR3U、Ontario、KTCA 等；这些只出现在 `exams/g11-functions/` 等内容文件中。

---

## 打开方式

### 方式 A：直接双击（可用）

双击 `index.html`。编辑器与预览可正常使用；**Load Exam Profile** 在无法 `fetch` 本地 JSON 时会自动使用内置 `defaultG11FunctionsExamData` 回退数据。

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
  "tags": []
}
```

---

## 编辑器使用说明

### 界面

| 区域 | 说明 |
|:-----|:-----|
| **Toolbar** | Profile、纸张、保存、重置、导入/导出、打印、答案/备注切换 |
| **左侧 Editor** | Profile、Meta、显示设置、Part 结构、每题字段 |
| **右侧 Preview** | 学生卷实时预览 |

打印时**仅输出右侧试卷**；工具栏与编辑器自动隐藏。

### Load Exam Profile

工具栏 **Profile** 下拉：

| Profile | 说明 |
|:--------|:-----|
| **Blank Template** | 通用空白骨架（1 个 Section） |
| **G11 Functions** | 加载 `exams/g11-functions/exam-data.json`（或内置回退） |

切换 Profile 会提示确认（避免误覆盖未导出编辑）。

### 修改题量与分值

1. 在 **Part Structure** 找到对应 Part
2. 勾选 **Enabled** / 修改 **# Questions**
3. 题号在已启用 Part 间**自动连续**（`settings.autoNumberQuestions`）
4. **Default marks** / **Default answer lines** 影响新题；单题可在题目列表中覆盖

**Total Marks** 自动计算（不含 Bonus 加分计入总分表）。

### 保存 / 导入 / 导出 JSON

| 操作 | 说明 |
|:-----|:-----|
| **自动保存** | 每次编辑写入 `localStorage`（键：`exam-template-editor-v1`） |
| **Save** | 手动触发保存 |
| **Export JSON** | 下载当前 `exam-data.json` |
| **Import JSON** | 从本地 JSON 恢复（覆盖当前编辑状态） |
| **Reset to Default** | 恢复当前 Profile 的默认数据 |

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

在 `src/templates.js` 的 `EXAM_PROFILES` 数组追加：

```javascript
{
  id: "g12-advanced-functions",
  label: "G12 Advanced Functions",
  dataPath: "exams/g12-advanced-functions/exam-data.json",
  getData: function () {
    return ET.normalizeExamData(/* 内置 fallback 对象 */, ET.createBlankExam());
  },
}
```

也可跳过注册，直接 **Import JSON** 载入 `exam-data.json`。

### 4. 工作流建议

1. 在编辑器中搭好骨架（题量、分值、答题行数）
2. **Export JSON**
3. 将 JSON 交给 ChatGPT / 其他工具生成正式题干
4. 用 Cursor 按同一 JSON 结构填回 `stem`、`options`、`answerKey`
5. **Import JSON** 或更新 `exams/.../exam-data.json` 后重新加载 Profile
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

*Last updated: Generic Exam Template — schema v1.0*
