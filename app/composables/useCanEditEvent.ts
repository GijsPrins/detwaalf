import type { MaybeRefOrGetter } from "vue";
import type { EventViewModel } from "~/mappers/events";
import { useCanManageEvents } from "~/composables/useCanManageEvents";

export function useCanEditEvent(
  event: MaybeRefOrGetter<Pick<EventViewModel, "createdBy"> | null | undefined>,
) {
  const user = useSupabaseUser();
  const { data: canManageEvents } = useCanManageEvents();

  return computed(() => {
    const currentEvent = toValue(event);
    return (
      !!canManageEvents.value ||
      (!!user.value && currentEvent?.createdBy === user.value.id)
    );
  });
}
