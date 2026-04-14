import { DISTANCE_ORDER, EVENT_DISTANCE_ORDER } from "~/constants/distances";
import type {
  EventDistance,
  EventDistanceInput,
  DistanceCategory,
} from "~/types/events";

type Translate = (key: string, params?: Record<string, unknown>) => string;

const EVENT_DISTANCE_TO_CATEGORY: Record<EventDistance, DistanceCategory> = {
  "10k": "10k",
  "15k": "10k",
  "10_miles": "10k",
  half_marathon: "half",
  "30k": "half",
  marathon: "marathon",
};

export function getDistanceCategoryForEventDistance(
  distance: EventDistance,
): DistanceCategory {
  return EVENT_DISTANCE_TO_CATEGORY[distance];
}

export function createEmptyEventDistanceInput(): EventDistanceInput {
  const defaultDistance = EVENT_DISTANCE_ORDER[0]!;
  return {
    distance: defaultDistance,
    distanceCategory: getDistanceCategoryForEventDistance(defaultDistance),
  };
}

export function normalizeEventDistanceInputs(
  distances: EventDistanceInput[],
): EventDistanceInput[] {
  return distances.map((distance) => ({
    distance: distance.distance,
    distanceCategory: getDistanceCategoryForEventDistance(distance.distance),
  }));
}

export function hasDuplicateEventDistances(
  distances: EventDistanceInput[],
): boolean {
  const values = normalizeEventDistanceInputs(distances).map(
    (distance) => distance.distance,
  );
  return new Set(values).size !== values.length;
}

export function getDistanceCategoryLabel(
  category: DistanceCategory,
  t: Translate,
): string {
  return t(`distance.${category}`);
}

export function getEventDistanceLabel(
  distance: EventDistance,
  t: Translate,
): string {
  return t(`eventDistance.${distance}`);
}

export function formatEventDistanceLabel(
  distance: EventDistanceInput,
  t: Translate,
): string {
  const distanceLabel = getEventDistanceLabel(distance.distance, t);
  const categoryLabel = getDistanceCategoryLabel(distance.distanceCategory, t);
  if (distanceLabel === categoryLabel) {
    return distanceLabel;
  }

  return t("events.distanceWithCategory", {
    distance: distanceLabel,
    category: categoryLabel,
  });
}
