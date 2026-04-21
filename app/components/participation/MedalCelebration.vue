<script setup lang="ts">
import { DISTANCE_COLORS } from "~/constants/distances";
import type { DistanceCategory } from "~/constants/distances";

const props = defineProps<{
  medal: DistanceCategory;
  province: string;
}>();

defineEmits<{ close: [] }>();

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

onMounted(() => startConfetti());
onUnmounted(() => {
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
  const pieces = Array.from({ length: 90 }, () => ({
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
    <canvas ref="canvas" class="fixed inset-0 w-full h-full pointer-events-none z-40" />
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      @click.self="$emit('close')"
    >
      <div class="bg-white rounded-2xl p-8 text-center max-w-xs w-full shadow-lg">
        <div
          class="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4"
          :style="{ background: medalColor }"
        >
          1
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
        <button
          class="mt-6 w-full py-2.5 rounded-lg text-sm font-medium bg-orange-600 hover:bg-orange-700 text-white transition-colors"
          @click="$emit('close')"
        >
          {{ t("dashboard.celebration.close") }}
        </button>
      </div>
    </div>
  </Teleport>
</template>
