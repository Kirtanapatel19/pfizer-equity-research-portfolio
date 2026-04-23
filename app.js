const reportEl = document.getElementById("report");
const tocEl = document.getElementById("toc");
const btnPrint = document.getElementById("btnPrint");
const btnDownload = document.getElementById("btnDownload");
const btnCopyLink = document.getElementById("btnCopyLink");

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatInline(text) {
  let s = escapeHtml(text);
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*(.+?)\*/g, "<em>$1</em>");
  s = s.replace(/`(.+?)`/g, "<code>$1</code>");
  s = s.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return s;
}

function parseTable(lines, index) {
  const header = lines[index];
  const divider = lines[index + 1];

  if (!header || !divider) return null;
  if (!/^\|.*\|$/.test(header.trim())) return null;
  if (!/^\|[\s:\-\|]+\|$/.test(divider.trim())) return null;

  const rows = [];
  let i = index + 2;
  while (i < lines.length && /^\|.*\|$/.test(lines[i].trim())) {
    rows.push(lines[i]);
    i += 1;
  }

  const splitRow = (row) =>
    row
      .trim()
      .slice(1, -1)
      .split("|")
      .map((cell) => formatInline(cell.trim()));

  const headerCells = splitRow(header);
  const bodyRows = rows.map(splitRow);

  const thead = `<thead><tr>${headerCells.map((c) => `<th>${c}</th>`).join("")}</tr></thead>`;
  const tbody = `<tbody>${bodyRows
    .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
    .join("")}</tbody>`;

  return {
    html: `<table>${thead}${tbody}</table>`,
    nextIndex: i,
  };
}

function basicMarkdownToHtml(md) {
  const lines = md.split("\n");
  const out = [];
  let i = 0;
  let inUl = false;
  let inOl = false;

  const closeLists = () => {
    if (inUl) {
      out.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      out.push("</ol>");
      inOl = false;
    }
  };

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trimEnd();

    const table = parseTable(lines, i);
    if (table) {
      closeLists();
      out.push(table.html);
      i = table.nextIndex;
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      closeLists();
      out.push("<hr />");
      i += 1;
      continue;
    }

    if (line.startsWith("#### ")) {
      closeLists();
      out.push(`<h4>${formatInline(line.slice(5))}</h4>`);
      i += 1;
      continue;
    }
    if (line.startsWith("### ")) {
      closeLists();
      out.push(`<h3>${formatInline(line.slice(4))}</h3>`);
      i += 1;
      continue;
    }
    if (line.startsWith("## ")) {
      closeLists();
      out.push(`<h2>${formatInline(line.slice(3))}</h2>`);
      i += 1;
      continue;
    }
    if (line.startsWith("# ")) {
      closeLists();
      out.push(`<h1>${formatInline(line.slice(2))}</h1>`);
      i += 1;
      continue;
    }

    if (/^\d+\.\s+/.test(line.trim())) {
      if (!inOl) {
        closeLists();
        out.push("<ol>");
        inOl = true;
      }
      out.push(`<li>${formatInline(line.replace(/^\d+\.\s+/, ""))}</li>`);
      i += 1;
      continue;
    }

    if (/^-\s+/.test(line.trim())) {
      if (!inUl) {
        closeLists();
        out.push("<ul>");
        inUl = true;
      }
      out.push(`<li>${formatInline(line.replace(/^-\s+/, ""))}</li>`);
      i += 1;
      continue;
    }

    if (line.trim() === "") {
      closeLists();
      i += 1;
      continue;
    }

    closeLists();
    out.push(`<p>${formatInline(line)}</p>`);
    i += 1;
  }

  closeLists();
  return out.join("\n");
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/&amp;/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function uniqueSlug(base, used) {
  if (!used.has(base)) {
    used.add(base);
    return base;
  }

  let i = 2;
  while (used.has(`${base}-${i}`)) i += 1;
  const value = `${base}-${i}`;
  used.add(value);
  return value;
}

function decorateHeadingsAndBuildToc() {
  const headings = reportEl.querySelectorAll("h2, h3");
  tocEl.innerHTML = "";

  const usedSlugs = new Set();
  const tocLinks = [];

  headings.forEach((h) => {
    const text = h.textContent.trim();
    const base = slugify(text) || "section";
    const id = uniqueSlug(base, usedSlugs);
    h.id = id;

    const link = document.createElement("a");
    link.href = `#${id}`;
    link.className = `toc-link level-${h.tagName.toLowerCase()}`;
    link.textContent = text;
    tocEl.appendChild(link);
    tocLinks.push(link);
  });

  const map = new Map();
  tocLinks.forEach((l) => map.set(l.getAttribute("href")?.slice(1), l));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        tocLinks.forEach((l) => l.classList.remove("active"));
        const id = entry.target.id;
        const link = map.get(id);
        if (link) link.classList.add("active");
      });
    },
    { rootMargin: "-25% 0px -65% 0px", threshold: [0, 1] }
  );

  headings.forEach((h) => observer.observe(h));
}

async function loadReport() {
  try {
    const response = await fetch("report.md", { cache: "no-store" });
    if (!response.ok) throw new Error(`Failed to load report.md (${response.status})`);

    const markdown = await response.text();

    if (window.marked) {
      marked.setOptions({
        gfm: true,
        breaks: false,
        mangle: false,
        headerIds: false,
      });
      reportEl.innerHTML = marked.parse(markdown);
    } else {
      reportEl.innerHTML = basicMarkdownToHtml(markdown);
    }

    decorateHeadingsAndBuildToc();
  } catch (error) {
    reportEl.innerHTML = `<p class="loading">Unable to load report content. ${error.message}</p>`;
  }
}

async function downloadMarkdown() {
  const response = await fetch("report.md", { cache: "no-store" });
  const markdown = await response.text();
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Pfizer_Equity_Research_Portfolio_Report.md";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

btnPrint.addEventListener("click", () => window.print());
btnDownload.addEventListener("click", downloadMarkdown);
btnCopyLink.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    btnCopyLink.textContent = "Link Copied";
    setTimeout(() => {
      btnCopyLink.textContent = "Copy Share Link";
    }, 1400);
  } catch {
    btnCopyLink.textContent = "Copy Failed";
    setTimeout(() => {
      btnCopyLink.textContent = "Copy Share Link";
    }, 1400);
  }
});

loadReport();
