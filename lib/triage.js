/**
 * Calculates a triage priority score for a report.
 * Higher score = higher priority on the dashboard.
 *
 * Formula weights:
 * - AI severity (0-10): 50%
 * - Recency: 30%
 * - Corroboration (duplicate reports in same zone): 20%
 *
 * @param {AIPreAssessment} aiAssessment
 * @param {number} reportCount - number of reports in the same zone
 * @param {Date} reportedAt
 * @returns {number} priority score (0-100)
 */
export function calculatePriorityScore(aiAssessment, reportCount, reportedAt) {
  const severityWeight = (aiAssessment.severityScore / 10) * 50;

  const ageHours =
    (Date.now() - new Date(reportedAt).getTime()) / (1000 * 60 * 60);
  const recencyWeight = Math.max(0, 30 - ageHours * 2);

  const corroborationWeight = Math.min(20, reportCount * 4);

  return Math.round(severityWeight + recencyWeight + corroborationWeight);
}

/**
 * Sorts an array of reports by priority score descending.
 * @param {Array} reports
 * @returns {Array}
 */
export function sortByPriority(reports) {
  return [...reports].sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * Groups reports by zoneId.
 * @param {Array} reports
 * @returns {Object} { zoneId: [reports] }
 */
export function groupByZone(reports) {
  return reports.reduce((acc, report) => {
    const zone = report.zoneId ?? "unzoned";
    if (!acc[zone]) acc[zone] = [];
    acc[zone].push(report);
    return acc;
  }, {});
}
