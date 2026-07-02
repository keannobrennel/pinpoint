// components/assessment/AssessmentBanner.jsx
// Incident context strip shown above the wizard forms:
// "Incident #01" + phase pill, incident name, location.

import PhasePill from "@/components/ui/PhasePill";

export default function AssessmentBanner({ incidentNumber, name, location, phase }) {
  return (
    <div className="assessment-banner">
      <div className="assessment-banner__top">
        <span className="assessment-banner__number">Incident #{incidentNumber}</span>
        <PhasePill phase={phase} />
      </div>

      <h1 className="assessment-banner__title">{name}</h1>

      {location && (
        <p className="assessment-banner__location">
          <i className="fa-solid fa-location-dot" aria-hidden="true" />
          {location}
        </p>
      )}
    </div>
  );
}