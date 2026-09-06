import type { DistanceCategory } from "~/constants/distances";
import { PROVINCE_COUNT } from "~/constants/provinces";

type ProgressEvent = {
  id: string;
  province_id: number;
  event_distances: Array<{ distance_category: string }>;
};

type ProgressParticipation = {
  event_id: string;
  status: string;
  event_distance?: { distance_category: string } | null;
};

export type CompletedProvinces = Record<DistanceCategory, Set<number>>;

export function getCompletedProvincesByCategory(
  events: ProgressEvent[],
  participations: ProgressParticipation[],
): CompletedProvinces {
  const result: CompletedProvinces = {
    "10k": new Set(),
    half: new Set(),
    marathon: new Set(),
  };
  const eventMap = new Map(events.map((event) => [event.id, event]));

  for (const participation of participations) {
    if (participation.status !== "completed") continue;
    const event = eventMap.get(participation.event_id);
    if (!event) continue;

    const categories = new Set(
      event.event_distances.map((distance) => distance.distance_category),
    );
    const category =
      participation.event_distance?.distance_category ??
      (categories.size === 1 ? [...categories][0] : null);
    if (category !== "10k" && category !== "half" && category !== "marathon") {
      continue;
    }
    result[category].add(event.province_id);
  }

  return result;
}

export function getProvinceMilestone(
  completedProvinces: CompletedProvinces,
  category: DistanceCategory,
  provinceId: number,
) {
  const provinces = completedProvinces[category];
  const isNewProvince = !provinces.has(provinceId);
  const completedCount = Math.min(
    provinces.size + (isNewProvince ? 1 : 0),
    PROVINCE_COUNT,
  );

  return {
    isNewProvince,
    completedCount,
    routeCompleted: isNewProvince && completedCount === PROVINCE_COUNT,
  };
}
