(function () {
  "use strict";

  const firebaseConfig = {
    apiKey: "AIzaSyAAjCd2CvsfiRCVWcwNSmjNt_w3N4eVSbM",
    authDomain: "login-fe9bf.firebaseapp.com",
    databaseURL: "https://login-fe9bf-default-rtdb.firebaseio.com",
    projectId: "login-fe9bf",
    storageBucket: "login-fe9bf.firebasestorage.app",
    messagingSenderId: "830162422312",
    appId: "1:830162422312:web:35f07fce2f6048db6b26f4"
  };
  const GOOGLE_CLIENT_ID = "830162422312-5h3nq1bohtktfhg4ksodt0jjsbeuria9.apps.googleusercontent.com";

  const APP_NAME = "zerattoAuthApp";
  const USERS_PATH = "zerattoUsers";
  const REDEEMS_PATH = "zerattoRedeems";
  const CODES_PATH = "zerattoRedeemCodes";
  const EXCHANGE_PATH = "zerattoExchangeRequests";
  const EXCHANGE_USER_PATH = "zerattoExchangeByUser";

  const CODE_IMPORT_ALLOWLIST = ["anggasrg11@gmail.com"];
  const DEFAULT_REDEEM_RUPIAH = 10;

  const TUKAR_LABELS = {
    diamond: "Diamond Game",
    pulsa: "Pulsa",
    ewallet: "E-wallet",
    mainan: "Mainan",
    lainnya: "Hadiah Lainnya"
  };

  let auth = null;
  let db = null;
  let provider = null;
  let currentUser = null;
  let currentPoints = 0;
  let currentTukarOption = "diamond";
  let tukarFormEnabled = false;
  const APP_LOGIN_POLL_MS = 250;
  const APP_LOGIN_TIMEOUT_MS = 12000;
  let gisScriptPromise = null;

  function byId(id) {
    return document.getElementById(id);
  }

  function toInt(value, fallback) {
    const num = Number(value);
    if (!Number.isFinite(num)) return Number.isFinite(fallback) ? fallback : 0;
    return Math.max(0, Math.trunc(num));
  }

  function formatRupiah(value) {
    return "Rp " + toInt(value, 0).toLocaleString("id-ID");
  }

  function sanitizeFirebaseKey(value) {
    return String(value || "").trim().replace(/[.#$/[\]]/g, "_");
  }

  function hasAppMarkerStorage() {
    try {
      if (localStorage.getItem("__marendal_in_app") === "1") return true;
    } catch (_err) {}
    try {
      if (sessionStorage.getItem("__marendal_in_app") === "1") return true;
    } catch (_err) {}
    return false;
  }

  function isProbablyAppContext() {
    try {
      const params = new URLSearchParams(window.location.search || "");
      if (params.get("app") === "1") return true;
    } catch (_err) {}

    if (hasAppMarkerStorage()) return true;
    if (window.__marendalInApp === true || window.__marendalAppBridgeInstalled === true) return true;

    try {
      const html = document.documentElement;
      if (html && html.getAttribute("data-marendal-app") === "1") return true;
    } catch (_err) {}

    const ua = String((navigator && navigator.userAgent) || "");
    const isStandalone = Boolean(
      (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
      navigator.standalone === true
    );
    const isWebView =
      /\bwv\b/i.test(ua) ||
      /;\s*wv\)/i.test(ua) ||
      /marendalapp/i.test(ua) ||
      /webview/i.test(ua);

    return Boolean(isStandalone || isWebView);
  }

  function postBridgeMessage(message) {
    try {
      if (window.MarendalAppBridge && typeof window.MarendalAppBridge.postMessage === "function") {
        window.MarendalAppBridge.postMessage(String(message || ""));
        return true;
      }
    } catch (_err) {}
    return false;
  }

  function readStoredGoogleUser() {
    let raw = "";
    try {
      raw = String(localStorage.getItem("googleUser") || "");
    } catch (_err) {}
    if (!raw) {
      try {
        raw = String(sessionStorage.getItem("googleUser") || "");
      } catch (_err) {}
    }
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      if (!parsed.id && !parsed.uid && !parsed.email) return null;
      return parsed;
    } catch (_err) {
      return null;
    }
  }

  function storeGoogleUserProfile(profile) {
    const safe = {
      id: String(profile && (profile.id || profile.sub || profile.email) || "").trim(),
      name: String(profile && (profile.name || profile.displayName || "Pengguna Zeratto") || "Pengguna Zeratto").trim(),
      email: String(profile && profile.email || "").trim(),
      picture: String(profile && (profile.picture || profile.photoURL || profile.photoUrl) || "").trim()
    };
    if (!safe.id && !safe.email) return null;
    if (!safe.id) safe.id = safe.email;
    if (!safe.picture) safe.picture = fallbackAvatar(safe.name || safe.email);

    try {
      localStorage.setItem("googleUser", JSON.stringify(safe));
    } catch (_err) {}
    try {
      sessionStorage.setItem("googleUser", JSON.stringify(safe));
    } catch (_err) {}
    return safe;
  }

  function ensureGoogleIdentityScript() {
    if (window.google && google.accounts && google.accounts.oauth2) {
      return Promise.resolve();
    }
    if (gisScriptPromise) return gisScriptPromise;

    gisScriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("GSI_LOAD_FAILED")), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("GSI_LOAD_FAILED"));
      document.head.appendChild(script);
    });

    return gisScriptPromise;
  }

  async function requestGoogleUserProfile() {
    await ensureGoogleIdentityScript();
    if (!(window.google && google.accounts && google.accounts.oauth2)) {
      throw new Error("GSI_NOT_AVAILABLE");
    }

    const tokenResponse = await new Promise((resolve, reject) => {
      let settled = false;
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: "openid profile email",
        callback: (resp) => {
          if (settled) return;
          settled = true;
          if (!resp || resp.error || !resp.access_token) {
            reject(new Error("GOOGLE_TOKEN_FAILED"));
            return;
          }
          resolve(resp);
        }
      });

      try {
        tokenClient.requestAccessToken({ prompt: "select_account" });
      } catch (err) {
        settled = true;
        reject(err);
      }
    });

    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      method: "GET",
      headers: {
        Authorization: "Bearer " + String(tokenResponse.access_token || "")
      }
    });
    if (!userInfoRes.ok) {
      throw new Error("GOOGLE_PROFILE_FETCH_FAILED");
    }

    const userInfo = await userInfoRes.json();
    const stored = storeGoogleUserProfile({
      id: String(userInfo.sub || userInfo.email || ""),
      name: String(userInfo.name || ""),
      email: String(userInfo.email || ""),
      picture: String(userInfo.picture || "")
    });
    if (!stored) throw new Error("GOOGLE_PROFILE_INVALID");
    return stored;
  }

  function buildPseudoUser(stored) {
    if (!stored || typeof stored !== "object") return null;

    const uid =
      sanitizeFirebaseKey(stored.uid) ||
      sanitizeFirebaseKey(stored.id) ||
      sanitizeFirebaseKey(stored.email);
    if (!uid) return null;

    const displayName = String(stored.name || stored.displayName || "Pengguna Zeratto").trim() || "Pengguna Zeratto";
    const email = String(stored.email || "").trim();
    const photoURL = String(stored.picture || stored.photoURL || "").trim();

    return {
      uid,
      displayName,
      email,
      photoURL,
      _zerattoPseudo: true
    };
  }

  async function waitStoredGoogleUser(timeoutMs) {
    const deadline = Date.now() + Math.max(1000, Number(timeoutMs || APP_LOGIN_TIMEOUT_MS));
    while (Date.now() < deadline) {
      const stored = readStoredGoogleUser();
      if (stored) return stored;
      await new Promise((resolve) => {
        setTimeout(resolve, APP_LOGIN_POLL_MS);
      });
    }
    return readStoredGoogleUser();
  }

  function fallbackAvatar(seed) {
    const safeSeed = String(seed || "Zeratto User").trim() || "Zeratto User";
    return "https://ui-avatars.com/api/?name=" + encodeURIComponent(safeSeed) + "&background=6a4028&color=fff7ec&size=128";
  }

  function parseTimestamp(value) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Date.parse(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  }

  function formatDate(value) {
    const timestamp = parseTimestamp(value);
    if (!timestamp) return "-";
    const date = new Date(timestamp);
    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function normalizeCode(raw) {
    return String(raw || "")
      .normalize("NFKD")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
  }

  function codeToKey(code) {
    return normalizeCode(code).replace(/[.#$/[\]]/g, "_");
  }

  function canonicalizeCode(code) {
    return normalizeCode(code)
      .replace(/O/g, "0")
      .replace(/[IL]/g, "1");
  }

  async function resolveRedeemCodeTarget(rawCode) {
    const normalized = normalizeCode(rawCode);
    if (!normalized) return null;

    const exactKey = codeToKey(normalized);
    const exactRef = db.ref(CODES_PATH + "/" + exactKey);
    const exactSnap = await exactRef.once("value");
    if (exactSnap.exists()) {
      const exactRow = exactSnap.val() || {};
      return {
        key: exactKey,
        ref: exactRef,
        code: normalizeCode(exactRow.code || normalized),
        record: exactRow
      };
    }

    const canonicalInput = canonicalizeCode(normalized);
    const allSnap = await db.ref(CODES_PATH).once("value");
    const allRows = allSnap.val() || {};
    const matches = [];

    Object.entries(allRows).forEach((entry) => {
      const key = entry[0];
      const row = entry[1];
      const resolvedCode = normalizeCode((row && row.code) || key);
      if (!resolvedCode) return;
      if (canonicalizeCode(resolvedCode) !== canonicalInput) return;
      matches.push({
        key,
        code: resolvedCode,
        record: row && typeof row === "object" ? row : { code: resolvedCode }
      });
    });

    if (matches.length !== 1) return null;

    return {
      key: matches[0].key,
      ref: db.ref(CODES_PATH + "/" + matches[0].key),
      code: matches[0].code,
      record: matches[0].record
    };
  }

  function resolveCodePointValue(codeRecord) {
    // Nominal redeem dikunci: 1 kode = Rp10.
    return DEFAULT_REDEEM_RUPIAH;
  }

  function canUseCodeRecord(record) {
    if (record === null || typeof record === "undefined") return false;

    if (typeof record === "boolean") return record === true;
    if (typeof record === "number") return Number(record) > 0;
    if (typeof record === "string") return normalizeCode(record).length > 0;

    if (typeof record === "object") {
      if (record.active === false || record.enabled === false) return false;
      const usedBy = String(record.usedBy || "").trim();
      if (!usedBy) return true;
      return false;
    }

    return false;
  }

  function buildUsedCodeRecord(existing, code, user, pointValue) {
    const base = (existing && typeof existing === "object")
      ? { ...existing }
      : { code };

    base.code = code;
    base.pointValue = toInt(pointValue, DEFAULT_REDEEM_RUPIAH);
    base.usedBy = user.uid;
    base.usedByName = user.displayName || "Pengguna Zeratto";
    base.usedByEmail = user.email || "";
    base.usedAt = firebase.database.ServerValue.TIMESTAMP;
    base.status = "used";
    base.active = true;
    return base;
  }

  async function rollbackCodeLock(codeRef, uid) {
    try {
      await codeRef.transaction((current) => {
        if (!current || typeof current !== "object") return current;
        if (String(current.usedBy || "") !== String(uid || "")) return current;
        const rolled = { ...current };
        delete rolled.usedBy;
        delete rolled.usedByName;
        delete rolled.usedByEmail;
        delete rolled.usedAt;
        rolled.status = "new";
        return rolled;
      });
    } catch (err) {
      console.error("[Zeratto Rollback Code Error]", err);
    }
  }

  async function fallbackLockCodeByUsedBy(codeRef, currentRecord, code, user) {
    const usedByRef = codeRef.child("usedBy");
    const lockTx = await usedByRef.transaction((current) => {
      const owner = String(current || "").trim();
      if (owner) return;
      return user.uid;
    });

    if (!lockTx.committed) {
      const finalOwner = String((lockTx.snapshot && lockTx.snapshot.val()) || "").trim();
      return { success: false, usedBy: finalOwner };
    }

    const pointValue = resolveCodePointValue(currentRecord);
    const payload = buildUsedCodeRecord(currentRecord, code, user, pointValue);

    try {
      await codeRef.update(payload);
      const finalSnap = await codeRef.once("value");
      return { success: true, data: finalSnap.val() || payload };
    } catch (err) {
      await rollbackCodeLock(codeRef, user.uid);
      throw err;
    }
  }

  function canImportCodes() {
    if (!currentUser || !currentUser.email) return false;
    const email = String(currentUser.email).trim().toLowerCase();
    return CODE_IMPORT_ALLOWLIST
      .map((item) => String(item).trim().toLowerCase())
      .includes(email);
  }

  function showAlert(id, type, message) {
    const el = byId(id);
    if (!el) return;
    el.className = "zr-alert " + type;
    el.textContent = message;
    el.hidden = false;
  }

  function hideAlert(id) {
    const el = byId(id);
    if (!el) return;
    el.hidden = true;
    el.textContent = "";
  }

  function setLoginButtons(isLoggedIn) {
    const loginBtn = byId("zrLoginBtn");
    const logoutBtn = byId("zrLogoutBtn");
    if (loginBtn) loginBtn.hidden = isLoggedIn;
    if (logoutBtn) logoutBtn.hidden = !isLoggedIn;
  }

  function setProfileUI(user) {
    const hint = byId("zrProfileHint");
    if (!hint) return;

    const box = byId("zrProfileBox");
    const photo = byId("zrProfilePhoto");
    const name = byId("zrProfileName");
    const email = byId("zrProfileEmail");
    const pointSummary = byId("zrProfilePointSummary");

    if (!user) {
      hint.textContent = "Silakan login dulu dengan akun Google.";
      if (box) box.hidden = true;
      if (pointSummary) pointSummary.hidden = true;
      hideAlert("zrProfileAlert");
      return;
    }

    const displayName = user.displayName || "Pengguna Zeratto";
    const displayEmail = user.email || "Email tidak tersedia";
    const displayPhoto = user.photoURL || fallbackAvatar(displayName || displayEmail);

    hint.textContent = "Login aktif. Akun ini dipakai untuk fitur redeem dan saldo.";
    if (box) box.hidden = false;
    if (pointSummary) pointSummary.hidden = false;
    if (photo) photo.src = displayPhoto;
    if (name) name.textContent = displayName;
    if (email) email.textContent = displayEmail;

    hideAlert("zrProfileAlert");
  }

  function updateProfilePointUI(points) {
    const summary = byId("zrProfilePointSummary");
    const pointEl = byId("zrProfilePointValue");
    if (summary) summary.hidden = false;
    if (pointEl) pointEl.textContent = formatRupiah(points);
  }

  function setRedeemUserUI(user) {
    const hint = byId("zrRedeemAuthHint");
    if (!hint) return;

    const userBox = byId("zrRedeemUserBox");
    const photo = byId("zrRedeemUserPhoto");
    const name = byId("zrRedeemUserName");
    const email = byId("zrRedeemUserEmail");

    if (!user) {
      hint.textContent = "Silakan login dulu untuk membuka form redeem.";
      if (userBox) userBox.hidden = true;
      showAlert("zrRedeemAuthAlert", "info", "Akses redeem terkunci sampai login Google berhasil.");
      return;
    }

    const displayName = user.displayName || "Pengguna Zeratto";
    const displayEmail = user.email || "Email tidak tersedia";
    const displayPhoto = user.photoURL || fallbackAvatar(displayName || displayEmail);

    hint.textContent = "Login berhasil. Kamu bisa redeem lebih dari satu kode selama setiap kode masih valid.";
    if (userBox) userBox.hidden = false;
    if (photo) photo.src = displayPhoto;
    if (name) name.textContent = displayName;
    if (email) email.textContent = displayEmail;

    hideAlert("zrRedeemAuthAlert");
  }

  function setTukarUserUI(user) {
    const hint = byId("zrTukarAuthHint");
    if (!hint) return;

    const userBox = byId("zrTukarUserBox");
    const photo = byId("zrTukarUserPhoto");
    const name = byId("zrTukarUserName");
    const email = byId("zrTukarUserEmail");

    if (!user) {
      hint.textContent = "Login Google dulu untuk buka form penukaran.";
      if (userBox) userBox.hidden = true;
      showAlert("zrTukarAuthAlert", "info", "Akses tukar saldo dikunci sampai login Google berhasil.");
      return;
    }

    const displayName = user.displayName || "Pengguna Zeratto";
    const displayEmail = user.email || "Email tidak tersedia";
    const displayPhoto = user.photoURL || fallbackAvatar(displayName || displayEmail);

    hint.textContent = "Login aktif. Isi form penukaran, lalu admin akan proses manual.";
    if (userBox) userBox.hidden = false;
    if (photo) photo.src = displayPhoto;
    if (name) name.textContent = displayName;
    if (email) email.textContent = displayEmail;

    hideAlert("zrTukarAuthAlert");
  }

  function setRedeemFormEnabled(enabled) {
    const form = byId("zrRedeemForm");
    const input = byId("zrRedeemCode");
    const submit = byId("zrRedeemSubmit");

    if (!form) return;
    if (input) input.disabled = !enabled;
    if (submit) submit.disabled = !enabled;
  }

  function setTukarFormEnabled(enabled) {
    tukarFormEnabled = Boolean(enabled);
    setTukarOption(currentTukarOption || "diamond");
  }

  function resolveInitialTukarOption() {
    const bodyOption = String(
      document.body && document.body.dataset ? (document.body.dataset.zrTukarOption || "") : ""
    ).trim().toLowerCase();
    if (TUKAR_LABELS[bodyOption]) return bodyOption;

    const activeOptionCard = document.querySelector("#zrTukarOptionGrid .zr-option-card.active[data-option]");
    if (activeOptionCard && TUKAR_LABELS[activeOptionCard.dataset.option]) {
      return String(activeOptionCard.dataset.option || "").trim();
    }

    const forms = document.querySelectorAll(".zr-tukar-form");
    if (forms.length === 1) {
      const singleOption = String(forms[0].dataset.option || "").trim().toLowerCase();
      if (TUKAR_LABELS[singleOption]) return singleOption;
    }

    return "diamond";
  }

  function setTukarOption(option) {
    const target = TUKAR_LABELS[option] ? option : "diamond";
    currentTukarOption = target;

    const grid = byId("zrTukarOptionGrid");
    if (grid) {
      grid.querySelectorAll(".zr-option-card").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.option === target);
      });
    }

    const titleEl = byId("zrTukarFormTitle");
    if (titleEl) {
      const label = TUKAR_LABELS[target] || target;
      titleEl.textContent = "Form Penukaran: " + label;
    }

    const forms = document.querySelectorAll(".zr-tukar-form");
    if (!forms || !forms.length) return;

    forms.forEach((form) => {
      const active = String(form.dataset.option || "") === target;
      form.hidden = !active;
      form.querySelectorAll("input, select, textarea, button").forEach((el) => {
        el.disabled = !tukarFormEnabled || !active;
      });
    });
  }

  function updateTukarPointUI(points) {
    const summary = byId("zrPointSummary");
    const pointEl = byId("zrPointValue");

    if (summary) summary.hidden = false;
    if (pointEl) pointEl.textContent = formatRupiah(points);
  }

  function renderTukarHistory(items) {
    const container = byId("zrTukarHistory");
    if (!container) return;

    if (!items || !items.length) {
      container.innerHTML = "<div class=\"zr-history-empty\">Belum ada pengajuan penukaran.</div>";
      return;
    }

    container.innerHTML = items.map((item) => {
      const optionLabel = TUKAR_LABELS[item.option] || String(item.optionLabel || "-");
      const status = String(item.status || "pending");
      const statusLabel = status === "approved" ? "Disetujui" : (status === "rejected" ? "Ditolak" : "Pending");
      const statusClass = status === "approved" ? "success" : (status === "rejected" ? "error" : "info");
      return "" +
        "<div class=\"zr-history-item\">" +
          "<div class=\"zr-history-top\">" +
            "<strong>" + optionLabel + "</strong>" +
            "<span class=\"zr-alert " + statusClass + "\">" + statusLabel + "</span>" +
          "</div>" +
          "<div class=\"zr-history-meta\">" +
            "<span>Nominal: " + formatRupiah(item.pointUsed) + "</span>" +
            "<span>Waktu: " + formatDate(item.createdAt) + "</span>" +
          "</div>" +
        "</div>";
    }).join("");
  }

  async function loadTukarHistory(uid) {
    const container = byId("zrTukarHistory");
    if (!container || !uid) return;

    try {
      const snap = await db.ref(EXCHANGE_USER_PATH + "/" + uid).once("value");
      const data = snap.val() || {};
      const items = Object.values(data)
        .sort((a, b) => toInt(b && b.createdAt) - toInt(a && a.createdAt))
        .slice(0, 8);
      renderTukarHistory(items);
    } catch (err) {
      console.error("[Zeratto Tukar History Error]", err);
      container.innerHTML = "<div class=\"zr-history-empty\">Gagal memuat riwayat penukaran.</div>";
    }
  }

  async function loadUserPoints(uid) {
    const pointsRef = db.ref(USERS_PATH + "/" + uid + "/points");
    const snap = await pointsRef.once("value");
    return toInt(snap.val(), 0);
  }

  async function ensureUserSaved(user) {
    const userRef = db.ref(USERS_PATH + "/" + user.uid);
    const snap = await userRef.once("value");

    const payload = {
      uid: user.uid,
      name: user.displayName || "Pengguna Zeratto",
      email: user.email || "",
      photoURL: user.photoURL || "",
      provider: "google",
      lastLoginAt: firebase.database.ServerValue.TIMESTAMP
    };

    if (snap.exists()) {
      await userRef.update(payload);
      return;
    }

    payload.createdAt = firebase.database.ServerValue.TIMESTAMP;
    payload.points = 0;
    await userRef.set(payload);
  }

  async function applyUserState(user) {
    currentUser = user || null;
    setLoginButtons(Boolean(currentUser));
    setProfileUI(currentUser);
    setRedeemUserUI(currentUser);
    setTukarUserUI(currentUser);

    if (currentUser) {
      try {
        await ensureUserSaved(currentUser);
      } catch (err) {
        console.error("[Zeratto User Save Error]", err);
      }

      try {
        currentPoints = await loadUserPoints(currentUser.uid);
        updateProfilePointUI(currentPoints);
      } catch (err) {
        updateProfilePointUI(0);
        console.error("[Zeratto Profile Point Sync Error]", err);
      }
    } else {
      currentPoints = 0;
      const pointSummary = byId("zrProfilePointSummary");
      const pointEl = byId("zrProfilePointValue");
      if (pointSummary) pointSummary.hidden = true;
      if (pointEl) pointEl.textContent = formatRupiah(0);
    }

    try {
      await syncRedeemState(currentUser);
    } catch (err) {
      showAlert("zrRedeemMessage", "error", "Gagal memuat status redeem akun.");
      console.error("[Zeratto Redeem Sync Error]", err);
    }

    try {
      await syncTukarState(currentUser);
    } catch (err) {
      showAlert("zrTukarMessage", "error", "Gagal memuat status tukar saldo.");
      console.error("[Zeratto Tukar Sync Error]", err);
    }
  }

  async function applyAppStoredUserState() {
    const storedUser = readStoredGoogleUser();
    const pseudoUser = buildPseudoUser(storedUser);
    if (!pseudoUser) return false;
    await applyUserState(pseudoUser);
    return true;
  }

  async function syncRedeemState(user) {
    if (!byId("zrRedeemForm")) return;

    if (!user) {
      setRedeemFormEnabled(false);
      showAlert("zrRedeemMessage", "info", "Login Google dulu agar bisa melakukan redeem.");
      return;
    }

    const snap = await db.ref(REDEEMS_PATH).once("value");
    const userRedeems = extractUserRedeemsFromRoot(snap.val(), user.uid);

    setRedeemFormEnabled(true);
    if (!userRedeems.length) {
      hideAlert("zrRedeemMessage");
      return;
    }

    const latest = userRedeems[0] || {};
    const code = String(latest.code || "-");
    const redeemedAt = formatDate(latest.redeemedAt);
    const pointGain = toInt(latest.pointGain, 0);
    showAlert(
      "zrRedeemMessage",
      "success",
      "Total klaim akun ini: " + userRedeems.length + " kode. Klaim terakhir: " + code + " | Saldo: +" + formatRupiah(pointGain) + " | Waktu: " + redeemedAt
    );
  }

  function extractUserRedeemsFromRoot(rootData, uid) {
    const targetUid = String(uid || "").trim();
    if (!targetUid || !rootData || typeof rootData !== "object") return [];

    const rows = [];
    const seen = new Set();

    function pushRow(row, fallbackUid, redeemId) {
      if (!row || typeof row !== "object") return;

      const rowUid = String(row.uid || fallbackUid || "").trim();
      if (!rowUid || rowUid !== targetUid) return;

      const normalizedCode = normalizeCode(row.code || row.codeOriginal || row.codeKey || "");
      const redeemedAt = parseTimestamp(row.redeemedAt);
      const dedupeKey = [
        rowUid,
        normalizedCode || String(row.code || row.codeKey || ""),
        redeemedAt || String(redeemId || "")
      ].join("|");
      if (seen.has(dedupeKey)) return;
      seen.add(dedupeKey);

      rows.push({
        uid: rowUid,
        code: String(row.code || normalizedCode || "-"),
        pointGain: toInt(row.pointGain, 0),
        pointBalanceAfter: toInt(row.pointBalanceAfter, 0),
        redeemedAt: row.redeemedAt,
        redeemId: String(redeemId || row.codeKey || "")
      });
    }

    Object.entries(rootData).forEach(function (entry) {
      const key = entry[0];
      const row = entry[1];
      if (!row || typeof row !== "object") return;

      const isDirectRedeemRow =
        Object.prototype.hasOwnProperty.call(row, "code") ||
        Object.prototype.hasOwnProperty.call(row, "pointGain") ||
        Object.prototype.hasOwnProperty.call(row, "redeemedAt");

      if (isDirectRedeemRow) {
        pushRow(row, key, key);
        return;
      }

      Object.entries(row).forEach(function (childEntry) {
        const childKey = childEntry[0];
        const childRow = childEntry[1];
        if (!childRow || typeof childRow !== "object") return;

        const isChildRedeemRow =
          Object.prototype.hasOwnProperty.call(childRow, "code") ||
          Object.prototype.hasOwnProperty.call(childRow, "pointGain") ||
          Object.prototype.hasOwnProperty.call(childRow, "redeemedAt");
        if (!isChildRedeemRow) return;

        pushRow(childRow, key, key + ":" + childKey);
      });
    });

    return rows.sort(function (a, b) {
      return parseTimestamp(b.redeemedAt) - parseTimestamp(a.redeemedAt);
    });
  }

  async function syncTukarState(user) {
    if (!document.querySelector(".zr-tukar-form")) return;

    if (!user) {
      currentPoints = 0;
      updateTukarPointUI(0);
      setTukarFormEnabled(false);
      showAlert("zrTukarMessage", "info", "Login Google dulu agar bisa menukar saldo.");
      renderTukarHistory([]);
      return;
    }

    try {
      currentPoints = await loadUserPoints(user.uid);
      updateTukarPointUI(currentPoints);
      setTukarFormEnabled(true);
      hideAlert("zrTukarMessage");
      await loadTukarHistory(user.uid);
    } catch (err) {
      console.error("[Zeratto Sync Tukar Error]", err);
      setTukarFormEnabled(false);
      showAlert("zrTukarMessage", "error", "Gagal memuat data saldo akun.");
    }
  }

  async function handleRedeemSubmit(event) {
    event.preventDefault();

    const input = byId("zrRedeemCode");
    const codeRaw = String((input && input.value) || "").trim();
    const code = normalizeCode(codeRaw);

    if (!currentUser) {
      showAlert("zrRedeemMessage", "error", "Login Google dulu sebelum redeem.");
      setRedeemFormEnabled(false);
      return;
    }

    if (!code) {
      showAlert("zrRedeemMessage", "error", "Kode redeem tidak boleh kosong.");
      return;
    }

    setRedeemFormEnabled(false);

    try {
      const codeTarget = await resolveRedeemCodeTarget(code);
      if (!codeTarget) {
        showAlert("zrRedeemMessage", "error", "Kode redeem tidak valid.");
        return;
      }

      const codeRef = codeTarget.ref;
      const resolvedCode = codeTarget.code || code;
      const codeKey = codeTarget.key;
      let codeData = null;

      const codeTx = await codeRef.transaction((current) => {
        if (!canUseCodeRecord(current)) return;

        const pointValue = resolveCodePointValue(current);
        return buildUsedCodeRecord(current, resolvedCode, currentUser, pointValue);
      });

      if (codeTx.committed) {
        codeData = codeTx.snapshot.val() || {};
      } else {
        const latestCode = (await codeRef.once("value")).val();
        if (latestCode === null || typeof latestCode === "undefined") {
          showAlert("zrRedeemMessage", "error", "Kode redeem tidak valid.");
          return;
        }

        if (latestCode && typeof latestCode === "object") {
          const usedBy = String(latestCode.usedBy || "").trim();
          if (usedBy) {
            if (usedBy === currentUser.uid) {
              showAlert("zrRedeemMessage", "error", "Kode ini sudah pernah kamu pakai.");
            } else {
              showAlert("zrRedeemMessage", "error", "Kode sudah dipakai user lain. Gunakan kode lain.");
            }
            return;
          }
          if (latestCode.active === false || latestCode.enabled === false) {
            showAlert("zrRedeemMessage", "error", "Kode tidak aktif.");
            return;
          }
        }

        if (canUseCodeRecord(latestCode)) {
          const fallbackLock = await fallbackLockCodeByUsedBy(codeRef, latestCode, resolvedCode, currentUser);
          if (!fallbackLock.success) {
            if (fallbackLock.usedBy) {
              if (fallbackLock.usedBy === currentUser.uid) {
                showAlert("zrRedeemMessage", "error", "Kode ini sudah pernah kamu pakai.");
              } else {
                showAlert("zrRedeemMessage", "error", "Kode sudah dipakai user lain. Gunakan kode lain.");
              }
              return;
            }
            showAlert("zrRedeemMessage", "error", "Kode redeem tidak dapat dipakai.");
            return;
          }
          codeData = fallbackLock.data || {};
        } else {
          showAlert("zrRedeemMessage", "error", "Kode redeem tidak dapat dipakai.");
          return;
        }
      }

      const pointGain = resolveCodePointValue(codeData);
      const redeemRef = db.ref(REDEEMS_PATH).push();

      await redeemRef.set({
        uid: currentUser.uid,
        code: resolvedCode,
        codeOriginal: codeRaw,
        codeKey,
        pointGain,
        redeemedAt: firebase.database.ServerValue.TIMESTAMP,
        name: currentUser.displayName || "Pengguna Zeratto",
        email: currentUser.email || "",
        photoURL: currentUser.photoURL || ""
      });

      try {
        const pointsRef = db.ref(USERS_PATH + "/" + currentUser.uid + "/points");
        const pointsTx = await pointsRef.transaction((current) => toInt(current) + pointGain);
        if (!pointsTx.committed) {
          throw new Error("Saldo tidak berhasil ditambahkan.");
        }

        currentPoints = toInt(pointsTx.snapshot.val(), 0);
        await redeemRef.update({ pointBalanceAfter: currentPoints });
      } catch (pointsErr) {
        await redeemRef.remove().catch(() => {});
        await rollbackCodeLock(codeRef, currentUser.uid);
        throw pointsErr;
      }

      if (input) input.value = "";
      showAlert(
        "zrRedeemMessage",
        "success",
        "Redeem berhasil. Saldo bertambah " + formatRupiah(pointGain) + "."
      );
      updateTukarPointUI(currentPoints);
      await syncRedeemState(currentUser);
    } catch (err) {
      showAlert("zrRedeemMessage", "error", "Terjadi error saat redeem. Coba ulangi lagi.");
      console.error("[Zeratto Redeem Error]", err);
    } finally {
      if (currentUser) setRedeemFormEnabled(true);
    }
  }

  function readFormValue(form, name) {
    if (!form || !name) return "";
    const el = form.elements ? form.elements.namedItem(name) : null;
    if (!el) return "";
    return String(el.value || "");
  }

  function collectTukarDetail(option, form) {
    if (option === "diamond") {
      return {
        game: readFormValue(form, "diamondGame").trim(),
        package: readFormValue(form, "diamondPackage").trim(),
        userId: readFormValue(form, "diamondUserId").trim(),
        serverId: readFormValue(form, "diamondServerId").trim()
      };
    }

    if (option === "pulsa") {
      return {
        targetNumber: readFormValue(form, "pulsaNumber").trim(),
        operator: readFormValue(form, "pulsaOperator").trim(),
        nominal: readFormValue(form, "pulsaNominal").trim()
      };
    }

    if (option === "ewallet") {
      return {
        walletType: readFormValue(form, "walletType").trim(),
        walletNumber: readFormValue(form, "walletNumber").trim(),
        walletName: readFormValue(form, "walletName").trim()
      };
    }

    if (option === "mainan") {
      return {
        toyName: readFormValue(form, "toyName").trim(),
        shippingAddress: readFormValue(form, "toyAddress").trim()
      };
    }

    return {
      title: readFormValue(form, "otherTitle").trim(),
      detail: readFormValue(form, "otherDetail").trim(),
      shippingAddress: readFormValue(form, "otherAddress").trim()
    };
  }

  function validateTukarDetail(option, detail) {
    if (!detail || typeof detail !== "object") {
      return "Detail kategori hadiah tidak valid.";
    }

    if (option === "diamond") {
      if (!detail.game) return "Pilih game untuk kategori Diamond Game.";
      if (!detail.package) return "Paket diamond wajib diisi.";
      if (!detail.userId) return "User ID game wajib diisi.";
      return "";
    }

    if (option === "pulsa") {
      if (!detail.targetNumber) return "Nomor tujuan pulsa wajib diisi.";
      if (!detail.operator) return "Operator pulsa wajib dipilih.";
      if (!detail.nominal) return "Nominal pulsa wajib diisi.";
      return "";
    }

    if (option === "ewallet") {
      if (!detail.walletType) return "Jenis e-wallet wajib dipilih.";
      if (!detail.walletNumber) return "Nomor akun e-wallet wajib diisi.";
      if (!detail.walletName) return "Nama pemilik e-wallet wajib diisi.";
      return "";
    }

    if (option === "mainan") {
      if (!detail.toyName) return "Nama mainan yang diinginkan wajib diisi.";
      if (!detail.shippingAddress) return "Alamat pengiriman wajib diisi untuk kategori Mainan.";
      return "";
    }

    if (option === "lainnya") {
      if (!detail.title) return "Nama hadiah lainnya wajib diisi.";
      if (!detail.detail) return "Detail hadiah lainnya wajib diisi.";
      return "";
    }

    return "Kategori hadiah tidak dikenali.";
  }

  async function handleTukarSubmit(event) {
    event.preventDefault();

    const form = event.target;

    if (!currentUser) {
      showAlert("zrTukarMessage", "error", "Login Google dulu sebelum mengirim penukaran.");
      setTukarFormEnabled(false);
      return;
    }

    const option = String(form && form.dataset ? (form.dataset.option || "") : "").trim() || "diamond";
    const pointUsed = toInt(readFormValue(form, "pointUsed"), 0);
    const whatsapp = readFormValue(form, "whatsapp").trim();
    const note = readFormValue(form, "note").trim();

    if (!TUKAR_LABELS[option]) {
      showAlert("zrTukarMessage", "error", "Opsi penukaran tidak valid.");
      return;
    }

    if (pointUsed <= 0) {
      showAlert("zrTukarMessage", "error", "Nominal penukaran harus lebih dari 0.");
      return;
    }

    if (!whatsapp) {
      showAlert("zrTukarMessage", "error", "Nomor WhatsApp wajib diisi.");
      return;
    }

    const optionDetail = collectTukarDetail(option, form);
    const detailError = validateTukarDetail(option, optionDetail);
    if (detailError) {
      showAlert("zrTukarMessage", "error", detailError);
      return;
    }

    try {
      const pointsRef = db.ref(USERS_PATH + "/" + currentUser.uid + "/points");
      const pointsTx = await pointsRef.transaction((current) => {
        const currentBalance = toInt(current, 0);
        if (currentBalance < pointUsed) return;
        return currentBalance - pointUsed;
      });

      if (!pointsTx.committed) {
        showAlert("zrTukarMessage", "error", "Saldo tidak cukup untuk penukaran ini.");
        await syncTukarState(currentUser);
        return;
      }

      const newBalance = toInt(pointsTx.snapshot.val(), 0);
      const reqRef = db.ref(EXCHANGE_PATH).push();
      const reqId = reqRef.key;

      const payload = {
        requestId: reqId,
        uid: currentUser.uid,
        option,
        optionLabel: TUKAR_LABELS[option],
        pointUsed,
        whatsapp,
        note,
        detail: optionDetail,
        status: "pending",
        name: currentUser.displayName || "Pengguna Zeratto",
        email: currentUser.email || "",
        photoURL: currentUser.photoURL || "",
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        pointBalanceAfter: newBalance
      };

      try {
        const updates = {};
        updates[EXCHANGE_PATH + "/" + reqId] = payload;
        updates[EXCHANGE_USER_PATH + "/" + currentUser.uid + "/" + reqId] = payload;
        await db.ref().update(updates);
      } catch (saveErr) {
        await pointsRef.transaction((current) => toInt(current, 0) + pointUsed);
        throw saveErr;
      }

      currentPoints = newBalance;
      updateTukarPointUI(currentPoints);
      showAlert(
        "zrTukarMessage",
        "success",
        "Pengajuan berhasil dikirim. Admin akan proses manual."
      );

      if (form) form.reset();
      setTukarOption(option);
      await loadTukarHistory(currentUser.uid);
    } catch (err) {
      console.error("[Zeratto Tukar Submit Error]", err);
      showAlert("zrTukarMessage", "error", "Gagal mengirim pengajuan penukaran. Coba lagi.");
      await syncTukarState(currentUser);
    }
  }

  async function importRedeemCodes(codeList) {
    if (!db) throw new Error("Firebase belum siap.");
    if (!canImportCodes()) throw new Error("Akun ini tidak punya izin import kode.");
    if (!Array.isArray(codeList) || codeList.length === 0) {
      throw new Error("Daftar kode kosong.");
    }

    const updates = {};
    const now = Date.now();
    let count = 0;

    codeList.forEach((raw) => {
      const code = normalizeCode(raw);
      if (!code) return;
      const key = codeToKey(code);
      updates[CODES_PATH + "/" + key] = {
        code,
        active: true,
        pointValue: DEFAULT_REDEEM_RUPIAH,
        createdAt: now,
        status: "new"
      };
      count += 1;
    });

    if (!count) throw new Error("Tidak ada kode valid untuk diimport.");
    await db.ref().update(updates);
    return count;
  }

  window.ZerattoRedeemAdmin = {
    importCodesFromText: async function (textBlock) {
      const lines = String(textBlock || "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      return importRedeemCodes(lines);
    }
  };

  async function signInGoogle() {
    if (isProbablyAppContext()) {
      const bridgeReady = postBridgeMessage("google_login");
      if (bridgeReady) {
        showAlert("zrProfileAlert", "info", "Membuka login Google aplikasi...");
        showAlert("zrRedeemAuthAlert", "info", "Membuka login Google aplikasi...");
        showAlert("zrTukarAuthAlert", "info", "Membuka login Google aplikasi...");

        const storedUser = await waitStoredGoogleUser(APP_LOGIN_TIMEOUT_MS);
        const pseudoUser = buildPseudoUser(storedUser);
        if (pseudoUser) {
          await applyUserState(pseudoUser);
          return;
        }
      }
    }

    try {
      const profile = await requestGoogleUserProfile();
      const pseudoUser = buildPseudoUser(profile);
      if (!pseudoUser) throw new Error("GOOGLE_PROFILE_INVALID");
      await applyUserState(pseudoUser);
      window.dispatchEvent(new CustomEvent("userLoggedIn", { detail: profile }));
    } catch (err) {
      const message = "Login Google gagal. Silakan coba lagi.";
      showAlert("zrProfileAlert", "error", message);
      showAlert("zrRedeemAuthAlert", "error", message);
      showAlert("zrTukarAuthAlert", "error", message);
      console.error("[Zeratto Login Error]", err);
    }
  }

  async function signOutGoogle() {
    try {
      if (isProbablyAppContext()) postBridgeMessage("logout");
      try {
        localStorage.removeItem("googleUser");
      } catch (_err) {}
      try {
        sessionStorage.removeItem("googleUser");
      } catch (_err) {}

      if (auth) {
        try {
          await auth.signOut();
        } catch (_err) {}
      }
      hideAlert("zrProfileAlert");
      showAlert("zrRedeemMessage", "info", "Kamu sudah logout. Login lagi untuk redeem.");
      showAlert("zrTukarMessage", "info", "Kamu sudah logout. Login lagi untuk tukar saldo.");
      await applyUserState(null);
    } catch (err) {
      showAlert("zrProfileAlert", "error", "Logout gagal. Coba ulangi.");
      showAlert("zrRedeemAuthAlert", "error", "Logout gagal. Coba ulangi.");
      showAlert("zrTukarAuthAlert", "error", "Logout gagal. Coba ulangi.");
      console.error("[Zeratto Logout Error]", err);
    }
  }

  function bindEvents() {
    const loginBtn = byId("zrLoginBtn");
    const logoutBtn = byId("zrLogoutBtn");
    const redeemForm = byId("zrRedeemForm");

    if (loginBtn) loginBtn.addEventListener("click", signInGoogle);
    if (logoutBtn) logoutBtn.addEventListener("click", signOutGoogle);
    if (redeemForm) redeemForm.addEventListener("submit", handleRedeemSubmit);

    document.querySelectorAll(".zr-tukar-form").forEach((form) => {
      form.addEventListener("submit", handleTukarSubmit);
    });

    const optionGrid = byId("zrTukarOptionGrid");
    if (optionGrid) {
      optionGrid.querySelectorAll(".zr-option-card").forEach((btn) => {
        btn.addEventListener("click", (event) => {
          const href = String(btn.getAttribute("href") || "").trim();
          if (href && href !== "#" && href !== "") {
            return;
          }
          event.preventDefault();
          setTukarOption(btn.dataset.option || "diamond");
        });
      });
    }

    window.addEventListener("userLoggedIn", () => {
      applyAppStoredUserState().catch((err) => {
        console.error("[Zeratto App Login Event Error]", err);
      });
    });

    window.addEventListener("storage", (event) => {
      if (!event || event.key !== "googleUser") return;
      applyAppStoredUserState().catch((err) => {
        console.error("[Zeratto App Storage Sync Error]", err);
      });
    });
  }

  function initFirebase() {
    if (typeof firebase === "undefined") {
      showAlert("zrProfileAlert", "error", "Firebase belum termuat.");
      showAlert("zrRedeemAuthAlert", "error", "Firebase belum termuat.");
      showAlert("zrTukarAuthAlert", "error", "Firebase belum termuat.");
      return false;
    }

    let app = null;
    try {
      app = firebase.app(APP_NAME);
    } catch (_err) {
      app = firebase.initializeApp(firebaseConfig, APP_NAME);
    }

    auth = app.auth();
    db = app.database();
    provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    return true;
  }

  function startAuthObserver() {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        await applyUserState(user);
        return;
      }

      const appApplied = await applyAppStoredUserState();
      if (appApplied) return;

      await applyUserState(null);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    currentTukarOption = resolveInitialTukarOption();
    if (!initFirebase()) return;
    bindEvents();
    setTukarOption(currentTukarOption);
    startAuthObserver();
  });
})();
