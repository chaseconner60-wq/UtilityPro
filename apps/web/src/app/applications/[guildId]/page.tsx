"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useParams,
} from "next/navigation";

type Portal = {
  enabled: boolean;
  portalName: string;
  welcomeMessage: string | null;
};

type Form = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  maxApplicationsPerUser: number;
};

type Submission = {
  id: string;
  formId: string;
  applicantUserId: string;
  applicantUsername: string;
  status: string;
  submittedAt: string;
};

type Question = {
  id?: string;
  label: string;
  description: string;
  type:
    | "short"
    | "long"
    | "yes_no"
    | "single_select"
    | "multi_select";
  required: boolean;
  options: string[];
};

type Detail = {
  submission: Submission;
  form: Form;
  answers: Array<{
    question: {
      id: string;
      label: string;
    };
    value:
      | string
      | string[]
      | boolean
      | null;
  }>;
  reviews: Array<{
    id: string;
    action: string;
    reviewerUsername: string;
    note: string | null;
    createdAt: string;
  }>;
};

export default function ApplicationsPortal() {
  const params =
    useParams<{
      guildId: string;
    }>();

  const guildId =
    params.guildId;

  const [
    portal,
    setPortal,
  ] =
    useState<Portal | null>(
      null
    );

  const [
    forms,
    setForms,
  ] =
    useState<Form[]>([]);

  const [
    submissions,
    setSubmissions,
  ] =
    useState<Submission[]>([]);

  const [
    selectedForm,
    setSelectedForm,
  ] =
    useState<Form | null>(
      null
    );

  const [
    questions,
    setQuestions,
  ] =
    useState<Question[]>([]);

  const [
    selectedSubmission,
    setSelectedSubmission,
  ] =
    useState<Detail | null>(
      null
    );

  const [
    filter,
    setFilter,
  ] =
    useState(
      "pending"
    );

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    busy,
    setBusy,
  ] =
    useState(false);

  const [
    newName,
    setNewName,
  ] =
    useState("");

  const [
    newDescription,
    setNewDescription,
  ] =
    useState("");

  const [
    reviewerNote,
    setReviewerNote,
  ] =
    useState("");

  async function load() {
    try {
      const response =
        await fetch(
          `/api/applications/manage/${guildId}`,
          {
            cache:
              "no-store",
          }
        );

      const data =
        await response.json();

      if (
        response.status ===
        403
      ) {
        window.location.href =
          "/api/auth/discord";

        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
          "Unable to load Applications Portal."
        );
      }

      setPortal(
        data.portal
      );

      setForms(
        data.forms ??
        []
      );

      setSubmissions(
        data.submissions ??
        []
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load applications."
      );
    }
  }

  useEffect(() => {
    void load();
  }, [
    guildId,
  ]);

  async function action(
    body: unknown
  ) {
    setBusy(
      true
    );

    setError("");

    try {
      const response =
        await fetch(
          `/api/applications/manage/${guildId}`,
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

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "Action failed."
        );
      }

      await load();

      return data;
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Action failed."
      );

      return null;
    } finally {
      setBusy(
        false
      );
    }
  }

  async function createForm() {
    if (
      !newName.trim()
    ) {
      setError(
        "Application name is required."
      );

      return;
    }

    await action({
      action:
        "form-create",

      form: {
        name:
          newName,

        description:
          newDescription,

        status:
          "draft",
      },
    });

    setNewName("");
    setNewDescription("");
  }

  async function editForm(
    form: Form
  ) {
    const response =
      await fetch(
        `/api/applications/manage/${guildId}?formId=${encodeURIComponent(form.id)}`,
        {
          cache:
            "no-store",
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      setError(
        data.error ||
        "Unable to load form."
      );

      return;
    }

    setSelectedForm(
      data.form
    );

    setQuestions(
      (
        data.questions ??
        []
      ).map(
        (
          question: any
        ) => ({
          id:
            question.id,

          label:
            question.label,

          description:
            question.description ??
            "",

          type:
            question.type,

          required:
            question.required,

          options:
            question.options ??
            [],
        })
      )
    );
  }

  async function openSubmission(
    id: string
  ) {
    const response =
      await fetch(
        `/api/applications/manage/${guildId}?submissionId=${encodeURIComponent(id)}`,
        {
          cache:
            "no-store",
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      setError(
        data.error ||
        "Unable to load submission."
      );

      return;
    }

    setSelectedSubmission(
      data
    );

    setReviewerNote("");
  }

  const filtered =
    useMemo(
      () =>
        submissions.filter(
          (submission) =>
            filter ===
              "all" ||
            submission.status ===
              filter
        ),
      [
        submissions,
        filter,
      ]
    );

  return (
    <main className="min-h-screen bg-[#07080b] text-white">
      <div className="border-b border-white/[0.07] bg-[#090a0e]">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-5">
          <div>
            <a
              href="/dashboard"
              className="text-xl font-bold"
            >
              Utility
              <span className="text-sky-400">
                X
              </span>
            </a>

            <p className="mt-1 text-xs text-zinc-600">
              Applications Management
            </p>
          </div>

          <a
            href={`/apply/${guildId}`}
            target="_blank"
            className="rounded-xl border border-sky-500/20 bg-sky-500/[0.07] px-4 py-2.5 text-sm font-semibold text-sky-300"
          >
            Open Applicant Portal
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-5 py-8">
        {error && (
          <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="rounded-3xl border border-white/[0.07] bg-gradient-to-br from-sky-500/[0.08] via-white/[0.025] to-indigo-500/[0.05] p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-400">
            Control Center
          </p>

          <h1 className="mt-3 text-3xl font-bold">
            {portal
              ?.portalName ||
              "Applications"}
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Create forms, review applicants and manage your application pipeline.
          </p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [
              "Pending",
              submissions.filter(
                (item) =>
                  item.status ===
                  "pending"
              ).length,
            ],
            [
              "Interview",
              submissions.filter(
                (item) =>
                  item.status ===
                  "interview"
              ).length,
            ],
            [
              "Accepted",
              submissions.filter(
                (item) =>
                  item.status ===
                  "accepted"
              ).length,
            ],
            [
              "Denied",
              submissions.filter(
                (item) =>
                  item.status ===
                  "denied"
              ).length,
            ],
          ].map(
            ([
              label,
              value,
            ]) => (
              <div
                key={
                  String(
                    label
                  )
                }
                className="rounded-2xl border border-white/[0.07] bg-white/[0.018] p-5"
              >
                <p className="text-xs text-zinc-600">
                  {
                    label
                  }
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {
                    value
                  }
                </p>
              </div>
            )
          )}
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
          <section className="rounded-3xl border border-white/[0.07] bg-white/[0.018] p-6">
            <h2 className="text-lg font-bold">
              Create Application
            </h2>

            <input
              value={
                newName
              }
              onChange={(event) =>
                setNewName(
                  event.target.value
                )
              }
              placeholder="Staff Application"
              className="mt-5 w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm outline-none"
            />

            <textarea
              value={
                newDescription
              }
              onChange={(event) =>
                setNewDescription(
                  event.target.value
                )
              }
              placeholder="Describe this application..."
              className="mt-3 min-h-24 w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm outline-none"
            />

            <button
              type="button"
              disabled={
                busy
              }
              onClick={() =>
                void createForm()
              }
              className="mt-4 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              Create Draft
            </button>

            <div className="mt-7 space-y-2">
              {forms.map(
                (form) => (
                  <button
                    key={
                      form.id
                    }
                    type="button"
                    onClick={() =>
                      void editForm(
                        form
                      )
                    }
                    className="w-full rounded-xl border border-white/[0.06] bg-black/20 p-4 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium">
                        {
                          form.name
                        }
                      </p>

                      <span className="text-xs uppercase text-zinc-600">
                        {
                          form.status
                        }
                      </span>
                    </div>
                  </button>
                )
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-white/[0.07] bg-white/[0.018] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">
                  Submissions
                </h2>

                <p className="mt-1 text-sm text-zinc-600">
                  Review your current pipeline.
                </p>
              </div>

              <select
                value={
                  filter
                }
                onChange={(event) =>
                  setFilter(
                    event.target.value
                  )
                }
                className="rounded-xl border border-white/[0.08] bg-[#090a0e] px-3 py-2 text-sm"
              >
                <option value="pending">
                  Pending
                </option>

                <option value="interview">
                  Interview
                </option>

                <option value="accepted">
                  Accepted
                </option>

                <option value="denied">
                  Denied
                </option>

                <option value="all">
                  All
                </option>
              </select>
            </div>

            <div className="mt-5 divide-y divide-white/[0.05]">
              {filtered.length ? (
                filtered.map(
                  (
                    submission
                  ) => {
                    const form =
                      forms.find(
                        (item) =>
                          item.id ===
                          submission.formId
                      );

                    return (
                      <button
                        key={
                          submission.id
                        }
                        type="button"
                        onClick={() =>
                          void openSubmission(
                            submission.id
                          )
                        }
                        className="grid w-full gap-3 py-4 text-left md:grid-cols-[1.2fr_1fr_.6fr]"
                      >
                        <div>
                          <p className="font-medium">
                            {
                              submission.applicantUsername
                            }
                          </p>

                          <p className="mt-1 text-xs text-zinc-600">
                            {
                              submission.applicantUserId
                            }
                          </p>
                        </div>

                        <p className="text-sm text-zinc-500">
                          {form?.name ||
                            "Application"}
                        </p>

                        <p className="text-xs uppercase text-zinc-600">
                          {
                            submission.status
                          }
                        </p>
                      </button>
                    );
                  }
                )
              ) : (
                <p className="py-10 text-center text-sm text-zinc-600">
                  No submissions in this category.
                </p>
              )}
            </div>
          </section>
        </div>

        {selectedForm && (
          <section className="mt-5 rounded-3xl border border-white/[0.07] bg-white/[0.018] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">
                  {
                    selectedForm.name
                  }
                </h2>

                <p className="mt-1 text-sm text-zinc-600">
                  Form Builder
                </p>
              </div>

              <select
                value={
                  selectedForm.status
                }
                onChange={(event) => {
                  const status =
                    event.target.value;

                  setSelectedForm(
                    {
                      ...selectedForm,
                      status,
                    }
                  );

                  void action({
                    action:
                      "form-save",

                    formId:
                      selectedForm.id,

                    form: {
                      status,
                    },
                  });
                }}
                className="rounded-xl border border-white/[0.08] bg-[#090a0e] px-3 py-2 text-sm"
              >
                <option value="draft">
                  Draft
                </option>

                <option value="open">
                  Open
                </option>

                <option value="closed">
                  Closed
                </option>
              </select>
            </div>

            <div className="mt-6 space-y-4">
              {questions.map(
                (
                  question,
                  index
                ) => (
                  <div
                    key={
                      question.id ??
                      index
                    }
                    className="rounded-2xl border border-white/[0.06] bg-black/20 p-5"
                  >
                    <div className="flex justify-between gap-3">
                      <p className="text-xs text-zinc-600">
                        Question{" "}
                        {index + 1}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          setQuestions(
                            questions.filter(
                              (
                                _,
                                i
                              ) =>
                                i !==
                                index
                            )
                          )
                        }
                        className="text-xs text-red-300"
                      >
                        Remove
                      </button>
                    </div>

                    <input
                      value={
                        question.label
                      }
                      onChange={(event) => {
                        const next =
                          [
                            ...questions,
                          ];

                        next[index] = {
                          ...question,
                          label:
                            event.target.value,
                        };

                        setQuestions(
                          next
                        );
                      }}
                      placeholder="Question"
                      className="mt-3 w-full rounded-xl border border-white/[0.08] bg-[#090a0e] px-4 py-3 text-sm"
                    />

                    <div className="mt-3 flex flex-wrap gap-3">
                      <select
                        value={
                          question.type
                        }
                        onChange={(event) => {
                          const next =
                            [
                              ...questions,
                            ];

                          next[index] = {
                            ...question,
                            type:
                              event.target.value as Question["type"],
                          };

                          setQuestions(
                            next
                          );
                        }}
                        className="rounded-xl border border-white/[0.08] bg-[#090a0e] px-3 py-2 text-sm"
                      >
                        <option value="short">
                          Short Answer
                        </option>

                        <option value="long">
                          Long Answer
                        </option>

                        <option value="yes_no">
                          Yes / No
                        </option>

                        <option value="single_select">
                          Single Select
                        </option>

                        <option value="multi_select">
                          Multi Select
                        </option>
                      </select>

                      <label className="flex items-center gap-2 text-sm text-zinc-500">
                        <input
                          type="checkbox"
                          checked={
                            question.required
                          }
                          onChange={(event) => {
                            const next =
                              [
                                ...questions,
                              ];

                            next[index] = {
                              ...question,
                              required:
                                event.target.checked,
                            };

                            setQuestions(
                              next
                            );
                          }}
                        />

                        Required
                      </label>
                    </div>

                    {(
                      question.type ===
                        "single_select" ||
                      question.type ===
                        "multi_select"
                    ) && (
                      <input
                        value={
                          question.options.join(
                            ", "
                          )
                        }
                        onChange={(event) => {
                          const next =
                            [
                              ...questions,
                            ];

                          next[index] = {
                            ...question,

                            options:
                              event.target.value
                                .split(
                                  ","
                                )
                                .map(
                                  (
                                    item
                                  ) =>
                                    item.trim()
                                )
                                .filter(
                                  Boolean
                                ),
                          };

                          setQuestions(
                            next
                          );
                        }}
                        placeholder="Option 1, Option 2, Option 3"
                        className="mt-3 w-full rounded-xl border border-white/[0.08] bg-[#090a0e] px-4 py-3 text-sm"
                      />
                    )}
                  </div>
                )
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  setQuestions([
                    ...questions,
                    {
                      label:
                        "",
                      description:
                        "",
                      type:
                        "short",
                      required:
                        true,
                      options:
                        [],
                    },
                  ])
                }
                className="rounded-xl bg-white/[0.05] px-4 py-2.5 text-sm font-semibold"
              >
                + Add Question
              </button>

              <button
                type="button"
                disabled={
                  busy
                }
                onClick={() =>
                  void action({
                    action:
                      "questions-save",

                    formId:
                      selectedForm.id,

                    questions,
                  })
                }
                className="rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                Save Questions
              </button>
            </div>
          </section>
        )}

        {selectedSubmission && (
          <section className="mt-5 rounded-3xl border border-white/[0.07] bg-white/[0.018] p-6">
            <h2 className="text-xl font-bold">
              {
                selectedSubmission
                  .submission
                  .applicantUsername
              }
            </h2>

            <p className="mt-1 text-sm text-zinc-600">
              {
                selectedSubmission
                  .form
                  .name
              }
            </p>

            <div className="mt-6 space-y-4">
              {selectedSubmission.answers.map(
                (
                  answer
                ) => (
                  <div
                    key={
                      answer.question
                        .id
                    }
                    className="rounded-2xl border border-white/[0.06] bg-black/20 p-5"
                  >
                    <p className="text-sm font-semibold">
                      {
                        answer.question
                          .label
                      }
                    </p>

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-400">
                      {Array.isArray(
                        answer.value
                      )
                        ? answer.value.join(
                            ", "
                          )
                        : typeof answer.value ===
                            "boolean"
                          ? answer.value
                            ? "Yes"
                            : "No"
                          : answer.value ||
                            "No answer"}
                    </p>
                  </div>
                )
              )}
            </div>

            <textarea
              value={
                reviewerNote
              }
              onChange={(event) =>
                setReviewerNote(
                  event.target.value
                )
              }
              placeholder="Reviewer notes..."
              className="mt-6 min-h-24 w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm"
            />

            <div className="mt-4 flex flex-wrap gap-3">
              {[
                [
                  "Interview",
                  "interview",
                ],
                [
                  "Accept",
                  "accepted",
                ],
                [
                  "Deny",
                  "denied",
                ],
              ].map(
                ([
                  label,
                  status,
                ]) => (
                  <button
                    key={
                      status
                    }
                    type="button"
                    disabled={
                      busy
                    }
                    onClick={() =>
                      void action({
                        action:
                          "submission-review",

                        submissionId:
                          selectedSubmission
                            .submission
                            .id,

                        status,

                        note:
                          reviewerNote,
                      }).then(
                        () => {
                          setSelectedSubmission(
                            null
                          );
                        }
                      )
                    }
                    className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-semibold"
                  >
                    {
                      label
                    }
                  </button>
                )
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
