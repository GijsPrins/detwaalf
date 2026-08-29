export const CONTACT_MESSAGE_RATE_LIMITS = {
  shortWindow: {
    maxMessages: 3,
    windowMs: 10 * 60 * 1000,
  },
  dailyWindow: {
    maxMessages: 10,
    windowMs: 24 * 60 * 60 * 1000,
  },
} as const;

type ContactMessageRateLimitCounts = {
  shortWindowCount: number;
  dailyWindowCount: number;
};

function getWindowStart(now: Date, windowMs: number) {
  return new Date(now.getTime() - windowMs).toISOString();
}

async function fetchContactMessageCount(input: {
  url: string;
  key: string;
  token: string;
  userId: string;
  since: string;
  limit: number;
}) {
  const params = new URLSearchParams({
    select: "id",
    user_id: `eq.${input.userId}`,
    created_at: `gte.${input.since}`,
    limit: String(input.limit),
  });
  const rows = await $fetch<Array<{ id?: unknown }>>(
    `${input.url}/rest/v1/contact_messages?${params.toString()}`,
    {
      headers: {
        apikey: input.key,
        authorization: `Bearer ${input.token}`,
      },
    },
  );

  return rows.length;
}

export function isContactMessageRateLimited(
  counts: ContactMessageRateLimitCounts,
) {
  return (
    counts.shortWindowCount >=
      CONTACT_MESSAGE_RATE_LIMITS.shortWindow.maxMessages ||
    counts.dailyWindowCount >=
      CONTACT_MESSAGE_RATE_LIMITS.dailyWindow.maxMessages
  );
}

export function isContactMessageRateLimitError(error: unknown) {
  return (
    error instanceof Error &&
    error.message.toLowerCase().includes("contact_message_rate_limit")
  );
}

export async function fetchContactMessageRateLimitCounts(input: {
  url: string;
  key: string;
  token: string;
  userId: string;
  now?: Date;
}): Promise<ContactMessageRateLimitCounts> {
  const now = input.now ?? new Date();
  const shortWindowSince = getWindowStart(
    now,
    CONTACT_MESSAGE_RATE_LIMITS.shortWindow.windowMs,
  );
  const dailyWindowSince = getWindowStart(
    now,
    CONTACT_MESSAGE_RATE_LIMITS.dailyWindow.windowMs,
  );

  const [shortWindowCount, dailyWindowCount] = await Promise.all([
    fetchContactMessageCount({
      ...input,
      since: shortWindowSince,
      limit: CONTACT_MESSAGE_RATE_LIMITS.shortWindow.maxMessages,
    }),
    fetchContactMessageCount({
      ...input,
      since: dailyWindowSince,
      limit: CONTACT_MESSAGE_RATE_LIMITS.dailyWindow.maxMessages,
    }),
  ]);

  return { shortWindowCount, dailyWindowCount };
}
