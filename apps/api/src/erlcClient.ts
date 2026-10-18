const DEFAULT_ERLC_API =
  "https://api.erlc.gg";

type RawErlcServer = {
  Name?: unknown;
  name?: unknown;

  JoinKey?: unknown;
  joinKey?: unknown;
  JoinCode?: unknown;
  joinCode?: unknown;

  CurrentPlayers?: unknown;
  currentPlayers?: unknown;

  MaxPlayers?: unknown;
  maxPlayers?: unknown;

  Players?: unknown;
  players?: unknown;

  Queue?: unknown;
  queue?: unknown;

  Staff?: unknown;
  staff?: unknown;

  EmergencyCalls?: unknown;
  emergencyCalls?: unknown;

  Vehicles?: unknown;
  vehicles?: unknown;

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

  lastCheckedAt: string;
};

export class ErlcApiError extends Error {
  status: number;

  constructor(
    message: string,
    status: number
  ) {
    super(message);

    this.name =
      "ErlcApiError";

    this.status =
      status;
  }
}

function textValue(
  ...values: unknown[]
) {
  for (
    const value of values
  ) {
    if (
      typeof value ===
        "string" &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  return null;
}

function numberValue(
  ...values: unknown[]
) {
  for (
    const value of values
  ) {
    if (
      typeof value ===
        "number" &&
      Number.isFinite(value)
    ) {
      return value;
    }

    if (
      typeof value ===
        "string" &&
      value.trim()
    ) {
      const parsed =
        Number(value);

      if (
        Number.isFinite(
          parsed
        )
      ) {
        return parsed;
      }
    }
  }

  return 0;
}

function arrayValue(
  ...values: unknown[]
): unknown[] {
  for (
    const value of values
  ) {
    if (
      Array.isArray(value)
    ) {
      return value;
    }
  }

  return [];
}

async function errorMessage(
  response: Response
) {
  let message =
    response.statusText ||
    "ER:LC request failed.";

  try {
    const raw =
      (await response.json()) as Record<
        string,
        unknown
      >;

    const candidate =
      raw.message ??
      raw.Message ??
      raw.error ??
      raw.Error;

    if (
      typeof candidate ===
        "string" &&
      candidate.trim()
    ) {
      message =
        candidate.trim();
    }
  } catch {
    try {
      const text =
        await response.text();

      if (text.trim()) {
        message =
          text.trim();
      }
    } catch {
      // Keep fallback.
    }
  }

  return message;
}

export async function fetchErlcSnapshot(
  serverKey: string,
  includeLiveData = false
): Promise<ErlcSnapshot> {
  const apiBase =
    (
      process.env
        .ERLC_API_BASE_URL ||
      DEFAULT_ERLC_API
    ).replace(/\/$/, "");

  const params =
    new URLSearchParams();

  if (includeLiveData) {
    params.set(
      "Players",
      "true"
    );

    params.set(
      "Staff",
      "true"
    );

    params.set(
      "Queue",
      "true"
    );

    params.set(
      "Vehicles",
      "true"
    );

    params.set(
      "EmergencyCalls",
      "true"
    );
  }

  const query =
    params.toString();

  const url =
    `${apiBase}/v2/server${
      query
        ? `?${query}`
        : ""
    }`;

  let response: Response;

  try {
    response =
      await fetch(
        url,
        {
          method:
            "GET",

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
  } catch (error) {
    throw new ErlcApiError(
      error instanceof Error
        ? `Unable to reach ER:LC: ${error.message}`
        : "Unable to reach ER:LC.",
      502
    );
  }

  if (!response.ok) {
    const message =
      await errorMessage(
        response
      );

    if (
      response.status ===
        401 ||
      response.status ===
        403
    ) {
      throw new ErlcApiError(
        `ER:LC authentication failed (${response.status}): ${message}`,
        response.status
      );
    }

    if (
      response.status ===
      429
    ) {
      throw new ErlcApiError(
        `ER:LC rate limit reached: ${message}`,
        429
      );
    }

    throw new ErlcApiError(
      `ER:LC request failed (${response.status}): ${message}`,
      response.status
    );
  }

  const raw =
    (await response.json()) as RawErlcServer;

  return {
    name:
      textValue(
        raw.Name,
        raw.name
      ),

    joinCode:
      textValue(
        raw.JoinKey,
        raw.joinKey,
        raw.JoinCode,
        raw.joinCode
      ),

    currentPlayers:
      numberValue(
        raw.CurrentPlayers,
        raw.currentPlayers
      ),

    maxPlayers:
      numberValue(
        raw.MaxPlayers,
        raw.maxPlayers
      ),

    players:
      arrayValue(
        raw.Players,
        raw.players
      ),

    queue:
      arrayValue(
        raw.Queue,
        raw.queue
      ),

    staff:
      raw.Staff ??
      raw.staff ??
      null,

    emergencyCalls:
      arrayValue(
        raw.EmergencyCalls,
        raw.emergencyCalls
      ),

    vehicles:
      arrayValue(
        raw.Vehicles,
        raw.vehicles
      ),

    lastCheckedAt:
      new Date()
        .toISOString(),
  };
}

export function getInternalServerId(
  _serverKey: string
) {
  return null;
}
