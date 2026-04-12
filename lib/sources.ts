import { db } from "./db";

export const DEFAULT_SOURCE_TYPE = "link";
export const DEFAULT_SOURCE_LABEL = "Link";

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function detectSource(
  url: string
): Promise<{ type: string; label: string }> {
  const hostname = new URL(url).hostname.toLowerCase();

  const mapping = await db.originMapping.findUnique({
    where: { matchValue: hostname },
  });

  if (mapping) {
    return {
      type: mapping.sourceType,
      label: mapping.label ?? capitalize(mapping.sourceType) + " Link",
    };
  }

  return { type: DEFAULT_SOURCE_TYPE, label: DEFAULT_SOURCE_LABEL };
}
