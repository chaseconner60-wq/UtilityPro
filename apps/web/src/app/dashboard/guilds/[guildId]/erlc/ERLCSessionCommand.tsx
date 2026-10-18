"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Player = {
  userId: string;
  username: string;
  department: string;
};

type CommandSession = {
  id: string;
  status: string;
  title: string;
  sessionType: string;
  hostUserId: string;
  hostUsername: string;
  coHosts: string[];
  minimumAttendanceSeconds: number;
  notes: string | null;
  scheduledFor: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;

  participantCount?: number;
  qualifiedCount?: number;
  staffCount?: number;
};

type Participant = {
  userId: string;
  username: string;
  department: string | null;
  durationSeconds: number;
  qualified: boolean;
  isStaff: boolean;
  firstSeenAt?: string;
  lastSeenAt?: string;
};

type ActiveData = {
  session: CommandSession | null;
  participants: Participant[];
};

export default function ERLCSessionCommand({
  guildId,
  connected,
}: {
  guildId: string;
  connected: boolean;
}) {
  const [
    sessions,
    setSessions,
  ] =
    useState<CommandSession[]>([]);

  const [
    active,
    setActive,
  ] =
    useState<ActiveData>({
      session: null,
      participants: [],
    });

  const [
    players,
    setPlayers,
  ] =
    useState<Player[]>([]);

  const [
    selectedSession,
    setSelectedSession,
  ] =
    useState<{
      session:
        CommandSession;
      participants:
        Participant[];
    } | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    busy,
    setBusy,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  const [
    title,
    setTitle,
  ] =
    useState("");

  const [
    sessionType,
    setSessionType,
  ] =
    useState(
      "patrol"
    );

  const [
    hostUserId,
    setHostUserId,
  ] =
    useState("");

  const [
    coHosts,
    setCoHosts,
  ] =
    useState("");

  const [
    minimumMinutes,
    setMinimumMinutes,
  ] =
    useState(
      "15"
    );

  const [
    scheduledFor,
    setScheduledFor,
  ] =
    useState("");

  const [
    notes,
    setNotes,
  ] =
    useState("");

  async function loadAll(
    quiet = false
  ) {
    if (!connected) {
      setLoading(false);
      return;
    }

    if (!quiet) {
      setLoading(true);
    }

    try {
      const [
        sessionsResponse,
        activeResponse,
        managementResponse,
      ] =
        await Promise.all([
          fetch(
            `/api/guilds/${guildId}/erlc?commandSessions=1`,
            {
              cache:
                "no-store",
            }
          ),

          fetch(
            `/api/guilds/${guildId}/erlc?commandActive=1`,
            {
              cache:
                "no-store",
            }
          ),

          fetch(
            `/api/guilds/${guildId}/erlc?management=1`,
            {
              cache:
                "no-store",
            }
          ),
        ]);

      const sessionsData =
        await sessionsResponse.json();

      const activeData =
        await activeResponse.json();

      const managementData =
        await managementResponse.json();

      if (
        !sessionsResponse.ok
      ) {
        throw new Error(
          sessionsData.error ||
          "Unable to load sessions."
        );
      }

      if (
        !activeResponse.ok
      ) {
        throw new Error(
          activeData.error ||
          "Unable to load active session."
        );
      }

      setSessions(
        sessionsData.sessions ??
        []
      );

      setActive({
        session:
          activeData.session ??
          null,

        participants:
          activeData.participants ??
          [],
      });

      if (
        managementResponse.ok
      ) {
        setPlayers(
          managementData.players ??
          []
        );
      }

      setError("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load Session Command."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();

    if (!connected) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          void loadAll(
            true
          );
        },
        30_000
      );

    return () =>
      window.clearInterval(
        timer
      );
  }, [
    guildId,
    connected,
  ]);

  async function action(
    body: unknown
  ) {
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const response =
        await fetch(
          `/api/guilds/${guildId}/erlc`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                body
              ),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
          "Session action failed."
        );
      }

      setSuccess(
        "Session updated."
      );

      await loadAll(
        true
      );

      return true;
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Session action failed."
      );

      return false;
    } finally {
      setBusy(false);
    }
  }

  async function createSession() {
    const host =
      players.find(
        (player) =>
          player.userId ===
          hostUserId
      );

    if (
      !title.trim() ||
      !hostUserId ||
      !host
    ) {
      setError(
        "Enter a title and select a host."
      );

      return;
    }

    const parsedCoHosts =
      coHosts
        .split(",")
        .map(
          (value) =>
            value.trim()
        )
        .filter(
          Boolean
        );

    const ok =
      await action({
        action:
          "command-create",

        session: {
          title:
            title.trim(),

          sessionType,

          hostUserId,

          hostUsername:
            host.username,

          coHosts:
            parsedCoHosts,

          minimumAttendanceSeconds:
            Math.max(
              0,
              Math.round(
                Number(
                  minimumMinutes
                ) *
                  60
              )
            ),

          scheduledFor:
            scheduledFor
              ? new Date(
                  scheduledFor
                ).toISOString()
              : null,

          notes:
            notes.trim() ||
            null,
        },
      });

    if (ok) {
      setTitle("");
      setHostUserId("");
      setCoHosts("");
      setMinimumMinutes(
        "15"
      );
      setScheduledFor("");
      setNotes("");
    }
  }

  async function inspect(
    session:
      CommandSession
  ) {
    try {
      const response =
        await fetch(
          `/api/guilds/${guildId}/erlc?commandSessionId=${encodeURIComponent(session.id)}`,
          {
            cache:
              "no-store",
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
          "Unable to load session."
        );
      }

      setSelectedSession({
        session:
          result.session,

        participants:
          result.participants ??
          [],
      });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load session."
      );
    }
  }

  const scheduled =
    useMemo(
      () =>
        sessions.filter(
          (session) =>
            session.status ===
            "scheduled"
        ),
      [
        sessions,
      ]
    );

  const history =
    useMemo(
      () =>
        sessions.filter(
          (session) =>
            session.status ===
              "ended" ||
            session.status ===
              "cancelled"
        ),
      [
        sessions,
      ]
    );

  if (!connected) {
    return (
      <Empty
        title="Connect ER:LC first"
        detail="Session Command requires an active ER:LC connection."
      />
    );
  }

  if (loading) {
    return (
      <div className="h-[520px] animate-pulse rounded-3xl border border-white/[0.07] bg-white/[0.02]" />
    );
  }

  return (
    <>
      <div className="rounded-3xl border border-white/[0.07] bg-gradient-to-br from-sky-500/[0.09] via-white/[0.025] to-indigo-500/[0.05] px-6 py-7 sm:px-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-400">
          Operations
        </p>

        <h2 className="mt-3 text-3xl font-bold">
          Session Command
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
          Schedule and run patrols,
          track attendance, enforce
          minimum participation and
          generate session summaries.
        </p>
      </div>

      {error && (
        <Notice
          text={error}
          error
        />
      )}

      {success && (
        <Notice
          text={success}
        />
      )}

      {active.session ? (
        <Panel
          className="mt-5"
          title={
            active.session
              .title
          }
          detail="Active managed session"
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Metric
              label="Host"
              value={
                active.session
                  .hostUsername
              }
            />

            <Metric
              label="Players"
              value={String(
                active
                  .participants
                  .length
              )}
            />

            <Metric
              label="Qualified"
              value={String(
                active
                  .participants
                  .filter(
                    (
                      participant
                    ) =>
                      participant
                        .qualified
                  )
                  .length
              )}
            />

            <Metric
              label="Staff"
              value={String(
                active
                  .participants
                  .filter(
                    (
                      participant
                    ) =>
                      participant
                        .isStaff
                  )
                  .length
              )}
            />

            <Metric
              label="Minimum"
              value={duration(
                active.session
                  .minimumAttendanceSeconds
              )}
            />
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-white/[0.06]">
            {active
              .participants
              .length ? (
              active.participants.map(
                (
                  participant
                ) => (
                  <div
                    key={
                      participant.userId
                    }
                    className="grid gap-3 border-b border-white/[0.05] px-4 py-3 last:border-b-0 md:grid-cols-[1.4fr_1fr_.8fr_.6fr]"
                  >
                    <div>
                      <p className="font-medium">
                        {
                          participant.username
                        }
                      </p>

                      <p className="mt-1 text-xs text-zinc-600">
                        Roblox ID{" "}
                        {
                          participant.userId
                        }
                      </p>
                    </div>

                    <Small
                      label="Department"
                      value={
                        participant.department ??
                        "Unknown"
                      }
                    />

                    <Small
                      label="Attendance"
                      value={duration(
                        participant.durationSeconds
                      )}
                    />

                    <div className="flex items-center gap-2">
                      {participant.isStaff && (
                        <Badge>
                          Staff
                        </Badge>
                      )}

                      {participant.qualified ? (
                        <Badge>
                          Qualified
                        </Badge>
                      ) : (
                        <Badge
                          muted
                        >
                          Tracking
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              )
            ) : (
              <p className="p-6 text-sm text-zinc-600">
                No attendance has been
                recorded for this session
                yet.
              </p>
            )}
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void action({
                action:
                  "command-end",

                sessionId:
                  active.session
                    ?.id,
              })
            }
            className="mt-5 rounded-xl border border-red-500/20 bg-red-500/[0.07] px-4 py-2.5 text-sm font-semibold text-red-300 disabled:opacity-50"
          >
            End Session
          </button>
        </Panel>
      ) : (
        <Panel
          className="mt-5"
          title="No Active Session"
          detail="Start a scheduled session when your staff is ready."
        >
          <p className="text-sm text-zinc-600">
            UtilityX will calculate
            attendance automatically from
            the ER:LC player tracker once
            the session begins.
          </p>
        </Panel>
      )}

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Panel
          title="Create Session"
          detail="Schedule a patrol or create one ready to start."
        >
          <div className="grid gap-4">
            <Field
              label="Session Title"
              value={title}
              onChange={
                setTitle
              }
              placeholder="Saturday Night Patrol"
            />

            <label className="block">
              <span className="text-xs font-medium text-zinc-500">
                Session Type
              </span>

              <select
                value={
                  sessionType
                }
                onChange={(event) =>
                  setSessionType(
                    event.target
                      .value
                  )
                }
                className="mt-2 w-full rounded-xl border border-white/[0.08] bg-[#090a0e] px-4 py-3 text-sm outline-none"
              >
                <option value="patrol">
                  Patrol
                </option>

                <option value="training">
                  Training
                </option>

                <option value="event">
                  Event
                </option>

                <option value="shift">
                  Staff Shift
                </option>

                <option value="other">
                  Other
                </option>
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-medium text-zinc-500">
                Host
              </span>

              <select
                value={
                  hostUserId
                }
                onChange={(event) =>
                  setHostUserId(
                    event.target
                      .value
                  )
                }
                className="mt-2 w-full rounded-xl border border-white/[0.08] bg-[#090a0e] px-4 py-3 text-sm outline-none"
              >
                <option value="">
                  Select tracked player
                </option>

                {players.map(
                  (player) => (
                    <option
                      key={
                        player.userId
                      }
                      value={
                        player.userId
                      }
                    >
                      {
                        player.username
                      }
                      {" — "}
                      {
                        player.department
                      }
                    </option>
                  )
                )}
              </select>
            </label>

            <Field
              label="Co-host Roblox IDs"
              value={coHosts}
              onChange={
                setCoHosts
              }
              placeholder="123456, 987654"
            />

            <Field
              label="Minimum Attendance Minutes"
              value={
                minimumMinutes
              }
              onChange={
                setMinimumMinutes
              }
            />

            <label className="block">
              <span className="text-xs font-medium text-zinc-500">
                Scheduled Time
              </span>

              <input
                type="datetime-local"
                value={
                  scheduledFor
                }
                onChange={(event) =>
                  setScheduledFor(
                    event.target
                      .value
                  )
                }
                className="mt-2 w-full rounded-xl border border-white/[0.08] bg-[#090a0e] px-4 py-3 text-sm outline-none"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-zinc-500">
                Notes
              </span>

              <textarea
                value={notes}
                onChange={(event) =>
                  setNotes(
                    event.target
                      .value
                  )
                }
                placeholder="Session instructions, required departments, etc."
                className="mt-2 min-h-24 w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-zinc-700"
              />
            </label>

            <button
              type="button"
              disabled={
                busy ||
                !title.trim() ||
                !hostUserId
              }
              onClick={() =>
                void createSession()
              }
              className="rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              Create Session
            </button>
          </div>
        </Panel>

        <Panel
          title="Scheduled Sessions"
          detail="Sessions waiting to be started."
        >
          <div className="space-y-3">
            {scheduled.length ? (
              scheduled.map(
                (session) => (
                  <div
                    key={
                      session.id
                    }
                    className="rounded-2xl border border-white/[0.06] bg-black/20 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          {
                            session.title
                          }
                        </p>

                        <p className="mt-1 text-xs text-zinc-600">
                          Host:{" "}
                          {
                            session.hostUsername
                          }
                        </p>

                        <p className="mt-1 text-xs text-zinc-600">
                          {session.scheduledFor
                            ? new Date(
                                session.scheduledFor
                              ).toLocaleString()
                            : "No scheduled time"}
                        </p>
                      </div>

                      <Badge>
                        {
                          session.sessionType
                        }
                      </Badge>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={
                          busy ||
                          Boolean(
                            active.session
                          )
                        }
                        onClick={() =>
                          void action({
                            action:
                              "command-start",

                            sessionId:
                              session.id,
                          })
                        }
                        className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 disabled:opacity-40"
                      >
                        Start
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void inspect(
                            session
                          )
                        }
                        className="rounded-lg bg-white/[0.05] px-3 py-2 text-xs font-semibold text-zinc-300"
                      >
                        View
                      </button>

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void action({
                            action:
                              "command-cancel",

                            sessionId:
                              session.id,
                          })
                        }
                        className="rounded-lg bg-red-500/[0.06] px-3 py-2 text-xs font-semibold text-red-300 disabled:opacity-40"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )
              )
            ) : (
              <p className="text-sm text-zinc-600">
                No scheduled sessions.
              </p>
            )}
          </div>
        </Panel>
      </div>

      <Panel
        className="mt-5"
        title="Session History"
        detail="Completed and cancelled managed sessions."
      >
        <div className="divide-y divide-white/[0.05]">
          {history.length ? (
            history.map(
              (session) => (
                <button
                  key={
                    session.id
                  }
                  type="button"
                  onClick={() =>
                    void inspect(
                      session
                    )
                  }
                  className="grid w-full gap-4 px-2 py-4 text-left transition hover:bg-white/[0.02] md:grid-cols-[1.5fr_.8fr_.8fr_.8fr_.6fr]"
                >
                  <div>
                    <p className="font-semibold">
                      {
                        session.title
                      }
                    </p>

                    <p className="mt-1 text-xs text-zinc-600">
                      {
                        session.hostUsername
                      }
                    </p>
                  </div>

                  <Small
                    label="Status"
                    value={
                      session.status
                    }
                  />

                  <Small
                    label="Players"
                    value={String(
                      session.participantCount ??
                      0
                    )}
                  />

                  <Small
                    label="Qualified"
                    value={String(
                      session.qualifiedCount ??
                      0
                    )}
                  />

                  <Small
                    label="Staff"
                    value={String(
                      session.staffCount ??
                      0
                    )}
                  />
                </button>
              )
            )
          ) : (
            <p className="py-6 text-sm text-zinc-600">
              No session history yet.
            </p>
          )}
        </div>
      </Panel>

      {selectedSession && (
        <Panel
          className="mt-5"
          title={
            selectedSession
              .session
              .title
          }
          detail="Session detail"
        >
          <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Status"
              value={
                selectedSession
                  .session
                  .status
              }
            />

            <Metric
              label="Host"
              value={
                selectedSession
                  .session
                  .hostUsername
              }
            />

            <Metric
              label="Attendance"
              value={String(
                selectedSession
                  .participants
                  .length
              )}
            />

            <Metric
              label="Qualified"
              value={String(
                selectedSession
                  .participants
                  .filter(
                    (
                      participant
                    ) =>
                      participant
                        .qualified
                  )
                  .length
              )}
            />
          </div>

          <div className="divide-y divide-white/[0.05]">
            {selectedSession
              .participants
              .map(
                (
                  participant
                ) => (
                  <div
                    key={
                      participant.userId
                    }
                    className="grid gap-3 px-2 py-4 md:grid-cols-[1.4fr_1fr_.8fr_.7fr]"
                  >
                    <div>
                      <p className="font-medium">
                        {
                          participant.username
                        }
                      </p>

                      <p className="mt-1 text-xs text-zinc-600">
                        {
                          participant.userId
                        }
                      </p>
                    </div>

                    <Small
                      label="Department"
                      value={
                        participant.department ??
                        "Unknown"
                      }
                    />

                    <Small
                      label="Time"
                      value={duration(
                        participant.durationSeconds
                      )}
                    />

                    <div className="flex gap-2">
                      {participant.isStaff && (
                        <Badge>
                          Staff
                        </Badge>
                      )}

                      {participant.qualified && (
                        <Badge>
                          Qualified
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              )}
          </div>

          <button
            type="button"
            onClick={() =>
              setSelectedSession(
                null
              )
            }
            className="mt-5 rounded-xl bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-zinc-300"
          >
            Close Detail
          </button>
        </Panel>
      )}
    </>
  );
}

function Panel({
  title,
  detail,
  children,
  className = "",
}: {
  title: string;
  detail: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-3xl border border-white/[0.07] bg-white/[0.018] p-6 ${className}`}
    >
      <h3 className="text-lg font-bold">
        {title}
      </h3>

      <p className="mt-1 text-sm text-zinc-600">
        {detail}
      </p>

      <div className="mt-5">
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange:
    (value: string) =>
      void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-zinc-500">
        {label}
      </span>

      <input
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-zinc-700"
      />
    </label>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
      <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-700">
        {label}
      </p>

      <p className="mt-2 truncate text-lg font-bold">
        {value}
      </p>
    </div>
  );
}

function Small({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-700">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-zinc-300">
        {value}
      </p>
    </div>
  );
}

function Badge({
  children,
  muted = false,
}: {
  children: ReactNode;
  muted?: boolean;
}) {
  return (
    <span
      className={`inline-flex h-fit rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${
        muted
          ? "bg-white/[0.05] text-zinc-500"
          : "bg-sky-500/[0.1] text-sky-300"
      }`}
    >
      {children}
    </span>
  );
}

function Notice({
  text,
  error = false,
}: {
  text: string;
  error?: boolean;
}) {
  return (
    <div
      className={`mt-4 rounded-xl border p-4 text-sm ${
        error
          ? "border-red-500/15 bg-red-500/[0.05] text-red-300"
          : "border-emerald-500/15 bg-emerald-500/[0.05] text-emerald-300"
      }`}
    >
      {text}
    </div>
  );
}

function Empty({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-3xl border border-white/[0.07] bg-white/[0.018] p-12 text-center">
      <p className="font-semibold">
        {title}
      </p>

      <p className="mt-2 text-sm text-zinc-600">
        {detail}
      </p>
    </div>
  );
}

function duration(
  seconds: number
) {
  const hours =
    Math.floor(
      seconds /
        3600
    );

  const minutes =
    Math.floor(
      (
        seconds %
        3600
      ) /
        60
    );

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m`;
  }

  return `${seconds}s`;
}
