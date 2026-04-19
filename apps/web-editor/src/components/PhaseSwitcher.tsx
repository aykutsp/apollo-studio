type EditorPhase = "site" | "structure" | "furnish";

type PhaseSwitcherProps = {
  value: EditorPhase;
  onChange: (phase: EditorPhase) => void;
};

const phases: EditorPhase[] = ["site", "structure", "furnish"];

export function PhaseSwitcher({ value, onChange }: PhaseSwitcherProps) {
  return (
    <div className="phase-switcher">
      {phases.map((phase) => (
        <button key={phase} type="button" className={value === phase ? "active" : ""} onClick={() => onChange(phase)}>
          {phase}
        </button>
      ))}
    </div>
  );
}
