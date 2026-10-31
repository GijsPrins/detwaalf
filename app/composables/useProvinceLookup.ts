import {
  extractPlaceCandidates,
  findProvinceByStateName,
} from "~/utils/provinceLookup";

interface ProvinceOption {
  id: number;
  name: string;
}

interface NominatimResult {
  name?: string;
  address?: {
    state?: string;
    city?: string;
    town?: string;
    village?: string;
  };
}

export interface PlaceMatch {
  location: string;
  provinceId: number;
}

// Nominatim's usage policy allows one request per second.
const NOMINATIM_DELAY_MS = 1000;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function searchNominatim(
  query: string,
  options: { settlementsOnly?: boolean } = {},
): Promise<NominatimResult | null> {
  const featureType = options.settlementsOnly ? "&featureType=settlement" : "";
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=nl&format=json&addressdetails=1&limit=1&accept-language=nl${featureType}`,
    {
      headers: {
        "User-Agent": "TwaalfProvincies/1.0 (twaalfprovincies.run)",
      },
    },
  );
  const results: NominatimResult[] = await res.json();
  return results[0] ?? null;
}

export function useProvinceLookup() {
  const isLookingUp = ref(false);

  async function lookupProvinceId(
    location: string,
    provinces: ProvinceOption[],
  ): Promise<number | null> {
    if (!location.trim() || provinces.length === 0) return null;

    isLookingUp.value = true;
    try {
      const stateName = (await searchNominatim(location))?.address?.state;
      if (!stateName) return null;

      return findProvinceByStateName(stateName, provinces)?.id ?? null;
    } catch {
      // Silent fail — user can select manually
      return null;
    } finally {
      isLookingUp.value = false;
    }
  }

  // Tries the place-like words in an event name, e.g. "Rotterdam" in
  // "NN Marathon Rotterdam", until one is a Dutch town or city.
  async function findPlaceForEventName(
    eventName: string,
    provinces: ProvinceOption[],
  ): Promise<PlaceMatch | null> {
    if (provinces.length === 0) return null;

    isLookingUp.value = true;
    try {
      for (const [index, candidate] of extractPlaceCandidates(eventName).entries()) {
        if (index > 0) await wait(NOMINATIM_DELAY_MS);

        const result = await searchNominatim(candidate, { settlementsOnly: true });
        const province = result?.address?.state
          ? findProvinceByStateName(result.address.state, provinces)
          : null;
        if (!result || !province) continue;

        const address = result.address;
        return {
          location:
            result.name ?? address?.city ?? address?.town ?? address?.village ?? candidate,
          provinceId: province.id,
        };
      }
      return null;
    } catch {
      return null;
    } finally {
      isLookingUp.value = false;
    }
  }

  return { isLookingUp, lookupProvinceId, findPlaceForEventName };
}
