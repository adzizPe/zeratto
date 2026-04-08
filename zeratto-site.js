(function () {
  "use strict";

  function createNavIcon(name) {
    return '<i data-lucide="' + name + '"></i>';
  }

  function ensureBrandCopy(brand) {
    if (!brand || brand.querySelector(".zr-brand-copy")) return;

    const copy = document.createElement("span");
    copy.className = "zr-brand-copy";
    copy.innerHTML = "<strong>Zeratto</strong><small>Snack & chocolate</small>";
    brand.appendChild(copy);
  }

  function resolveNavIcon(href) {
    const target = String(href || "").toLowerCase();
    if (target === "./" || target === "/" || target === "index.html") return "house";
    if (target.indexOf("produk") !== -1) return "shopping-bag";
    if (target.indexOf("redeem") !== -1) return "ticket";
    if (target.indexOf("tukar") !== -1) return "gem";
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
    navInner.classList.add("zr-nav-slider-shell");
    navMenu.classList.add("zr-nav-slider");

    navMenu.querySelectorAll(".zr-nav-link").forEach(function (link) {
      link.innerHTML = createNavIcon(resolveNavIcon(link.getAttribute("href"))) + "<span>" + link.textContent.trim() + "</span>";
    });

    function centerActiveLink() {
      if (window.innerWidth > 860) return;

      const activeLink = navMenu.querySelector(".zr-nav-link.active");
      if (!activeLink || typeof activeLink.scrollIntoView !== "function") return;

      activeLink.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center"
      });
    }

    window.setTimeout(centerActiveLink, 80);
    window.addEventListener("resize", centerActiveLink);
  }

  function initReveal() {
    const items = Array.from(document.querySelectorAll(".zr-reveal"));
    if (!items.length) return;

    if (!("IntersectionObserver" in window)) {
      items.forEach(function (item) {
        item.classList.add("is-visible");
      });
      return;
    }

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.16,
      rootMargin: "0px 0px -10% 0px"
    });

    items.forEach(function (item) {
      observer.observe(item);
    });
  }

  function initIcons() {
    if (!window.lucide || typeof window.lucide.createIcons !== "function") return;
    window.lucide.createIcons({
      attrs: {
        "stroke-width": "2.1"
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    ensureNavEnhancement();
    initReveal();
    initIcons();
  });
})();
