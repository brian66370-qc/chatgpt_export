# ChatGPT Markdown Exporter

一個可本地安裝的 Chrome Extension，用來把目前開啟中的 ChatGPT 對話匯出成 Markdown 檔案。

## 功能

- 在 `chatgpt.com` 或 `chat.openai.com` 的對話頁面執行
- 讀取目前頁面可見的對話內容
- 轉成 `.md` 並下載到本地
- 保留基本結構，包含標題、連結、行內程式碼與程式碼區塊

## 安裝方式

1. 打開 Chrome，前往 `chrome://extensions`
2. 開啟右上角 `Developer mode`
3. 點選 `Load unpacked`
4. 選擇這個資料夾：`C:\Users\brian\Projects\Chatgpt_export`

## 使用方式

1. 打開一個 ChatGPT 對話頁
2. 點擊工具列上的 extension 圖示
3. 按下 `Export .md`
4. 選擇下載位置

## 目前限制

- 依賴 ChatGPT 當前頁面的 DOM 結構，未來若頁面改版，可能需要調整 selector
- 主要匯出目前已載入在頁面上的內容；如果很長的對話尚未完整載入，建議先向上捲動讓內容出現
- 某些複雜元件，例如表格、互動卡片、附件預覽，現在會退化成純文字
