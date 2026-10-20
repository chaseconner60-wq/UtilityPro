"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "next/navigation";

type Portal = {
  portalName: string;
  welcomeMessage: string | null;
};

type Form = {
  id: string;
  name: string;
  description: string | null;
  closesAt: string | null;
};

export default function ApplicationPortalPage() {
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
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    moduleUnavailable,
    setModuleUnavailable,
  ] =
    useState<string | null>(
      null
    );


  useEffect(() => {
    void (
      async () => {
        try {
          const response =
            await fetch(
              `/api/applications/public/${guildId}`,
              {
                cache:
                  "no-store",
              }
            );

          const data =
            await response.json();

          if (
            response.status === 503 &&
            data.code === "MODULE_DISABLED" &&
            data.module === "applications"
          ) {
            setModuleUnavailable(
              data.error ||
                "Applications are temporarily unavailable. Please check back shortly."
            );

            return;
          }

          if (!response.ok) {
            throw new Error(
              data.error ||
              "Unable to load applications."
            );
          }

          setPortal(
            data.portal
          );

          setForms(
            data.forms ??
            []
          );
        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load applications."
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
  ]);

  return (
    <main className="min-h-screen bg-[#07080b] text-white">
      <div className="mx-auto max-w-5xl px-5 py-12">
        <a
          href="/"
          className="text-lg font-bold"
        >
          Utility
          <span className="text-sky-400">
            X
          </span>
        </a>

        <div className="mt-12 rounded-3xl border border-white/[0.07] bg-gradient-to-br from-sky-500/[0.08] via-white/[0.025] to-indigo-500/[0.05] p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-400">
            Applications Portal
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            {portal
              ?.portalName ||
              "Applications"}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
            {portal
              ?.welcomeMessage ||
              "Browse currently open applications and submit directly through UtilityX."}
          </p>
        </div>

        {loading && (
          <p className="mt-8 text-zinc-500">
            Loading applications...
          </p>
        )}

        {moduleUnavailable && (
          <div className="mt-8 rounded-3xl border border-amber-400/15 bg-amber-400/[0.045] p-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300/70">
              UtilityX Service Notice
            </p>

            <h2 className="mt-3 text-2xl font-semibold">
              Applications Temporarily Unavailable
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
              {moduleUnavailable}
            </p>

            <p className="mt-5 text-xs text-zinc-600">
              No application data has been lost. Please try again later.
            </p>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          !moduleUnavailable && (
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {forms.length ? (
              forms.map(
                (form) => (
                  <a
                    key={
                      form.id
                    }
                    href={`/apply/${guildId}/${form.id}`}
                    className="rounded-3xl border border-white/[0.07] bg-white/[0.018] p-6 transition hover:border-sky-500/20 hover:bg-sky-500/[0.03]"
                  >
                    <p className="text-lg font-semibold">
                      {
                        form.name
                      }
                    </p>

                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-600">
                      {form.description ||
                        "No description provided."}
                    </p>

                    {form.closesAt && (
                      <p className="mt-5 text-xs text-zinc-500">
                        Closes{" "}
                        {new Date(
                          form.closesAt
                        ).toLocaleString()}
                      </p>
                    )}

                    <p className="mt-5 text-sm font-semibold text-sky-400">
                      Apply →
                    </p>
                  </a>
                )
              )
            ) : (
              <div className="rounded-3xl border border-white/[0.07] bg-white/[0.018] p-10 text-center text-sm text-zinc-600 md:col-span-2">
                There are currently no open applications.
              </div>
            )}
          </div>
        )}

        <p className="mt-10 text-center text-xs text-zinc-700">
          Powered by UtilityX
        </p>
      </div>
    </main>
  );
}
