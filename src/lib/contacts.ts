export const RELATIONSHIPS = ["family", "friend", "professional", "other"] as const;

export const RELATIONSHIP_LABELS: Record<string, string> = {
  family: "Family",
  friend: "Friend",
  professional: "Professional",
  other: "Other",
};

export function relationshipLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return RELATIONSHIP_LABELS[value] ?? value;
}

export function isPersonalRelationship(value: string | null | undefined): boolean {
  return value === "family" || value === "friend";
}
