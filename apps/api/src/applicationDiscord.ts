const BOT_INTERNAL_URL =
  process.env.BOT_INTERNAL_URL;

const INTERNAL_SECRET =
  process.env.INTERNAL_API_SECRET;

async function botRequest(
  path: string,
  payload: unknown
) {
  if (
    !BOT_INTERNAL_URL ||
    !INTERNAL_SECRET
  ) {
    return null;
  }

  try {
    const response =
      await fetch(
        `${BOT_INTERNAL_URL}${path}`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "x-utilityx-internal-secret":
              INTERNAL_SECRET,
          },

          body:
            JSON.stringify(
              payload
            ),
        }
      );

    if (!response.ok) {
      const text =
        await response.text();

      console.error(
        "Application bot request failed:",
        response.status,
        text
      );

      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(
      "Application bot request error:",
      error
    );

    return null;
  }
}

export function postApplicationReviewToDiscord(
  payload: unknown
) {
  return botRequest(
    "/internal/applications/review-post",
    payload
  );
}

export function sendApplicationApplicantDm(
  payload: unknown
) {
  return botRequest(
    "/internal/applications/dm",
    payload
  );
}

export function assignApplicationRole(
  payload: unknown
) {
  return botRequest(
    "/internal/applications/assign-role",
    payload
  );
}

export function sendApplicationInterviewDm(
  payload: unknown
) {
  return botRequest(
    "/internal/applications/interview-dm",
    payload
  );
}

export function postApplicantChannelNotification(
  payload: unknown
) {
  return botRequest(
    "/internal/applications/notify-channel",
    payload
  );
}
