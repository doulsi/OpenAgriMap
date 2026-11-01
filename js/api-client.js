/**
 * OpenAgriMap France - API Client
 * Talks to the backend (server/server.js). Falls back to local-only mode
 * when the API is unreachable (e.g. opening index.html as a static file),
 * so the demo never breaks.
 */

const ApiClient = (() => {
  const baseUrl = window.location.origin.startsWith("file:") ? "" : window.location.origin;
  let online = true;

  async function request(path, options = {}) {
    if (!baseUrl) throw new Error("offline");
    const res = await fetch(`${baseUrl}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options
    });
    if (!res.ok) {
      let details = null;
      try { details = (await res.json()).details; } catch { /* non-JSON error */ }
      const err = new Error(`API error ${res.status}`);
      err.status = res.status;
      err.details = details;
      throw err;
    }
    return res.json();
  }

  async function healthCheck() {
    try {
      await request("/api/health");
      online = true;
      return true;
    } catch {
      online = false;
      return false;
    }
  }

  async function fetchReports(bbox) {
    const query = bbox ? `?bbox=${bbox.join(",")}` : "";
    return request(`/api/reports${query}`);
  }

  async function submitReport(observation) {
    return request("/api/reports", {
      method: "POST",
      body: JSON.stringify(observation)
    });
  }

  return {
    healthCheck,
    fetchReports,
    submitReport,
    isOnline: () => online
  };
})();
