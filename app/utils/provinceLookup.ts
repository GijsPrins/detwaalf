interface ProvinceOption {
  id: number;
  name: string;
}

// Nominatim reports Dutch provinces as "state"; Friesland comes back as Fryslân.
export function findProvinceByStateName<T extends ProvinceOption>(
  stateName: string,
  provinces: T[],
): T | null {
  const normalizedState = stateName.trim().toLowerCase();
  return (
    provinces.find(
      (province) =>
        province.name.toLowerCase() === normalizedState ||
        (province.name === "Friesland" && normalizedState === "fryslân"),
    ) ?? null
  );
}
