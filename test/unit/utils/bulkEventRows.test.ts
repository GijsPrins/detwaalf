import { describe, expect, it } from "vitest";
import {
  applyEventPageHints,
  createBulkEventRow,
  isBulkEventRowReady,
  normalizeEventUrl,
  parseEventUrlList,
  toEventWriteInput,
  toggleEventDistance,
} from "~/utils/bulkEventRows";

function readyRow() {
  return {
    ...createBulkEventRow("https://www.voorbeeldloop.nl"),
    name: "Voorbeeldloop",
    eventDate: "2027-03-14",
    location: "Den Haag",
    provinceId: 11,
    distances: ["10k" as const],
  };
}

describe("normalizeEventUrl", () => {
  it("adds https when the scheme is missing", () => {
    expect(normalizeEventUrl("venloop.nl")).toBe("https://venloop.nl/");
  });

  it("rejects text that is not a website", () => {
    expect(normalizeEventUrl("")).toBeNull();
    expect(normalizeEventUrl("venloop")).toBeNull();
    expect(normalizeEventUrl("https://")).toBeNull();
  });
});

describe("parseEventUrlList", () => {
  it("splits on whitespace and separators and removes duplicates", () => {
    expect(
      parseEventUrlList("venloop.nl\nhttps://www.damloop.nl, venloop.nl; nope"),
    ).toEqual(["https://venloop.nl/", "https://www.damloop.nl/"]);
  });
});

describe("toggleEventDistance", () => {
  it("adds and removes distances in the standard order", () => {
    expect(toggleEventDistance(["marathon"], "10k")).toEqual(["10k", "marathon"]);
    expect(toggleEventDistance(["10k", "marathon"], "10k")).toEqual(["marathon"]);
  });
});

describe("isBulkEventRowReady", () => {
  it("needs a name, date, province and distance", () => {
    expect(isBulkEventRowReady(readyRow())).toBe(true);
    expect(isBulkEventRowReady({ ...readyRow(), provinceId: null })).toBe(false);
    expect(isBulkEventRowReady({ ...readyRow(), distances: [] })).toBe(false);
    expect(isBulkEventRowReady({ ...readyRow(), name: "  " })).toBe(false);
  });

  it("is not ready once saved", () => {
    expect(isBulkEventRowReady({ ...readyRow(), status: "saved" })).toBe(false);
  });
});

describe("applyEventPageHints", () => {
  const hints = {
    name: "Gevonden naam",
    dates: ["2027-04-11", "2027-03-01"],
    distances: ["half_marathon" as const],
    otherDistancesKm: [5],
    location: "Rotterdam",
  };

  it("fills empty fields", () => {
    const row = applyEventPageHints(createBulkEventRow("https://x.nl"), hints);
    expect(row).toMatchObject({
      name: "Gevonden naam",
      eventDate: "2027-04-11",
      location: "Rotterdam",
      distances: ["half_marathon"],
      dateOptions: ["2027-04-11", "2027-03-01"],
      otherDistancesKm: [5],
    });
  });

  it("never overwrites what the admin typed", () => {
    const row = applyEventPageHints(readyRow(), hints);
    expect(row).toMatchObject({
      name: "Voorbeeldloop",
      eventDate: "2027-03-14",
      location: "Den Haag",
      distances: ["10k"],
    });
  });
});

describe("toEventWriteInput", () => {
  it("maps a row to the event write input", () => {
    expect(toEventWriteInput({ ...readyRow(), location: " " })).toEqual({
      name: "Voorbeeldloop",
      event_date: "2027-03-14",
      province_id: 11,
      location: null,
      event_url: "https://www.voorbeeldloop.nl/",
      registration_url: null,
      registration_opens: null,
      registration_deadline: null,
      distances: [{ distance: "10k", distanceCategory: "10k" }],
    });
  });
});
