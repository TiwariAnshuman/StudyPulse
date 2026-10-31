import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { createTestResult } from "../tests.api.js";
import { apiRequest } from "../../../lib/api.js";

const NEET_SUBJECTS = ["Physics", "Chemistry", "Biology"];

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createEmptySubject() {
  return {
    subjectName: "",
    marksObtained: "",
    maxMarks: "",
  };
}

function createInitialForm(test) {
  return {
    name: test?.name ?? "",
    testDate: test?.testDate ?? getTodayDate(),
    examType: test?.examType ?? "",
    marksObtained: test?.marksObtained ?? "",
    maxMarks: test?.maxMarks ?? "",
    marksPerCorrect:
      test?.scoringScheme?.marksPerCorrect ?? "",
    penaltyPerIncorrect:
      test?.scoringScheme?.penaltyPerIncorrect ?? "",
    correct: test?.counts?.correct ?? "",
    incorrect: test?.counts?.incorrect ?? "",
    unanswered: test?.counts?.unanswered ?? "",
    durationMinutes: test?.durationMinutes ?? "",
    notes: test?.notes ?? "",
  };
}

const inputClass =
  "mt-2 w-full rounded-lg border border-stone-200 bg-white px-3.5 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/10";

const labelClass = "text-sm font-medium text-stone-700";

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
      {hint && (
        <span className="mt-1.5 block text-xs text-stone-500">
          {hint}
        </span>
      )}
    </label>
  );
}

export default function TestForm({
  test = null,
  onCancel,
  onCreated,
  onUpdated,
}) {
  const isEditMode = Boolean(test);

  const [form, setForm] = useState(() =>
    createInitialForm(test)
  );

  const [subjects, setSubjects] = useState(
    test?.subjectResults?.length
      ? test.subjectResults.map((subject) => ({
          subjectName: subject.subjectName ?? "",
          marksObtained: subject.marksObtained ?? "",
          maxMarks: subject.maxMarks ?? "",
        }))
      : []
  );

  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(createInitialForm(test));

    setSubjects(
      test?.subjectResults?.length
        ? test.subjectResults.map((subject) => ({
            subjectName: subject.subjectName ?? "",
            marksObtained: subject.marksObtained ?? "",
            maxMarks: subject.maxMarks ?? "",
          }))
        : []
    );
  }, [test]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFieldErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setFormError("");
  }

  function handleAddSubject(subjectName = "") {
    setSubjects((previous) => [
      ...previous,
      {
        ...createEmptySubject(),
        subjectName,
      },
    ]);
  }

  function handleSubjectChange(index, field, value) {
    setSubjects((previous) =>
      previous.map((subject, subjectIndex) =>
        subjectIndex === index
          ? { ...subject, [field]: value }
          : subject
      )
    );

    setFormError("");
  }

  function handleRemoveSubject(index) {
    setSubjects((previous) =>
      previous.filter((_, subjectIndex) => subjectIndex !== index)
    );
  }

  function addNeetSubjects() {
    const existingNames = new Set(
      subjects.map((subject) =>
        subject.subjectName.trim().toLowerCase()
      )
    );

    const missingSubjects = NEET_SUBJECTS.filter(
      (subject) =>
        !existingNames.has(subject.toLowerCase())
    );

    setSubjects((previous) => [
      ...previous,
      ...missingSubjects.map((subjectName) => ({
        ...createEmptySubject(),
        subjectName,
      })),
    ]);
  }

  function validateForm() {
    const errors = {};

    const name = form.name.trim();
    const marksObtained = Number(form.marksObtained);
    const maxMarks = Number(form.maxMarks);

    if (!name) {
      errors.name = "Test name is required.";
    } else if (name.length > 100) {
      errors.name = "Test name cannot exceed 100 characters.";
    }

    if (!form.testDate) {
      errors.testDate = "Test date is required.";
    } else if (form.testDate > getTodayDate()) {
      errors.testDate = "Future test dates are not allowed.";
    }

    if (
      form.marksObtained === "" ||
      !Number.isFinite(marksObtained)
    ) {
      errors.marksObtained = "Enter valid obtained marks.";
    }

    if (
      form.maxMarks === "" ||
      !Number.isFinite(maxMarks) ||
      maxMarks <= 0
    ) {
      errors.maxMarks = "Maximum marks must be greater than zero.";
    }

    if (
      Number.isFinite(marksObtained) &&
      Number.isFinite(maxMarks) &&
      marksObtained > maxMarks
    ) {
      errors.marksObtained =
        "Obtained marks cannot exceed maximum marks.";
    }

    if (form.durationMinutes !== "") {
      const duration = Number(form.durationMinutes);

      if (!Number.isInteger(duration) || duration <= 0) {
        errors.durationMinutes =
          "Duration must be a positive whole number.";
      }
    }

    const countFields = [
      "correct",
      "incorrect",
      "unanswered",
    ];

    for (const field of countFields) {
      if (form[field] !== "") {
        const value = Number(form[field]);

        if (!Number.isInteger(value) || value < 0) {
          errors[field] =
            "Enter a non-negative whole number.";
        }
      }
    }

    if (form.marksPerCorrect !== "") {
      const value = Number(form.marksPerCorrect);

      if (!Number.isFinite(value) || value < 0) {
        errors.marksPerCorrect =
          "Marks per correct answer must be zero or more.";
      }
    }

    if (form.penaltyPerIncorrect !== "") {
      const value = Number(form.penaltyPerIncorrect);

      if (!Number.isFinite(value) || value > 0) {
        errors.penaltyPerIncorrect =
          "Penalty must be zero or a negative number.";
      }
    }

    if (
      marksObtained < 0 &&
      (
        Number(form.penaltyPerIncorrect) >= 0 ||
        form.penaltyPerIncorrect === "" ||
        Number(form.incorrect) <= 0 ||
        form.incorrect === ""
      )
    ) {
      errors.marksObtained =
        "Negative marks require a negative penalty and at least one incorrect answer.";
    }

    if (subjects.length > 0) {
      let subjectMarksTotal = 0;
      let subjectMaxTotal = 0;

      const subjectNames = new Set();

      subjects.forEach((subject, index) => {
        const subjectName = subject.subjectName.trim();
        const obtained = Number(subject.marksObtained);
        const maximum = Number(subject.maxMarks);

        if (!subjectName) {
          errors[`subjectName-${index}`] =
            "Subject name is required.";
        } else if (
          subjectNames.has(subjectName.toLowerCase())
        ) {
          errors[`subjectName-${index}`] =
            "Duplicate subject names are not allowed.";
        }

        subjectNames.add(subjectName.toLowerCase());

        if (
          subject.marksObtained === "" ||
          !Number.isFinite(obtained)
        ) {
          errors[`subjectObtained-${index}`] =
            "Enter obtained marks.";
        }

        if (
          subject.maxMarks === "" ||
          !Number.isFinite(maximum) ||
          maximum <= 0
        ) {
          errors[`subjectMax-${index}`] =
            "Maximum marks must be greater than zero.";
        }

        if (
          Number.isFinite(obtained) &&
          Number.isFinite(maximum) &&
          obtained > maximum
        ) {
          errors[`subjectObtained-${index}`] =
            "Obtained marks cannot exceed maximum marks.";
        }

        if (Number.isFinite(obtained)) {
          subjectMarksTotal += obtained;
        }

        if (Number.isFinite(maximum)) {
          subjectMaxTotal += maximum;
        }
      });

      if (
        subjects.every(
          (subject) =>
            subject.subjectName.trim() &&
            subject.marksObtained !== "" &&
            subject.maxMarks !== ""
        )
      ) {
        if (
          Math.round(subjectMarksTotal * 100) !==
          Math.round(marksObtained * 100)
        ) {
          errors.subjectResults =
            "Subject obtained marks must equal overall obtained marks.";
        }

        if (
          Math.round(subjectMaxTotal * 100) >
          Math.round(maxMarks * 100)
        ) {
          errors.subjectResults =
            "Subject maximum marks cannot exceed overall maximum marks.";
        }
      }
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  }

  function buildPayload() {
    const payload = {
      name: form.name.trim(),
      testDate: form.testDate,
      examType: form.examType || undefined,
      marksObtained: Number(form.marksObtained),
      maxMarks: Number(form.maxMarks),
    };

    const hasScoringScheme =
      form.marksPerCorrect !== "" ||
      form.penaltyPerIncorrect !== "";

    if (hasScoringScheme) {
      payload.scoringScheme = {
        ...(form.marksPerCorrect !== "" && {
          marksPerCorrect: Number(form.marksPerCorrect),
        }),
        ...(form.penaltyPerIncorrect !== "" && {
          penaltyPerIncorrect: Number(
            form.penaltyPerIncorrect
          ),
        }),
      };
    }

    const hasCounts =
      form.correct !== "" ||
      form.incorrect !== "" ||
      form.unanswered !== "";

    if (hasCounts) {
      payload.counts = {
        ...(form.correct !== "" && {
          correct: Number(form.correct),
        }),
        ...(form.incorrect !== "" && {
          incorrect: Number(form.incorrect),
        }),
        ...(form.unanswered !== "" && {
          unanswered: Number(form.unanswered),
        }),
      };
    }

    if (form.durationMinutes !== "") {
      payload.durationMinutes = Number(form.durationMinutes);
    }

    if (form.notes.trim()) {
      payload.notes = form.notes.trim();
    }

    if (subjects.length > 0) {
      payload.subjectResults = subjects.map((subject) => ({
        subjectName: subject.subjectName.trim(),
        marksObtained: Number(subject.marksObtained),
        maxMarks: Number(subject.maxMarks),
      }));
    }

    return payload;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setFormError("");

    if (!validateForm()) {
      setFormError(
        "Please check the highlighted fields and try again."
      );
      return;
    }

    setSaving(true);

    try {
      const payload = buildPayload();

      if (isEditMode) {
        const testId = test._id ?? test.id;

        await apiRequest(`/tests/${testId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });

        onUpdated?.();
      } else {
        await createTestResult(payload);
        onCreated?.();
      }
    } catch (error) {
      setFormError(
        error.message ||
          `Unable to ${isEditMode ? "update" : "save"} test result.`
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-stone-100 px-5 py-5 sm:px-7">
        <div>
          <p className="text-xs font-semibold tracking-wider text-emerald-800">
            TEST PERFORMANCE
          </p>

          <h2 className="mt-1 text-xl font-semibold tracking-tight text-stone-900">
            {isEditMode ? "Edit test result" : "Add test result"}
          </h2>

          <p className="mt-1 text-sm text-stone-500">
            Record your test score and performance details.
          </p>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            aria-label="Close form"
            className="rounded-lg p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
          >
            <X size={19} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-7 p-5 sm:p-7">
        {formError && (
          <div
            role="alert"
            className="flex gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
            />
            <p>{formError}</p>
          </div>
        )}

        {/* Basic information */}
        <div>
          <h3 className="text-sm font-semibold text-stone-900">
            Basic information
          </h3>

          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Test name">
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  maxLength={100}
                  placeholder="e.g. Weekly Mock Test 01"
                  className={inputClass}
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-xs text-red-600">
                    {fieldErrors.name}
                  </p>
                )}
              </Field>
            </div>

            <Field label="Test date">
              <input
                type="date"
                name="testDate"
                value={form.testDate}
                max={getTodayDate()}
                onChange={handleChange}
                className={inputClass}
              />
              {fieldErrors.testDate && (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors.testDate}
                </p>
              )}
            </Field>

            <Field label="Exam type" hint="Optional">
              <select
                name="examType"
                value={form.examType}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select exam type</option>
                <option value="NEET">NEET</option>
                <option value="JEE">JEE</option>
                <option value="UPSC">UPSC</option>
                <option value="Other">Other</option>
              </select>
            </Field>
          </div>
        </div>

        <div className="border-t border-stone-100" />

        {/* Overall score */}
        <div>
          <h3 className="text-sm font-semibold text-stone-900">
            Overall score
          </h3>

          <p className="mt-1 text-xs text-stone-500">
            Enter the final marks shown in your test result.
          </p>

          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <Field label="Marks obtained">
              <input
                type="number"
                step="0.01"
                name="marksObtained"
                value={form.marksObtained}
                onChange={handleChange}
                placeholder="e.g. 520"
                className={inputClass}
              />
              {fieldErrors.marksObtained && (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors.marksObtained}
                </p>
              )}
            </Field>

            <Field label="Maximum marks">
              <input
                type="number"
                min="0.01"
                step="0.01"
                name="maxMarks"
                value={form.maxMarks}
                onChange={handleChange}
                placeholder="e.g. 720"
                className={inputClass}
              />
              {fieldErrors.maxMarks && (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors.maxMarks}
                </p>
              )}
            </Field>

            <Field label="Duration (minutes)" hint="Optional">
              <input
                type="number"
                min="1"
                step="1"
                name="durationMinutes"
                value={form.durationMinutes}
                onChange={handleChange}
                placeholder="e.g. 180"
                className={inputClass}
              />
              {fieldErrors.durationMinutes && (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors.durationMinutes}
                </p>
              )}
            </Field>
          </div>
        </div>

        <div className="border-t border-stone-100" />

        {/* Question analysis */}
        <div>
          <h3 className="text-sm font-semibold text-stone-900">
            Question analysis
          </h3>

          <p className="mt-1 text-xs text-stone-500">
            Optional. Add counts if your test provides them.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Correct", name: "correct" },
              { label: "Incorrect", name: "incorrect" },
              { label: "Unanswered", name: "unanswered" },
            ].map((item) => (
              <Field key={item.name} label={item.label}>
                <input
                  type="number"
                  min="0"
                  step="1"
                  name={item.name}
                  value={form[item.name]}
                  onChange={handleChange}
                  placeholder="0"
                  className={inputClass}
                />
                {fieldErrors[item.name] && (
                  <p className="mt-1 text-xs text-red-600">
                    {fieldErrors[item.name]}
                  </p>
                )}
              </Field>
            ))}
          </div>
        </div>

        <div className="border-t border-stone-100" />

        {/* Scoring scheme */}
        <div>
          <h3 className="text-sm font-semibold text-stone-900">
            Scoring scheme
            <span className="ml-2 text-xs font-normal text-stone-400">
              Optional
            </span>
          </h3>

          <p className="mt-1 text-xs text-stone-500">
            Enter the marking rules used in this particular test.
          </p>

          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <Field label="Marks per correct answer">
              <input
                type="number"
                step="0.01"
                name="marksPerCorrect"
                value={form.marksPerCorrect}
                onChange={handleChange}
                placeholder="e.g. 4"
                className={inputClass}
              />
              {fieldErrors.marksPerCorrect && (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors.marksPerCorrect}
                </p>
              )}
            </Field>

            <Field label="Penalty per incorrect answer">
              <input
                type="number"
                step="0.01"
                name="penaltyPerIncorrect"
                value={form.penaltyPerIncorrect}
                onChange={handleChange}
                placeholder="e.g. -1"
                className={inputClass}
              />
              {fieldErrors.penaltyPerIncorrect && (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors.penaltyPerIncorrect}
                </p>
              )}
            </Field>
          </div>
        </div>

        <div className="border-t border-stone-100" />

        {/* Subject breakdown */}
        <div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-stone-900">
                Subject-wise performance
              </h3>

              <p className="mt-1 text-xs text-stone-500">
                Optional. Subject marks must match the overall score.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleAddSubject()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-xs font-medium text-stone-700 transition hover:bg-stone-50"
            >
              <Plus size={15} />
              Add subject
            </button>
          </div>

          {form.examType === "NEET" && (
            <button
              type="button"
              onClick={addNeetSubjects}
              className="mt-3 text-xs font-medium text-emerald-800 transition hover:text-emerald-950"
            >
              + Add Physics, Chemistry and Biology
            </button>
          )}

          {subjects.length > 0 && (
            <div className="mt-4 space-y-3">
              {subjects.map((subject, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-stone-200 bg-stone-50/70 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-stone-500">
                      SUBJECT {index + 1}
                    </p>

                    <button
                      type="button"
                      onClick={() => handleRemoveSubject(index)}
                      aria-label={`Remove subject ${index + 1}`}
                      className="rounded-md p-1.5 text-stone-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <Field label="Subject name">
                      <input
                        value={subject.subjectName}
                        onChange={(event) =>
                          handleSubjectChange(
                            index,
                            "subjectName",
                            event.target.value
                          )
                        }
                        placeholder="e.g. Physics"
                        className={inputClass}
                      />
                      {fieldErrors[`subjectName-${index}`] && (
                        <p className="mt-1 text-xs text-red-600">
                          {fieldErrors[`subjectName-${index}`]}
                        </p>
                      )}
                    </Field>

                    <Field label="Marks obtained">
                      <input
                        type="number"
                        step="0.01"
                        value={subject.marksObtained}
                        onChange={(event) =>
                          handleSubjectChange(
                            index,
                            "marksObtained",
                            event.target.value
                          )
                        }
                        placeholder="e.g. 140"
                        className={inputClass}
                      />
                      {fieldErrors[`subjectObtained-${index}`] && (
                        <p className="mt-1 text-xs text-red-600">
                          {fieldErrors[`subjectObtained-${index}`]}
                        </p>
                      )}
                    </Field>

                    <Field label="Maximum marks">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={subject.maxMarks}
                        onChange={(event) =>
                          handleSubjectChange(
                            index,
                            "maxMarks",
                            event.target.value
                          )
                        }
                        placeholder="e.g. 180"
                        className={inputClass}
                      />
                      {fieldErrors[`subjectMax-${index}`] && (
                        <p className="mt-1 text-xs text-red-600">
                          {fieldErrors[`subjectMax-${index}`]}
                        </p>
                      )}
                    </Field>
                  </div>
                </div>
              ))}

              {fieldErrors.subjectResults && (
                <p className="text-xs text-red-600">
                  {fieldErrors.subjectResults}
                </p>
              )}
            </div>
          )}

          {subjects.length === 0 && (
            <div className="mt-4 rounded-xl border border-dashed border-stone-300 px-4 py-6 text-center">
              <p className="text-sm text-stone-500">
                No subject breakdown added.
              </p>
              <p className="mt-1 text-xs text-stone-400">
                You can skip this section or add subjects.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-stone-100" />

        {/* Notes */}
        <Field label="Notes" hint="Optional">
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            placeholder="Add observations about this test..."
            className={inputClass}
          />
        </Field>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 border-t border-stone-100 pt-5 sm:flex-row sm:justify-end">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-lg border border-stone-200 px-5 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:opacity-50"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <LoaderCircle size={17} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 size={17} />
                {isEditMode ? "Save changes" : "Save test result"}
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}