/**
 * Generic blank template + exam profile registry (no subject-specific content).
 */
(function (ET) {
  "use strict";

  ET.EXAM_PROFILES = [];

  /** Register or replace an exam profile (called from src/profiles/*.js). */
  ET.registerProfile = function (profile) {
    if (!profile || !profile.id) return;
    const idx = ET.EXAM_PROFILES.findIndex((p) => p.id === profile.id);
    if (idx >= 0) ET.EXAM_PROFILES[idx] = profile;
    else ET.EXAM_PROFILES.push(profile);
  };

  ET.getProfileById = function (id) {
    return ET.EXAM_PROFILES.find((p) => p.id === id) || ET.EXAM_PROFILES[0] || null;
  };

  /** Default blank profile — no fetch path. */
  ET.registerProfile({
    id: "blank",
    label: "Blank Template",
    dataPath: null,
    getData: function () {
      return ET.createBlankExam({ examId: "blank-exam" });
    },
  });
})(window.ExamToolkit);
