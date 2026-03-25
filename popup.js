const exportButton = document.getElementById("exportButton");
const statusElement = document.getElementById("status");

function setStatus(message, isError = false) {
  statusElement.textContent = message;
  statusElement.classList.toggle("error", isError);
}

function sanitizeFilenamePart(value) {
  return (value || "chatgpt-conversation")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "chatgpt-conversation";
}

async function getActiveChatTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    throw new Error("Cannot find the active tab.");
  }
  if (!/^https:\/\/(chatgpt\.com|chat\.openai\.com)\//.test(tab.url || "")) {
    throw new Error("Open a ChatGPT conversation tab first.");
  }
  return tab;
}

function extractConversationFromPage() {
  const USER_CANDIDATE_SELECTORS = [
    '[data-message-author-role="user"]',
    '[data-testid^="user-message"]',
    'article [class*="user"]'
  ];

  const ASSISTANT_CANDIDATE_SELECTORS = [
    '[data-message-author-role="assistant"]',
    '[data-testid^="assistant-message"]',
    'article [class*="assistant"]'
  ];

  function uniqueElements(elements) {
    return [...new Set(elements.filter(Boolean))];
  }

  function getTextFromNode(node) {
    const clone = node.cloneNode(true);

    clone.querySelectorAll("button, svg, img, textarea, form").forEach((element) => {
      element.remove();
    });

    clone.querySelectorAll("pre").forEach((pre) => {
      const code = pre.querySelector("code");
      const language = code?.className.match(/language-([\w-]+)/)?.[1] || "";
      const content = code?.innerText || pre.innerText || "";
      const replacement = document.createElement("div");
      replacement.textContent = `\n\`\`\`${language}\n${content.trimEnd()}\n\`\`\`\n`;
      pre.replaceWith(replacement);
    });

    clone.querySelectorAll("code").forEach((code) => {
      if (code.closest("pre")) {
        return;
      }
      const replacement = document.createElement("span");
      replacement.textContent = `\`${code.innerText.trim()}\``;
      code.replaceWith(replacement);
    });

    clone.querySelectorAll("a").forEach((anchor) => {
      const label = (anchor.innerText || anchor.href || "").trim();
      const href = anchor.href?.trim();
      const replacement = document.createElement("span");
      replacement.textContent = href ? `[${label}](${href})` : label;
      anchor.replaceWith(replacement);
    });

    return clone.innerText
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+\n/g, "\n")
      .trim();
  }

  function detectRole(element) {
    const explicitRole = element?.getAttribute("data-message-author-role");
    if (explicitRole === "user" || explicitRole === "assistant") {
      return explicitRole;
    }

    const text = [
      element?.getAttribute("data-testid") || "",
      element?.className || "",
      element?.getAttribute("aria-label") || ""
    ].join(" ").toLowerCase();

    if (text.includes("user")) {
      return "user";
    }
    if (text.includes("assistant")) {
      return "assistant";
    }
    return "unknown";
  }

  function gatherMessageNodes() {
    const explicitNodes = uniqueElements([
      ...USER_CANDIDATE_SELECTORS.flatMap((selector) => [...document.querySelectorAll(selector)]),
      ...ASSISTANT_CANDIDATE_SELECTORS.flatMap((selector) => [...document.querySelectorAll(selector)])
    ]);

    if (explicitNodes.length > 0) {
      return explicitNodes.sort((a, b) => {
        const position = a.compareDocumentPosition(b);
        if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
          return -1;
        }
        if (position & Node.DOCUMENT_POSITION_PRECEDING) {
          return 1;
        }
        return 0;
      });
    }

    const main = document.querySelector("main");
    if (!main) {
      return [];
    }

    return [...main.querySelectorAll("article, [data-testid*='conversation'], [role='presentation']")]
      .filter((element) => {
        const text = (element.innerText || "").trim();
        return text.length > 0 && text.length < 50000;
      });
  }

  function buildMessages() {
    const nodes = gatherMessageNodes();
    const messages = [];

    for (const node of nodes) {
      const role = detectRole(node);
      const text = getTextFromNode(node);

      if (!text) {
        continue;
      }

      if (role === "unknown" && messages.length > 0 && messages[messages.length - 1].content === text) {
        continue;
      }

      messages.push({ role, content: text });
    }

    const knownRoleCount = messages.filter((message) => message.role !== "unknown").length;
    if (knownRoleCount === 0) {
      return messages.map((message, index) => ({
        ...message,
        role: index % 2 === 0 ? "user" : "assistant"
      }));
    }

    return messages;
  }

  function pageTitle() {
    const raw = document.title.replace(/\s*\|\s*ChatGPT\s*$/i, "").trim();
    return raw || "chatgpt-conversation";
  }

  const messages = buildMessages();
  if (messages.length === 0) {
    throw new Error("No conversation content found on this page.");
  }

  const lines = [
    `# ${pageTitle()}`,
    "",
    `- Exported at: ${new Date().toISOString()}`,
    `- Source: ${location.href}`,
    ""
  ];

  messages.forEach((message, index) => {
    const roleLabel = message.role === "user"
      ? "User"
      : message.role === "assistant"
        ? "Assistant"
        : `Message ${index + 1}`;
    lines.push(`## ${roleLabel}`);
    lines.push("");
    lines.push(message.content);
    lines.push("");
  });

  return {
    title: pageTitle(),
    markdown: `${lines.join("\n").trim()}\n`
  };
}

async function exportConversation() {
  exportButton.disabled = true;
  setStatus("Reading the current conversation...");

  try {
    const tab = await getActiveChatTab();
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractConversationFromPage
    });

    if (!result?.markdown) {
      throw new Error("Could not extract the conversation from the page.");
    }

    const markdownBlob = new Blob([result.markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(markdownBlob);
    const filename = `${sanitizeFilenamePart(result.title)}.md`;

    await chrome.downloads.download({
      url,
      filename,
      saveAs: true
    });

    setStatus(`Exported ${filename}`);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (error) {
    setStatus(error.message || "Export failed.", true);
  } finally {
    exportButton.disabled = false;
  }
}

exportButton.addEventListener("click", exportConversation);
