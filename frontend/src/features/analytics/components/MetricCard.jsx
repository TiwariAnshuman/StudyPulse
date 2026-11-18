import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

// One number with its name, a short description and a formula explanation.
// "How is this calculated?" is required by the product spec (FR-ANL-06).
function MetricCard({ title, value, description, calculation, className = "" }) {
  const [showCalculation, setShowCalculation] = useState(false);
  const panelId = useId();

  const hasValue = value !== null && value !== undefined && value !== "";

  return (
    <article className={`card flex flex-col p-4 ${className}`}>
      <h3 className="text-sm font-medium leading-5 text-muted">{title}</h3>

      <p
        className={`mt-2 text-[25px] font-semibold leading-tight tracking-tight ${
          hasValue ? "text-ink" : "text-muted"
        }`}
      >
        {hasValue ? value : "—"}
      </p>

      {description && (
        <p className="mt-1.5 text-xs leading-5 text-muted">{description}</p>
      )}

      {calculation && (
        <div className="mt-auto pt-2">
          <button
            type="button"
            onClick={() => setShowCalculation((previous) => !previous)}
            aria-expanded={showCalculation}
            aria-controls={panelId}
            className="-mx-1 flex min-h-11 w-[calc(100%+0.5rem)] items-center justify-between gap-2 rounded-control px-1 text-left text-xs font-medium text-primary hover:bg-primary-subtle"
          >
            <span>How is this calculated?</span>

            <ChevronDown
              size={16}
              className={`shrink-0 transition-transform duration-200 ${
                showCalculation ? "rotate-180" : ""
              }`}
            />
          </button>

          {showCalculation && (
            <p
              id={panelId}
              className="mt-1 rounded-control bg-canvas p-3 text-sm leading-5 text-ink"
            >
              {calculation}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

export default MetricCard;
