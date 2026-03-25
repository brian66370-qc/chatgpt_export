# ChatGPT Markdown Exporter

Chrome extension for exporting the currently open ChatGPT conversation to a local Markdown file.

## English

### Features

- Works on `chatgpt.com` and `chat.openai.com`
- Reads the currently visible conversation from the active ChatGPT tab
- Exports the conversation as a local `.md` file
- Preserves basic structure including headings, links, inline code, and code blocks
- Includes bilingual popup text with English as the default language

### Installation

1. Open Chrome and go to `chrome://extensions`
2. Turn on `Developer mode`
3. Click `Load unpacked`
4. Select this folder

### Usage

1. Open a ChatGPT conversation page
2. Click the extension icon
3. Keep `English` selected or switch to `中文`
4. Click `Export .md`
5. Choose where to save the file

### Current limitations

- The extractor depends on ChatGPT's current DOM structure, so selectors may need updates if the site changes
- It mainly exports content that is already loaded on the page, so for long chats you may need to scroll upward first
- Complex UI elements such as tables, cards, or attachment previews currently degrade to plain text

## 中文

### 功能

- 支援 `chatgpt.com` 與 `chat.openai.com`
- 讀取目前 ChatGPT 分頁中可見的對話內容
- 匯出成 `.md` 並下載到本地
- 保留基本結構，包含標題、連結、行內程式碼與程式碼區塊
- Popup 支援中英雙語，並以英文為預設

### 安裝方式

1. 打開 Chrome，前往 `chrome://extensions`
2. 開啟 `Developer mode`
3. 點選 `Load unpacked`
4. 選擇這個資料夾

### 使用方式

1. 打開一個 ChatGPT 對話頁
2. 點擊工具列上的 extension 圖示
3. 保持預設 `English` 或切換成 `中文`
4. 按下 `Export .md`
5. 選擇下載位置

### 目前限制

- 依賴 ChatGPT 當前頁面的 DOM 結構，未來若頁面改版，可能需要調整 selector
- 主要匯出目前已載入在頁面上的內容；如果很長的對話尚未完整載入，建議先向上捲動讓內容出現
- 某些複雜元件，例如表格、互動卡片、附件預覽，現在會退化成純文字
