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

  const APP_NAME = "zerattoAdminApp";
  const STATIC_LOGIN_API_CANDIDATES = [
    "/api/admin-login.php",
    "../../api/admin-login.php",
    "http://127.0.0.1:8000/api/admin-login.php",
    "http://localhost:8000/api/admin-login.php",
    "http://localhost/api/admin-login.php",
    "https://marendal.com/api/admin-login.php",
    "https://www.marendal.com/api/admin-login.php"
  ];
  const SESSION_LOGIN = "zerattoAdminLoggedIn";
  const SESSION_TOKEN = "zerattoAdminToken";

  const PATH_USERS = "zerattoUsers";
  const PATH_REDEEMS = "zerattoRedeems";
  const PATH_CODES = "zerattoRedeemCodes";
  const PATH_EXCHANGE = "zerattoExchangeRequests";
  const PATH_EXCHANGE_BY_USER = "zerattoExchangeByUser";
  const PATH_CODE_REPORTS = "zerattoCodeReports";
  const PAGE_NAMES = ["dashboard", "exchange", "users", "codes", "redeems"];
  const REDEEM_VALUE_RP = 10;
  const AUTO_GENERATE_CODE_TOTAL = 2000;
  const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let adminDb = null;
  let loading = false;
  let toastTimer = null;

  const state = {
    usersMap: {},
    codesMap: {},
    exchangesMap: {},
    redeemsMap: {},
    exchangeFilter: "pending",
    exchangeSearch: "",
    userSearch: "",
    codeFilter: "all",
    codeSearch: "",
    redeemSearch: "",
    recapDate: "",
    currentPage: "dashboard"
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function entriesSafe(obj) {
    return obj && typeof obj === "object" ? Object.entries(obj) : [];
  }

  function toInt(value, fallback) {
    const num = Number(value);
    if (!Number.isFinite(num)) return Number.isFinite(fallback) ? fallback : 0;
    return Math.max(0, Math.trunc(num));
  }

  function parseTimestamp(value) {
    if (value instanceof Date) {
      const ts = value.getTime();
      return Number.isFinite(ts) ? ts : 0;
    }
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Date.parse(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  }

  function formatDateTime(value) {
    const ts = parseTimestamp(value);
    if (!ts) return "-";
    return new Date(ts).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function formatDateOnly(value) {
    const ts = parseTimestamp(value);
    if (!ts) return "-";
    return new Date(ts).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  }

  function toYmd(value) {
    const ts = parseTimestamp(value);
    if (!ts) return "";
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function formatRupiah(value) {
    return "Rp " + toInt(value, 0).toLocaleString("id-ID");
  }

  function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = String(value === null || typeof value === "undefined" ? "" : value);
    return div.innerHTML;
  }

  function normalizeCode(raw) {
    return String(raw || "").trim().toUpperCase().replace(/\s+/g, "");
  }

  function codeKey(code) {
    return normalizeCode(code).replace(/[.#$/[\]]/g, "_");
  }

  function randomCode(length) {
    let out = "";
    const safeLen = Math.max(4, toInt(length, 8));
    for (let i = 0; i < safeLen; i += 1) {
      out += CODE_ALPHABET.charAt(Math.floor(Math.random() * CODE_ALPHABET.length));
    }
    return out;
  }

  function generateCodeCandidate() {
    // Format 8 karakter agar lolos validasi regex import saat ini.
    return "ZR" + randomCode(6);
  }

  function setLoginState(loggedIn) {
    const loginWrap = byId("zaLoginWrap");
    const app = byId("zaApp");
    if (loginWrap) loginWrap.hidden = loggedIn;
    if (app) app.hidden = !loggedIn;
  }

  function isLoginPage() {
    return Boolean(byId("zaLoginForm"));
  }

  function isPanelPage() {
    return Boolean(byId("zaApp")) && !isLoginPage();
  }

  function goToPanel(page) {
    const targetPage = normalizePageName(page || "dashboard");
    window.location.replace("./panel/?page=" + encodeURIComponent(targetPage));
  }

  function goToLogin() {
    window.location.replace("../");
  }

  function showToast(message, type) {
    const el = byId("zaToast");
    if (!el) return;
    el.className = "za-toast";
    if (type) el.classList.add(type);
    el.textContent = message;
    el.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.hidden = true;
    }, 3200);
  }

  function normalizePageName(rawPage) {
    const page = String(rawPage || "").trim().toLowerCase();
    return PAGE_NAMES.indexOf(page) >= 0 ? page : "dashboard";
  }

  function getPageFromUrl() {
    try {
      const params = new URLSearchParams(window.location.search || "");
      const page = params.get("page");
      return normalizePageName(page);
    } catch (_err) {
      return "dashboard";
    }
  }

  function setPage(page, syncUrl) {
    const nextPage = normalizePageName(page);
    state.currentPage = nextPage;

    document.querySelectorAll("[data-page-nav]").forEach(function (btn) {
      btn.classList.toggle("active", String(btn.getAttribute("data-page-nav") || "") === nextPage);
    });
    document.querySelectorAll(".za-page").forEach(function (panel) {
      panel.classList.toggle("active", String(panel.getAttribute("data-page") || "") === nextPage);
    });

    if (syncUrl) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("page", nextPage);
        window.history.replaceState({}, "", url.toString());
      } catch (_err) {
        // ignore URL update failure
      }
    }
  }

  function getLoginApiCandidates() {
    const fromCurrentOrigin = [];
    try {
      const origin = window.location.origin || "";
      if (origin) {
        fromCurrentOrigin.push(origin + "/api/admin-login.php");
      }
    } catch (_err) {
      // ignore
    }

    return Array.from(new Set(fromCurrentOrigin.concat(STATIC_LOGIN_API_CANDIDATES)));
  }

  async function attemptLoginWithEndpoint(url, username, password) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username, password: password, panel: "zeratto" })
      });

      const rawText = await response.text();
      let data = null;
      try {
        data = JSON.parse(rawText);
      } catch (_err) {
        data = null;
      }

      return {
        endpoint: url,
        ok: response.ok,
        status: response.status,
        data: data,
        rawText: rawText
      };
    } catch (err) {
      return {
        endpoint: url,
        ok: false,
        status: 0,
        data: null,
        rawText: "",
        error: err
      };
    }
  }

  async function loginViaCandidates(username, password) {
    let firstAuthFailure = null;
    let firstServerMessage = null;

    const candidates = getLoginApiCandidates();
    for (let i = 0; i < candidates.length; i += 1) {
      const endpoint = candidates[i];
      const result = await attemptLoginWithEndpoint(endpoint, username, password);

      if (result.data && result.data.success) {
        return { success: true, endpoint: endpoint, data: result.data };
      }

      if (result.data && typeof result.data.message === "string" && result.data.message.trim()) {
        if (!firstServerMessage) firstServerMessage = result.data.message.trim();
      }

      if (result.status === 401) {
        firstAuthFailure = result;
      }
    }

    if (firstAuthFailure) {
      return {
        success: false,
        reason: "auth",
        message: firstServerMessage || "Username atau password salah."
      };
    }

    return {
      success: false,
      reason: "endpoint",
      message: firstServerMessage || "Endpoint login admin tidak ditemukan. Jika buka dari Live Server (127.0.0.1:5500), jalankan juga server PHP."
    };
  }

  function statusBadge(status) {
    const normalized = String(status || "pending").toLowerCase();
    const label = {
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",
      active: "Aktif",
      inactive: "Nonaktif",
      used: "Used"
    }[normalized] || normalized;
    return "<span class=\"za-badge " + escapeHtml(normalized) + "\">" + escapeHtml(label) + "</span>";
  }

  function usersData() {
    return entriesSafe(state.usersMap).map(function (entry) {
      const uid = entry[0];
      const row = entry[1] && typeof entry[1] === "object" ? entry[1] : {};
      return {
        uid: uid,
        name: String(row.name || "Tanpa Nama"),
        email: String(row.email || "-"),
        points: toInt(row.points, 0),
        lastLoginAt: parseTimestamp(row.lastLoginAt || row.createdAt || row.updatedAt)
      };
    }).sort(function (a, b) {
      return b.lastLoginAt - a.lastLoginAt;
    });
  }

  function codesData() {
    return entriesSafe(state.codesMap).map(function (entry) {
      const key = entry[0];
      const row = entry[1] && typeof entry[1] === "object" ? entry[1] : {};
      const active = !(row.active === false || row.enabled === false);
      const usedBy = String(row.usedBy || "");
      const distributed = row.distributed === false ? false : true;
      const distributedAt = parseTimestamp(row.distributedAt || row.createdAt || row.updatedAt);
      return {
        key: key,
        code: String(row.code || key),
        pointValue: REDEEM_VALUE_RP,
        active: active,
        distributed: distributed,
        distributedAt: distributedAt,
        usedBy: usedBy,
        usedByName: String(row.usedByName || ""),
        usedByEmail: String(row.usedByEmail || ""),
        usedAt: parseTimestamp(row.usedAt),
        status: usedBy ? "used" : (active ? "active" : "inactive"),
        createdAt: parseTimestamp(row.createdAt)
      };
    }).sort(function (a, b) {
      return a.code.localeCompare(b.code);
    });
  }

  function exchangesData() {
    return entriesSafe(state.exchangesMap).map(function (entry) {
      const requestId = entry[0];
      const row = entry[1] && typeof entry[1] === "object" ? entry[1] : {};
      return {
        requestId: requestId,
        uid: String(row.uid || ""),
        name: String(row.name || "-"),
        email: String(row.email || "-"),
        optionLabel: String(row.optionLabel || row.option || "-"),
        pointUsed: toInt(row.pointUsed, 0),
        whatsapp: String(row.whatsapp || "-"),
        note: String(row.note || ""),
        detail: row.detail && typeof row.detail === "object" ? row.detail : {},
        status: String(row.status || "pending"),
        createdAt: parseTimestamp(row.createdAt),
        updatedAt: parseTimestamp(row.updatedAt)
      };
    }).sort(function (a, b) {
      return b.createdAt - a.createdAt;
    });
  }

  function redeemsData() {
    const rows = [];

    function pushRedeemRow(row, fallbackUid, redeemId) {
      if (!row || typeof row !== "object") return;
      const uid = String(row.uid || fallbackUid || "");
      rows.push({
        redeemId: String(redeemId || row.codeKey || "-"),
        uid: uid,
        name: String(row.name || "-"),
        email: String(row.email || "-"),
        code: String(row.code || row.codeKey || "-"),
        pointGain: toInt(row.pointGain, 0),
        pointBalanceAfter: toInt(row.pointBalanceAfter, 0),
        redeemedAt: parseTimestamp(row.redeemedAt)
      });
    }

    entriesSafe(state.redeemsMap).forEach(function (entry) {
      const rootKey = entry[0];
      const rootRow = entry[1];
      if (!rootRow || typeof rootRow !== "object") return;

      const isDirectRedeemRow =
        Object.prototype.hasOwnProperty.call(rootRow, "code") ||
        Object.prototype.hasOwnProperty.call(rootRow, "pointGain") ||
        Object.prototype.hasOwnProperty.call(rootRow, "redeemedAt");

      if (isDirectRedeemRow) {
        pushRedeemRow(rootRow, rootKey, rootKey);
        return;
      }

      entriesSafe(rootRow).forEach(function (childEntry) {
        const childKey = childEntry[0];
        const childRow = childEntry[1];
        if (!childRow || typeof childRow !== "object") return;
        const isChildRedeemRow =
          Object.prototype.hasOwnProperty.call(childRow, "code") ||
          Object.prototype.hasOwnProperty.call(childRow, "pointGain") ||
          Object.prototype.hasOwnProperty.call(childRow, "redeemedAt");
        if (!isChildRedeemRow) return;

        pushRedeemRow(childRow, rootKey, rootKey + ":" + childKey);
      });
    });

    return rows.sort(function (a, b) {
      return b.redeemedAt - a.redeemedAt;
    });
  }

  function renderStats() {
    const users = usersData();
    const codes = codesData();
    const exchanges = exchangesData();

    const totalPoints = users.reduce(function (sum, row) {
      return sum + row.points;
    }, 0);
    const activeCodes = codes.filter(function (row) { return row.status === "active"; }).length;
    const usedCodes = codes.filter(function (row) { return row.status === "used"; }).length;
    const pendingCount = exchanges.filter(function (row) { return row.status === "pending"; }).length;
    const approvedCount = exchanges.filter(function (row) { return row.status === "approved"; }).length;
    const rejectedCount = exchanges.filter(function (row) { return row.status === "rejected"; }).length;

    byId("zaStatUsers").textContent = String(users.length);
    byId("zaStatPoints").textContent = formatRupiah(totalPoints);
    byId("zaStatCodes").textContent = String(codes.length);
    byId("zaStatCodesMeta").textContent = "Aktif " + activeCodes + " | Used " + usedCodes;
    byId("zaStatExchange").textContent = String(exchanges.length);
    byId("zaStatExchangeMeta").textContent = "Pending " + pendingCount + " | Approved " + approvedCount + " | Rejected " + rejectedCount;
  }

  function renderDetailObject(detail) {
    const rows = entriesSafe(detail);
    if (!rows.length) {
      return "<div class=\"za-detail-row\"><span>Detail</span><span>-</span></div>";
    }
    return rows.map(function (entry) {
      const key = entry[0];
      let val = entry[1];
      if (val && typeof val === "object") {
        try { val = JSON.stringify(val); } catch (_err) { val = "[object]"; }
      }
      return "<div class=\"za-detail-row\"><span>" + escapeHtml(key) + "</span><span>" + escapeHtml(String(val || "-")) + "</span></div>";
    }).join("");
  }

  function renderExchanges() {
    const container = byId("zaExchangeList");
    if (!container) return;

    let rows = exchangesData();
    const search = state.exchangeSearch.toLowerCase();

    if (state.exchangeFilter !== "all") {
      rows = rows.filter(function (row) { return row.status === state.exchangeFilter; });
    }
    if (search) {
      rows = rows.filter(function (row) {
        return (
          row.requestId.toLowerCase().includes(search) ||
          row.name.toLowerCase().includes(search) ||
          row.email.toLowerCase().includes(search) ||
          row.uid.toLowerCase().includes(search) ||
          row.whatsapp.toLowerCase().includes(search) ||
          row.optionLabel.toLowerCase().includes(search)
        );
      });
    }

    if (!rows.length) {
      container.innerHTML = "<div class=\"za-empty\">Belum ada data request penukaran.</div>";
      return;
    }

    container.innerHTML = rows.map(function (row) {
      return [
        "<article class=\"za-item\">",
        "<div class=\"za-item-top\">",
        "<div class=\"za-item-title\"><strong>", escapeHtml(row.optionLabel), " | ", escapeHtml(row.requestId), "</strong><span>", escapeHtml(row.name), " (", escapeHtml(row.email), ")</span></div>",
        statusBadge(row.status),
        "</div>",
        "<div class=\"za-item-grid\">",
        "<div class=\"za-meta\"><label>UID</label><span>", escapeHtml(row.uid || "-"), "</span></div>",
        "<div class=\"za-meta\"><label>WhatsApp</label><span>", escapeHtml(row.whatsapp), "</span></div>",
        "<div class=\"za-meta\"><label>Dibuat</label><span>", escapeHtml(formatDateTime(row.createdAt)), "</span></div>",
        "<div class=\"za-meta\"><label>Nominal</label><span>", escapeHtml(formatRupiah(row.pointUsed)), "</span></div>",
        "<div class=\"za-meta\"><label>Update</label><span>", escapeHtml(formatDateTime(row.updatedAt)), "</span></div>",
        "</div>",
        "<div class=\"za-detail\">", renderDetailObject(row.detail), "</div>",
        row.note ? "<div class=\"za-detail\"><div class=\"za-detail-row\"><span>Catatan</span><span>" + escapeHtml(row.note) + "</span></div></div>" : "",
        "<div class=\"za-item-actions\">",
        "<button type=\"button\" data-exchange-action=\"pending\" data-request-id=\"", escapeHtml(row.requestId), "\" data-uid=\"", escapeHtml(row.uid), "\" class=\"", row.status === "pending" ? "active" : "", "\">Set Pending</button>",
        "<button type=\"button\" data-exchange-action=\"approved\" data-request-id=\"", escapeHtml(row.requestId), "\" data-uid=\"", escapeHtml(row.uid), "\" class=\"", row.status === "approved" ? "active" : "", "\">Set Approved</button>",
        "<button type=\"button\" data-exchange-action=\"rejected\" data-request-id=\"", escapeHtml(row.requestId), "\" data-uid=\"", escapeHtml(row.uid), "\" class=\"danger ", row.status === "rejected" ? "active" : "", "\">Set Rejected</button>",
        "</div>",
        "</article>"
      ].join("");
    }).join("");
  }

  function renderUsers() {
    const container = byId("zaUsersList");
    if (!container) return;

    let rows = usersData();
    const search = state.userSearch.toLowerCase();
    if (search) {
      rows = rows.filter(function (row) {
        return row.uid.toLowerCase().includes(search) || row.name.toLowerCase().includes(search) || row.email.toLowerCase().includes(search);
      });
    }

    if (!rows.length) {
      container.innerHTML = "<div class=\"za-empty\">Tidak ada user yang cocok.</div>";
      return;
    }

    container.innerHTML = rows.map(function (row) {
      return [
        "<article class=\"za-item\">",
        "<div class=\"za-item-top\">",
        "<div class=\"za-item-title\"><strong>", escapeHtml(row.name), "</strong><span>", escapeHtml(row.email), "</span></div>",
        "<div class=\"za-badge active\">Saldo ", escapeHtml(formatRupiah(row.points)), "</div>",
        "</div>",
        "<div class=\"za-item-grid\">",
        "<div class=\"za-meta\"><label>UID</label><span>", escapeHtml(row.uid), "</span></div>",
        "<div class=\"za-meta\"><label>Last Login</label><span>", escapeHtml(formatDateTime(row.lastLoginAt)), "</span></div>",
        "<div class=\"za-meta\"><label>Saldo Saat Ini</label><span>", escapeHtml(formatRupiah(row.points)), "</span></div>",
        "</div>",
        "<div class=\"za-user-points\">",
        "<input type=\"number\" min=\"0\" step=\"1\" value=\"100\" class=\"za-point-input\" title=\"Jumlah saldo (Rp)\">",
        "<button type=\"button\" data-user-action=\"add\" data-uid=\"", escapeHtml(row.uid), "\">+ Saldo</button>",
        "<button type=\"button\" data-user-action=\"sub\" data-uid=\"", escapeHtml(row.uid), "\" class=\"danger\">- Saldo</button>",
        "<button type=\"button\" data-user-action=\"set\" data-uid=\"", escapeHtml(row.uid), "\" class=\"neutral\">Set Saldo</button>",
        "</div>",
        "</article>"
      ].join("");
    }).join("");
  }

  function renderCodes() {
    const container = byId("zaCodesList");
    if (!container) return;

    let rows = codesData();
    const search = state.codeSearch.toLowerCase();

    if (state.codeFilter !== "all") {
      rows = rows.filter(function (row) { return row.status === state.codeFilter; });
    }
    if (search) {
      rows = rows.filter(function (row) {
        return (
          row.code.toLowerCase().includes(search) ||
          row.usedBy.toLowerCase().includes(search) ||
          row.usedByName.toLowerCase().includes(search) ||
          row.usedByEmail.toLowerCase().includes(search)
        );
      });
    }

    if (!rows.length) {
      container.innerHTML = "<div class=\"za-empty\">Tidak ada kode yang cocok.</div>";
      return;
    }

    const limitedRows = rows.slice(0, 350);
    const extraInfo = rows.length > limitedRows.length
      ? "<div class=\"za-empty\">Menampilkan " + limitedRows.length + " dari " + rows.length + " kode. Gunakan pencarian untuk mempersempit.</div>"
      : "";

    container.innerHTML = limitedRows.map(function (row) {
      const usedInfo = row.usedBy ? (row.usedByName || row.usedByEmail || row.usedBy) : "-";
      return [
        "<article class=\"za-item\">",
        "<div class=\"za-item-top\">",
        "<div class=\"za-item-title\"><strong>", escapeHtml(row.code), "</strong><span>Nominal ", escapeHtml(formatRupiah(row.pointValue)), " | Key ", escapeHtml(row.key), "</span></div>",
        statusBadge(row.status),
        "</div>",
        "<div class=\"za-item-grid\">",
        "<div class=\"za-meta\"><label>Dibuat</label><span>", escapeHtml(formatDateTime(row.createdAt)), "</span></div>",
        "<div class=\"za-meta\"><label>Dipakai Oleh</label><span>", escapeHtml(usedInfo), "</span></div>",
        "<div class=\"za-meta\"><label>UID</label><span>", escapeHtml(row.usedBy || "-"), "</span></div>",
        "</div>",
        "<div class=\"za-item-actions\">",
        row.status !== "used"
          ? "<button type=\"button\" data-code-action=\"toggle\" data-code-key=\"" + escapeHtml(row.key) + "\">" + (row.active ? "Nonaktifkan" : "Aktifkan") + "</button>"
          : "<button type=\"button\" disabled>Dipakai</button>",
        row.status !== "used"
          ? "<button type=\"button\" data-code-action=\"delete\" data-code-key=\"" + escapeHtml(row.key) + "\" class=\"danger\">Hapus</button>"
          : "",
        "</div>",
        "</article>"
      ].join("");
    }).join("") + extraInfo;
  }

  function getRecapDateValue() {
    const input = byId("zaRecapDate");
    return input ? String(input.value || "").trim() : "";
  }

  function ymdToLocalDate(ymd) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd || ""));
    if (!match) return null;
    return new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      0, 0, 0, 0
    );
  }

  function buildCodeRecapRows(dateFilterYmd) {
    const rows = codesData().map(function (row) {
      const issuedAt = parseTimestamp(row.distributedAt || row.createdAt || row.usedAt);
      const issuedYmd = toYmd(issuedAt);
      const statusIn = row.distributed !== false;
      const statusOut = Boolean(String(row.usedBy || "").trim());
      return {
        code: normalizeCode(row.code || row.key),
        statusIn: statusIn,
        statusOut: statusOut,
        issuedAt: issuedAt,
        issuedYmd: issuedYmd
      };
    }).filter(function (row) {
      if (!row.code) return false;
      if (!dateFilterYmd) return true;
      return row.issuedYmd === dateFilterYmd;
    });

    return rows.sort(function (a, b) {
      return a.code.localeCompare(b.code);
    });
  }

  function csvCell(value) {
    const safe = String(value === null || typeof value === "undefined" ? "" : value);
    if (!/[",\r\n]/.test(safe)) return safe;
    return "\"" + safe.replace(/"/g, "\"\"") + "\"";
  }

  function downloadCsv(filename, rows) {
    const body = rows.map(function (cols) {
      return cols.map(csvCell).join(",");
    }).join("\r\n");
    const csv = "\uFEFF" + body;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function saveWeeklyReportLog(payload) {
    if (!adminDb) return;
    await adminDb.ref(PATH_CODE_REPORTS).push(payload);
  }

  function renderCodeRecap() {
    const tbody = byId("zaCodeRecapBody");
    const emptyEl = byId("zaCodeRecapEmpty");
    const limitHintEl = byId("zaCodeRecapLimitHint");
    const dateLabelEl = byId("zaRecapDateLabel");
    const totalCodesEl = byId("zaRecapTotalCodes");
    const totalInEl = byId("zaRecapTotalIn");
    const totalOutEl = byId("zaRecapTotalOut");
    const sundayReminderEl = byId("zaSundayReminder");
    if (!tbody || !emptyEl || !dateLabelEl || !totalCodesEl || !totalInEl || !totalOutEl) return;

    const filterYmd = state.recapDate || "";
    const rows = buildCodeRecapRows(filterYmd);
    const totalIn = rows.filter(function (row) { return row.statusIn; }).length;
    const totalOut = rows.filter(function (row) { return row.statusOut; }).length;

    dateLabelEl.textContent = filterYmd ? formatDateOnly(ymdToLocalDate(filterYmd)) : "Semua Tanggal";
    totalCodesEl.textContent = String(rows.length);
    totalInEl.textContent = String(totalIn);
    totalOutEl.textContent = String(totalOut);

    if (sundayReminderEl) {
      const isSunday = new Date().getDay() === 0;
      sundayReminderEl.textContent = isSunday
        ? "Hari ini Minggu: waktunya kirim rekap ke admin."
        : "Reminder admin: kirim rekap ini ke admin setiap hari Minggu.";
    }

    const MAX_RENDER = 2000;
    const renderRows = rows.slice(0, MAX_RENDER);
    if (!renderRows.length) {
      tbody.innerHTML = "";
      emptyEl.hidden = false;
      if (limitHintEl) limitHintEl.hidden = true;
      return;
    }

    emptyEl.hidden = true;
    tbody.innerHTML = renderRows.map(function (row) {
      return [
        "<tr>",
        "<td>", escapeHtml(row.code), "</td>",
        "<td>", row.statusIn ? "☑" : "-", "</td>",
        "<td>", row.statusOut ? "✅" : "-", "</td>",
        "</tr>"
      ].join("");
    }).join("");

    if (limitHintEl) {
      if (rows.length > renderRows.length) {
        limitHintEl.hidden = false;
        limitHintEl.textContent = "Menampilkan " + renderRows.length + " dari " + rows.length + " baris. Export tetap memuat semua baris.";
      } else {
        limitHintEl.hidden = true;
      }
    }
  }

  function exportStatusInCsv() {
    const rows = buildCodeRecapRows(state.recapDate);
    if (!rows.length) {
      showToast("Tidak ada data untuk diexport.", "error");
      return;
    }
    const table = [["Kode Redeem", "Status In"]];
    rows.forEach(function (row) {
      table.push([row.code, row.statusIn ? "☑" : ""]);
    });
    const tag = state.recapDate || "semua-tanggal";
    downloadCsv("zeratto-status-in-" + tag + ".csv", table);
    showToast("File Status In berhasil dibuat.", "success");
  }

  function exportStatusInOutCsv() {
    const rows = buildCodeRecapRows(state.recapDate);
    if (!rows.length) {
      showToast("Tidak ada data untuk diexport.", "error");
      return;
    }
    const table = [["Kode Redeem", "Status In", "Status Out"]];
    rows.forEach(function (row) {
      table.push([row.code, row.statusIn ? "☑" : "", row.statusOut ? "✅" : ""]);
    });
    const tag = state.recapDate || "semua-tanggal";
    downloadCsv("zeratto-status-in-out-" + tag + ".csv", table);
    showToast("File rekap In/Out berhasil dibuat.", "success");
  }

  async function exportWeeklyCsv() {
    const anchorDate = ymdToLocalDate(state.recapDate) || new Date();
    anchorDate.setHours(0, 0, 0, 0);

    const day = anchorDate.getDay();
    const diffToMonday = (day + 6) % 7;
    const start = new Date(anchorDate);
    start.setDate(anchorDate.getDate() - diffToMonday);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const allRows = buildCodeRecapRows("");
    const inRangeRows = allRows.filter(function (row) {
      const ts = parseTimestamp(row.issuedAt);
      return ts >= start.getTime() && ts <= end.getTime() + 86399999;
    });

    if (!inRangeRows.length) {
      showToast("Tidak ada data minggu ini untuk diexport.", "error");
      return;
    }

    const weeklySummary = [];
    const dailyStats = [];
    for (let i = 0; i < 7; i += 1) {
      const dayDate = new Date(start);
      dayDate.setDate(start.getDate() + i);
      const dayYmd = toYmd(dayDate);
      const dayRows = inRangeRows.filter(function (row) { return row.issuedYmd === dayYmd; });
      const totalCodes = dayRows.length;
      const totalIn = dayRows.filter(function (row) { return row.statusIn; }).length;
      const totalOut = dayRows.filter(function (row) { return row.statusOut; }).length;
      weeklySummary.push([formatDateOnly(dayDate), String(totalCodes), String(totalIn), String(totalOut)]);
      dailyStats.push({ dateYmd: dayYmd, totalCodes: totalCodes, totalIn: totalIn, totalOut: totalOut });
    }

    const totalCodesWeek = inRangeRows.length;
    const totalInWeek = inRangeRows.filter(function (row) { return row.statusIn; }).length;
    const totalOutWeek = inRangeRows.filter(function (row) { return row.statusOut; }).length;

    const csvRows = [
      ["Laporan Mingguan Kode Redeem Zeratto"],
      ["Periode", formatDateOnly(start) + " - " + formatDateOnly(end)],
      ["Dibuat", formatDateTime(Date.now())],
      [],
      ["Tanggal/Bulan/Tahun Terbit", "Kode Redeem (total)", "Status In (total)", "Status Out (total)"]
    ].concat(weeklySummary).concat([
      [],
      ["Kode Redeem", "Status In", "Status Out", "Tanggal Terbit"]
    ]);

    inRangeRows.forEach(function (row) {
      csvRows.push([
        row.code,
        row.statusIn ? "☑" : "",
        row.statusOut ? "✅" : "",
        row.issuedAt ? formatDateOnly(row.issuedAt) : "-"
      ]);
    });

    const periodTag = toYmd(start) + "_sampai_" + toYmd(end);
    downloadCsv("zeratto-rekap-mingguan-" + periodTag + ".csv", csvRows);

    saveWeeklyReportLog({
      createdAt: Date.now(),
      periodStart: start.getTime(),
      periodEnd: end.getTime(),
      totalCodes: totalCodesWeek,
      totalIn: totalInWeek,
      totalOut: totalOutWeek,
      dailyStats: dailyStats
    }).catch(function (err) {
      console.error("[Zeratto Weekly Report Log Error]", err);
    });

    showToast("File rekap mingguan berhasil dibuat.", "success");
  }

  function renderRedeems() {
    const container = byId("zaRedeemHistory");
    if (!container) return;

    let rows = redeemsData();
    const search = state.redeemSearch.toLowerCase();
    if (search) {
      rows = rows.filter(function (row) {
        return row.redeemId.toLowerCase().includes(search) || row.uid.toLowerCase().includes(search) || row.code.toLowerCase().includes(search) || row.name.toLowerCase().includes(search) || row.email.toLowerCase().includes(search);
      });
    }

    if (!rows.length) {
      container.innerHTML = "<div class=\"za-empty\">Belum ada riwayat redeem.</div>";
      return;
    }

    container.innerHTML = rows.map(function (row) {
      return [
        "<article class=\"za-item\">",
        "<div class=\"za-item-top\">",
        "<div class=\"za-item-title\"><strong>", escapeHtml(row.code), "</strong><span>", escapeHtml(row.name), " (", escapeHtml(row.email), ")</span></div>",
        "<div class=\"za-badge used\">+", escapeHtml(formatRupiah(row.pointGain)), "</div>",
        "</div>",
        "<div class=\"za-item-grid\">",
        "<div class=\"za-meta\"><label>ID Redeem</label><span>", escapeHtml(row.redeemId), "</span></div>",
        "<div class=\"za-meta\"><label>UID</label><span>", escapeHtml(row.uid), "</span></div>",
        "<div class=\"za-meta\"><label>Waktu Redeem</label><span>", escapeHtml(formatDateTime(row.redeemedAt)), "</span></div>",
        "<div class=\"za-meta\"><label>Saldo Setelah Redeem</label><span>", escapeHtml(formatRupiah(row.pointBalanceAfter)), "</span></div>",
        "</div>",
        "</article>"
      ].join("");
    }).join("");
  }

  function renderAll() {
    renderStats();
    renderExchanges();
    renderUsers();
    renderCodes();
    renderCodeRecap();
    renderRedeems();
  }

  function setToolbarLoading(disabled) {
    const refreshBtn = byId("zaRefreshBtn");
    const importBtn = byId("zaImportCodesBtn");
    const generateBtn = byId("zaGenerate2000Btn");
    const recapApplyBtn = byId("zaRecapApplyBtn");
    const exportInBtn = byId("zaExportInBtn");
    const exportFullBtn = byId("zaExportFullBtn");
    const exportWeeklyBtn = byId("zaExportWeeklyBtn");
    if (refreshBtn) refreshBtn.disabled = disabled;
    if (importBtn) importBtn.disabled = disabled;
    if (generateBtn) generateBtn.disabled = disabled;
    if (recapApplyBtn) recapApplyBtn.disabled = disabled;
    if (exportInBtn) exportInBtn.disabled = disabled;
    if (exportFullBtn) exportFullBtn.disabled = disabled;
    if (exportWeeklyBtn) exportWeeklyBtn.disabled = disabled;
  }

  async function loadAllData() {
    if (loading) return;
    loading = true;
    setToolbarLoading(true);
    try {
      const snaps = await Promise.all([
        adminDb.ref(PATH_USERS).once("value"),
        adminDb.ref(PATH_CODES).once("value"),
        adminDb.ref(PATH_EXCHANGE).once("value"),
        adminDb.ref(PATH_REDEEMS).once("value")
      ]);
      state.usersMap = snaps[0].val() || {};
      state.codesMap = snaps[1].val() || {};
      state.exchangesMap = snaps[2].val() || {};
      state.redeemsMap = snaps[3].val() || {};
      renderAll();
      showToast("Data admin Zeratto berhasil dimuat.", "success");
    } catch (err) {
      console.error("[Zeratto Admin Load Error]", err);
      showToast("Gagal memuat data Firebase.", "error");
    } finally {
      loading = false;
      setToolbarLoading(false);
    }
  }

  async function setExchangeStatus(requestId, uid, status) {
    const row = state.exchangesMap[requestId] || {};
    const targetUid = uid || row.uid || "";
    const updates = {};
    const updatedAt = Date.now();
    updates[PATH_EXCHANGE + "/" + requestId + "/status"] = status;
    updates[PATH_EXCHANGE + "/" + requestId + "/updatedAt"] = updatedAt;
    if (targetUid) {
      updates[PATH_EXCHANGE_BY_USER + "/" + targetUid + "/" + requestId + "/status"] = status;
      updates[PATH_EXCHANGE_BY_USER + "/" + targetUid + "/" + requestId + "/updatedAt"] = updatedAt;
    }
    await adminDb.ref().update(updates);
    if (!state.exchangesMap[requestId] || typeof state.exchangesMap[requestId] !== "object") {
      state.exchangesMap[requestId] = {};
    }
    state.exchangesMap[requestId].status = status;
    state.exchangesMap[requestId].updatedAt = updatedAt;
  }

  async function updateUserPoints(uid, action, amount) {
    const ref = adminDb.ref(PATH_USERS + "/" + uid + "/points");
    let nextPoints = 0;
    if (action === "set") {
      nextPoints = Math.max(0, amount);
      await ref.set(nextPoints);
    } else {
      const tx = await ref.transaction(function (current) {
        const curr = toInt(current, 0);
        if (action === "add") return curr + amount;
        if (action === "sub") return Math.max(0, curr - amount);
        return curr;
      });
      if (!tx.committed) throw new Error("POINT_TX_NOT_COMMITTED");
      nextPoints = toInt(tx.snapshot.val(), 0);
    }
    await adminDb.ref(PATH_USERS + "/" + uid + "/lastPointUpdateAt").set(Date.now());
    if (!state.usersMap[uid] || typeof state.usersMap[uid] !== "object") state.usersMap[uid] = {};
    state.usersMap[uid].points = nextPoints;
    return nextPoints;
  }

  async function importCodes() {
    const raw = String(byId("zaCodeTextarea").value || "");
    const pointValue = REDEEM_VALUE_RP;
    const matches = raw.match(/\b[A-Za-z0-9]{8}\b/g) || [];
    const normalized = Array.from(new Set(matches.map(function (x) { return normalizeCode(x); })));
    if (!normalized.length) {
      showToast("Tidak ada kode valid 8 karakter.", "error");
      return;
    }
    const updates = {};
    let skipped = 0;
    const now = Date.now();
    normalized.forEach(function (code) {
      const key = codeKey(code);
      if (state.codesMap[key]) {
        skipped += 1;
        return;
      }
      updates[key] = {
        code: code,
        active: true,
        pointValue: pointValue,
        status: "new",
        createdAt: now,
        distributed: true,
        distributedAt: now
      };
    });
    const count = Object.keys(updates).length;
    if (!count) {
      showToast("Semua kode sudah ada.", "error");
      return;
    }
    await adminDb.ref(PATH_CODES).update(updates);
    Object.assign(state.codesMap, updates);
    byId("zaCodeTextarea").value = "";
    renderStats();
    renderCodes();
    renderCodeRecap();
    showToast("Import selesai: " + count + " masuk, " + skipped + " dilewati.", "success");
  }

  async function generateAndImportCodes(targetCount) {
    const total = Math.max(1, toInt(targetCount, AUTO_GENERATE_CODE_TOTAL));
    const existingCodeSet = new Set(
      codesData().map(function (row) {
        return normalizeCode(row.code);
      })
    );

    const generated = [];
    const updates = {};
    const now = Date.now();
    let attempts = 0;
    const maxAttempts = total * 40;

    while (generated.length < total && attempts < maxAttempts) {
      attempts += 1;
      const code = generateCodeCandidate();
      const normalized = normalizeCode(code);
      if (!/^[A-Z0-9]{8}$/.test(normalized)) continue;
      if (existingCodeSet.has(normalized)) continue;
      const key = codeKey(normalized);
      if (state.codesMap[key]) continue;

      existingCodeSet.add(normalized);
      generated.push(normalized);
      updates[key] = {
        code: normalized,
        active: true,
        pointValue: REDEEM_VALUE_RP,
        status: "new",
        createdAt: now,
        distributed: true,
        distributedAt: now
      };
    }

    if (!generated.length) {
      showToast("Gagal membuat kode baru. Coba ulangi.", "error");
      return;
    }

    await adminDb.ref(PATH_CODES).update(updates);
    Object.assign(state.codesMap, updates);
    renderStats();
    renderCodes();
    renderCodeRecap();
    showToast("Berhasil generate " + generated.length + " kode baru (nominal fix Rp10/kode).", "success");
  }

  async function toggleCode(codeKeyValue) {
    const row = state.codesMap[codeKeyValue];
    if (!row || row.usedBy) {
      showToast("Kode sudah dipakai atau tidak ditemukan.", "error");
      return;
    }
    const active = !(row.active === false || row.enabled === false);
    const payload = { active: !active, updatedAt: Date.now() };
    await adminDb.ref(PATH_CODES + "/" + codeKeyValue).update(payload);
    state.codesMap[codeKeyValue] = Object.assign({}, row, payload);
    renderStats();
    renderCodes();
    renderCodeRecap();
    showToast("Status kode berhasil diubah.", "success");
  }

  async function deleteCode(codeKeyValue) {
    const row = state.codesMap[codeKeyValue];
    if (!row || row.usedBy) {
      showToast("Kode sudah dipakai atau tidak ditemukan.", "error");
      return;
    }
    if (!window.confirm("Hapus kode ini permanen?")) return;
    await adminDb.ref(PATH_CODES + "/" + codeKeyValue).remove();
    delete state.codesMap[codeKeyValue];
    renderStats();
    renderCodes();
    renderCodeRecap();
    showToast("Kode berhasil dihapus.", "success");
  }

  async function handleLogin(event) {
    event.preventDefault();
    const username = String(byId("zaUsername").value || "").trim();
    const password = String(byId("zaPassword").value || "");
    const loginBtn = byId("zaLoginBtn");
    const errorEl = byId("zaLoginError");
    if (errorEl) errorEl.hidden = true;

    if (loginBtn) {
      loginBtn.disabled = true;
      loginBtn.textContent = "Memverifikasi...";
    }

    try {
      const loginResult = await loginViaCandidates(username, password);
      if (!loginResult.success) {
        const msg = loginResult.message || "Login gagal.";
        if (errorEl) {
          errorEl.hidden = false;
          errorEl.textContent = msg;
        }
        showToast(msg, "error");
        return;
      }

      if (errorEl) {
        errorEl.hidden = true;
        errorEl.textContent = "Login gagal. Cek username/password.";
      }

      sessionStorage.setItem(SESSION_LOGIN, "true");
      sessionStorage.setItem(SESSION_TOKEN, String(loginResult.data.token || ""));
      showToast("Login berhasil.", "success");
      goToPanel(getPageFromUrl());
      return;
    } catch (err) {
      if (errorEl) {
        errorEl.hidden = false;
        errorEl.textContent = "Login gagal karena error jaringan.";
      }
      showToast("Login gagal karena error jaringan.", "error");
      console.error("[Zeratto Admin Login Error]", err);
    } finally {
      if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.textContent = "Masuk";
      }
    }
  }

  function logout() {
    sessionStorage.removeItem(SESSION_LOGIN);
    sessionStorage.removeItem(SESSION_TOKEN);
    if (isPanelPage()) {
      goToLogin();
      return;
    }
    location.reload();
  }

  function bindEvents() {
    const loginForm = byId("zaLoginForm");
    if (loginForm) loginForm.addEventListener("submit", handleLogin);

    const logoutBtn = byId("zaLogoutBtn");
    if (logoutBtn) logoutBtn.addEventListener("click", logout);

    const refreshBtn = byId("zaRefreshBtn");
    if (refreshBtn) refreshBtn.addEventListener("click", loadAllData);

    const pageNav = byId("zaPageNav");
    if (pageNav) {
      pageNav.addEventListener("click", function (event) {
        const btn = event.target.closest("[data-page-nav]");
        if (!btn) return;
        const page = String(btn.getAttribute("data-page-nav") || "dashboard");
        setPage(page, true);
      });
    }

    const exchangeFilter = byId("zaExchangeFilter");
    if (exchangeFilter) {
      exchangeFilter.addEventListener("change", function () {
        state.exchangeFilter = exchangeFilter.value;
        renderExchanges();
      });
    }

    const exchangeSearch = byId("zaExchangeSearch");
    if (exchangeSearch) {
      exchangeSearch.addEventListener("input", function () {
        state.exchangeSearch = exchangeSearch.value.trim();
        renderExchanges();
      });
    }

    const userSearch = byId("zaUserSearch");
    if (userSearch) {
      userSearch.addEventListener("input", function () {
        state.userSearch = userSearch.value.trim();
        renderUsers();
      });
    }

    const codeFilter = byId("zaCodeFilter");
    if (codeFilter) {
      codeFilter.addEventListener("change", function () {
        state.codeFilter = codeFilter.value;
        renderCodes();
      });
    }

    const codeSearch = byId("zaCodeSearch");
    if (codeSearch) {
      codeSearch.addEventListener("input", function () {
        state.codeSearch = codeSearch.value.trim();
        renderCodes();
      });
    }

    const redeemSearch = byId("zaRedeemSearch");
    if (redeemSearch) {
      redeemSearch.addEventListener("input", function () {
        state.redeemSearch = redeemSearch.value.trim();
        renderRedeems();
      });
    }

    const importBtn = byId("zaImportCodesBtn");
    if (importBtn) {
      importBtn.addEventListener("click", async function () {
        importBtn.disabled = true;
        try {
          await importCodes();
        } catch (err) {
          console.error("[Zeratto Admin Import Error]", err);
          showToast("Gagal import kode.", "error");
        } finally {
          importBtn.disabled = false;
        }
      });
    }

    const generateBtn = byId("zaGenerate2000Btn");
    if (generateBtn) {
      generateBtn.addEventListener("click", async function () {
        generateBtn.disabled = true;
        try {
          const targetInput = byId("zaDailyTarget");
          const targetValue = Math.max(1, toInt(targetInput ? targetInput.value : AUTO_GENERATE_CODE_TOTAL, AUTO_GENERATE_CODE_TOTAL));
          await generateAndImportCodes(targetValue);
        } catch (err) {
          console.error("[Zeratto Admin Generate Codes Error]", err);
          showToast("Gagal generate kode otomatis.", "error");
        } finally {
          generateBtn.disabled = false;
        }
      });
    }

    const recapDateInput = byId("zaRecapDate");
    const recapApplyBtn = byId("zaRecapApplyBtn");
    const exportInBtn = byId("zaExportInBtn");
    const exportFullBtn = byId("zaExportFullBtn");
    const exportWeeklyBtn = byId("zaExportWeeklyBtn");

    if (recapDateInput) {
      if (!recapDateInput.value) {
        recapDateInput.value = toYmd(Date.now());
      }
      state.recapDate = String(recapDateInput.value || "").trim();
      recapDateInput.addEventListener("change", function () {
        state.recapDate = getRecapDateValue();
        renderCodeRecap();
      });
    }

    if (recapApplyBtn) {
      recapApplyBtn.addEventListener("click", function () {
        state.recapDate = getRecapDateValue();
        renderCodeRecap();
      });
    }
    if (exportInBtn) exportInBtn.addEventListener("click", exportStatusInCsv);
    if (exportFullBtn) exportFullBtn.addEventListener("click", exportStatusInOutCsv);
    if (exportWeeklyBtn) {
      exportWeeklyBtn.addEventListener("click", function () {
        exportWeeklyCsv().catch(function (err) {
          console.error("[Zeratto Weekly Export Error]", err);
          showToast("Gagal export rekap mingguan.", "error");
        });
      });
    }

    const exchangeList = byId("zaExchangeList");
    if (exchangeList) {
      exchangeList.addEventListener("click", async function (event) {
        const btn = event.target.closest("button[data-exchange-action]");
        if (!btn) return;
        const action = String(btn.dataset.exchangeAction || "");
        const requestId = String(btn.dataset.requestId || "");
        const uid = String(btn.dataset.uid || "");
        if (!action || !requestId) return;
        btn.disabled = true;
        try {
          await setExchangeStatus(requestId, uid, action);
          renderStats();
          renderExchanges();
          showToast("Status request berhasil diubah.", "success");
        } catch (err) {
          console.error("[Zeratto Admin Exchange Error]", err);
          showToast("Gagal update status request.", "error");
        } finally {
          btn.disabled = false;
        }
      });
    }

    const usersList = byId("zaUsersList");
    if (usersList) {
      usersList.addEventListener("click", async function (event) {
        const btn = event.target.closest("button[data-user-action]");
        if (!btn) return;
        const action = String(btn.dataset.userAction || "");
        const uid = String(btn.dataset.uid || "");
        const item = btn.closest(".za-item");
        const input = item ? item.querySelector(".za-point-input") : null;
        const amount = toInt(input ? input.value : 0, 0);
        if (!uid || !action) return;
        if ((action === "add" || action === "sub") && amount <= 0) {
          showToast("Masukkan jumlah saldo yang valid.", "error");
          return;
        }
        btn.disabled = true;
        try {
          const nextPoints = await updateUserPoints(uid, action, amount);
          renderStats();
          renderUsers();
          showToast("Saldo user diperbarui: " + formatRupiah(nextPoints), "success");
        } catch (err) {
          console.error("[Zeratto Admin User Point Error]", err);
          showToast("Gagal update saldo user.", "error");
        } finally {
          btn.disabled = false;
        }
      });
    }

    const codesList = byId("zaCodesList");
    if (codesList) {
      codesList.addEventListener("click", async function (event) {
        const btn = event.target.closest("button[data-code-action]");
        if (!btn) return;
        const action = String(btn.dataset.codeAction || "");
        const key = String(btn.dataset.codeKey || "");
        if (!action || !key) return;
        btn.disabled = true;
        try {
          if (action === "toggle") await toggleCode(key);
          if (action === "delete") await deleteCode(key);
        } catch (err) {
          console.error("[Zeratto Admin Code Action Error]", err);
          showToast("Aksi kode gagal.", "error");
        } finally {
          btn.disabled = false;
        }
      });
    }
  }

  function initFirebase() {
    if (typeof firebase === "undefined") {
      showToast("Firebase belum termuat.", "error");
      return false;
    }
    let app = null;
    try {
      app = firebase.app(APP_NAME);
    } catch (_err) {
      app = firebase.initializeApp(firebaseConfig, APP_NAME);
    }
    adminDb = app.database();
    return true;
  }

  async function init() {
    bindEvents();

    const loggedIn = sessionStorage.getItem(SESSION_LOGIN) === "true";
    const onLoginPage = isLoginPage();
    const onPanelPage = isPanelPage();

    if (onLoginPage) {
      setLoginState(false);
      if (loggedIn) {
        goToPanel(getPageFromUrl());
      }
      return;
    }

    if (onPanelPage) {
      if (!loggedIn) {
        goToLogin();
        return;
      }
      if (!initFirebase()) return;
      setLoginState(true);
      setPage(getPageFromUrl(), false);
      await loadAllData();
      return;
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
