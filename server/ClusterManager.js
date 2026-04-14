

class ClusterManager {
  constructor() {
    this.clusters = [];
    this.windowMs = 30000; // 30 sec window
  }

  // ── Add message to cluster ─────────────────────────────
  addMessage(data) {
    const now = Date.now();

    // Try to find matching cluster
    for (let cluster of this.clusters) {
      if (this.isSimilar(cluster, data) && now - cluster.lastUpdate < this.windowMs) {
        cluster.messages.push(data.message);
        cluster.users.add(data.user);
        cluster.lastUpdate = now;
        cluster.count++;

        return cluster;
      }
    }

    // Create new cluster
    const newCluster = {
      id: "cl_" + Math.random().toString(36).slice(2),
      type: this.getType(data),
      messages: [data.message],
      users: new Set([data.user]),
      count: 1,
      risk: data.risk,
      lastUpdate: now,
    };

    this.clusters.push(newCluster);
    return newCluster;
  }

  // ── Similarity check (simple version) ──────────────────
  isSimilar(cluster, data) {
    return cluster.messages.some((msg) =>
      msg.toLowerCase().includes(data.message.toLowerCase()) ||
      data.message.toLowerCase().includes(msg.toLowerCase())
    );
  }

  // ── Type mapping ───────────────────────────────────────
  getType(data) {
    if (data.mlResult?.spam === 1) return "Spam Campaign";
    if (data.mlResult?.toxic === 1) return "Hate Campaign";
    return "Suspicious Activity";
  }
}

module.exports = ClusterManager;