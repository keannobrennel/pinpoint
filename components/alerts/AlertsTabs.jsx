// components/alerts/AlertsTabs.jsx

export default function AlertsTabs({ activeTab, onTabChange, activeCount, resolvedCount }) {
  return (
    <div className="flex items-center gap-10 border-b border-[#e2e8f5]">
      <button
        onClick={() => onTabChange("active")}
        className={`py-3 text-base font-semibold transition-colors -mb-px border-b-2 ${
          activeTab === "active"
            ? "text-[#2f5bff] border-[#2f5bff]"
            : "text-[#6b7794] border-transparent hover:text-[#3a4a6b]"
        }`}
      >
        Active{typeof activeCount === "number" ? ` (${activeCount})` : ""}
      </button>
      <button
        onClick={() => onTabChange("resolved")}
        className={`py-3 text-base font-semibold transition-colors -mb-px border-b-2 ${
          activeTab === "resolved"
            ? "text-[#2f5bff] border-[#2f5bff]"
            : "text-[#6b7794] border-transparent hover:text-[#3a4a6b]"
        }`}
      >
        Resolved{typeof resolvedCount === "number" ? ` (${resolvedCount})` : ""}
      </button>
    </div>
  );
}