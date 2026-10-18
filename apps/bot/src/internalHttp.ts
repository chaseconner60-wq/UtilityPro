import {
  createServer,
} from "node:http";

import type {
  Client,
} from "discord.js";

import {
  assignAcceptedRole,
  postApplicationReviewEmbed,
  postApplicantChannelNotification,
  sendApplicantDm,
  sendInterviewNotification,
} from "./applicationService.js";

function readBody(
  request: any
): Promise<any> {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      let body =
        "";

      request.on(
        "data",
        (
          chunk: Buffer
        ) => {
          body +=
            chunk.toString(
              "utf8"
            );

          if (
            body.length >
            1_000_000
          ) {
            reject(
              new Error(
                "Request too large."
              )
            );
          }
        }
      );

      request.on(
        "end",
        () => {
          try {
            resolve(
              body
                ? JSON.parse(
                    body
                  )
                : {}
            );
          } catch (
            error
          ) {
            reject(
              error
            );
          }
        }
      );

      request.on(
        "error",
        reject
      );
    }
  );
}

export function startInternalBotHttp(
  client: Client
) {
  const port =
    Number(
      process.env.PORT ||
      3000
    );

  const secret =
    process.env
      .INTERNAL_API_SECRET;

  if (!secret) {
    console.warn(
      "INTERNAL_API_SECRET missing; bot internal HTTP disabled."
    );

    return;
  }

  const server =
    createServer(
      async (
        request,
        response
      ) => {
        response.setHeader(
          "Content-Type",
          "application/json"
        );

        if (
          request.headers[
            "x-utilityx-internal-secret"
          ] !==
          secret
        ) {
          response.statusCode =
            401;

          response.end(
            JSON.stringify({
              error:
                "Unauthorized",
            })
          );

          return;
        }

        if (
          request.method !==
          "POST"
        ) {
          response.statusCode =
            405;

          response.end(
            JSON.stringify({
              error:
                "Method not allowed",
            })
          );

          return;
        }

        try {
          const body =
            await readBody(
              request
            );

          if (
            request.url ===
            "/internal/applications/review-post"
          ) {
            const result =
              await postApplicationReviewEmbed(
                client,
                body
              );

            response.end(
              JSON.stringify(
                result
              )
            );

            return;
          }

          if (
            request.url ===
            "/internal/applications/notify-channel"
          ) {
            const result =
              await postApplicantChannelNotification(
                client,
                body
              );

            response.end(
              JSON.stringify(
                result
              )
            );

            return;
          }

          if (
            request.url ===
            "/internal/applications/dm"
          ) {
            const result =
              await sendApplicantDm(
                client,
                body
              );

            response.end(
              JSON.stringify(
                result
              )
            );

            return;
          }

          if (
            request.url ===
            "/internal/applications/assign-role"
          ) {
            const result =
              await assignAcceptedRole(
                client,
                body
              );

            response.end(
              JSON.stringify(
                result
              )
            );

            return;
          }

          if (
            request.url ===
            "/internal/applications/interview-dm"
          ) {
            const result =
              await sendInterviewNotification(
                client,
                body
              );

            response.end(
              JSON.stringify(
                result
              )
            );

            return;
          }

          response.statusCode =
            404;

          response.end(
            JSON.stringify({
              error:
                "Not found",
            })
          );
        } catch (
          error
        ) {
          response.statusCode =
            400;

          response.end(
            JSON.stringify({
              error:
                error instanceof Error
                  ? error.message
                  : "Request failed.",
            })
          );
        }
      }
    );

  server.listen(
    port,
    "0.0.0.0",
    () => {
      console.log(
        `UtilityX bot internal HTTP listening on ${port}`
      );
    }
  );
}
