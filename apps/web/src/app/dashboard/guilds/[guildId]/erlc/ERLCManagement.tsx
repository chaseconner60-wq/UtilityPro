"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type PlayerProfile = {
  isStaff: boolean;
  role: string | null;
  department: string | null;
  rank: string | null;
  notes: string | null;
  activityExempt: boolean;
};

type Player = {
  userId: string;
  username: string;
  currentTeam: string | null;
  callsign: string | null;
  lastSeenAt: string;
  totalSeconds: number;
  sessionsAttended: number;
  joinCount: number;
  inactiveDays: number;
  activityStatus:
    | "active"
    | "warning"
    | "inactive"
    | "exempt";
  activityRequirementMet: boolean;
  readinessScore: number;
  promotionReady: boolean;
  department: string;
  profile: PlayerProfile | null;
};

type Settings = {
  minimumTrackedSeconds: number;
  minimumSessions: number;
  inactivityDays: number;
  promotionReadySeconds: number;
  promotionReadySessions: number;
};

type Mapping = {
  id: string;
  sourceTeam: string;
  departmentName: string;
  isStaffDepartment: boolean;
};

type ManagementData = {
  settings: Settings;
  departmentMappings: Mapping[];
  players: Player[];
  summary: {
    trackedPlayers: number;
    configuredStaff: number;
    inactivePlayers: number;
    activityWarnings: number;
    promotionReady: number;
  };
};

type Attendance = {
  id: string;
  sessionId: string;
  team: string | null;
  joinedAt: string;
  leftAt: string | null;
  durationSeconds: number;
};

export default function ERLCManagement({
  guildId,
  connected,
}: {
  guildId: string;
  connected: boolean;
}) {
  const [
    data,
    setData,
  ] =
    useState<ManagementData | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
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
    search,
    setSearch,
  ] =
    useState("");

  const [
    selected,
    setSelected,
  ] =
    useState<Player | null>(
      null
    );

  const [
    attendance,
    setAttendance,
  ] =
    useState<Attendance[]>([]);

  const [
    sourceTeam,
    setSourceTeam,
  ] =
    useState("");

  const [
    departmentName,
    setDepartmentName,
  ] =
    useState("");

  const [
    staffDepartment,
    setStaffDepartment,
  ] =
    useState(false);

  const [
    settingsForm,
    setSettingsForm,
  ] =
    useState({
      minimumHours: "1",
      minimumSessions: "2",
      inactivityDays: "14",
      promotionHours: "3",
      promotionSessions: "5",
    });

  const [
    profileForm,
    setProfileForm,
  ] =
    useState({
      role: "",
      department: "",
      rank: "",
      notes: "",
      activityExempt: false,
    });

  async function load() {
    if (!connected) {
      setLoading(false);
      return;
    }

    try {
      const response =
        await fetch(
          `/api/guilds/${guildId}/erlc?management=1`,
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
          "Unable to load management."
        );
      }

      setData(
        result
      );

      setSettingsForm({
        minimumHours:
          String(
            Math.round(
              (
                result.settings
                  .minimumTrackedSeconds /
                3600
              ) *
                10
            ) /
              10
          ),

        minimumSessions:
          String(
            result.settings
              .minimumSessions
          ),

        inactivityDays:
          String(
            result.settings
              .inactivityDays
          ),

        promotionHours:
          String(
            Math.round(
              (
                result.settings
                  .promotionReadySeconds /
                3600
              ) *
                10
            ) /
              10
          ),

        promotionSessions:
          String(
            result.settings
              .promotionReadySessions
          ),
      });

      setError("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load management."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [
    guildId,
    connected,
  ]);

  async function action(
    body: unknown
  ) {
    setSaving(true);
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
          "Unable to save."
        );
      }

      setSuccess(
        "Changes saved."
      );

      await load();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to save."
      );
    } finally {
      setSaving(false);
    }
  }

  async function openPlayer(
    player: Player
  ) {
    setSelected(
      player
    );

    setProfileForm({
      role:
        player.profile?.role ??
        "",

      department:
        player.profile
          ?.department ??
        "",

      rank:
        player.profile?.rank ??
        "",

      notes:
        player.profile?.notes ??
        "",

      activityExempt:
        player.profile
          ?.activityExempt ??
        false,
    });

    try {
      const response =
        await fetch(
          `/api/guilds/${guildId}/erlc?management=1&userId=${encodeURIComponent(player.userId)}`,
          {
            cache:
              "no-store",
          }
        );

      const result =
        await response.json();

      setAttendance(
        response.ok
          ? result.attendance ??
              []
          : []
      );
    } catch {
      setAttendance(
        []
      );
    }
  }

  const filteredPlayers =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        if (!query) {
          return (
            data?.players ??
            []
          );
        }

        return (
          data?.players ??
          []
        ).filter(
          (player) =>
            player.username
              .toLowerCase()
              .includes(query) ||
            player.userId.includes(
              query
            ) ||
            player.department
              .toLowerCase()
              .includes(query)
        );
      },
      [
        data,
        search,
      ]
    );

  if (!connected) {
    return (
      <Empty
        title="Connect ER:LC first"
        detail="RP Management becomes available after an ER:LC private server is connected."
      />
    );
  }

  if (
    loading &&
    !data
  ) {
    return (
      <div className="h-[520px] animate-pulse rounded-3xl border border-white/[0.07] bg-white/[0.02]" />
    );
  }

  return (
    <>
      <div className="rounded-3xl border border-white/[0.07] bg-gradient-to-br from-sky-500/[0.08] via-white/[0.025] to-indigo-500/[0.05] px-6 py-7 sm:px-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-400">
          Administration
        </p>

        <h2 className="mt-3 text-3xl font-bold">
          RP Management
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
          Staff configuration,
          activity requirements,
          department mappings,
          inactivity monitoring and
          promotion readiness.
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

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Metric
          label="Tracked"
          value={String(
            data?.summary
              .trackedPlayers ??
            0
          )}
        />

        <Metric
          label="Staff"
          value={String(
            data?.summary
              .configuredStaff ??
            0
          )}
        />

        <Metric
          label="Inactive"
          value={String(
            data?.summary
              .inactivePlayers ??
            0
          )}
        />

        <Metric
          label="Warnings"
          value={String(
            data?.summary
              .activityWarnings ??
            0
          )}
        />

        <Metric
          label="Promotion Ready"
          value={String(
            data?.summary
              .promotionReady ??
            0
          )}
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Panel
          title="Activity Requirements"
          detail="Server-wide requirements used by UtilityX."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Required Hours"
              value={
                settingsForm
                  .minimumHours
              }
              onChange={(value) =>
                setSettingsForm(
                  (current) => ({
                    ...current,
                    minimumHours:
                      value,
                  })
                )
              }
            />

            <Field
              label="Required Sessions"
              value={
                settingsForm
                  .minimumSessions
              }
              onChange={(value) =>
                setSettingsForm(
                  (current) => ({
                    ...current,
                    minimumSessions:
                      value,
                  })
                )
              }
            />

            <Field
              label="Inactive After Days"
              value={
                settingsForm
                  .inactivityDays
              }
              onChange={(value) =>
                setSettingsForm(
                  (current) => ({
                    ...current,
                    inactivityDays:
                      value,
                  })
                )
              }
            />

            <Field
              label="Promotion Hours"
              value={
                settingsForm
                  .promotionHours
              }
              onChange={(value) =>
                setSettingsForm(
                  (current) => ({
                    ...current,
                    promotionHours:
                      value,
                  })
                )
              }
            />

            <Field
              label="Promotion Sessions"
              value={
                settingsForm
                  .promotionSessions
              }
              onChange={(value) =>
                setSettingsForm(
                  (current) => ({
                    ...current,
                    promotionSessions:
                      value,
                  })
                )
              }
            />
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={() =>
              void action({
                action:
                  "settings",

                settings: {
                  minimumTrackedSeconds:
                    Math.round(
                      Number(
                        settingsForm
                          .minimumHours
                      ) *
                        3600
                    ),

                  minimumSessions:
                    Number(
                      settingsForm
                        .minimumSessions
                    ),

                  inactivityDays:
                    Number(
                      settingsForm
                        .inactivityDays
                    ),

                  promotionReadySeconds:
                    Math.round(
                      Number(
                        settingsForm
                          .promotionHours
                      ) *
                        3600
                    ),

                  promotionReadySessions:
                    Number(
                      settingsForm
                        .promotionSessions
                    ),
                },
              })
            }
            className="mt-5 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            Save Requirements
          </button>
        </Panel>

        <Panel
          title="Department Mapping"
          detail="Map ER:LC teams to your server's department names."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="ER:LC Team"
              value={
                sourceTeam
              }
              onChange={
                setSourceTeam
              }
              placeholder="Police"
            />

            <Field
              label="Department"
              value={
                departmentName
              }
              onChange={
                setDepartmentName
              }
              placeholder="State Patrol"
            />
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm text-zinc-400">
            <input
              type="checkbox"
              checked={
                staffDepartment
              }
              onChange={(event) =>
                setStaffDepartment(
                  event.target
                    .checked
                )
              }
            />

            Staff department
          </label>

          <button
            type="button"
            disabled={
              saving ||
              !sourceTeam.trim() ||
              !departmentName.trim()
            }
            onClick={() =>
              void action({
                action:
                  "department-save",

                mapping: {
                  sourceTeam,
                  departmentName,
                  isStaffDepartment:
                    staffDepartment,
                },
              })
            }
            className="mt-5 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            Add Mapping
          </button>

          <div className="mt-5 space-y-2">
            {data
              ?.departmentMappings
              .map(
                (mapping) => (
                  <div
                    key={
                      mapping.id
                    }
                    className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {
                          mapping.sourceTeam
                        }
                        {" → "}
                        {
                          mapping.departmentName
                        }
                      </p>

                      {mapping.isStaffDepartment && (
                        <p className="mt-1 text-xs text-sky-400">
                          Staff Department
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        void action({
                          action:
                            "department-delete",

                          mappingId:
                            mapping.id,
                        })
                      }
                      className="text-xs text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                )
              )}
          </div>
        </Panel>
      </div>

      <Panel
        title="Player Management"
        detail="Activity, staff status and promotion readiness."
        className="mt-5"
      >
        <input
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
          placeholder="Search username, Roblox ID or department..."
          className="mb-4 w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-zinc-700"
        />

        <div className="divide-y divide-white/[0.05]">
          {filteredPlayers.map(
            (player) => (
              <button
                key={
                  player.userId
                }
                type="button"
                onClick={() =>
                  void openPlayer(
                    player
                  )
                }
                className="grid w-full gap-4 px-2 py-4 text-left transition hover:bg-white/[0.02] md:grid-cols-[1.4fr_.8fr_.7fr_.7fr_.6fr]"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">
                      {
                        player.username
                      }
                    </p>

                    {player.profile?.isStaff && (
                      <Badge>
                        Staff
                      </Badge>
                    )}

                    {player.promotionReady && (
                      <Badge>
                        Ready
                      </Badge>
                    )}
                  </div>

                  <p className="mt-1 text-xs text-zinc-600">
                    {
                      player.department
                    }
                  </p>
                </div>

                <Small
                  label="Tracked"
                  value={duration(
                    player.totalSeconds
                  )}
                />

                <Small
                  label="Sessions"
                  value={String(
                    player.sessionsAttended
                  )}
                />

                <Small
                  label="Readiness"
                  value={`${player.readinessScore}%`}
                />

                <Status
                  status={
                    player.activityStatus
                  }
                />
              </button>
            )
          )}
        </div>
      </Panel>

      {selected && (
        <Panel
          title={
            selected.username
          }
          detail={`Roblox ID ${selected.userId}`}
          className="mt-5"
        >
          <div className="grid gap-5 xl:grid-cols-2">
            <div>
              <h4 className="font-semibold">
                Staff Profile
              </h4>

              <div className="mt-4 grid gap-3">
                <Field
                  label="Staff Role"
                  value={
                    profileForm.role
                  }
                  onChange={(value) =>
                    setProfileForm(
                      (current) => ({
                        ...current,
                        role:
                          value,
                      })
                    )
                  }
                  placeholder="Moderator"
                />

                <Field
                  label="Department Override"
                  value={
                    profileForm
                      .department
                  }
                  onChange={(value) =>
                    setProfileForm(
                      (current) => ({
                        ...current,
                        department:
                          value,
                      })
                    )
                  }
                  placeholder="State Patrol"
                />

                <Field
                  label="Rank"
                  value={
                    profileForm.rank
                  }
                  onChange={(value) =>
                    setProfileForm(
                      (current) => ({
                        ...current,
                        rank:
                          value,
                      })
                    )
                  }
                  placeholder="Sergeant"
                />

                <textarea
                  value={
                    profileForm.notes
                  }
                  onChange={(event) =>
                    setProfileForm(
                      (current) => ({
                        ...current,
                        notes:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="Management notes..."
                  className="min-h-24 rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm outline-none"
                />

                <label className="flex items-center gap-2 text-sm text-zinc-400">
                  <input
                    type="checkbox"
                    checked={
                      profileForm
                        .activityExempt
                    }
                    onChange={(event) =>
                      setProfileForm(
                        (current) => ({
                          ...current,
                          activityExempt:
                            event.target
                              .checked,
                        })
                      )
                    }
                  />

                  Exempt from activity requirements
                </label>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={
                    saving
                  }
                  onClick={() =>
                    void action({
                      action:
                        "staff-save",

                      userId:
                        selected.userId,

                      profile: {
                        username:
                          selected.username,

                        isStaff:
                          true,

                        ...profileForm,
                      },
                    })
                  }
                  className="rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold"
                >
                  Save Staff Profile
                </button>

                {selected.profile && (
                  <button
                    type="button"
                    onClick={() =>
                      void action({
                        action:
                          "staff-delete",

                        userId:
                          selected.userId,
                      })
                    }
                    className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-2.5 text-sm font-semibold text-red-300"
                  >
                    Remove Staff Override
                  </button>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold">
                Recent Attendance
              </h4>

              <div className="mt-4 space-y-2">
                {attendance.length ? (
                  attendance.map(
                    (record) => (
                      <div
                        key={
                          record.id
                        }
                        className="rounded-xl border border-white/[0.06] bg-black/20 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium">
                            {record.team ||
                              "Unknown Team"}
                          </p>

                          <p className="text-xs text-zinc-500">
                            {duration(
                              record.durationSeconds
                            )}
                          </p>
                        </div>

                        <p className="mt-2 text-xs text-zinc-600">
                          {new Date(
                            record.joinedAt
                          ).toLocaleString()}
                        </p>
                      </div>
                    )
                  )
                ) : (
                  <p className="text-sm text-zinc-600">
                    No attendance records yet.
                  </p>
                )}
              </div>
            </div>
          </div>
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
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.018] p-5">
      <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-700">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold">
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

function Status({
  status,
}: {
  status: string;
}) {
  return (
    <span className="inline-flex h-fit w-fit rounded-full border border-white/[0.07] bg-white/[0.035] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
      {status}
    </span>
  );
}

function Badge({
  children,
}: {
  children:
    ReactNode;
}) {
  return (
    <span className="rounded-full bg-sky-500/[0.1] px-2 py-0.5 text-[10px] font-semibold uppercase text-sky-300">
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
      seconds / 3600
    );

  const minutes =
    Math.floor(
      (
        seconds % 3600
      ) / 60
    );

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m`;
  }

  return `${seconds}s`;
}
