import type { Enums } from "~/types/database.types";
import { getDateOnlyString, getLocalDateString } from "~/utils/localDate";

type ParticipationStatus = Enums<"participation_status"> | null | undefined;

interface RegistrationCtaInput {
  eventDate: string;
  participationStatus?: ParticipationStatus;
  registrationOpens?: string | null;
  registrationDeadline?: string | null;
}

type RegistrationCta =
  | { type: "open" }
  | { type: "future"; opensOn: string }
  | { type: "none" };

export function getEventRegistrationCta(
  event: RegistrationCtaInput,
  today = getLocalDateString(),
): RegistrationCta {
  if (event.participationStatus && event.participationStatus !== "interested") {
    return { type: "none" };
  }

  if (getDateOnlyString(event.eventDate) < today) {
    return { type: "none" };
  }

  if (
    event.registrationDeadline &&
    getDateOnlyString(event.registrationDeadline) < today
  ) {
    return { type: "none" };
  }

  if (
    event.registrationOpens &&
    getDateOnlyString(event.registrationOpens) > today
  ) {
    return { type: "future", opensOn: event.registrationOpens };
  }

  return { type: "open" };
}
