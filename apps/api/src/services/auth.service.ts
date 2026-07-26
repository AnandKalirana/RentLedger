import bcrypt from "bcrypt";
import crypto from "crypto";
import { prisma } from "@/config/database";
import { ApiError } from "@/utils/ApiError";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@/utils/jwt";
import { LoginInput, RegisterInput } from "@/validators/auth.validator";

const BCRYPT_ROUNDS = 12;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function registerLandlord(input: RegisterInput) {
  const existing = await prisma.landlord.findUnique({ where: { email: input.email } });
  if (existing) {
    throw ApiError.conflict("An account with this email already exists");
  }

  // Note: only fields explicitly listed here are ever persisted from user input.
  // Never spread req.body directly into a Prisma create — that's how privilege
  // escalation bugs (e.g. a client-supplied "role" or "isAdmin" field) get in.
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const landlord = await prisma.landlord.create({
    data: {
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      phone: input.phone,
      businessName: input.businessName,
    },
  });

  return issueTokenPair(landlord.id, landlord.email);
}

export async function loginLandlord(input: LoginInput) {
  const landlord = await prisma.landlord.findUnique({ where: { email: input.email } });
  if (!landlord) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const isValid = await bcrypt.compare(input.password, landlord.passwordHash);
  if (!isValid) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  return issueTokenPair(landlord.id, landlord.email);
}

export async function refreshSession(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw ApiError.unauthorized("Session expired, please log in again");
  }

  // Rotate: revoke the used token and issue a new pair
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  return issueTokenPair(payload.landlordId, payload.email);
}

export async function logout(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

async function issueTokenPair(landlordId: string, email: string) {
  const accessToken = signAccessToken({ landlordId, email });
  const refreshToken = signRefreshToken({ landlordId, email });

  const decoded = verifyRefreshToken(refreshToken);
  const expiresAt = new Date((decoded as unknown as { exp: number }).exp * 1000);

  await prisma.refreshToken.create({
    data: {
      landlordId,
      tokenHash: hashToken(refreshToken),
      expiresAt,
    },
  });

  const landlord = await prisma.landlord.findUniqueOrThrow({
    where: { id: landlordId },
    select: { id: true, email: true, fullName: true, businessName: true },
  });

  return { accessToken, refreshToken, landlord };
}
