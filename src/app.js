/**
 * Application entry — state, controls, editor events, boot.
 */
(function (ET) {
  "use strict";

  let state = ET.createBlankExam();
  let activeProfileId = "g11-functions";
  let skipEditorRender = false;
  let paperStyleEl = null;

  let currentFileHandle = null;
  let currentFileName = null;
  let isDirty = false;

  const examRoot = document.getElementById("exam-root");
  const editorRoot = document.getElementById("editor-root");

  // ---------------------------------------------------------------------------
  // UI helpers
  // ---------------------------------------------------------------------------

  function showToast(messageKeyOrText, vars) {
    const el = document.getElementById("toast");
    if (!el) return;
    const text =
      typeof messageKeyOrText === "string" && messageKeyOrText.startsWith("toast.")
        ? ET.t(messageKeyOrText, vars)
        : messageKeyOrText;
    el.textContent = text;
    el.classList.remove("is-hidden");
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => el.classList.add("is-hidden"), 2200);
  }

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

  function syncProjectStatus() {
    const el = document.getElementById("project-status-name");
    if (!el) return;

    if (currentFileName) {
      el.textContent = isDirty ? `${currentFileName} *` : currentFileName;
    } else {
      el.textContent = isDirty
        ? `${ET.t("status.unsavedDraft")} *`
        : ET.t("status.unsavedDraft");
    }
    el.classList.toggle("is-modified", isDirty);
    el.setAttribute("title", isDirty ? ET.t("status.modifiedHint") : "");
  }

  function markDirty() {
    if (!isDirty) {
      isDirty = true;
      syncProjectStatus();
    }
  }

  function clearDirty() {
    isDirty = false;
    syncProjectStatus();
  }

  function clearProjectFile() {
    currentFileHandle = null;
    currentFileName = null;
    syncProjectStatus();
  }

  function setProjectFile(fileHandle, fileName) {
    currentFileHandle = fileHandle;
    currentFileName = fileName;
    syncProjectStatus();
  }

  function syncToolbar() {
    const paperSelect = document.getElementById("paper-size");
    const profileSelect = document.getElementById("exam-profile");
    const langSelect = document.getElementById("editor-language");

    if (paperSelect && paperSelect.value !== state.meta.paperSize) {
      paperSelect.value = state.meta.paperSize || "letter";
    }
    if (profileSelect && profileSelect.value !== activeProfileId) {
      profileSelect.value = activeProfileId;
    }
    if (langSelect && langSelect.value !== ET.currentLanguage) {
      langSelect.value = ET.currentLanguage;
    }

    applyPaperSize(state.meta.paperSize || "letter");
    ET.applyToolbarI18n();
    syncProjectStatus();
    document.title = ET.t("app.documentTitle", {
      title: state.meta.testTitle || "Exam",
    });
  }

  function switchLanguage(lang) {
    if (lang === ET.currentLanguage) return;
    ET.setLanguage(lang);
    refreshAll({ rerenderEditor: true });
  }

  function guardFileSystemAccess() {
    if (ET.supportsFileSystemAccess()) return true;
    showToast("toast.projectFileUnsupported");
    return false;
  }

  // ---------------------------------------------------------------------------
  // State refresh
  // ---------------------------------------------------------------------------

  function getBuiltView() {
    return ET.buildExamView(state);
  }

  function refreshAll(options = {}) {
    const { rerenderEditor = true } = options;

    const view = getBuiltView();
    const validation = ET.validateExamData(state);
    ET.renderExamPreview(view, examRoot);

    if (rerenderEditor && !skipEditorRender) {
      ET.renderEditor(state, view, editorRoot, validation);
    }

    syncToolbar();
    ET.saveToStorage(state, activeProfileId);
    return view;
  }

  function needsEditorRerender(path) {
    return (
      path.includes("__questionCount") ||
      path.endsWith(".enabled") ||
      path.endsWith("bonus.enabled") ||
      path.endsWith(".type") ||
      path.endsWith(".defaultQuestionType") ||
      path.endsWith(".pageBreakBefore") ||
      path.endsWith(".keepHeadingWithFirstQuestion") ||
      path.endsWith(".breakInside") ||
      path.startsWith("settings.")
    );
  }

  function handleQuestionCount(partIndex, count) {
    const part = state.parts[partIndex];
    if (!part) return;
    ET.syncPartQuestionCount(part, count);
  }

  function ensureQuestionOptions(question, type) {
    if (type === "multiple-choice" || type === "matching") {
      if (!Array.isArray(question.options) || !question.options.length) {
        question.options = ET.defaultMcOptions();
      }
    }
  }

  function updateFromField(path, rawValue, inputType, el) {
    if (path.endsWith("__questionCount")) {
      const match = path.match(/^parts\.(\d+)\.__questionCount$/);
      if (match) handleQuestionCount(Number(match[1]), rawValue);
      markDirty();
      refreshAll({ rerenderEditor: true });
      return;
    }

    let value = rawValue;
    if (inputType === "number") {
      value = rawValue === "" ? "" : Number(rawValue);
    } else if (inputType === "checkbox") {
      value = !!rawValue;
    }

    if (inputType === "tags-csv") {
      const m = path.match(/^parts\.(\d+)\.questions\.(\d+)\.__tagsCsv$/);
      if (m) {
        const q = state.parts[Number(m[1])]?.questions[Number(m[2])];
        if (q) {
          q.tags = String(rawValue)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        }
        markDirty();
        refreshAll({ rerenderEditor: false });
        return;
      }
    }

    if (inputType === "json-object" && path.endsWith(".__rubricJson")) {
      const m = path.match(/^parts\.(\d+)\.questions\.(\d+)\.__rubricJson$/);
      if (m) {
        const q = state.parts[Number(m[1])]?.questions[Number(m[2])];
        if (q) {
          try {
            const parsed = String(rawValue).trim() === "" ? {} : JSON.parse(rawValue);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
              q.rubricAllocation = parsed;
            }
          } catch (err) {
            /* keep last valid value while user edits JSON */
          }
        }
        markDirty();
        refreshAll({ rerenderEditor: false });
        return;
      }
    }

    if (path.match(/\.options\.\d+\.text$/)) {
      const m = path.match(/^(parts\.\d+\.questions\.\d+)\.options\.(\d+)\.text$/);
      if (m) {
        const q = getPathQuestion(m[1]);
        if (q) {
          ensureQuestionOptions(q, q.type);
          const idx = Number(m[2]);
          const key = el?.dataset?.optionKey || String.fromCharCode(65 + idx);
          if (!q.options[idx]) q.options[idx] = { key, text: "" };
          q.options[idx].text = value;
          q.options[idx].key = q.options[idx].key || key;
        }
        markDirty();
        refreshAll({ rerenderEditor: false });
        return;
      }
    }

    ET.setPathValue(state, path, value);

    if (path.endsWith(".type") || path.endsWith(".defaultQuestionType")) {
      const qMatch = path.match(/^parts\.(\d+)\.questions\.(\d+)\.type$/);
      if (qMatch) {
        const q = state.parts[Number(qMatch[1])]?.questions[Number(qMatch[2])];
        if (q) {
          ensureQuestionOptions(q, value);
          if (value === "page-break") {
            q.marks = 0;
            q.stem = "";
            q.options = [];
            q.answerSpace = { type: "blank", lines: 0 };
            q.answerKey = "";
            q.pageBreakBefore = true;
            q.breakInside = "auto";
            if (!Array.isArray(q.tags) || !q.tags.length) q.tags = ["layout"];
          }
        }
      }
    }

    if (path === "meta.paperSize") applyPaperSize(value);
    if (path === "bonus.enabled" || path === "settings.showBonus") {
      if (path === "bonus.enabled") state.settings.showBonus = !!value;
    }

    markDirty();
    refreshAll({ rerenderEditor: needsEditorRerender(path) });
  }

  function getPathQuestion(prefix) {
    const m = prefix.match(/^parts\.(\d+)\.questions\.(\d+)$/);
    if (!m) return null;
    return state.parts[Number(m[1])]?.questions[Number(m[2])];
  }

  function addPart() {
    const n = state.parts.length + 1;
    state.parts.push(
      ET.createPart({
        id: ET.uid("part"),
        label: String(n),
        title: `Section ${n}`,
        questions: [ET.createQuestion({ stem: `[PLACEHOLDER: Question 1]` })],
      })
    );
    markDirty();
    refreshAll({ rerenderEditor: true });
    showToast("toast.partAdded");
  }

  async function loadProfile(profileId) {
    activeProfileId = profileId;
    try {
      state = await ET.loadExamProfile(profileId);
      clearProjectFile();
      clearDirty();
      applyPaperSize(state.meta.paperSize || "letter");
      refreshAll({ rerenderEditor: true });
      showToast("toast.createdFromTemplate", { label: ET.getProfileById(profileId).label });
    } catch (err) {
      console.error(err);
      showToast("toast.createFromTemplateFailed");
    }
  }

  function resetToProfileDefault() {
    const label = ET.getProfileById(activeProfileId).label;
    if (!confirm(ET.t("confirm.reset", { label }))) return;
    loadProfile(activeProfileId);
  }

  async function openProject() {
    if (!guardFileSystemAccess()) return;
    if (isDirty && !confirm(ET.t("confirm.openProjectDirty"))) return;

    try {
      const result = await ET.openProjectFile();
      if (result.ok) {
        state = result.exam;
        activeProfileId = "project";
        setProjectFile(result.fileHandle, result.fileName);
        clearDirty();
        applyPaperSize(state.meta.paperSize || "letter");
        refreshAll({ rerenderEditor: true });
        showToast("toast.projectOpened", { name: result.fileName });
      } else if (result.cancelled) {
        showToast("toast.projectOpenCancelled");
      } else if (result.unsupported) {
        showToast("toast.projectFileUnsupported");
      } else {
        showToast("toast.projectOpenFailed");
      }
    } catch (err) {
      console.error(err);
      showToast("toast.projectOpenFailed");
    }
  }

  async function saveProject() {
    if (!guardFileSystemAccess()) return;

    if (!currentFileHandle) {
      await saveProjectAs();
      return;
    }

    try {
      const result = await ET.saveProjectFile(currentFileHandle, state);
      if (result.ok) {
        clearDirty();
        showToast("toast.projectSaved", { name: result.fileName });
      } else {
        showToast("toast.projectSaveFailed");
      }
    } catch (err) {
      console.error(err);
      showToast("toast.projectSaveFailed");
    }
  }

  async function saveProjectAs() {
    if (!guardFileSystemAccess()) return;

    try {
      const result = await ET.saveProjectFileAs(state);
      if (result.ok) {
        setProjectFile(result.fileHandle, result.fileName);
        clearDirty();
        showToast("toast.projectSaved", { name: result.fileName });
      } else if (result.cancelled) {
        showToast("toast.projectSaveCancelled");
      } else if (result.unsupported) {
        showToast("toast.projectFileUnsupported");
      } else {
        showToast("toast.projectSaveFailed");
      }
    } catch (err) {
      console.error(err);
      showToast("toast.projectSaveFailed");
    }
  }

  function saveDraft() {
    ET.saveToStorage(state, activeProfileId);
    showToast("toast.savedDraft");
  }

  // ---------------------------------------------------------------------------
  // Editor events
  // ---------------------------------------------------------------------------

  function addPageBreak(partIndex) {
    const part = state.parts[partIndex];
    if (!part) return;
    part.questions.push(ET.createPageBreakQuestion());
    markDirty();
    refreshAll({ rerenderEditor: true });
    showToast("toast.pageBreakAdded");
  }

  function onEditorInput(event) {
    const el = event.target;

    if (el.dataset.action === "add-part") {
      addPart();
      return;
    }

    if (el.dataset.action === "add-page-break") {
      const partIndex = Number(el.dataset.partIndex);
      if (!Number.isNaN(partIndex)) addPageBreak(partIndex);
      return;
    }

    const path = el.dataset.path;
    if (!path) return;

    const inputType = el.dataset.inputType || el.type;
    let value = inputType === "checkbox" ? el.checked : el.value;

    skipEditorRender = !needsEditorRerender(path) && inputType !== "checkbox";
    updateFromField(path, value, inputType, el);
    skipEditorRender = false;
  }

  function initEditorEvents() {
    editorRoot.addEventListener("input", onEditorInput);
    editorRoot.addEventListener("change", onEditorInput);
    editorRoot.addEventListener("click", onEditorInput);
  }

  // ---------------------------------------------------------------------------
  // Toolbar controls
  // ---------------------------------------------------------------------------

  function initControls() {
    const btnPrint = document.getElementById("btn-print");
    const btnAnswerKey = document.getElementById("btn-answer-key");
    const btnTeacherNotes = document.getElementById("btn-teacher-notes");
    const btnOpenProject = document.getElementById("btn-open-project");
    const btnSaveProject = document.getElementById("btn-save-project");
    const btnSaveProjectAs = document.getElementById("btn-save-project-as");
    const btnSaveDraft = document.getElementById("btn-save-draft");
    const btnReset = document.getElementById("btn-reset");
    const banner = document.getElementById("answer-key-banner");
    const paperSelect = document.getElementById("paper-size");
    const profileSelect = document.getElementById("exam-profile");
    const langSelect = document.getElementById("editor-language");

    ET.EXAM_PROFILES.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.label;
      profileSelect.appendChild(opt);
    });

    profileSelect.value = activeProfileId;
    profileSelect.addEventListener("change", () => {
      const label = ET.getProfileById(profileSelect.value).label;
      if (confirm(ET.t("confirm.createFromTemplate", { label }))) {
        loadProfile(profileSelect.value);
      } else {
        profileSelect.value = activeProfileId;
      }
    });

    langSelect.addEventListener("change", () => {
      switchLanguage(langSelect.value);
    });

    paperSelect.addEventListener("change", () => {
      updateFromField("meta.paperSize", paperSelect.value, "text");
    });

    btnPrint.addEventListener("click", () => {
      if (typeof ET.layoutExamPreviewPages === "function") {
        ET.layoutExamPreviewPages(getBuiltView(), examRoot);
      }
      window.print();
    });

    window.addEventListener("beforeprint", () => {
      if (typeof ET.layoutExamPreviewPages === "function") {
        ET.layoutExamPreviewPages(getBuiltView(), examRoot);
      }
    });

    btnAnswerKey.addEventListener("click", () => {
      const on = document.body.classList.toggle("show-answer-key");
      btnAnswerKey.setAttribute("aria-pressed", String(on));
      banner.classList.toggle("is-hidden", !on);
    });

    btnTeacherNotes.addEventListener("click", () => {
      const on = document.body.classList.toggle("show-teacher-notes");
      btnTeacherNotes.setAttribute("aria-pressed", String(on));
    });

    btnOpenProject.addEventListener("click", () => openProject());
    btnSaveProject.addEventListener("click", () => saveProject());
    btnSaveProjectAs.addEventListener("click", () => saveProjectAs());
    btnSaveDraft.addEventListener("click", saveDraft);
    btnReset.addEventListener("click", resetToProfileDefault);

    window.addEventListener("beforeunload", (event) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = ET.t("confirm.unsavedChanges");
      return event.returnValue;
    });
  }

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------

  async function boot() {
    ET.initLanguage();
    activeProfileId = ET.getStoredProfileId();

    const saved = ET.loadFromStorage(ET.createBlankExam());
    if (saved && saved.examId) {
      state = saved;
      clearProjectFile();
      isDirty = false;
      refreshAll({ rerenderEditor: true });
    } else {
      await loadProfile(activeProfileId);
    }

    initEditorEvents();
    initControls();

    window.ExamToolkitAPI = {
      getState: () => ET.deepClone(state),
      getView: getBuiltView,
      validate: () => ET.validateExamData(state),
      migrate: (raw) => ET.migrateExamData(raw),
      normalize: (raw, fb) => ET.normalizeExamData(raw, fb),
      refresh: refreshAll,
      loadProfile,
      createFromTemplate: loadProfile,
      openProject,
      saveProject,
      saveProjectAs,
      saveDraft,
      getProjectInfo: () => ({
        fileName: currentFileName,
        isDirty,
        hasFileHandle: !!currentFileHandle,
      }),
      setPaperSize: applyPaperSize,
      setLanguage: switchLanguage,
      t: ET.t,
      renderMathText: ET.renderMathText,
      preprocessLegacyMath: ET.preprocessLegacyMath,
      hasKatex: ET.hasKatex,
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window.ExamToolkit);
