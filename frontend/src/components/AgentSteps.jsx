import { useEffect, useState } from "react";

const stages = [
  "Reading job requirements",
  "Comparing candidate profiles",
  "Applying match priorities",
  "Preparing your shortlist",
];

function AgentSteps() {
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveStage((stage) => Math.min(stage + 1, stages.length - 1));
    }, 700);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="agent-progress" role="status" aria-live="polite">
      <div className="agent-progress__heading">
        <span className="agent-progress__pulse" aria-hidden="true" />
        <div>
          <strong>Building your shortlist</strong>
          <span>{stages[activeStage]}…</span>
        </div>
      </div>
      <div className="agent-progress__track" aria-hidden="true">
        <span style={{ width: `${Math.min((activeStage + 1) * 23, 92)}%` }} />
      </div>
      <ol className="agent-progress__stages">
        {stages.map((stage, index) => (
          <li className={index < activeStage ? "is-complete" : index === activeStage ? "is-active" : ""} key={stage}>
            <span aria-hidden="true">{index < activeStage ? "✓" : index + 1}</span>
            {stage}
          </li>
        ))}
      </ol>
    </div>
  );
}

export default AgentSteps;
