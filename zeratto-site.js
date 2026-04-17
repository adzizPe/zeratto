(function () {
  "use strict";

  const GACHA_REWARDS = [5, 8, 10, 12, 15, 18, 20, 25, 30];
  const DIAMOND_PACKAGES = {
    "Mobile Legends": [
      { value: "11 Diamond", label: "11 Diamond", note: "Paket pemula", coin: 120 },
      { value: "50 Diamond", label: "50 Diamond", note: "Cepat dipilih", coin: 520 },
      { value: "100 Diamond", label: "100 Diamond", note: "Top up ringan", coin: 990 },
      { value: "172 Diamond", label: "172 Diamond", note: "Paket favorit", coin: 1670 },
      { value: "257 Diamond", label: "257 Diamond", note: "Naik kelas", coin: 2460 },
      { value: "344 Diamond", label: "344 Diamond", note: "Mid spender", coin: 3280 },
      { value: "514 Diamond", label: "514 Diamond", note: "Push rank", coin: 4870 },
      { value: "706 Diamond", label: "706 Diamond", note: "Paket besar", coin: 6630 }
    ],
    "Free Fire": [
      { value: "12 Diamond", label: "12 Diamond", note: "Paket pemula", coin: 110 },
      { value: "50 Diamond", label: "50 Diamond", note: "Cepat dipilih", coin: 470 },
      { value: "70 Diamond", label: "70 Diamond", note: "Top up ringan", coin: 650 },
      { value: "140 Diamond", label: "140 Diamond", note: "Paket populer", coin: 1280 },
      { value: "355 Diamond", label: "355 Diamond", note: "Naik level", coin: 3180 },
      { value: "720 Diamond", label: "720 Diamond", note: "Paket besar", coin: 6390 },
      { value: "Member Mingguan", label: "Member Mingguan", note: "Langganan hemat", coin: 2900 },
      { value: "Member Bulanan", label: "Member Bulanan", note: "Untuk rutin main", coin: 9200 }
    ],
    "Roblox": [
      { value: "40 Robux", label: "40 Robux", note: "Paket mini", coin: 620 },
      { value: "80 Robux", label: "80 Robux", note: "Paket ringan", coin: 1160 },
      { value: "160 Robux", label: "160 Robux", note: "Paket hemat", coin: 2190 },
      { value: "400 Robux", label: "400 Robux", note: "Paling dicari", coin: 5180 },
      { value: "800 Robux", label: "800 Robux", note: "Paket besar", coin: 10360 },
      { value: "1700 Robux", label: "1700 Robux", note: "Untuk spender", coin: 21150 },
      { value: "4500 Robux", label: "4500 Robux", note: "Mega pack", coin: 52800 },
      { value: "1000 Premium", label: "1000 Premium", note: "Member premium", coin: 11200 }
    ]
  };
  const PULSA_OPERATOR_PACKAGES = {
    Telkomsel: [
      { value: "5.000", label: "5.000", coin: 560 },
      { value: "10.000", label: "10.000", coin: 1090 },
      { value: "15.000", label: "15.000", coin: 1610 },
      { value: "25.000", label: "25.000", coin: 2640 },
      { value: "50.000", label: "50.000", coin: 5230 },
      { value: "100.000", label: "100.000", coin: 10390 },
      { value: "200.000", label: "200.000", coin: 20720 },
      { value: "300.000", label: "300.000", coin: 30980 },
      { value: "500.000", label: "500.000", coin: 51450 }
    ],
    Axis: [
      { value: "5.000", label: "5.000", coin: 540 },
      { value: "10.000", label: "10.000", coin: 1060 },
      { value: "15.000", label: "15.000", coin: 1570 },
      { value: "25.000", label: "25.000", coin: 2580 },
      { value: "50.000", label: "50.000", coin: 5110 },
      { value: "100.000", label: "100.000", coin: 10160 },
      { value: "200.000", label: "200.000", coin: 20280 },
      { value: "300.000", label: "300.000", coin: 30360 },
      { value: "500.000", label: "500.000", coin: 50490 }
    ],
    XL: [
      { value: "5.000", label: "5.000", coin: 545 },
      { value: "10.000", label: "10.000", coin: 1070 },
      { value: "15.000", label: "15.000", coin: 1585 },
      { value: "25.000", label: "25.000", coin: 2600 },
      { value: "50.000", label: "50.000", coin: 5150 },
      { value: "100.000", label: "100.000", coin: 10220 },
      { value: "200.000", label: "200.000", coin: 20410 },
      { value: "300.000", label: "300.000", coin: 30590 },
      { value: "500.000", label: "500.000", coin: 50920 }
    ],
    Tri: [
      { value: "5.000", label: "5.000", coin: 520 },
      { value: "10.000", label: "10.000", coin: 1020 },
      { value: "15.000", label: "15.000", coin: 1510 },
      { value: "25.000", label: "25.000", coin: 2490 },
      { value: "50.000", label: "50.000", coin: 4940 },
      { value: "100.000", label: "100.000", coin: 9830 },
      { value: "200.000", label: "200.000", coin: 19640 },
      { value: "300.000", label: "300.000", coin: 29430 },
      { value: "500.000", label: "500.000", coin: 49010 }
    ],
    IM3: [
      { value: "5.000", label: "5.000", coin: 535 },
      { value: "10.000", label: "10.000", coin: 1055 },
      { value: "15.000", label: "15.000", coin: 1560 },
      { value: "25.000", label: "25.000", coin: 2570 },
      { value: "50.000", label: "50.000", coin: 5090 },
      { value: "100.000", label: "100.000", coin: 10120 },
      { value: "200.000", label: "200.000", coin: 20180 },
      { value: "300.000", label: "300.000", coin: 30220 },
      { value: "500.000", label: "500.000", coin: 50330 }
    ],
    Smartfren: [
      { value: "5.000", label: "5.000", coin: 530 },
      { value: "10.000", label: "10.000", coin: 1040 },
      { value: "15.000", label: "15.000", coin: 1540 },
      { value: "25.000", label: "25.000", coin: 2540 },
      { value: "50.000", label: "50.000", coin: 5030 },
      { value: "100.000", label: "100.000", coin: 10010 },
      { value: "200.000", label: "200.000", coin: 19980 },
      { value: "300.000", label: "300.000", coin: 29940 },
      { value: "500.000", label: "500.000", coin: 49850 }
    ]
  };
  const USER_POINTS_STORAGE_KEY = "zerattoUserPoints";
  const USER_POINTS_EVENT = "zerattoPointsUpdated";
  const USER_GACHA_STORAGE_KEY = "zerattoUserGachaState";
  const USER_GACHA_EVENT = "zerattoGachaUpdated";
  const USER_THEME_STORAGE_KEY = "zerattoTheme";
  const THEME_MEDIA_QUERY = "(prefers-color-scheme: dark)";
  const EWALLET_MIN_COIN = 100;
  const EWALLET_RUPIAH_PER_COIN = 10;
  const ID_GAME_CHECKER_URL = "https://api.velixs.com/idgames-checker";
  const ID_GAME_CHECKER_KEY = "7660fa9372771092ea17c23ada5060e5804d3ba2c2da832120";
  const DIAMOND_CHECKER_CONFIG = {
    "Mobile Legends": {
      apiGame: "ml",
      requiresId: true,
      requiresServer: true,
      nicknamePlaceholder: "Akan terisi otomatis setelah cek ID"
    },
    "Free Fire": {
      apiGame: "freefire",
      requiresId: true,
      requiresServer: false,
      nicknamePlaceholder: "Akan terisi otomatis setelah cek ID"
    },
    "Roblox": {
      apiGame: "",
      requiresId: false,
      requiresServer: false,
      nicknamePlaceholder: "Masukkan username Roblox"
    }
  };
  const EWALLET_CONFIG = {
    DANA: {
      numberLabel: "Nomor DANA",
      numberPlaceholder: "Masukkan nomor DANA",
      nameLabel: "Atas Nama DANA",
      namePlaceholder: "Nama sesuai akun DANA",
      selectedBadge: "DANA dipilih",
      selectedTitle: "Kirim ke akun DANA",
      selectedMeta: "Saldo akan dikirim ke nomor DANA yang kamu isi di bawah.",
      convertTitle: "Tukar ke DANA",
      convertText: "Masukkan nilai coin dan hasil rupiah akan dikonversi otomatis untuk akun DANA. Minimal penukaran 100 coin.",
      submitText: "Tukar ke DANA"
    },
    GoPay: {
      numberLabel: "Nomor GoPay",
      numberPlaceholder: "Masukkan nomor GoPay",
      nameLabel: "Atas Nama GoPay",
      namePlaceholder: "Nama sesuai akun GoPay",
      selectedBadge: "GoPay dipilih",
      selectedTitle: "Kirim ke akun GoPay",
      selectedMeta: "Saldo akan dikirim ke nomor GoPay yang kamu isi di bawah.",
      convertTitle: "Tukar ke GoPay",
      convertText: "Masukkan nilai coin dan hasil rupiah akan dikonversi otomatis untuk akun GoPay. Minimal penukaran 100 coin.",
      submitText: "Tukar ke GoPay"
    },
    OVO: {
      numberLabel: "Nomor OVO",
      numberPlaceholder: "Masukkan nomor OVO",
      nameLabel: "Atas Nama OVO",
      namePlaceholder: "Nama sesuai akun OVO",
      selectedBadge: "OVO dipilih",
      selectedTitle: "Kirim ke akun OVO",
      selectedMeta: "Saldo akan dikirim ke nomor OVO yang kamu isi di bawah.",
      convertTitle: "Tukar ke OVO",
      convertText: "Masukkan nilai coin dan hasil rupiah akan dikonversi otomatis untuk akun OVO. Minimal penukaran 100 coin.",
      submitText: "Tukar ke OVO"
    },
    ShopeePay: {
      numberLabel: "Nomor ShopeePay",
      numberPlaceholder: "Masukkan nomor ShopeePay",
      nameLabel: "Atas Nama ShopeePay",
      namePlaceholder: "Nama sesuai akun ShopeePay",
      selectedBadge: "ShopeePay dipilih",
      selectedTitle: "Kirim ke akun ShopeePay",
      selectedMeta: "Saldo akan dikirim ke nomor ShopeePay yang kamu isi di bawah.",
      convertTitle: "Tukar ke ShopeePay",
      convertText: "Masukkan nilai coin dan hasil rupiah akan dikonversi otomatis untuk akun ShopeePay. Minimal penukaran 100 coin.",
      submitText: "Tukar ke ShopeePay"
    }
  };

  function createNavIcon(name) {
    return '<i data-lucide="' + name + '"></i>';
  }

  function createDiamondCardIcon() {
    return '' +
      '<svg viewBox="0 0 64 64" fill="none" aria-hidden="true">' +
        '<path class="zr-diamond-gem-back" d="M32 6 11 24l21 34 21-34L32 6Z"></path>' +
        '<path class="zr-diamond-gem-top" d="M18 24 27 13h10l9 11-14 8-14-8Z"></path>' +
        '<path class="zr-diamond-gem-left" d="M11 24h7l14 8-7 19L11 24Z"></path>' +
        '<path class="zr-diamond-gem-right" d="M53 24h-7l-14 8 7 19L53 24Z"></path>' +
        '<path class="zr-diamond-gem-center" d="m32 32-7 19 7 7 7-7-7-19Z"></path>' +
        '<path class="zr-diamond-gem-cut" d="M18 24h28"></path>' +
        '<path class="zr-diamond-gem-cut" d="m27 13 5 19 5-19"></path>' +
        '<path class="zr-diamond-gem-cut" d="M25 51h14"></path>' +
        '<path class="zr-diamond-gem-spark" d="M50 9v8"></path>' +
        '<path class="zr-diamond-gem-spark" d="M46 13h8"></path>' +
        '<circle class="zr-diamond-gem-dot" cx="15" cy="15" r="2.5"></circle>' +
      "</svg>";
  }

  function createRobuxCardIcon() {
    return '' +
      '<svg viewBox="0 0 64 64" fill="none" aria-hidden="true">' +
        '<rect class="zr-robux-coin-back" x="16" y="10" width="32" height="44" rx="8" ry="8"></rect>' +
        '<circle class="zr-robux-coin-dot" cx="32" cy="32" r="12"></circle>' +
        '<path class="zr-robux-coin-top" d="M24 16 L32 10 L40 16 Z"></path>' +
        '<path class="zr-robux-coin-bottom" d="M24 48 L32 54 L40 48 Z"></path>' +
      "</svg>";
  }

  function getDiamondCheckerConfig(gameName) {
    return DIAMOND_CHECKER_CONFIG[gameName] || DIAMOND_CHECKER_CONFIG["Mobile Legends"];
  }

  function getDiamondPackageData(gameName, packageValue) {
    const packages = DIAMOND_PACKAGES[gameName] || DIAMOND_PACKAGES["Mobile Legends"] || [];
    const currentValue = String(packageValue || "").trim();
    return packages.find(function (item) {
      return String(item.value || "") === currentValue;
    }) || packages[0] || null;
  }

  function getEwalletConfig(walletType) {
    return EWALLET_CONFIG[walletType] || EWALLET_CONFIG.DANA;
  }

  function getPulsaPackages(operator) {
    return PULSA_OPERATOR_PACKAGES[operator] || PULSA_OPERATOR_PACKAGES.Telkomsel || [];
  }

  function getPulsaPackageData(operator, nominal) {
    const packages = getPulsaPackages(operator);
    const currentValue = String(nominal || "").trim();
    return packages.find(function (item) {
      return String(item.value || "") === currentValue;
    }) || packages[0] || null;
  }

  function ensureBrandCopy(brand) {
    if (!brand || brand.querySelector(".zr-brand-copy")) return;

    const copy = document.createElement("span");
    copy.className = "zr-brand-copy";
    copy.innerHTML = "<strong>Zeratto</strong><small>Snack & chocolate</small>";
    brand.appendChild(copy);
  }

  function formatCoinValue(value) {
    const safeValue = Number.isFinite(Number(value)) ? Math.max(0, Math.trunc(Number(value))) : 0;
    return safeValue.toLocaleString("id-ID") + " Coin";
  }

  function formatIdrValue(value) {
    const safeValue = Number.isFinite(Number(value)) ? Math.max(0, Math.trunc(Number(value))) : 0;
    return "Rp " + safeValue.toLocaleString("id-ID");
  }

  function shuffleItems(items) {
    const cloned = Array.isArray(items) ? items.slice() : [];
    for (let index = cloned.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      const temp = cloned[index];
      cloned[index] = cloned[randomIndex];
      cloned[randomIndex] = temp;
    }
    return cloned;
  }

  function calculateEwalletRupiah(points) {
    const safeValue = Number.isFinite(Number(points)) ? Math.max(0, Math.trunc(Number(points))) : 0;
    return safeValue * EWALLET_RUPIAH_PER_COIN;
  }

  function readStoredUserPoints() {
    let raw = "";

    try {
      raw = String(localStorage.getItem(USER_POINTS_STORAGE_KEY) || "");
    } catch (_err) {}

    if (!raw) {
      try {
        raw = String(sessionStorage.getItem(USER_POINTS_STORAGE_KEY) || "");
      } catch (_err) {}
    }

    const parsed = Number(raw);
    return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0;
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
      if (!parsed.id && !parsed.email) return null;
      return parsed;
    } catch (_err) {
      return null;
    }
  }

  function normalizeGachaState(state) {
    const totalRedeems = Number.isFinite(Number(state && state.totalRedeems))
      ? Math.max(0, Math.trunc(Number(state.totalRedeems)))
      : 0;
    const usedSpins = Number.isFinite(Number(state && state.usedSpins))
      ? Math.max(0, Math.trunc(Number(state.usedSpins)))
      : 0;
    const safeUsedSpins = Math.min(totalRedeems, usedSpins);
    return {
      totalRedeems: totalRedeems,
      usedSpins: safeUsedSpins,
      availableSpins: Math.max(0, totalRedeems - safeUsedSpins)
    };
  }

  function readStoredGachaState() {
    let raw = "";

    try {
      raw = String(localStorage.getItem(USER_GACHA_STORAGE_KEY) || "");
    } catch (_err) {}

    if (!raw) {
      try {
        raw = String(sessionStorage.getItem(USER_GACHA_STORAGE_KEY) || "");
      } catch (_err) {}
    }

    if (!raw) return normalizeGachaState(null);

    try {
      return normalizeGachaState(JSON.parse(raw));
    } catch (_err) {
      return normalizeGachaState(null);
    }
  }

  function isUserLoggedIn() {
    return readStoredGoogleUser() !== null;
  }

  function getSystemTheme() {
    if (window.matchMedia && window.matchMedia(THEME_MEDIA_QUERY).matches) {
      return "dark";
    }
    return "light";
  }

  function readStoredTheme() {
    let raw = "";

    try {
      raw = String(localStorage.getItem(USER_THEME_STORAGE_KEY) || "");
    } catch (_err) {}

    if (!raw) {
      try {
        raw = String(sessionStorage.getItem(USER_THEME_STORAGE_KEY) || "");
      } catch (_err) {}
    }

    raw = raw.trim().toLowerCase();
    return raw === "dark" || raw === "light" ? raw : "";
  }

  function storeTheme(theme) {
    const safeTheme = theme === "dark" ? "dark" : "light";

    try {
      localStorage.setItem(USER_THEME_STORAGE_KEY, safeTheme);
    } catch (_err) {}

    try {
      sessionStorage.setItem(USER_THEME_STORAGE_KEY, safeTheme);
    } catch (_err) {}
  }

  function getResolvedTheme() {
    return readStoredTheme() || getSystemTheme();
  }

  function getActiveTheme() {
    const bodyTheme = document.body ? String(document.body.getAttribute("data-zr-theme") || "").trim().toLowerCase() : "";
    const htmlTheme = String(document.documentElement.getAttribute("data-zr-theme") || "").trim().toLowerCase();
    const raw = bodyTheme || htmlTheme;
    return raw === "dark" ? "dark" : "light";
  }

  function syncThemeColor(theme) {
    const safeTheme = theme === "dark" ? "dark" : "light";
    let meta = document.querySelector('meta[name="theme-color"]');

    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }

    meta.content = safeTheme === "dark" ? "#18110d" : "#fff8f0";
  }

  function syncThemeToggleState(theme) {
    const safeTheme = theme === "dark" ? "dark" : "light";

    document.querySelectorAll("[data-zr-theme-toggle]").forEach(function (button) {
      button.setAttribute("aria-pressed", safeTheme === "dark" ? "true" : "false");
      button.setAttribute("aria-label", safeTheme === "dark" ? "Ganti ke mode terang" : "Ganti ke mode gelap");
      button.setAttribute("title", safeTheme === "dark" ? "Ganti ke mode terang" : "Ganti ke mode gelap");
    });

    document.querySelectorAll("[data-zr-theme-label]").forEach(function (label) {
      label.textContent = safeTheme === "dark" ? "Gelap" : "Terang";
    });
  }

  function applyTheme(theme, persist) {
    const safeTheme = theme === "dark" ? "dark" : "light";

    document.documentElement.setAttribute("data-zr-theme", safeTheme);
    document.documentElement.style.colorScheme = safeTheme;
    if (document.body) {
      document.body.setAttribute("data-zr-theme", safeTheme);
    }

    syncThemeColor(safeTheme);
    syncThemeToggleState(safeTheme);

    if (persist === true) {
      storeTheme(safeTheme);
    }

    return safeTheme;
  }

  function updateNavCoin(points) {
    const value = formatCoinValue(points);
    document.querySelectorAll("[data-zr-nav-coin-value]").forEach(function (el) {
      el.textContent = value;
    });
  }

  function ensureNavTools(brandLine) {
    if (!brandLine) return null;

    let navTools = brandLine.querySelector(".zr-nav-tools");
    if (!navTools) {
      navTools = document.createElement("div");
      navTools.className = "zr-nav-tools";
      brandLine.appendChild(navTools);
    }

    return navTools;
  }

  function ensureNavCoin(navInner, brand, navMenu) {
    if (!navInner || !brand) return;

    let brandLine = navInner.querySelector(".zr-nav-brandline");
    if (!brandLine) {
      brandLine = document.createElement("div");
      brandLine.className = "zr-nav-brandline";
      navInner.insertBefore(brandLine, brand);
    }

    if (brand.parentElement !== brandLine) {
      brandLine.appendChild(brand);
    }

    const navTools = ensureNavTools(brandLine);
    if (!navTools) return;

    let coinBox = navTools.querySelector(".zr-nav-balance");
    if (!coinBox) {
      coinBox = document.createElement("div");
      coinBox.className = "zr-nav-balance";
      coinBox.setAttribute("aria-live", "polite");
      coinBox.innerHTML =
        '<span class="zr-nav-balance-icon">' + createNavIcon("coins") + "</span>" +
        '<span class="zr-nav-balance-copy">' +
          '<small>Coin User</small>' +
          '<strong data-zr-nav-coin-value>0 Coin</strong>' +
        "</span>";
      navTools.appendChild(coinBox);
    } else if (coinBox.parentElement !== navTools) {
      navTools.appendChild(coinBox);
    }

    if (navMenu && brandLine.nextElementSibling !== navMenu) {
      navInner.insertBefore(brandLine, navMenu);
    }

    updateNavCoin(readStoredUserPoints());
  }

  function ensureThemeToggle(navInner) {
    const brandLine = navInner ? navInner.querySelector(".zr-nav-brandline") : null;
    const navTools = ensureNavTools(brandLine);
    if (!navTools) return;

    let toggle = navTools.querySelector("[data-zr-theme-toggle]");
    if (!toggle) {
      toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "zr-theme-toggle";
      toggle.setAttribute("data-zr-theme-toggle", "");
      toggle.innerHTML =
        '<span class="zr-theme-toggle-track" aria-hidden="true">' +
          '<span class="zr-theme-toggle-thumb"></span>' +
        "</span>" +
        '<span class="zr-theme-toggle-copy">' +
          "<small>Tema</small>" +
          '<strong data-zr-theme-label>Terang</strong>' +
        "</span>";
      toggle.addEventListener("click", function () {
        const nextTheme = getActiveTheme() === "dark" ? "light" : "dark";
        applyTheme(nextTheme, true);
      });
      navTools.appendChild(toggle);
    }

    syncThemeToggleState(getActiveTheme());
  }

  function resolveNavIcon(href) {
    const target = String(href || "").toLowerCase();
    if (target === "./" || target === "/" || target === "index.html") return "house";
    if (target.indexOf("produk") !== -1) return "shopping-bag";
    if (target.indexOf("redeem") !== -1) return "ticket";
    if (target.indexOf("tukar") !== -1) return "gift";
    if (target.indexOf("profil") !== -1) return "user-round";
    if (target.indexOf("hubungi") !== -1 || target.indexOf("tentang") !== -1) return "messages-square";
    return "circle";
  }

  function ensureNavEnhancement() {
    const navbar = document.querySelector(".zr-navbar");
    const navInner = navbar ? navbar.querySelector(".zr-nav-inner") : null;
    const brand = navInner ? navInner.querySelector(".zr-brand") : null;
    const navMenu = navInner ? navInner.querySelector(".zr-nav-menu") : null;

    if (!navbar || !navInner || !brand || !navMenu) return;

    ensureBrandCopy(brand);
    ensureNavCoin(navInner, brand, navMenu);
    ensureThemeToggle(navInner);
    navInner.classList.add("zr-nav-slider-shell");
    navMenu.classList.add("zr-nav-slider");

    navMenu.querySelectorAll(".zr-nav-link").forEach(function (link) {
      link.innerHTML = createNavIcon(resolveNavIcon(link.getAttribute("href"))) + "<span>" + link.textContent.trim() + "</span>";
    });

    if (window.innerWidth <= 860) {
      const activeLink = navMenu.querySelector(".zr-nav-link.active");
      if (activeLink && typeof activeLink.scrollIntoView === "function") {
        window.requestAnimationFrame(function () {
          activeLink.scrollIntoView({
            behavior: "auto",
            block: "nearest",
            inline: "center"
          });
        });
      }
    }
  }

  function initNavCoinSync() {
    updateNavCoin(readStoredUserPoints());

    window.addEventListener("storage", function (event) {
      if (!event || event.key !== USER_POINTS_STORAGE_KEY) return;
      updateNavCoin(event.newValue);
    });

    window.addEventListener(USER_POINTS_EVENT, function (event) {
      const points = event && event.detail ? event.detail.points : 0;
      updateNavCoin(points);
    });
  }

  function initThemePreferenceSync() {
    if (!window.matchMedia) return;

    const mediaQuery = window.matchMedia(THEME_MEDIA_QUERY);
    const handleThemeChange = function (event) {
      if (readStoredTheme()) return;
      applyTheme(event && event.matches ? "dark" : "light", false);
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleThemeChange);
      return;
    }

    if (typeof mediaQuery.addListener === "function") {
      mediaQuery.addListener(handleThemeChange);
    }
  }

  function initReveal() {
    document.querySelectorAll(".zr-reveal").forEach(function (item) {
      item.classList.add("is-visible");
    });
  }

  function tuneImages() {
    document.querySelectorAll("img").forEach(function (img) {
      if (!img.closest(".zr-navbar") && !img.hasAttribute("loading")) {
        img.loading = "lazy";
      }
      img.decoding = "async";
    });
  }

  function updateChoiceGroup(fieldName) {
    const field = document.querySelector('[name="' + fieldName + '"]');
    if (!field) return;

    const currentValue = String(field.value || "");
    document.querySelectorAll('[data-target-field="' + fieldName + '"]').forEach(function (button) {
      button.classList.toggle("is-active", String(button.dataset.value || "") === currentValue);
    });
  }

  function initChoiceButtons() {
    const buttons = document.querySelectorAll("[data-target-field]");
    if (!buttons.length) return;

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        const fieldName = String(button.dataset.targetField || "");
        const value = String(button.dataset.value || "");
        const field = document.querySelector('[name="' + fieldName + '"]');
        if (!field) return;
        field.value = value;
        field.dispatchEvent(new Event("change", { bubbles: true }));
        updateChoiceGroup(fieldName);
      });
    });

    document.querySelectorAll(".zr-tukar-form select, .zr-tukar-form input").forEach(function (field) {
      if (!field.name) return;
      field.addEventListener("change", function () {
        updateChoiceGroup(field.name);
      });
      updateChoiceGroup(field.name);
    });
  }

  function initEwalletConversion() {
    const form = document.querySelector('.zr-tukar-form[data-option="ewallet"]');
    if (!form || !form.elements) return;

    const walletField = form.elements.namedItem("walletType");
    const coinInput = form.elements.namedItem("pointUsed");
    const rupiahField = form.elements.namedItem("walletRupiah");
    const numberInput = form.elements.namedItem("walletNumber");
    const nameInput = form.elements.namedItem("walletName");
    const rupiahDisplay = document.getElementById("zrEwalletRupiahDisplay");
    const hint = document.getElementById("zrEwalletConvertHint");
    const numberLabel = document.getElementById("zrEwalletNumberLabel");
    const nameLabel = document.getElementById("zrEwalletNameLabel");
    const selectedBadge = document.getElementById("zrEwalletSelectedBadge");
    const selectedTitle = document.getElementById("zrEwalletSelectedTitle");
    const selectedMeta = document.getElementById("zrEwalletSelectedMeta");
    const convertTitle = document.getElementById("zrEwalletConvertTitle");
    const convertText = document.getElementById("zrEwalletConvertText");
    const submitBtn = document.getElementById("zrEwalletSubmitBtn");
    if (!walletField || !coinInput || !rupiahField || !rupiahDisplay || !numberInput || !nameInput) return;

    document.querySelectorAll(".zr-ewallet-rate-strip strong").forEach(function (el) {
      el.textContent = EWALLET_MIN_COIN.toLocaleString("id-ID") + " Coin = " + formatIdrValue(calculateEwalletRupiah(EWALLET_MIN_COIN));
    });
    coinInput.min = String(EWALLET_MIN_COIN);
    if (!coinInput.placeholder) {
      coinInput.placeholder = "Minimal " + EWALLET_MIN_COIN;
    }

    function syncWalletSelection() {
      const walletType = String(walletField.value || "DANA").trim() || "DANA";
      const config = getEwalletConfig(walletType);
      walletField.value = walletType in EWALLET_CONFIG ? walletType : "DANA";

      if (numberLabel) numberLabel.textContent = config.numberLabel;
      numberInput.placeholder = config.numberPlaceholder;
      if (nameLabel) nameLabel.textContent = config.nameLabel;
      nameInput.placeholder = config.namePlaceholder;
      if (selectedBadge) selectedBadge.textContent = config.selectedBadge;
      if (selectedTitle) selectedTitle.textContent = config.selectedTitle;
      if (selectedMeta) selectedMeta.textContent = config.selectedMeta;
      if (convertTitle) convertTitle.textContent = config.convertTitle;
      if (convertText) convertText.textContent = config.convertText;
      if (submitBtn) submitBtn.textContent = config.submitText;
      updateChoiceGroup("walletType");
      syncEwalletConversion();
    }

    function syncEwalletConversion() {
      const walletType = String(walletField.value || "DANA").trim() || "DANA";
      const rawValue = String(coinInput.value || "").trim();
      const coinValue = Number(rawValue || 0);
      const safeCoin = Number.isFinite(coinValue) ? Math.max(0, Math.trunc(coinValue)) : 0;
      const rupiahValue = calculateEwalletRupiah(safeCoin);

      if (rawValue && safeCoin !== coinValue) {
        coinInput.value = String(safeCoin);
      }

      rupiahField.value = String(rupiahValue);
      rupiahDisplay.value = rupiahValue.toLocaleString("id-ID");

      if (hint) {
        if (!safeCoin) {
          hint.textContent = "Minimal penukaran " + EWALLET_MIN_COIN + " coin untuk " + walletType + ".";
        } else if (safeCoin < EWALLET_MIN_COIN) {
          hint.textContent = "Minimal penukaran " + EWALLET_MIN_COIN + " coin untuk " + walletType + ".";
        } else {
          hint.textContent = safeCoin.toLocaleString("id-ID") + " coin akan dikonversi menjadi " + formatIdrValue(rupiahValue) + " ke akun " + walletType + ".";
        }
      }
    }

    walletField.addEventListener("change", syncWalletSelection);
    coinInput.addEventListener("input", syncEwalletConversion);
    coinInput.addEventListener("change", syncEwalletConversion);
    form.addEventListener("reset", function () {
      window.setTimeout(function () {
        walletField.value = "DANA";
        syncWalletSelection();
        syncEwalletConversion();
        updateChoiceGroup("walletType");
      }, 0);
    });

    syncWalletSelection();
  }

  function initDiamondExperience() {
    const form = document.querySelector('.zr-tukar-form[data-option="diamond"]');
    const tabButtons = document.querySelectorAll("[data-zr-diamond-game]");
    const packageGrid = document.getElementById("zrDiamondPackageGrid");
    const board = document.querySelector(".zr-diamond-board");
    const gameField = document.querySelector('[name="diamondGame"]');
    const packageField = document.querySelector('[name="diamondPackage"]');
    const requiredCoinField = document.querySelector('[name="diamondRequiredCoin"]');
    const pointInput = document.querySelector('.zr-tukar-form[data-option="diamond"] [name="pointUsed"]');
    const nicknameInput = document.querySelector('[name="diamondNickname"]');
    const userIdInput = document.querySelector('[name="diamondUserId"]');
    const serverInput = document.querySelector('[name="diamondServerId"]');
    const boardTitle = document.getElementById("zrDiamondBoardTitle");
    const pickedPackage = document.getElementById("zrDiamondPickedPackage");
    const summaryPackage = document.getElementById("zrDiamondSummaryPackage");
    const summaryCoin = document.getElementById("zrDiamondSummaryCoin");
    const nicknameField = document.getElementById("zrDiamondNicknameField");
    const nicknameLabel = document.getElementById("zrDiamondNicknameLabel");
    const nicknameHint = document.getElementById("zrDiamondNicknameHint");
    const userIdField = document.getElementById("zrDiamondUserIdField");
    const userIdLabel = document.getElementById("zrDiamondUserIdLabel");
    const serverField = document.getElementById("zrDiamondServerField");
    const serverLabel = document.getElementById("zrDiamondServerLabel");
    const inlineStatus = document.getElementById("zrDiamondInlineStatus");
    const inlineLabel = document.getElementById("zrDiamondInlineLabel");
    const inlineValue = document.getElementById("zrDiamondInlineValue");
    const inlineMeta = document.getElementById("zrDiamondInlineMeta");
    const coinHint = document.getElementById("zrDiamondCoinHint");
    if (!form || !tabButtons.length || !packageGrid || !gameField || !packageField || !nicknameInput || !userIdInput || !serverInput) return;
    let pendingCheckTimer = 0;
    let latestCheckToken = 0;

    function setCheckPending(isPending) {
      if (form && form.dataset) {
        form.dataset.diamondCheckPending = isPending ? "1" : "0";
      }
    }

    function hideInlineStatus() {
      if (!inlineStatus) return;
      inlineStatus.hidden = true;
      inlineStatus.className = "zr-diamond-inline-status zr-diamond-wide";
      if (inlineLabel) inlineLabel.textContent = "Nickname";
      if (inlineValue) inlineValue.textContent = "-";
      if (inlineMeta) inlineMeta.textContent = "";
    }

    function showInlineStatus(type, primary, secondary) {
      if (!inlineStatus) return;
      inlineStatus.hidden = false;
      inlineStatus.className = "zr-diamond-inline-status zr-diamond-wide is-" + type;
      if (inlineLabel) {
        inlineLabel.textContent =
          type === "success" ? "Nickname terdeteksi" :
          type === "loading" ? "Memeriksa akun" :
          type === "error" ? "Validasi akun" :
          "Nickname";
      }
      if (inlineValue) inlineValue.textContent = primary || "-";
      if (inlineMeta) inlineMeta.textContent = secondary || "";
    }

    function clearVerifiedState(clearNickname) {
      window.clearTimeout(pendingCheckTimer);
      latestCheckToken += 1;
      if (form && form.dataset) {
        form.dataset.diamondVerified = "0";
        form.dataset.diamondVerifiedGame = "";
        form.dataset.diamondVerifiedId = "";
        form.dataset.diamondVerifiedServer = "";
        form.dataset.diamondVerifiedName = "";
      }
      setCheckPending(false);
      hideInlineStatus();

      if (clearNickname) {
        nicknameInput.value = "";
      }
    }

    function setVerifiedState(username, gameName, userId, serverId) {
      if (form && form.dataset) {
        form.dataset.diamondVerified = "1";
        form.dataset.diamondVerifiedGame = gameName;
        form.dataset.diamondVerifiedId = userId;
        form.dataset.diamondVerifiedServer = serverId;
        form.dataset.diamondVerifiedName = username;
      }
      setCheckPending(false);

      nicknameInput.value = username;
      showInlineStatus("success", username, gameName + " - ID " + userId + (serverId ? " (" + serverId + ")" : ""));
    }

    function syncIdentityFields(gameName) {
      const config = getDiamondCheckerConfig(gameName);

      if (nicknameField) nicknameField.hidden = Boolean(config.apiGame);
      if (nicknameLabel) nicknameLabel.textContent = "Nickname / Username Game";
      if (nicknameHint) nicknameHint.textContent = "Isi username game secara manual.";
      nicknameInput.readOnly = false;
      nicknameInput.placeholder = config.apiGame ? "" : config.nicknamePlaceholder;
      nicknameInput.required = !config.apiGame;

      if (userIdLabel) {
        userIdLabel.textContent = config.requiresId ? "ID Game" : "ID Game (opsional)";
      }
      if (userIdField) userIdField.hidden = !config.requiresId;
      userIdInput.required = Boolean(config.requiresId);
      userIdInput.disabled = !config.requiresId;
      userIdInput.placeholder = gameName === "Free Fire" ? "Masukkan ID Free Fire" : (gameName === "Mobile Legends" ? "Masukkan ID Mobile Legends" : "Tidak perlu untuk Roblox");

      if (!config.requiresId) {
        userIdInput.value = "";
      }

      if (serverField) serverField.hidden = !config.requiresServer;
      if (serverLabel) serverLabel.textContent = "Server";
      serverInput.required = Boolean(config.requiresServer);
      serverInput.disabled = !config.requiresServer;
      serverInput.placeholder = config.requiresServer ? "Masukkan Server / Zone ID" : "";
      if (!config.requiresServer) {
        serverInput.value = "";
      }

      clearVerifiedState(true);
    }

    function syncDiamondSummary() {
      const currentGame = String(gameField.value || "Mobile Legends");
      const currentPackage = getDiamondPackageData(currentGame, packageField.value);
      const currentLabel = currentPackage ? currentPackage.label : "Belum pilih paket";
      const currentCoin = currentPackage ? Math.max(0, Math.trunc(Number(currentPackage.coin) || 0)) : 0;
      if (boardTitle) boardTitle.textContent = currentGame;
      if (pickedPackage) pickedPackage.textContent = currentLabel;
      if (summaryPackage) summaryPackage.textContent = currentLabel;
      if (summaryCoin) summaryCoin.textContent = currentCoin ? formatCoinValue(currentCoin) : "-";
      if (requiredCoinField) requiredCoinField.value = currentCoin ? String(currentCoin) : "0";
      if (pointInput) {
        pointInput.value = currentCoin ? String(currentCoin) : "";
        pointInput.min = currentCoin ? String(currentCoin) : "1";
      }
      if (coinHint) {
        coinHint.textContent = currentPackage
          ? currentLabel + " membutuhkan " + formatCoinValue(currentCoin) + "."
          : "Coin akan otomatis mengikuti paket yang dipilih.";
      }
    }

    function renderPackageCards(gameName) {
      const packages = DIAMOND_PACKAGES[gameName] || DIAMOND_PACKAGES["Mobile Legends"];
      const currentPackage = String(packageField.value || "");
      const isRoblox = gameName === "Roblox";
      const iconSvg = isRoblox ? createRobuxCardIcon() : createDiamondCardIcon();

      packageGrid.innerHTML = packages.map(function (item) {
        const active = currentPackage === item.value ? " is-active" : "";
        return (
          '<button class="zr-diamond-package-card' + active + '" type="button" data-zr-diamond-package="' + item.value + '">' +
            '<span class="zr-diamond-package-icon">' + iconSvg + "</span>" +
            '<strong>' + item.label + '</strong>' +
            '<small>' + formatCoinValue(item.coin) + '</small>' +
          "</button>"
        );
      }).join("");
    }

    function setGame(gameName) {
      const safeGame = DIAMOND_PACKAGES[gameName] ? gameName : "Mobile Legends";
      gameField.value = safeGame;
      if (board && board.dataset) {
        board.dataset.zrDiamondTheme =
          safeGame === "Free Fire" ? "ff" :
          safeGame === "Roblox" ? "roblox" :
          "ml";
      }

      tabButtons.forEach(function (button) {
        button.classList.toggle("is-active", String(button.dataset.zrDiamondGame || "") === safeGame);
      });

      const packages = DIAMOND_PACKAGES[safeGame] || [];
      const hasCurrent = packages.some(function (item) {
        return item.value === String(packageField.value || "");
      });

      if (!hasCurrent) {
        packageField.value = packages[0] ? packages[0].value : "";
      }

      renderPackageCards(safeGame);
      syncIdentityFields(safeGame);
      syncDiamondSummary();
    }

    async function runDiamondCheck() {
      const gameName = String(gameField.value || "Mobile Legends");
      const config = getDiamondCheckerConfig(gameName);
      const userId = String(userIdInput.value || "").trim();
      const serverId = String(serverInput.value || "").trim();
      const checkToken = ++latestCheckToken;

      if (!config.apiGame) {
        setCheckPending(false);
        hideInlineStatus();
        return;
      }

      if (!userId) {
        setCheckPending(false);
        hideInlineStatus();
        return;
      }

      if (config.requiresServer && !serverId) {
        setCheckPending(false);
        showInlineStatus("info", "Lengkapi server", "Nickname akan muncul otomatis setelah server diisi.");
        return;
      }
      setCheckPending(true);
      showInlineStatus("loading", "Mengecek nickname...", gameName + " - ID " + userId + (serverId ? " (" + serverId + ")" : ""));

      try {
        const payload = {
          game: config.apiGame,
          id: userId,
          apikey: ID_GAME_CHECKER_KEY
        };

        if (config.requiresServer) {
          payload.zoneid = serverId;
        }

        const response = await fetch(ID_GAME_CHECKER_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (checkToken !== latestCheckToken) return;

        let data = {};
        try {
          data = await response.json();
        } catch (_err) {
          data = {};
        }

        const username = String(
          (data && data.data && (data.data.username || data.data.nickname || data.data.name)) ||
          data.username ||
          data.nickname ||
          ""
        ).trim();

        if (!response.ok || data.status === false || !username) {
          throw new Error((data && data.message) || "Akun game tidak ditemukan.");
        }

        setVerifiedState(username, gameName, userId, config.requiresServer ? serverId : "");
      } catch (error) {
        if (checkToken !== latestCheckToken) return;
        setCheckPending(false);
        const message = error && error.message ? error.message : "Validasi ID game gagal. Coba lagi.";
        showInlineStatus("error", "Nickname belum ditemukan", message);
      }
    }

    function scheduleDiamondCheck(immediate) {
      const gameName = String(gameField.value || "Mobile Legends");
      const config = getDiamondCheckerConfig(gameName);
      const userId = String(userIdInput.value || "").trim();
      const serverId = String(serverInput.value || "").trim();

      window.clearTimeout(pendingCheckTimer);
      clearVerifiedState(true);

      if (!config.apiGame) {
        hideInlineStatus();
        return;
      }

      if (!userId) {
        hideInlineStatus();
        return;
      }

      if (config.requiresServer && !serverId) {
        showInlineStatus("info", "Lengkapi server", "Nickname akan muncul otomatis setelah server diisi.");
        return;
      }

      pendingCheckTimer = window.setTimeout(function () {
        runDiamondCheck();
      }, immediate ? 0 : 450);
    }

    tabButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        setGame(String(button.dataset.zrDiamondGame || ""));
      });
    });

    packageGrid.addEventListener("click", function (event) {
      const card = event.target && event.target.closest ? event.target.closest("[data-zr-diamond-package]") : null;
      if (!card) return;
      packageField.value = String(card.dataset.zrDiamondPackage || "");
      renderPackageCards(String(gameField.value || "Mobile Legends"));
      syncDiamondSummary();
    });

    [userIdInput, serverInput].forEach(function (field) {
      field.addEventListener("input", function () {
        scheduleDiamondCheck(false);
      });
      field.addEventListener("change", function () {
        scheduleDiamondCheck(true);
      });
      field.addEventListener("blur", function () {
        scheduleDiamondCheck(true);
      });
    });

    if (nicknameInput) {
      nicknameInput.addEventListener("input", function () {
        if (form && form.dataset) {
          form.dataset.diamondVerified = "0";
          form.dataset.diamondVerifiedName = "";
        }
      });
    }

    form.addEventListener("reset", function () {
      window.setTimeout(function () {
        clearVerifiedState(true);
        setGame("Mobile Legends");
      }, 0);
    });

    setGame(String(gameField.value || "Mobile Legends"));
  }

  function initPulsaExperience() {
    const form = document.querySelector('.zr-tukar-form[data-option="pulsa"]');
    if (!form || !form.elements) return;

    const operatorField = form.elements.namedItem("pulsaOperator");
    const nominalField = form.elements.namedItem("pulsaNominal");
    const packageCoinField = form.elements.namedItem("pulsaPackageCoin");
    const pointInput = form.elements.namedItem("pointUsed");
    const operatorButtons = Array.from(form.querySelectorAll("[data-zr-pulsa-operator]"));
    const nominalGrid = document.getElementById("zrPulsaNominalGrid");
    const operatorLabel = document.getElementById("zrPulsaSummaryOperator");
    const nominalLabel = document.getElementById("zrPulsaSummaryNominal");
    const coinLabel = document.getElementById("zrPulsaSummaryCoin");
    const coinHint = document.getElementById("zrPulsaCoinHint");
    if (!operatorField || !nominalField || !packageCoinField || !pointInput || !nominalGrid || !operatorButtons.length) return;

    function syncPulsaSummary() {
      const operator = String(operatorField.value || "Telkomsel");
      const pkg = getPulsaPackageData(operator, nominalField.value);
      const coin = pkg ? Math.max(0, Math.trunc(Number(pkg.coin) || 0)) : 0;
      const nominal = pkg ? pkg.label : "-";

      operatorButtons.forEach(function (button) {
        button.classList.toggle("is-active", String(button.dataset.zrPulsaOperator || "") === operator);
      });

      if (operatorLabel) operatorLabel.textContent = operator;
      if (nominalLabel) nominalLabel.textContent = nominal;
      if (coinLabel) coinLabel.textContent = coin ? formatCoinValue(coin) : "-";
      packageCoinField.value = coin ? String(coin) : "0";
      pointInput.value = coin ? String(coin) : "";
      pointInput.min = coin ? String(coin) : "1";
      if (coinHint) {
        coinHint.textContent = pkg
          ? operator + " " + nominal + " membutuhkan " + formatCoinValue(coin) + "."
          : "Coin akan otomatis mengikuti nominal pulsa yang dipilih.";
      }
    }

    function renderNominalCards(operator) {
      const packages = getPulsaPackages(operator);
      const currentNominal = String(nominalField.value || "");

      nominalGrid.innerHTML = packages.map(function (item) {
        const active = currentNominal === item.value ? " is-active" : "";
        return (
          '<button class="zr-pulsa-nominal-card' + active + '" type="button" data-zr-pulsa-nominal="' + item.value + '">' +
            '<span class="zr-pulsa-nominal-icon">' + createNavIcon("smartphone") + "</span>" +
            '<strong>' + item.label + '</strong>' +
            '<small>' + formatCoinValue(item.coin) + '</small>' +
          "</button>"
        );
      }).join("");

      if (window.lucide && typeof window.lucide.createIcons === "function") {
        window.lucide.createIcons({
          attrs: {
            "stroke-width": "2.1"
          }
        });
      }
    }

    function setOperator(operator) {
      const safeOperator = PULSA_OPERATOR_PACKAGES[operator] ? operator : "Telkomsel";
      operatorField.value = safeOperator;
      const packages = getPulsaPackages(safeOperator);
      const hasCurrent = packages.some(function (item) {
        return item.value === String(nominalField.value || "");
      });

      if (!hasCurrent) {
        nominalField.value = packages[0] ? packages[0].value : "";
      }

      renderNominalCards(safeOperator);
      syncPulsaSummary();
    }

    operatorButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        setOperator(String(button.dataset.zrPulsaOperator || ""));
      });
    });

    nominalGrid.addEventListener("click", function (event) {
      const card = event.target && event.target.closest ? event.target.closest("[data-zr-pulsa-nominal]") : null;
      if (!card) return;
      nominalField.value = String(card.dataset.zrPulsaNominal || "");
      renderNominalCards(String(operatorField.value || "Telkomsel"));
      syncPulsaSummary();
    });

    form.addEventListener("reset", function () {
      window.setTimeout(function () {
        setOperator("Telkomsel");
      }, 0);
    });

    setOperator(String(operatorField.value || "Telkomsel"));
  }

  function initRedeemGacha() {
    const section = document.getElementById("zrGachaSection");
    const title = document.getElementById("zrGachaTitle");
    const grid = document.querySelector("[data-zr-gacha-grid]");
    const notice = document.getElementById("zrGachaNotice");
    const spinBtn = document.getElementById("zrGachaSpinBtn");
    const spinValue = document.getElementById("zrGachaSpinValue");
    const redeemValue = document.getElementById("zrGachaRedeemValue");
    if (!section || !grid || !notice || !spinBtn) return;

    const tiles = Array.from(grid.querySelectorAll(".zr-gacha-cell"));
    let gachaState = readStoredGachaState();
    let spinning = false;

    function formatRewardLabel(reward) {
      return formatCoinValue(reward && reward.coin);
    }

    function renderTileReward(tile, reward, index) {
      const rewardCoin = Number(reward && reward.coin) || 0;
      const rewardLabel = formatRewardLabel(reward);
      tile.dataset.rewardCoin = String(rewardCoin);
      tile.dataset.rewardLabel = rewardLabel;
      tile.classList.remove("is-opened", "is-spinning");
      tile.disabled = false;
      tile.innerHTML = '<span class="zr-gacha-coin-icon">' + createNavIcon("coins") + "</span>" +
        "<strong>" + rewardLabel + "</strong>";
      tile.setAttribute("aria-label", "Bonus coin " + rewardLabel + " slot " + String(index + 1));
    }

    function getAvailableTiles() {
      return tiles.filter(function (tile) {
        return !tile.classList.contains("is-opened");
      });
    }

    function updateSectionVisibility() {
      section.hidden = !(isUserLoggedIn() && gachaState.totalRedeems > 0);
    }

    function renderGachaSummary() {
      if (spinValue) spinValue.textContent = String(gachaState.availableSpins || 0) + "x";
      if (redeemValue) redeemValue.textContent = String(gachaState.totalRedeems || 0) + "x";
      if (title) {
        title.textContent = gachaState.availableSpins > 0 ? "Bonus Spin Redeem" : "Bonus Redeem Kamu";
      }
    }

    function resolveDefaultNotice() {
      if (!isUserLoggedIn()) {
        return "Login Google dulu sebelum membuka bonus spin redeem.";
      }

      if (gachaState.totalRedeems <= 0) {
        return "Redeem kode valid dulu. Setiap 1 redeem berhasil memberi 1x spin bonus.";
      }

      if (!getAvailableTiles().length) {
        return gachaState.availableSpins > 0
          ? "Kamu masih punya " + gachaState.availableSpins + "x spin bonus. Tekan Gunakan Spin untuk putaran berikutnya."
          : "Semua spin bonus sudah dipakai. Redeem kode lagi untuk dapat spin baru.";
      }

      if (gachaState.availableSpins <= 0) {
        return "Spin bonus kamu habis. Redeem kode lagi untuk mendapat spin baru.";
      }

      return "Kamu punya " + gachaState.availableSpins + "x spin bonus dari redeem yang berhasil.";
    }

    function syncControls(customNotice) {
      updateSectionVisibility();
      renderGachaSummary();

      if (spinning) {
        spinBtn.disabled = true;
        if (customNotice) notice.textContent = customNotice;
        return;
      }

      if (!isUserLoggedIn() || gachaState.totalRedeems <= 0) {
        spinBtn.disabled = true;
        notice.textContent = customNotice || resolveDefaultNotice();
        return;
      }

      spinBtn.disabled = gachaState.availableSpins <= 0;
      notice.textContent = customNotice || resolveDefaultNotice();
    }

    function resetBoard() {
      const boardRewards = shuffleItems(GACHA_REWARDS).slice(0, tiles.length);
      spinning = false;
      tiles.forEach(function (tile, index) {
        renderTileReward(tile, boardRewards[index] || { coin: 0 }, index);
      });
      initIcons();
      syncControls();
    }

    function clearSpinState() {
      tiles.forEach(function (tile) {
        tile.classList.remove("is-spinning");
      });
    }

    function finishSpin(targetTile, rewardLabel) {
      clearSpinState();
      targetTile.classList.add("is-opened");
      targetTile.disabled = true;
      targetTile.setAttribute("aria-label", "Bonus coin didapat: " + rewardLabel);

      spinning = false;
      if (gachaState.availableSpins > 0) {
        syncControls("Spin berhasil. Kamu dapat +" + rewardLabel + " dan coin langsung masuk ke akun. Spin bonus tersisa " + gachaState.availableSpins + "x.");
        return;
      }

      syncControls("Spin berhasil. Kamu dapat +" + rewardLabel + " dan coin langsung masuk ke akun. Spin bonus habis, redeem kode lagi untuk lanjut.");
    }

    async function reserveSpin(rewardCoin) {
      const authApi = window.ZerattoAuth && typeof window.ZerattoAuth.consumeGachaSpin === "function"
        ? window.ZerattoAuth
        : null;
      if (!authApi) {
        return {
          ok: false,
          state: gachaState,
          message: "Sistem spin belum siap."
        };
      }
      return authApi.consumeGachaSpin(rewardCoin);
    }

    async function spinBoard() {
      if (spinning) return;

      if (!isUserLoggedIn()) {
        syncControls("Login Google dulu sebelum membuka bonus spin redeem.");
        return;
      }

      if (gachaState.totalRedeems <= 0) {
        syncControls("Redeem kode valid dulu. Setiap 1 redeem berhasil memberi 1x spin bonus.");
        return;
      }

      if (gachaState.availableSpins <= 0) {
        syncControls("Spin bonus kamu habis. Redeem kode lagi untuk mendapat spin baru.");
        return;
      }

      if (!getAvailableTiles().length) {
        resetBoard();
      }

      const availableTiles = getAvailableTiles();
      if (!availableTiles.length) return;

      const targetTile = availableTiles[Math.floor(Math.random() * availableTiles.length)];
      const rewardCoin = Number(targetTile.dataset.rewardCoin || 0);
      const rewardLabel = String(targetTile.dataset.rewardLabel || formatCoinValue(rewardCoin));

      spinBtn.disabled = true;
      notice.textContent = "Memeriksa spin bonus...";

      const consumeResult = await reserveSpin(rewardCoin);
      gachaState = normalizeGachaState(consumeResult && consumeResult.state);
      renderGachaSummary();

      if (!consumeResult || !consumeResult.ok) {
        syncControls(consumeResult && consumeResult.message ? consumeResult.message : "Spin belum tersedia.");
        return;
      }

      const sequence = availableTiles.slice();
      const steps = [];
      let step = 0;

      function pickRandomTile(excludeTile) {
        const candidates = sequence.filter(function (tile) {
          return tile !== excludeTile;
        });
        const pool = candidates.length ? candidates : sequence;
        return pool[Math.floor(Math.random() * pool.length)];
      }

      const randomMoves = Math.max(8, sequence.length * 2) + Math.floor(Math.random() * 6);
      let lastTile = null;

      for (let index = 0; index < randomMoves; index += 1) {
        const nextTile = pickRandomTile(lastTile);
        steps.push(nextTile);
        lastTile = nextTile;
      }

      if (lastTile === targetTile && sequence.length > 1) {
        steps.push(pickRandomTile(targetTile));
      }
      steps.push(targetTile);

      spinning = true;
      notice.textContent = "Spin berjalan...";

      function tick() {
        clearSpinState();
        const activeTile = steps[step];
        activeTile.classList.add("is-spinning");

        if (step >= steps.length - 1) {
          window.setTimeout(function () {
            finishSpin(targetTile, rewardLabel);
          }, 120);
          return;
        }

        step += 1;
        const remainingSteps = (steps.length - 1) - step;
        const delay = remainingSteps < 3 ? 180 : (remainingSteps < 6 ? 130 : 80);
        window.setTimeout(tick, delay);
      }

      tick();
    }

    spinBtn.addEventListener("click", function () {
      spinBoard().catch(function () {
        syncControls("Spin gagal dijalankan. Coba lagi.");
      });
    });

    function syncStateFromStorage(customNotice) {
      gachaState = readStoredGachaState();
      syncControls(customNotice);
    }

    window.addEventListener("storage", function (event) {
      if (!event) return;
      if (event.key === "googleUser" || event.key === USER_GACHA_STORAGE_KEY) {
        syncStateFromStorage();
      }
    });

    window.addEventListener(USER_GACHA_EVENT, function (event) {
      gachaState = normalizeGachaState(event && event.detail);
      syncControls();
    });

    window.addEventListener("userLoggedIn", function () {
      syncStateFromStorage();
    });

    window.addEventListener("userLoggedOut", function () {
      gachaState = normalizeGachaState(null);
      resetBoard();
    });

    resetBoard();
  }

  function initIcons() {
    if (!window.lucide || typeof window.lucide.createIcons !== "function") return;
    window.lucide.createIcons({
      attrs: {
        "stroke-width": "2.1"
      }
    });
  }

  applyTheme(getResolvedTheme(), false);

  document.addEventListener("DOMContentLoaded", function () {
    ensureNavEnhancement();
    initNavCoinSync();
    initThemePreferenceSync();
    initReveal();
    tuneImages();
    initChoiceButtons();
    initEwalletConversion();
    initDiamondExperience();
    initPulsaExperience();
    initRedeemGacha();

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(initIcons, { timeout: 1200 });
    } else {
      window.setTimeout(initIcons, 32);
    }
  });
})();
