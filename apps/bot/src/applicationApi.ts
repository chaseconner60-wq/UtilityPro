const API_URL =
  process.env
    .UTILITYX_API_URL;

const INTERNAL_SECRET =
  process.env
    .INTERNAL_API_SECRET;

function configured() {
  if (
    !API_URL ||
    !INTERNAL_SECRET
  ) {
    throw new Error(
      "Applications API is not configured for the bot."
    );
  }
}

async function request(
  path: string,
  init: RequestInit = {}
) {
  configured();

  const response =
    await fetch(
      `${API_URL}${path}`,
      {
        ...init,

        headers: {
          "Content-Type":
            "application/json",

          "x-utilityx-internal-secret":
            INTERNAL_SECRET!,

          ...(
            init.headers ??
            {}
          ),
        },
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
      "Application API request failed."
    );
  }

  return data;
}

export async function getApplicationSubmissionDetail(
  guildId: string,
  submissionId: string
) {
  return request(
    `/internal/applications/${guildId}/submissions/${submissionId}`
  );
}

export async function getAdvancedApplicationSubmissionDetail(
  guildId: string,
  submissionId: string
) {
  return request(
    `/internal/applications/${guildId}/submissions/${submissionId}/advanced`
  );
}

export async function reviewApplication(
  guildId: string,
  submissionId: string,
  payload: {
    status: string;
    reviewerUserId: string;
    reviewerUsername: string;
    note?: string | null;
  }
) {
  return request(
    `/internal/applications/${guildId}/submissions/${submissionId}/review`,
    {
      method:
        "POST",

      body:
        JSON.stringify(
          payload
        ),
    }
  );
}

export async function getAdvancedApplicationSettings(
  guildId: string,
  formId: string
) {
  return request(
    `/internal/applications/${guildId}/forms/${formId}/advanced`
  );
}

export async function scheduleInterview(
  guildId: string,
  submissionId: string,
  payload: {
    scheduledFor?: string | null;
    interviewerUserId?: string | null;
    interviewerUsername?: string | null;
    notes?: string | null;
  }
) {
  return request(
    `/internal/applications/${guildId}/submissions/${submissionId}/interviews`,
    {
      method:
        "POST",

      body:
        JSON.stringify(
          payload
        ),
    }
  );
}
