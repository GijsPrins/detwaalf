import { findProvinceByStateName } from "~/utils/provinceLookup";

interface ProvinceOption {
  id: number;
  name: string;
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
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&countrycodes=nl&format=json&addressdetails=1&limit=1&accept-language=nl`,
        {
          headers: {
            "User-Agent": "TwaalfProvincies/1.0 (twaalfprovincies.run)",
          },
        },
      );
      const results: { address?: { state?: string } }[] = await res.json();
      const stateName = results[0]?.address?.state;
      if (!stateName) return null;

      return findProvinceByStateName(stateName, provinces)?.id ?? null;
    } catch {
      // Silent fail — user can select manually
      return null;
    } finally {
      isLookingUp.value = false;
    }
  }

  return { isLookingUp, lookupProvinceId };
}
