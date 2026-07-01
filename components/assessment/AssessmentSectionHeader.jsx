// components/assessment/AssessmentSectionHeader.jsx
// Roman-numeral section labels: "I. INFORMATION", "II. STRUCTURAL DAMAGE
// ASSESSMENT", "III. RECOMMENDED ACTION". Visually distinct from the
// shared SectionHeader (used on the result screen for "Description"-style
// labels), so this stays a small local component rather than overloading
// SectionHeader with a second look.

export default function AssessmentSectionHeader({ children }) {
  return <h2 className="assessment-section-header">{children}</h2>;
}