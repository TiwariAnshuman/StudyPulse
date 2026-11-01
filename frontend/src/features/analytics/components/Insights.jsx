
import { useState } from "react";
import {
  Lightbulb,
  Info,
  ChevronDown,
  ChevronUp,
  BookOpen,
  CalendarDays,
  BarChart3,
} from "lucide-react";

function formatValue(value) {
  if (value === null || value === undefined) {
    return "Not available";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    if (!value.length) return "None";

    return value.map(formatValue).join(", ");
  }

  if (typeof value === "object") {
    return Object.entries(value)
      .map(([key, item]) => {
        const label = key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (char) => char.toUpperCase());

        return `${label}: ${formatValue(item)}`;
      })
      .join(" · ");
  }

  return String(value);
}

function MetadataItem({ icon: Icon, label, value }) {
  if (value === null || value === undefined) return null;

  return (
    <div className="flex items-start gap-2">
      <Icon
        size={15}
        className="mt-0.5 shrink-0 text-muted-foreground"
      />

      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">
          {label}
        </p>

        <p className="mt-0.5 break-words text-sm font-medium text-foreground">
          {formatValue(value)}
        </p>
      </div>
    </div>
  );
}

function EvidenceSection({ evidence }) {
  const [expanded, setExpanded] = useState(false);

  if (
    evidence === null ||
    evidence === undefined ||
    (Array.isArray(evidence) && evidence.length === 0) ||
    (typeof evidence === "object" &&
      !Array.isArray(evidence) &&
      Object.keys(evidence).length === 0)
  ) {
    return null;
  }

  return (
    <div className="border-t border-border pt-3">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          <BarChart3
            size={16}
            className="text-muted-foreground"
          />
          Supporting evidence
        </span>

        {expanded ? (
          <ChevronUp size={17} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={17} className="text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="mt-3 rounded-lg bg-muted/30 p-3">
          {typeof evidence === "object" &&
          !Array.isArray(evidence) ? (
            <div className="space-y-3">
              {Object.entries(evidence).map(([key, value]) => (
                <div key={key}>
                  <p className="text-xs font-medium text-muted-foreground">
                    {key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (char) => char.toUpperCase())}
                  </p>

                  <p className="mt-1 break-words text-sm text-foreground">
                    {formatValue(value)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words text-sm text-foreground">
              {formatValue(evidence)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function InsightCard({ insight }) {
  return (
    <article className="rounded-xl border border-border bg-card p-4 sm:p-5">
      {/* Insight heading */}
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <Lightbulb size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground">
            {insight.title || "Study observation"}
          </h3>

          {insight.ruleId && (
            <p className="mt-1 text-xs text-muted-foreground">
              Rule: {insight.ruleId}
            </p>
          )}
        </div>
      </div>

      {/* Observation */}
      {insight.observation && (
        <p className="mt-4 text-sm leading-6 text-foreground">
          {insight.observation}
        </p>
      )}

      {/* Metadata */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MetadataItem
          icon={CalendarDays}
          label="Data window"
          value={insight.dateWindow}
        />

        <MetadataItem
          icon={BookOpen}
          label="Sample size"
          value={insight.sampleSize}
        />
      </div>

      {/* Evidence */}
      <div className="mt-4">
        <EvidenceSection evidence={insight.evidence} />
      </div>

      {/* Caveat */}
      {insight.caveat && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3">
          <Info
            size={16}
            className="mt-0.5 shrink-0 text-muted-foreground"
          />

          <div>
            <p className="text-xs font-semibold text-foreground">
              Important context
            </p>

            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              {insight.caveat}
            </p>
          </div>
        </div>
      )}
    </article>
  );
}

export default function Insights({ data }) {
  const insights = Array.isArray(data?.insights)
    ? data.insights
    : [];

  return (
    <section className="space-y-4">
      {/* Section heading */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Lightbulb
              size={19}
              className="text-muted-foreground"
            />

            <h2 className="font-semibold text-foreground">
              Study insights
            </h2>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Observations based on your recorded study data.
          </p>
        </div>

        {insights.length > 0 && (
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {insights.length}{" "}
            {insights.length === 1 ? "insight" : "insights"}
          </span>
        )}
      </div>

      {/* Empty state */}
      {insights.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-5 py-9 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <Lightbulb
              size={23}
              className="text-muted-foreground"
            />
          </div>

          <h3 className="mt-4 font-semibold text-foreground">
            Not enough data for insights yet
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Keep recording your study sessions and test results.
            Once enough data is available, StudyPulse will show
            evidence-based observations here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {insights.map((insight, index) => (
            <InsightCard
              key={insight.ruleId || index}
              insight={insight}
            />
          ))}
        </div>
      )}

      {/* Transparency note */}
      <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
        <Info size={14} className="mt-0.5 shrink-0" />

        Insights describe patterns in recorded data. They do not
        establish causes or predict future exam performance.
      </p>
    </section>
  );
}
