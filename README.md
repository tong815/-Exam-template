# Exam JSON Studio

本地 **exam-data.json** 编辑器、预览器与打印器。

核心链条：

```text
exam-data.json
    ↓
Editor
    ↓
Preview
    ↓
Print / Save as PDF
```

**JSON 是唯一真实数据源。** 本仓库只提供工具与 schema；真实考试保存在本地，不提交到 GitHub。

日常使用见 [使用说明.md](使用说明.md)。

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
│  ├─ schema.js
│  ├─ i18n.js
│  ├─ templates.js          # starter template 注册
│  └─ profiles/
│     └─ g11-functions.js   # G11 starter template provider
├─ docs/
│  ├─ schema-v1.md
│  └─ reference/            # 可选教师参考文档（不参与渲染）
│     └─ g11-functions/
├─ examples/                # schema 示例（非真实考试）
│  ├─ blank-exam.json
│  ├─ minimal-exam.json
│  └─ generic-math-quiz.json
├─ templates/               # 可复用 starter templates
│  └─ g11-functions-template.json
├─ 使用说明.md
└─ README.md
```

### 仓库里有什么 / 没有什么

| 保存在本仓库 | 不保存在本仓库 |
|:-------------|:---------------|
| schema、editor、renderer、打印样式 | 学校正式考试 |
| `examples/`、`templates/` | 真实 `exam-data.json` 项目文件 |
| 文档 | 真实答案卷、学生 PDF |
| G11 **starter template**（骨架，非真实考试） | 自动生成的 README / notes |

### 真实考试放在哪里

```text
C:\Users\chena\Desktop\试卷json\
│
├─ G11 Functions/
│  └─ Final 2026/
│     ├─ exam-data.json
│     ├─ exam.pdf
│     └─ notes.txt
│
├─ G12 Advanced Functions/
│
└─ Physics/
```

用 **Open Project** 打开、**Save Project** 覆盖保存。备注文件（`notes.txt` / `notes.md`）由教师自行管理，工具不自动生成。

---

## 快速开始

1. 用 **Chrome** 或 **Edge** 打开 `index.html`（建议 Live Server）
2. **打开项目** — 选择本地 `exam-data.json`  
   或 **从模板新建** — 选 Blank / G11 Functions Template → **项目另存为**
3. 编辑 → **保存项目** → **打印 / 另存为 PDF**

| 操作 | 说明 |
|:-----|:-----|
| **Open Project** | 打开本地 `exam-data.json` |
| **Save Project** | 覆盖当前文件；无已打开文件时自动 **另存为** |
| **Save Project As** | 仅保存 JSON，不生成其他文件 |
| **Save Draft** | 仅 `localStorage` 草稿 |
| **Create From Template** | 从 starter template 新建（非打开真实考试） |

---

## Starter Templates

工具栏 **Template** 下拉用于 **从模板新建**，不是加载真实考试：

| Template | 说明 |
|:---------|:-----|
| **Blank Template** | 通用空白骨架 |
| **G11 Functions Template** | 66 分 Functions 单元测骨架（占位题干） |

模板文件：`templates/g11-functions-template.json`。`file://` 无法 fetch 时使用 `src/profiles/g11-functions.js` 内置回退。

新建其他课程模板：

1. 在 `templates/` 添加 `*-template.json`
2. 可选：在 `src/profiles/` 注册 provider（`registerProfile` + `index.html` 加载脚本）

也可直接 **Open Project** 打开本地已有 JSON，无需注册模板。

---

## Schema

- 文档：[docs/schema-v1.md](docs/schema-v1.md)
- 示例：[examples/](examples/)
- **`profile` vs `meta`：** `profile` = 课程身份；`meta` = 本次考试实例（标题、教师、时长等）

```javascript
ExamToolkitAPI.validate()
ExamToolkitAPI.openProject()
ExamToolkitAPI.saveProject()
ExamToolkitAPI.getProjectInfo()  // { fileName, isDirty, hasFileHandle }
```

---

## 开发说明

- 纯原生 HTML / CSS / JS，无构建工具
- 模块挂载于 `window.ExamToolkit`，兼容 `file://`
- 调试：`window.ExamToolkitAPI.getState()` / `getView()`

---

## 许可

通用框架可自由修改复用。真实考试内容版权归出题教师所有，请保存在本地 `试卷json/` 目录。

*Last updated: Exam JSON Studio — templates + local project files*
