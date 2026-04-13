import type { Enums } from "~/types/database.types";

export type DistanceCategory = Enums<"distance_category">;
export type ActiveDistance = "all" | DistanceCategory;

export const DISTANCE_ORDER: DistanceCategory[] = ["10k", "half", "marathon"];

export const DISTANCE_COLORS: Record<DistanceCategory, string> = {
  "10k": "#cd7f32",
  half: "#9ca3af",
  marathon: "#eab308",
};

export const DISTANCE_BADGE_CLASS: Record<DistanceCategory, string> = {
  "10k": "bg-orange-100 text-orange-700",
  half: "bg-gray-100 text-gray-500",
  marathon: "bg-yellow-100 text-yellow-700",
};
