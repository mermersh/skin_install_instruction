(function () {
  const root = document.documentElement;

  // Theme
  const themeKey = "skin_install_theme";
  const saved = localStorage.getItem(themeKey);
  if (saved === "light" || saved === "dark") root.dataset.theme = "dark";

  const toggleThemeBtn = document.getElementById("toggleTheme");
  if (toggleThemeBtn) {
    toggleThemeBtn.addEventListener("click", () => {
      const next = root.dataset.theme === "light" ? "dark" : "light";
      root.dataset.theme = next;
      localStorage.setItem(themeKey, next);
    });
  }

  // Tabs
  const tabs = Array.from(document.querySelectorAll(".tab"));
  const panels = Array.from(document.querySelectorAll(".panel"));

  const panelsWrap = document.querySelector(".panels");

  function setPanelsHeight(panelEl) {
    if (!panelsWrap || !panelEl) return;

    panelsWrap.style.height = "auto"; // ←これ追加（縮むのを保証）
    panelsWrap.style.height = panelEl.scrollHeight + "px";
  }

  function activate(tabId) {
    const nextPanel = panels.find((p) => p.id === tabId);
    if (!nextPanel) return;

    // 先に高さを合わせる（ぬるっと高さも切り替わる）
    setPanelsHeight(nextPanel);

    tabs.forEach((t) => {
      const on = t.dataset.tab === tabId;
      t.classList.toggle("active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });

    panels.forEach((p) => {
      const on = p.id === tabId;
      p.classList.toggle("active", on);
      p.setAttribute("aria-hidden", on ? "false" : "true");
    });
  }

  tabs.forEach((t) => {
    t.addEventListener("click", () => activate(t.dataset.tab));
  });

  // ===== Keep .panels height synced when content changes (details open/close etc.) =====
if (typeof ResizeObserver !== "undefined") {
  const ro = new ResizeObserver(() => {
    const current = panels.find(p => p.classList.contains("active"));
    setPanelsHeight(current);
  });
  panels.forEach(p => ro.observe(p));
}

// ===== Smooth <details> open/close animation =====
const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

function setupAnimatedDetails(details) {
  const summary = details.querySelector("summary");
  if (!summary) return;

  summary.addEventListener("click", (e) => {
    // ネイティブの瞬間開閉を止めて、こちらで制御
    e.preventDefault();

    if (details.dataset.animating === "1") return;
    details.dataset.animating = "1";

    const isOpen = details.hasAttribute("open");

    // モーション軽減設定の人はアニメ無し
    if (prefersReducedMotion) {
      if (isOpen) details.removeAttribute("open");
      else details.setAttribute("open", "");
      details.dataset.animating = "0";
      const current = panels.find(p => p.classList.contains("active"));
      setPanelsHeight(current);
      return;
    }

    const startHeight = details.offsetHeight;

    if (isOpen) {
      // close: 現在高さ → summaryの高さ
      const endHeight = summary.offsetHeight+30;

      details.style.overflow = "hidden";
      details.style.height = startHeight + "px";

      const anim = details.animate(
        [{ height: startHeight + "px" }, { height: endHeight + "px" }],
        { duration: 220, easing: "ease-out" }
      );

      anim.onfinish = () => {
        details.removeAttribute("open");
        details.style.height = "";
        details.style.overflow = "";
        details.dataset.animating = "0";

        const current = panels.find(p => p.classList.contains("active"));
        setPanelsHeight(current);
      };
    } else {
      // open: summary高さ → full高さ
      details.setAttribute("open", ""); // 一旦開いて終点の高さを測る
      const endHeight = details.offsetHeight;

      details.style.overflow = "hidden";
      details.style.height = startHeight + "px";

      const anim = details.animate(
        [{ height: startHeight + "px" }, { height: endHeight + "px" }],
        { duration: 240, easing: "ease-out" }
      );

      anim.onfinish = () => {
        details.style.height = "";
        details.style.overflow = "";
        details.dataset.animating = "0";

        const current = panels.find(p => p.classList.contains("active"));
        setPanelsHeight(current);
      };
    }
  });
}

// 対象のdetailsを全部有効化（.steps 内のもの）
document.querySelectorAll(".steps details").forEach(setupAnimatedDetails);


  // 初期表示の高さを合わせる
  const activePanel = panels.find((p) => p.classList.contains("active")) || panels[0];
  setPanelsHeight(activePanel);

  // 画面サイズ変更時も高さを再計算
  window.addEventListener("resize", () => {
    const current = panels.find((p) => p.classList.contains("active"));
    setPanelsHeight(current);
  });

  // Accordion内のpanel切り替え時も高さを再計算
  panelsWrap?.addEventListener(
    "toggle",
    () => {
      const current = panels.find((p) => p.classList.contains("active"));
      setPanelsHeight(current);
    },
    true
  );

  // Search (simple filter across panels)
  const search = document.getElementById("search");
  if (search) {
    search.addEventListener("input", () => {
      const q = (search.value || "").trim().toLowerCase();
      if (!q) {
        // restore current active tab
        const activeTab = tabs.find((t) => t.classList.contains("active"));
        activate(activeTab?.dataset.tab || "bedrock-pc");
        return;
      }
      // find first panel that matches keywords
      const hit = panels.find((p) => (p.dataset.keywords || "").toLowerCase().includes(q));
      if (hit) activate(hit.id);
    });
  }

  // Copy template
  const copyBtn = document.getElementById("copyTemplate");
  const template = document.getElementById("templateText");
  if (copyBtn && template) {
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(template.textContent);
        const old = copyBtn.textContent;
        copyBtn.textContent = "コピーしました！";
        setTimeout(() => (copyBtn.textContent = old), 900);
      } catch {
        alert("コピーに失敗しました。ブラウザの権限設定を確認してください。");
      }
    });
  }
})();
