const DEFAULT_ERLC_API =
  "https://api.erlc.gg";

type RawErlcServer = {
  Name?: string;
  name?: string;

  JoinKey?: string;
  joinKey?: string;

  CurrentPlayers?: number;
  currentPlayers?: number;

  MaxPlayers?: number;
  maxPlayers?: number;

  Players?: unknown[];
  players?: unknown[];

  Queue?: unknown[];
  queue?: unknown[];

  Staff?: unknown;
  staff?: unknown;

  EmergencyCalls?: unknown[];
  emergencyCalls?: unknown[];

  Vehicles?: unknown[];
  vehicles?: unknown[];

  [key: string]: unknown;
};

export type ErlcSnapshot = {
  name: string | null;

  joinCode: string | null;

  currentPlayers: number;

  maxPlayers: number;

  players: unknown[];

  queue: unknown[];

  staff: unknown;

  emergencyCalls: unknown[];

  vehicles: unknown[];

  raw: RawErlcServer;
};

export class ErlcApiError
  extends Error {
  status: number;

  constructor(
    message: string,
    status: number
  ) {
    super(message);
    this.status = status;
  }
}

export async function fetchErlcSnapshot(
  serverKey: string
): Promise<ErlcSnapshot> {
  const apiBase =
    (
      process.env
        .ERLC_API_BASE_URL ||
      DEFAULT_ERLC_API
    ).replace(/\/$/, "");

  const response =
    await fetch(
      `${apiBase}/v2/server`,
      {
        method: "GET",

        headers: {
          "Server-Key":
            serverKey,

          Accept:
            "application/json",
        },

        signal:
          AbortSignal.timeout(
            10000
          ),
      }
    );

  if (!response.ok) {
    let message =
      `ER:LC returned HTTP ${response.status}.`;

    try {
      const body =
        await response.json() as {
          message?: string;
          Message?: string;
          error?: string;
          Error?: string;
        };

      message =
        body.message ||
        body.Message ||
        body.error ||
        body.Error ||
        message;
    } catch {
      // Keep safe generic message.
    }

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      message =
        `ER:LC authentication failed (${response.status}): ${message}`;
    }

    if (
      response.status === 429
    ) {
      message =
        "ER:LC rate limit reached. Try again shortly.";
    }

    throw new ErlcApiError(
      message,
      response.status
    );
  }

  const raw =
    (await response.json()) as RawErlcServer;

  const players =
    Array.isArray(
      raw.Players
    )
      ? raw.Players
      : Array.isArray(
          raw.players
        )
        ? raw.players
        : [];

  const queue =
    Array.isArray(
      raw.Queue
    )
      ? raw.Queue
      : Array.isArray(
          raw.queue
        )
        ? raw.queue
        : [];

  const emergencyCalls =
    Array.isArray(
      raw.EmergencyCalls
    )
      ? raw.EmergencyCalls
      : Array.isArray(
          raw.emergencyCalls
        )
        ? raw.emergencyCalls
        : [];

  const vehicles =
    Array.isArray(
      raw.Vehicles
    )
      ? raw.Vehicles
      : Array.isArray(
          raw.vehicles
        )
        ? raw.vehicles
        : [];

  return {
    name:
      typeof raw.Name ===
      "string"
        ? raw.Name
        : typeof raw.name ===
            "string"
          ? raw.name
          : null,

    joinCode:
      typeof raw.JoinKey ===
      "string"
        ? raw.JoinKey
        : typeof raw.joinKey ===
            "string"
          ? raw.joinKey
          : null,

    currentPlayers:
      typeof raw.CurrentPlayers ===
      "number"
        ? raw.CurrentPlayers
        : typeof raw.currentPlayers ===
            "number"
          ? raw.currentPlayers
          : players.length,

    maxPlayers:
      typeof raw.MaxPlayers ===
      "number"
        ? raw.MaxPlayers
        : typeof raw.maxPlayers ===
            "number"
          ? raw.maxPlayers
          : 0,

    players,
    queue,

    staff:
      raw.Staff ??
      raw.staff ??
      null,

    emergencyCalls,
    vehicles,
    raw,
  };
}

export function getInternalServerId(
  serverKey: string
) {
  const pieces =
    serverKey
      .trim()
      .split("-");

  if (
    pieces.length < 2
  ) {
    return null;
  }

  return (
    pieces[
      pieces.length - 1
    ] || null
  );
}
