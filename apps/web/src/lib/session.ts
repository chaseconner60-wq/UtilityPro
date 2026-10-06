import { EncryptJWT, jwtDecrypt } from "jose";

export type UtilityXSession = {
  discordId: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
  accessToken: string;
};

function getSessionKey() {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("SESSION_SECRET is not configured.");
  }

  const key = Buffer.from(secret, "hex");

  if (key.length !== 32) {
    throw new Error("SESSION_SECRET must be a 32-byte hex key.");
  }

  return key;
}

export async function createSession(
  session: UtilityXSession,
  expiresIn: number
) {
  return new EncryptJWT({ ...session })
    .setProtectedHeader({
      alg: "dir",
      enc: "A256GCM",
    })
    .setIssuedAt()
    .setExpirationTime(`${expiresIn}s`)
    .encrypt(getSessionKey());
}

export async function decryptSession(
  token: string
): Promise<UtilityXSession> {
  const { payload } = await jwtDecrypt(token, getSessionKey());

  return payload as unknown as UtilityXSession;
}
