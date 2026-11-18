// Shared page shell so every page has the same width, padding and title style.

// narrow keeps list and form pages to a readable width, but still left-aligned
// so page titles stay in the same place when you move between pages.
export function PageContainer({ children, narrow = false, className = "" }) {
  return (
    <div
      className={`mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8 ${className}`}
    >
      {narrow ? <div className="max-w-4xl">{children}</div> : children}
    </div>
  );
}

export function PageHeader({ title, description, actions }) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[25px] font-semibold leading-tight tracking-tight sm:text-[32px]">
          {title}
        </h1>

        {description && (
          <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted">
            {description}
          </p>
        )}
      </div>

      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
