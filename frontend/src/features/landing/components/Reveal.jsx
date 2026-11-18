import { useInView } from "../hooks";

// Wraps content so it fades and rises once when it scrolls into view.
// The CSS for [data-reveal] / [data-in] lives in landing.css and only applies
// when motion is allowed, so reduced-motion visitors always see the content.
export default function Reveal({
  as: Tag = "div",
  delay = 0,
  className = "",
  children,
  ...rest
}) {
  const [ref, inView] = useInView();

  return (
    <Tag
      ref={ref}
      data-reveal=""
      data-in={inView ? "true" : "false"}
      style={{ "--reveal-delay": `${delay}ms` }}
      className={className}
      {...rest}
    >
      {children}
    </Tag>
  );
}
