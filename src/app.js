/**
 * Application entry — state, controls, editor events, boot.
 */
(function (ET) {
  "use strict";

  let state = ET.createBlankExam();
  let activeProfileId = "g11-functions";
  let skipEditorRender = false;
  let paperStyleEl = null;

  const examRoot = document.getElementById("exam-root");
  const editorRoot = document.getElementById("editor-root");

  // ---------------------------------------------------------------------------
  // UI helpers
  // ---------------------------------------------------------------------------

  function showToast(message) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = message;
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

  function syncToolbar() {
    const paperSelect = document.getElementById("paper-size");
    const profileSelect = document.getElementById("exam-profile");
    if (paperSelect && paperSelect.value !== state.meta.paperSize) {
      paperSelect.value = state.meta.paperSize || "letter";
    }
    if (profileSelect && profileSelect.value !== activeProfileId) {
      profileSelect.value = activeProfileId;
    }
    applyPaperSize(state.meta.paperSize || "letter");
    document.title = `${state.meta.testTitle || "Exam"} — Editor & Preview`;
  }

  // ---------------------------------------------------------------------------
  // State refresh
  // ---------------------------------------------------------------------------

  function getBuiltView() {
    return ET.buildExamView(state);
  }

  function refreshAll(options = {}) {
    const { rerenderEditor = true } = options;

    ET.getEnabledParts(state).forEach((part) => {
      /* ensure question objects stay materialized */
    });

    const view = getBuiltView();
    ET.renderExamPreview(view, examRoot);

    if (rerenderEditor && !skipEditorRender) {
      ET.renderEditor(state, view, editorRoot);
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
      refreshAll({ rerenderEditor: true });
      return;
    }

    let value = rawValue;
    if (inputType === "number") {
      value = rawValue === "" ? "" : Number(rawValue);
    } else if (inputType === "checkbox") {
      value = !!rawValue;
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
        refreshAll({ rerenderEditor: false });
        return;
      }
    }

    ET.setPathValue(state, path, value);

    if (path.endsWith(".type") || path.endsWith(".defaultQuestionType")) {
      const qMatch = path.match(/^parts\.(\d+)\.questions\.(\d+)\.type$/);
      if (qMatch) {
        const q = state.parts[Number(qMatch[1])]?.questions[Number(qMatch[2])];
        if (q) ensureQuestionOptions(q, value);
      }
    }

    if (path === "meta.paperSize") applyPaperSize(value);
    if (path === "bonus.enabled" || path === "settings.showBonus") {
      if (path === "bonus.enabled") state.settings.showBonus = !!value;
    }

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
    refreshAll({ rerenderEditor: true });
    showToast("Part added");
  }

  async function loadProfile(profileId) {
    activeProfileId = profileId;
    try {
      state = await ET.loadExamProfile(profileId);
      applyPaperSize(state.meta.paperSize || "letter");
      refreshAll({ rerenderEditor: true });
      showToast(`Loaded profile: ${ET.getProfileById(profileId).label}`);
    } catch (err) {
      console.error(err);
      showToast("Failed to load profile");
    }
  }

  function resetToProfileDefault() {
    const label = ET.getProfileById(activeProfileId).label;
    if (!confirm(`Reset to "${label}" default? Unsaved edits will be lost.`)) return;
    loadProfile(activeProfileId);
  }

  // ---------------------------------------------------------------------------
  // Editor events
  // ---------------------------------------------------------------------------

  function onEditorInput(event) {
    const el = event.target;

    if (el.dataset.action === "add-part") {
      addPart();
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
    const btnSave = document.getElementById("btn-save");
    const btnReset = document.getElementById("btn-reset");
    const btnExport = document.getElementById("btn-export");
    const btnImport = document.getElementById("btn-import");
    const importFile = document.getElementById("import-file");
    const banner = document.getElementById("answer-key-banner");
    const paperSelect = document.getElementById("paper-size");
    const profileSelect = document.getElementById("exam-profile");

    ET.EXAM_PROFILES.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.label;
      profileSelect.appendChild(opt);
    });

    profileSelect.value = activeProfileId;
    profileSelect.addEventListener("change", () => {
      if (
        confirm(
          `Load profile "${ET.getProfileById(profileSelect.value).label}"? Current unsaved edits may be replaced unless you exported a backup.`
        )
      ) {
        loadProfile(profileSelect.value);
      } else {
        profileSelect.value = activeProfileId;
      }
    });

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
      ET.saveToStorage(state, activeProfileId);
      showToast("Saved to browser storage");
    });

    btnReset.addEventListener("click", resetToProfileDefault);
    btnExport.addEventListener("click", () => {
      ET.exportExamJson(state);
      showToast("Exported exam-data.json");
    });

    btnImport.addEventListener("click", () => importFile.click());
    importFile.addEventListener("change", async () => {
      const file = importFile.files?.[0];
      importFile.value = "";
      if (!file) return;
      try {
        state = await ET.importExamJsonFile(file);
        activeProfileId = "imported";
        applyPaperSize(state.meta.paperSize || "letter");
        refreshAll({ rerenderEditor: true });
        showToast("Imported JSON successfully");
      } catch (err) {
        showToast("Import failed: invalid JSON");
        console.error(err);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------

  async function boot() {
    activeProfileId = ET.getStoredProfileId();

    const saved = ET.loadFromStorage(ET.createBlankExam());
    if (saved && saved.examId) {
      state = saved;
      refreshAll({ rerenderEditor: true });
    } else {
      await loadProfile(activeProfileId);
    }

    initEditorEvents();
    initControls();

    window.ExamToolkitAPI = {
      getState: () => ET.deepClone(state),
      getView: getBuiltView,
      refresh: refreshAll,
      loadProfile,
      exportJson: () => ET.exportExamJson(state),
      setPaperSize: applyPaperSize,
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window.ExamToolkit);
