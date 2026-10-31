import { describe, expect, it } from "vitest";
import {
  extractPlaceCandidates,
  findProvinceByStateName,
} from "~/utils/provinceLookup";

const provinces = [
  { id: 1, name: "Friesland" },
  { id: 2, name: "Noord-Holland" },
];

describe("findProvinceByStateName", () => {
  it("matches case-insensitively", () => {
    expect(findProvinceByStateName("noord-holland", provinces)?.id).toBe(2);
  });

  it("maps Fryslân to Friesland", () => {
    expect(findProvinceByStateName("Fryslân", provinces)?.id).toBe(1);
  });

  it("ignores spaces versus hyphens", () => {
    expect(findProvinceByStateName(" Noord Holland ", provinces)?.id).toBe(2);
  });

  it("returns null for unknown or empty states", () => {
    expect(findProvinceByStateName("Vlaanderen", provinces)).toBeNull();
    expect(findProvinceByStateName("", provinces)).toBeNull();
  });
});

describe("extractPlaceCandidates", () => {
  it.each([
    ["NN Marathon Rotterdam", ["Rotterdam"]],
    ["Marathon Den Haag", ["Den Haag", "Haag"]],
    ["Egmond Halve Marathon", ["Egmond"]],
    ["TREK Singelloop Utrecht", ["Utrecht"]],
    ["Lagro Ebens Nacht van Groningen", ["Groningen"]],
    ["Groet uit Schoorl Run", ["Groet", "Schoorl"]],
    ["Halve Marathon Doetinchem 2027", ["Doetinchem"]],
    ["Vestingloop ‘s-Hertogenbosch", ["‘s-Hertogenbosch"]],
    ["Zevenheuvelenloop", []],
    ["NN CPC Loop Den Haag", ["Den Haag", "Haag"]],
    ["Stichting Venloop", []],
  ])("finds places in %s", (name, expected) => {
    expect(extractPlaceCandidates(name)).toEqual(expected);
  });
});
