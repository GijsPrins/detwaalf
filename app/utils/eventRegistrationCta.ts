import type { Enums } from "~/types/database.types";
import { getLocalDateString } from "~/utils/localDate";

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

function dateOnly(value: string): string {
  return value.slice(0, 10);
}

export function getEventRegistrationCta(
  event: RegistrationCtaInput,
  today = getLocalDateString(),
): RegistrationCta {
  if (event.participationStatus && event.participationStatus !== "interested") {
    return { type: "none" };
  }

  if (dateOnly(event.eventDate) < today) {
    return { type: "none" };
  }

  if (
    event.registrationDeadline &&
    dateOnly(event.registrationDeadline) < today
  ) {
    return { type: "none" };
  }

  if (event.registrationOpens && dateOnly(event.registrationOpens) > today) {
    return { type: "future", opensOn: event.registrationOpens };
  }

  return { type: "open" };
}
