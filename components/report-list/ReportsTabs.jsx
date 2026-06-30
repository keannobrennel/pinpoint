// components/report-list/ReportsTabs.jsx

export default function ReportsTabs({ activeTab, onTabChange, isEngineer }) {
  return (
    <div className="flex items-center gap-10 border-b border-[#e2e8f5]">
      <button
        onClick={() => onTabChange("reports")}
        className={`py-3 text-base font-semibold transition-colors -mb-px border-b-2 ${
          activeTab === "reports"
            ? "text-[#2f5bff] border-[#2f5bff]"
            : "text-[#6b7794] border-transparent hover:text-[#3a4a6b]"
        }`}
      >
        {isEngineer ? "Reports" : "My Reports"}
      </button>
      <button
        onClick={() => onTabChange("community")}
        className={`py-3 text-base font-semibold transition-colors -mb-px border-b-2 ${
          activeTab === "community"
            ? "text-[#2f5bff] border-[#2f5bff]"
            : "text-[#6b7794] border-transparent hover:text-[#3a4a6b]"
        }`}
      >
        Community
      </button>
    </div>
  );
}