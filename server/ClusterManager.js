class ClusterManager {
  constructor() {
    this.clusters = [];
    this.windowMs = 30000; // 30 sec window
  }

  // ── Cleanup old clusters ───────────────────────────────
  cleanup() {
    const now = Date.now();
    this.clusters = this.clusters.filter(
      (c) => now - c.lastUpdate < this.windowMs
    );
  }

  // ── Normalize text ─────────────────────────────────────
  normalize(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  // ── Tokenize ───────────────────────────────────────────
  tokenize(text) {
    return text.split(" ").filter(Boolean);
  }

  // ── Convert to frequency vector ────────────────────────
  vectorize(tokens) {
    const freq = {};
    tokens.forEach((t) => {
      freq[t] = (freq[t] || 0) + 1;
    });
    return freq;
  }

  // ── Cosine Similarity ──────────────────────────────────
  cosineSimilarity(text1, text2) {
    const tokens1 = this.tokenize(text1);
    const tokens2 = this.tokenize(text2);

    const vec1 = this.vectorize(tokens1);
    const vec2 = this.vectorize(tokens2);

    const allWords = new Set([...tokens1, ...tokens2]);

    let dot = 0;
    let mag1 = 0;
    let mag2 = 0;

    allWords.forEach((word) => {
      const v1 = vec1[word] || 0;
      const v2 = vec2[word] || 0;

      dot += v1 * v2;
      mag1 += v1 * v1;
      mag2 += v2 * v2;
    });

    return dot / (Math.sqrt(mag1) * Math.sqrt(mag2) || 1);
  }

  // ── Add message to cluster ─────────────────────────────
  addMessage(data) {
    this.cleanup();

    const now = Date.now();
    const normalizedMsg = this.normalize(data.message);

    for (let cluster of this.clusters) {
      if (
        this.isSimilar(cluster, normalizedMsg) &&
        now - cluster.lastUpdate < this.windowMs
      ) {
        cluster.messages.push(data.message);
        cluster.normalizedMessages.push(normalizedMsg);
        cluster.users.add(data.user);
        cluster.lastUpdate = now;
        cluster.count++;

        // 🔥 update risk dynamically
        cluster.risk = Math.max(cluster.risk, data.risk);

        // 🔥 coordination score (important for later)
        cluster.coordinationScore =
          cluster.users.size / cluster.count;

        return cluster;
      }
    }

    // ── Create new cluster ───────────────────────────────
    const newCluster = {
      id: "cl_" + Math.random().toString(36).slice(2),
      type: this.getType(data),

      messages: [data.message],
      normalizedMessages: [normalizedMsg],

      users: new Set([data.user]),
      count: 1,
      risk: data.risk,

      coordinationScore: 0,
      lastUpdate: now,
    };

    this.clusters.push(newCluster);
    return newCluster;
  }

  // ── Similarity check ───────────────────────────────────
  isSimilar(cluster, newMsg) {
    for (let msg of cluster.normalizedMessages) {
      const similarity = this.cosineSimilarity(msg, newMsg);

      if (similarity > 0.7) {
        return true;
      }
    }
    return false;
  }

  // ── Type mapping ───────────────────────────────────────
  getType(data) {
    if (data.mlResult?.spam === 1) return "Spam Campaign";
    if (data.mlResult?.toxic === 1) return "Hate Campaign";
    return "Suspicious Activity";
  }
}

module.exports = ClusterManager;