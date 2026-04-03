export default {
  nav: {
    brand: 'Twaalf Provincies',
    overview: 'Overview',
    events: 'Events',
    logout: 'Sign out',
  },
  landing: {
    nav: {
      login: 'Sign in',
    },
    hero: {
      title: 'Twaalf Provincies',
      tagline: 'Run an event in all 12 provinces',
      description: 'Track your progress, earn medals, and discover running events across the Netherlands.',
      cta: 'Sign in',
    },
    features: {
      provinces: {
        title: '12 provinces',
        description: 'One running event per province. From Groningen to Zeeland.',
      },
      medals: {
        title: 'Earn medals',
        description: 'Bronze (10 km), silver (half marathon), or gold (marathon) — per province.',
      },
      progress: {
        title: 'Track your progress',
        description: 'Keep track of where you stand: interested, signed up, completed.',
      },
    },
  },
  page: {
    home: 'Home',
    dashboard: 'Dashboard',
    login: 'Sign in',
  },
  dashboard: {
    subtitle: 'Progress per medal track',
    provincesLabel: 'Provinces',
    filters: {
      all: 'All',
      '10k': '10 km',
      half: 'Half marathon',
      marathon: 'Marathon',
    },
    medals: {
      '10k': 'Bronze',
      half: 'Silver',
      marathon: 'Gold',
    },
    upcoming: 'Upcoming',
    statuses: {
      interested: 'Interested',
      signed_up: 'Signed up',
      completed: 'Completed',
      dns: 'DNS',
      dnf: 'DNF',
    },
  },
  auth: {
    login: {
      title: 'Sign in',
      email: 'Email address',
      password: 'Password',
      submit: 'Sign in',
      loading: 'Signing in…',
      errors: {
        invalidCredentials: 'Incorrect email address or password.',
        emailNotConfirmed: 'Please confirm your email address before signing in.',
        generic: 'Something went wrong. Please try again.',
      },
    },
    confirm: {
      loading: 'Signing in…',
      error: 'The link is invalid or has expired. Please try signing in again.',
    },
  },
}
