import type { Enums } from "~/types/database.types";

export type DistanceCategory = Enums<"distance_category">;
export type EventDistance = Enums<"event_distance">;

export interface EventDistanceInput {
  distance: EventDistance;
  distanceCategory: DistanceCategory;
}
