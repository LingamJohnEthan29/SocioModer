function computeRisk(ml, situation) {
  // ✅ Safety fallback
  ml = ml || {};
  situation = situation || {};

  const {
    toxic = 0,
    spam = 0,
  } = ml;

  const {
    repetitionScore = 0,
    burstScore = 0,
    coordinationScore = 0,
  } = situation;

  // 🔥 Strong ML-based risk (primary signal)
  let mlRisk = 0;

  if (toxic === 1) mlRisk += 0.7;   // strong penalty
  if (spam === 1) mlRisk += 0.8;    // even stronger

  // 🧠 Behavioral risk (secondary signals)
  let finalRisk =
    mlRisk +
    0.2 * repetitionScore +
    0.2 * burstScore +
    0.2 * coordinationScore;

  return Math.min(1, finalRisk);
}

function decideAction(risk) {
  if (risk > 0.75) return "BLOCK";  // slightly lowered for realism
  if (risk > 0.4) return "WARN";
  return "ALLOW";
}

module.exports = { computeRisk, decideAction };