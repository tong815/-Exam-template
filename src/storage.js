/**
 * localStorage persistence + JSON import/export + profile loading.
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

  ET.exportExamJson = function (exam) {
    const blob = new Blob([JSON.stringify(exam, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const slug = (exam.meta?.testTitle || exam.examId || "exam").replace(/[^\w\-]+/g, "-").slice(0, 40);
    a.href = url;
    a.download = `${slug || "exam-data"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  ET.importExamJsonFile = function (file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          resolve(ET.normalizeExamData(data, ET.createBlankExam()));
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
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
