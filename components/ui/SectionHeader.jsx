// components/ui/SectionHeader.jsx
// Bold section label used throughout detail screens.
// e.g. "Description", "Photo Preview", "Responder Comments", "Reports Included (18)"
//
// Usage:
//   <SectionHeader>Description</SectionHeader>
//   <SectionHeader icon="fa-solid fa-sparkles">Description Summary</SectionHeader>

export default function SectionHeader({ children, icon }) {
  return (
    <div className="section-header">
      {icon && <i className={icon} aria-hidden="true" />}
      <h2 className="section-header__text">{children}</h2>
    </div>
  );
}