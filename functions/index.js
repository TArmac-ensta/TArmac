const { setGlobalOptions } = require("firebase-functions/v2");
const { onCall, HttpsError } = require("firebase-functions/v2/https");

const { initializeApp } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");

setGlobalOptions({ maxInstances: 10 });
initializeApp();

exports.submitScore = onCall(async (request) => {
  const { username, score, duration_ms } = request.data || {};

  if (typeof username !== "string") {
    throw new HttpsError("invalid-argument", "Nom invalide");
  }
  const cleanName = username.trim();
  if (cleanName.length === 0 || cleanName.length > 15) {
    throw new HttpsError("invalid-argument", "Nom invalide");
  }
  if (!/^[a-zA-Z0-9 ]+$/.test(cleanName)) {
    throw new HttpsError("invalid-argument", "Nom invalide");
  }

  if (typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > 2000) {
    throw new HttpsError("invalid-argument", "Score invalide");
  }

  if (
    typeof duration_ms !== "number" ||
    !Number.isFinite(duration_ms) ||
    duration_ms > 10 * 60 * 1000
  ) {
    throw new HttpsError("invalid-argument", "Durée invalide");
  }

  const seconds = duration_ms / 1000;
  const pointsPerSecond = score / seconds;

  if (score > 10 && pointsPerSecond > 15) {
    throw new HttpsError("permission-denied", "Score suspect");
  }

  const db = getDatabase();
  const newRef = db.ref("leaderboard").push();

  await newRef.set({
    username: cleanName,
    score: Math.floor(score),
    duration_ms: Math.floor(duration_ms),
    timestamp: Date.now(),
  });

  return { ok: true, id: newRef.key };
});
