import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

function getEncryptionKey() {
  const raw =
    process.env.ERLC_ENCRYPTION_KEY;

  if (!raw) {
    throw new Error(
      "ERLC_ENCRYPTION_KEY is not configured."
    );
  }

  if (
    !/^[a-fA-F0-9]{64}$/.test(
      raw
    )
  ) {
    throw new Error(
      "ERLC_ENCRYPTION_KEY must be a 32-byte hex key."
    );
  }

  return Buffer.from(
    raw,
    "hex"
  );
}

export function encryptErlcServerKey(
  serverKey: string
) {
  const iv =
    randomBytes(12);

  const cipher =
    createCipheriv(
      "aes-256-gcm",
      getEncryptionKey(),
      iv
    );

  const encrypted =
    Buffer.concat([
      cipher.update(
        serverKey,
        "utf8"
      ),
      cipher.final(),
    ]);

  const authTag =
    cipher.getAuthTag();

  return {
    encrypted:
      encrypted.toString(
        "hex"
      ),

    iv:
      iv.toString(
        "hex"
      ),

    authTag:
      authTag.toString(
        "hex"
      ),
  };
}

export function decryptErlcServerKey(
  encrypted: string,
  iv: string,
  authTag: string
) {
  const decipher =
    createDecipheriv(
      "aes-256-gcm",
      getEncryptionKey(),
      Buffer.from(
        iv,
        "hex"
      )
    );

  decipher.setAuthTag(
    Buffer.from(
      authTag,
      "hex"
    )
  );

  return Buffer.concat([
    decipher.update(
      Buffer.from(
        encrypted,
        "hex"
      )
    ),

    decipher.final(),
  ]).toString("utf8");
}
