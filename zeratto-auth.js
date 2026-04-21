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
  const GACHA_CONFIG_PATH = "zerattoLuckyDrawConfig";
  const GACHA_LOGS_PATH = "zerattoLuckyDrawSpinLogs";
  const USER_POINTS_STORAGE_KEY = "zerattoUserPoints";
  const USER_POINTS_EVENT = "zerattoPointsUpdated";
  const USER_GACHA_STORAGE_KEY = "zerattoUserGachaState";
  const USER_GACHA_EVENT = "zerattoGachaUpdated";

  const CODE_IMPORT_ALLOWLIST = ["anggasrg11@gmail.com"];
  const DEFAULT_REDEEM_RUPIAH = 0;
  const REDEEM_SPIN_GAIN = 1;
  const EWALLET_MIN_COIN = 100;
  const EWALLET_RUPIAH_PER_COIN = 10;
  const EWALLET_TYPES = ["DANA", "GoPay", "OVO", "ShopeePay"];
  const PULSA_OPERATORS = ["Telkomsel", "Axis", "XL", "Tri", "IM3", "Smartfren"];
  const DEFAULT_GACHA_REWARD_VALUES = [5, 8, 10, 12, 15, 18, 20, 25, 30];
  const GACHA_BOARD_SIZE = 9;

  const TUKAR_LABELS = {
    diamond: "Diamond Game",
    pulsa: "Pulsa",
    ewallet: "Saldo E-Wallet",
    mainan: "Mainan",
    lainnya: "Hadiah Lainnya"
  };

  let auth = null;
  let db = null;
  let provider = null;
  let currentUser = null;
  let currentPoints = 0;
  let currentGachaState = { totalRedeems: 0, usedSpins: 0, availableSpins: 0 };
  let currentTukarOption = "diamond";
  let tukarFormEnabled = false;
  const APP_LOGIN_POLL_MS = 250;
  const APP_LOGIN_TIMEOUT_MS = 12000;
  let gisScriptPromise = null;

  function byId(id) {
    return document.getElementById(id);
  }

  function isTukarSoonPage() {
    const body = document.body;
    if (!body || !body.dataset) return false;
    return String(body.dataset.zrTukarStatus || "").trim().toLowerCase() === "soon";
  }

  function toInt(value, fallback) {
    const num = Number(value);
    if (!Number.isFinite(num)) return Number.isFinite(fallback) ? fallback : 0;
    return Math.max(0, Math.trunc(num));
  }

  function formatRupiah(value) {
    return toInt(value, 0).toLocaleString("id-ID") + " Coin";
  }

  function formatIdr(value) {
    return "Rp " + toInt(value, 0).toLocaleString("id-ID");
  }

  function calculateEwalletRupiah(points) {
    return toInt(points, 0) * EWALLET_RUPIAH_PER_COIN;
  }

  function readExchangeWalletRupiah(item) {
    if (!item || String(item.option || "") !== "ewallet") return 0;
    const detail = item.detail && typeof item.detail === "object" ? item.detail : {};
    const storedValue = toInt(detail.walletRupiah, 0);
    return storedValue > 0 ? storedValue : calculateEwalletRupiah(item.pointUsed);
  }

  function isKnownEwalletType(value) {
    return EWALLET_TYPES.includes(String(value || "").trim());
  }

  function isKnownPulsaOperator(value) {
    return PULSA_OPERATORS.includes(String(value || "").trim());
  }

  function getDiamondCheckerKey(gameName) {
    if (gameName === "Mobile Legends") return "ml";
    if (gameName === "Free Fire") return "freefire";
    return "";
  }

  function gameRequiresDiamondId(gameName) {
    return Boolean(getDiamondCheckerKey(gameName));
  }

  function gameRequiresDiamondServer(gameName) {
    return gameName === "Mobile Legends";
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

  function dispatchUserPoints(points) {
    try {
      window.dispatchEvent(new CustomEvent(USER_POINTS_EVENT, {
        detail: {
          points: toInt(points, 0)
        }
      }));
    } catch (_err) {}
  }

  function buildGachaState(totalRedeems, usedSpins) {
    const safeRedeems = toInt(totalRedeems, 0);
    const safeUsedSpins = Math.min(safeRedeems, toInt(usedSpins, 0));
    return {
      totalRedeems: safeRedeems,
      usedSpins: safeUsedSpins,
      availableSpins: Math.max(0, safeRedeems - safeUsedSpins)
    };
  }

  function dispatchUserGachaState(state) {
    const safeState = buildGachaState(
      state && state.totalRedeems,
      state && state.usedSpins
    );

    try {
      window.dispatchEvent(new CustomEvent(USER_GACHA_EVENT, {
        detail: safeState
      }));
    } catch (_err) {}
  }

  function storeCachedUserGachaState(state) {
    const safeState = buildGachaState(
      state && state.totalRedeems,
      state && state.usedSpins
    );
    currentGachaState = safeState;

    try {
      localStorage.setItem(USER_GACHA_STORAGE_KEY, JSON.stringify(safeState));
    } catch (_err) {}

    try {
      sessionStorage.setItem(USER_GACHA_STORAGE_KEY, JSON.stringify(safeState));
    } catch (_err) {}

    dispatchUserGachaState(safeState);
    return safeState;
  }

  function clearCachedUserGachaState() {
    try {
      localStorage.removeItem(USER_GACHA_STORAGE_KEY);
    } catch (_err) {}

    try {
      sessionStorage.removeItem(USER_GACHA_STORAGE_KEY);
    } catch (_err) {}

    currentGachaState = buildGachaState(0, 0);
    dispatchUserGachaState(currentGachaState);
  }

  async function loadUserGachaState(uid, userRedeems) {
    const totalRedeems = Array.isArray(userRedeems) ? userRedeems.length : 0;
    const spinsRef = db.ref(USERS_PATH + "/" + uid + "/gachaUsedSpins");
    const snap = await spinsRef.once("value");
    return buildGachaState(totalRedeems, snap.val());
  }

  function getGachaRequirementMessage(state) {
    const safeState = buildGachaState(
      state && state.totalRedeems,
      state && state.usedSpins
    );

    if (safeState.totalRedeems <= 0) {
      return "Redeem kode dulu minimal 1 kali untuk mendapat 1 spin.";
    }

    if (safeState.availableSpins <= 0) {
      return "Spin kamu habis. Redeem kode lagi untuk menambah spin.";
    }

    return "Spin tersedia " + safeState.availableSpins + "x. Setiap 1 redeem = 1 spin.";
  }

  function normalizeGachaRewardList(raw, fallbackList, maxItems) {
    const hasExplicitFallback = Array.isArray(fallbackList);
    const fallback = hasExplicitFallback ? fallbackList.slice() : DEFAULT_GACHA_REWARD_VALUES.slice();
    const limit = Math.max(1, toInt(maxItems, (fallback.length || DEFAULT_GACHA_REWARD_VALUES.length)));
    let items = [];

    if (Array.isArray(raw)) {
      items = raw.slice();
    } else if (typeof raw === "string") {
      items = raw.split(/[\s,|]+/);
    }

    items = items
      .map(function (value) { return toInt(value, 0); })
      .filter(function (value) { return value > 0; });

    if (!items.length) {
      items = fallback.slice();
    }

    if (!items.length) return [];

    return items.slice(0, limit);
  }

  function buildLuckyDrawBoardValues(rewardPool, forcedReward) {
    const pool = normalizeGachaRewardList(rewardPool, DEFAULT_GACHA_REWARD_VALUES, 120);
    const fallback = normalizeGachaRewardList(DEFAULT_GACHA_REWARD_VALUES, DEFAULT_GACHA_REWARD_VALUES, GACHA_BOARD_SIZE);
    const board = pool.slice(0, GACHA_BOARD_SIZE);
    let fallbackIndex = 0;

    while (board.length < GACHA_BOARD_SIZE) {
      board.push(fallback[fallbackIndex % fallback.length] || DEFAULT_GACHA_REWARD_VALUES[0]);
      fallbackIndex += 1;
    }

    const safeForcedReward = toInt(forcedReward, 0);
    if (safeForcedReward > 0 && board.indexOf(safeForcedReward) < 0) {
      board[board.length - 1] = safeForcedReward;
    }

    return board;
  }

  async function loadLuckyDrawConfig(uid) {
    const safeUid = sanitizeFirebaseKey(uid);
    const snap = await db.ref(GACHA_CONFIG_PATH).once("value");
    const root = snap.val() || {};
    const defaults = root.defaults && typeof root.defaults === "object" ? root.defaults : {};
    const users = root.users && typeof root.users === "object" ? root.users : {};
    const userConfig = safeUid && users[safeUid] && typeof users[safeUid] === "object" ? users[safeUid] : {};
    const defaultRewards = normalizeGachaRewardList(defaults.rewards, DEFAULT_GACHA_REWARD_VALUES, 120);
    const userRewards = normalizeGachaRewardList(userConfig.rewards, defaultRewards, 120);
    const forcedQueue = normalizeGachaRewardList(userConfig.forcedQueue, [], 120);
    const boardValues = buildLuckyDrawBoardValues(userRewards, forcedQueue[0]);

    return {
      configKey: safeUid,
      defaultRewards: defaultRewards,
      rewards: userRewards,
      forcedQueue: forcedQueue,
      boardValues: boardValues,
      hasUserOverride: Boolean(
        (Array.isArray(userConfig.rewards) && userConfig.rewards.length) ||
        (Array.isArray(userConfig.forcedQueue) && userConfig.forcedQueue.length)
      )
    };
  }

  async function consumeLuckyDrawQueue(uid, expectedReward) {
    const safeUid = sanitizeFirebaseKey(uid);
    if (!safeUid) return;

    const queueRef = db.ref(GACHA_CONFIG_PATH + "/users/" + safeUid + "/forcedQueue");
    await queueRef.transaction(function (current) {
      const queue = normalizeGachaRewardList(current, [], 120);
      if (!queue.length) return current;
      if (toInt(expectedReward, 0) > 0 && queue[0] !== toInt(expectedReward, 0)) {
        return current;
      }
      const nextQueue = queue.slice(1);
      return nextQueue.length ? nextQueue : null;
    });
  }

  async function writeLuckyDrawLog(payload) {
    if (!payload || typeof payload !== "object") return;
    await db.ref(GACHA_LOGS_PATH).push({
      uid: String(payload.uid || ""),
      name: String(payload.name || ""),
      email: String(payload.email || ""),
      photoURL: String(payload.photoURL || ""),
      rewardCoin: toInt(payload.rewardCoin, 0),
      boardRewards: normalizeGachaRewardList(payload.boardRewards, DEFAULT_GACHA_REWARD_VALUES, GACHA_BOARD_SIZE),
      winningIndex: toInt(payload.winningIndex, 0),
      source: String(payload.source || "random"),
      remainingSpins: toInt(payload.remainingSpins, 0),
      totalRedeems: toInt(payload.totalRedeems, 0),
      pointsAfter: toInt(payload.pointsAfter, 0),
      spinAt: firebase.database.ServerValue.TIMESTAMP
    });
  }

  async function getLuckyDrawPreview() {
    if (!currentUser) {
      return {
        ok: false,
        boardRewards: buildLuckyDrawBoardValues(DEFAULT_GACHA_REWARD_VALUES, 0),
        state: buildGachaState(currentGachaState.totalRedeems, currentGachaState.usedSpins)
      };
    }

    try {
      const config = await loadLuckyDrawConfig(currentUser.uid);
      return {
        ok: true,
        boardRewards: config.boardValues,
        state: buildGachaState(currentGachaState.totalRedeems, currentGachaState.usedSpins)
      };
    } catch (_err) {
      return {
        ok: false,
        boardRewards: buildLuckyDrawBoardValues(DEFAULT_GACHA_REWARD_VALUES, 0),
        state: buildGachaState(currentGachaState.totalRedeems, currentGachaState.usedSpins)
      };
    }
  }

  function storeCachedUserPoints(points) {
    const safeValue = String(toInt(points, 0));

    try {
      localStorage.setItem(USER_POINTS_STORAGE_KEY, safeValue);
    } catch (_err) {}

    try {
      sessionStorage.setItem(USER_POINTS_STORAGE_KEY, safeValue);
    } catch (_err) {}

    dispatchUserPoints(safeValue);
  }

  function clearCachedUserPoints() {
    try {
      localStorage.removeItem(USER_POINTS_STORAGE_KEY);
    } catch (_err) {}

    try {
      sessionStorage.removeItem(USER_POINTS_STORAGE_KEY);
    } catch (_err) {}

    dispatchUserPoints(0);
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
    // Redeem sekarang hanya membuka tiket spin. Coin diberikan dari hasil lucky draw.
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
    base.spinGain = REDEEM_SPIN_GAIN;
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
      if (photo) photo.hidden = true;
      hideAlert("zrProfileAlert");
      return;
    }

    const displayName = user.displayName || "Pengguna Zeratto";
    const displayEmail = user.email || "Email tidak tersedia";
    const displayPhoto = user.photoURL || fallbackAvatar(displayName || displayEmail);

    hint.textContent = "Login aktif. Akun ini dipakai untuk fitur redeem dan coin.";
    if (box) box.hidden = false;
    if (pointSummary) pointSummary.hidden = false;
    if (photo) {
      photo.src = displayPhoto;
      photo.hidden = false;
      photo.alt = "Foto Google " + displayName;
    }
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
    const isSoonPage = isTukarSoonPage();

    const userBox = byId("zrTukarUserBox");
    const photo = byId("zrTukarUserPhoto");
    const name = byId("zrTukarUserName");
    const email = byId("zrTukarUserEmail");

    if (!user) {
      hint.textContent = isSoonPage
        ? "Kategori Mainan sedang kami siapkan. Form penukaran belum dibuka sementara."
        : "Login Google dulu untuk buka form penukaran.";
      if (userBox) userBox.hidden = true;
      if (isSoonPage) {
        hideAlert("zrTukarAuthAlert");
        return;
      }
      showAlert("zrTukarAuthAlert", "info", "Akses tukar hadiah dikunci sampai login Google berhasil.");
      return;
    }

    const displayName = user.displayName || "Pengguna Zeratto";
    const displayEmail = user.email || "Email tidak tersedia";
    const displayPhoto = user.photoURL || fallbackAvatar(displayName || displayEmail);

    hint.textContent = isSoonPage
      ? "Login aktif. Coin akun dan riwayat pengajuanmu tetap bisa dilihat di halaman ini."
      : "Login aktif. Isi form penukaran, lalu admin akan proses manual.";
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

    document.querySelectorAll("[data-zr-user-coin-box]").forEach((box) => {
      box.hidden = false;
    });

    document.querySelectorAll("[data-zr-user-coin]").forEach((el) => {
      el.textContent = formatRupiah(points);
    });

    document.querySelectorAll("[data-zr-user-coin-note]").forEach((el) => {
      el.textContent = currentUser
        ? "Pilih hadiah sesuai coin yang kamu punya."
        : "Login dulu supaya coin akun kamu terbaca.";
    });
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
      const walletRupiah = readExchangeWalletRupiah(item);
      const detail = item && item.detail && typeof item.detail === "object" ? item.detail : {};
      const walletType = String(detail.walletType || "").trim();
      return "" +
        "<div class=\"zr-history-item\">" +
          "<div class=\"zr-history-top\">" +
            "<strong>" + optionLabel + "</strong>" +
            "<span class=\"zr-alert " + statusClass + "\">" + statusLabel + "</span>" +
          "</div>" +
          "<div class=\"zr-history-meta\">" +
            (walletType ? "<span>Wallet: " + walletType + "</span>" : "") +
            "<span>Coin Dipakai: " + formatRupiah(item.pointUsed) + "</span>" +
            (walletRupiah ? "<span>Saldo Masuk: " + formatIdr(walletRupiah) + "</span>" : "") +
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
        storeCachedUserPoints(currentPoints);
        updateProfilePointUI(currentPoints);
      } catch (err) {
        currentPoints = 0;
        storeCachedUserPoints(currentPoints);
        updateProfilePointUI(0);
        console.error("[Zeratto Profile Point Sync Error]", err);
      }
    } else {
      currentPoints = 0;
      clearCachedUserPoints();
      clearCachedUserGachaState();
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
      showAlert("zrTukarMessage", "error", "Gagal memuat status tukar hadiah.");
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
      clearCachedUserGachaState();
      setRedeemFormEnabled(false);
      showAlert("zrRedeemMessage", "info", "Login Google dulu agar bisa melakukan redeem.");
      return buildGachaState(0, 0);
    }

    const snap = await db.ref(REDEEMS_PATH).once("value");
    const userRedeems = extractUserRedeemsFromRoot(snap.val(), user.uid);
    const gachaState = storeCachedUserGachaState(await loadUserGachaState(user.uid, userRedeems));

    setRedeemFormEnabled(true);
    if (!userRedeems.length) {
      hideAlert("zrRedeemMessage");
      return gachaState;
    }

    const latest = userRedeems[0] || {};
    const code = String(latest.code || "-");
    const redeemedAt = formatDate(latest.redeemedAt);
    showAlert(
      "zrRedeemMessage",
      "success",
      "Total klaim akun ini: " + userRedeems.length + " kode. Klaim terakhir: " + code + " | Spin tersedia: " + gachaState.availableSpins + "x | Waktu: " + redeemedAt
    );
    return gachaState;
  }

  async function spinLuckyDraw() {
    if (!currentUser) {
      return {
        ok: false,
        code: "LOGIN_REQUIRED",
        state: buildGachaState(0, 0),
        message: "Login Google dulu sebelum mulai spin."
      };
    }

    let safeState = buildGachaState(currentGachaState.totalRedeems, currentGachaState.usedSpins);

    if (safeState.availableSpins <= 0) {
      const snap = await db.ref(REDEEMS_PATH).once("value");
      const userRedeems = extractUserRedeemsFromRoot(snap.val(), currentUser.uid);
      safeState = storeCachedUserGachaState(await loadUserGachaState(currentUser.uid, userRedeems));
      if (safeState.availableSpins <= 0) {
        return {
          ok: false,
          code: safeState.totalRedeems <= 0 ? "REDEEM_REQUIRED" : "NO_SPIN_LEFT",
          state: safeState,
          message: getGachaRequirementMessage(safeState)
        };
      }
    }

    const totalRedeems = toInt(safeState.totalRedeems, 0);
    let luckyConfig = null;
    try {
      luckyConfig = await loadLuckyDrawConfig(currentUser.uid);
    } catch (_err) {
      luckyConfig = {
        boardValues: buildLuckyDrawBoardValues(DEFAULT_GACHA_REWARD_VALUES, 0),
        forcedQueue: []
      };
    }

    const forcedReward = toInt(luckyConfig && luckyConfig.forcedQueue && luckyConfig.forcedQueue[0], 0);
    const boardRewards = Array.isArray(luckyConfig && luckyConfig.boardValues) && luckyConfig.boardValues.length
      ? luckyConfig.boardValues.slice(0, GACHA_BOARD_SIZE)
      : buildLuckyDrawBoardValues(DEFAULT_GACHA_REWARD_VALUES, forcedReward);
    let winningIndex = forcedReward > 0 ? boardRewards.indexOf(forcedReward) : -1;
    if (winningIndex < 0) {
      winningIndex = Math.floor(Math.random() * boardRewards.length);
    }
    const safeRewardCoin = toInt(forcedReward > 0 ? forcedReward : boardRewards[winningIndex], 0);
    if (safeRewardCoin <= 0) {
      return {
        ok: false,
        code: "INVALID_REWARD",
        state: safeState,
        message: "Hadiah lucky draw belum siap."
      };
    }

    const userRef = db.ref(USERS_PATH + "/" + currentUser.uid);
    const spinTx = await userRef.transaction((current) => {
      const nextData = current && typeof current === "object" ? Object.assign({}, current) : {};
      const currentUsedSpins = toInt(nextData.gachaUsedSpins, 0);
      if (currentUsedSpins >= totalRedeems) return;
      nextData.gachaUsedSpins = currentUsedSpins + 1;
      nextData.points = toInt(nextData.points, 0) + safeRewardCoin;
      return nextData;
    });

    let nextState = safeState;

    if (spinTx.committed) {
      const nextUserData = spinTx.snapshot.val() || {};
      currentPoints = toInt(nextUserData.points, 0);
      storeCachedUserPoints(currentPoints);
      updateProfilePointUI(currentPoints);
      updateTukarPointUI(currentPoints);
      nextState = storeCachedUserGachaState(buildGachaState(totalRedeems, nextUserData.gachaUsedSpins));
      if (forcedReward > 0) {
        consumeLuckyDrawQueue(currentUser.uid, safeRewardCoin).catch(function (err) {
          console.error("[Zeratto Lucky Queue Error]", err);
        });
      }
      writeLuckyDrawLog({
        uid: currentUser.uid,
        name: currentUser.displayName || "Pengguna Zeratto",
        email: currentUser.email || "",
        photoURL: currentUser.photoURL || "",
        rewardCoin: safeRewardCoin,
        boardRewards: boardRewards,
        winningIndex: winningIndex,
        source: forcedReward > 0 ? "forced" : "random",
        remainingSpins: nextState.availableSpins,
        totalRedeems: nextState.totalRedeems,
        pointsAfter: currentPoints
      }).catch(function (err) {
        console.error("[Zeratto Lucky Log Error]", err);
      });
      return {
        ok: true,
        code: "OK",
        state: nextState,
        rewardCoin: safeRewardCoin,
        boardRewards: boardRewards,
        winningIndex: winningIndex,
        currentPoints: currentPoints,
        message: "Lucky draw berhasil."
      };
    }

    const latestUserSnap = await userRef.once("value");
    const latestUserData = latestUserSnap.val() || {};
    currentPoints = toInt(latestUserData.points, currentPoints);
    storeCachedUserPoints(currentPoints);
    updateProfilePointUI(currentPoints);
    updateTukarPointUI(currentPoints);
    nextState = storeCachedUserGachaState(buildGachaState(totalRedeems, latestUserData.gachaUsedSpins));
    return {
      ok: false,
      code: nextState.totalRedeems <= 0 ? "REDEEM_REQUIRED" : "NO_SPIN_LEFT",
      state: nextState,
      message: getGachaRequirementMessage(nextState)
    };
  }

  async function consumeGachaSpin(_rewardCoin) {
    return spinLuckyDraw();
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
        spinGain: toInt(row.spinGain, REDEEM_SPIN_GAIN),
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
    if (!document.querySelector(".zr-tukar-form") && !byId("zrPointSummary") && !document.querySelector("[data-zr-user-coin]")) return;

    if (!user) {
      currentPoints = 0;
      clearCachedUserPoints();
      updateTukarPointUI(0);
      setTukarFormEnabled(false);
      showAlert("zrTukarMessage", "info", "Login Google dulu agar bisa menukar hadiah.");
      renderTukarHistory([]);
      return;
    }

    try {
      currentPoints = await loadUserPoints(user.uid);
      storeCachedUserPoints(currentPoints);
      updateTukarPointUI(currentPoints);
      setTukarFormEnabled(true);
      hideAlert("zrTukarMessage");
      await loadTukarHistory(user.uid);
    } catch (err) {
      console.error("[Zeratto Sync Tukar Error]", err);
      setTukarFormEnabled(false);
      showAlert("zrTukarMessage", "error", "Gagal memuat data coin akun.");
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

      const pointGain = 0;
      const spinGain = REDEEM_SPIN_GAIN;
      const redeemRef = db.ref(REDEEMS_PATH).push();

      try {
        await redeemRef.set({
          uid: currentUser.uid,
          code: resolvedCode,
          codeOriginal: codeRaw,
          codeKey,
          pointGain,
          spinGain,
          redeemedAt: firebase.database.ServerValue.TIMESTAMP,
          name: currentUser.displayName || "Pengguna Zeratto",
          email: currentUser.email || "",
          photoURL: currentUser.photoURL || ""
        });
      } catch (saveErr) {
        await rollbackCodeLock(codeRef, currentUser.uid);
        throw saveErr;
      }

      try {
        currentPoints = await loadUserPoints(currentUser.uid);
        storeCachedUserPoints(currentPoints);
        updateProfilePointUI(currentPoints);
        updateTukarPointUI(currentPoints);
        await redeemRef.update({ pointBalanceAfter: currentPoints });
      } catch (pointsErr) {
        console.error("[Zeratto Redeem Point Snapshot Error]", pointsErr);
      }

      if (input) input.value = "";
      showAlert(
        "zrRedeemMessage",
        "success",
        "Redeem berhasil. Kamu dapat 1x spin."
      );
      const latestGachaState = await syncRedeemState(currentUser);
      
      window.dispatchEvent(new CustomEvent("redeemSuccess", {
        detail: {
          spinGain,
          pointGain,
          totalCoins: currentPoints,
          gachaState: latestGachaState
        }
      }));
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

  function collectTukarDetail(option, form, pointUsed) {
    if (option === "diamond") {
      const game = readFormValue(form, "diamondGame").trim();
      const verifiedName = form && form.dataset ? String(form.dataset.diamondVerifiedName || "").trim() : "";
      return {
        game: game,
        package: readFormValue(form, "diamondPackage").trim(),
        packageCoin: toInt(readFormValue(form, "diamondRequiredCoin"), 0),
        nickname: verifiedName || readFormValue(form, "diamondNickname").trim(),
        userId: gameRequiresDiamondId(game) ? readFormValue(form, "diamondUserId").trim() : "",
        serverId: gameRequiresDiamondServer(game) ? readFormValue(form, "diamondServerId").trim() : ""
      };
    }

    if (option === "pulsa") {
      return {
        targetNumber: readFormValue(form, "pulsaNumber").trim(),
        operator: readFormValue(form, "pulsaOperator").trim(),
        nominal: readFormValue(form, "pulsaNominal").trim(),
        packageCoin: toInt(readFormValue(form, "pulsaPackageCoin"), 0),
        customerName: readFormValue(form, "pulsaCustomerName").trim()
      };
    }

    if (option === "ewallet") {
      return {
        walletType: readFormValue(form, "walletType").trim(),
        walletNumber: readFormValue(form, "walletNumber").trim(),
        walletName: readFormValue(form, "walletName").trim(),
        walletRupiah: calculateEwalletRupiah(pointUsed)
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

  function validateTukarDetail(option, detail, pointUsed, form) {
    if (!detail || typeof detail !== "object") {
      return "Detail kategori hadiah tidak valid.";
    }

    if (option === "diamond") {
      if (!detail.game) return "Pilih game untuk kategori Diamond Game.";
      if (!detail.package) return "Paket diamond wajib diisi.";
      if (toInt(detail.packageCoin, 0) <= 0) return "Coin untuk paket diamond belum terbaca.";
      if (!detail.nickname) return "Nickname / username game wajib diisi.";
      if (gameRequiresDiamondId(detail.game) && !detail.userId) return "ID game wajib diisi untuk " + detail.game + ".";
      if (gameRequiresDiamondServer(detail.game) && !detail.serverId) return "Server wajib diisi untuk Mobile Legends.";
      if (toInt(pointUsed, 0) !== toInt(detail.packageCoin, 0)) {
        return detail.package + " membutuhkan " + toInt(detail.packageCoin, 0).toLocaleString("id-ID") + " coin.";
      }

      if (gameRequiresDiamondId(detail.game)) {
        const checkPending = form && form.dataset ? String(form.dataset.diamondCheckPending || "0") === "1" : false;
        const verified = form && form.dataset ? String(form.dataset.diamondVerified || "0") === "1" : false;
        const verifiedGame = form && form.dataset ? String(form.dataset.diamondVerifiedGame || "").trim() : "";
        const verifiedId = form && form.dataset ? String(form.dataset.diamondVerifiedId || "").trim() : "";
        const verifiedServer = form && form.dataset ? String(form.dataset.diamondVerifiedServer || "").trim() : "";
        const verifiedName = form && form.dataset ? String(form.dataset.diamondVerifiedName || "").trim() : "";

        if (checkPending) {
          return "Tunggu validasi akun game selesai.";
        }

        if (!verified || verifiedGame !== detail.game || verifiedId !== detail.userId || verifiedServer !== detail.serverId) {
          return "Cek ID game dulu untuk memvalidasi akun " + detail.game + ".";
        }

        if (!verifiedName || detail.nickname !== verifiedName) {
          return "Nickname akun belum sinkron. Cek ID game sekali lagi.";
        }
      }

      return "";
    }

    if (option === "pulsa") {
      if (!detail.targetNumber) return "Nomor tujuan pulsa wajib diisi.";
      if (!detail.operator) return "Operator pulsa wajib dipilih.";
      if (!isKnownPulsaOperator(detail.operator)) return "Operator pulsa tidak valid.";
      if (!detail.nominal) return "Nominal pulsa wajib diisi.";
      if (toInt(detail.packageCoin, 0) <= 0) return "Coin untuk nominal pulsa belum terbaca.";
      if (toInt(pointUsed, 0) !== toInt(detail.packageCoin, 0)) {
        return detail.operator + " " + detail.nominal + " membutuhkan " + toInt(detail.packageCoin, 0).toLocaleString("id-ID") + " coin.";
      }
      if (!detail.customerName) return "Nama pelanggan wajib diisi.";
      return "";
    }

    if (option === "ewallet") {
      if (!detail.walletType) return "Jenis e-wallet wajib dipilih.";
      if (!isKnownEwalletType(detail.walletType)) return "Pilihan e-wallet tidak valid.";
      if (!detail.walletNumber) return "Nomor akun e-wallet wajib diisi.";
      if (!detail.walletName) return "Nama pemilik e-wallet wajib diisi.";
      if (toInt(pointUsed, 0) < EWALLET_MIN_COIN) return "Minimal penukaran saldo e-wallet adalah " + EWALLET_MIN_COIN + " coin.";
      if (toInt(detail.walletRupiah, 0) !== calculateEwalletRupiah(pointUsed)) return "Hasil konversi rupiah belum sinkron.";
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

    if (option === "ewallet" && pointUsed < EWALLET_MIN_COIN) {
      showAlert("zrTukarMessage", "error", "Minimal penukaran saldo e-wallet adalah " + EWALLET_MIN_COIN + " coin.");
      return;
    }

    if (!whatsapp && option !== "diamond") {
      showAlert("zrTukarMessage", "error", "Nomor WhatsApp wajib diisi.");
      return;
    }

    const optionDetail = collectTukarDetail(option, form, pointUsed);
    const detailError = validateTukarDetail(option, optionDetail, pointUsed, form);
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
        showAlert("zrTukarMessage", "error", "Coin tidak cukup untuk penukaran ini.");
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
      storeCachedUserPoints(currentPoints);
      updateTukarPointUI(currentPoints);
      showAlert(
        "zrTukarMessage",
        "success",
        option === "ewallet"
          ? "Pengajuan " + optionDetail.walletType + " berhasil dikirim. " + formatRupiah(pointUsed) + " akan diproses menjadi " + formatIdr(optionDetail.walletRupiah) + "."
          : option === "diamond"
            ? "Pengajuan " + optionDetail.package + " untuk " + optionDetail.nickname + " berhasil dikirim."
            : option === "pulsa"
              ? "Pengajuan pulsa " + optionDetail.operator + " " + optionDetail.nominal + " berhasil dikirim."
            : "Pengajuan berhasil dikirim. Admin akan proses manual."
      );

      if (form) form.reset();
      setTukarOption(option);
      await loadTukarHistory(currentUser.uid);
    } catch (err) {
      console.error("[Zeratto Tukar Submit Error]", err);
      showAlert("zrTukarMessage", "error", "Gagal mengirim pengajuan tukar hadiah. Coba lagi.");
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
        spinGain: REDEEM_SPIN_GAIN,
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

  window.ZerattoAuth = Object.assign(window.ZerattoAuth || {}, {
    getLuckyDrawPreview: getLuckyDrawPreview,
    spinLuckyDraw: spinLuckyDraw,
    consumeGachaSpin: consumeGachaSpin,
    getCachedGachaState: function () {
      return buildGachaState(currentGachaState.totalRedeems, currentGachaState.usedSpins);
    }
  });

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
      showAlert("zrTukarMessage", "info", "Kamu sudah logout. Login lagi untuk tukar hadiah.");
      window.dispatchEvent(new CustomEvent("userLoggedOut"));
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
