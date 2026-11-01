
import { useState } from "react";
import {
  CalendarDays,
  Clock3,
  ChartNoAxesCombined,
  Check,
  Circle,
  Play,
  ArrowUpRight,
  BookOpen,
  TrendingUp,
} from "lucide-react";

const tabs = [
  {
    id: "planner",
    label: "Planner",
    icon: CalendarDays,
  },
  {
    id: "timer",
    label: "Timer",
    icon: Clock3,
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: ChartNoAxesCombined,
  },
];

function PlannerPreview() {
  const tasks = [
    {
      subject: "Physics",
      topic: "Laws of Motion",
      time: "9:00 AM",
      status: "completed",
    },
    {
      subject: "Chemistry",
      topic: "Chemical Bonding",
      time: "11:00 AM",
      status: "progress",
    },
    {
      subject: "Biology",
      topic: "Human Physiology",
      time: "2:00 PM",
      status: "pending",
    },
  ];

  return (
    <div className="walkthrough-panel-content">
      <div className="walkthrough-panel-heading">
        <div>
          <p className="walkthrough-label">YOUR STUDY PLAN</p>
          <h3>Today's tasks</h3>
        </div>

        <span className="walkthrough-date">MON, 02 NOV</span>
      </div>

      <div className="walkthrough-task-list">
        {tasks.map((task) => (
          <div className="walkthrough-task" key={task.topic}>
            <div className="walkthrough-task-icon">
              {task.status === "completed" ? (
                <Check size={17} />
              ) : (
                <BookOpen size={17} />
              )}
            </div>

            <div className="walkthrough-task-details">
              <span className="walkthrough-subject">
                {task.subject}
              </span>

              <p>{task.topic}</p>
              <span className="walkthrough-task-time">
                {task.time}
              </span>
            </div>

            <span
              className={`walkthrough-status status-${task.status}`}
            >
              {task.status === "completed"
                ? "Completed"
                : task.status === "progress"
                  ? "In progress"
                  : "Pending"}
            </span>
          </div>
        ))}
      </div>

      <div className="walkthrough-panel-footer">
        <span>3 tasks planned</span>
        <span>1 completed</span>
      </div>
    </div>
  );
}

function TimerPreview() {
  return (
    <div className="walkthrough-panel-content walkthrough-timer-content">
      <div className="walkthrough-panel-heading">
        <div>
          <p className="walkthrough-label">STUDY SESSION</p>
          <h3>Keep track of your effort.</h3>
        </div>

        <span className="walkthrough-live-indicator">
          <span />
          DEMO
        </span>
      </div>

      <div className="walkthrough-timer-display">
        <span className="walkthrough-timer-subject">
          <BookOpen size={16} />
          Physics · Laws of Motion
        </span>

        <strong>00:45:00</strong>

        <span className="walkthrough-timer-caption">
          Illustrative recorded duration
        </span>
      </div>

      <div className="walkthrough-timer-progress">
        <div />
      </div>

      <div className="walkthrough-timer-bottom">
        <div>
          <span className="walkthrough-label">SESSION TYPE</span>
          <p>Focused study</p>
        </div>

        <div>
          <span className="walkthrough-label">SUBJECT</span>
          <p>Physics</p>
        </div>

        <span className="walkthrough-demo-control">
          <Play size={14} fill="currentColor" />
          Preview
        </span>
      </div>
    </div>
  );
}

function AnalyticsPreview() {
  const weeklyData = [
    { day: "M", height: 45 },
    { day: "T", height: 72 },
    { day: "W", height: 55 },
    { day: "T", height: 88 },
    { day: "F", height: 64 },
    { day: "S", height: 95 },
    { day: "S", height: 40 },
  ];

  const subjects = [
    { name: "Physics", time: "8h 20m", width: "75%" },
    { name: "Chemistry", time: "6h 10m", width: "58%" },
    { name: "Biology", time: "4h 30m", width: "42%" },
  ];

  return (
    <div className="walkthrough-panel-content">
      <div className="walkthrough-panel-heading">
        <div>
          <p className="walkthrough-label">YOUR STUDY RECORD</p>
          <h3>Understand your progress.</h3>
        </div>

        <span className="walkthrough-date">THIS WEEK</span>
      </div>

      <div className="walkthrough-analytics-summary">
        <div>
          <span className="walkthrough-label">RECORDED TIME</span>
          <strong>19h 00m</strong>
        </div>

        <div className="walkthrough-trend">
          <TrendingUp size={16} />
          <span>Illustrative data</span>
        </div>
      </div>

      <div className="walkthrough-chart">
        {weeklyData.map((item, index) => (
          <div className="walkthrough-chart-column" key={index}>
            <div className="walkthrough-chart-bar-wrapper">
              <div
                className="walkthrough-chart-bar"
                style={{ height: `${item.height}%` }}
              />
            </div>

            <span>{item.day}</span>
          </div>
        ))}
      </div>

      <div className="walkthrough-subject-breakdown">
        <div className="walkthrough-breakdown-heading">
          <span>Subject distribution</span>
          <ArrowUpRight size={16} />
        </div>

        {subjects.map((subject) => (
          <div className="walkthrough-subject-row" key={subject.name}>
            <div className="walkthrough-subject-info">
              <span>{subject.name}</span>
              <span>{subject.time}</span>
            </div>

            <div className="walkthrough-subject-track">
              <div style={{ width: subject.width }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProductWalkthrough() {
  const [activeTab, setActiveTab] = useState("planner");

  function renderActivePreview() {
    switch (activeTab) {
      case "timer":
        return <TimerPreview />;

      case "analytics":
        return <AnalyticsPreview />;

      default:
        return <PlannerPreview />;
    }
  }

  return (
    <div className="product-walkthrough">
      {/* Demo window header */}
      <div className="walkthrough-window-header">
        <div className="walkthrough-window-dots">
          <span />
          <span />
          <span />
        </div>

        <span className="walkthrough-window-title">
          StudyPulse
        </span>

        <span className="walkthrough-demo-badge">
          PRODUCT PREVIEW
        </span>
      </div>

      {/* Tab navigation */}
      <div
        className="walkthrough-tabs"
        role="tablist"
        aria-label="Explore StudyPulse features"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`walkthrough-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls="walkthrough-tab-panel"
              tabIndex={isActive ? 0 : -1}
              className={`walkthrough-tab ${
                isActive ? "active" : ""
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={16} aria-hidden="true" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active preview */}
      <div
        id="walkthrough-tab-panel"
        role="tabpanel"
        aria-labelledby={`walkthrough-tab-${activeTab}`}
        className="walkthrough-tab-panel"
        key={activeTab}
      >
        {renderActivePreview()}
      </div>

      {/* Demo disclaimer */}
      <div className="walkthrough-disclaimer">
        <Circle size={8} fill="currentColor" />
        <span>
          Illustrative data · Not connected to a real account
        </span>
      </div>
    </div>
  );
}
