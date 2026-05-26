/**
 * Normalizes section labels and collapses known aliases into canonical names.
 */
export function normalizeSection(value: unknown): string {
  if (typeof value !== "string") return "General";
  const cleaned = value.trim().replace(/\s+/g, " ");
  if (!cleaned) return "General";
  return canonicalizeSectionAlias(cleaned);
}

function canonicalizeSectionAlias(section: string): string {
  const key = section
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  if (
    key === "os" ||
    key === "operating syste" ||
    key === "operating system" ||
    key === "operating systems"
  ) {
    return "Operating System";
  }

  return section;
}
