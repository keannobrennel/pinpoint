/**
 * lib/schemas.js
 *
 * Single source of truth for the shape of a Report and a Zone.
 * Plain JSDoc for now (fast for a hackathon) — every place that reads/writes
 * a report or zone object should match this shape so the upload route,
 * dashboard, and heatmap don't silently drift apart.
 *
 * If you later want runtime validation (e.g. catching a malformed Gemini
 * response before it hits Firestore), these comments map 1:1 onto Zod
 * schemas — swap `z.string()` etc. in without changing field names.
 */

/**
 * @typedef {"structural_crack" | "exposed_rebar" | "wall_column_failure" | "debris" | "foundation_issue" | "non_structural" | "none_detected"} DamageClassification
 */

/**
 * @typedef {"inspected" | "restricted_use" | "unsafe"} ATC20Placard
 */

/**
 * @typedef {"high" | "moderate" | "low"} ConfidenceLevel
 */

/**
 * @typedef {"monitor" | "restrict_access" | "evacuate_immediately" | "needs_engineer_inspection"} RecommendedAction
 */

/**
 * @typedef {"pending" | "responder_verified" | "verified_false" | "inspector_dispatched" | "inspected" | "under_maintenance" | "resolved"} ReportStatus
 */

/**
 * @typedef {"public" | "engineer" | "admin"} UserRole
 */

/**
 * @typedef {"public" | "responder" | "engineer" | "admin"} UserRole
 */

/**
 * Structured output from the Gemini Vision Phase 2 pre-assessment.
 * This is the object lib/gemini.js should return for an accepted photo.
 *
 * @typedef {Object} AIPreAssessment
 * @property {boolean} isValidHazard
 * @property {DamageClassification} damageClassification
 * @property {ATC20Placard} suggestedPlacard
 * @property {string} placardReasoning - plain-language explanation
 * @property {string} affectedStructureType - e.g. "school", "residential building", "bridge"
 * @property {string[]} visibleRiskIndicators - e.g. ["diagonal shear cracks", "spalling concrete"]
 * @property {ConfidenceLevel} confidenceLevel
 * @property {number} severityScore - numeric, feeds triage ranking (0-100)
 * @property {RecommendedAction} recommendedAction
 */

/**
 * Official engineer assessment, added once an engineer inspects a report.
 * Null/absent until then.
 *
 * @typedef {Object} EngineerAssessment
 * @property {ATC20Placard} placardType
 * @property {number} severityScore - engineer's own score, separate from AI's
 * @property {string} inspectorNotes
 * @property {string} officialVerdict
 * @property {string} assessedBy - engineer uid
 * @property {string} assessedAt - ISO timestamp
 */

/**
 * A single citizen-submitted report, as stored in Firestore (collection: "reports").
 *
 * @typedef {Object} Report
 * @property {string} id - Firestore doc id
 * @property {string} submittedBy - Firebase Auth uid of submitter
 * @property {string} imageUrl - Firebase Storage public URL
 * @property {{ lat: number, lng: number }} location
 * @property {string | null} city - e.g. "Muntinlupa City", from PSGC lookup
 * @property {string | null} barangay - e.g. "Alabang", from PSGC lookup
 * @property {string | null} zoneId - which zone this report is clustered into, null if unassigned
 * @property {string} description - optional note from citizen (empty string if not provided)
 * @property {AIPreAssessment} aiAssessment
 * @property {number} priorityScore - computed triage score, see lib/triage.js
 * @property {ReportStatus} status
 * @property {VerificationStatus} verificationStatus
 * @property {string | null} verifiedBy - uid of responder/engineer who verified
 * @property {string | null} verifiedByName - displayName snapshot at time of verification
 * @property {string | null} verifiedByRole - role snapshot at time of verification
 * @property {string | null} verifiedAt - ISO timestamp
 * @property {string | null} responderNote
 * @property {boolean} isAutoVerified - true when submitted by a responder
 * @property {string | null} archivedAt - ISO timestamp
 * @property {"verified_false" | null} archivedReason
 * @property {EngineerAssessment | null} engineerAssessment
 * @property {string} reportedAt - ISO timestamp
 */

/**
 * A geographic zone, as stored in Firestore (collection: "zones").
 * Zones aggregate reports for the heatmap and triage ranking.
 *
 * @typedef {Object} Zone
 * @property {string} id
 * @property {string} name - e.g. "Mabini Elementary area"
 * @property {{ lat: number, lng: number }} center
 * @property {number} radiusMeters
 * @property {number} reportCount
 * @property {number} averageSeverityScore - drives triage priority, recalculated as reports come in
 * @property {number} priorityScore - density + severity + recency weighting, see lib/triage.js
 * @property {boolean} disasterMode - true once manually escalated by Engineer/Admin
 * @property {ATC20Placard | null} officialVerdict - null until an engineer posts one
 * @property {string} [alertBannerMessage] - publicly visible if set
 * @property {string} [verdictPostedBy] - engineer uid
 * @property {string} [verdictPostedAt] - ISO timestamp
 * @property {string} updatedAt - ISO timestamp
 */

/**
 * Firestore user profile shape (collection: "users").
 *
 * @typedef {Object} UserProfile
 * @property {string} uid
 * @property {string} email
 * @property {string} displayName
 * @property {UserRole} role
 * @property {string} createdAt - ISO timestamp
 */

// Re-export nothing yet — this file is documentation-as-code for now.
// If/when you add Zod, define schemas here and export them, e.g.:
//
// import { z } from "zod";
// export const ReportSchema = z.object({ ... });
//
// and import ReportSchema wherever you currently trust the shape blindly.

export {};
