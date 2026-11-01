
import {
  ClipboardList,
  Clock3,
  ChartNoAxesCombined,
  ArrowRight,
  CalendarDays,
  BookOpen,
  Target,
  BarChart3,
} from "lucide-react";

const workflowSteps = [
  {
    number: "01",
    label: "PLAN",
    title: "Give your study day a clear structure.",
    description:
      "Create study tasks, organise them by subject, set priorities and choose when you want to complete them.",
    icon: ClipboardList,
    points: [
      "Organise tasks by subject",
      "Set priorities and dates",
      "Manage task status yourself",
    ],
  },
  {
    number: "02",
    label: "TRACK",
    title: "Keep an honest record of your study time.",
    description:
      "Record actual study sessions using the timestamp-based timer or add a session manually when you need to.",
    icon: Clock3,
    points: [
      "Use the study timer",
      "Add manual study sessions",
      "Review your recorded time",
    ],
  },
  {
    number: "03",
    label: "UNDERSTAND",
    title: "See the patterns in your preparation.",
    description:
      "Bring your recorded study time and mock-test results into one place to review your preparation over time.",
    icon: ChartNoAxesCombined,
    points: [
      "Review weekly study trends",
      "Understand subject distribution",
      "Track mock-test performance",
    ],
  },
];

function WorkflowVisual({ step }) {
  const Icon = step.icon;

  return (
    <div className="workflow-visual">
      <div className="workflow-visual-header">
        <div className="workflow-visual-icon">
          <Icon size={19} />
        </div>

        <span>STUDYPULSE / {step.label}</span>
      </div>

      {step.number === "01" && (
        <div className="workflow-mini-content">
          <div className="workflow-mini-heading">
            <div>
              <span>MONDAY, 02 NOV</span>
              <h4>Study plan</h4>
            </div>

            <CalendarDays size={19} />
          </div>

          <div className="workflow-mini-task">
            <span className="workflow-mini-dot" />
            <div>
              <strong>Physics</strong>
              <p>Laws of Motion</p>
            </div>
            <span className="workflow-mini-time">9:00 AM</span>
          </div>

          <div className="workflow-mini-task">
            <span className="workflow-mini-dot" />
            <div>
              <strong>Chemistry</strong>
              <p>Chemical Bonding</p>
            </div>
            <span className="workflow-mini-time">11:00 AM</span>
          </div>

          <div className="workflow-mini-task">
            <span className="workflow-mini-dot" />
            <div>
              <strong>Biology</strong>
              <p>Human Physiology</p>
            </div>
            <span className="workflow-mini-time">2:00 PM</span>
          </div>

          <div className="workflow-mini-footer">
            <Target size={15} />
            <span>Plan your day, one task at a time.</span>
          </div>
        </div>
      )}

      {step.number === "02" && (
        <div className="workflow-mini-content workflow-time-content">
          <span className="workflow-time-label">
            ILLUSTRATIVE STUDY SESSION
          </span>

          <div className="workflow-time-subject">
            <BookOpen size={17} />
            Physics · Laws of Motion
          </div>

          <strong className="workflow-time-display">
            01:25:00
          </strong>

          <span className="workflow-time-caption">
            Recorded study duration
          </span>

          <div className="workflow-time-track">
            <div />
          </div>

          <div className="workflow-time-meta">
            <span>Session record</span>
            <span>Manual or timer</span>
          </div>
        </div>
      )}

      {step.number === "03" && (
        <div className="workflow-mini-content">
          <div className="workflow-mini-heading">
            <div>
              <span>YOUR RECORDS</span>
              <h4>Study overview</h4>
            </div>

            <BarChart3 size={19} />
          </div>

          <div className="workflow-insight-item">
            <span>Recorded study time</span>
            <strong>18h 30m</strong>
          </div>

          <div className="workflow-insight-item">
            <span>Subjects recorded</span>
            <strong>3</strong>
          </div>

          <div className="workflow-insight-item">
            <span>Latest mock test</span>
            <strong>72%</strong>
          </div>

          <div className="workflow-insight-note">
            Illustrative values · Sample data only
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkflowSection() {
  return (
    <section
      className="workflow-section"
      id="workflow"
      aria-labelledby="workflow-heading"
    >
      <div className="landing-container">

        <div className="workflow-intro">
          <span className="section-eyebrow">
            HOW IT WORKS
          </span>

          <h2
            id="workflow-heading"
            className="workflow-heading"
          >
            A simple process.
            <span> A clearer perspective.</span>
          </h2>

          <p className="workflow-description">
            From planning your next study session to reviewing
            your mock-test results, keep your preparation
            organised through three simple steps.
          </p>
        </div>

        <div className="workflow-list">
          {workflowSteps.map((step, index) => {
            const Icon = step.icon;

            return (
              <article
                className={`workflow-step ${
                  index % 2 !== 0 ? "workflow-step-reverse" : ""
                }`}
                key={step.number}
              >
                <div className="workflow-step-content">
                  <div className="workflow-step-label">
                    <span>{step.number}</span>
                    <span>{step.label}</span>
                  </div>

                  <h3>{step.title}</h3>

                  <p className="workflow-step-description">
                    {step.description}
                  </p>

                  <ul className="workflow-step-points">
                    {step.points.map((point) => (
                      <li key={point}>
                        <Icon
                          size={16}
                          aria-hidden="true"
                        />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                <WorkflowVisual step={step} />
              </article>
            );
          })}
        </div>

        <div className="workflow-bottom-note">
          <ArrowRight size={17} />
          <p>
            Planning, recorded effort and test performance
            remain <strong>separate records</strong> that work
            together to give you a clearer picture.
          </p>
        </div>

      </div>
    </section>
  );
}
