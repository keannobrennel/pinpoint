// components/ui/PhasePill.jsx
// Colored phase tag: POST-DISASTER (orange) or PRE-DISASTER (blue).
// Used on both report and incident cards and detail screens.

const PHASE_CONFIG = {
  "post-disaster": {
    label: "POST-DISASTER",
    className: "phase-pill phase-pill--post",
  },
  "pre-disaster": {
    label: "PRE-DISASTER",
    className: "phase-pill phase-pill--pre",
  },
};

export default function PhasePill({ phase }) {
  const config = PHASE_CONFIG[phase?.toLowerCase()] ?? {
    label: phase?.toUpperCase() ?? "UNKNOWN",
    className: "phase-pill phase-pill--default",
  };

  return <span className={config.className}>{config.label}</span>;
}