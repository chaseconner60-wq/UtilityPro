import {
  NextResponse,
} from "next/server";

import {
  getDiscordIdentity,
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
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      guildId: string;
      formId: string;
    }>;
  }
) {
  const {
    guildId,
    formId,
  } = await params;

  const {
    apiUrl,
  } = config();

  const response =
    await fetch(
      `${apiUrl}/applications/public/${guildId}/${formId}`,
      {
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
      formId: string;
    }>;
  }
) {
  const {
    guildId,
    formId,
  } = await params;

  const identity =
    await getDiscordIdentity();

  if (!identity) {
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

  let body;

  try {
    body =
      await request.json();
  } catch {
    return NextResponse.json(
      {
        error:
          "Invalid application submission.",
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

  const response =
    await fetch(
      `${apiUrl}/internal/applications/${guildId}/${formId}/submit`,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",

          "x-utilityx-internal-secret":
            secret,
        },

        body:
          JSON.stringify({
            applicantUserId:
              identity.id,

            applicantUsername:
              identity.username,

            applicantAvatar:
              identity.avatar,

            answers:
              body.answers ??
              [],
          }),

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
