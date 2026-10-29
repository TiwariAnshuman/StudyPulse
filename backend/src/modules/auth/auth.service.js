import argon2 from "argon2";
import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";

import { env } from "../../config/env.js";
import User from "../../models/User.js";
import RefreshSession from "../../models/RefreshSession.js";

const ACCESS_TOKEN_TTL = "15m";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function createAuthError(message, statusCode, code) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

function hashRefreshToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function createRefreshToken() {
  return randomBytes(48).toString("base64url");
}

function createAccessToken(user, sessionId) {
  return jwt.sign(
    {
      sid: sessionId.toString(),
      tv: user.tokenVersion,
    },
    env.JWT_SECRET,
    {
      subject: user._id.toString(),
      expiresIn: ACCESS_TOKEN_TTL,
      issuer: "studypulse-api",
      audience: "studypulse-web",
    },
  );
}

function toPublicUser(user) {
  return {
    id: user._id.toString(),
    displayName: user.displayName,
    email: user.emailNormalized,
    timezone: user.timezone,
    createdAt: user.createdAt,
  };
}

// Existing registration service
export async function registerUser(input) {
  const displayName = input.displayName.trim();
  const emailNormalized = input.email.trim().toLowerCase();

  const existingUser = await User.findOne({ emailNormalized });

  if (existingUser) {
    throw createAuthError(
      "An account with this email already exists.",
      409,
      "EMAIL_ALREADY_EXISTS",
    );
  }

  const passwordHash = await argon2.hash(input.password, {
    type: argon2.argon2id,
  });

  try {
    const user = await User.create({
      displayName,
      emailNormalized,
      passwordHash,
    });

    return toPublicUser(user);
  } catch (error) {
    if (error.code === 11000) {
      throw createAuthError(
        "An account with this email already exists.",
        409,
        "EMAIL_ALREADY_EXISTS",
      );
    }

    throw error;
  }
}

// Login and create a bounded session
export async function loginUser(input) {
  const emailNormalized = input.email.trim().toLowerCase();

  const user = await User.findOne({ emailNormalized })
    .select("+passwordHash");

  if (!user) {
    throw createAuthError(
      "Invalid email or password.",
      401,
      "INVALID_CREDENTIALS",
    );
  }

  const passwordMatches = await argon2.verify(
    user.passwordHash,
    input.password,
  );

  if (!passwordMatches) {
    throw createAuthError(
      "Invalid email or password.",
      401,
      "INVALID_CREDENTIALS",
    );
  }

  const refreshToken = createRefreshToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  const session = await RefreshSession.create({
    userId: user._id,
    tokenHash: hashRefreshToken(refreshToken),
    tokenVersion: user.tokenVersion,
    expiresAt,
  });

  return {
    user: toPublicUser(user),
    accessToken: createAccessToken(user, session._id),
    refreshToken,
    expiresAt,
  };
}

// Rotate the refresh token without extending the absolute session lifetime
export async function refreshUserSession(rawRefreshToken) {
  const oldHash = hashRefreshToken(rawRefreshToken);

  const session = await RefreshSession.findOne({
    $or: [
      { tokenHash: oldHash },
      { previousTokenHashes: oldHash },
    ],
  }).select("+tokenHash +previousTokenHashes");

  if (!session || session.revokedAt) {
    throw createAuthError(
      "Refresh session is invalid or expired.",
      401,
      "INVALID_REFRESH_TOKEN",
    );
  }

  const now = new Date();

  // A previously rotated token was reused: revoke this session.
  if (session.previousTokenHashes.includes(oldHash)) {
    await RefreshSession.updateOne(
      { _id: session._id, revokedAt: null },
      { $set: { revokedAt: now } },
    );

    throw createAuthError(
      "Refresh session is invalid or expired.",
      401,
      "INVALID_REFRESH_TOKEN",
    );
  }

  if (session.expiresAt <= now) {
    await RefreshSession.updateOne(
      { _id: session._id, revokedAt: null },
      { $set: { revokedAt: now } },
    );

    throw createAuthError(
      "Refresh session is invalid or expired.",
      401,
      "INVALID_REFRESH_TOKEN",
    );
  }

  const user = await User.findById(session.userId);

  if (!user || user.tokenVersion !== session.tokenVersion) {
    await RefreshSession.updateOne(
      { _id: session._id, revokedAt: null },
      { $set: { revokedAt: now } },
    );

    throw createAuthError(
      "Refresh session is invalid or expired.",
      401,
      "INVALID_REFRESH_TOKEN",
    );
  }

  const newRefreshToken = createRefreshToken();
  const newHash = hashRefreshToken(newRefreshToken);

  // Atomic compare-and-update prevents two simultaneous refreshes
  // from successfully rotating the same token.
  const updatedSession = await RefreshSession.findOneAndUpdate(
    {
      _id: session._id,
      tokenHash: oldHash,
      revokedAt: null,
      expiresAt: { $gt: now },
    },
    {
      $set: {
        tokenHash: newHash,
        lastUsedAt: now,
      },
      $push: {
        previousTokenHashes: {
          $each: [oldHash],
          $slice: -100,
        },
      },
    },
    { new: true },
  );

  if (!updatedSession) {
    // Another request may have rotated this token concurrently.
    // If this token is now in the previous-token list, revoke the session.
    await RefreshSession.updateOne(
      {
        _id: session._id,
        previousTokenHashes: oldHash,
        revokedAt: null,
      },
      { $set: { revokedAt: new Date() } },
    );

    throw createAuthError(
      "Refresh session is invalid or expired.",
      401,
      "INVALID_REFRESH_TOKEN",
    );
  }

  return {
    user: toPublicUser(user),
    accessToken: createAccessToken(user, session._id),
    refreshToken: newRefreshToken,
    expiresAt: updatedSession.expiresAt,
  };
}

// Revoke a session at logout
export async function logoutUser(rawRefreshToken) {
  if (!rawRefreshToken) {
    return;
  }

  const tokenHash = hashRefreshToken(rawRefreshToken);

  const session = await RefreshSession.findOne({
    $or: [
      { tokenHash },
      { previousTokenHashes: tokenHash },
    ],
  }).select("+tokenHash +previousTokenHashes");

  if (session && !session.revokedAt) {
    session.revokedAt = new Date();
    await session.save();
  }
}