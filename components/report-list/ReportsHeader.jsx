// components/report-list/ReportsHeader.jsx

export default function ReportsHeader({ isEngineer, onFilterClick }) {
  return (
    <div className="pt-6 pb-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-extrabold text-[#01277C]">
            Reports
          </h1>
          <p className="text-md text-[#7a8aab] leading-snug">
            {isEngineer
              ? "Review and manage reports submitted by the community."
              : "Track the status of reports you submitted. See stats of reports in your community."}
          </p>
        </div>

        <button
          onClick={onFilterClick}
          className="bg-white border border-[#d9e2f3] rounded-xl px-4 py-2 text-sm font-medium text-[#2f5bff] whitespace-nowrap shadow-[0_2px_6px_rgba(26,43,94,0.08)] cursor-pointer hover:bg-gray-50 active:scale-[0.98] transition"
        >
          Filter
        </button>
      </div>
    </div>
  );
}