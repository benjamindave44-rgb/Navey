// Simple keyword/pattern-based check — NOT real content moderation.
// It exists to catch obviously bad edits and route them to admins for
// a human look, not to make judgment calls on its own.

const BLOCKED_WORDS = [
  /\bfuck\b/i,
  /\bshit\b/i,
  /\bbitch\b/i,
  /\bcunt\b/i,
  /\basshole\b/i,
];

const URL_PATTERN = /https?:\/\/|www\./i;

export function checkContentGuidelines(fields: {
  name: string;
  description: string | null;
}): string[] {
  const issues: string[] = [];
  const text = `${fields.name} ${fields.description ?? ""}`;

  if (BLOCKED_WORDS.some((pattern) => pattern.test(text))) {
    issues.push("Contains language that may violate our content guidelines.");
  }
  if (URL_PATTERN.test(text)) {
    issues.push("Contains a link, which isn't allowed in the name or description.");
  }
  if (fields.name.length > 6 && fields.name === fields.name.toUpperCase()) {
    issues.push("Listing name is in all caps.");
  }

  return issues;
}
