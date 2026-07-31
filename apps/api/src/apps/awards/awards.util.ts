import type { Award } from "@thanks-claude/shared-types";
import type { AwardWithCountRow } from "./awards.repository";

export function toAwardDto(row: AwardWithCountRow): Award {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    title: row.title,
    description: row.description,
    icon: row.icon,
    givenCount: row.givenCount,
  };
}
