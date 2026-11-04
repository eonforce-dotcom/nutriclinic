/**
 * Research-review records only. These helpers do not calculate clinical targets
 * or modify a treatment plan. A recorded choice is not a recommendation.
 */
const sessionReview = Symbol("confirmed-research-review-in-this-session");

const nonempty = (value) => typeof value === "string" && value.trim().length > 0;

// Validate and copy JSON data without JSON.stringify silently dropping undefined,
// functions, non-finite numbers, or custom instances. Sorted keys make snapshots
// comparable across harmless object-key reordering. Array order is meaningful.
function copyJson(value, ancestors = new Set(), depth = 0) {
  if (depth > 64) throw new TypeError("Review input is nested too deeply.");
  if (value === null || typeof value === "string" || typeof value === "boolean")
    return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("Review input must contain finite numbers.");
    return value;
  }
  if (typeof value !== "object")
    throw new TypeError("Review input must contain JSON-compatible data only.");
  const prototype = Object.getPrototypeOf(value);
  if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null)
    throw new TypeError("Review input must contain plain objects only.");
  if (ancestors.has(value)) throw new TypeError("Review input cannot contain a cycle.");
  ancestors.add(value);
  let copied;
  if (Array.isArray(value)) {
    copied = Array.from(value, (item) => copyJson(item, ancestors, depth + 1));
  } else {
    copied = Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, copyJson(value[key], ancestors, depth + 1)]),
    );
  }
  ancestors.delete(value);
  return copied;
}

function copyInput(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input))
    throw new TypeError("Review input must be a plain input object.");
  return copyJson(input);
}

function parseTimestamp(timestamp) {
  if (typeof timestamp !== "string") return null;
  const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.exec(timestamp);
  if (!parts) return null;
  const [year, month, day, hour, minute, second] = parts.slice(1, 7).map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > days[month - 1] || hour > 23 || minute > 59 || second > 59) return null;
  if (parts[7] !== "Z") {
    const zoneHour = Number(parts[7].slice(1, 3));
    const zoneMinute = Number(parts[7].slice(4, 6));
    if (zoneHour > 14 || zoneMinute > 59 || (zoneHour === 14 && zoneMinute !== 0)) return null;
  }
  const date = new Date(timestamp);
  return Number.isFinite(date.getTime()) ? date : null;
}

/** Eligibility for documenting a research approach, not a clinical dosing gate. */
export function choiceAvailable(choice, input) {
  if (!choice || typeof choice !== "object" || !nonempty(choice.id)) return false;
  if (!input || typeof input !== "object" || Array.isArray(input)) return false;
  for (const [allowlist, field] of [["contexts", "context"], ["phases", "phase"]]) {
    if (!Object.hasOwn(choice, allowlist)) continue;
    const allowed = choice[allowlist];
    if (!Array.isArray(allowed) || !allowed.length || !allowed.every(nonempty)) return false;
    if (!allowed.includes(input[field])) return false;
  }
  return true;
}

/**
 * catalogue: [{ id, sourceIds: [string, ...], choices: [{ id, contexts?, phases? }] }]
 * timestamp, when provided, is an ISO date-time string with a time-zone suffix.
 * Only records created here are current in this session. Imported JSON is an
 * audit artifact and must be explicitly reviewed/confirmed again.
 */
export function makeReview({ topicId, choiceId, rationale, confirmed, input, timestamp } = {}, catalogue) {
  if (!Array.isArray(catalogue)) throw new TypeError("A research topic catalogue is required.");
  if (!nonempty(topicId) || !nonempty(choiceId)) throw new TypeError("Topic and choice identifiers are required.");
  const matchingTopics = catalogue.filter((topic) => topic?.id === topicId);
  if (matchingTopics.length !== 1) throw new TypeError("Unknown or ambiguous research topic.");
  const topic = matchingTopics[0];
  const matchingChoices = Array.isArray(topic.choices)
    ? topic.choices.filter((choice) => choice?.id === choiceId) : [];
  if (matchingChoices.length !== 1) throw new TypeError("Unknown or ambiguous choice for this topic.");
  if (confirmed !== true) throw new TypeError("Explicit physician review confirmation is required.");
  if (!nonempty(rationale)) throw new TypeError("A research rationale is required.");
  const text = rationale.trim();
  if (text.length > 1200) throw new TypeError("The research rationale must not exceed 1200 characters.");
  if (!choiceAvailable(matchingChoices[0], input))
    throw new TypeError("This research choice is unavailable for the reviewed context or phase.");
  if (!Array.isArray(topic.sourceIds) || !topic.sourceIds.length || !topic.sourceIds.every(nonempty))
    throw new TypeError("The research topic must reference its evidence sources.");
  const reviewedInput = copyInput(input);
  const date = timestamp === undefined ? new Date() : parseTimestamp(timestamp);
  if (!date || !Number.isFinite(date.getTime())) throw new TypeError("The review timestamp must be a valid ISO date-time.");
  const review = {
    topicId,
    choiceId,
    rationale: text,
    confirmed: true,
    reviewedInput,
    sourceIds: [...topic.sourceIds],
    reviewedAt: date.toISOString(),
  };
  Object.defineProperty(review, sessionReview, { value: true });
  return review;
}

/** Does not accept saved/imported confirmation as a new clinical review. */
export function isReviewCurrent(review, input) {
  if (!review || review[sessionReview] !== true || review.confirmed !== true) return false;
  try {
    return JSON.stringify(copyInput(review.reviewedInput)) === JSON.stringify(copyInput(input));
  } catch {
    return false;
  }
}
