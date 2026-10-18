import {
  NextResponse,
} from "next/server";

import {
  canManageApplicationGuild,
} from "@/lib/applicationAuth";

function config() {
  const apiUrl =
    process.env
      .UTILITYX_API_URL;

  const secret =
    process.env
      .INTERNAL_API_SECRET;

  if (
    !apiUrl ||
    !secret
  ) {
    throw new Error(
      "UtilityX backend is not configured."
    );
  }

  return {
    apiUrl,
    secret,
  };
}

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      guildId: string;
    }>;
  }
) {
  const {
    guildId,
  } = await params;

  const auth =
    await canManageApplicationGuild(
      guildId
    );

  if (
    !auth.authenticated
  ) {
    return NextResponse.json(
      {
        error:
          "Discord sign-in is required.",
      },
      {
        status: 401,
      }
    );
  }

  if (
    auth.temporaryFailure
  ) {
    return NextResponse.json(
      {
        error:
          "Discord is temporarily unavailable. Please try again.",
      },
      {
        status: 503,
      }
    );
  }

  if (
    !auth.allowed
  ) {
    return NextResponse.json(
      {
        error:
          "You do not have permission to manage applications for this server.",
      },
      {
        status: 403,
      }
    );
  }

  const {
    apiUrl,
    secret,
  } = config();

  const url =
    new URL(
      request.url
    );

  const resources =
    url.searchParams.get(
      "resources"
    ) === "1";

  const formId =
    url.searchParams.get(
      "formId"
    );

  const advancedFormId =
    url.searchParams.get(
      "advancedFormId"
    );

  const submissionId =
    url.searchParams.get(
      "submissionId"
    );

  const target =
    resources
      ? `${apiUrl}/internal/guild-resources/${guildId}`
      : submissionId
        ? `${apiUrl}/internal/applications/${guildId}/submissions/${encodeURIComponent(submissionId)}`
        : advancedFormId
          ? `${apiUrl}/internal/applications/${guildId}/forms/${encodeURIComponent(advancedFormId)}/advanced`
          : formId
            ? `${apiUrl}/internal/applications/${guildId}/forms/${encodeURIComponent(formId)}`
            : `${apiUrl}/internal/applications/${guildId}`;

  const response =
    await fetch(
      target,
      {
        headers: {
          "x-utilityx-internal-secret":
            secret,
        },

        cache:
          "no-store",
      }
    );

  const data =
    await response.json();

  return NextResponse.json(
    data,
    {
      status:
        response.status,
    }
  );
}

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      guildId: string;
    }>;
  }
) {
  const {
    guildId,
  } = await params;

  const auth =
    await canManageApplicationGuild(
      guildId
    );

  if (
    !auth.authenticated
  ) {
    return NextResponse.json(
      {
        error:
          "Discord sign-in is required.",
      },
      {
        status: 401,
      }
    );
  }

  if (
    auth.temporaryFailure
  ) {
    return NextResponse.json(
      {
        error:
          "Discord is temporarily unavailable. Please try again.",
      },
      {
        status: 503,
      }
    );
  }

  if (
    !auth.allowed ||
    !auth.identity
  ) {
    return NextResponse.json(
      {
        error:
          "You do not have permission to manage applications for this server.",
      },
      {
        status: 403,
      }
    );
  }

  let body: any;

  try {
    body =
      await request.json();
  } catch {
    return NextResponse.json(
      {
        error:
          "Invalid request.",
      },
      {
        status: 400,
      }
    );
  }

  const {
    apiUrl,
    secret,
  } = config();

  const action =
    String(
      body.action ??
      ""
    );

  let target =
    "";

  let method =
    "POST";

  let payload:
    unknown = {};

  if (
    action ===
    "portal-save"
  ) {
    target =
      `${apiUrl}/internal/applications/${guildId}/portal`;

    method =
      "PATCH";

    payload =
      body.portal ??
      {};
  } else if (
    action ===
    "form-create"
  ) {
    target =
      `${apiUrl}/internal/applications/${guildId}/forms`;

    payload = {
      ...(
        body.form ??
        {}
      ),

      createdBy:
        auth.identity.id,
    };
  } else if (
    action ===
    "advanced-save"
  ) {
    if (!body.formId) {
      return NextResponse.json(
        {
          error:
            "formId is required.",
        },
        {
          status: 400,
        }
      );
    }

    target =
      `${apiUrl}/internal/applications/${guildId}/forms/${encodeURIComponent(body.formId)}/advanced`;

    method =
      "PATCH";

    payload =
      body.settings ??
      {};
  } else if (
    action ===
    "form-delete"
  ) {
    if (!body.formId) {
      return NextResponse.json(
        {
          error:
            "formId is required.",
        },
        {
          status: 400,
        }
      );
    }

    target =
      `${apiUrl}/internal/applications/${guildId}/forms/${encodeURIComponent(body.formId)}`;

    method =
      "DELETE";
  } else if (
    action ===
    "form-save"
  ) {
    if (!body.formId) {
      return NextResponse.json(
        {
          error:
            "formId is required.",
        },
        {
          status: 400,
        }
      );
    }

    target =
      `${apiUrl}/internal/applications/${guildId}/forms/${encodeURIComponent(body.formId)}`;

    method =
      "PATCH";

    payload =
      body.form ??
      {};
  } else if (
    action ===
    "questions-save"
  ) {
    if (!body.formId) {
      return NextResponse.json(
        {
          error:
            "formId is required.",
        },
        {
          status: 400,
        }
      );
    }

    target =
      `${apiUrl}/internal/applications/${guildId}/forms/${encodeURIComponent(body.formId)}/questions`;

    method =
      "PUT";

    payload = {
      questions:
        body.questions ??
        [],
    };
  } else if (
    action ===
    "submission-review"
  ) {
    if (
      !body.submissionId
    ) {
      return NextResponse.json(
        {
          error:
            "submissionId is required.",
        },
        {
          status: 400,
        }
      );
    }

    target =
      `${apiUrl}/internal/applications/${guildId}/submissions/${encodeURIComponent(body.submissionId)}/review`;

    payload = {
      status:
        body.status,

      note:
        body.note ??
        null,

      reviewerUserId:
        auth.identity.id,

      reviewerUsername:
        auth.identity.username,
    };
  } else {
    return NextResponse.json(
      {
        error:
          "Unknown application action.",
      },
      {
        status: 400,
      }
    );
  }

  const response =
    await fetch(
      target,
      {
        method,

        headers: {
          "Content-Type":
            "application/json",

          "x-utilityx-internal-secret":
            secret,
        },

        body:
          JSON.stringify(
            payload
          ),

        cache:
          "no-store",
      }
    );

  const data =
    await response.json();

  return NextResponse.json(
    data,
    {
      status:
        response.status,
    }
  );
}
