import { latestTest, testTrend, SUBJECT_COLORS } from "../../sampleData";
import { TrendLine } from "./charts";

// Mock-test sample: reported values and calculated values are shown apart.
export default function MockTestPreview() {
  const test = latestTest;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-4">
        <div className="rounded-panel border border-line bg-surface p-4">
          <p className="text-xs text-muted">
            {test.name} · {test.date}
          </p>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted">Reported marks</p>
              <p className="mt-1 text-xl font-semibold text-ink">
                {test.marks} / {test.max}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted">Calculated percentage</p>
              <p className="mt-1 text-xl font-semibold text-ink">{test.percent}%</p>
            </div>
          </div>
        </div>

        <div className="rounded-panel border border-line bg-surface p-4">
          <p className="text-sm font-semibold text-ink">Subject-wise marks</p>

          <ul className="mt-3 space-y-3">
            {test.subjects.map((item, index) => {
              const percent = ((item.marks / item.max) * 100).toFixed(1);

              return (
                <li key={item.subject}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                    <span className="text-ink">{item.subject}</span>
                    <span className="text-muted">
                      {item.marks} / {item.max} · {percent}%
                    </span>
                  </div>

                  <div className="h-2.5 overflow-hidden rounded-full bg-tint">
                    <div
                      className="lp-hbar h-full rounded-full"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: SUBJECT_COLORS[item.subject],
                        "--i": index,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-panel border border-line bg-surface p-4">
            <p className="text-xs text-muted">Accuracy</p>
            <p className="mt-1 text-xl font-semibold text-ink">{test.accuracy}%</p>
            <p className="mt-1 text-xs text-muted">
              {test.correct} correct of {test.attempted} attempted
            </p>
          </div>

          <div className="rounded-panel border border-line bg-surface p-4">
            <p className="text-xs text-muted">Attempt rate</p>
            <p className="mt-1 text-xl font-semibold text-ink">{test.attemptRate}%</p>
            <p className="mt-1 text-xs text-muted">
              {test.attempted} of {test.totalQuestions} questions
            </p>
          </div>
        </div>

        <p className="text-xs text-muted">
          Accuracy and attempt rate appear only when the question counts are
          valid. Otherwise they stay hidden, not shown as zero.
        </p>
      </div>

      <div className="rounded-panel border border-line bg-surface p-4">
        <p className="text-sm font-semibold text-ink">Score trend</p>
        <p className="mt-1 text-xs text-muted">Percentage in each test</p>

        <div className="mt-8">
          <TrendLine points={testTrend} />
        </div>

        <p className="mt-4 text-xs text-muted">
          Four tests is a small sample. This shows a pattern in your records,
          not a cause.
        </p>
      </div>
    </div>
  );
}
