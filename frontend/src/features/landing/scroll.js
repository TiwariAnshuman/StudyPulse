// Smooth anchor navigation that respects "reduce motion".
export function scrollToId(id) {
  const target = document.getElementById(id);

  if (!target) return;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  target.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "start",
  });

  // Keep the address bar in sync without triggering a router navigation.
  window.history.replaceState(null, "", `#${id}`);
}
