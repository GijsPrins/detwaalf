import type { Enums } from "~/types/database.types";

export const PARTICIPATION_STATUS_BADGE_CLASS: Record<
  Enums<"participation_status">,
  string
> = {
  interested: "bg-orange-100 text-orange-700",
  signed_up: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  dns: "bg-gray-100 text-gray-500",
  dnf: "bg-gray-100 text-gray-500",
};
