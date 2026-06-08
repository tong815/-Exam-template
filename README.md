# G11 Mathematics / Functions — Exam Template Kit

可复用的 **Grade 11 Functions (MCR3U)** 试卷模板，风格参考加拿大安省高中数学测评，并保留清晰分区便于出卷与阅卷。

---

## 文件说明

| 文件 | 用途 | 主要读者 |
|:-----|:-----|:---------|
| `index.html` | 本地网页编辑器 + 试卷预览入口 | 教师 |
| `app.js` | 试卷数据结构、编辑器逻辑、预览渲染 | 教师 |
| `styles.css` | 屏幕布局、编辑器样式、打印样式 | 教师 |
| `exam-template.md` | 学生试卷正文（题目占位 + 答题区） | 学生 |
| `answer-key-template.md` | 参考答案、得分点、常见扣分 | 教师 |
| `rubric-template.md` | Ontario KTCA 四类评价标准 | 教师 |
| `README.md` | 使用说明（本文件） | 教师 |

---

## 试卷结构一览

| Part | 内容 | 题量 | 分值 |
|:-----|:-----|:-----|:-----|
| **A** | Multiple Choice | 10 | 10 |
| **B** | Short Answer / Fill in the Blank | 8 | 16 |
| **C** | Communication / Reasoning | 3 | 12 |
| **D** | Problem Solving / Applications | 4 | 6 + 6 + 8 + 8 = 28 |
| **Bonus** | 可选加分题 | 1 | 自定 |
| | **Total** | **25 (+bonus)** | **66** |

---

## Exam Editor v1 使用说明

本地结构编辑器，用于确定试卷骨架（题量、分值、答题行数），**不自动出题**。确定结构后可导出 JSON，供下一阶段填入正式题目。

### 打开方式

双击 `index.html` 即可在浏览器中打开（无需安装、无需构建）。

### 界面布局

| 区域 | 说明 |
|:-----|:-----|
| **顶部工具栏** | 保存、重置、导入/导出 JSON、打印、答案预览、教师备注 |
| **左侧 Editor Panel** | 编辑考试元信息、各 Part 结构、每道题占位字段 |
| **右侧 Exam Preview** | 实时预览学生卷排版 |

窄屏（手机）下自动改为上下排列；**打印时只输出右侧试卷**，左侧编辑器与工具栏自动隐藏。

### 修改各 Part 题量

1. 在左侧 **Part Structure** 找到对应 Part（A / B / C / D）
2. 勾选 **Enabled** 启用该部分（取消则不计入题号与总分）
3. 修改 **# Questions** 数值
4. 右侧预览立即更新；题号在已启用的 Part 之间**自动连续**（例如 A 5 题 + B 6 题 → B 从 Q6 开始）

增加题量会追加占位题；减少题量会删除末尾题目（已填内容会丢失）。

### 修改每题分值与答题空间

**批量默认值（Part 级）：**

- **Default marks** — 该 Part 新题的默认分值
- **Default solution lines** — Part C / D 新题的默认答题行数

**单题覆盖（题目列表）：**

- **Marks** — 覆盖默认分值（Part D 可设为 6, 6, 8, 8 等不等分）
- **Solution lines** — 覆盖答题区行数
- **Stem** — 题干占位文字
- **Type** — 题型（选择题 / 简答 / Communication / Problem Solving）
- **Option A–D** — 选择题选项占位
- **Answer key / Teacher note** — 教师用占位（预览中可通过 Toggle 显示）

**Total Marks** 在 Exam Meta 区只读显示，随各 Part 小题分值**自动求和**（不含 Bonus）。

### 保存 / 导出 JSON

| 按钮 | 作用 |
|:-----|:-----|
| **Save** | 立即写入浏览器 `localStorage`（每次编辑也会自动保存） |
| **Export JSON** | 下载 `exam-data.json`，包含完整编辑器配置 |
| **Import JSON** | 选择本地 JSON 文件载入，恢复编辑器与预览 |
| **Reset to Default** | 恢复默认 66 分结构（A10/B8/C3/D4 + Bonus） |

导出 JSON 可用于：

- 备份当前骨架
- 发给 ChatGPT 生成正式题干后，再由 Cursor 按同一结构填回
- 在不同电脑间迁移（Import JSON）

### 从 JSON 恢复

1. 点击 **Import JSON**
2. 选择之前导出的 `exam-data.json`
3. 编辑器与右侧预览同步更新，并写入 `localStorage`

### 打印 PDF

1. 在右侧确认预览排版无误
2. 工具栏选择 **Paper**（Letter 默认，加拿大常用；也可选 A4）
3. 点击 **Print / Save as PDF**
4. 在系统打印对话框中选择「另存为 PDF」或「Microsoft Print to PDF」

打印设置建议：边距使用默认；缩放 100%；勾选「背景图形」可保留表格浅灰底纹（可选）。

### 其他工具栏功能

- **Toggle Answer Key Preview** — 预览每题答案占位（打印时自动隐藏）
- **Toggle Teacher Notes** — 显示教师备注（打印时自动隐藏）

---

## 如何生成一份新试卷（Markdown 模板方式）

### 1. 复制并重命名

```text
复制 exam-template.md
重命名为例如：unit-3-quadratic-functions-test.md
```

建议同步复制：

```text
answer-key-template.md  →  unit-3-quadratic-functions-answer-key.md
rubric-template.md      →  unit-3-quadratic-functions-rubric.md
```

### 2. 替换占位符

在试卷与答案卷中搜索并替换：

| 占位符 | 替换为 |
|:-------|:-------|
| `[SCHOOL NAME]` | 学校名称 |
| `[UNIT / TOPIC TEST TITLE]` | 如 *Unit 3: Quadratic Functions* |
| `[TEACHER NAME]` | 教师姓名 |
| `[e.g., 75 minutes]` | 考试时长 |
| `[ALLOWED / NOT ALLOWED]` | 计算器政策 |
| `[PLACEHOLDER: ...]` | 实际题干与选项 |
| `[OPTION A]` 等 | 选择题选项 |
| `[+___]` | 加分题分值（若使用） |

### 3. 调整总分（如需要）

默认总分 **66**。若修改分值：

1. 更新标题区 **Total Marks**
2. 更新 **Mark Distribution Summary** 表格
3. 更新每题旁的 **[n]** 标记
4. 同步修改 `answer-key-template.md` 与 `rubric-template.md` 中的总分与分值表

**保持分值一致：** 各部分小计之和必须等于 Total Marks。

### 4. 填写答案卷

按 Part A → B → C → D 顺序：

- **Part A：** 填正确答案表（A/B/C/D）
- **Part B：** 填最终答案与可接受变体
- **Part C / D：** 写主要步骤、分步给分、常见错误

### 5. 标注评价类别（可选）

在 `rubric-template.md` 的 **Per-Question Rubric Tags** 表中标注每题对应的 K / T / C / A，便于成绩分析与 report card。

---

## 期中 / 期末建议

出 **期末复习卷** 或 **cumulative exam** 时：

- 在 Part A/B 中覆盖多个单元核心概念
- Part C 增加跨主题比较（如 linear vs. exponential growth）
- Part D 至少一题综合建模、一题图像与参数分析
- Instructions 中写明 **cumulative topics** 范围
- Answer key 的 **Topic / Skill Tag** 列按单元标注，方便统计薄弱点

---

## 导出 Word / PDF

本模板为 Markdown，便于 Pandoc 或 VS Code / Typora 导出：

1. **保留表格** — 分值表在 Word 中仍清晰
2. **Solution space** — `blockquote`（`>`）在导出后可视作答题框；也可改为表格或下划线
3. **数学公式** — 使用 `$...$` 或 `$$...$$`；导出前确认公式渲染正常
4. **分页** — 在 Part C / D 大题前可插入 `---` 或 Word 分页符

### Pandoc 示例（可选）

```bash
pandoc unit-3-test.md -o unit-3-test.pdf
pandoc unit-3-test.md -o unit-3-test.docx
```

---

## 出题检查清单

出卷前快速核对：

- [ ] 标题区信息完整（学校、课程、日期、时长、总分、教师）
- [ ] Instructions 中计算器政策已确定
- [ ] 各部分题号连续（1–25，Bonus 另计）
- [ ] 分值小计：10 + 16 + 12 + 28 = 66
- [ ] Part D 包含：建模、图像、参数、应用四类题型占位已替换为实题
- [ ] 答案卷与试卷题号、分值一致
- [ ] Rubric 中 KTCA 标签已更新
- [ ] 未误留 `[PLACEHOLDER]` 给学生卷

---

## 定制建议

| 需求 | 修改位置 |
|:-----|:---------|
| 增加选择题 | Part A 题量 + Mark Distribution 表 |
| 加长答题区 | 各题 `Solution space` blockquote 行数 |
| 禁用 Bonus | 删除 Bonus 节或注明 N/A |
| 双语试卷 | 题干保持英文；Instructions 可加中文副标题 |
| IA / 过程分加重 | 提高 Part C/D 分值，相应减少 Part A |

---

## 许可与复用

本模板为个人教学用途的结构框架，可自由修改、复制、分发给同事。填写的具体题目内容版权归出题教师所有。

---

*Last updated: Exam Editor v1 — Grade 11 Functions / MCR3U*
