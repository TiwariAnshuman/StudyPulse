// StudyPulse logo mark, used in the sidebar, login and registration pages.

export default function Brand({ className = "" }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <span
        aria-hidden="true"
        className="flex h-9 w-9 items-center justify-center rounded-control bg-primary text-lg font-semibold text-white"
      >
        S
      </span>

      <span className="text-lg font-semibold tracking-tight text-ink">
        StudyPulse
      </span>
    </span>
  );
}
