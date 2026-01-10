/**
 * AI Signal Translations for MindStash
 *
 * Converts technical AI fields into calm, natural language
 * that feels like MindStash understands the user.
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type Intent =
  | "learn"
  | "task"
  | "reminder"
  | "idea"
  | "reflection"
  | "reference";

export type Urgency = "low" | "medium" | "high";

export type TimeContext =
  | "immediate"
  | "next_week"
  | "someday"
  | "conditional"
  | "date";

export type ResurfaceStrategy =
  | "time_based"
  | "contextual"
  | "weekly_review"
  | "manual";

export type SuggestedBucket =
  | "Today"
  | "Learn Later"
  | "Ideas"
  | "Reminders"
  | "Insights";

export interface StatusIndicator {
  label: string;
  color: string;
}

// =============================================================================
// TRANSLATION FUNCTIONS
// =============================================================================

/**
 * Translates AI intent and urgency into a human-friendly understanding phrase.
 * Explains what MindStash thinks about this item.
 */
export function getAIUnderstanding(
  intent: Intent | null | undefined,
  actionRequired: boolean | null | undefined,
  urgency: Urgency | null | undefined
): string {
  const isUrgent = urgency === "high";
  const needsAction = actionRequired === true;

  switch (intent) {
    case "learn":
      if (isUrgent && needsAction) {
        return "This looks like something you want to learn soon.";
      }
      return "This looks like something you want to learn later, not act on immediately.";

    case "task":
      if (isUrgent) {
        return "This seems time-sensitive and may need your attention.";
      }
      if (needsAction) {
        return "This is something you'll want to do when you're ready.";
      }
      return "This is a task you can tackle when the time feels right.";

    case "reminder":
      if (isUrgent) {
        return "This is something you'll want to remember soon.";
      }
      return "I'll help you remember this when it matters.";

    case "idea":
      if (needsAction) {
        return "This is a creative idea that might be worth exploring.";
      }
      return "This is a creative idea worth exploring when you're ready.";

    case "reflection":
      return "This feels like a personal thought worth keeping close.";

    case "reference":
    default:
      if (needsAction) {
        return "This might be useful to reference when you need it.";
      }
      return "I'll keep this safe for when you need it.";
  }
}

/**
 * Translates resurface strategy into a plan phrase.
 * Explains how MindStash will bring this item back.
 */
export function getResurfacePlan(
  resurfaceStrategy: ResurfaceStrategy | null | undefined,
  timeContext: TimeContext | null | undefined
): string {
  switch (resurfaceStrategy) {
    case "time_based":
      if (timeContext === "immediate") {
        return "I'll keep this visible for you today.";
      }
      if (timeContext === "next_week") {
        return "I'll bring this back next week.";
      }
      if (timeContext === "date") {
        return "I'll remind you when the time is right.";
      }
      return "I'll bring this back when the timing makes sense.";

    case "contextual":
      return "I'll show this when you explore related topics.";

    case "weekly_review":
      if (timeContext === "immediate" || timeContext === "next_week") {
        return "I'll include this in your upcoming review.";
      }
      return "I'll bring this back during your weekly review.";

    case "manual":
    default:
      if (timeContext === "someday") {
        return "I'll keep this safe until you're ready to explore it.";
      }
      if (timeContext === "conditional") {
        return "I'll keep this safe until it becomes relevant.";
      }
      return "This will be here whenever you want to revisit it.";
  }
}

/**
 * Translates time context into a timing expectation phrase.
 * Short indicator of when the item might resurface.
 */
export function getTimingContext(
  timeContext: TimeContext | null | undefined
): string {
  switch (timeContext) {
    case "immediate":
      return "Available now";

    case "next_week":
      return "Expected to resurface: Next week";

    case "someday":
      return "Waiting for the right moment";

    case "conditional":
      return "Resurfaces when you explore related topics";

    case "date":
      return "Scheduled for a specific time";

    default:
      return "Available whenever you need it";
  }
}

/**
 * Translates action state into a suggested action phrase.
 * Gentle guidance on what the user might want to do.
 */
export function getSuggestedAction(
  actionRequired: boolean | null | undefined,
  urgency: Urgency | null | undefined
): string {
  const needsAction = actionRequired === true;
  const isHighUrgency = urgency === "high";
  const isMediumUrgency = urgency === "medium";

  if (needsAction && isHighUrgency) {
    return "You might want to look at this soon.";
  }

  if (needsAction && isMediumUrgency) {
    return "You may want to follow up on this.";
  }

  if (needsAction) {
    return "Worth exploring when you have time.";
  }

  if (isHighUrgency) {
    return "This could use your attention when you're ready.";
  }

  return "No action needed right now.";
}

/**
 * Returns a status indicator for collapsed card views.
 * Provides a label and color for quick visual scanning.
 */
export function getStatusIndicator(
  urgency: Urgency | null | undefined,
  actionRequired: boolean | null | undefined,
  timeContext?: TimeContext | null,
  resurfaceStrategy?: ResurfaceStrategy | null
): StatusIndicator {
  const needsAction = actionRequired === true;
  const isHighUrgency = urgency === "high";
  const isMediumUrgency = urgency === "medium";

  // High priority items
  if (isHighUrgency && needsAction) {
    return {
      label: "Needs attention",
      color: "text-amber-600 bg-amber-50",
    };
  }

  // Time-based scheduled items
  if (resurfaceStrategy === "time_based" || timeContext === "next_week") {
    return {
      label: "Scheduled",
      color: "text-blue-600 bg-blue-50",
    };
  }

  // Medium priority with action
  if (isMediumUrgency && needsAction) {
    return {
      label: "Pending",
      color: "text-violet-600 bg-violet-50",
    };
  }

  // Contextual items waiting for relevance
  if (resurfaceStrategy === "contextual" || timeContext === "conditional") {
    return {
      label: "Waiting",
      color: "text-slate-500 bg-slate-50",
    };
  }

  // Someday/manual items
  if (timeContext === "someday" || resurfaceStrategy === "manual") {
    return {
      label: "Dormant",
      color: "text-gray-400 bg-gray-50",
    };
  }

  // Default for low urgency, no action
  return {
    label: "Captured",
    color: "text-emerald-600 bg-emerald-50",
  };
}

// =============================================================================
// BUCKET DISPLAY HELPERS
// =============================================================================

/**
 * Returns a friendly description for each suggested bucket.
 */
export function getBucketDescription(
  bucket: SuggestedBucket | null | undefined
): string {
  switch (bucket) {
    case "Today":
      return "Items that need your attention today";
    case "Learn Later":
      return "Content to explore when you have time";
    case "Ideas":
      return "Creative thoughts worth nurturing";
    case "Reminders":
      return "Things to remember at the right time";
    case "Insights":
      return "Captured moments and reflections";
    default:
      return "Saved for safekeeping";
  }
}

/**
 * Returns an icon name for each suggested bucket (for use with Lucide icons).
 */
export function getBucketIcon(
  bucket: SuggestedBucket | null | undefined
): string {
  switch (bucket) {
    case "Today":
      return "Calendar";
    case "Learn Later":
      return "BookOpen";
    case "Ideas":
      return "Lightbulb";
    case "Reminders":
      return "Bell";
    case "Insights":
      return "Sparkles";
    default:
      return "Bookmark";
  }
}
