function formatDate(dateString) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getTaskProgress(tasks) {
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const doneCount = safeTasks.filter((task) => task.done).length;

  return {
    done: doneCount,
    total: safeTasks.length,
  };
}

function getDueDateBadge(dueDate) {
  if (!dueDate) {
    return "";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(`${dueDate}T00:00:00`);

  if (Number.isNaN(target.getTime())) {
    return "";
  }

  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
  let label;
  let isOverdue = false;

  if (diffDays === 0) {
    label = "D-day";
  } else if (diffDays > 0) {
    label = `D-${diffDays}`;
  } else {
    label = `D+${Math.abs(diffDays)}`;
    isOverdue = true;
  }

  return `<span class="due-date-chip${isOverdue ? " overdue" : ""}">${label}</span>`;
}

function renderTaskChecklistHtml(memo) {
  const tasks = Array.isArray(memo.tasks) ? memo.tasks : [];

  if (tasks.length === 0) {
    return "";
  }

  const progress = getTaskProgress(tasks);

  return `
    <section class="detail-checklist">
      <div class="detail-checklist-header">
        <strong>체크리스트</strong>
        <span>${progress.done}/${progress.total} 완료</span>
      </div>

      <ul class="detail-task-list">
        ${tasks
          .map(
            (task) => `
              <li class="detail-task-item ${task.done ? "done" : ""}">
                <button
                  type="button"
                  class="task-toggle-button"
                  data-memo-id="${escapeHtml(memo.id)}"
                  data-task-id="${escapeHtml(task.id)}"
                  aria-label="${task.done ? "미완료로 변경" : "완료 처리"}: ${escapeHtml(task.text)}"
                  aria-pressed="${task.done ? "true" : "false"}"
                >
                  <span class="task-checkmark" aria-hidden="true">${task.done ? "✓" : ""}</span>
                </button>
                <span class="task-text">${escapeHtml(task.text)}</span>
              </li>
            `
          )
          .join("")}
      </ul>
    </section>
  `;
}


function renderMemoLinksHtml(memo) {
  const links = typeof getMemoLinks === "function" ? getMemoLinks(memo) : [];

  if (links.length === 0) {
    return "";
  }

  return links
    .map((link) => {
      let host = link.url;
      try {
        host = new URL(link.url).hostname.replace(/^www\./, "");
      } catch (_) {}

      return `
        <a class="detail-link-card" href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">
          <span class="detail-link-icon" aria-hidden="true">↗</span>
          <span class="detail-link-copy">
            <strong>${escapeHtml(link.label)}</strong>
            <small>${escapeHtml(host)}</small>
          </span>
          <span class="detail-link-arrow" aria-hidden="true">›</span>
        </a>
      `;
    })
    .join("");
}

function getMemoLinkCount(memo) {
  return typeof getMemoLinks === "function" ? getMemoLinks(memo).length : 0;
}


function renderTaskHub(items, view = "open") {
  const taskHubList = document.querySelector("#taskHubList");

  if (!taskHubList) {
    return;
  }

  const safeItems = Array.isArray(items) ? items : [];

  if (safeItems.length === 0) {
    const title =
      view === "open"
        ? "남아 있는 할 일이 없습니다."
        : "등록된 체크리스트가 없습니다.";
    const description =
      view === "open"
        ? "모든 할 일을 완료했거나 아직 체크리스트가 없습니다."
        : "메모 작성 화면에서 체크리스트를 추가해보세요.";

    taskHubList.innerHTML = `
      <div class="task-hub-empty">
        <strong>${title}</strong>
        <p>${description}</p>
      </div>
    `;
    return;
  }

  taskHubList.innerHTML = safeItems
    .map((item) => {
      const task = item.task;
      const safeTaskText = escapeHtml(task.text);
      const safeMemoTitle = escapeHtml(item.memoTitle);
      const safeCategory = escapeHtml(item.category);
      const date = formatDate(item.updatedAt || item.createdAt);
      const metaParts = [
        safeMemoTitle,
        safeCategory,
        date,
      ].filter(Boolean);

      return `
        <article class="task-hub-item ${task.done ? "done" : ""}">
          <button
            type="button"
            class="task-hub-check-button"
            data-task-action="toggle"
            data-memo-id="${escapeHtml(item.memoId)}"
            data-task-id="${escapeHtml(task.id)}"
            aria-label="${task.done ? "할 일 미완료로 변경" : "할 일 완료 처리"}: ${safeTaskText}"
            aria-pressed="${task.done ? "true" : "false"}"
          >
            <span class="task-hub-checkmark" aria-hidden="true">${task.done ? "✓" : ""}</span>
          </button>

          <button
            type="button"
            class="task-hub-main-link"
            data-task-action="open-memo"
            data-memo-id="${escapeHtml(item.memoId)}"
            aria-label="원본 메모 열기: ${safeMemoTitle}"
          >
            <span class="task-hub-task-text">${safeTaskText}</span>
            <span class="task-hub-source">${metaParts.join(" · ")}</span>
            <span class="task-hub-arrow" aria-hidden="true">›</span>
          </button>
        </article>
      `;
    })
    .join("");
}

function renderMemoList(memos) {
  const memoList = document.querySelector("#memoList");

  memoList.classList.toggle("selection-mode", Boolean(memoSelectionMode));

  if (memos.length === 0) {
    memoList.innerHTML = `
      <div class="empty-state">
        <strong>표시할 메모가 없습니다.</strong>
        <p>새 메모를 작성하거나 검색어·카테고리를 확인해보세요.</p>
        <div class="empty-state-actions">
          <button type="button" class="primary-button compact-button" data-empty-action="create">
            새 메모 작성
          </button>
        </div>
      </div>
    `;
    return;
  }

  memoList.innerHTML = memos
    .map((memo) => {
      const safeTitle = escapeHtml(memo.title);
      const safeContent = escapeHtml(memo.content);
      const safeCategory = memo.isDeleted ? "휴지통" : escapeHtml(memo.category);
      const date = formatDate(memo.updatedAt || memo.createdAt);
      const importantMark = memo.isImportant ? '<span class="star-mark" aria-label="중요 메모">★</span>' : "";
      const progress = getTaskProgress(memo.tasks);
      const taskChip =
        progress.total > 0
          ? `<span class="task-progress-chip">체크 ${progress.done}/${progress.total}</span>`
          : "";
      const linkCount = getMemoLinkCount(memo);
      const linkChip =
        linkCount > 0
          ? `<span class="memo-link-chip">링크 ${linkCount}</span>`
          : "";
      const dueDateChip = getDueDateBadge(memo.dueDate);
      const tableCount = typeof getMemoTables === "function" ? getMemoTables(memo).length : 0;
      const imageCount = typeof getMemoImages === "function" ? getMemoImages(memo).length : 0;
      const extraChips = [
        tableCount > 0 ? `<span class="memo-extra-chip">표 ${tableCount}</span>` : "",
        imageCount > 0 ? `<span class="memo-extra-chip">이미지 ${imageCount}</span>` : "",
      ].join("");
      const isSelected = Boolean(memoSelectionMode) && selectedMemoIds.has(memo.id);
      const selectIndicator = memoSelectionMode
        ? '<span class="memo-select-indicator" aria-hidden="true"></span>'
        : "";
      const cardClass = `memo-card${isSelected ? " selected" : ""}`;
      const pressedAttr = memoSelectionMode ? ` aria-pressed="${isSelected}"` : "";

      return `
        <button type="button" class="${cardClass}" data-id="${escapeHtml(memo.id)}"${pressedAttr}>
          ${selectIndicator}
          <div class="memo-card-top">
            <div class="memo-card-badges">
              <span class="category-chip">${safeCategory}</span>
              ${memo.isImportant ? '<span class="important-chip">중요</span>' : ""}
              ${dueDateChip}
              ${taskChip}
              ${linkChip}
              ${extraChips}
            </div>
            <span class="memo-date">${date}</span>
          </div>
          <h3>${importantMark}${safeTitle}</h3>
          <p>${safeContent}</p>
        </button>
      `;
    })
    .join("");
}


function renderTrashList(memos) {
  const trashList = document.querySelector("#trashList");

  if (!trashList) {
    return;
  }

  if (!Array.isArray(memos) || memos.length === 0) {
    trashList.innerHTML = `
      <div class="empty-state trash-empty-state">
        <strong>휴지통이 비어 있습니다.</strong>
        <p>삭제한 메모가 생기면 이 화면에서 복원하거나 영구 삭제할 수 있습니다.</p>
      </div>
    `;
    return;
  }

  trashList.innerHTML = memos
    .map((memo) => {
      const safeTitle = escapeHtml(memo.title);
      const safeContent = escapeHtml(memo.content);
      const safeCategory = escapeHtml(memo.category || "업무");
      const date = formatDate(memo.updatedAt || memo.createdAt);
      const progress = getTaskProgress(memo.tasks);
      const taskChip =
        progress.total > 0
          ? `<span class="task-progress-chip">체크 ${progress.done}/${progress.total}</span>`
          : "";
      const linkCount = getMemoLinkCount(memo);
      const linkChip =
        linkCount > 0
          ? `<span class="memo-link-chip">링크 ${linkCount}</span>`
          : "";

      return `
        <article class="trash-card" data-id="${escapeHtml(memo.id)}">
          <button
            type="button"
            class="trash-card-main"
            data-trash-open="${escapeHtml(memo.id)}"
            aria-label="${safeTitle} 상세 보기"
          >
            <div class="trash-card-top">
              <div class="memo-card-badges">
                <span class="category-chip">${safeCategory}</span>
                ${taskChip}
                ${linkChip}
              </div>
              <span class="memo-date">${date}</span>
            </div>
            <h3>${safeTitle}</h3>
            <p>${safeContent}</p>
          </button>
          <div class="trash-card-actions">
            <button
              type="button"
              class="secondary-button compact-button"
              data-trash-action="restore"
              data-id="${escapeHtml(memo.id)}"
            >
              복원
            </button>
            <button
              type="button"
              class="danger-button compact-button"
              data-trash-action="permanent-delete"
              data-id="${escapeHtml(memo.id)}"
            >
              영구 삭제
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

let detailModalPreviousFocus = null;

function renderMemoStyledParagraphsHtml(memo) {
  const blocks = typeof getMemoStyledParagraphs === "function" ? getMemoStyledParagraphs(memo) : [];

  return blocks
    .map((block) => {
      const classNames = [
        "styled-paragraph-block",
        block.bold ? "bold" : "",
        `size-${block.size}`,
        `color-${block.color}`,
      ]
        .filter(Boolean)
        .join(" ");

      return `<p class="${classNames}">${escapeHtml(block.text)}</p>`;
    })
    .join("");
}

function renderMemoTablesHtml(memo) {
  const blocks = typeof getMemoTables === "function" ? getMemoTables(memo) : [];

  return blocks
    .map((block) => {
      const rowsHtml = block.rows
        .map(
          (row) =>
            `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`
        )
        .join("");

      return `<div class="detail-table-wrap"><table class="detail-table">${rowsHtml}</table></div>`;
    })
    .join("");
}

function renderMemoImagesHtml(memo) {
  const blocks = typeof getMemoImages === "function" ? getMemoImages(memo) : [];

  return blocks
    .map(
      (block) => `
        <figure class="detail-image-block">
          <img src="${escapeHtml(block.url)}" alt="${escapeHtml(block.alt || "메모 이미지")}" loading="lazy"/>
          ${block.alt ? `<figcaption>${escapeHtml(block.alt)}</figcaption>` : ""}
        </figure>
      `
    )
    .join("");
}

function openDetailModal(memo, options = {}) {
  const modal = document.querySelector("#detailModal");
  const editButton = document.querySelector("#editMemoButton");
  const deleteButton = document.querySelector("#deleteMemoButton");
  const checklistContainer = document.querySelector("#detailChecklist");
  const linksContainer = document.querySelector("#detailLinks");

  const detailParts = [];

  if (memo.isImportant && !memo.isDeleted) {
    detailParts.push("★ 중요");
  }

  detailParts.push(memo.isDeleted ? "휴지통" : memo.category);

  document.querySelector("#detailCategory").textContent = detailParts.join(" · ");
  document.querySelector("#detailDate").textContent = formatDate(memo.updatedAt || memo.createdAt);
  document.querySelector("#detailTitle").textContent = memo.title;
  document.querySelector("#detailContent").textContent = memo.content;

  if (linksContainer) {
    const linksHtml = renderMemoLinksHtml(memo);
    linksContainer.innerHTML = linksHtml;
    linksContainer.hidden = !linksHtml;
  }

  const styledContainer = document.querySelector("#detailStyledParagraphs");
  if (styledContainer) {
    styledContainer.innerHTML = renderMemoStyledParagraphsHtml(memo);
  }

  const tablesContainer = document.querySelector("#detailTables");
  if (tablesContainer) {
    tablesContainer.innerHTML = renderMemoTablesHtml(memo);
  }

  const imagesContainer = document.querySelector("#detailImages");
  if (imagesContainer) {
    imagesContainer.innerHTML = renderMemoImagesHtml(memo);
  }

  if (checklistContainer) {
    checklistContainer.innerHTML = renderTaskChecklistHtml(memo);
  }

  editButton.dataset.id = memo.id;
  deleteButton.dataset.id = memo.id;

  if (memo.isDeleted) {
    editButton.textContent = "복구하기";
    editButton.className = "secondary-button";
    editButton.dataset.mode = "restore";

    deleteButton.textContent = "완전 삭제";
    deleteButton.className = "danger-button";
    deleteButton.dataset.mode = "permanent-delete";
  } else {
    editButton.textContent = "수정하기";
    editButton.className = "secondary-button";
    editButton.dataset.mode = "edit";

    deleteButton.textContent = "삭제하기";
    deleteButton.className = "danger-button";
    deleteButton.dataset.mode = "trash";
  }

  detailModalPreviousFocus = document.activeElement;
  modal.hidden = false;
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  if (!options.skipHistory) {
    window.solonoteNavigation?.openLayer("detail", {
      memoId: memo.id,
    });
  }

  window.requestAnimationFrame(() => {
    document.querySelector("#closeDetailButton")?.focus();
  });
}

function closeDetailModal(options = {}) {
  const modal = document.querySelector("#detailModal");

  if (!modal || modal.hidden || modal.classList.contains("hidden")) {
    return;
  }

  if (
    !options.skipHistory &&
    window.solonoteNavigation?.closeLayer("detail")
  ) {
    return;
  }

  modal.classList.add("hidden");
  modal.hidden = true;
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");

  if (
    detailModalPreviousFocus &&
    typeof detailModalPreviousFocus.focus === "function" &&
    document.contains(detailModalPreviousFocus)
  ) {
    detailModalPreviousFocus.focus();
  }

  detailModalPreviousFocus = null;
}

function setActiveCategory(category) {
  document.querySelectorAll(".category-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.category === category);
  });
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function renderCalendar() {
  const grid = document.querySelector("#calendarGrid");
  const monthLabel = document.querySelector("#calendarMonthLabel");

  if (!grid || !monthLabel) {
    return;
  }

  const year = calendarViewDate.getFullYear();
  const month = calendarViewDate.getMonth();

  monthLabel.textContent = `${year}년 ${month + 1}월`;

  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - startWeekday);
  const todayKey = toDateKey(new Date());

  const memosByDate = {};
  getMemos()
    .filter((memo) => !memo.isDeleted && memo.dueDate)
    .forEach((memo) => {
      if (!memosByDate[memo.dueDate]) {
        memosByDate[memo.dueDate] = [];
      }
      memosByDate[memo.dueDate].push(memo);
    });

  if (!selectedCalendarDateKey) {
    selectedCalendarDateKey = todayKey;
  }

  const cells = [];

  for (let i = 0; i < 42; i += 1) {
    const cellDate = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    const dateKey = toDateKey(cellDate);
    const classNames = ["calendar-day"];

    if (cellDate.getMonth() !== month) {
      classNames.push("other-month");
    }

    if (dateKey === todayKey) {
      classNames.push("today");
    }

    if (dateKey === selectedCalendarDateKey) {
      classNames.push("selected");
    }

    const hasMemo = Boolean(memosByDate[dateKey]);

    cells.push(`
      <button type="button" class="${classNames.join(" ")}" data-date="${dateKey}">
        <span>${cellDate.getDate()}</span>
        ${hasMemo ? '<span class="calendar-day-dot" aria-hidden="true"></span>' : ""}
      </button>
    `);
  }

  grid.innerHTML = cells.join("");

  renderCalendarDayList();
}

function renderCalendarDayList() {
  const dayList = document.querySelector("#calendarDayList");
  const dateLabel = document.querySelector("#calendarSelectedDateLabel");

  if (!dayList || !dateLabel) {
    return;
  }

  const dateKey = selectedCalendarDateKey;

  if (!dateKey) {
    dateLabel.textContent = "날짜를 선택하세요";
    dayList.innerHTML = "";
    return;
  }

  const [year, month, day] = dateKey.split("-").map(Number);
  dateLabel.textContent = `${year}년 ${month}월 ${day}일`;

  const dayMemos = getMemos().filter(
    (memo) => !memo.isDeleted && memo.dueDate === dateKey
  );

  if (dayMemos.length === 0) {
    dayList.innerHTML = '<p class="calendar-day-empty">이 날짜에 등록된 메모가 없습니다.</p>';
    return;
  }

  dayList.innerHTML = dayMemos
    .map((memo) => {
      const safeTitle = escapeHtml(memo.title || "제목 없음");
      const safeCategory = escapeHtml(memo.category);
      const safeId = escapeHtml(memo.id);

      return `
        <button type="button" class="calendar-day-item" data-id="${safeId}">
          <strong>${safeTitle}</strong>
          <span>${safeCategory}</span>
        </button>
      `;
    })
    .join("");
}

function renderCategoryBrowser() {
  const list = document.querySelector("#categoryBrowserList");

  if (!list) {
    return;
  }

  const names = getManagedMemoCategoryNames();
  const activeMemos = getMemos().filter((memo) => !memo.isDeleted);

  if (names.length === 0) {
    list.innerHTML = '<p class="category-browser-empty">카테고리가 없습니다.</p>';
    return;
  }

  list.innerHTML = names
    .map((name) => {
      const count = activeMemos.filter((memo) => memo.category === name).length;
      const safeName = escapeHtml(name);

      return `
        <button type="button" class="category-browser-item" data-category="${safeName}">
          <span>${safeName}</span>
          <span class="category-browser-count">${count}개</span>
        </button>
      `;
    })
    .join("");
}

function renderBookmarkList() {
  const list = document.querySelector("#bookmarkList");

  if (!list) {
    return;
  }

  const bookmarks = getBookmarks();

  if (bookmarks.length === 0) {
    list.innerHTML = '<p class="bookmark-empty">아직 추가한 사이트가 없습니다.</p>';
    return;
  }

  list.innerHTML = bookmarks
    .map((bookmark) => {
      const safeTitle = escapeHtml(bookmark.title);
      const safeUrl = escapeHtml(bookmark.url);
      const safeId = escapeHtml(bookmark.id);

      return `
        <div class="bookmark-row">
          <a class="bookmark-link" href="${safeUrl}" rel="noopener noreferrer" target="_blank">
            <strong>${safeTitle}</strong>
            <span>${safeUrl}</span>
          </a>
          <button aria-label="${safeTitle} 삭제" class="bookmark-delete-button" data-id="${safeId}" type="button">×</button>
        </div>
      `;
    })
    .join("");
}

function openEditor(options = {}) {
  const editorPanel = document.querySelector(".editor-panel");
  const editorView = document.querySelector("#editorView");
  const toggleButton = document.querySelector("#editorToggleButton");
  const mobileNewMemoButton = document.querySelector("#mobileNewMemoButton");

  if (!editorPanel || !editorView) {
    return;
  }

  editorPanel.classList.remove("collapsed");
  editorView.hidden = false;
  editorView.setAttribute("aria-hidden", "false");

  if (toggleButton) {
    toggleButton.textContent = "작성 닫기";
    toggleButton.classList.remove("primary-button");
    toggleButton.classList.add("secondary-button");
  }

  if (mobileNewMemoButton) {
    mobileNewMemoButton.hidden = true;
  }


  if (!options.skipHistory) {
    window.solonoteNavigation?.openLayer("editor");
  }

  if (!editorPanel.classList.contains("editor-view-as-modal") && !editorView.classList.contains("editor-view-as-modal")) {
    window.requestAnimationFrame(() => {
      editorPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}

function closeEditor(options = {}) {
  const editorPanel = document.querySelector(".editor-panel");
  const editorView = document.querySelector("#editorView");
  const toggleButton = document.querySelector("#editorToggleButton");
  const mobileNewMemoButton = document.querySelector("#mobileNewMemoButton");

  if (
    !options.skipHistory &&
    window.solonoteNavigation?.closeLayer("editor")
  ) {
    return;
  }

  editorPanel?.classList.add("collapsed");
  editorPanel?.classList.remove("editor-view-as-modal");

  if (editorView) {
    editorView.hidden = true;
    editorView.setAttribute("aria-hidden", "true");
    editorView.classList.remove("editor-view-as-modal");
  }

  if (toggleButton) {
    toggleButton.textContent = "+ 새 메모";
    toggleButton.classList.remove("secondary-button", "ghost-button");
    toggleButton.classList.add("primary-button");
  }


  if (mobileNewMemoButton) {
    mobileNewMemoButton.hidden = document.body.dataset.appView !== "notes";
  }

  if (isEditingFromDetailView) {
    const memoIdToReopen = editingFromDetailMemoId;
    isEditingFromDetailView = false;
    editingFromDetailMemoId = "";

    const memoToReopen = memoIdToReopen ? findMemoById(memoIdToReopen) : null;

    if (memoToReopen) {
      openDetailModal(memoToReopen, { skipHistory: true });
    }
  }
}

function toggleEditor() {
  const editorPanel = document.querySelector(".editor-panel");

  if (!editorPanel || editorPanel.classList.contains("collapsed")) {
    openEditor();
    window.setTimeout(() => document.querySelector("#titleInput")?.focus(), 100);
    return;
  }

  const hasChanges =
    typeof hasUnsavedEditorChanges === "function"
      ? hasUnsavedEditorChanges()
      : Boolean(
          document.querySelector("#editingId")?.value ||
          document.querySelector("#titleInput")?.value.trim() ||
          document.querySelector("#contentInput")?.value.trim() ||
          document.querySelectorAll("#taskDraftList .task-draft-item").length ||
          document.querySelectorAll("#linkDraftList .link-draft-item").length
        );

  if (hasChanges) {
    const shouldClose = window.confirm(
      "작성 중인 내용이 있습니다. 작성 영역을 닫고 입력 내용을 지우시겠습니까?"
    );

    if (!shouldClose) {
      return;
    }

    if (typeof clearLocalEditorDraft === "function") {
      clearLocalEditorDraft();
    }

    resetForm();
  }

  closeEditor();
}

function setEditorMode(mode) {
  const editorTitle = document.querySelector("#editorTitle");
  const saveButton = document.querySelector("#saveButton");
  const resetButton = document.querySelector("#resetButton");

  if (mode === "edit") {
    editorTitle.textContent = "메모 수정";
    saveButton.textContent = "수정 완료";
    resetButton.classList.remove("hidden");
    return;
  }

  editorTitle.textContent = "새 메모 작성";
  saveButton.textContent = "저장하기";
  resetButton.classList.add("hidden");
}

function resetForm() {
  document.querySelector("#memoForm").reset();
  document.querySelector("#categoryInput")?.dispatchEvent(new Event("change", { bubbles: true }));
  document.querySelector("#editingId").value = "";

  const editingUpdatedAt = document.querySelector("#editingUpdatedAt");
  if (editingUpdatedAt) {
    editingUpdatedAt.value = "";
  }

  if (typeof resetDraftTasks === "function") {
    resetDraftTasks();
  }

  if (typeof resetDraftLinks === "function") {
    resetDraftLinks();
  }

  if (typeof resetDraftStyledParagraphs === "function") {
    resetDraftStyledParagraphs();
  }

  if (typeof resetDraftTables === "function") {
    resetDraftTables();
  }

  if (typeof resetDraftImages === "function") {
    resetDraftImages();
  }

  setEditorMode("create");

  if (typeof markEditorClean === "function") {
    markEditorClean();
  }
}

function cancelEditAndCloseEditor() {
  resetForm();
  closeEditor();
}

function fillFormForEdit(memo) {
  document.querySelector("#editingId").value = memo.id;

  const editingUpdatedAt = document.querySelector("#editingUpdatedAt");
  if (editingUpdatedAt) {
    editingUpdatedAt.value = memo.updatedAt || memo.createdAt || "";
  }

  document.querySelector("#titleInput").value = memo.title;
  document.querySelector("#projectInput").value = memo.project || "";
  document.querySelector("#contentInput").value = memo.content;
  document.querySelector("#categoryInput").value = memo.category;
  document.querySelector("#categoryInput").dispatchEvent(new Event("change", { bubbles: true }));
  document.querySelector("#importantInput").checked = Boolean(memo.isImportant);

  const dueDateInput = document.querySelector("#dueDateInput");
  if (dueDateInput) {
    dueDateInput.value = memo.dueDate || "";
  }

  if (typeof loadDraftLinks === "function") {
    loadDraftLinks(typeof getMemoLinks === "function" ? getMemoLinks(memo) : []);
  }

  if (typeof loadDraftStyledParagraphs === "function") {
    loadDraftStyledParagraphs(
      typeof getMemoStyledParagraphs === "function" ? getMemoStyledParagraphs(memo) : []
    );
  }

  if (typeof loadDraftTables === "function") {
    loadDraftTables(typeof getMemoTables === "function" ? getMemoTables(memo) : []);
  }

  if (typeof loadDraftImages === "function") {
    loadDraftImages(typeof getMemoImages === "function" ? getMemoImages(memo) : []);
  }

  setEditorMode("edit");
  openEditor();
  closeDetailModal();

  window.scrollTo({ top: 0, behavior: "auto" });
}
