/**
 * OpenAgriMap France - API Client
 * Talks to the backend (server/server.js). Falls back to local-only mode
 * when the API is unreachable (e.g. opening index.html as a static file),
 * so the demo never breaks.
 */

const ApiClient = (() => {
  const baseUrl = window.location.origin.startsWith("file:") ? "" : window.location.origin;
  let online = true;

  // P1 accounts: bearer token persisted in localStorage (set after register/login)
  function getToken() {
    try { return window.localStorage.getItem("oam_token") || null; } catch { return null; }
  }
  function setToken(token) {
    try {
      if (token) window.localStorage.setItem("oam_token", token);
      else window.localStorage.removeItem("oam_token");
    } catch { /* storage unavailable */ }
  }

  async function request(path, options = {}) {
    if (!baseUrl) throw new Error("offline");
    const token = getToken();
    const res = await fetch(`${baseUrl}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
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

  async function fetchReports(bbox, status) {
    const params = new URLSearchParams();
    if (bbox) params.set("bbox", bbox.join(","));
    if (status) params.set("status", status);
    const query = params.toString() ? `?${params.toString()}` : "";
    return request(`/api/reports${query}`);
  }

  async function submitReport(observation) {
    return request("/api/reports", {
      method: "POST",
      body: JSON.stringify(observation)
    });
  }

  /** Upload a report photo (File/Blob) as a base64 data URL; returns { url } served at /uploads/*. */
  async function uploadPhoto(file) {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("lecture du fichier impossible"));
      reader.readAsDataURL(file);
    });
    return request("/api/uploads/photo", {
      method: "POST",
      body: JSON.stringify({ dataUrl })
    });
  }

  async function register(email, password, displayName) {
    const body = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, displayName })
    });
    if (body.token) setToken(body.token);
    return body;
  }

  async function login(email, password) {
    const body = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    if (body.token) setToken(body.token);
    return body;
  }

  async function logout() {
    try { await request("/api/auth/logout", { method: "POST" }); } finally { setToken(null); }
  }

  async function me() {
    return request("/api/me");
  }

  return {
    healthCheck,
    fetchReports,
    submitReport,
    uploadPhoto,
    register,
    login,
    logout,
    me,
    getToken,
    setToken,
    isOnline: () => online
  };
})();
