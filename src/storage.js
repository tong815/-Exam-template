/**
 * localStorage draft persistence + project file I/O + profile loading.
 */
(function (ET) {
  "use strict";

  ET.STORAGE_KEY = "exam-template-editor-v1";
  ET.STORAGE_PROFILE_KEY = "exam-template-active-profile";
  ET.STORAGE_LANGUAGE_KEY = "exam-template-editor-language";

  ET.getStoredLanguage = function () {
    try {
      const lang = localStorage.getItem(ET.STORAGE_LANGUAGE_KEY);
      if (lang === "en" || lang === "zh") return lang;
    } catch (err) {
      console.warn("Could not read language preference:", err);
    }
    return "zh";
  };

  ET.saveLanguage = function (lang) {
    try {
      localStorage.setItem(ET.STORAGE_LANGUAGE_KEY, lang);
    } catch (err) {
      console.warn("Could not save language preference:", err);
    }
  };

  ET.saveToStorage = function (exam, profileId) {
    try {
      localStorage.setItem(ET.STORAGE_KEY, JSON.stringify(exam));
      if (profileId) localStorage.setItem(ET.STORAGE_PROFILE_KEY, profileId);
    } catch (err) {
      console.warn("Could not save to localStorage:", err);
    }
  };

  ET.loadFromStorage = function (fallbackNormalizer) {
    try {
      const raw = localStorage.getItem(ET.STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return ET.normalizeExamData(parsed, fallbackNormalizer);
    } catch (err) {
      console.warn("Could not load from localStorage:", err);
      return null;
    }
  };

  ET.getStoredProfileId = function () {
    return localStorage.getItem(ET.STORAGE_PROFILE_KEY) || "g11-functions";
  };

  // ---------------------------------------------------------------------------
  // File System Access API — project files
  // ---------------------------------------------------------------------------

  ET.supportsFileSystemAccess = function () {
    return (
      typeof window.showOpenFilePicker === "function" &&
      typeof window.showSaveFilePicker === "function"
    );
  };

  ET.JSON_FILE_PICKER_TYPES = [
    {
      description: "Exam JSON",
      accept: { "application/json": [".json"] },
    },
  ];

  ET.getDefaultProjectFileName = function (exam) {
    const id = exam?.examId;
    if (id && /^[\w\-]+$/.test(String(id))) {
      return `${id}.json`;
    }
    return "exam-data.json";
  };

  ET.parseExamJsonText = function (text) {
    const parsed = JSON.parse(text);
    const migrated = ET.migrateExamData(parsed);
    return ET.normalizeExamData(migrated, ET.createBlankExam());
  };

  ET.writeToFileHandle = async function (fileHandle, contents) {
    const writable = await fileHandle.createWritable();
    await writable.write(contents);
    await writable.close();
  };

  /**
   * Open an exam project file from disk.
   */
  ET.openProjectFile = async function () {
    if (!ET.supportsFileSystemAccess()) {
      return { ok: false, unsupported: true };
    }

    try {
      const [fileHandle] = await window.showOpenFilePicker({
        types: ET.JSON_FILE_PICKER_TYPES,
        multiple: false,
      });
      const file = await fileHandle.getFile();
      const text = await file.text();
      const exam = ET.parseExamJsonText(text);
      return {
        ok: true,
        exam,
        fileHandle,
        fileName: fileHandle.name,
      };
    } catch (err) {
      if (err && err.name === "AbortError") {
        return { ok: false, cancelled: true };
      }
      console.error("openProjectFile failed:", err);
      return { ok: false, error: err?.message || String(err) };
    }
  };

  /**
   * Overwrite an existing project file handle.
   */
  ET.saveProjectFile = async function (fileHandle, exam) {
    if (!fileHandle) {
      return { ok: false, noFile: true };
    }

    try {
      const json = JSON.stringify(exam, null, 2);
      await ET.writeToFileHandle(fileHandle, json);
      return { ok: true, fileName: fileHandle.name };
    } catch (err) {
      console.error("saveProjectFile failed:", err);
      return { ok: false, error: err?.message || String(err) };
    }
  };

  /**
   * Save project to a new file location (Save Project As).
   */
  ET.saveProjectFileAs = async function (exam) {
    if (!ET.supportsFileSystemAccess()) {
      return { ok: false, unsupported: true };
    }

    try {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: ET.getDefaultProjectFileName(exam),
        types: ET.JSON_FILE_PICKER_TYPES,
      });
      const json = JSON.stringify(exam, null, 2);
      await ET.writeToFileHandle(fileHandle, json);
      return {
        ok: true,
        fileHandle,
        fileName: fileHandle.name,
      };
    } catch (err) {
      if (err && err.name === "AbortError") {
        return { ok: false, cancelled: true };
      }
      console.error("saveProjectFileAs failed:", err);
      return { ok: false, error: err?.message || String(err) };
    }
  };

  ET.loadExamProfile = async function (profileId) {
    const profile = ET.getProfileById(profileId);
    if (!profile) throw new Error(`Unknown profile: ${profileId}`);

    if (!profile.dataPath) {
      return ET.normalizeExamData(profile.getData(), ET.createBlankExam());
    }

    try {
      const res = await fetch(profile.dataPath);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return ET.normalizeExamData(json, profile.getData());
    } catch (err) {
      console.warn(`Profile fetch failed (${profile.dataPath}), using built-in fallback.`, err);
      return ET.normalizeExamData(profile.getData(), ET.createBlankExam());
    }
  };
})(window.ExamToolkit);
