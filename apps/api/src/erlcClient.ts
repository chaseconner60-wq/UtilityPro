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

export type ErlcPlayer = {
  userId: string | null;
  name: string;
  team: string | null;
  callsign: string | null;
};

export async function fetchErlcPlayers(
  serverKey: string
): Promise<ErlcPlayer[]> {
  const apiBase =
    (
      process.env.ERLC_API_BASE_URL ||
      DEFAULT_ERLC_API
    ).replace(/\/+$/, "");

  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () => controller.abort(),
      10_000
    );

  let response: Response;

  try {
    response =
      await fetch(
        `${apiBase}/v2/server?Players=true`,
        {
          method: "GET",
          headers: {
            "Server-Key":
              serverKey,
            Accept:
              "application/json",
          },
          signal:
            controller.signal,
        }
      );
  } catch (error) {
    clearTimeout(timeout);

    throw new ErlcApiError(
      error instanceof Error
        ? error.message
        : "Unable to reach ER:LC.",
      502
    );
  }

  clearTimeout(timeout);

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
        `ER:LC player authentication failed (${response.status}): ${message}`,
        response.status
      );
    }

    if (
      response.status ===
      429
    ) {
      throw new ErlcApiError(
        `ER:LC player request was rate limited: ${message}`,
        429
      );
    }

    throw new ErlcApiError(
      message,
      response.status
    );
  }

  const raw =
    (await response.json()) as
      Record<string, unknown>;

  const playerSource =
    Array.isArray(
      raw.Players
    )
      ? raw.Players
      : Array.isArray(
          raw.players
        )
        ? raw.players
        : [];

  return playerSource
    .map(
      normalizeErlcPlayer
    )
    .filter(
      (
        player
      ): player is ErlcPlayer =>
        player !== null
    );
}

function normalizeErlcPlayer(
  value: unknown
): ErlcPlayer | null {
  if (
    !value ||
    typeof value !==
      "object"
  ) {
    return null;
  }

  const row =
    value as Record<
      string,
      unknown
    >;

  const rawPlayer =
    typeof row.Player ===
      "string"
      ? row.Player
      : typeof row.player ===
          "string"
        ? row.player
        : null;

  let parsedName:
    | string
    | null = null;

  let parsedUserId:
    | string
    | null = null;

  if (rawPlayer) {
    const colon =
      rawPlayer.lastIndexOf(
        ":"
      );

    if (colon > 0) {
      parsedName =
        rawPlayer
          .slice(
            0,
            colon
          )
          .trim();

      parsedUserId =
        rawPlayer
          .slice(
            colon + 1
          )
          .trim();
    } else {
      parsedName =
        rawPlayer.trim();
    }
  }

  const name =
    textValue(
      row.Name
    ) ??
    textValue(
      row.name
    ) ??
    textValue(
      row.Username
    ) ??
    textValue(
      row.username
    ) ??
    parsedName ??
    "Unknown Player";

  const userId =
    textValue(
      row.UserId
    ) ??
    textValue(
      row.userId
    ) ??
    textValue(
      row.UserID
    ) ??
    textValue(
      row.userid
    ) ??
    parsedUserId;

  const team =
    textValue(
      row.Team
    ) ??
    textValue(
      row.team
    );

  const callsign =
    textValue(
      row.Callsign
    ) ??
    textValue(
      row.CallSign
    ) ??
    textValue(
      row.callsign
    );

  return {
    userId,
    name,
    team,
    callsign,
  };
}

export type ErlcStaffMember = {
  userId: string | null;
  name: string;
  role: string;
};

export type ErlcEmergencyCall = {
  callNumber: string | null;
  team: string | null;
  callerId: string | null;
  playerIds: string[];
  description: string | null;
  location: string | null;
  startedAt: string | null;
};

async function fetchErlcFocusedSection(
  serverKey: string,
  query: string
): Promise<Record<string, unknown>> {
  const apiBase =
    (
      process.env.ERLC_API_BASE_URL ||
      DEFAULT_ERLC_API
    ).replace(/\/+$/, "");

  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () => controller.abort(),
      10_000
    );

  let response: Response;

  try {
    response =
      await fetch(
        `${apiBase}/v2/server?${query}=true`,
        {
          method: "GET",

          headers: {
            "Server-Key":
              serverKey,

            Accept:
              "application/json",
          },

          signal:
            controller.signal,
        }
      );
  } catch (error) {
    clearTimeout(
      timeout
    );

    throw new ErlcApiError(
      error instanceof Error
        ? error.message
        : "Unable to reach ER:LC.",
      502
    );
  }

  clearTimeout(
    timeout
  );

  if (!response.ok) {
    const message =
      await errorMessage(
        response
      );

    throw new ErlcApiError(
      message,
      response.status
    );
  }

  return (
    await response.json()
  ) as Record<
    string,
    unknown
  >;
}

function parsePlayerIdentity(
  value: unknown
): {
  name: string | null;
  userId: string | null;
} {
  if (
    typeof value ===
    "number"
  ) {
    return {
      name: null,
      userId:
        String(value),
    };
  }

  if (
    typeof value !==
    "string"
  ) {
    return {
      name: null,
      userId: null,
    };
  }

  const text =
    value.trim();

  const colon =
    text.lastIndexOf(
      ":"
    );

  if (
    colon > 0 &&
    /^\d+$/.test(
      text
        .slice(
          colon + 1
        )
        .trim()
    )
  ) {
    return {
      name:
        text
          .slice(
            0,
            colon
          )
          .trim(),

      userId:
        text
          .slice(
            colon + 1
          )
          .trim(),
    };
  }

  if (
    /^\d+$/.test(
      text
    )
  ) {
    return {
      name: null,
      userId:
        text,
    };
  }

  return {
    name:
      text,
    userId:
      null,
  };
}

export async function fetchErlcStaff(
  serverKey: string
): Promise<ErlcStaffMember[]> {
  const raw =
    await fetchErlcFocusedSection(
      serverKey,
      "Staff"
    );

  const section =
    raw.Staff ??
    raw.staff ??
    [];

  const results:
    ErlcStaffMember[] =
      [];

  function walk(
    value: unknown,
    roleHint =
      "Staff"
  ) {
    if (
      value === null ||
      value === undefined
    ) {
      return;
    }

    if (
      Array.isArray(
        value
      )
    ) {
      for (
        const item
        of value
      ) {
        walk(
          item,
          roleHint
        );
      }

      return;
    }

    if (
      typeof value ===
        "string" ||
      typeof value ===
        "number"
    ) {
      const identity =
        parsePlayerIdentity(
          value
        );

      if (
        identity.name ||
        identity.userId
      ) {
        results.push({
          name:
            identity.name ??
            "Unknown Staff",

          userId:
            identity.userId,

          role:
            roleHint,
        });
      }

      return;
    }

    if (
      typeof value !==
      "object"
    ) {
      return;
    }

    const row =
      value as Record<
        string,
        unknown
      >;

    const directIdentity =
      row.Player ??
      row.player ??
      row.Name ??
      row.name ??
      row.Username ??
      row.username;

    const directUserId =
      row.UserId ??
      row.userId ??
      row.UserID ??
      row.robloxId ??
      row.RobloxId;

    const directRole =
      textValue(
        row.Permission
      ) ??
      textValue(
        row.permission
      ) ??
      textValue(
        row.Role
      ) ??
      textValue(
        row.role
      ) ??
      roleHint;

    if (
      directIdentity !==
        undefined ||
      directUserId !==
        undefined
    ) {
      const identity =
        parsePlayerIdentity(
          directIdentity
        );

      const idIdentity =
        parsePlayerIdentity(
          directUserId
        );

      results.push({
        name:
          identity.name ??
          textValue(
            row.Username
          ) ??
          textValue(
            row.username
          ) ??
          textValue(
            row.Name
          ) ??
          textValue(
            row.name
          ) ??
          "Unknown Staff",

        userId:
          identity.userId ??
          idIdentity.userId,

        role:
          directRole,
      });

      return;
    }

    for (
      const [
        key,
        nested,
      ] of Object.entries(
        row
      )
    ) {
      walk(
        nested,
        key
      );
    }
  }

  walk(
    section
  );

  const unique =
    new Map<
      string,
      ErlcStaffMember
    >();

  for (
    const member
    of results
  ) {
    const key =
      member.userId ??
      `${member.role}:${member.name}`;

    unique.set(
      key,
      member
    );
  }

  return [
    ...unique.values(),
  ];
}

export async function fetchErlcEmergencyCalls(
  serverKey: string
): Promise<ErlcEmergencyCall[]> {
  const raw =
    await fetchErlcFocusedSection(
      serverKey,
      "EmergencyCalls"
    );

  const source =
    Array.isArray(
      raw.EmergencyCalls
    )
      ? raw.EmergencyCalls
      : Array.isArray(
          raw.emergencyCalls
        )
        ? raw.emergencyCalls
        : [];

  return source.map(
    (
      value,
      index
    ) => {
      const row =
        value &&
        typeof value ===
          "object"
          ? value as Record<
              string,
              unknown
            >
          : {};

      const playerSource =
        row.Players ??
        row.players ??
        row.PlayerIds ??
        row.playerIds;

      const playerIds =
        Array.isArray(
          playerSource
        )
          ? playerSource.map(
              (item) =>
                String(
                  item
                )
            )
          : [];

      const startedRaw =
        row.StartedAt ??
        row.startedAt ??
        row.StartTime ??
        row.startTime ??
        row.Timestamp ??
        row.timestamp;

      let startedAt:
        | string
        | null = null;

      if (
        typeof startedRaw ===
        "number"
      ) {
        const millis =
          startedRaw >
          10_000_000_000
            ? startedRaw
            : startedRaw *
              1000;

        startedAt =
          new Date(
            millis
          ).toISOString();
      } else if (
        typeof startedRaw ===
        "string"
      ) {
        startedAt =
          startedRaw;
      }

      return {
        callNumber:
          textValue(
            row.CallNumber
          ) ??
          textValue(
            row.callNumber
          ) ??
          String(
            index + 1
          ),

        team:
          textValue(
            row.Team
          ) ??
          textValue(
            row.team
          ),

        callerId:
          textValue(
            row.Caller
          ) ??
          textValue(
            row.caller
          ) ??
          textValue(
            row.CallerId
          ) ??
          textValue(
            row.callerId
          ),

        playerIds,

        description:
          textValue(
            row.Description
          ) ??
          textValue(
            row.description
          ),

        location:
          textValue(
            row.PositionDescriptor
          ) ??
          textValue(
            row.positionDescriptor
          ) ??
          textValue(
            row.Location
          ) ??
          textValue(
            row.location
          ),

        startedAt,
      };
    }
  );
}
