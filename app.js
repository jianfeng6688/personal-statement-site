const STORAGE_KEY = "personal-statement-site-v2";
const THEME_KEY = "personal-statement-theme";
const REMOTE_ROW_ID = "default";

const seedState = {
  title: "個人聲明",
  intro: "此頁用於集中發布本人公開聲明、補充說明與必要資料，避免資訊分散造成誤解。",
  heroImage: "",
  heroCaption: "請替換為本人提供的真實照片、文件截圖或正式封面圖。",
  images: [
    {
      url: "",
      caption: "可放入本人提供的真實照片或文件截圖"
    },
    {
      url: "",
      caption: "可放入時間線、對話截圖或其他可公開資料"
    }
  ],
  announcements: [
    {
      title: "關於近期事件的個人聲明",
      date: "2026-06-07",
      category: "正式聲明",
      body: "本人在此就近期相關事項作出說明。後續內容可依實際情況修改，建議保持事實清楚、語氣克制，並保留必要的時間與背景資訊。",
      imageUrl: "",
      imageCaption: "",
      featured: true
    },
    {
      title: "補充說明",
      date: "2026-06-07",
      category: "補充",
      body: "若日後需要補充證明、時間線或回應外界疑問，可以新增一則聲明，讓讀者依日期查看完整脈絡。",
      imageUrl: "",
      imageCaption: "",
      featured: false
    },
    {
      title: "聯絡方式",
      date: "2026-06-07",
      category: "聯絡",
      body: "如需聯絡本人，請使用你希望公開的 Email、社群連結或其他正式管道。若不想公開聯絡方式，也可以刪除此則。",
      imageUrl: "",
      imageCaption: "",
      featured: false
    }
  ]
};

let state = loadLocalState();
let activeCategory = "全部";
let saveTimer;

const siteConfig = window.SITE_CONFIG || {};

const els = {
  brandName: document.querySelector("#brandName"),
  siteTitle: document.querySelector("#siteTitle"),
  siteIntro: document.querySelector("#siteIntro"),
  heroImage: document.querySelector("#heroImage"),
  heroCaption: document.querySelector("#heroCaption"),
  lastUpdated: document.querySelector("#lastUpdated"),
  statementCount: document.querySelector("#statementCount"),
  imageCount: document.querySelector("#imageCount"),
  adminToggle: document.querySelector("#adminToggle"),
  adminEntry: document.querySelector("#adminEntry"),
  adminBanner: document.querySelector("#adminBanner"),
  exitAdmin: document.querySelector("#exitAdmin"),
  themeToggle: document.querySelector("#themeToggle"),
  searchInput: document.querySelector("#searchInput"),
  categoryFilters: document.querySelector("#categoryFilters"),
  featuredTitle: document.querySelector("#featuredTitle"),
  featuredBody: document.querySelector("#featuredBody"),
  featuredDate: document.querySelector("#featuredDate"),
  featuredCategory: document.querySelector("#featuredCategory"),
  resultCount: document.querySelector("#resultCount"),
  list: document.querySelector("#announcementList"),
  imageList: document.querySelector("#imageList"),
  emptyState: document.querySelector("#emptyState"),
  dialog: document.querySelector("#editorDialog"),
  titleEditor: document.querySelector("#titleEditor"),
  introEditor: document.querySelector("#introEditor"),
  heroImageEditor: document.querySelector("#heroImageEditor"),
  heroCaptionEditor: document.querySelector("#heroCaptionEditor"),
  addAnnouncement: document.querySelector("#addAnnouncement"),
  addImage: document.querySelector("#addImage"),
  exportData: document.querySelector("#exportData"),
  importData: document.querySelector("#importData"),
  resetData: document.querySelector("#resetData"),
  editorList: document.querySelector("#editorList"),
  imageEditorList: document.querySelector("#imageEditorList"),
  saveStatus: document.querySelector("#saveStatus"),
  announcementTemplate: document.querySelector("#announcementTemplate"),
  imageTemplate: document.querySelector("#imageTemplate"),
  editorTemplate: document.querySelector("#editorTemplate"),
  imageEditorTemplate: document.querySelector("#imageEditorTemplate")
};

function loadLocalState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return structuredClone(seedState);

  try {
    return normalizeState(JSON.parse(stored));
  } catch {
    return structuredClone(seedState);
  }
}

function normalizeState(raw) {
  return {
    title: raw.title || seedState.title,
    intro: raw.intro || seedState.intro,
    heroImage: raw.heroImage || "",
    heroCaption: raw.heroCaption || seedState.heroCaption,
    images: Array.isArray(raw.images) ? raw.images : seedState.images,
    announcements: Array.isArray(raw.announcements) ? raw.announcements : seedState.announcements
  };
}

function isRemoteConfigured() {
  return Boolean(siteConfig.supabaseUrl && siteConfig.supabaseAnonKey);
}

function remoteHeaders() {
  return {
    apikey: siteConfig.supabaseAnonKey,
    Authorization: `Bearer ${siteConfig.supabaseAnonKey}`,
    "Content-Type": "application/json"
  };
}

async function loadRemoteState() {
  if (!isRemoteConfigured()) {
    setStatus("線上資料庫尚未設定，目前使用本機暫存。");
    return;
  }

  try {
    const endpoint = `${siteConfig.supabaseUrl}/rest/v1/site_content?id=eq.${REMOTE_ROW_ID}&select=content,updated_at&limit=1`;
    const response = await fetch(endpoint, { headers: remoteHeaders() });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const rows = await response.json();

    if (rows[0]?.content) {
      state = normalizeState(rows[0].content);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setStatus(`已連線資料庫，最後同步 ${formatDateTime(rows[0].updated_at)}`);
    } else {
      await saveRemoteState();
      setStatus("已建立線上資料內容。");
    }
  } catch (error) {
    setStatus(`資料庫讀取失敗，暫用本機內容：${error.message}`);
  }
}

async function saveRemoteState() {
  if (!isRemoteConfigured()) return;

  const endpoint = `${siteConfig.supabaseUrl}/rest/v1/site_content?on_conflict=id`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      ...remoteHeaders(),
      Prefer: "resolution=merge-duplicates"
    },
    body: JSON.stringify({
      id: REMOTE_ROW_ID,
      content: state,
      updated_at: new Date().toISOString()
    })
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  setStatus(isRemoteConfigured() ? "正在同步線上資料庫..." : "已儲存在此瀏覽器，尚未連接線上資料庫。");

  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      await saveRemoteState();
      if (isRemoteConfigured()) setStatus(`已同步 ${formatTime(new Date())}`);
    } catch (error) {
      setStatus(`線上同步失敗：${error.message}`);
    }
  }, 650);
}

function setStatus(message) {
  els.saveStatus.textContent = message;
}

function isAdminMode() {
  return window.location.hash === "#admin";
}

function renderAdminMode() {
  const active = isAdminMode();
  document.querySelectorAll(".admin-only").forEach((element) => {
    element.hidden = !active;
  });
  els.adminEntry.hidden = active;
}

function formatDate(dateString) {
  if (!dateString) return "未設定日期";
  return new Intl.DateTimeFormat("zh-Hant", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(`${dateString}T00:00:00`));
}

function formatDateTime(value) {
  if (!value) return "未知時間";
  return new Intl.DateTimeFormat("zh-Hant", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatTime(date) {
  return new Intl.DateTimeFormat("zh-Hant", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function sortedAnnouncements() {
  return [...state.announcements].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return (b.date || "").localeCompare(a.date || "");
  });
}

function render() {
  els.brandName.textContent = state.title;
  els.siteTitle.textContent = state.title;
  els.siteIntro.textContent = state.intro;
  els.heroCaption.textContent = state.heroCaption || "";
  els.statementCount.textContent = `${state.announcements.length} 則聲明`;
  renderHeroImage();
  renderLastUpdated();
  renderFilters();
  renderFeatured();
  renderImages();
  renderAnnouncements();
}

function renderHeroImage() {
  if (state.heroImage) {
    els.heroImage.src = state.heroImage;
    els.heroImage.alt = state.heroCaption || "個人聲明封面圖片";
  } else {
    els.heroImage.removeAttribute("src");
    els.heroImage.alt = "";
  }
}

function renderLastUpdated() {
  const newest = sortedAnnouncements()[0]?.date;
  els.lastUpdated.textContent = newest ? `最近更新 ${formatDate(newest)}` : "尚未發布";
}

function renderFilters() {
  const categories = ["全部", ...new Set(state.announcements.map((item) => item.category || "未分類"))];
  if (!categories.includes(activeCategory)) activeCategory = "全部";

  els.categoryFilters.innerHTML = "";
  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `filter-chip${category === activeCategory ? " active" : ""}`;
    button.textContent = category;
    button.addEventListener("click", () => {
      activeCategory = category;
      render();
    });
    els.categoryFilters.append(button);
  });
}

function renderFeatured() {
  const featured = sortedAnnouncements()[0];
  if (!featured) {
    els.featuredTitle.textContent = "尚無聲明";
    els.featuredBody.textContent = "點選右上角的編輯新增第一則內容。";
    els.featuredDate.textContent = "";
    els.featuredCategory.textContent = "";
    return;
  }

  els.featuredTitle.textContent = featured.title || "未命名聲明";
  els.featuredBody.textContent = featured.body || "尚未填寫聲明內容。";
  els.featuredDate.textContent = formatDate(featured.date);
  els.featuredCategory.textContent = featured.category || "未分類";
}

function renderImages() {
  const images = state.images.filter((item) => item.url);
  els.imageList.innerHTML = "";
  els.imageCount.textContent = `${images.length} 張`;

  if (!images.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "尚未加入圖片。請放入你自己的真實照片、文件截圖或可公開資料。";
    els.imageList.append(empty);
    return;
  }

  images.forEach((item) => {
    const node = els.imageTemplate.content.cloneNode(true);
    node.querySelector("img").src = item.url;
    node.querySelector("img").alt = item.caption || "相關圖片";
    node.querySelector("figcaption").textContent = item.caption || "相關圖片";
    els.imageList.append(node);
  });
}

function renderAnnouncements() {
  const query = els.searchInput.value.trim().toLowerCase();
  const filtered = sortedAnnouncements().filter((item) => {
    const haystack = `${item.title} ${item.body} ${item.category} ${item.date}`.toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    const matchesCategory = activeCategory === "全部" || (item.category || "未分類") === activeCategory;
    return matchesQuery && matchesCategory;
  });

  els.list.innerHTML = "";
  filtered.forEach((item) => {
    const node = els.announcementTemplate.content.cloneNode(true);
    node.querySelector(".category").textContent = item.category || "未分類";
    node.querySelector("time").textContent = formatDate(item.date);
    node.querySelector("h3").textContent = item.title || "未命名聲明";
    node.querySelector("p").textContent = item.body || "尚未填寫聲明內容。";

    const imageFigure = node.querySelector(".card-image");
    if (item.imageUrl) {
      imageFigure.hidden = false;
      imageFigure.querySelector("img").src = item.imageUrl;
      imageFigure.querySelector("img").alt = item.imageCaption || item.title || "聲明圖片";
      imageFigure.querySelector("figcaption").textContent = item.imageCaption || "聲明相關圖片";
    }

    els.list.append(node);
  });

  els.resultCount.textContent = `${filtered.length} 則`;
  els.emptyState.hidden = filtered.length > 0;
}

function renderEditor() {
  els.titleEditor.value = state.title;
  els.introEditor.value = state.intro;
  els.heroImageEditor.value = state.heroImage;
  els.heroCaptionEditor.value = state.heroCaption;
  renderImageEditor();
  renderStatementEditor();
}

function renderImageEditor() {
  els.imageEditorList.innerHTML = "";

  state.images.forEach((item, index) => {
    const node = els.imageEditorTemplate.content.cloneNode(true);
    const card = node.querySelector(".edit-card");
    node.querySelector(".edit-index").textContent = `圖片 ${index + 1}`;
    node.querySelector(".edit-url").value = item.url || "";
    node.querySelector(".edit-caption").value = item.caption || "";

    card.addEventListener("input", (event) => {
      const target = event.target;
      if (target.classList.contains("edit-url")) item.url = target.value;
      if (target.classList.contains("edit-caption")) item.caption = target.value;
      saveState();
      render();
    });

    node.querySelector(".remove-button").addEventListener("click", () => {
      state.images.splice(index, 1);
      saveState();
      render();
      renderEditor();
    });

    els.imageEditorList.append(node);
  });
}

function renderStatementEditor() {
  els.editorList.innerHTML = "";

  state.announcements.forEach((item, index) => {
    const node = els.editorTemplate.content.cloneNode(true);
    const card = node.querySelector(".edit-card");
    node.querySelector(".edit-index").textContent = `聲明 ${index + 1}`;
    node.querySelector(".edit-title").value = item.title || "";
    node.querySelector(".edit-date").value = item.date || "";
    node.querySelector(".edit-category").value = item.category || "";
    node.querySelector(".edit-body").value = item.body || "";
    node.querySelector(".edit-image").value = item.imageUrl || "";
    node.querySelector(".edit-image-caption").value = item.imageCaption || "";
    node.querySelector(".edit-featured").checked = Boolean(item.featured);

    card.addEventListener("input", (event) => {
      const target = event.target;
      if (target.classList.contains("edit-title")) item.title = target.value;
      if (target.classList.contains("edit-date")) item.date = target.value;
      if (target.classList.contains("edit-category")) item.category = target.value;
      if (target.classList.contains("edit-body")) item.body = target.value;
      if (target.classList.contains("edit-image")) item.imageUrl = target.value;
      if (target.classList.contains("edit-image-caption")) item.imageCaption = target.value;
      if (target.classList.contains("edit-featured")) item.featured = target.checked;
      saveState();
      render();
    });

    node.querySelector(".remove-button").addEventListener("click", () => {
      state.announcements.splice(index, 1);
      saveState();
      render();
      renderEditor();
    });

    els.editorList.append(node);
  });
}

function addAnnouncement() {
  state.announcements.unshift({
    title: "新的聲明",
    date: new Date().toISOString().slice(0, 10),
    category: "一般",
    body: "請在這裡輸入聲明內容。",
    imageUrl: "",
    imageCaption: "",
    featured: false
  });
  saveState();
  render();
  renderEditor();
}

function addImage() {
  state.images.unshift({
    url: "",
    caption: "請輸入圖片說明"
  });
  saveState();
  render();
  renderEditor();
}

function exportContent() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "personal-statement-content.json";
  link.click();
  URL.revokeObjectURL(url);
}

function importContent(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const imported = normalizeState(JSON.parse(reader.result));
      state = imported;
      saveState();
      render();
      renderEditor();
    } catch {
      setStatus("匯入失敗，請確認 JSON 格式。");
    }
  });
  reader.readAsText(file);
}

function resetContent() {
  state = structuredClone(seedState);
  activeCategory = "全部";
  saveState();
  render();
  renderEditor();
}

function updateSiteBasics() {
  state.title = els.titleEditor.value || "個人聲明";
  state.intro = els.introEditor.value || seedState.intro;
  state.heroImage = els.heroImageEditor.value;
  state.heroCaption = els.heroCaptionEditor.value || seedState.heroCaption;
  saveState();
  render();
}

function initTheme() {
  const theme = localStorage.getItem(THEME_KEY) || "light";
  document.documentElement.dataset.theme = theme;
}

els.adminToggle.addEventListener("click", () => {
  renderEditor();
  els.dialog.showModal();
});

els.titleEditor.addEventListener("input", updateSiteBasics);
els.introEditor.addEventListener("input", updateSiteBasics);
els.heroImageEditor.addEventListener("input", updateSiteBasics);
els.heroCaptionEditor.addEventListener("input", updateSiteBasics);
els.addAnnouncement.addEventListener("click", addAnnouncement);
els.addImage.addEventListener("click", addImage);
els.exportData.addEventListener("click", exportContent);
els.importData.addEventListener("change", (event) => importContent(event.target.files[0]));
els.resetData.addEventListener("click", resetContent);
els.searchInput.addEventListener("input", renderAnnouncements);

els.themeToggle.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem(THEME_KEY, nextTheme);
});

async function init() {
  initTheme();
  renderAdminMode();
  render();
  await loadRemoteState();
  render();
}

window.addEventListener("hashchange", renderAdminMode);

els.exitAdmin.addEventListener("click", () => {
  window.location.hash = "";
  renderAdminMode();
});

init();
