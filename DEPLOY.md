# 個人聲明網站上線說明

這個版本已經改成可部署、可接 Supabase 線上資料庫的靜態網站。部署後，手機與電腦都能在連網狀態下透過公開網址順暢打開。

## 檔案用途

- `index.html`：網站頁面。
- `styles.css`：精緻版響應式設計，手機與桌機都適用。
- `app.js`：內容渲染、搜尋篩選、圖片展示、編輯器、Supabase 同步。
- `config.js`：填入 Supabase 連線設定。
- `config.example.js`：設定範例。
- `supabase-schema.sql`：Supabase 資料表與權限設定。

## 重要提醒

目前我不能直接替你建立 Supabase 專案或部署到你的帳號，因為那需要你的帳號登入與專案金鑰。你建立好 Supabase 專案後，把 `Project URL` 和 `anon public key` 給我，或自己填進 `config.js`，網站就能接上線上資料庫。

圖片請使用你自己的真實照片、文件截圖或可公開資料。不要放無法公開、涉及隱私或可能造成爭議的圖片。

## Supabase 設定

1. 到 Supabase 建立新專案。
2. 進入 SQL Editor。
3. 把 `supabase-schema.sql` 的內容貼上並執行。
4. 到 Project Settings → API。
5. 複製 `Project URL` 和 `anon public key`。
6. 修改 `config.js`：

```js
window.SITE_CONFIG = {
  supabaseUrl: "https://你的專案.supabase.co",
  supabaseAnonKey: "你的 Supabase anon public key"
};
```

## 關於線上編輯安全

`supabase-schema.sql` 目前包含一個最簡單的匿名寫入 policy，這能讓網站裡的「編輯」功能直接同步到資料庫，但安全性不高，因為公開網站上的 anon key 任何人都能看到。

正式公開時，我建議二選一：

1. 安全穩定版：關閉匿名寫入，只在 Supabase 後台修改內容。
2. 後台登入版：加入 Supabase Auth，只有你登入後才能修改。

如果這個聲明很重要，建議使用第 2 種。

## 部署到網路

### GitHub Pages

1. 建立 GitHub repository。
2. 上傳 `index.html`、`styles.css`、`app.js`、`config.js`。
3. 到 Settings → Pages。
4. Source 選 `Deploy from a branch`。
5. Branch 選 `main`，資料夾選 `/root`。
6. 儲存後等待 GitHub 給你公開網址。

### Netlify / Vercel / Cloudflare Pages

1. 新增專案。
2. 匯入 GitHub repository，或直接拖曳整個資料夾。
3. Build command 留空。
4. Publish directory 選根目錄。
5. 部署後會得到公開網址。

## 加入圖片

目前網站支援兩種圖片：

- 封面圖片：在「編輯」裡填入封面圖片網址。
- 相關圖片：按「新增圖片」，填入圖片網址與說明。
- 單則聲明圖片：每則聲明也可以填入自己的圖片網址。

如果你使用 Supabase Storage、Cloudinary、Imgur、GitHub raw file 或自己的主機圖片網址，都可以貼到欄位裡。

## 管理入口

公開網址一般只顯示瀏覽頁。需要編輯時，在網址後面加上 `#admin`：

```text
https://你的網站網址/#admin
```

進入管理模式後，頁面頂部會出現「編輯」按鈕。修改內容後會自動寫回 Supabase 的 `public.site_content`。

目前這是簡單管理入口，不是真正登入系統。因為目前 RLS policy 允許 anon key 寫入，正式公開後建議改成 Supabase Auth 管理員登入，或關閉 anon 寫入、只在 Supabase 後台修改內容。
