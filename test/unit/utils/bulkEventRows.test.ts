import { describe, expect, it } from "vitest";
import {
  applyEventPageHints,
  createBulkEventRow,
  isBulkEventRowReady,
  normalizeEventUrl,
  parseBulkEventLine,
  parseBulkEventText,
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

const provinces = [
  { id: 4, name: "Friesland" },
  { id: 8, name: "Noord-Brabant" },
  { id: 11, name: "Zuid-Holland" },
];

describe("parseBulkEventLine", () => {
  it("reads every column of a complete line", () => {
    expect(
      parseBulkEventLine(
        "nnmarathonrotterdam.nl; NN Marathon Rotterdam; 2027-04-11; Rotterdam; Zuid-Holland; marathon, kwart marathon; https://www.nnmarathonrotterdam.nl/inschrijven",
        provinces,
      ),
    ).toMatchObject({
      eventUrl: "https://nnmarathonrotterdam.nl/",
      name: "NN Marathon Rotterdam",
      eventDate: "2027-04-11",
      location: "Rotterdam",
      provinceId: 11,
      distances: ["quarter_marathon", "marathon"],
      registrationUrl: "https://www.nnmarathonrotterdam.nl/inschrijven",
      status: "draft",
    });
  });

  it("accepts tabs, Dutch dates, loose province names and distance keys", () => {
    expect(
      parseBulkEventLine(
        "\tSingelloop\t11 april 2027\tBreda\tnoord brabant\t10_miles, half_marathon",
        provinces,
      ),
    ).toMatchObject({
      eventUrl: "",
      name: "Singelloop",
      eventDate: "2027-04-11",
      provinceId: 8,
      distances: ["10_miles", "half_marathon"],
      registrationUrl: "",
    });
  });

  it("leaves unknown fields empty instead of guessing", () => {
    expect(
      parseBulkEventLine("venloop.nl; Venloop; binnenkort;;Limburgs;", provinces),
    ).toMatchObject({
      eventDate: "",
      location: "",
      provinceId: null,
      distances: [],
    });
  });

  it("skips header lines and lines without a website or name", () => {
    expect(parseBulkEventLine("website; naam; datum", provinces)).toBeNull();
    expect(parseBulkEventLine(";; 2027-04-11", provinces)).toBeNull();
  });
});

describe("parseBulkEventText", () => {
  it("mixes website lines with complete lines and drops repeated websites", () => {
    const rows = parseBulkEventText(
      [
        "venloop.nl https://www.damloop.nl",
        "",
        "venloop.nl; Venloop; 2027-03-28",
        "https://www.dwingeloop.nl; Dwingeloop; 2027-06-01",
      ].join("\r\n"),
      provinces,
    );
    expect(rows.map((row) => [row.eventUrl, row.name])).toEqual([
      ["https://venloop.nl/", ""],
      ["https://www.damloop.nl/", ""],
      ["https://www.dwingeloop.nl/", "Dwingeloop"],
    ]);
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
    registrationUrl: "https://www.mijninschrijving.nl/event/1",
  };

  it("fills empty fields", () => {
    const row = applyEventPageHints(createBulkEventRow("https://x.nl"), hints);
    expect(row).toMatchObject({
      name: "Gevonden naam",
      eventDate: "2027-04-11",
      location: "Rotterdam",
      registrationUrl: "https://www.mijninschrijving.nl/event/1",
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
    expect(
      toEventWriteInput({
        ...readyRow(),
        location: " ",
        registrationUrl: "mijninschrijving.nl/event/1",
      }),
    ).toEqual({
      name: "Voorbeeldloop",
      event_date: "2027-03-14",
      province_id: 11,
      location: null,
      event_url: "https://www.voorbeeldloop.nl/",
      registration_url: "https://mijninschrijving.nl/event/1",
      registration_opens: null,
      registration_deadline: null,
      distances: [{ distance: "10k", distanceCategory: "10k" }],
    });
  });
});
