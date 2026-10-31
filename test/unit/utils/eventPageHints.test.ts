import { describe, expect, it } from "vitest";
import {
  cleanPageTitle,
  decodeHtmlEntities,
  detectEventDistances,
  detectOtherDistancesKm,
  extractEventPageHints,
  findRegistrationUrl,
  rankUpcomingDates,
} from "~/utils/eventPageHints";

const TODAY = "2026-10-31";
const PAGE_URL = "https://www.voorbeeldloop.nl/";

describe("detectEventDistances", () => {
  it("finds distances written in kilometers", () => {
    expect(detectEventDistances("Afstanden: 5 km, 10 km en 21,1 km")).toEqual([
      "10k",
      "half_marathon",
    ]);
  });

  it("does not read a half marathon as a full marathon", () => {
    expect(detectEventDistances("Doe mee aan de Halve Marathon")).toEqual([
      "half_marathon",
    ]);
  });

  it("finds a full marathon next to a half marathon", () => {
    expect(
      detectEventDistances("De marathon en de halve marathon starten om 10:00"),
    ).toEqual(["half_marathon", "marathon"]);
  });

  it("does not read decimals as round distances", () => {
    expect(detectEventDistances("Parcours van 21,10 km en 10,5 km")).toEqual([
      "half_marathon",
    ]);
  });

  it("recognises hardlopen.nl style decimals", () => {
    expect(detectEventDistances("10,00 km 13:30 15,00 km 30,00 km")).toEqual([
      "10k",
      "15k",
      "30k",
    ]);
  });

  it("finds ten miles in Dutch and English", () => {
    expect(detectEventDistances("De 10 Engelse mijl van Tilburg")).toEqual([
      "10_miles",
    ]);
    expect(detectEventDistances("Tilburg Ten Miles")).toEqual(["10_miles"]);
  });

  it("reads a rounded 21 km as a half marathon", () => {
    expect(detectEventDistances("3 afstanden (6 tot 21 km)")).toEqual([
      "half_marathon",
    ]);
  });

  it("finds a quarter marathon by name or length", () => {
    expect(detectEventDistances("De kwart marathon")).toEqual(["quarter_marathon"]);
    expect(detectEventDistances("Afstand 10,55 km")).toEqual(["quarter_marathon"]);
  });

  it("finds a marathon by its length", () => {
    expect(detectEventDistances("Loop de 42,195 km")).toEqual(["marathon"]);
  });
});

describe("findRegistrationUrl", () => {
  it("picks the link labelled as registration", () => {
    const html = `
      <a href="/over-ons">Over ons</a>
      <a href="/inschrijven">Schrijf je in</a>`;
    expect(findRegistrationUrl(html, PAGE_URL)).toBe(
      "https://www.voorbeeldloop.nl/inschrijven",
    );
  });

  it("prefers a known registration platform", () => {
    const html = `
      <a href="/info">Inschrijven</a>
      <a href="https://www.mijninschrijving.nl/event/123" title="Inschrijven">Doe mee</a>`;
    expect(findRegistrationUrl(html, PAGE_URL)).toBe(
      "https://www.mijninschrijving.nl/event/123",
    );
  });

  it("skips newsletter sign-ups", () => {
    const html = `<a href="/aanmelden-nieuwsbrief">Aanmelden</a>`;
    expect(findRegistrationUrl(html, PAGE_URL)).toBeNull();
  });

  it("ignores mail links and links back to the page", () => {
    const html = `
      <a href="mailto:info@voorbeeldloop.nl">Inschrijven</a>
      <a href="https://www.voorbeeldloop.nl/#inschrijven">Inschrijven</a>`;
    expect(findRegistrationUrl(html, PAGE_URL)).toBeNull();
  });
});

describe("detectOtherDistancesKm", () => {
  it("lists distances that do not map to an event distance", () => {
    expect(detectOtherDistancesKm("4 km, 10,55 km, 12 km, 16 km, 10 km en 21,1 km")).toEqual([
      4, 12, 16,
    ]);
  });
});

describe("rankUpcomingDates", () => {
  it("drops past dates and dates too far ahead", () => {
    expect(
      rankUpcomingDates(["2026-01-01", "2027-04-11", "2031-01-01"], TODAY),
    ).toEqual(["2027-04-11"]);
  });

  it("puts the most mentioned date first", () => {
    expect(
      rankUpcomingDates(["2027-03-01", "2027-04-11", "2027-04-11"], TODAY),
    ).toEqual(["2027-04-11", "2027-03-01"]);
  });

  it("puts a structured start date first", () => {
    expect(
      rankUpcomingDates(["2027-03-01", "2027-03-01"], TODAY, "2027-04-11"),
    ).toEqual(["2027-04-11", "2027-03-01"]);
  });
});

describe("cleanPageTitle", () => {
  it("drops site suffixes", () => {
    expect(cleanPageTitle("Venloop 2027 | Home")).toBe("Venloop 2027");
    expect(cleanPageTitle("Dam tot Damloop - Le Champion")).toBe("Dam tot Damloop");
  });

  it("keeps hyphenated names intact", () => {
    expect(cleanPageTitle("Dam-tot-Damloop")).toBe("Dam-tot-Damloop");
  });

  it("skips generic segments", () => {
    expect(cleanPageTitle("Home | Venloop")).toBe("Venloop");
    expect(cleanPageTitle("Startpagina")).toBeNull();
  });
});

describe("decodeHtmlEntities", () => {
  it("decodes named and numeric entities", () => {
    expect(decodeHtmlEntities("Run &amp; Walk &#8211; &euro; 5")).toBe(
      "Run & Walk – € 5",
    );
  });
});

describe("extractEventPageHints", () => {
  it("prefers structured event data", () => {
    const html = `
      <html><head>
        <title>Home | Voorbeeldloop</title>
        <script type="application/ld+json">
          {"@context":"https://schema.org","@graph":[{"@type":"WebPage"},{
            "@type":"SportsEvent","name":"Voorbeeldloop 2027",
            "startDate":"2027-03-14T10:00:00+01:00",
            "location":{"@type":"Place","address":{"addressLocality":"Den Haag"}}
          }]}
        </script>
      </head><body><p>Kies 10 km of de halve marathon. Inschrijven tot 1 maart 2027.</p></body></html>`;

    expect(extractEventPageHints(html, TODAY, PAGE_URL)).toEqual({
      name: "Voorbeeldloop 2027",
      dates: ["2027-03-14", "2027-03-01"],
      distances: ["10k", "half_marathon"],
      otherDistancesKm: [],
      location: "Den Haag",
      registrationUrl: null,
    });
  });

  it("falls back to the page title and visible text", () => {
    const html = `
      <html><head><meta property="og:title" content="Singelloop &amp; Co | Home"></head>
      <body>
        <script>var x = "42 km";</script>
        <h1>Zondag 4 april 2027</h1>
        <p>Afstanden: 5 km en 10 km. Datum: 04-04-2027.</p>
      </body></html>`;

    expect(extractEventPageHints(html, TODAY, PAGE_URL)).toEqual({
      name: "Singelloop & Co",
      dates: ["2027-04-04"],
      distances: ["10k"],
      otherDistancesKm: [5],
      location: null,
      registrationUrl: null,
    });
  });

  it("uses the site name when the page title is generic", () => {
    const html = `<title>Startpagina</title><meta property="og:site_name" content="4 Mijl van Groningen">`;
    expect(extractEventPageHints(html, TODAY, PAGE_URL).name).toBe("4 Mijl van Groningen");
  });

  it("ignores malformed structured data", () => {
    const html = `<title>Loop</title><script type="application/ld+json">{oops</script>`;
    expect(extractEventPageHints(html, TODAY, PAGE_URL).name).toBe("Loop");
  });
});
