const STORAGE_KEY = "personal-statement-site-v2";
const THEME_KEY = "personal-statement-theme";
const REMOTE_ROW_ID = "default";
const ADMIN_HASH = '#hbad-admin-2026';
const STORAGE_BUCKET = "site-images";
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const seedState = {
  title: "劉雅娜女士公開聲明",
  intro: "針對近期 Facebook／臉書平台不實言論、身份冒充及相關誤導資訊，集中發布正式說明。",
  heroImage: "",
  heroCaption: "正式公開聲明與身份核實資料集中存放。",
  viewCount: 3826,
  navCards: [
    {
      number: "01",
      title: "公開聲明",
      description: "集中說明 Facebook／臉書平台上針對劉雅娜女士的不實言論、片面截圖與惡意詆毀，避免外界被錯誤資訊誤導。"
    },
    {
      number: "02",
      title: "感情說明",
      description: "補充說明劉雅娜女士與粘連全男士之間的穩定感情關係，並表明不接受第三方介入、干擾或惡意挑撥。"
    },
    {
      number: "03",
      title: "身份核實",
      description: "確認劉雅娜女士本人可使用的正式聯絡方式，提醒外界謹慎辨別真偽，防止他人冒充。"
    }
  ],
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
      body: "如需聯絡本人，請使用你希望公開的電子郵件、社群連結或其他正式管道。若不想公開聯絡方式，也可以刪除此則。",
      imageUrl: "",
      imageCaption: "",
      featured: false
    }
  ]
};

let state = loadLocalState();
let activeCategory = "全部";
let saveTimer;
let currentSession = null;

const siteConfig = window.SITE_CONFIG || {};
const supabaseClient = window.supabase && isRemoteConfigured()
  ? window.supabase.createClient(siteConfig.supabaseUrl, siteConfig.supabaseAnonKey)
  : null;

const els = {
  brandName: document.querySelector("#brandName"),
  siteTitle: document.querySelector("#siteTitle"),
  siteIntro: document.querySelector("#siteIntro"),
  heroImage: document.querySelector("#heroImage"),
  heroCaption: document.querySelector("#heroCaption"),
  lastUpdated: document.querySelector("#lastUpdated"),
  viewCount: document.querySelector("#viewCount"),
  statementCount: document.querySelector("#statementCount"),
  navCardList: document.querySelector("#navCardList"),
  imageCount: document.querySelector("#imageCount"),
  adminToggle: document.querySelector("#adminToggle"),
  adminPanel: document.querySelector("#adminPanel"),
  exitAdmin: document.querySelector("#exitAdmin"),
  loginPanel: document.querySelector("#loginPanel"),
  loginForm: document.querySelector("#loginForm"),
  loginEmail: document.querySelector("#loginEmail"),
  loginPassword: document.querySelector("#loginPassword"),
  loginStatus: document.querySelector("#loginStatus"),
  imageUploadInput: document.querySelector("#imageUploadInput"),
  logoutButton: document.querySelector("#logoutButton"),
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
  navCardEditorList: document.querySelector("#navCardEditorList"),
  addAnnouncement: document.querySelector("#addAnnouncement"),
  addImage: document.querySelector("#addImage"),
  exportData: document.querySelector("#exportData"),
  importData: document.querySelector("#importData"),
  resetData: document.querySelector("#resetData"),
  editorList: document.querySelector("#editorList"),
  imageEditorList: document.querySelector("#imageEditorList"),
  saveStatus: document.querySelector("#saveStatus"),
  announcementTemplate: document.querySelector("#announcementTemplate"),
  navCardTemplate: document.querySelector("#navCardTemplate"),
  imageTemplate: document.querySelector("#imageTemplate"),
  editorTemplate: document.querySelector("#editorTemplate"),
  navCardEditorTemplate: document.querySelector("#navCardEditorTemplate"),
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
  const viewCount = Number(raw.viewCount);
  return {
    title: raw.title || seedState.title,
    intro: raw.intro || seedState.intro,
    heroImage: raw.heroImage || "",
    heroCaption: raw.heroCaption || seedState.heroCaption,
    viewCount: Number.isFinite(viewCount) ? viewCount : seedState.viewCount,
    navCards: normalizeNavCards(raw.navCards),
    images: Array.isArray(raw.images) ? raw.images : seedState.images,
    announcements: Array.isArray(raw.announcements) ? raw.announcements : seedState.announcements
  };
}

function normalizeNavCards(cards) {
  if (!Array.isArray(cards) || !cards.length) return structuredClone(seedState.navCards);
  return seedState.navCards.map((fallback, index) => {
    const item = cards[index] || {};
    return {
      number: item.number || fallback.number,
      title: item.title || fallback.title,
      description: item.description || fallback.description
    };
  });
}

function isRemoteConfigured() {
  return Boolean(siteConfig.supabaseUrl && siteConfig.supabaseAnonKey);
}

function remoteHeaders({ authenticated = false } = {}) {
  const token = authenticated ? currentSession?.access_token : siteConfig.supabaseAnonKey;
  return {
    apikey: siteConfig.supabaseAnonKey,
    Authorization: `Bearer ${token}`,
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
      setStatus("資料庫目前沒有內容，登入管理員後可建立。");
    }
  } catch (error) {
    setStatus(`資料庫讀取失敗，暫用本機內容：${error.message}`);
  }
}

async function fetchRemoteViewCount() {
  if (!isRemoteConfigured()) return null;

  try {
    const endpoint = `${siteConfig.supabaseUrl}/rest/v1/site_content?id=eq.${REMOTE_ROW_ID}&select=content&limit=1`;
    const response = await fetch(endpoint, { headers: remoteHeaders() });
    if (!response.ok) return null;
    const rows = await response.json();
    const viewCount = Number(rows[0]?.content?.viewCount);
    return Number.isFinite(viewCount) ? viewCount : null;
  } catch {
    return null;
  }
}

async function saveRemoteState() {
  if (!isRemoteConfigured()) return;
  if (!currentSession?.access_token) {
    throw new Error("請先登入管理員帳號");
  }

  const remoteViewCount = await fetchRemoteViewCount();
  const content = { ...state };
  if (Number.isFinite(remoteViewCount)) {
    content.viewCount = Math.max(Number(state.viewCount) || 0, remoteViewCount);
    state.viewCount = content.viewCount;
  }

  const endpoint = `${siteConfig.supabaseUrl}/rest/v1/site_content?on_conflict=id`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      ...remoteHeaders({ authenticated: true }),
      Prefer: "resolution=merge-duplicates"
    },
    body: JSON.stringify({
      id: REMOTE_ROW_ID,
      content,
      updated_at: new Date().toISOString()
    })
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
}

async function incrementViewCount() {
  if (!isRemoteConfigured()) return;

  try {
    const endpoint = `${siteConfig.supabaseUrl}/rest/v1/rpc/increment_site_view_count`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: remoteHeaders(),
      body: JSON.stringify({ row_id: REMOTE_ROW_ID })
    });
    if (!response.ok) return;

    const value = await response.json();
    const nextCount = Array.isArray(value) ? Number(value[0]) : Number(value);
    if (Number.isFinite(nextCount)) {
      state.viewCount = nextCount;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      renderViewCount();
    }
  } catch {
    renderViewCount();
  }
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
  const isAdminRoute = window.location.hash === ADMIN_HASH;
  return isAdminRoute;
}

function renderAdminMode() {
  const isAdminRoute = window.location.hash === ADMIN_HASH;
  const signedIn = Boolean(currentSession);
  document.documentElement.dataset.adminRoute = String(isAdminRoute);
  document.documentElement.dataset.adminAuthenticated = String(signedIn);

  if (!isAdminRoute) {
    els.adminPanel.hidden = true;
    els.adminToggle.hidden = true;
    els.adminToggle.disabled = true;
    els.loginPanel.hidden = true;
    if (els.dialog.open) els.dialog.close();
    return;
  }

  els.loginPanel.hidden = signedIn;
  els.adminPanel.hidden = !signedIn;
  els.adminToggle.hidden = !signedIn;
  els.adminToggle.disabled = !signedIn;
}

function setLoginStatus(message) {
  els.loginStatus.textContent = message;
}

function publicText(value) {
  return String(value || "").replaceAll("Email", "電子郵件");
}

async function syncSession() {
  if (!supabaseClient) {
    currentSession = null;
    setLoginStatus("Supabase Auth 尚未設定。");
    renderAdminMode();
    return;
  }

  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    currentSession = null;
    setLoginStatus(error.message);
  } else {
    currentSession = data.session;
    if (currentSession) setLoginStatus(`已登入：${currentSession.user.email}`);
  }
  renderAdminMode();
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

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(Number(value) || 0);
}

function displayTitle() {
  const title = state.title || seedState.title;
  return title === "劉雅娜女士個人聲明" ? "劉雅娜女士公開聲明" : title;
}

function sortedAnnouncements() {
  return [...state.announcements].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return (b.date || "").localeCompare(a.date || "");
  });
}

function render() {
  els.brandName.textContent = displayTitle();
  els.siteTitle.textContent = displayTitle();
  els.siteIntro.textContent = publicText(state.intro);
  els.heroCaption.textContent = publicText(state.heroCaption);
  els.statementCount.textContent = `${state.announcements.length} 則聲明`;
  renderViewCount();
  renderNavCards();
  renderHeroImage();
  renderLastUpdated();
  renderFilters();
  renderFeatured();
  renderImages();
  renderAnnouncements();
}

function renderViewCount() {
  els.viewCount.textContent = `已瀏覽 ${formatNumber(state.viewCount)} 次`;
}

function renderNavCards() {
  els.navCardList.innerHTML = "";
  state.navCards.forEach((item) => {
    const node = els.navCardTemplate.content.cloneNode(true);
    node.querySelector(".summary-number").textContent = item.number;
    node.querySelector("strong").textContent = item.title;
    node.querySelector("p").textContent = publicText(item.description);
    els.navCardList.append(node);
  });
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
    els.featuredBody.textContent = publicText(featured.body || "尚未填寫聲明內容。");
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
    node.querySelector("figcaption").textContent = publicText(item.caption || "相關圖片");
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
    node.querySelector("p").textContent = publicText(item.body || "尚未填寫聲明內容。");

    const imageFigure = node.querySelector(".card-image");
    if (item.imageUrl) {
      imageFigure.hidden = false;
      imageFigure.querySelector("img").src = item.imageUrl;
      imageFigure.querySelector("img").alt = item.imageCaption || item.title || "聲明圖片";
      imageFigure.querySelector("figcaption").textContent = publicText(item.imageCaption || "聲明相關圖片");
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
  renderNavCardEditor();
  renderImageEditor();
  renderStatementEditor();
}

function renderNavCardEditor() {
  els.navCardEditorList.innerHTML = "";

  state.navCards.forEach((item, index) => {
    const node = els.navCardEditorTemplate.content.cloneNode(true);
    const card = node.querySelector(".edit-card");
    node.querySelector(".edit-index").textContent = `導覽卡片 ${index + 1}`;
    node.querySelector(".edit-nav-number").value = item.number || "";
    node.querySelector(".edit-nav-title").value = item.title || "";
    node.querySelector(".edit-nav-description").value = item.description || "";

    card.addEventListener("input", (event) => {
      const target = event.target;
      if (target.classList.contains("edit-nav-number")) item.number = target.value;
      if (target.classList.contains("edit-nav-title")) item.title = target.value;
      if (target.classList.contains("edit-nav-description")) item.description = target.value;
      saveState();
      render();
    });

    els.navCardEditorList.append(node);
  });
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

function extensionFor(file) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName === "jpg" || fromName === "jpeg" || fromName === "png" || fromName === "webp") {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

async function uploadImages(files) {
  if (!currentSession) {
    setStatus("請先登入管理員帳號。");
    return;
  }
  if (!supabaseClient) {
    setStatus("Supabase 尚未載入。");
    return;
  }

  const validFiles = [...files].filter((file) => ALLOWED_IMAGE_TYPES.includes(file.type));
  if (!validFiles.length) {
    setStatus("請選擇 jpg、jpeg、png 或 webp 圖片。");
    return;
  }

  setStatus(`正在上傳 ${validFiles.length} 張圖片...`);
  const uploaded = [];

  for (const file of validFiles) {
    const ext = extensionFor(file);
    const random = Math.random().toString(36).slice(2, 10);
    const path = `${Date.now()}-${random}.${ext}`;
    const { error } = await supabaseClient.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false
      });

    if (error) throw new Error(error.message);

    const { data } = supabaseClient.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    uploaded.push({
      url: data.publicUrl,
      caption: file.name.replace(/\.[^.]+$/, "") || "上傳圖片"
    });
  }

  state.images = [...uploaded, ...state.images];
  saveState();
  render();
  renderEditor();
  setStatus(`已上傳 ${uploaded.length} 張圖片，正在同步內容...`);
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
  if (!currentSession) {
    setLoginStatus("請先登入管理員帳號。");
    return;
  }
  renderEditor();
  els.dialog.showModal();
});

els.titleEditor.addEventListener("input", updateSiteBasics);
els.introEditor.addEventListener("input", updateSiteBasics);
els.heroImageEditor.addEventListener("input", updateSiteBasics);
els.heroCaptionEditor.addEventListener("input", updateSiteBasics);
els.addAnnouncement.addEventListener("click", addAnnouncement);
els.addImage.addEventListener("click", addImage);
els.imageUploadInput.addEventListener("change", async (event) => {
  try {
    await uploadImages(event.target.files);
  } catch (error) {
    setStatus(`圖片上傳失敗：${error.message}`);
  } finally {
    event.target.value = "";
  }
});
els.exportData.addEventListener("click", exportContent);
els.importData.addEventListener("change", (event) => importContent(event.target.files[0]));
els.resetData?.addEventListener("click", resetContent);
els.searchInput.addEventListener("input", renderAnnouncements);

els.themeToggle.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem(THEME_KEY, nextTheme);
});

els.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabaseClient) {
    setLoginStatus("Supabase Auth 尚未載入，請確認網路或 CDN。");
    return;
  }

  setLoginStatus("登入中...");
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: els.loginEmail.value.trim(),
    password: els.loginPassword.value
  });

  if (error) {
    currentSession = null;
    setLoginStatus(error.message);
  } else {
    currentSession = data.session;
    els.loginPassword.value = "";
    setLoginStatus(`已登入：${currentSession.user.email}`);
  }
  renderAdminMode();
});

els.logoutButton.addEventListener("click", async () => {
  if (supabaseClient) await supabaseClient.auth.signOut();
  currentSession = null;
  setLoginStatus("已登出。");
  renderAdminMode();
});

async function init() {
  initTheme();
  await syncSession();
  if (supabaseClient) {
    supabaseClient.auth.onAuthStateChange((_event, session) => {
      currentSession = session;
      renderAdminMode();
    });
  }
  render();
  await loadRemoteState();
  render();
  if (!isAdminMode()) await incrementViewCount();
}

window.addEventListener("hashchange", renderAdminMode);

els.exitAdmin.addEventListener("click", () => {
  window.location.hash = "";
  renderAdminMode();
});

init();
