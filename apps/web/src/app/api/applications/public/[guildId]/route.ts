import {
  NextResponse,
} from "next/server";

export async function GET(
  _request: Request,
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

  const apiUrl =
    process.env
      .UTILITYX_API_URL;

  if (!apiUrl) {
    return NextResponse.json(
      {
        error:
          "UtilityX backend is not configured.",
      },
      {
        status: 500,
      }
    );
  }

  const response =
    await fetch(
      `${apiUrl}/applications/public/${guildId}`,
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
