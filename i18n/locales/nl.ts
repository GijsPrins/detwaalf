export default {
  nav: {
    brand: "Twaalf Provincies",
    overview: "Overzicht",
    events: "Evenementen",
    logout: "Uitloggen",
    login: "Inloggen",
  },
  landing: {
    nav: {
      login: "Inloggen",
    },
    hero: {
      title: "Twaalf Provincies",
      tagline: "Loop een evenement in alle 12 provincies",
      description:
        "Volg je voortgang, verdien medailles en ontdek hardloopevenementen door heel Nederland.",
      cta: "Inloggen",
      onboarding: "Hoe werkt het?",
    },
    features: {
      provinces: {
        title: "12 provincies",
        description:
          "Eén hardloopevenement per provincie. Van Groningen tot Zeeland.",
      },
      medals: {
        title: "Verdien medailles",
        description:
          "Brons (10 km), zilver (halve marathon) of goud (marathon) — per provincie.",
      },
      progress: {
        title: "Volg je voortgang",
        description:
          "Houd bij waar je staat: interessant, ingeschreven, voltooid.",
      },
    },
  },
  page: {
    home: "Home",
    dashboard: "Dashboard",
    login: "Inloggen",
    register: "Registreren",
    onboarding: "Hoe werkt het?",
  },
  onboarding: {
    title: "Hoe het werkt",
    subtitle: "De uitdaging: loop één evenement in alle 12 provincies van Nederland.",
    step1: {
      title: "1. Zoek een evenement",
      desc: "Vind een hardloopevenement. Elk evenement in Nederland telt, zolang het een officiële wedstrijd is."
    },
    step2: {
      title: "2. Loop een afstand",
      desc: "De afstand die je loopt bepaalt je medaille voor die provincie:"
    },
    step3: {
      title: "3. Voltooi en verzamel",
      desc: "Upload je finishtijd of bewijs en zie je medaillekaart volstromen."
    },
    medals: {
      bronze: "Brons",
      bronzeDesc: "10 km tot 21,1 km",
      silver: "Zilver",
      silverDesc: "Halve marathon (21,1 km tot 42,2 km)",
      gold: "Goud",
      goldDesc: "Marathon (42,2 km of meer)"
    },
    cta: "Ga de uitdaging aan",
    back: "Terug naar home"
  },
  dashboard: {
    subtitle: "Voortgang per medailletrack",
    provincesLabel: "Provincies",
    filters: {
      all: "Alle",
      "10k": "10 km",
      half: "Halve marathon",
      marathon: "Marathon",
    },
    medals: {
      "10k": "Brons",
      half: "Zilver",
      marathon: "Goud",
    },
    upcoming: "Aankomend",
    statuses: {
      interested: "Interessant",
      signed_up: "Ingeschreven",
      completed: "Voltooid",
      dns: "DNS",
      dnf: "DNF",
    },
  },
  distance: {
    "10k": "10 km",
    half: "Halve marathon",
    marathon: "Marathon",
  },
  events: {
    title: "Evenementen",
    subtitle: "Alle aankomende en gelopen evenementen",
    new: "Nieuw evenement",
    empty: "Geen evenementen gevonden.",
    sort: {
      label: "Sorteren op",
      date: "Datum",
      name: "Naam",
    },
    filter: {
      allProvinces: "Alle provincies",
    },
    status: {
      interested: "Geïnteresseerd",
      signed_up: "Ingeschreven",
      completed: "Voltooid",
      dns: "Niet gestart",
      dnf: "Niet gefinisht",
    },
    statusFilter: {
      all: "Alle",
      interested: "Geïnteresseerd",
      signed_up: "Ingeschreven",
      completed: "Gelopen",
      dns: "Niet gestart",
      dnf: "Niet gefinisht",
    },
  },
  eventDetail: {
    edit: "Bewerken",
    backToEvent: "Terug naar evenement",
    notFound: "Evenement niet gevonden.",
    location: "Locatie",
    registrationOpens: "Inschrijving opent",
    registrationDeadline: "Inschrijfdeadline",
    website: "Website evenement",
    register: "Inschrijven",
    participation: {
      title: "Mijn status",
      set: "Geef aan hoe je bij dit evenement betrokken bent.",
      clear: "Geen status",
      loginLink: "Log in",
      loginSuffix: "om je status bij te houden.",
    },
  },
  eventForm: {
    titleAdd: "Evenement toevoegen",
    titleEdit: "Evenement bewerken",
    fields: {
      name: "Naam evenement",
      date: "Datum",
      distances: "Aangeboden afstanden",
      location: "Locatie (startplaats)",
      locationPlaceholder: "bijv. Tilburg, Centrum",
      province: "Provincie",
      provincePlaceholder: "Kies provincie",
      eventUrl: "Website evenement",
      eventUrlPlaceholder: "https://...",
      registrationUrl: "Inschrijflink",
      registrationUrlPlaceholder: "https://inschrijven.nl/...",
      registrationOpens: "Inschrijving opent",
      registrationDeadline: "Inschrijfdeadline",
      optional: "(optioneel)",
    },
    hint: "Je wordt aangemeld als 'Geïnteresseerd'. Je kunt dit daarna aanpassen.",
    provinceAutoFilled: "Provincie automatisch ingevuld op basis van locatie.",
    submit: "Opslaan",
    cancel: "Annuleren",
    errors: {
      generic: "Er is iets misgegaan. Probeer het opnieuw.",
    },
  },
  auth: {
    login: {
      title: "Inloggen",
      email: "E-mailadres",
      password: "Wachtwoord",
      submit: "Inloggen",
      loading: "Bezig met inloggen…",
      noAccount: "Nog geen account? Registreer hier.",
      errors: {
        invalidCredentials: "E-mailadres of wachtwoord is onjuist.",
        emailNotConfirmed: "Bevestig je e-mailadres voordat je inlogt.",
        generic: "Er is iets misgegaan. Probeer het opnieuw.",
      },
    },
    register: {
      title: "Account aanmaken",
      name: "Naam",
      email: "E-mailadres",
      password: "Wachtwoord",
      submit: "Account aanmaken",
      loading: "Bezig met aanmaken…",
      hasAccount: "Heb je al een account? Log in.",
      success: "Account aangemaakt! Check je e-mail om je adres te bevestigen.",
      errors: {
        alreadyExists: "Er bestaat al een account met dit e-mailadres.",
        generic: "Er is iets misgegaan. Probeer het opnieuw.",
      },
    },
    confirm: {
      loading: "Bezig met inloggen…",
      error: "De link is ongeldig of verlopen. Probeer opnieuw in te loggen.",
    },
  },
};
