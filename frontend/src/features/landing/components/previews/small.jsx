// Small shared pieces used by several previews.

export function SampleBadge({ className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-control bg-attention-subtle px-2 py-0.5 text-xs font-medium text-attention-ink ${className}`}
    >
      Sample data
    </span>
  );
}

const STATUS_STYLES = {
  Completed: "bg-primary-subtle text-primary",
  "In progress": "bg-attention-subtle text-attention-ink",
  "To do": "bg-tint text-muted",
};

// Status text is always shown, so meaning never depends on colour alone.
export function StatusChip({ status }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-control px-2 py-0.5 text-xs font-medium ${
        STATUS_STYLES[status] ?? STATUS_STYLES["To do"]
      }`}
    >
      {status}
    </span>
  );
}

export function SubjectDot({ color }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-2 w-2 shrink-0 rounded-full"
      style={{ backgroundColor: color }}
    />
  );
}
