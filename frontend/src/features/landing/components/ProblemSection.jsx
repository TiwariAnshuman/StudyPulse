
import {
  ClipboardList,
  Clock3,
  ChartNoAxesCombined,
  ArrowRight,
} from "lucide-react";

const problemPoints = [
  {
    number: "01",
    icon: ClipboardList,
    title: "Planning",
    question: "What did I intend to study?",
    description:
      "Keep your study tasks, subjects and priorities organised in one place.",
  },
  {
    number: "02",
    icon: Clock3,
    title: "Actual effort",
    question: "What did I actually study?",
    description:
      "Record the time you spend studying through sessions, not just planned hours.",
  },
  {
    number: "03",
    icon: ChartNoAxesCombined,
    title: "Performance",
    question: "How did I perform in my tests?",
    description:
      "Keep mock-test results organised so you can review your performance over time.",
  },
];

export default function ProblemSection() {
  return (
    <section
      className="problem-section"
      id="problem"
      aria-labelledby="problem-heading"
    >
      <div className="landing-container">

        {/* Section introduction */}
        <div className="problem-intro">
          <span className="section-eyebrow">
            THE BIGGER PICTURE
          </span>

          <h2
            id="problem-heading"
            className="problem-heading"
          >
            Your preparation is connected.
            <span> Your records should be too.</span>
          </h2>

          <p className="problem-description">
            Study plans, actual study time and mock-test
            results often live in different places. StudyPulse
            brings these records together, helping you
            understand your preparation more clearly.
          </p>
        </div>

        {/* Three important dimensions */}
        <div className="problem-grid">
          {problemPoints.map((point) => {
            const Icon = point.icon;

            return (
              <article
                className="problem-card"
                key={point.number}
              >
                <div className="problem-card-top">
                  <span className="problem-number">
                    {point.number}
                  </span>

                  <div className="problem-icon">
                    <Icon size={21} aria-hidden="true" />
                  </div>
                </div>

                <div className="problem-card-content">
                  <h3>{point.title}</h3>

                  <p className="problem-question">
                    {point.question}
                  </p>

                  <p className="problem-card-description">
                    {point.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        {/* Core product principle */}
        <div className="problem-bottom-note">
          <div className="problem-note-icon">
            <ArrowRight size={18} aria-hidden="true" />
          </div>

          <p>
            Three different aspects of preparation.
            <strong> One clearer picture.</strong>
          </p>
        </div>

      </div>
    </section>
  );
}
