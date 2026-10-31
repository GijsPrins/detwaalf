interface ProvinceOption {
  id: number;
  name: string;
}

// Words in event names that are never part of a place name.
const NON_PLACE_WORDS = new Set([
  "nn", "tcs", "asml", "dsw", "hipro", "trek", "afas", "menzis", "lagro",
  "ebens", "amgen", "kika", "univé", "the", "of", "and", "by", "en", "uit",
  "van", "het", "marathon", "halve", "half", "kwart", "quarter", "loop", "run",
  "race", "trail", "urban", "night", "nacht", "city", "stad", "classic",
  "challenge", "festival", "editie", "edition", "mijl", "miles", "mile", "ten",
  "km", "circuit", "park", "walk", "tot", "stichting", "vereniging",
  "atletiek", "atletiekvereniging", "loopgroep",
]);
// Lower-case words that start a Dutch place name: "Den Haag", "De Bilt".
const PLACE_PREFIXES = new Set(["den", "de", "'s"]);
const MAX_PLACE_CANDIDATES = 4;

function isPlaceWord(word: string): boolean {
  const lower = word.toLowerCase();
  if (NON_PLACE_WORDS.has(lower)) return false;
  if (/\d/.test(word)) return false;
  // Sponsor and race acronyms such as "CPC".
  if (word === word.toUpperCase()) return false;
  // Compound race names such as "Singelloop" or "Bruggenloop".
  if (/(?:loop|run|marathon|trail|race)$/i.test(word)) return false;
  return word.length >= 3 && /^(?:['‘’]s-)?\p{Lu}/u.test(word);
}

function isStandalonePlaceWord(word: string): boolean {
  return isPlaceWord(word) && !PLACE_PREFIXES.has(word.toLowerCase());
}

// "NN Marathon Rotterdam" -> ["Rotterdam"]; "Marathon Den Haag" -> ["Den Haag"]
export function extractPlaceCandidates(eventName: string): string[] {
  const words = eventName.replace(/[|–—,:()]/g, " ").split(/\s+/).filter(Boolean);
  const runs: string[][] = [];
  let current: string[] = [];

  words.forEach((word, index) => {
    const next = words[index + 1];
    const startsPlace =
      PLACE_PREFIXES.has(word.toLowerCase()) && next !== undefined && isPlaceWord(next);
    if (startsPlace || isPlaceWord(word)) {
      current.push(word);
    } else if (current.length > 0) {
      runs.push(current);
      current = [];
    }
  });
  if (current.length > 0) runs.push(current);

  const candidates = runs.map((run) => run.join(" "));
  for (const run of runs) {
    if (run.length > 1) candidates.push(...run.filter(isStandalonePlaceWord));
  }
  return [...new Set(candidates)].slice(0, MAX_PLACE_CANDIDATES);
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
