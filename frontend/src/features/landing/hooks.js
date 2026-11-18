import { useEffect, useRef, useState, useSyncExternalStore } from "react";

// Subscribes to a CSS media query (for example "(min-width: 640px)").
export function useMediaQuery(query) {
  return useSyncExternalStore(
    (callback) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", callback);

      return () => media.removeEventListener("change", callback);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}

export function usePrefersReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

// Tells us when an element is on screen. Uses one IntersectionObserver per
// element (no scroll listeners). With once=true it fires a single time.
export function useInView({
  threshold = 0.2,
  rootMargin = "0px 0px -8% 0px",
  once = true,
} = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(
    () => typeof IntersectionObserver === "undefined"
  );

  useEffect(() => {
    const element = ref.current;

    if (!element || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);

          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return [ref, inView];
}

// Counts seconds while `running` is true (used by the sample timers).
export function useClock(startSeconds, running) {
  const [seconds, setSeconds] = useState(startSeconds);

  useEffect(() => {
    if (!running) return undefined;

    const id = setInterval(() => setSeconds((value) => value + 1), 1000);

    return () => clearInterval(id);
  }, [running]);

  return [seconds, setSeconds];
}

export function formatClock(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));

  return [
    Math.floor(seconds / 3600),
    Math.floor((seconds % 3600) / 60),
    seconds % 60,
  ]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

export function formatMinutes(minutes) {
  const total = Math.round(minutes);
  const hours = Math.floor(total / 60);
  const rest = total % 60;

  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;

  return `${hours}h ${rest}m`;
}
