
import { useState, createElement, isValidElement } from "react";
import { Info, ChevronDown } from "lucide-react";

function MetricCard({
  title,
  value,
  description,
  calculation,
  icon,
  className = "",
}) {
  const [showCalculation, setShowCalculation] = useState(false);

  const hasValue =
    value !== null &&
    value !== undefined &&
    value !== "";

  // Supports both JSX elements and component references.
  const iconElement = icon
    ? isValidElement(icon)
      ? icon
      : createElement(icon, {
          size: 18,
          strokeWidth: 1.8,
        })
    : null;

  const toggleCalculation = () => {
    setShowCalculation((previous) => !previous);
  };

  return (
    <article
      className={`rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-muted-foreground/30 ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {iconElement && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              {iconElement}
            </div>
          )}

          <h3 className="text-sm font-medium text-muted-foreground">
            {title}
          </h3>
        </div>

        {calculation && (
          <button
            type="button"
            onClick={toggleCalculation}
            aria-expanded={showCalculation}
            aria-label={`How is ${title} calculated?`}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Info size={17} />
          </button>
        )}
      </div>

      {/* Metric value */}
      <div className="mt-5">
        <p
          className={`text-3xl font-semibold tracking-tight ${
            hasValue
              ? "text-foreground"
              : "text-muted-foreground"
          }`}
        >
          {hasValue ? value : "—"}
        </p>

        {description && (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {/* Calculation explanation */}
      {calculation && (
        <div className="mt-5 border-t border-border pt-3">
          <button
            type="button"
            onClick={toggleCalculation}
            aria-expanded={showCalculation}
            className="flex w-full items-center justify-between gap-2 text-left text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <span>How is this calculated?</span>

            <ChevronDown
              size={15}
              className={`shrink-0 transition-transform duration-200 ${
                showCalculation ? "rotate-180" : ""
              }`}
            />
          </button>

          {showCalculation && (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {calculation}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

export default MetricCard;
