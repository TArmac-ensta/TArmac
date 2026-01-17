const { setGlobalOptions } = require("firebase-functions/v2");
const { onCall, HttpsError } = require("firebase-functions/v2/https");

const { initializeApp } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");

setGlobalOptions({ region: "europe-west1", maxInstances: 10 });
initializeApp();

const SESSION_TTL_MS = 15 * 60 * 1000;
const MIN_GAME_MS = 1 * 1000;
const MAX_GAME_MS = 10 * 60 * 1000;

const MAX_PPS = 11;

/**
 * @param {string} username
 * @return {string}
 */
function validateUsername(username) {
  if (typeof username !== "string") throw new HttpsError("invalid-argument", "Nom invalide");

  const cleanName = username.trim();
  if (cleanName.length === 0 || cleanName.length > 15) throw new HttpsError("invalid-argument", "Nom invalide");
  if (!/^[a-zA-Z0-9 ]+$/.test(cleanName)) throw new HttpsError("invalid-argument", "Nom invalide");

  return cleanName;
}

/**
 * @param {number} score
 * @return {number}
 */
function validateScore(score) {
  if (typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > 2000) {
    throw new HttpsError("invalid-argument", "Score invalide");
  }
  return Math.floor(score);
}

/**
 * @return {Promise<{ok: boolean, gameId: string}>}
 */
exports.startGame = onCall({ cors: true }, async () => {
  const db = getDatabase();
  const now = Date.now();

  const sessionRef = db.ref("gameSessions").push();
  await sessionRef.set({
    startTime: now,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
    used: false,
  });

  return { ok: true, gameId: sessionRef.key };
});

/**
 * @param {Object} request
 * @return {Promise<{ok: boolean, id: string}>}
 */
exports.submitScore = onCall({ cors: true }, async (request) => {
  const { username, score, gameId } = request.data || {};

  if (typeof gameId !== "string" || gameId.length < 5) {
    throw new HttpsError("invalid-argument", "Partie invalide");
  }

  const cleanName = validateUsername(username);
  const cleanScore = validateScore(score);

  const db = getDatabase();
  const sessionRef = db.ref(`gameSessions/${gameId}`);
  const snap = await sessionRef.get();

  if (!snap.exists()) throw new HttpsError("permission-denied", "Partie inconnue");

  const session = snap.val();
  const now = Date.now();

  if (session.used) throw new HttpsError("permission-denied", "Partie déjà utilisée");
  if (typeof session.expiresAt !== "number" || now > session.expiresAt) {
    throw new HttpsError("permission-denied", "Partie expirée");
  }
  if (typeof session.startTime !== "number") throw new HttpsError("permission-denied", "Partie invalide");

  const duration_ms = now - session.startTime;

  if (duration_ms < MIN_GAME_MS || duration_ms > MAX_GAME_MS) {
    throw new HttpsError("permission-denied", "Durée invalide");
  }

  const pointsPerSecond = cleanScore / (duration_ms / 1000);

  if (cleanScore > 10 && pointsPerSecond > MAX_PPS) {
    throw new HttpsError("permission-denied", "Score suspect");
  }

  const newRef = db.ref("leaderboard").push();
  await newRef.set({
    username: cleanName,
    score: cleanScore,
    duration_ms: Math.floor(duration_ms),
    timestamp: now,
    gameId,
  });

  await sessionRef.update({
    used: true,
    usedAt: now,
    duration_ms: Math.floor(duration_ms),
  });

  return { ok: true, id: newRef.key };
});
