
import {
  ShieldCheck,
  Heart,
  ChartNoAxesCombined,
  ClipboardList,
  Clock3,
  FileCheck2,
  ArrowRight,
} from "lucide-react";

const principles = [
  {
    number: "01",
    icon: ClipboardList,
    title: "A plan is an intention.",
    description:
      "Your tasks represent what you intend to study. Completing a task is a status update, not proof of recorded study time.",
  },
  {
    number: "02",
    icon: Clock3,
    title: "Study time is a record.",
    description:
      "Your study sessions represent the time you actually record. Planned hours and recorded hours are kept separate.",
  },
  {
    number: "03",
    icon: FileCheck2,
    title: "A test is a result.",
    description:
      "Your mock-test results represent your performance in a particular test, not a measure of your overall worth or effort.",
  },
];

export default function PhilosophySection() {
  return (
    <section
      className="philosophy-section"
      id="our-approach"
      aria-labelledby="philosophy-heading"
    >
      <div className="landing-container">

        <div className="philosophy-layout">

          <div className="philosophy-content">
            <span className="section-eyebrow">
              OUR APPROACH
            </span>

            <h2
              id="philosophy-heading"
              className="philosophy-heading"
            >
              Progress should be
              <span> understood, not judged.</span>
            </h2>

            <p className="philosophy-description">
              Preparation is not just about how many hours
              you study or what score you achieve. It is
              about understanding your own patterns through
              honest, consistent records.
            </p>

            <div className="philosophy-values">
              <div className="philosophy-value">
                <div className="philosophy-value-icon">
                  <ShieldCheck size={19} />
                </div>

                <div>
                  <h3>Honest records</h3>
                  <p>
                    Your analytics reflect the information
                    you actually record.
                  </p>
                </div>
              </div>

              <div className="philosophy-value">
                <div className="philosophy-value-icon">
                  <Heart size={19} />
                </div>

                <div>
                  <h3>No unnecessary pressure</h3>
                  <p>
                    Missed days are not a reason for judgment.
                    Your records are there to help you reflect.
                  </p>
                </div>
              </div>

              <div className="philosophy-value">
                <div className="philosophy-value-icon">
                  <ChartNoAxesCombined size={19} />
                </div>

                <div>
                  <h3>Clarity over assumptions</h3>
                  <p>
                    We show recorded information without
                    inventing predictions or progress scores.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="philosophy-visual">

            <div className="philosophy-visual-header">
              <span>THE STUDYPULSE PRINCIPLE</span>
              <ArrowRight size={18} />
            </div>

            <div className="philosophy-principle">
              <span>THREE RECORDS</span>

              <div className="philosophy-record">
                <div className="philosophy-record-icon">
                  <ClipboardList size={20} />
                </div>

                <div>
                  <strong>Planned tasks</strong>
                  <span>What you intend to study</span>
                </div>

                <span className="philosophy-record-tag">
                  PLAN
                </span>
              </div>

              <div className="philosophy-record">
                <div className="philosophy-record-icon">
                  <Clock3 size={20} />
                </div>

                <div>
                  <strong>Study sessions</strong>
                  <span>What you actually record</span>
                </div>

                <span className="philosophy-record-tag">
                  TIME
                </span>
              </div>

              <div className="philosophy-record">
                <div className="philosophy-record-icon">
                  <FileCheck2 size={20} />
                </div>

                <div>
                  <strong>Mock-test results</strong>
                  <span>How you performed in a test</span>
                </div>

                <span className="philosophy-record-tag">
                  RESULT
                </span>
              </div>

              <div className="philosophy-visual-divider" />

              <div className="philosophy-conclusion">
                <span>THE BIGGER PICTURE</span>
                <strong>
                  Understand your preparation through
                  the records you create.
                </strong>
              </div>
            </div>

            <div className="philosophy-visual-footer">
              <ShieldCheck size={16} />
              <span>Built around clarity, not pressure.</span>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
