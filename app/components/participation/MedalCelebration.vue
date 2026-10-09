<script setup lang="ts">
import { DISTANCE_COLORS } from "~/constants/distances";
import type { DistanceCategory } from "~/constants/distances";
import { PROVINCE_COUNT } from "~/constants/provinces";
import { PRORUN_TWELVE_PROVINCES_URL } from "~/constants/prorun";

const props = defineProps<{
  medal: DistanceCategory;
  province: string;
  completedCount: number;
}>();

const { t } = useI18n();

const canvas = ref<HTMLCanvasElement | null>(null);
let animationFrameId: number | null = null;

const CONFETTI_COLORS: Record<DistanceCategory, string[]> = {
  "10k": ["#cd7f32", "#b8690a", "#e8a045", "#f5c78e", "#fde68a"],
  half: ["#9ca3af", "#6b7280", "#d1d5db", "#e5e7eb", "#f3f4f6"],
  marathon: ["#eab308", "#ca8a04", "#fbbf24", "#fef08a", "#fde047"],
};

const medalColor = computed(() => DISTANCE_COLORS[props.medal]);
const medalLabel = computed(() => t(`dashboard.medals.${props.medal}`));
const isRouteComplete = computed(
  () => props.completedCount >= PROVINCE_COUNT,
);
const emit = defineEmits<{ close: [] }>();
let previousBodyOverflow = "";

function closeOnEscape(event: KeyboardEvent) {
  if (event.key === "Escape") emit("close");
}

onMounted(() => {
  previousBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  window.addEventListener("keydown", closeOnEscape);
  startConfetti();
});
onUnmounted(() => {
  document.body.style.overflow = previousBodyOverflow;
  window.removeEventListener("keydown", closeOnEscape);
  if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
});

function startConfetti() {
  const c = canvas.value;
  if (!c) return;
  const ctx = c.getContext("2d");
  if (!ctx) return;

  c.width = window.innerWidth;
  c.height = window.innerHeight;

  const colors = CONFETTI_COLORS[props.medal];
  const pieces = Array.from({ length: isRouteComplete.value ? 180 : 90 }, () => ({
    x: Math.random() * c.width,
    y: Math.random() * c.height - c.height,
    w: 8 + Math.random() * 8,
    h: 4 + Math.random() * 5,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.08,
    speed: 2 + Math.random() * 3,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));

  const startTime = Date.now();
  const duration = 4500;

  function frame() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    ctx!.clearRect(0, 0, c!.width, c!.height);
    ctx!.globalAlpha = progress > 0.7 ? 1 - (progress - 0.7) / 0.3 : 1;

    for (const p of pieces) {
      p.y += p.speed;
      p.rotation += p.rotationSpeed;
      if (p.y > c!.height + p.h) p.y = -p.h;

      ctx!.save();
      ctx!.translate(p.x + p.w / 2, p.y + p.h / 2);
      ctx!.rotate(p.rotation);
      ctx!.fillStyle = p.color;
      ctx!.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx!.restore();
    }

    if (progress < 1) {
      animationFrameId = requestAnimationFrame(frame);
    } else {
      ctx!.clearRect(0, 0, c!.width, c!.height);
    }
  }

  animationFrameId = requestAnimationFrame(frame);
}
</script>

<template>
  <Teleport to="body">
    <canvas ref="canvas" class="pointer-events-none fixed inset-0 z-[60] h-full w-full" />
    <div
      v-if="isRouteComplete"
      class="fixed inset-0 z-50 overflow-y-auto bg-white"
      role="dialog"
      aria-modal="true"
    >
      <div class="flex min-h-full items-center justify-center px-6 py-12 text-center">
        <main class="w-full max-w-xl">
          <p class="text-sm font-semibold uppercase text-orange-700">
            {{ t("dashboard.celebration.completeEyebrow") }}
          </p>
          <div
            class="mx-auto mt-8 flex h-36 w-36 items-center justify-center rounded-full border-8 text-3xl font-black shadow-xl"
            :style="{ borderColor: medalColor, color: medalColor }"
          >
            12/12
          </div>
          <h1 class="mt-8 text-4xl font-black text-gray-950 sm:text-5xl">
            {{
              t("dashboard.celebration.completeTitle", {
                medal: medalLabel,
              })
            }}
          </h1>
          <p class="mx-auto mt-5 max-w-lg text-base leading-7 text-gray-600 sm:text-lg">
            {{ t("dashboard.celebration.completeBody") }}
          </p>
          <div class="mx-auto mt-8 flex max-w-sm flex-col gap-3">
            <a
              :href="PRORUN_TWELVE_PROVINCES_URL"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center justify-center rounded-lg bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
            >
              {{ t("dashboard.celebration.completeCta") }} &rarr;
            </a>
            <button
              class="rounded-lg px-5 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
              @click="emit('close')"
            >
              {{ t("dashboard.celebration.completeClose") }}
            </button>
          </div>
        </main>
      </div>
    </div>
    <div
      v-else
      class="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 p-4"
      role="dialog"
      aria-modal="true"
      @click.self="emit('close')"
    >
      <div class="w-full max-w-sm rounded-lg bg-white p-7 text-center shadow-xl">
        <div
          class="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4"
          :style="{ background: medalColor }"
        >
          {{ completedCount }}
        </div>
        <h2 class="text-xl font-bold text-gray-900 mb-2">
          {{ t("dashboard.celebration.title") }}
        </h2>
        <p class="text-sm text-gray-500 leading-relaxed">
          {{
            t("dashboard.celebration.message", {
              medal: medalLabel,
              province,
            })
          }}
        </p>
        <p class="mt-2 text-xs font-semibold uppercase text-gray-400">
          {{
            t("dashboard.celebration.progress", {
              count: completedCount,
            })
          }}
        </p>
        <p class="mt-5 border-t border-gray-100 pt-5 text-sm leading-6 text-gray-600">
          {{ t("dashboard.celebration.prorunBody") }}
        </p>
        <div class="mt-5 flex flex-col gap-2">
          <a
            :href="PRORUN_TWELVE_PROVINCES_URL"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex w-full items-center justify-center rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
          >
            {{ t("dashboard.celebration.prorunCta") }} &rarr;
          </a>
          <button
            class="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
            @click="emit('close')"
          >
            {{ t("dashboard.celebration.close") }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
