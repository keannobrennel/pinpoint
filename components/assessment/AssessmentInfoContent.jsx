// components/assessment/AssessmentInfoContent.jsx
// Static legend/explainer content shown on the Info page. This is a
// paraphrase — not a verbatim copy — of the italic footnotes already
// present in Engineer-Structural-Assessment-Forms-1.docx (verdict color
// meanings, PD 1096 dangerous-building threshold, ATC-20 basis, RA 10121
// reporting window).

export default function AssessmentInfoContent() {
  return (
    <>
      <p className="assessment-subsection-title">Verdict colors</p>
      <div className="assessment-options">
        <div className="assessment-option verdict-card verdict-card--static">
          <span className="verdict-card__chip verdict-card__chip--green" aria-hidden="true" />
          <span className="verdict-card__text">
            <span className="assessment-option__label">INSPECTED (Green)</span>
            <span className="verdict-card__description">
              Safe to occupy without restrictions.
            </span>
          </span>
        </div>
        <div className="assessment-option verdict-card verdict-card--static">
          <span className="verdict-card__chip verdict-card__chip--amber" aria-hidden="true" />
          <span className="verdict-card__text">
            <span className="assessment-option__label">RESTRICTED USE (Yellow)</span>
            <span className="verdict-card__description">
              Occupancy allowed only in a limited way; some hazards remain.
            </span>
          </span>
        </div>
        <div className="assessment-option verdict-card verdict-card--static">
          <span className="verdict-card__chip verdict-card__chip--red" aria-hidden="true" />
          <span className="verdict-card__text">
            <span className="assessment-option__label">UNSAFE (Red)</span>
            <span className="verdict-card__description">
              Entry is prohibited until further evaluation or repair.
            </span>
          </span>
        </div>
      </div>

      <p className="assessment-subsection-title">How a rating is decided</p>
      <p className="assessment-note">
        A single item rated Severe, or several items rated Moderate at once,
        is generally enough grounds for an Unsafe posting. This follows the
        ATC-20 rapid-evaluation approach the post-disaster form is built on,
        together with the dangerous-building standard in PD 1096 — damage
        that meaningfully weakens a structure below code minimums, or a part
        of it that could fall and hurt someone.
      </p>

      <p className="assessment-subsection-title">Reporting deadline</p>
      <p className="assessment-note">
        Part 4 of the post-disaster form feeds the LGU/LDRRMO&apos;s damage
        and needs report, which RA 10121 requires within 72 hours of a
        disaster — so accuracy on occupant and displacement counts matters.
      </p>
    </>
  );
}
