"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "next/navigation";

type Question = {
  id: string;
  label: string;
  description: string | null;
  type:
    | "short"
    | "long"
    | "yes_no"
    | "single_select"
    | "multi_select";
  required: boolean;
  options: string[];
};

type Form = {
  id: string;
  name: string;
  description: string | null;
};

export default function ApplicationFormPage() {
  const params =
    useParams<{
      guildId: string;
      formId: string;
    }>();

  const {
    guildId,
    formId,
  } = params;

  const [
    form,
    setForm,
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
    answers,
    setAnswers,
  ] =
    useState<
      Record<
        string,
        string |
        string[] |
        boolean
      >
    >({});

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    submitted,
    setSubmitted,
  ] =
    useState(false);

  useEffect(() => {
    void (
      async () => {
        try {
          const response =
            await fetch(
              `/api/applications/public/${guildId}/${formId}`,
              {
                cache:
                  "no-store",
              }
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.error ||
              "Unable to load application."
            );
          }

          setForm(
            data.form
          );

          setQuestions(
            data.questions ??
            []
          );
        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load application."
          );
        } finally {
          setLoading(
            false
          );
        }
      }
    )();
  }, [
    guildId,
    formId,
  ]);

  async function submit() {
    setSubmitting(
      true
    );

    setError("");

    try {
      const response =
        await fetch(
          `/api/applications/public/${guildId}/${formId}`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                answers:
                  questions.map(
                    (
                      question
                    ) => ({
                      questionId:
                        question.id,

                      value:
                        answers[
                          question.id
                        ] ??
                        null,
                    })
                  ),
              }),
          }
        );

      const data =
        await response.json();

      if (
        response.status ===
        401
      ) {
        window.location.href =
          "/api/auth/discord";

        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
          "Unable to submit application."
        );
      }

      setSubmitted(
        true
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to submit application."
      );
    } finally {
      setSubmitting(
        false
      );
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07080b] p-10 text-zinc-500">
        Loading application...
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-[#07080b] px-5 py-16 text-white">
        <div className="mx-auto max-w-xl rounded-3xl border border-emerald-500/15 bg-emerald-500/[0.04] p-10 text-center">
          <h1 className="text-3xl font-bold">
            Application submitted
          </h1>

          <p className="mt-3 text-sm text-zinc-500">
            Your response has been sent to the server staff for review.
          </p>

          <a
            href={`/apply/${guildId}`}
            className="mt-7 inline-block rounded-xl bg-white/[0.06] px-4 py-3 text-sm font-semibold"
          >
            Back to Applications
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07080b] text-white">
      <div className="mx-auto max-w-3xl px-5 py-12">
        <a
          href={`/apply/${guildId}`}
          className="text-sm text-zinc-500"
        >
          ← Back to Applications
        </a>

        <div className="mt-8 rounded-3xl border border-white/[0.07] bg-white/[0.018] p-7">
          <h1 className="text-3xl font-bold">
            {form?.name}
          </h1>

          {form?.description && (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-500">
              {
                form.description
              }
            </p>
          )}
        </div>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mt-5 space-y-4">
          {questions.map(
            (
              question,
              index
            ) => (
              <div
                key={
                  question.id
                }
                className="rounded-3xl border border-white/[0.07] bg-white/[0.018] p-6"
              >
                <p className="font-semibold">
                  {index + 1}.{" "}
                  {
                    question.label
                  }

                  {question.required && (
                    <span className="ml-1 text-red-400">
                      *
                    </span>
                  )}
                </p>

                {question.description && (
                  <p className="mt-2 text-xs leading-5 text-zinc-600">
                    {
                      question.description
                    }
                  </p>
                )}

                <div className="mt-4">
                  <QuestionInput
                    question={
                      question
                    }
                    value={
                      answers[
                        question.id
                      ]
                    }
                    onChange={(value) =>
                      setAnswers(
                        (
                          current
                        ) => ({
                          ...current,

                          [question.id]:
                            value,
                        })
                      )
                    }
                  />
                </div>
              </div>
            )
          )}
        </div>

        <button
          type="button"
          disabled={
            submitting
          }
          onClick={() =>
            void submit()
          }
          className="mt-6 w-full rounded-xl bg-sky-500 px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {submitting
            ? "Submitting..."
            : "Submit Application"}
        </button>

        <p className="mt-8 text-center text-xs text-zinc-700">
          Powered by UtilityX
        </p>
      </div>
    </main>
  );
}

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: Question;
  value:
    | string
    | string[]
    | boolean
    | undefined;
  onChange:
    (
      value:
        | string
        | string[]
        | boolean
    ) => void;
}) {
  if (
    question.type ===
    "long"
  ) {
    return (
      <textarea
        value={
          typeof value ===
            "string"
            ? value
            : ""
        }
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="min-h-32 w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm outline-none"
      />
    );
  }

  if (
    question.type ===
    "yes_no"
  ) {
    return (
      <div className="flex gap-3">
        {[
          [
            "Yes",
            true,
          ],
          [
            "No",
            false,
          ],
        ].map(
          ([
            label,
            option,
          ]) => (
            <button
              key={
                String(
                  option
                )
              }
              type="button"
              onClick={() =>
                onChange(
                  option as boolean
                )
              }
              className={`rounded-xl border px-5 py-2.5 text-sm ${
                value ===
                option
                  ? "border-sky-500/40 bg-sky-500/10 text-sky-300"
                  : "border-white/[0.08] bg-black/20 text-zinc-500"
              }`}
            >
              {
                label
              }
            </button>
          )
        )}
      </div>
    );
  }

  if (
    question.type ===
    "single_select"
  ) {
    return (
      <select
        value={
          typeof value ===
            "string"
            ? value
            : ""
        }
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-xl border border-white/[0.08] bg-[#090a0e] px-4 py-3 text-sm"
      >
        <option value="">
          Select an option
        </option>

        {question.options.map(
          (option) => (
            <option
              key={
                option
              }
              value={
                option
              }
            >
              {
                option
              }
            </option>
          )
        )}
      </select>
    );
  }

  if (
    question.type ===
    "multi_select"
  ) {
    const selected =
      Array.isArray(value)
        ? value
        : [];

    return (
      <div className="space-y-2">
        {question.options.map(
          (option) => (
            <label
              key={
                option
              }
              className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3 text-sm"
            >
              <input
                type="checkbox"
                checked={
                  selected.includes(
                    option
                  )
                }
                onChange={(event) =>
                  onChange(
                    event.target.checked
                      ? [
                          ...selected,
                          option,
                        ]
                      : selected.filter(
                          (
                            item
                          ) =>
                            item !==
                            option
                        )
                  )
                }
              />

              {
                option
              }
            </label>
          )
        )}
      </div>
    );
  }

  return (
    <input
      value={
        typeof value ===
          "string"
          ? value
          : ""
      }
      onChange={(event) =>
        onChange(
          event.target.value
        )
      }
      className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm outline-none"
    />
  );
}
