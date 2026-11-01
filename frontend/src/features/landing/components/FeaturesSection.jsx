
import {
  CalendarDays,
  Clock3,
  ClipboardCheck,
  ChartNoAxesCombined,
  Check,
  Circle,
  BookOpen,
  ArrowUpRight,
  Target,
} from "lucide-react";

const features = [
  {
    number: "01",
    label: "STUDY PLANNER",
    title: "Give your study day a clear structure.",
    description:
      "Organise your preparation into manageable tasks. Add subjects, topics, priorities and dates so you know what you intend to study.",
    points: [
      "Organise tasks by subject",
      "Set priorities and planned dates",
      "Manage task status independently",
    ],
    icon: CalendarDays,
  },
  {
    number: "02",
    label: "FOCUS TIMER",
    title: "Keep an honest record of your study time.",
    description:
      "Track the time you actually spend studying. Use the timer for live sessions or add a manual session when you need to record time later.",
    points: [
      "Record timestamp-based sessions",
      "Add study time manually",
      "Review your session history",
    ],
    icon: Clock3,
  },
  {
    number: "03",
    label: "MOCK-TEST TRACKING",
    title: "Keep your test performance organised.",
    description:
      "Record your mock-test results and review your scores over time. Keep your test performance separate from your study-time records.",
    points: [
      "Record test details and results",
      "Use configurable scoring",
      "Review performance over time",
    ],
    icon: ClipboardCheck,
  },
  {
    number: "04",
    label: "STUDY ANALYTICS",
    title: "Understand the patterns in your preparation.",
    description:
      "Review your recorded study time, subject distribution and test performance through clear, understandable analytics.",
    points: [
      "Explore weekly study trends",
      "Review subject-wise time",
      "Understand mock-test results",
    ],
    icon: ChartNoAxesCombined,
  },
];

function FeatureVisual({ number }) {
  if (number === "01") {
    return (
      <div className="feature-visual">
        <div className="feature-visual-header">
          <div>
            <span>YOUR PLANNER</span>
            <h4>Study tasks</h4>
          </div>
          <CalendarDays size={20} />
        </div>

        <div className="feature-planner-date">
          Monday <span>02 November</span>
        </div>

        <div className="feature-planner-task">
          <div className="feature-task-check">
            <Check size={14} />
          </div>
          <div className="feature-task-details">
            <strong>Physics</strong>
            <span>Laws of Motion</span>
          </div>
          <span className="feature-task-status">Completed</span>
        </div>

        <div className="feature-planner-task">
          <div className="feature-task-check feature-task-pending">
            <Circle size={14} />
          </div>
          <div className="feature-task-details">
            <strong>Chemistry</strong>
            <span>Chemical Bonding</span>
          </div>
          <span className="feature-task-status">Pending</span>
        </div>

        <div className="feature-planner-task">
          <div className="feature-task-check feature-task-pending">
            <Circle size={14} />
          </div>
          <div className="feature-task-details">
            <strong>Biology</strong>
            <span>Human Physiology</span>
          </div>
          <span className="feature-task-status">Pending</span>
        </div>

        <div className="feature-visual-footer">
          <Target size={15} />
          <span>Illustrative planner preview</span>
        </div>
      </div>
    );
  }

  if (number === "02") {
    return (
      <div className="feature-visual feature-timer-visual">
        <div className="feature-visual-header">
          <div>
            <span>STUDY SESSION</span>
            <h4>Focus on your work.</h4>
          </div>
          <Clock3 size={20} />
        </div>

        <div className="feature-timer-center">
          <span>PHYSICS · LAWS OF MOTION</span>
          <strong>01:25:00</strong>
          <p>Illustrative session duration</p>
        </div>

        <div className="feature-timer-progress">
          <div />
        </div>

        <div className="feature-timer-meta">
          <div>
            <span>SESSION TYPE</span>
            <strong>Focused study</strong>
          </div>
          <div>
            <span>RECORDING</span>
            <strong>Demo preview</strong>
          </div>
        </div>
      </div>
    );
  }

  if (number === "03") {
    return (
      <div className="feature-visual">
        <div className="feature-visual-header">
          <div>
            <span>TEST RECORD</span>
            <h4>Mock-test overview</h4>
          </div>
          <ClipboardCheck size={20} />
        </div>

        <div className="feature-test-summary">
          <span>ILLUSTRATIVE TEST</span>
          <h4>Full Syllabus Mock Test</h4>
          <p>NEET · Practice test</p>
        </div>

        <div className="feature-test-score">
          <div>
            <span>RECORDED SCORE</span>
            <strong>512 / 720</strong>
          </div>
          <div className="feature-test-percentage">
            71.1%
          </div>
        </div>

        <div className="feature-test-breakdown">
          <div>
            <span>Correct</span>
            <strong>132</strong>
          </div>
          <div>
            <span>Incorrect</span>
            <strong>28</strong>
          </div>
          <div>
            <span>Unattempted</span>
            <strong>20</strong>
          </div>
        </div>

        <div className="feature-visual-footer">
          <span>Sample values · Not real student results</span>
        </div>
      </div>
    );
  }

  return (
    <div className="feature-visual">
      <div className="feature-visual-header">
        <div>
          <span>STUDY ANALYTICS</span>
          <h4>Your recorded activity</h4>
        </div>
        <ChartNoAxesCombined size={20} />
      </div>

      <div className="feature-analytics-stat">
        <div>
          <span>RECORDED STUDY TIME</span>
          <strong>18h 30m</strong>
        </div>
        <span className="feature-analytics-period">THIS WEEK</span>
      </div>

      <div className="feature-analytics-bars">
        {[45, 68, 52, 85, 62, 95, 40].map((height, index) => (
          <div className="feature-analytics-bar-column" key={index}>
            <div className="feature-analytics-bar-track">
              <div style={{ height: `${height}%` }} />
            </div>
            <span>{["M", "T", "W", "T", "F", "S", "S"][index]}</span>
          </div>
        ))}
      </div>

      <div className="feature-analytics-subjects">
        <div>
          <span>Physics</span>
          <strong>8h 20m</strong>
        </div>
        <div>
          <span>Chemistry</span>
          <strong>6h 10m</strong>
        </div>
        <div>
          <span>Biology</span>
          <strong>4h 00m</strong>
        </div>
      </div>

      <div className="feature-visual-footer">
        <span>Illustrative analytics preview</span>
      </div>
    </div>
  );
}

export default function FeaturesSection() {
  return (
    <section
      className="features-section"
      id="features"
      aria-labelledby="features-heading"
    >
      <div className="landing-container">

        <div className="features-intro">
          <span className="section-eyebrow">
            WHAT YOU CAN DO
          </span>

          <h2
            id="features-heading"
            className="features-heading"
          >
            Everything connected.
            <span> Nothing complicated.</span>
          </h2>

          <p className="features-description">
            Four essential parts of your preparation,
            brought together in one personal study workspace.
          </p>
        </div>

        <div className="features-list">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <article
                className={`feature-row ${
                  index % 2 !== 0 ? "feature-row-reverse" : ""
                }`}
                key={feature.number}
              >
                <div className="feature-content">
                  <div className="feature-label">
                    <span>{feature.number}</span>
                    <span>{feature.label}</span>
                  </div>

                  <h3>{feature.title}</h3>

                  <p className="feature-description">
                    {feature.description}
                  </p>

                  <ul className="feature-points">
                    {feature.points.map((point) => (
                      <li key={point}>
                        <Check
                          size={16}
                          aria-hidden="true"
                        />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                <FeatureVisual number={feature.number} />
              </article>
            );
          })}
        </div>

        <div className="features-bottom-note">
          <BookOpen size={18} />
          <p>
            Your plan, recorded study time and test results
            remain separate records — so your analytics
            reflect the data you actually enter.
          </p>
        </div>

      </div>
    </section>
  );
}
