const feedback = window.HoonNoteFeedback || null;

let currentCategory = "전체";
let currentSearch = "";
let currentSort = "updatedDesc";
let draftTasks = [];
let draftLinks = [];
let draftStyledParagraphs = [];
let draftTables = [];
let draftImages = [];
let tableEditorRows = [];
let editingTableDraftId = "";

let memoSelectionMode = false;
let selectedMemoIds = new Set();
let calendarViewDate = new Date();
let selectedCalendarDateKey = "";
let sidebarCollapsed = false;
let memoLongPressTimer = null;
let memoLongPressTargetId = null;
let memoLongPressMoved = false;
let memoLongPressStartX = 0;
let memoLongPressStartY = 0;
let suppressNextMemoCardClick = false;

const MEMO_LONG_PRESS_DURATION_MS = 480;
const MEMO_LONG_PRESS_MOVE_TOLERANCE_PX = 10;

const memoForm = document.querySelector("#memoForm");
const titleInput = document.querySelector("#titleInput");
const projectInput = document.querySelector("#projectInput");
const contentInput = document.querySelector("#contentInput");
const addLinkButton = document.querySelector("#addLinkButton");
const linkDraftSection = document.querySelector("#linkDraftSection");
const linkDraftList = document.querySelector("#linkDraftList");
const linkCountLabel = document.querySelector("#linkCountLabel");
const linkEditorModal = document.querySelector("#linkEditorModal");
const linkEditorForm = document.querySelector("#linkEditorForm");
const editingLinkIdInput = document.querySelector("#editingLinkId");
const linkUrlInput = document.querySelector("#linkUrlInput");
const linkLabelInput = document.querySelector("#linkLabelInput");
const linkEditorStatus = document.querySelector("#linkEditorStatus");
const closeLinkEditorButton = document.querySelector("#closeLinkEditorButton");
const cancelLinkEditorButton = document.querySelector("#cancelLinkEditorButton");
const saveLinkButton = document.querySelector("#saveLinkButton");

const styledDraftSection = document.querySelector("#styledDraftSection");
const styledDraftList = document.querySelector("#styledDraftList");
const styledCountLabel = document.querySelector("#styledCountLabel");
const styledParagraphModal = document.querySelector("#styledParagraphModal");
const styledParagraphForm = document.querySelector("#styledParagraphForm");
const editingStyledIdInput = document.querySelector("#editingStyledId");
const styledSizeInput = document.querySelector("#styledSizeInput");
const styledColorInput = document.querySelector("#styledColorInput");
const styledTextInput = document.querySelector("#styledTextInput");
const styledBoldInput = document.querySelector("#styledBoldInput");
const styledSizeOptions = document.querySelector("#styledSizeOptions");
const styledColorOptions = document.querySelector("#styledColorOptions");
const styledParagraphStatus = document.querySelector("#styledParagraphStatus");
const closeStyledParagraphButton = document.querySelector("#closeStyledParagraphButton");
const cancelStyledParagraphButton = document.querySelector("#cancelStyledParagraphButton");

const tableDraftSection = document.querySelector("#tableDraftSection");
const tableDraftList = document.querySelector("#tableDraftList");
const tableCountLabel = document.querySelector("#tableCountLabel");
const tableEditorModal = document.querySelector("#tableEditorModal");
const tableEditorGrid = document.querySelector("#tableEditorGrid");
const tableEditorStatus = document.querySelector("#tableEditorStatus");
const editingTableIdInput = document.querySelector("#editingTableId");
const addTableRowButton = document.querySelector("#addTableRowButton");
const addTableColButton = document.querySelector("#addTableColButton");
const removeTableRowButton = document.querySelector("#removeTableRowButton");
const removeTableColButton = document.querySelector("#removeTableColButton");
const saveTableButton = document.querySelector("#saveTableButton");
const closeTableEditorButton = document.querySelector("#closeTableEditorButton");
const cancelTableEditorButton = document.querySelector("#cancelTableEditorButton");

const imageDraftSection = document.querySelector("#imageDraftSection");
const imageDraftList = document.querySelector("#imageDraftList");
const imageCountLabel = document.querySelector("#imageCountLabel");
const imageUploadModal = document.querySelector("#imageUploadModal");
const imageUploadForm = document.querySelector("#imageUploadForm");
const imageFileInput = document.querySelector("#imageFileInput");
const imageAltInput = document.querySelector("#imageAltInput");
const imageUploadPreview = document.querySelector("#imageUploadPreview");
const imageUploadStatus = document.querySelector("#imageUploadStatus");
const closeImageUploadButton = document.querySelector("#closeImageUploadButton");
const cancelImageUploadButton = document.querySelector("#cancelImageUploadButton");

const exportPdfButton = document.querySelector("#exportPdfButton");
const categoryInput = document.querySelector("#categoryInput");
const categoryPicker = document.querySelector("#categoryPicker");
const categoryPickerButton = document.querySelector("#categoryPickerButton");
const categoryPickerValue = document.querySelector("#categoryPickerValue");
const categoryPickerMenu = document.querySelector("#categoryPickerMenu");
const editorCategoryManagerButton = document.querySelector("#editorCategoryManagerButton");
const importantInput = document.querySelector("#importantInput");
const dueDateInput = document.querySelector("#dueDateInput");
const editingIdInput = document.querySelector("#editingId");
const editingUpdatedAtInput = document.querySelector("#editingUpdatedAt");
const searchInput = document.querySelector("#searchInput");
const categoryTabs = document.querySelector("#categoryTabs");
const sortOptions = document.querySelector("#sortOptions");
const backupButton = document.querySelector("#backupButton");
const restoreButton = document.querySelector("#restoreButton");
const totalMemoCount = document.querySelector("#totalMemoCount");
const trashMemoCount = document.querySelector("#trashMemoCount");
const resetAllDataButton = document.querySelector("#resetAllDataButton");
const guideToggleButton = document.querySelector("#guideToggleButton");
const guideContent = document.querySelector("#guideContent");
const taskInput = document.querySelector("#taskInput");
const addTaskButton = document.querySelector("#addTaskButton");
const taskDraftList = document.querySelector("#taskDraftList");
const taskCountLabel = document.querySelector("#taskCountLabel");
const cloudSyncStatus = document.querySelector("#cloudSyncStatus");
const saveButton = document.querySelector("#saveButton");
const legacyMigrationPanel = document.querySelector("#legacyMigrationPanel");
const legacyMemoCount = document.querySelector("#legacyMemoCount");
const legacyMigrationMessage = document.querySelector("#legacyMigrationMessage");
const migrateLegacyButton = document.querySelector("#migrateLegacyButton");
const cloudRefreshButton = document.querySelector("#cloudRefreshButton");
const lastSyncTime = document.querySelector("#lastSyncTime");
const dataManagementToggleButton = document.querySelector("#dataManagementToggleButton");
const dataManagementContent = document.querySelector("#dataManagementContent");
const openSettingsButton = document.querySelector("#openSettingsButton");
const menuMainView = document.querySelector("#menuMainView");
const menuSettingsView = document.querySelector("#menuSettingsView");
const menuSettingsBackButton = document.querySelector("#menuSettingsBackButton");
const menuHeaderTitle = document.querySelector("#menuHeaderTitle");
const menuAccountManagementToggleButton = document.querySelector("#menuAccountManagementToggleButton");
const menuAccountManagementContent = document.querySelector("#menuAccountManagementContent");
const mobileNewMemoButton = document.querySelector("#mobileNewMemoButton");
const draftRecoveryBanner = document.querySelector("#draftRecoveryBanner");
const draftRecoveryDescription = document.querySelector("#draftRecoveryDescription");
const restoreDraftButton = document.querySelector("#restoreDraftButton");
const discardDraftButton = document.querySelector("#discardDraftButton");
const draftSaveStatus = document.querySelector("#draftSaveStatus");
const taskHubContent = document.querySelector("#taskHubContent");
const taskHubList = document.querySelector("#taskHubList");
const taskHubOpenCount = document.querySelector("#taskHubOpenCount");
const taskHubViewTabs = document.querySelector(".task-hub-view-tabs");
const notesViewTab = document.querySelector("#notesViewTab");
const tasksViewTab = document.querySelector("#tasksViewTab");
const calendarViewTab = document.querySelector("#calendarViewTab");
const calendarView = document.querySelector("#calendarView");
const calendarPrevMonthButton = document.querySelector("#calendarPrevMonthButton");
const calendarNextMonthButton = document.querySelector("#calendarNextMonthButton");
const calendarMonthLabel = document.querySelector("#calendarMonthLabel");
const calendarGrid = document.querySelector("#calendarGrid");
const calendarSelectedDateLabel = document.querySelector("#calendarSelectedDateLabel");
const calendarDayList = document.querySelector("#calendarDayList");
const notesView = document.querySelector("#notesView");
const editorView = document.querySelector("#editorView");
const tasksView = document.querySelector("#tasksView");
const trashView = document.querySelector("#trashView");
const trashList = document.querySelector("#trashList");
const trashViewCount = document.querySelector("#trashViewCount");
const emptyTrashViewButton = document.querySelector("#emptyTrashViewButton");
const homeLogoButton = document.querySelector("#homeLogoButton");
const appMenuButton = document.querySelector("#appMenuButton");
const appMenuPanel = document.querySelector("#appMenuPanel");
const appMenuBackdrop = document.querySelector("#appMenuBackdrop");
const openTrashButton = document.querySelector("#openTrashButton");
const detailModal = document.querySelector("#detailModal");
const categoryBrowserList = document.querySelector("#categoryBrowserList");
const bookmarkList = document.querySelector("#bookmarkList");
const bookmarkForm = document.querySelector("#bookmarkForm");
const bookmarkTitleInput = document.querySelector("#bookmarkTitleInput");
const bookmarkUrlInput = document.querySelector("#bookmarkUrlInput");
const addBookmarkButton = document.querySelector("#addBookmarkButton");
const cancelBookmarkButton = document.querySelector("#cancelBookmarkButton");
const selectionToolbar = document.querySelector("#selectionToolbar");
const selectionCountLabel = document.querySelector("#selectionCountLabel");
const cancelSelectionButton = document.querySelector("#cancelSelectionButton");
const deleteSelectedButton = document.querySelector("#deleteSelectedButton");
const categoryManagerModal = document.querySelector("#categoryManagerModal");
const closeCategoryManagerButton = document.querySelector("#closeCategoryManagerButton");
const categoryCreateForm = document.querySelector("#categoryCreateForm");
const newCategoryInput = document.querySelector("#newCategoryInput");
const addCategoryButton = document.querySelector("#addCategoryButton");
const categoryManagerList = document.querySelector("#categoryManagerList");
const categoryManagerStatus = document.querySelector("#categoryManagerStatus");

let currentCloudUserId = "";
let cloudLoadSequence = 0;
let activeCloudLoadPromise = null;
let automaticSyncTimer = null;
let lastAutomaticSyncRequestAt = 0;
let appMenuCloseTimer = null;
let isAppMenuOpen = false;
let categoryManagerPreviousFocus = null;
let linkEditorPreviousFocus = null;

const AUTO_SYNC_MIN_INTERVAL_MS = 5000;

let editorCleanSnapshot = "";
let isEditorDirty = false;
let draftAutoSaveTimer = null;
let recoverableDraft = null;

const DRAFT_STORAGE_PREFIX = "solonote_editor_draft_v4";
const DRAFT_AUTO_SAVE_DELAY_MS = 700;
const DRAFT_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;
const PROTECTED_MEMO_CATEGORY_NAMES = new Set(["중요", "보관", "미분류"]);

let currentTaskHubView = "open";
let currentAppView = "notes";

const APP_HISTORY_STATE_KEY = "hoonnoteNavigation";
const APP_HISTORY_LAYERS = new Set([
  "base",
  "menu",
  "editor",
  "detail",
  "categoryManager",
  "linkEditor",
  "accountDeletion",
]);
let appNavigationReady = false;
let isApplyingAppHistory = false;
let lastAppliedNavigationState = null;

function createAppNavigationState(view = currentAppView, layer = "base", detail = {}) {
  const safeView = ["notes", "tasks", "trash"].includes(view) ? view : "notes";
  const safeLayer = APP_HISTORY_LAYERS.has(layer) ? layer : "base";

  return {
    view: safeView,
    layer: safeLayer,
    memoId: detail.memoId ? String(detail.memoId) : "",
  };
}

function getAppNavigationState(historyState = window.history.state) {
  const state = historyState?.[APP_HISTORY_STATE_KEY];
  return state
    ? createAppNavigationState(state.view, state.layer, state)
    : null;
}

function writeAppNavigationState(nextState, mode = "push") {
  const mergedState = {
    ...(window.history.state || {}),
    [APP_HISTORY_STATE_KEY]: nextState,
  };
  const method = mode === "replace" ? "replaceState" : "pushState";

  window.history[method](mergedState, document.title);
  lastAppliedNavigationState = nextState;
}

function openAppHistoryLayer(layer, detail = {}, options = {}) {
  if (!appNavigationReady || isApplyingAppHistory) {
    return false;
  }

  const currentState =
    getAppNavigationState() ||
    createAppNavigationState(currentAppView, "base");
  const nextState = createAppNavigationState(currentAppView, layer, detail);
  const shouldReplace =
    currentState.layer === layer ||
    (!options.preserveParent && (
      Boolean(options.replace) ||
      currentState.layer !== "base"
    ));

  writeAppNavigationState(nextState, shouldReplace ? "replace" : "push");
  return true;
}

function closeAppHistoryLayer(layer) {
  if (!appNavigationReady || isApplyingAppHistory) {
    return false;
  }

  const currentState = getAppNavigationState();

  if (!currentState || currentState.layer !== layer) {
    return false;
  }

  window.history.back();
  return true;
}

function syncAppViewHistory(view, mode = "auto") {
  if (!appNavigationReady || isApplyingAppHistory || mode === "none") {
    return;
  }

  const currentState =
    getAppNavigationState() ||
    createAppNavigationState(currentAppView, "base");
  const nextState = createAppNavigationState(view, "base");
  const shouldReplace = mode === "replace" || currentState.layer !== "base";

  if (
    currentState.view === nextState.view &&
    currentState.layer === "base"
  ) {
    if (mode === "replace") {
      writeAppNavigationState(nextState, "replace");
    }
    return;
  }

  writeAppNavigationState(nextState, shouldReplace ? "replace" : "push");
}

function applyAppNavigationState(state) {
  const nextState = state || createAppNavigationState("notes", "base");
  isApplyingAppHistory = true;

  try {
    closeAppMenu({ skipHistory: true });
    closeCategoryManager({ skipHistory: true });
    closeLinkEditor({ skipHistory: true });
    closeDetailModal({ skipHistory: true });

    if (!["editor", "linkEditor"].includes(nextState.layer)) {
      closeEditor({ skipHistory: true });
    }

    switchAppView(nextState.view, {
      historyMode: "none",
      scrollBehavior: "auto",
    });

    if (nextState.layer === "menu") {
      openAppMenu({ skipHistory: true });
    } else if (nextState.layer === "editor") {
      openEditor({ skipHistory: true });
    } else if (nextState.layer === "detail" && nextState.memoId) {
      const memo = findMemoById(nextState.memoId);
      if (memo) {
        openDetailModal(memo, { skipHistory: true });
      }
    } else if (nextState.layer === "categoryManager") {
      openCategoryManager({ skipHistory: true });
    } else if (nextState.layer === "linkEditor") {
      openEditor({ skipHistory: true });
      openLinkEditor(null, { skipHistory: true });
    }

    window.dispatchEvent(
      new CustomEvent("solonote-navigation-sync", {
        detail: nextState,
      })
    );

    lastAppliedNavigationState = nextState;
  } finally {
    isApplyingAppHistory = false;
  }
}

function handleAppHistoryPopState(event) {
  const nextState = getAppNavigationState(event.state);

  if (!nextState) {
    return;
  }

  if (
    lastAppliedNavigationState?.layer === "editor" &&
    nextState.layer !== "editor" &&
    hasUnsavedEditorChanges()
  ) {
    const shouldClose = window.confirm(
      "저장하지 않은 작성 내용이 있습니다. 작성창을 닫을까요? 내용은 자동 저장된 초안으로 남습니다."
    );

    if (!shouldClose) {
      window.history.forward();
      return;
    }

    saveLocalEditorDraft();
  }

  applyAppNavigationState(nextState);
}

function initializeAppNavigation() {
  const initialState = createAppNavigationState("notes", "base");
  writeAppNavigationState(initialState, "replace");
  appNavigationReady = true;
  window.addEventListener("popstate", handleAppHistoryPopState);

  window.solonoteNavigation = {
    openLayer: openAppHistoryLayer,
    closeLayer: closeAppHistoryLayer,
    dismissMenu() {
      closeAppMenu({ skipHistory: true });
    },
    reset() {
      const baseState = createAppNavigationState("notes", "base");
      writeAppNavigationState(baseState, "replace");
      applyAppNavigationState(baseState);
    },
  };
}



function getDraftLinkById(linkId) {
  return draftLinks.find((link) => link.id === linkId) || null;
}

function getLinkDisplayHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (_) {
    return url;
  }
}

function renderDraftLinks() {
  if (!linkDraftSection || !linkDraftList || !linkCountLabel) {
    return;
  }

  linkCountLabel.textContent = `${draftLinks.length}개`;
  linkDraftSection.hidden = draftLinks.length === 0;

  if (draftLinks.length === 0) {
    linkDraftList.innerHTML = "";
    return;
  }

  linkDraftList.innerHTML = draftLinks
    .map((link) => `
      <article class="link-draft-item" data-link-id="${escapeHtml(link.id)}">
        <a class="link-draft-anchor" href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">
          <span class="link-draft-icon" aria-hidden="true">↗</span>
          <span class="link-draft-copy">
            <strong>${escapeHtml(link.label)}</strong>
            <small>${escapeHtml(getLinkDisplayHost(link.url))}</small>
          </span>
        </a>
        <div class="link-draft-actions">
          <button class="text-button compact-button" data-link-action="edit" data-link-id="${escapeHtml(link.id)}" type="button">수정</button>
          <button class="text-button compact-button danger-text" data-link-action="delete" data-link-id="${escapeHtml(link.id)}" type="button">삭제</button>
        </div>
      </article>
    `)
    .join("");
}

function loadDraftLinks(links) {
  draftLinks = (Array.isArray(links) ? links : [])
    .map((link) => normalizeMemoLinkBlock(link))
    .filter(Boolean)
    .slice(0, MAX_MEMO_LINK_BLOCKS);
  renderDraftLinks();
}

function resetDraftLinks() {
  draftLinks = [];
  renderDraftLinks();
}

function setLinkEditorStatus(message = "", state = "") {
  if (!linkEditorStatus) {
    return;
  }

  linkEditorStatus.textContent = message;

  if (state) {
    linkEditorStatus.dataset.state = state;
  } else {
    delete linkEditorStatus.dataset.state;
  }
}

function openLinkEditor(link = null, options = {}) {
  if (!linkEditorModal || !linkEditorForm) {
    return;
  }

  if (draftLinks.length >= MAX_MEMO_LINK_BLOCKS && !link) {
    showAppNotice(`링크는 메모 하나에 ${MAX_MEMO_LINK_BLOCKS}개까지 추가할 수 있습니다.`, "warning", { title: "링크 추가 제한" });
    return;
  }

  linkEditorPreviousFocus = document.activeElement;
  linkEditorForm.reset();
  editingLinkIdInput.value = link?.id || "";
  linkUrlInput.value = link?.url || "";
  linkLabelInput.value = link?.label || "";
  saveLinkButton.textContent = link ? "수정 완료" : "링크 추가";
  document.querySelector("#linkEditorTitle").textContent = link ? "링크 수정" : "링크 삽입";
  setLinkEditorStatus();

  linkEditorModal.hidden = false;
  linkEditorModal.classList.remove("hidden");
  linkEditorModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  if (!options.skipHistory) {
    openAppHistoryLayer("linkEditor", {}, { preserveParent: true });
  }

  window.setTimeout(() => linkUrlInput?.focus(), 0);
}

function closeLinkEditor(options = {}) {
  if (!linkEditorModal) {
    return;
  }

  if (
    !linkEditorModal.hidden &&
    !options.skipHistory &&
    closeAppHistoryLayer("linkEditor")
  ) {
    return;
  }

  linkEditorModal.classList.add("hidden");
  linkEditorModal.hidden = true;
  linkEditorModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  linkEditorForm?.reset();
  setLinkEditorStatus();

  if (
    linkEditorPreviousFocus &&
    typeof linkEditorPreviousFocus.focus === "function" &&
    document.contains(linkEditorPreviousFocus)
  ) {
    linkEditorPreviousFocus.focus();
  }

  linkEditorPreviousFocus = null;
}

function handleLinkEditorSubmit(event) {
  event.preventDefault();
  const url = normalizeHttpUrl(linkUrlInput?.value || "");
  const label = String(linkLabelInput?.value || "").trim();

  if (!url) {
    setLinkEditorStatus("http:// 또는 https://로 시작하는 올바른 주소를 입력하세요.", "error");
    linkUrlInput?.focus();
    return;
  }

  const existingId = editingLinkIdInput?.value || "";
  const normalizedLink = normalizeMemoLinkBlock({
    id: existingId || createSafeId("link"),
    type: "link",
    url,
    label,
  });

  if (!normalizedLink) {
    setLinkEditorStatus("링크 정보를 확인해주세요.", "error");
    return;
  }

  if (existingId) {
    draftLinks = draftLinks.map((link) =>
      link.id === existingId ? normalizedLink : link
    );
  } else {
    draftLinks.push(normalizedLink);
  }

  renderDraftLinks();
  updateEditorDirtyState();
  closeLinkEditor();
  showAppNotice(existingId ? "링크를 수정했습니다." : "링크를 메모에 추가했습니다.", "success", {
    title: existingId ? "링크 수정 완료" : "링크 추가 완료",
  });
}

function handleLinkDraftListClick(event) {
  const actionButton = event.target.closest("[data-link-action]");

  if (!actionButton) {
    return;
  }

  const linkId = actionButton.dataset.linkId || "";
  const link = getDraftLinkById(linkId);

  if (!link) {
    return;
  }

  if (actionButton.dataset.linkAction === "edit") {
    openLinkEditor(link);
    return;
  }

  if (actionButton.dataset.linkAction === "delete") {
    draftLinks = draftLinks.filter((item) => item.id !== linkId);
    renderDraftLinks();
    updateEditorDirtyState();
    showAppNotice("링크를 메모에서 삭제했습니다.", "info", { title: "링크 삭제" });
  }
}

function handleLinkEditorModalClick(event) {
  if (event.target.dataset.linkEditorClose === "true") {
    closeLinkEditor();
  }
}

/* ===== 서식 문단 ===== */

function renderDraftStyledParagraphs() {
  if (!styledDraftSection || !styledDraftList || !styledCountLabel) {
    return;
  }

  styledCountLabel.textContent = `${draftStyledParagraphs.length}개`;
  styledDraftSection.hidden = draftStyledParagraphs.length === 0;

  if (draftStyledParagraphs.length === 0) {
    styledDraftList.innerHTML = "";
    return;
  }

  styledDraftList.innerHTML = draftStyledParagraphs
    .map((block) => `
      <article class="link-draft-item" data-styled-id="${escapeHtml(block.id)}">
        <span class="link-draft-anchor">
          <span class="link-draft-icon" aria-hidden="true">가</span>
          <span class="link-draft-copy">
            <strong>${escapeHtml(block.text.slice(0, 40))}${block.text.length > 40 ? "…" : ""}</strong>
            <small>${block.bold ? "굵게 · " : ""}${block.size} · ${block.color}</small>
          </span>
        </span>
        <div class="link-draft-actions">
          <button class="text-button compact-button" data-styled-action="edit" data-styled-id="${escapeHtml(block.id)}" type="button">수정</button>
          <button class="text-button compact-button danger-text" data-styled-action="delete" data-styled-id="${escapeHtml(block.id)}" type="button">삭제</button>
        </div>
      </article>
    `)
    .join("");
}

function loadDraftStyledParagraphs(blocks) {
  draftStyledParagraphs = (Array.isArray(blocks) ? blocks : []).slice(0, MAX_MEMO_STYLED_PARAGRAPH_BLOCKS);
  renderDraftStyledParagraphs();
}

function resetDraftStyledParagraphs() {
  draftStyledParagraphs = [];
  renderDraftStyledParagraphs();
}

function setStyledParagraphStatus(message = "", state = "") {
  if (!styledParagraphStatus) {
    return;
  }

  styledParagraphStatus.textContent = message;

  if (state) {
    styledParagraphStatus.dataset.state = state;
  } else {
    delete styledParagraphStatus.dataset.state;
  }
}

function setStyledSizeSelection(size) {
  if (styledSizeInput) {
    styledSizeInput.value = size;
  }

  styledSizeOptions?.querySelectorAll(".styled-option-chip").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.size === size);
  });
}

function setStyledColorSelection(color) {
  if (styledColorInput) {
    styledColorInput.value = color;
  }

  styledColorOptions?.querySelectorAll(".styled-color-swatch").forEach((swatch) => {
    swatch.classList.toggle("active", swatch.dataset.color === color);
  });
}

function openStyledParagraphEditor(block = null) {
  if (!styledParagraphModal || !styledParagraphForm) {
    return;
  }

  if (draftStyledParagraphs.length >= MAX_MEMO_STYLED_PARAGRAPH_BLOCKS && !block) {
    showAppNotice(`서식 문단은 메모 하나에 ${MAX_MEMO_STYLED_PARAGRAPH_BLOCKS}개까지 추가할 수 있습니다.`, "warning", { title: "추가 제한" });
    return;
  }

  styledParagraphForm.reset();
  editingStyledIdInput.value = block?.id || "";
  styledTextInput.value = block?.text || "";
  styledBoldInput.checked = Boolean(block?.bold);
  setStyledSizeSelection(block?.size || "normal");
  setStyledColorSelection(block?.color || "default");
  document.querySelector("#saveStyledParagraphButton").textContent = block ? "수정 완료" : "추가";
  document.querySelector("#styledParagraphTitle").textContent = block ? "서식 문단 수정" : "서식 문단 삽입";
  setStyledParagraphStatus();

  styledParagraphModal.hidden = false;
  styledParagraphModal.classList.remove("hidden");
  styledParagraphModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  window.setTimeout(() => styledTextInput?.focus(), 0);
}

function closeStyledParagraphEditor() {
  if (!styledParagraphModal) {
    return;
  }

  styledParagraphModal.classList.add("hidden");
  styledParagraphModal.hidden = true;
  styledParagraphModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  styledParagraphForm?.reset();
  setStyledParagraphStatus();
}

function handleStyledParagraphSubmit(event) {
  event.preventDefault();

  const text = String(styledTextInput?.value || "").trim();

  if (!text) {
    setStyledParagraphStatus("내용을 입력하세요.", "error");
    styledTextInput?.focus();
    return;
  }

  const existingId = editingStyledIdInput?.value || "";
  const block = {
    id: existingId || createSafeId("styled"),
    type: "styled_paragraph",
    text,
    bold: Boolean(styledBoldInput?.checked),
    size: styledSizeInput?.value || "normal",
    color: styledColorInput?.value || "default",
  };

  if (existingId) {
    draftStyledParagraphs = draftStyledParagraphs.map((item) =>
      item.id === existingId ? block : item
    );
  } else {
    draftStyledParagraphs.push(block);
  }

  renderDraftStyledParagraphs();
  updateEditorDirtyState();
  closeStyledParagraphEditor();
  showAppNotice(existingId ? "서식 문단을 수정했습니다." : "서식 문단을 메모에 추가했습니다.", "success", {
    title: existingId ? "수정 완료" : "추가 완료",
  });
}

function handleStyledDraftListClick(event) {
  const actionButton = event.target.closest("[data-styled-action]");

  if (!actionButton) {
    return;
  }

  const styledId = actionButton.dataset.styledId || "";
  const block = draftStyledParagraphs.find((item) => item.id === styledId);

  if (!block) {
    return;
  }

  if (actionButton.dataset.styledAction === "edit") {
    openStyledParagraphEditor(block);
    return;
  }

  if (actionButton.dataset.styledAction === "delete") {
    draftStyledParagraphs = draftStyledParagraphs.filter((item) => item.id !== styledId);
    renderDraftStyledParagraphs();
    updateEditorDirtyState();
    showAppNotice("서식 문단을 메모에서 삭제했습니다.", "info", { title: "삭제 완료" });
  }
}

function handleStyledParagraphModalClick(event) {
  if (event.target.dataset.styledEditorClose === "true") {
    closeStyledParagraphEditor();
  }
}

/* ===== 표 ===== */

function createEmptyTableRows(rowCount = 3, colCount = 3) {
  return Array.from({ length: rowCount }, () => Array.from({ length: colCount }, () => ""));
}

function renderTableEditorGrid() {
  if (!tableEditorGrid) {
    return;
  }

  tableEditorGrid.innerHTML = tableEditorRows
    .map(
      (row, rowIndex) => `
        <div class="table-editor-row">
          ${row
            .map(
              (cell, colIndex) => `
                <input
                  class="table-editor-cell"
                  data-row="${rowIndex}"
                  data-col="${colIndex}"
                  value="${escapeHtml(cell)}"
                  maxlength="${MAX_MEMO_TABLE_CELL_LENGTH}"
                />
              `
            )
            .join("")}
        </div>
      `
    )
    .join("");
}

function readTableEditorGridFromDom() {
  if (!tableEditorGrid) {
    return;
  }

  tableEditorGrid.querySelectorAll(".table-editor-cell").forEach((input) => {
    const rowIndex = Number(input.dataset.row);
    const colIndex = Number(input.dataset.col);

    if (tableEditorRows[rowIndex] && tableEditorRows[rowIndex][colIndex] !== undefined) {
      tableEditorRows[rowIndex][colIndex] = input.value;
    }
  });
}

function renderDraftTables() {
  if (!tableDraftSection || !tableDraftList || !tableCountLabel) {
    return;
  }

  tableCountLabel.textContent = `${draftTables.length}개`;
  tableDraftSection.hidden = draftTables.length === 0;

  if (draftTables.length === 0) {
    tableDraftList.innerHTML = "";
    return;
  }

  tableDraftList.innerHTML = draftTables
    .map((block) => `
      <article class="link-draft-item" data-table-id="${escapeHtml(block.id)}">
        <span class="link-draft-anchor">
          <span class="link-draft-icon" aria-hidden="true">▦</span>
          <span class="link-draft-copy">
            <strong>표</strong>
            <small>${block.rows.length}행 × ${(block.rows[0] || []).length}열</small>
          </span>
        </span>
        <div class="link-draft-actions">
          <button class="text-button compact-button" data-table-action="edit" data-table-id="${escapeHtml(block.id)}" type="button">수정</button>
          <button class="text-button compact-button danger-text" data-table-action="delete" data-table-id="${escapeHtml(block.id)}" type="button">삭제</button>
        </div>
      </article>
    `)
    .join("");
}

function loadDraftTables(blocks) {
  draftTables = (Array.isArray(blocks) ? blocks : []).slice(0, MAX_MEMO_TABLE_BLOCKS);
  renderDraftTables();
}

function resetDraftTables() {
  draftTables = [];
  renderDraftTables();
}

function setTableEditorStatus(message = "", state = "") {
  if (!tableEditorStatus) {
    return;
  }

  tableEditorStatus.textContent = message;

  if (state) {
    tableEditorStatus.dataset.state = state;
  } else {
    delete tableEditorStatus.dataset.state;
  }
}

function openTableEditor(block = null) {
  if (!tableEditorModal) {
    return;
  }

  if (draftTables.length >= MAX_MEMO_TABLE_BLOCKS && !block) {
    showAppNotice(`표는 메모 하나에 ${MAX_MEMO_TABLE_BLOCKS}개까지 추가할 수 있습니다.`, "warning", { title: "추가 제한" });
    return;
  }

  editingTableDraftId = block?.id || "";
  tableEditorRows = block
    ? block.rows.map((row) => [...row])
    : createEmptyTableRows();
  renderTableEditorGrid();
  setTableEditorStatus();
  document.querySelector("#tableEditorTitle").textContent = block ? "표 수정" : "표 삽입";
  document.querySelector("#saveTableButton").textContent = block ? "수정 완료" : "추가";

  tableEditorModal.hidden = false;
  tableEditorModal.classList.remove("hidden");
  tableEditorModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeTableEditor() {
  if (!tableEditorModal) {
    return;
  }

  tableEditorModal.classList.add("hidden");
  tableEditorModal.hidden = true;
  tableEditorModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  setTableEditorStatus();
}

function handleAddTableRow() {
  readTableEditorGridFromDom();
  const colCount = (tableEditorRows[0] || []).length || 3;

  if (tableEditorRows.length >= MAX_MEMO_TABLE_ROWS) {
    setTableEditorStatus(`행은 최대 ${MAX_MEMO_TABLE_ROWS}개까지 만들 수 있습니다.`, "error");
    return;
  }

  tableEditorRows.push(Array.from({ length: colCount }, () => ""));
  renderTableEditorGrid();
}

function handleAddTableCol() {
  readTableEditorGridFromDom();

  if ((tableEditorRows[0] || []).length >= MAX_MEMO_TABLE_COLS) {
    setTableEditorStatus(`열은 최대 ${MAX_MEMO_TABLE_COLS}개까지 만들 수 있습니다.`, "error");
    return;
  }

  tableEditorRows = tableEditorRows.map((row) => [...row, ""]);
  renderTableEditorGrid();
}

function handleRemoveTableRow() {
  readTableEditorGridFromDom();

  if (tableEditorRows.length <= 1) {
    return;
  }

  tableEditorRows.pop();
  renderTableEditorGrid();
}

function handleRemoveTableCol() {
  readTableEditorGridFromDom();

  if ((tableEditorRows[0] || []).length <= 1) {
    return;
  }

  tableEditorRows = tableEditorRows.map((row) => row.slice(0, -1));
  renderTableEditorGrid();
}

function handleSaveTableClick() {
  readTableEditorGridFromDom();

  const hasContent = tableEditorRows.some((row) => row.some((cell) => cell.trim().length > 0));

  if (!hasContent) {
    setTableEditorStatus("표에 내용을 하나 이상 입력하세요.", "error");
    return;
  }

  const block = {
    id: editingTableDraftId || createSafeId("table"),
    type: "table",
    rows: tableEditorRows.map((row) => [...row]),
  };

  if (editingTableDraftId) {
    draftTables = draftTables.map((item) => (item.id === editingTableDraftId ? block : item));
  } else {
    draftTables.push(block);
  }

  renderDraftTables();
  updateEditorDirtyState();
  closeTableEditor();
  showAppNotice(editingTableDraftId ? "표를 수정했습니다." : "표를 메모에 추가했습니다.", "success", {
    title: editingTableDraftId ? "수정 완료" : "추가 완료",
  });
}

function handleTableDraftListClick(event) {
  const actionButton = event.target.closest("[data-table-action]");

  if (!actionButton) {
    return;
  }

  const tableId = actionButton.dataset.tableId || "";
  const block = draftTables.find((item) => item.id === tableId);

  if (!block) {
    return;
  }

  if (actionButton.dataset.tableAction === "edit") {
    openTableEditor(block);
    return;
  }

  if (actionButton.dataset.tableAction === "delete") {
    draftTables = draftTables.filter((item) => item.id !== tableId);
    renderDraftTables();
    updateEditorDirtyState();
    showAppNotice("표를 메모에서 삭제했습니다.", "info", { title: "삭제 완료" });
  }
}

function handleTableEditorModalClick(event) {
  if (event.target.dataset.tableEditorClose === "true") {
    closeTableEditor();
  }
}

/* ===== 이미지 ===== */

function renderDraftImages() {
  if (!imageDraftSection || !imageDraftList || !imageCountLabel) {
    return;
  }

  imageCountLabel.textContent = `${draftImages.length}개`;
  imageDraftSection.hidden = draftImages.length === 0;

  if (draftImages.length === 0) {
    imageDraftList.innerHTML = "";
    return;
  }

  imageDraftList.innerHTML = draftImages
    .map((block) => `
      <article class="link-draft-item" data-image-id="${escapeHtml(block.id)}">
        <span class="link-draft-anchor">
          <span class="link-draft-icon" aria-hidden="true">🖼</span>
          <span class="link-draft-copy">
            <strong>${escapeHtml(block.alt || "이미지")}</strong>
          </span>
        </span>
        <div class="link-draft-actions">
          <button class="text-button compact-button danger-text" data-image-action="delete" data-image-id="${escapeHtml(block.id)}" type="button">삭제</button>
        </div>
      </article>
    `)
    .join("");
}

function loadDraftImages(blocks) {
  draftImages = (Array.isArray(blocks) ? blocks : []).slice(0, MAX_MEMO_IMAGE_BLOCKS);
  renderDraftImages();
}

function resetDraftImages() {
  draftImages = [];
  renderDraftImages();
}

function setImageUploadStatus(message = "", state = "") {
  if (!imageUploadStatus) {
    return;
  }

  imageUploadStatus.textContent = message;

  if (state) {
    imageUploadStatus.dataset.state = state;
  } else {
    delete imageUploadStatus.dataset.state;
  }
}

function openImageUploadModal() {
  if (!imageUploadModal || !imageUploadForm) {
    return;
  }

  if (draftImages.length >= MAX_MEMO_IMAGE_BLOCKS) {
    showAppNotice(`이미지는 메모 하나에 ${MAX_MEMO_IMAGE_BLOCKS}개까지 추가할 수 있습니다.`, "warning", { title: "추가 제한" });
    return;
  }

  imageUploadForm.reset();
  if (imageUploadPreview) {
    imageUploadPreview.hidden = true;
    imageUploadPreview.innerHTML = "";
  }
  setImageUploadStatus();

  imageUploadModal.hidden = false;
  imageUploadModal.classList.remove("hidden");
  imageUploadModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeImageUploadModal() {
  if (!imageUploadModal) {
    return;
  }

  imageUploadModal.classList.add("hidden");
  imageUploadModal.hidden = true;
  imageUploadModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  imageUploadForm?.reset();
  setImageUploadStatus();
}

function handleImageFileChange() {
  const file = imageFileInput?.files?.[0];

  if (!imageUploadPreview) {
    return;
  }

  if (!file) {
    imageUploadPreview.hidden = true;
    imageUploadPreview.innerHTML = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    imageUploadPreview.innerHTML = `<img alt="미리보기" src="${reader.result}"/>`;
    imageUploadPreview.hidden = false;
  };
  reader.readAsDataURL(file);
}

async function handleImageUploadSubmit(event) {
  event.preventDefault();

  const file = imageFileInput?.files?.[0];

  if (!file) {
    setImageUploadStatus("이미지 파일을 선택하세요.", "error");
    return;
  }

  const saveImageButton = document.querySelector("#saveImageButton");
  setActionButtonBusy(saveImageButton, true, "업로드 중...", "추가");
  setImageUploadStatus("업로드 중입니다...", "");

  try {
    const url = await uploadMemoImage(file);
    const block = {
      id: createSafeId("image"),
      type: "image",
      url,
      alt: String(imageAltInput?.value || "").trim(),
    };

    draftImages.push(block);
    renderDraftImages();
    updateEditorDirtyState();
    closeImageUploadModal();
    showAppNotice("이미지를 메모에 추가했습니다.", "success", { title: "추가 완료" });
  } catch (error) {
    console.error(error);
    setImageUploadStatus(translateCloudError(error), "error");
  } finally {
    setActionButtonBusy(saveImageButton, false, "업로드 중...", "추가");
  }
}

function handleImageDraftListClick(event) {
  const actionButton = event.target.closest("[data-image-action]");

  if (!actionButton) {
    return;
  }

  const imageId = actionButton.dataset.imageId || "";

  if (actionButton.dataset.imageAction === "delete") {
    draftImages = draftImages.filter((item) => item.id !== imageId);
    renderDraftImages();
    updateEditorDirtyState();
    showAppNotice("이미지를 메모에서 삭제했습니다.", "info", { title: "삭제 완료" });
  }
}

function handleImageUploadModalClick(event) {
  if (event.target.dataset.imageEditorClose === "true") {
    closeImageUploadModal();
  }
}

/* ===== PDF 내보내기 ===== */

function handleExportPdfClick() {
  window.print();
}

function getEditorSnapshot() {
  return JSON.stringify({
    title: titleInput?.value || "",
    project: projectInput?.value || "",
    content: contentInput?.value || "",
    category: categoryInput?.value || "",
    important: Boolean(importantInput?.checked),
    editingId: editingIdInput?.value || "",
    tasks: draftTasks.map((task) => ({
      text: task.text,
      done: Boolean(task.done),
    })),
    links: draftLinks.map((link) => ({
      id: link.id,
      url: link.url,
      label: link.label,
    })),
  });
}

function markEditorClean() {
  editorCleanSnapshot = getEditorSnapshot();
  isEditorDirty = false;
}

function updateEditorDirtyState() {
  isEditorDirty = getEditorSnapshot() !== editorCleanSnapshot;
  scheduleDraftAutoSave();
}


function getDraftStorageKey(userId = currentCloudUserId) {
  return userId ? `${DRAFT_STORAGE_PREFIX}:${userId}` : "";
}

function hasDraftContent(draft) {
  if (!draft) {
    return false;
  }

  return Boolean(
    String(draft.title || "").trim() ||
    String(draft.project || "").trim() ||
    String(draft.content || "").trim() ||
    String(draft.editingId || "").trim() ||
    (Array.isArray(draft.tasks) && draft.tasks.length > 0) ||
    (Array.isArray(draft.links) && draft.links.length > 0)
  );
}

function buildLocalEditorDraft() {
  return {
    version: "5.0",
    userId: currentCloudUserId,
    savedAt: new Date().toISOString(),
    title: titleInput?.value || "",
    project: projectInput?.value || "",
    content: contentInput?.value || "",
    category: categoryInput?.value || "업무",
    isImportant: Boolean(importantInput?.checked),
    editingId: editingIdInput?.value || "",
    editingUpdatedAt: editingUpdatedAtInput?.value || "",
    tasks: draftTasks.map((task) => ({
      id: task.id,
      text: task.text,
      done: Boolean(task.done),
    })),
    links: draftLinks.map((link) => ({
      id: link.id,
      type: "link",
      url: link.url,
      label: link.label,
    })),
  };
}

function formatDraftSavedTime(dateString) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function setDraftSaveStatus(message, state = "ready") {
  if (!draftSaveStatus) {
    return;
  }

  draftSaveStatus.textContent = message;
  draftSaveStatus.dataset.state = state;
}

function showDraftRecoveryBanner(draft) {
  if (!draftRecoveryBanner || !draft) {
    return;
  }

  recoverableDraft = draft;
  draftRecoveryBanner.hidden = false;
  draftRecoveryBanner.setAttribute("aria-hidden", "false");

  const savedTime = formatDraftSavedTime(draft.savedAt);
  const typeText = draft.editingId ? "수정 중이던 메모" : "작성 중이던 새 메모";

  if (draftRecoveryDescription) {
    draftRecoveryDescription.textContent =
      `${typeText}입니다` +
      (savedTime ? ` · 마지막 자동 저장 ${savedTime}` : "") +
      ".";
  }
}

function hideDraftRecoveryBanner() {
  if (!draftRecoveryBanner) {
    return;
  }

  draftRecoveryBanner.hidden = true;
  draftRecoveryBanner.setAttribute("aria-hidden", "true");
  recoverableDraft = null;
}

function readLocalEditorDraft(userId = currentCloudUserId) {
  const storageKey = getDraftStorageKey(userId);

  if (!storageKey) {
    return null;
  }

  try {
    const rawDraft = window.localStorage.getItem(storageKey);

    if (!rawDraft) {
      return null;
    }

    const draft = JSON.parse(rawDraft);
    const savedAt = new Date(draft.savedAt).getTime();

    if (
      !draft ||
      draft.userId !== userId ||
      Number.isNaN(savedAt) ||
      Date.now() - savedAt > DRAFT_MAX_AGE_MS ||
      !hasDraftContent(draft)
    ) {
      window.localStorage.removeItem(storageKey);
      return null;
    }

    return draft;
  } catch (error) {
    console.error("초안 불러오기 실패:", error);

    try {
      window.localStorage.removeItem(storageKey);
    } catch (_) {}

    return null;
  }
}

function saveLocalEditorDraft() {
  if (!currentCloudUserId || !isEditorDirty) {
    return;
  }

  const storageKey = getDraftStorageKey();

  if (!storageKey) {
    return;
  }

  const draft = buildLocalEditorDraft();

  if (!hasDraftContent(draft)) {
    clearLocalEditorDraft();
    return;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(draft));
    recoverableDraft = draft;
    setDraftSaveStatus(
      `초안 자동 저장됨 · ${formatDraftSavedTime(draft.savedAt)}`,
      "saved"
    );
  } catch (error) {
    console.error("초안 자동 저장 실패:", error);
    setDraftSaveStatus("초안을 자동 저장하지 못했습니다.", "error");
  }
}

function scheduleDraftAutoSave() {
  if (draftAutoSaveTimer) {
    window.clearTimeout(draftAutoSaveTimer);
  }

  if (!isEditorDirty || !currentCloudUserId) {
    return;
  }

  setDraftSaveStatus("초안 저장 준비 중...", "saving");

  draftAutoSaveTimer = window.setTimeout(() => {
    draftAutoSaveTimer = null;
    saveLocalEditorDraft();
  }, DRAFT_AUTO_SAVE_DELAY_MS);
}

function clearLocalEditorDraft(userId = currentCloudUserId) {
  if (draftAutoSaveTimer) {
    window.clearTimeout(draftAutoSaveTimer);
    draftAutoSaveTimer = null;
  }

  const storageKey = getDraftStorageKey(userId);

  if (storageKey) {
    try {
      window.localStorage.removeItem(storageKey);
    } catch (error) {
      console.error("초안 삭제 실패:", error);
    }
  }

  hideDraftRecoveryBanner();
  setDraftSaveStatus(
    "작성 내용은 이 브라우저에 자동 저장됩니다.",
    "ready"
  );
}

function checkForRecoverableDraft(userId = currentCloudUserId) {
  if (!userId || window.solonotePasswordRecoveryActive) {
    return;
  }

  const draft = readLocalEditorDraft(userId);

  if (draft) {
    showDraftRecoveryBanner(draft);
  } else {
    hideDraftRecoveryBanner();
  }
}

function restoreLocalEditorDraft() {
  const draft = recoverableDraft || readLocalEditorDraft();

  if (!draft) {
    showAppNotice("복구할 초안이 없습니다.", "info");
    hideDraftRecoveryBanner();
    return;
  }

  const originalMemoExists =
    !draft.editingId || Boolean(findMemoById(draft.editingId));

  titleInput.value = draft.title || "";
  projectInput.value = draft.project || "";
  contentInput.value = draft.content || "";
  categoryInput.value = draft.category || "업무";

  if (!categoryInput.value) {
    const fallbackOption = [...categoryInput.options].find(
      (option) => option.value === FALLBACK_MEMO_CATEGORY
    );
    categoryInput.value = fallbackOption
      ? FALLBACK_MEMO_CATEGORY
      : categoryInput.options[0]?.value || "업무";
  }

  importantInput.checked = Boolean(draft.isImportant);
  syncCategoryPicker();

  editingIdInput.value = originalMemoExists ? draft.editingId || "" : "";
  editingUpdatedAtInput.value = originalMemoExists
    ? draft.editingUpdatedAt || ""
    : "";

  loadDraftTasks(
    Array.isArray(draft.tasks)
      ? draft.tasks.map((task) => ({
          id: task.id || createDraftTask(task.text || "").id,
          text: String(task.text || ""),
          done: Boolean(task.done),
        }))
      : []
  );

  loadDraftLinks(Array.isArray(draft.links) ? draft.links : []);

  setEditorMode(editingIdInput.value ? "edit" : "create");
  openEditor();
  hideDraftRecoveryBanner();

  editorCleanSnapshot = "";
  updateEditorDirtyState();
  setDraftSaveStatus(
    originalMemoExists
      ? "자동 저장된 초안을 복구했습니다."
      : "원본 메모를 찾지 못해 새 메모 초안으로 복구했습니다.",
    "restored"
  );

  document.querySelector(".editor-panel")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });

  window.setTimeout(() => {
    (titleInput.value.trim() ? contentInput : titleInput)?.focus();
  }, 250);
}

function discardLocalEditorDraft() {
  if (!recoverableDraft && !readLocalEditorDraft()) {
    hideDraftRecoveryBanner();
    return;
  }

  const shouldDiscard = window.confirm(
    "자동 저장된 초안을 삭제하시겠습니까? 삭제한 초안은 복구할 수 없습니다."
  );

  if (!shouldDiscard) {
    return;
  }

  clearLocalEditorDraft();
}

function hasUnsavedEditorChanges() {
  const editorPanel = document.querySelector(".editor-panel");

  return Boolean(
    isEditorDirty &&
    editorPanel &&
    !editorPanel.classList.contains("collapsed")
  );
}

function confirmDiscardEditorChanges(message = "저장하지 않은 작성 내용이 있습니다. 계속하시겠습니까?") {
  if (!hasUnsavedEditorChanges()) {
    return true;
  }

  return window.confirm(message);
}

function handleBeforeUnload(event) {
  if (!hasUnsavedEditorChanges()) {
    return;
  }

  saveLocalEditorDraft();
  event.preventDefault();
  event.returnValue = "";
}

function resetMemoFilters() {
  currentCategory = "전체";
  currentSearch = "";
  currentSort = "updatedDesc";

  searchInput.value = "";
  setActiveCategory(currentCategory);
  setActiveSort(currentSort);
  refreshScreen();
}

function setActiveSort(sort) {
  sortOptions?.querySelectorAll("[data-sort]").forEach((button) => {
    const isActive = button.dataset.sort === sort;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}


function isEditorOpen() {
  const editorPanel = document.querySelector(".editor-panel");
  return Boolean(editorPanel && !editorPanel.classList.contains("collapsed"));
}

function syncMobileNewMemoButton() {
  if (!mobileNewMemoButton) {
    return;
  }

  mobileNewMemoButton.hidden =
    currentAppView !== "notes" || isEditorOpen();
}

function isDesktopLayout() {
  return window.matchMedia("(min-width: 1024px)").matches;
}

function closeAppMenu(options = {}) {
  if (!appMenuPanel || !appMenuBackdrop || !appMenuButton) {
    return;
  }

  if (
    !options.skipHistory &&
    closeAppHistoryLayer("menu")
  ) {
    return;
  }

  isAppMenuOpen = false;
  showMenuSubview("main");

  if (appMenuCloseTimer) {
    window.clearTimeout(appMenuCloseTimer);
  }

  appMenuPanel.classList.remove("is-open");
  appMenuBackdrop.classList.remove("is-open");
  appMenuButton.setAttribute("aria-expanded", "false");
  document.body.classList.remove("menu-open");

  if (isDesktopLayout()) {
    appMenuPanel.setAttribute("aria-hidden", "false");
    return;
  }

  appMenuPanel.setAttribute("aria-hidden", "true");

  appMenuCloseTimer = window.setTimeout(() => {
    appMenuPanel.hidden = true;
    appMenuBackdrop.hidden = true;
    appMenuCloseTimer = null;
  }, 260);
}



function showMenuSubview(view = "main") {
  const isSettings = view === "settings";

  if (menuMainView) {
    menuMainView.hidden = isSettings;
  }

  if (menuSettingsView) {
    menuSettingsView.hidden = !isSettings;
  }

  if (menuHeaderTitle) {
    menuHeaderTitle.textContent = isSettings ? "설정" : "";
  }

  if (menuSettingsBackButton) {
    menuSettingsBackButton.hidden = !isSettings;
  }

  if (openSettingsButton) {
    openSettingsButton.setAttribute("aria-pressed", String(isSettings));
  }

  if (!isSettings && menuAccountManagementContent && menuAccountManagementToggleButton) {
    menuAccountManagementContent.hidden = true;
    menuAccountManagementToggleButton.classList.remove("is-open");
    menuAccountManagementToggleButton.setAttribute("aria-expanded", "false");
  }
}

function openAppMenu(options = {}) {
  if (!appMenuPanel || !appMenuBackdrop || !appMenuButton) {
    return;
  }

  if (!options.skipHistory) {
    openAppHistoryLayer("menu");
  }

  isAppMenuOpen = true;

  if (appMenuCloseTimer) {
    window.clearTimeout(appMenuCloseTimer);
    appMenuCloseTimer = null;
  }

  showMenuSubview("main");

  appMenuPanel.hidden = false;
  appMenuBackdrop.hidden = false;
  appMenuPanel.setAttribute("aria-hidden", "false");
  appMenuButton.setAttribute("aria-expanded", "true");
  document.body.classList.add("menu-open");

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      if (!isAppMenuOpen) {
        return;
      }

      appMenuPanel.classList.add("is-open");
      appMenuBackdrop.classList.add("is-open");
      openSettingsButton?.focus();
    });
  });
}

function handleOpenTrashClick() {
  switchAppView("trash", { historyMode: "replace" });
  closeAppMenu({ skipHistory: true });

  window.setTimeout(() => {
    trashView?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 280);
}

function handleHomeLogoClick(event) {
  closeCategoryPicker();
  event?.preventDefault();
  closeAppMenu({ skipHistory: true });
  closeCategoryManager({ skipHistory: true });
  closeDetailModal({ skipHistory: true });

  let savedDraft = null;

  if (isEditorOpen()) {
    if (hasUnsavedEditorChanges()) {
      saveLocalEditorDraft();
      savedDraft = readLocalEditorDraft();

      if (!savedDraft) {
        const shouldLeaveEditor = window.confirm(
          "작성 중인 내용을 자동 저장하지 못했습니다. 홈으로 이동하면 입력 내용이 사라질 수 있습니다. 그래도 이동할까요?"
        );

        if (!shouldLeaveEditor) {
          return;
        }
      }
    }

    resetForm();
    closeEditor({ skipHistory: true });
  }

  resetMemoFilters();
  switchAppView("notes", {
    historyMode: "replace",
    scrollBehavior: "smooth",
  });

  if (savedDraft) {
    showDraftRecoveryBanner(savedDraft);
  }

  window.setTimeout(() => homeLogoButton?.focus(), 0);
}

function switchAppView(view, options = {}) {
  const allowedViews = ["notes", "tasks", "calendar", "trash"];
  currentAppView = allowedViews.includes(view) ? view : "notes";

  if (currentAppView !== "notes") {
    exitMemoSelectionMode();
  }

  const isNotes = currentAppView === "notes";
  const isTasks = currentAppView === "tasks";
  const isCalendar = currentAppView === "calendar";
  const isTrash = currentAppView === "trash";

  document.body.dataset.appView = currentAppView;

  notesView.hidden = !isNotes;
  tasksView.hidden = !isTasks;
  calendarView.hidden = !isCalendar;
  trashView.hidden = !isTrash;

  notesViewTab.classList.toggle("active", isNotes);
  tasksViewTab.classList.toggle("active", isTasks);
  calendarViewTab.classList.toggle("active", isCalendar);
  notesViewTab.setAttribute("aria-selected", String(isNotes));
  tasksViewTab.setAttribute("aria-selected", String(isTasks));
  calendarViewTab.setAttribute("aria-selected", String(isCalendar));

  if (isTasks) {
    refreshTaskHub();
  }

  if (isCalendar) {
    renderCalendar();
  }

  if (isTrash) {
    refreshTrashView();
  }

  syncMobileNewMemoButton();
  syncAppViewHistory(currentAppView, options.historyMode || "auto");
  window.scrollTo({
    top: 0,
    behavior: options.scrollBehavior || "smooth",
  });
}

function handlePrimaryViewClick(event) {
  const button = event.target.closest("[data-app-view]");

  if (!button) {
    return;
  }

  switchAppView(button.dataset.appView);
}

function handleDataManagementToggle() {
  if (!dataManagementToggleButton || !dataManagementContent) {
    return;
  }

  const willOpen = dataManagementContent.hidden;
  dataManagementContent.hidden = !willOpen;
  dataManagementToggleButton.textContent = willOpen ? "닫기" : "열기";
  dataManagementToggleButton.setAttribute("aria-expanded", String(willOpen));
}



function handleOpenSettingsClick() {
  if (!isAppMenuOpen) {
    openAppMenu({ skipHistory: true });
  }

  showMenuSubview("settings");
  window.setTimeout(() => menuSettingsBackButton?.focus(), 0);
}

function handleMenuSettingsBackClick() {
  showMenuSubview("main");
  window.setTimeout(() => openSettingsButton?.focus(), 0);
}

function handleMenuAccountManagementToggle() {
  if (!menuAccountManagementToggleButton || !menuAccountManagementContent) {
    return;
  }

  const willOpen = menuAccountManagementContent.hidden;
  menuAccountManagementContent.hidden = !willOpen;
  menuAccountManagementToggleButton.classList.toggle("is-open", willOpen);
  menuAccountManagementToggleButton.setAttribute("aria-expanded", String(willOpen));
}

function handleEditorBackClick() {
  closeCategoryPicker();
  if (hasUnsavedEditorChanges()) {
    saveLocalEditorDraft();
  }

  resetForm();
  closeEditor();
}

function handleMobileNewMemoClick() {
  switchAppView("notes");
  if (!confirmDiscardEditorChanges()) {
    return;
  }

  if (readLocalEditorDraft()) {
    const shouldStartNew = window.confirm(
      "자동 저장된 초안이 있습니다. 초안을 삭제하고 새 메모를 작성하시겠습니까?"
    );

    if (!shouldStartNew) {
      showDraftRecoveryBanner(readLocalEditorDraft());
      return;
    }

    clearLocalEditorDraft();
  }

  resetForm();
  openEditor();
  document.querySelector(".editor-panel")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
  window.setTimeout(() => titleInput?.focus(), 250);
}

function handleCancelEditorClick() {
  closeCategoryPicker();
  if (
    !confirmDiscardEditorChanges(
      "저장하지 않은 수정 내용이 있습니다. 수정을 취소하시겠습니까?"
    )
  ) {
    return;
  }

  clearLocalEditorDraft();
  cancelEditAndCloseEditor();
}

function handleBeforeLogout(event) {
  if (
    !confirmDiscardEditorChanges(
      "저장하지 않은 작성 내용이 있습니다. 로그아웃하시겠습니까?"
    )
  ) {
    event.preventDefault();
    return;
  }

  clearLocalEditorDraft();
  resetForm();
  closeEditor();
}

function setCloudStatus(message, state = "ready") {
  if (!cloudSyncStatus) {
    return;
  }

  cloudSyncStatus.textContent = message;
  cloudSyncStatus.dataset.state = state;
  document.body.classList.toggle("is-offline", state === "offline");
}

function showAppNotice(message, state = "info", options = {}) {
  if (feedback?.show) {
    return feedback.show(message, {
      state,
      ...options,
    });
  }

  if (state === "error") {
    window.alert(message);
  }

  return null;
}

function setActionButtonBusy(button, isBusy, busyText, normalText = "") {
  if (feedback?.setButtonBusy) {
    feedback.setButtonBusy(button, isBusy, busyText, normalText);
    return;
  }

  if (!button) {
    return;
  }

  button.disabled = isBusy;
  button.textContent = isBusy ? busyText : normalText;
}

function isSessionCloudError(error) {
  const message = String(error?.message || "");
  const code = String(error?.code || "");

  return (
    /jwt.*expired|invalid.*jwt|session.*missing|session.*expired|refresh token|not authenticated/i.test(message) ||
    /jwt_expired|session_not_found|refresh_token_not_found/i.test(code)
  );
}

function requestFreshLogin(message) {
  window.dispatchEvent(
    new CustomEvent("solonote-session-expired", {
      detail: { message },
    })
  );
}



function closeCategoryPicker(options = {}) {
  if (!categoryPickerButton || !categoryPickerMenu) {
    return;
  }

  categoryPickerMenu.hidden = true;
  categoryPickerButton.setAttribute("aria-expanded", "false");

  if (options.restoreFocus) {
    categoryPickerButton.focus();
  }
}

function syncCategoryPicker() {
  if (!categoryInput || !categoryPickerMenu || !categoryPickerValue) {
    return;
  }

  const options = [...categoryInput.options];
  const selectedValue = categoryInput.value || options[0]?.value || "";
  categoryPickerValue.textContent = selectedValue || "카테고리 선택";

  const optionButtons = options.map((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "category-picker-option";
    button.dataset.value = option.value;
    button.setAttribute("role", "option");
    button.setAttribute("aria-selected", String(option.value === selectedValue));
    button.textContent = option.textContent || option.value;
    return button;
  });

  categoryPickerMenu.replaceChildren(...optionButtons);
}

function toggleCategoryPicker() {
  if (!categoryPickerButton || !categoryPickerMenu) {
    return;
  }

  const willOpen = categoryPickerMenu.hidden;
  categoryPickerMenu.hidden = !willOpen;
  categoryPickerButton.setAttribute("aria-expanded", String(willOpen));

  if (willOpen) {
    syncCategoryPicker();
    window.requestAnimationFrame(() => {
      categoryPickerMenu
        ?.querySelector('[aria-selected="true"]')
        ?.focus();
    });
  }
}

function handleCategoryPickerMenuClick(event) {
  const optionButton = event.target.closest(".category-picker-option");

  if (!optionButton || !categoryPickerMenu?.contains(optionButton) || !categoryInput) {
    return;
  }

  categoryInput.value = optionButton.dataset.value || "";
  categoryInput.dispatchEvent(new Event("change", { bubbles: true }));
  syncCategoryPicker();
  closeCategoryPicker({ restoreFocus: true });
}

function handleCategoryPickerKeydown(event) {
  if (event.key === "Escape") {
    closeCategoryPicker({ restoreFocus: true });
    return;
  }

  const optionButtons = [...categoryPickerMenu?.querySelectorAll(".category-picker-option") || []];
  const currentIndex = optionButtons.indexOf(document.activeElement);

  if (event.key === "ArrowDown" && optionButtons.length > 0) {
    event.preventDefault();
    optionButtons[(currentIndex + 1 + optionButtons.length) % optionButtons.length].focus();
  } else if (event.key === "ArrowUp" && optionButtons.length > 0) {
    event.preventDefault();
    optionButtons[(currentIndex - 1 + optionButtons.length) % optionButtons.length].focus();
  }
}

function handleDocumentCategoryPickerClick(event) {
  if (!categoryPicker || categoryPicker.contains(event.target)) {
    return;
  }

  closeCategoryPicker();
}

function getManagedMemoCategoryNames() {
  const cloudCategories = getMemoCategories().map((category) => category.name);
  return cloudCategories.length > 0
    ? cloudCategories
    : [...DEFAULT_MEMO_CATEGORIES];
}

function getCompatibilityMemoCategoryNames() {
  return [...COMPATIBILITY_MEMO_CATEGORIES];
}

function createCategoryTabButton(category) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "category-tab";
  button.dataset.category = category;
  button.textContent = category;

  if (PROTECTED_MEMO_CATEGORY_NAMES.has(category)) {
    button.classList.add("protected-category-tab");
    button.title = "삭제할 수 없는 기본 카테고리";
  }

  return button;
}

function renderMemoCategoryControls() {
  if (!categoryInput || !categoryTabs) {
    return;
  }

  const previousEditorCategory = categoryInput.value;
  const editingMemo = editingIdInput?.value
    ? findMemoById(editingIdInput.value)
    : null;
  const managedNames = getManagedMemoCategoryNames();
  const compatibilityNames = getCompatibilityMemoCategoryNames();
  const selectableNames = [...new Set([...managedNames, ...compatibilityNames])];

  categoryInput.replaceChildren(
    ...selectableNames.map((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      return option;
    })
  );

  const preferredEditorCategory = editingMemo?.category || previousEditorCategory;
  categoryInput.value = selectableNames.includes(preferredEditorCategory)
    ? preferredEditorCategory
    : managedNames[0] || FALLBACK_MEMO_CATEGORY;
  syncCategoryPicker();

  const filterNames = ["전체", "중요", ...managedNames, ...compatibilityNames];
  const categoryButtons = [...new Set(filterNames)].map(createCategoryTabButton);

  categoryTabs.replaceChildren(...categoryButtons);

  const validCurrentCategories = new Set(filterNames);

  if (!validCurrentCategories.has(currentCategory)) {
    currentCategory = "전체";
  }

  setActiveCategory(currentCategory);
}

function setCategoryManagerStatus(message = "", state = "") {
  if (!categoryManagerStatus) {
    return;
  }

  categoryManagerStatus.textContent = message;

  if (state) {
    categoryManagerStatus.dataset.state = state;
  } else {
    delete categoryManagerStatus.dataset.state;
  }
}

function renderCategoryManagerList() {
  if (!categoryManagerList) {
    return;
  }

  const categories = getMemoCategories();

  if (categories.length === 0) {
    categoryManagerList.innerHTML = `
      <div class="empty-state">
        <strong>카테고리를 불러오고 있습니다.</strong>
        <p>잠시 후 다시 확인해주세요.</p>
      </div>
    `;
    return;
  }

  categoryManagerList.innerHTML = categories
    .map(
      (category) => `
        <div class="category-manager-item" data-category-id="${escapeHtml(category.id)}">
          <span class="category-manager-name" title="${escapeHtml(category.name)}">
            ${escapeHtml(category.name)}
          </span>
          <div class="category-manager-actions">
            <button
              type="button"
              class="secondary-button"
              data-category-action="rename"
              data-category-id="${escapeHtml(category.id)}"
            >
              이름 변경
            </button>
            <button
              type="button"
              class="text-button danger-text"
              data-category-action="delete"
              data-category-id="${escapeHtml(category.id)}"
              ${categories.length <= 1 ? "disabled" : ""}
            >
              삭제
            </button>
          </div>
        </div>
      `
    )
    .join("");
}

function openCategoryManager(options = {}) {
  if (!categoryManagerModal) {
    return;
  }

  categoryManagerPreviousFocus = document.activeElement;
  setCategoryManagerStatus();
  renderCategoryManagerList();
  categoryManagerModal.hidden = false;
  categoryManagerModal.classList.remove("hidden");
  categoryManagerModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  if (!options.skipHistory) {
    openAppHistoryLayer("categoryManager", {}, { preserveParent: true });
  }

  window.setTimeout(() => newCategoryInput?.focus(), 0);
}

function closeCategoryManager(options = {}) {
  if (!categoryManagerModal) {
    return;
  }

  if (
    !categoryManagerModal.hidden &&
    !options.skipHistory &&
    closeAppHistoryLayer("categoryManager")
  ) {
    return;
  }

  categoryManagerModal.classList.add("hidden");
  categoryManagerModal.hidden = true;
  categoryManagerModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  categoryCreateForm?.reset();
  setCategoryManagerStatus();

  if (
    categoryManagerPreviousFocus &&
    typeof categoryManagerPreviousFocus.focus === "function" &&
    document.contains(categoryManagerPreviousFocus)
  ) {
    categoryManagerPreviousFocus.focus();
  }

  categoryManagerPreviousFocus = null;
}

async function handleCategoryCreateSubmit(event) {
  event.preventDefault();
  const name = newCategoryInput?.value || "";

  if (addCategoryButton) {
    addCategoryButton.disabled = true;
    addCategoryButton.textContent = "추가 중";
  }

  try {
    const category = await runCloudAction(
      () => addMemoCategory(name),
      {
        loadingMessage: "카테고리 추가 중",
        successMessage: "카테고리 추가 완료",
      }
    );

    if (!category) {
      return;
    }

    categoryCreateForm?.reset();
    renderMemoCategoryControls();
    renderCategoryManagerList();
    setCategoryManagerStatus(`“${category.name}” 카테고리를 추가했습니다.`, "success");
    newCategoryInput?.focus();
  } finally {
    if (addCategoryButton) {
      addCategoryButton.disabled = false;
      addCategoryButton.textContent = "추가";
    }
  }
}

async function handleCategoryManagerListClick(event) {
  const actionButton = event.target.closest("[data-category-action]");

  if (!actionButton) {
    return;
  }

  const categoryId = actionButton.dataset.categoryId;
  const category = getMemoCategories().find((item) => item.id === categoryId);

  if (!category) {
    setCategoryManagerStatus("카테고리를 찾지 못했습니다. 새로고침 후 다시 시도해주세요.", "error");
    return;
  }

  if (actionButton.dataset.categoryAction === "rename") {
    const replacementName = prompt("새 카테고리 이름을 입력하세요.", category.name);

    if (replacementName === null) {
      return;
    }

    actionButton.disabled = true;
    const wasActiveCategory = currentCategory === category.name;
    const renamedCategory = await runCloudAction(
      () => renameMemoCategory(categoryId, replacementName),
      {
        loadingMessage: "카테고리 이름 변경 중",
        successMessage: "카테고리 이름 변경 완료",
      }
    );
    actionButton.disabled = false;

    if (!renamedCategory) {
      return;
    }

    if (wasActiveCategory) {
      currentCategory = renamedCategory.name;
    }

    renderMemoCategoryControls();
    refreshScreen();
    renderCategoryManagerList();
    setCategoryManagerStatus(
      `“${category.name}”을 “${renamedCategory.name}”으로 변경했습니다.`,
      "success"
    );
    return;
  }

  if (actionButton.dataset.categoryAction !== "delete") {
    return;
  }

  const affectedMemoCount = getMemos().filter(
    (memo) => memo.category === category.name
  ).length;
  const shouldDelete = confirm(
    `“${category.name}” 카테고리를 삭제할까요?\n\n` +
    `연결된 메모 ${affectedMemoCount}개는 삭제되지 않고 ‘미분류’로 이동합니다.`
  );

  if (!shouldDelete) {
    return;
  }

  actionButton.disabled = true;
  const wasActiveCategory = currentCategory === category.name;
  const result = await runCloudAction(
    () => deleteMemoCategory(categoryId),
    {
      loadingMessage: "카테고리 삭제 중",
      successMessage: "카테고리 삭제 완료",
    }
  );
  actionButton.disabled = false;

  if (!result) {
    return;
  }

  if (wasActiveCategory) {
    currentCategory = result.affectedMemoCount > 0
      ? FALLBACK_MEMO_CATEGORY
      : "전체";
  }

  renderMemoCategoryControls();
  refreshScreen();
  renderCategoryManagerList();
  setCategoryManagerStatus(
    result.affectedMemoCount > 0
      ? `“${category.name}”을 삭제하고 메모 ${result.affectedMemoCount}개를 ‘미분류’로 옮겼습니다.`
      : `“${category.name}” 카테고리를 삭제했습니다.`,
    "success"
  );
}

function handleCategoryManagerModalClick(event) {
  if (event.target.closest("[data-category-close='true']")) {
    closeCategoryManager();
  }
}

function isNetworkCloudError(error) {
  const message = String(error && error.message ? error.message : "");

  return (
    navigator.onLine === false ||
    /failed to fetch|network|load failed|networkerror/i.test(message)
  );
}

function setOfflineStatus() {
  setCloudStatus("오프라인 · 클라우드 저장 불가", "offline");
}

function refreshOpenDetailFromCache() {
  const modal = document.querySelector("#detailModal");
  const editButton = document.querySelector("#editMemoButton");

  if (!modal || modal.classList.contains("hidden") || !editButton) {
    return;
  }

  const memoId = editButton.dataset.id;
  const memo = memoId ? findMemoById(memoId) : null;

  if (memo) {
    openDetailModal(memo);
  } else {
    closeDetailModal();
  }
}

function scheduleAutomaticSync(reason, options = {}) {
  const {
    force = false,
    delay = 250,
  } = options;

  if (
    !currentCloudUserId ||
    navigator.onLine === false ||
    document.visibilityState === "hidden"
  ) {
    return;
  }

  if (automaticSyncTimer) {
    clearTimeout(automaticSyncTimer);
  }

  const elapsed = Date.now() - lastAutomaticSyncRequestAt;
  const waitTime = force
    ? delay
    : Math.max(delay, AUTO_SYNC_MIN_INTERVAL_MS - elapsed);

  automaticSyncTimer = setTimeout(async () => {
    automaticSyncTimer = null;
    lastAutomaticSyncRequestAt = Date.now();

    try {
      const session = await getCurrentSession();
      await loadCloudMemosForSession(session, {
        reason,
        automatic: true,
      });
    } catch (error) {
      console.error(error);

      if (isNetworkCloudError(error)) {
        setOfflineStatus();
        return;
      }

      setCloudStatus("자동 동기화 실패", "error");
    }
  }, waitTime);
}

function formatSyncTime(date = new Date()) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function updateLastSyncTime() {
  if (lastSyncTime) {
    lastSyncTime.textContent = formatSyncTime();
  }
}

function refreshLegacyMigrationPanel() {
  if (!legacyMigrationPanel || !legacyMemoCount || !migrateLegacyButton) {
    return;
  }

  const count = getLegacyMemoCount();
  legacyMemoCount.textContent = String(count);

  if (count > 0) {
    legacyMigrationPanel.dataset.state = "available";
    legacyMigrationPanel.hidden = false;
    migrateLegacyButton.disabled = false;
    migrateLegacyButton.textContent = "기존 메모를 클라우드로 옮기기";

    if (legacyMigrationMessage) {
      legacyMigrationMessage.textContent =
        `이 브라우저에 이전 버전 메모 ${count}개가 남아 있습니다. 중복을 제외하고 클라우드에 추가할 수 있습니다.`;
    }

    return;
  }

  legacyMigrationPanel.dataset.state = "empty";
  legacyMigrationPanel.hidden = true;
  migrateLegacyButton.disabled = true;
  migrateLegacyButton.textContent = "옮길 기존 메모 없음";

  if (legacyMigrationMessage) {
    legacyMigrationMessage.textContent =
      "이 브라우저에는 이전할 기존 메모가 없습니다.";
  }
}

async function getCurrentSession() {
  const client = window.solonoteSupabase;

  if (!client) {
    throw new Error("Supabase 클라이언트가 준비되지 않았습니다.");
  }

  const { data, error } = await client.auth.getSession();

  if (error) {
    throw error;
  }

  if (!data || !data.session) {
    throw new Error("로그인 세션이 없습니다. 다시 로그인해주세요.");
  }

  return data.session;
}

async function handleCloudRefreshClick() {
  setActionButtonBusy(
    cloudRefreshButton,
    true,
    "새로고침 중...",
    "클라우드 새로고침"
  );

  try {
    const session = await getCurrentSession();
    await loadCloudMemosForSession(session, {
      reason: "수동 새로고침",
      automatic: false,
    });
  } catch (error) {
    console.error(error);
    const message = translateCloudError(error);

    if (isSessionCloudError(error)) {
      requestFreshLogin(message);
    }

    showAppNotice(message, "error", {
      title: "클라우드 새로고침 실패",
      actionLabel: "다시 시도",
      onAction: () => handleCloudRefreshClick(),
      persistent: isNetworkCloudError(error),
    });
  } finally {
    setActionButtonBusy(
      cloudRefreshButton,
      false,
      "새로고침 중...",
      "클라우드 새로고침"
    );
  }
}

async function handleLegacyMigrationClick() {
  const count = getLegacyMemoCount();

  if (count === 0) {
    refreshLegacyMigrationPanel();
    showAppNotice("이 브라우저에는 이전할 기존 메모가 없습니다.", "info");
    return;
  }

  const shouldMigrate = confirm(
    `이 브라우저의 기존 메모 ${count}개를 클라우드에 추가하시겠습니까?\n\n` +
    "이미 옮겨진 메모는 중복 제외되며, 브라우저 원본은 삭제하지 않습니다."
  );

  if (!shouldMigrate) {
    return;
  }

  setActionButtonBusy(
    migrateLegacyButton,
    true,
    "클라우드로 옮기는 중...",
    "기존 메모를 클라우드로 옮기기"
  );

  const result = await runCloudAction(
    () => importLegacyMemosToCloud(),
    {
      loadingMessage: "기존 메모 이전 중",
      successMessage: "기존 메모 이전 완료",
    }
  );

  refreshLegacyMigrationPanel();

  if (!result) {
    return;
  }

  updateLastSyncTime();

  showAppNotice(
    `클라우드에 ${result.addedCount}개를 추가하고 중복 ${result.skippedCount}개를 제외했습니다. 브라우저의 기존 원본은 그대로 보존됩니다.`,
    "success",
    { title: "기존 메모 이전 완료", duration: 6500 }
  );
}

function translateCloudError(error) {
  const message = String(error && error.message ? error.message : "");
  const code = String(error && error.code ? error.code : "");
  const status = Number(error?.status || 0);

  if (isMemoConflictError(error)) {
    return "다른 기기에서 이 메모가 먼저 수정되었습니다.";
  }

  if (isSessionCloudError(error) || /로그인 세션/i.test(message)) {
    return "로그인 시간이 만료되었습니다. 다시 로그인하면 작성 중인 초안을 이어서 사용할 수 있습니다.";
  }

  if (/(content_blocks|content_format_version)/i.test(message) && /(column|schema cache|could not find)/i.test(message)) {
    return "링크 저장 구조가 아직 준비되지 않았습니다. Supabase SQL Editor에서 v4.7.0-dev1.1.1의 12번 마이그레이션 SQL을 먼저 실행하세요.";
  }

  if (/relation .*memo_categories.* does not exist/i.test(message)) {
    return "카테고리 저장 구조를 찾지 못했습니다. Supabase 설정을 확인하세요.";
  }

  if (code === "42P01" || /relation .*memos.* does not exist/i.test(message)) {
    return "메모 저장 구조를 찾지 못했습니다. Supabase 데이터베이스 설정을 확인하세요.";
  }

  if (code === "42883" && /memo_category/i.test(message)) {
    return "카테고리 처리 기능을 찾지 못했습니다. Supabase 함수 설정을 확인하세요.";
  }

  if (code === "23505" || /duplicate key|already exists/i.test(message)) {
    return "같은 내용이 이미 저장되어 있습니다. 목록을 새로고침한 뒤 다시 확인하세요.";
  }

  if (code === "42501" || /row-level security|permission denied/i.test(message)) {
    return "현재 계정으로 이 데이터에 접근할 수 없습니다. 다시 로그인한 뒤에도 계속되면 관리자 설정을 확인하세요.";
  }

  if (/timeout|timed out|gateway/i.test(message)) {
    return "서버 응답이 늦어 작업을 완료하지 못했습니다. 잠시 후 다시 시도하세요.";
  }

  if (/failed to fetch|network|load failed|networkerror/i.test(message)) {
    return "인터넷 연결이 불안정해 클라우드 작업을 완료하지 못했습니다. 작성 내용은 화면과 자동 초안에 유지됩니다.";
  }

  if (status >= 500) {
    return "클라우드 서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도하세요.";
  }

  return message || "클라우드 처리 중 오류가 발생했습니다. 잠시 후 다시 시도하세요.";
}

function showMemoListLoading(message = "클라우드 메모를 불러오고 있습니다.") {
  const memoList = document.querySelector("#memoList");

  if (!memoList) {
    return;
  }

  memoList.innerHTML = `
    <div class="empty-state cloud-loading-state">
      <strong>${escapeHtml(message)}</strong>
      <p>잠시만 기다려주세요.</p>
    </div>
  `;
}

function showMemoListError(message) {
  const memoList = document.querySelector("#memoList");

  if (!memoList) {
    return;
  }

  memoList.innerHTML = `
    <div class="empty-state cloud-error-state">
      <strong>클라우드 메모를 불러오지 못했습니다.</strong>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

async function loadCloudMemosForSession(session, options = {}) {
  const {
    reason = "클라우드 동기화",
    automatic = false,
  } = options;

  const userId = session && session.user ? session.user.id : "";

  if (!userId) {
    clearMemoCache();
    clearMemoCategoryCache();
    currentCloudUserId = "";
    renderMemoCategoryControls();
    refreshScreen();
    setCloudStatus("로그인 필요", "error");
    return null;
  }

  if (navigator.onLine === false) {
    setOfflineStatus();

    if (!hasLoadedCloudMemos()) {
      showMemoListError("인터넷 연결 후 다시 시도해주세요.");
    }

    return null;
  }

  if (activeCloudLoadPromise) {
    return activeCloudLoadPromise;
  }

  const sequence = ++cloudLoadSequence;
  currentCloudUserId = userId;

  activeCloudLoadPromise = (async () => {
    setCloudStatus(
      automatic ? `${reason} · 확인 중` : "클라우드 동기화 중",
      "loading"
    );

    if (!automatic || !hasLoadedCloudMemos()) {
      showMemoListLoading();
    }

    try {
      await loadMemosFromCloud();
      await loadMemoCategoriesFromCloud();
      await loadBookmarksFromCloud().catch((error) => console.error(error));

      if (sequence !== cloudLoadSequence || currentCloudUserId !== userId) {
        return null;
      }

      renderMemoCategoryControls();
      refreshScreen();
      renderBookmarkList();
      refreshOpenDetailFromCache();
      refreshLegacyMigrationPanel();
      updateLastSyncTime();

      const legacyCount = getLegacyMemoCount();
      const suffix =
        legacyCount > 0
          ? ` · 기존 브라우저 메모 ${legacyCount}개 보존 중`
          : "";

      setCloudStatus(`클라우드 동기화 완료${suffix}`, "ready");
      return getMemos();
    } catch (error) {
      console.error(error);
      const message = translateCloudError(error);

      if (isNetworkCloudError(error)) {
        if (hasLoadedCloudMemos()) {
          refreshScreen();
          refreshOpenDetailFromCache();
        } else {
          showMemoListError(message);
        }

        setOfflineStatus();
        return null;
      }

      if (!hasLoadedCloudMemos()) {
        clearMemoCache();
        refreshDataStats();
        showMemoListError(message);
      } else {
        refreshScreen();
      }

      setCloudStatus("클라우드 연결 실패", "error");
      return null;
    }
  })();

  try {
    return await activeCloudLoadPromise;
  } finally {
    activeCloudLoadPromise = null;
  }
}

async function runCloudAction(action, options = {}) {
  const {
    loadingMessage = "클라우드 저장 중",
    successMessage = "클라우드에 저장됨",
    rethrowConflict = false,
    onError = null,
    retryAction = null,
    retryLabel = "다시 시도",
    notifySuccess = false,
  } = options;

  if (navigator.onLine === false) {
    setOfflineStatus();
    const message = "현재 오프라인입니다. 작성 내용은 자동 초안에 유지되므로 인터넷 연결 후 다시 저장하세요.";
    showAppNotice(message, "error", {
      title: "클라우드에 연결할 수 없습니다",
      persistent: true,
      actionLabel: typeof retryAction === "function" ? retryLabel : "",
      onAction: retryAction,
    });
    onError?.(message, new Error("offline"));
    return null;
  }

  setCloudStatus(loadingMessage, "loading");

  try {
    const result = await action();
    renderMemoCategoryControls();
    refreshScreen();
    refreshOpenDetailFromCache();
    refreshLegacyMigrationPanel();
    updateLastSyncTime();
    setCloudStatus(successMessage, "ready");

    if (notifySuccess) {
      showAppNotice(successMessage, "success");
    }

    return result;
  } catch (error) {
    if (rethrowConflict && isMemoConflictError(error)) {
      throw error;
    }

    console.error(error);
    const message = translateCloudError(error);

    if (isNetworkCloudError(error)) {
      setOfflineStatus();
    } else if (isSessionCloudError(error)) {
      setCloudStatus("로그인 만료", "error");
      requestFreshLogin(message);
    } else {
      setCloudStatus("클라우드 저장 실패", "error");
    }

    onError?.(message, error);
    showAppNotice(message, "error", {
      title: isSessionCloudError(error) ? "다시 로그인이 필요합니다" : "작업을 완료하지 못했습니다",
      persistent: isNetworkCloudError(error) || isSessionCloudError(error),
      actionLabel: typeof retryAction === "function" && !isSessionCloudError(error) ? retryLabel : "",
      onAction: retryAction,
    });
    return null;
  }
}


function getTaskHubItems(view = currentTaskHubView) {
  const items = [];

  getMemos()
    .filter((memo) => !memo.isDeleted)
    .forEach((memo) => {
      const tasks = Array.isArray(memo.tasks) ? memo.tasks : [];

      tasks.forEach((task, taskIndex) => {
        if (view === "open" && task.done) {
          return;
        }

        items.push({
          memoId: memo.id,
          memoTitle: memo.title,
          category: memo.category,
          createdAt: memo.createdAt,
          updatedAt: memo.updatedAt,
          taskIndex,
          task,
        });
      });
    });

  return items.sort((left, right) => {
    if (left.task.done !== right.task.done) {
      return Number(left.task.done) - Number(right.task.done);
    }

    const dateCompare =
      parseMemoDate(right.updatedAt || right.createdAt) -
      parseMemoDate(left.updatedAt || left.createdAt);

    if (dateCompare !== 0) {
      return dateCompare;
    }

    return left.taskIndex - right.taskIndex;
  });
}

function getOpenTaskCount() {
  return getMemos()
    .filter((memo) => !memo.isDeleted)
    .reduce((count, memo) => {
      const tasks = Array.isArray(memo.tasks) ? memo.tasks : [];
      return count + tasks.filter((task) => !task.done).length;
    }, 0);
}

function refreshTaskHub() {
  const openCount = getOpenTaskCount();
  const items = getTaskHubItems();

  if (taskHubOpenCount) {
    taskHubOpenCount.textContent = String(openCount);
  }

  taskHubViewTabs
    ?.querySelectorAll("[data-task-view]")
    .forEach((button) => {
      const isActive = button.dataset.taskView === currentTaskHubView;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

  renderTaskHub(items, currentTaskHubView);
}


function handleTaskHubViewClick(event) {
  const button = event.target.closest("[data-task-view]");

  if (!button) {
    return;
  }

  currentTaskHubView = button.dataset.taskView === "all" ? "all" : "open";
  refreshTaskHub();
}

async function toggleTaskWithConflictHandling(
  memoId,
  taskId,
  options = {}
) {
  const { openDetailAfter = false } = options;

  if (navigator.onLine === false) {
    setOfflineStatus();
    showAppNotice(
      "현재 오프라인이므로 체크 상태를 클라우드에 저장할 수 없습니다. 인터넷 연결 후 다시 체크하세요.",
      "error",
      { title: "체크리스트 저장 불가", persistent: true }
    );
    return null;
  }

  const memo = findMemoById(memoId);

  if (!memo) {
    return null;
  }

  try {
    const updatedMemo = await runCloudAction(
      () => toggleTaskDone(memoId, taskId, memo.updatedAt),
      {
        loadingMessage: "체크리스트 저장 중",
        successMessage: "체크리스트 저장됨",
        rethrowConflict: true,
      }
    );

    if (updatedMemo && openDetailAfter) {
      openDetailModal(updatedMemo);
    }

    return updatedMemo;
  } catch (error) {
    if (isMemoConflictError(error) && error.serverMemo) {
      const latestMemo = replaceMemoInCache(error.serverMemo);
      refreshScreen();

      if (openDetailAfter) {
        openDetailModal(latestMemo);
      }

      setCloudStatus("최신 체크리스트 불러옴", "warning");
      showAppNotice(
        "다른 기기에서 이 메모가 먼저 변경되어 최신 체크리스트를 불러왔습니다. 다시 체크하세요.",
        "warning",
        { title: "최신 내용으로 갱신됨", duration: 6500 }
      );
      return null;
    }

    console.error(error);
    const message = translateCloudError(error);
    showAppNotice(message, "error", {
      title: "체크리스트 저장 실패",
      actionLabel: "다시 시도",
      onAction: () => toggleTaskWithConflictHandling(memoId, taskId, options),
      persistent: isNetworkCloudError(error),
    });
    return null;
  }
}

async function handleTaskHubClick(event) {
  const actionButton = event.target.closest("[data-task-action]");

  if (!actionButton) {
    return;
  }

  const memoId = actionButton.dataset.memoId;
  const action = actionButton.dataset.taskAction;

  if (action === "open-memo") {
    const memo = findMemoById(memoId);

    if (memo) {
      openDetailModal(memo);
    }

    return;
  }

  if (action !== "toggle") {
    return;
  }

  const taskId = actionButton.dataset.taskId;
  actionButton.disabled = true;

  await toggleTaskWithConflictHandling(memoId, taskId);
}

function parseMemoDate(dateString) {
  const time = new Date(dateString).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function sortMemos(memos) {
  return [...memos].sort((a, b) => {
    if (currentSort === "createdDesc") {
      return parseMemoDate(b.createdAt) - parseMemoDate(a.createdAt);
    }

    if (currentSort === "createdAsc") {
      return parseMemoDate(a.createdAt) - parseMemoDate(b.createdAt);
    }

    if (currentSort === "importantFirst") {
      const importantCompare = Number(b.isImportant) - Number(a.isImportant);

      if (importantCompare !== 0) {
        return importantCompare;
      }

      return parseMemoDate(b.updatedAt || b.createdAt) - parseMemoDate(a.updatedAt || a.createdAt);
    }

    if (currentSort === "titleAsc") {
      return String(a.title).localeCompare(String(b.title), "ko-KR");
    }

    return parseMemoDate(b.updatedAt || b.createdAt) - parseMemoDate(a.updatedAt || a.createdAt);
  });
}

function getFilteredMemos() {
  const search = currentSearch.trim().toLowerCase();

  const filteredMemos = getMemos().filter((memo) => {
    if (memo.isDeleted) {
      return false;
    }

    const isImportantView = currentCategory === "중요";

    if (isImportantView && !memo.isImportant) {
      return false;
    }

    const matchesCategory =
      currentCategory === "전체" ||
      currentCategory === "중요" ||
      memo.category === currentCategory;

    const taskText = Array.isArray(memo.tasks)
      ? memo.tasks.map((task) => task.text).join(" ").toLowerCase()
      : "";

    const linkText = getContentBlocksSearchText(memo.contentBlocks).toLowerCase();

    const matchesSearch =
      !search ||
      memo.title.toLowerCase().includes(search) ||
      memo.content.toLowerCase().includes(search) ||
      taskText.includes(search) ||
      linkText.includes(search);

    return matchesCategory && matchesSearch;
  });

  return sortMemos(filteredMemos);
}

function getTrashMemos() {
  return getMemos()
    .filter((memo) => memo.isDeleted)
    .sort(
      (a, b) =>
        parseMemoDate(b.updatedAt || b.createdAt) -
        parseMemoDate(a.updatedAt || a.createdAt)
    );
}

function refreshTrashView() {
  const trashMemos = getTrashMemos();

  if (trashViewCount) {
    trashViewCount.textContent = String(trashMemos.length);
  }

  if (emptyTrashViewButton) {
    emptyTrashViewButton.disabled = trashMemos.length === 0;
  }

  renderTrashList(trashMemos);
}


function refreshDataStats() {
  const stats = getDataStats();

  if (totalMemoCount) {
    totalMemoCount.textContent = stats.totalCount;
  }

  if (trashMemoCount) {
    trashMemoCount.textContent = stats.trashCount;
  }

  if (emptyTrashViewButton) {
    emptyTrashViewButton.disabled = stats.trashCount === 0;
  }

  if (resetAllDataButton) {
    resetAllDataButton.disabled = stats.totalCount === 0;
  }
}

async function handleEmptyTrashClick() {
  const stats = getDataStats();

  if (stats.trashCount === 0) {
    showAppNotice("휴지통에 비울 메모가 없습니다.", "info");
    return;
  }

  const shouldEmptyTrash = confirm(
    `클라우드 휴지통의 메모 ${stats.trashCount}개를 모두 완전히 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
  );

  if (!shouldEmptyTrash) {
    return;
  }

  const deletedCount = await runCloudAction(
    () => emptyTrash(),
    {
      loadingMessage: "휴지통 삭제 중",
      successMessage: "휴지통 비우기 완료",
    }
  );

  if (deletedCount === null) {
    return;
  }

  closeDetailModal();
  refreshScreen();
  showAppNotice(`클라우드 휴지통 메모 ${deletedCount}개를 완전히 삭제했습니다.`, "success");
}

async function handleResetAllDataClick() {
  const stats = getDataStats();

  if (stats.totalCount === 0) {
    showAppNotice("삭제할 클라우드 메모가 없습니다.", "info");
    return;
  }

  const firstConfirm = confirm(
    `클라우드에 저장된 모든 메모 ${stats.totalCount}개가 삭제됩니다.\n먼저 백업하기를 눌러 JSON 파일을 보관하는 것을 추천합니다.\n정말 전체 클라우드 데이터를 삭제하시겠습니까?`
  );

  if (!firstConfirm) {
    return;
  }

  const secondConfirm = confirm(
    "마지막 확인입니다.\n전체 클라우드 데이터 삭제는 되돌릴 수 없습니다.\n정말 삭제하시겠습니까?"
  );

  if (!secondConfirm) {
    return;
  }

  const deletedCount = await runCloudAction(
    () => resetAllData(),
    {
      loadingMessage: "전체 클라우드 데이터 삭제 중",
      successMessage: "클라우드 데이터 삭제 완료",
    }
  );

  if (deletedCount === null) {
    return;
  }

  currentCategory = "전체";
  currentSearch = "";
  searchInput.value = "";
  setActiveCategory(currentCategory);
  resetForm();
  closeEditor();
  closeDetailModal();
  refreshScreen();

  showAppNotice(`클라우드 메모 ${deletedCount}개를 삭제했습니다.`, "success");
}


function refreshScreen() {
  refreshDataStats();
  refreshTaskHub();

  const filteredMemos = getFilteredMemos();
  renderMemoList(filteredMemos);
  renderCategoryBrowser();
  setActiveSort(currentSort);
  refreshTrashView();
}

function createDraftTask(text) {
  return {
    id: `task_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    text: text.trim(),
    done: false,
  };
}

function renderTaskDraftList() {
  if (!taskDraftList || !taskCountLabel) {
    return;
  }

  taskCountLabel.textContent = `${draftTasks.length}개 항목`;

  if (draftTasks.length === 0) {
    taskDraftList.innerHTML = `<li class="task-empty">아직 추가된 할 일이 없습니다.</li>`;
    return;
  }

  taskDraftList.innerHTML = draftTasks
    .map(
      (task) => `
        <li class="task-draft-item">
          <span>${escapeHtml(task.text)}</span>
          <button type="button" class="task-remove-button" data-task-id="${escapeHtml(task.id)}" aria-label="체크리스트 항목 삭제">삭제</button>
        </li>
      `
    )
    .join("");
}

function resetDraftTasks() {
  draftTasks = [];
  renderTaskDraftList();
}

function loadDraftTasks(tasks) {
  draftTasks = Array.isArray(tasks) ? tasks.map((task) => ({ ...task })) : [];
  renderTaskDraftList();
}

function handleAddTask() {
  const text = taskInput.value.trim();

  if (!text) {
    showAppNotice("추가할 할 일을 입력하세요.", "warning");
    taskInput.focus();
    return;
  }

  if (draftTasks.length >= MAX_MEMO_TASKS) {
    showAppNotice(`체크리스트는 메모 하나에 ${MAX_MEMO_TASKS}개까지 추가할 수 있습니다.`, "warning");
    return;
  }

  draftTasks.push(createDraftTask(text));
  taskInput.value = "";
  renderTaskDraftList();
  updateEditorDirtyState();
  taskInput.focus();
}

function handleTaskInputKeydown(event) {
  if (event.key !== "Enter") {
    return;
  }

  event.preventDefault();
  handleAddTask();
}

function handleTaskDraftListClick(event) {
  const removeButton = event.target.closest(".task-remove-button");

  if (!removeButton) {
    return;
  }

  draftTasks = draftTasks.filter((task) => task.id !== removeButton.dataset.taskId);
  renderTaskDraftList();
  updateEditorDirtyState();
}


function formatConflictTime(dateString) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "확인할 수 없음";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function loadLatestServerMemo(serverMemo) {
  if (!serverMemo) {
    return;
  }

  const latestMemo = replaceMemoInCache(serverMemo);
  resetForm();
  closeEditor({ skipHistory: true });
  refreshScreen();
  openDetailModal(latestMemo);
  updateLastSyncTime();
  setCloudStatus("서버의 최신 내용 불러옴", "ready");
}

async function saveEditedMemoWithConflictResolution(
  memoId,
  memoData,
  expectedUpdatedAt
) {
  try {
    const savedMemo = await runCloudAction(
      () => updateMemo(memoId, memoData, expectedUpdatedAt),
      {
        loadingMessage: "메모 수정 저장 중",
        successMessage: "클라우드에 저장됨",
        rethrowConflict: true,
        retryAction: () => memoForm?.requestSubmit(),
        retryLabel: "저장 다시 시도",
      }
    );

    return {
      status: savedMemo ? "saved" : "failed",
      memo: savedMemo,
    };
  } catch (error) {
    if (!isMemoConflictError(error)) {
      console.error(error);
      const message = translateCloudError(error);
      showAppNotice(message, "error", {
        title: "메모 수정 저장 실패",
        actionLabel: "저장 다시 시도",
        onAction: () => memoForm?.requestSubmit(),
        persistent: isNetworkCloudError(error),
      });
      return { status: "failed", memo: null };
    }

    const serverMemo = error.serverMemo;

    if (!serverMemo) {
      showAppNotice(
        "최신 서버 메모를 확인하지 못했습니다. 클라우드 새로고침 후 다시 시도하세요.",
        "error",
        {
          title: "동시 수정 확인 실패",
          actionLabel: "새로고침",
          onAction: () => handleCloudRefreshClick(),
          persistent: true,
        }
      );
      return { status: "failed", memo: null };
    }

    setCloudStatus("동시 수정 충돌 감지", "warning");

    const shouldOverwrite = confirm(
      "다른 기기 또는 브라우저에서 이 메모가 먼저 수정되었습니다.\n\n" +
      `서버의 최근 수정: ${formatConflictTime(serverMemo.updatedAt)}\n\n` +
      "[확인] 현재 작성 내용을 서버에 덮어쓰기\n" +
      "[취소] 현재 작성을 취소하고 서버의 최신 내용 불러오기"
    );

    if (!shouldOverwrite) {
      loadLatestServerMemo(serverMemo);
      return { status: "reloaded", memo: serverMemo };
    }

    try {
      const overwrittenMemo = await runCloudAction(
        () => updateMemo(memoId, memoData, serverMemo.updatedAt),
        {
          loadingMessage: "충돌 확인 후 덮어쓰는 중",
          successMessage: "현재 내용으로 덮어쓰기 완료",
          rethrowConflict: true,
        }
      );

      return {
        status: overwrittenMemo ? "saved" : "failed",
        memo: overwrittenMemo,
      };
    } catch (secondError) {
      if (isMemoConflictError(secondError) && secondError.serverMemo) {
        loadLatestServerMemo(secondError.serverMemo);
        showAppNotice(
          "덮어쓰는 동안 다른 기기에서 메모가 다시 변경되어 최신 서버 내용을 불러왔습니다.",
          "warning",
          { title: "최신 내용으로 변경됨", duration: 7000 }
        );
        return { status: "reloaded", memo: secondError.serverMemo };
      }

      console.error(secondError);
      showAppNotice(translateCloudError(secondError), "error", {
        title: "메모 덮어쓰기 실패",
        actionLabel: "저장 다시 시도",
        onAction: () => memoForm?.requestSubmit(),
        persistent: isNetworkCloudError(secondError),
      });
      return { status: "failed", memo: null };
    }
  }
}

async function handleFormSubmit(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const project = projectInput.value.trim();
  const content = contentInput.value.trim();
  const category = categoryInput.value;
  const isImportant = importantInput.checked;
  const dueDate = dueDateInput ? dueDateInput.value : "";

  if (!title) {
    showAppNotice("메모 제목을 입력하세요.", "warning", { title: "저장 전 확인" });
    titleInput.focus();
    return;
  }

  if (!content && draftTasks.length === 0 && draftLinks.length === 0) {
    showAppNotice("내용, 링크 또는 체크리스트 항목을 한 개 이상 추가하세요.", "warning", { title: "저장 전 확인" });
    contentInput.focus();
    return;
  }

  if (navigator.onLine === false) {
    setOfflineStatus();
    saveLocalEditorDraft();
    showAppNotice(
      "현재 오프라인입니다. 작성 내용은 이 브라우저에 초안으로 저장했습니다. 인터넷 연결 후 다시 저장하세요.",
      "error",
      { title: "클라우드 저장 불가", persistent: true }
    );
    return;
  }

  const editingId = editingIdInput.value;
  const expectedUpdatedAt = editingUpdatedAtInput
    ? editingUpdatedAtInput.value
    : "";

  const memoData = {
    title,
    project,
    content,
    contentBlocks: createMemoContentBlocks(content, draftLinks, [
      ...draftStyledParagraphs,
      ...draftTables,
      ...draftImages,
    ]),
    category,
    isImportant,
    dueDate,
    tasks: draftTasks.map((task) => ({ ...task })),
  };

  setActionButtonBusy(
    saveButton,
    true,
    editingId ? "수정 저장 중..." : "클라우드 저장 중...",
    editingId ? "수정 완료" : "저장하기"
  );

  let result;

  if (editingId) {
    result = await saveEditedMemoWithConflictResolution(
      editingId,
      memoData,
      expectedUpdatedAt
    );
  } else {
    const newMemo = await runCloudAction(
      () => addMemo(memoData),
      {
        loadingMessage: "새 메모 저장 중",
        successMessage: "클라우드에 저장됨",
        retryAction: () => memoForm?.requestSubmit(),
        retryLabel: "저장 다시 시도",
      }
    );

    result = {
      status: newMemo ? "saved" : "failed",
      memo: newMemo,
    };
  }

  setActionButtonBusy(
    saveButton,
    false,
    "클라우드 저장 중...",
    editingId ? "수정 완료" : "저장하기"
  );

  if (result.status === "reloaded") {
    return;
  }

  if (result.status !== "saved" || !result.memo) {
    setEditorMode(editingId ? "edit" : "create");
    return;
  }

  clearLocalEditorDraft();
  resetForm();
  closeEditor();
  refreshScreen();
}

function handleMemoListClick(event) {
  if (suppressNextMemoCardClick) {
    suppressNextMemoCardClick = false;
    return;
  }

  const emptyActionButton = event.target.closest("[data-empty-action]");

  if (emptyActionButton) {
    const action = emptyActionButton.dataset.emptyAction;

    if (action === "create") {
      handleMobileNewMemoClick();
    }

    if (action === "reset") {
      resetMemoFilters();
    }

    return;
  }

  const memoCard = event.target.closest(".memo-card");

  if (!memoCard) {
    return;
  }

  if (memoSelectionMode) {
    toggleMemoSelected(memoCard.dataset.id);
    return;
  }

  const memo = findMemoById(memoCard.dataset.id);

  if (memo) {
    openDetailModal(memo);
  }
}


function updateSelectionToolbar() {
  if (!selectionToolbar || !selectionCountLabel) {
    return;
  }

  const hasSelection = memoSelectionMode && selectedMemoIds.size > 0;
  selectionToolbar.hidden = !hasSelection;
  selectionCountLabel.textContent = `${selectedMemoIds.size}개 선택됨`;
  document.body.classList.toggle("memo-selection-active", memoSelectionMode);
}

function enterMemoSelectionMode(initialId) {
  memoSelectionMode = true;
  selectedMemoIds = new Set(initialId ? [initialId] : []);
  refreshScreen();
  updateSelectionToolbar();

  if (typeof navigator.vibrate === "function") {
    navigator.vibrate(15);
  }
}

function exitMemoSelectionMode() {
  if (!memoSelectionMode && selectedMemoIds.size === 0) {
    return;
  }

  memoSelectionMode = false;
  selectedMemoIds = new Set();
  refreshScreen();
  updateSelectionToolbar();
}

function toggleMemoSelected(id) {
  if (!id) {
    return;
  }

  if (selectedMemoIds.has(id)) {
    selectedMemoIds.delete(id);
  } else {
    selectedMemoIds.add(id);
  }

  if (selectedMemoIds.size === 0) {
    exitMemoSelectionMode();
    return;
  }

  refreshScreen();
  updateSelectionToolbar();
}

function clearMemoLongPressTimer() {
  if (memoLongPressTimer) {
    clearTimeout(memoLongPressTimer);
    memoLongPressTimer = null;
  }
}

function handleMemoListPointerDown(event) {
  if (event.pointerType === "mouse" && event.button !== 0) {
    return;
  }

  const memoCard = event.target.closest(".memo-card");

  if (!memoCard) {
    return;
  }

  memoLongPressTargetId = memoCard.dataset.id;
  memoLongPressMoved = false;
  memoLongPressStartX = event.clientX;
  memoLongPressStartY = event.clientY;

  clearMemoLongPressTimer();
  memoLongPressTimer = setTimeout(() => {
    memoLongPressTimer = null;

    if (memoLongPressMoved || !memoLongPressTargetId) {
      return;
    }

    suppressNextMemoCardClick = true;

    if (memoSelectionMode) {
      toggleMemoSelected(memoLongPressTargetId);
    } else {
      enterMemoSelectionMode(memoLongPressTargetId);
    }
  }, MEMO_LONG_PRESS_DURATION_MS);
}

function handleMemoListPointerMove(event) {
  if (!memoLongPressTimer) {
    return;
  }

  const deltaX = Math.abs(event.clientX - memoLongPressStartX);
  const deltaY = Math.abs(event.clientY - memoLongPressStartY);

  if (deltaX > MEMO_LONG_PRESS_MOVE_TOLERANCE_PX || deltaY > MEMO_LONG_PRESS_MOVE_TOLERANCE_PX) {
    memoLongPressMoved = true;
    clearMemoLongPressTimer();
  }
}

function handleMemoListPointerUp() {
  clearMemoLongPressTimer();
  memoLongPressTargetId = null;
}

function handleMemoListContextMenu(event) {
  if (event.target.closest(".memo-card")) {
    event.preventDefault();
  }
}

async function deleteSelectedMemos() {
  const ids = Array.from(selectedMemoIds);

  if (ids.length === 0) {
    return;
  }

  const shouldMoveToTrash = confirm(
    `선택한 메모 ${ids.length}개를 클라우드 휴지통으로 이동하시겠습니까?`
  );

  if (!shouldMoveToTrash) {
    return;
  }

  const result = await runCloudAction(
    async () => {
      for (const id of ids) {
        await moveMemoToTrash(id);
      }
      return true;
    },
    {
      loadingMessage: "휴지통으로 이동 중",
      successMessage: `${ids.length}개 메모 휴지통으로 이동됨`,
    }
  );

  if (!result) {
    return;
  }

  exitMemoSelectionMode();
}


function handleAddBookmarkClick() {
  if (!bookmarkForm) {
    return;
  }

  bookmarkForm.hidden = false;
  bookmarkForm.classList.remove("hidden");
  bookmarkTitleInput?.focus();
}

function closeBookmarkForm() {
  if (!bookmarkForm) {
    return;
  }

  bookmarkForm.hidden = true;
  bookmarkForm.classList.add("hidden");
  bookmarkForm.reset();
}

async function handleBookmarkFormSubmit(event) {
  event.preventDefault();

  const title = bookmarkTitleInput?.value || "";
  const url = bookmarkUrlInput?.value || "";

  const result = await runCloudAction(
    () => addBookmark(title, url),
    {
      loadingMessage: "즐겨찾기 추가 중",
      successMessage: "즐겨찾기 추가 완료",
    }
  );

  if (!result) {
    return;
  }

  closeBookmarkForm();
  renderBookmarkList();
}

async function handleBookmarkListClick(event) {
  const deleteButton = event.target.closest(".bookmark-delete-button");

  if (!deleteButton) {
    return;
  }

  const id = deleteButton.dataset.id;

  if (!id) {
    return;
  }

  const shouldDelete = confirm("이 즐겨찾기를 삭제하시겠습니까?");

  if (!shouldDelete) {
    return;
  }

  const result = await runCloudAction(
    () => deleteBookmark(id),
    {
      loadingMessage: "즐겨찾기 삭제 중",
      successMessage: "즐겨찾기 삭제됨",
    }
  );

  if (!result) {
    return;
  }

  renderBookmarkList();
}


async function handleTrashListClick(event) {
  const actionButton = event.target.closest("[data-trash-action]");

  if (actionButton) {
    const memoId = actionButton.dataset.id;
    const action = actionButton.dataset.trashAction;

    if (!memoId) {
      return;
    }

    if (action === "restore") {
      actionButton.disabled = true;

      const restoredMemo = await runCloudAction(
        () => restoreMemo(memoId),
        {
          loadingMessage: "메모 복구 중",
          successMessage: "메모 복구 완료",
        }
      );

      if (!restoredMemo) {
        actionButton.disabled = false;
        return;
      }

      refreshScreen();
      return;
    }

    if (action === "permanent-delete") {
      const memo = findMemoById(memoId);
      const title = memo?.title ? `“${memo.title}”` : "이 메모";
      const shouldDelete = confirm(
        `${title}를 영구 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
      );

      if (!shouldDelete) {
        return;
      }

      actionButton.disabled = true;

      const result = await runCloudAction(
        async () => {
          await permanentlyDeleteMemo(memoId);
          return true;
        },
        {
          loadingMessage: "메모 완전 삭제 중",
          successMessage: "메모 완전 삭제 완료",
        }
      );

      if (!result) {
        actionButton.disabled = false;
        return;
      }

      closeDetailModal();
      refreshScreen();
      return;
    }
  }

  const openButton = event.target.closest("[data-trash-open]");

  if (!openButton) {
    return;
  }

  const memo = findMemoById(openButton.dataset.trashOpen);

  if (memo) {
    openDetailModal(memo);
  }
}

function handleCategoryClick(event) {
  const button = event.target.closest(".category-tab");

  if (!button) {
    return;
  }

  currentCategory = button.dataset.category;
  setActiveCategory(currentCategory);
  refreshScreen();
}

function handleCalendarPrevMonth() {
  calendarViewDate = new Date(
    calendarViewDate.getFullYear(),
    calendarViewDate.getMonth() - 1,
    1
  );
  renderCalendar();
}

function handleCalendarNextMonth() {
  calendarViewDate = new Date(
    calendarViewDate.getFullYear(),
    calendarViewDate.getMonth() + 1,
    1
  );
  renderCalendar();
}

function handleCalendarGridClick(event) {
  const dayButton = event.target.closest(".calendar-day");

  if (!dayButton) {
    return;
  }

  selectedCalendarDateKey = dayButton.dataset.date;
  renderCalendar();
}

function handleCalendarDayListClick(event) {
  const item = event.target.closest(".calendar-day-item");

  if (!item) {
    return;
  }

  const memo = findMemoById(item.dataset.id);

  if (memo) {
    openDetailModal(memo);
  }
}

function applySidebarCollapsedState() {
  document.body.classList.toggle("sidebar-collapsed", sidebarCollapsed);

  const toggleButton = document.querySelector("#sidebarCollapseToggle");

  if (toggleButton) {
    toggleButton.setAttribute("aria-label", sidebarCollapsed ? "사이드바 펼치기" : "사이드바 접기");
  }
}

function toggleSidebarCollapse() {
  sidebarCollapsed = !sidebarCollapsed;

  if (sidebarCollapsed) {
    showMenuSubview("main");
  }

  applySidebarCollapsedState();

  try {
    window.localStorage.setItem("solonote_sidebar_collapsed", sidebarCollapsed ? "1" : "0");
  } catch (_) {
    /* 저장 실패는 무시 (시크릿 모드 등) */
  }
}

function handleCategoryBrowserClick(event) {
  const item = event.target.closest(".category-browser-item");

  if (!item) {
    return;
  }

  const category = item.dataset.category;

  if (!category) {
    return;
  }

  currentCategory = category;
  setActiveCategory(currentCategory);
  refreshScreen();
  switchAppView("notes");
  closeAppMenu();
}

function handleSortClick(event) {
  const button = event.target.closest("[data-sort]");

  if (!button || !sortOptions?.contains(button)) {
    return;
  }

  currentSort = button.dataset.sort || "updatedDesc";
  setActiveSort(currentSort);
  refreshScreen();
}

function handleSearchInput(event) {
  currentSearch = event.target.value;
  refreshScreen();
}

async function handleEditClick() {
  const memoId = this.dataset.id;
  const mode = this.dataset.mode;
  const memo = findMemoById(memoId);

  if (!memo) {
    return;
  }

  if (mode === "restore") {
    const restoredMemo = await runCloudAction(
      () => restoreMemo(memoId),
      {
        loadingMessage: "메모 복구 중",
        successMessage: "메모 복구 완료",
      }
    );

    if (!restoredMemo) {
      return;
    }

    closeDetailModal();

    if (currentAppView !== "trash") {
      currentCategory = "전체";
      setActiveCategory(currentCategory);
    }

    refreshScreen();
    return;
  }

  switchAppView("notes");
  fillFormForEdit(memo);
  loadDraftTasks(memo.tasks);
  markEditorClean();
}

async function handleDeleteClick() {
  const memoId = this.dataset.id;
  const mode = this.dataset.mode;

  if (mode === "permanent-delete") {
    const shouldDelete = confirm(
      "클라우드 휴지통에서도 완전히 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
    );

    if (!shouldDelete) {
      return;
    }

    const result = await runCloudAction(
      async () => {
        await permanentlyDeleteMemo(memoId);
        return true;
      },
      {
        loadingMessage: "메모 완전 삭제 중",
        successMessage: "메모 완전 삭제 완료",
      }
    );

    if (!result) {
      return;
    }

    closeDetailModal();
    refreshScreen();
    return;
  }

  const shouldMoveToTrash = confirm("이 메모를 클라우드 휴지통으로 이동하시겠습니까?");

  if (!shouldMoveToTrash) {
    return;
  }

  const movedMemo = await runCloudAction(
    () => moveMemoToTrash(memoId),
    {
      loadingMessage: "휴지통으로 이동 중",
      successMessage: "휴지통으로 이동됨",
    }
  );

  if (!movedMemo) {
    return;
  }

  closeDetailModal();
  refreshScreen();
}

async function handleDetailTaskToggle(event) {
  const toggleButton = event.target.closest(".task-toggle-button");

  if (!toggleButton) {
    return;
  }

  toggleButton.disabled = true;

  await toggleTaskWithConflictHandling(
    toggleButton.dataset.memoId,
    toggleButton.dataset.taskId,
    {
      openDetailAfter: true,
    }
  );
}

function handleModalClick(event) {
  void handleDetailTaskToggle(event);

  if (event.target.dataset.close === "true") {
    closeDetailModal();
  }
}

function handleOutsideDetailClick(event) {
  if (!detailModal || detailModal.hidden) {
    return;
  }

  if (detailModal.contains(event.target)) {
    return;
  }

  if (event.target.closest(".memo-card")) {
    return;
  }

  closeDetailModal();
}

function getTodayTextForFileName() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function handleBackupClick() {
  if (backupButton?.disabled) {
    return;
  }

  const backupData = createBackupData();
  const memoCount = backupData.memos.length;

  if (memoCount === 0) {
    const shouldBackupEmpty = confirm("저장된 메모가 없습니다. 빈 백업 파일을 생성할까요?");

    if (!shouldBackupEmpty) {
      return;
    }
  }

  setActionButtonBusy(backupButton, true, "백업 준비 중...", "백업");

  try {
    const jsonText = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonText], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const fileName = `Creative Note-backup-${getTodayTextForFileName()}.json`;

    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);

    showAppNotice(
      `${memoCount}개의 메모가 포함된 백업 파일 다운로드를 시작했습니다. 브라우저의 다운로드 목록을 확인하세요.`,
      "success",
      { title: "백업 파일 생성 완료" }
    );
  } catch (error) {
    console.error(error);
    showAppNotice(
      "백업 파일을 만들지 못했습니다. 브라우저의 다운로드 권한과 저장 공간을 확인한 뒤 다시 시도하세요.",
      "error",
      {
        title: "백업 실패",
        actionLabel: "다시 시도",
        onAction: () => handleBackupClick(),
      }
    );
  } finally {
    setActionButtonBusy(backupButton, false, "백업 준비 중...", "백업");
  }
}

function handleRestoreButtonClick() {
  if (restoreButton?.disabled) {
    return;
  }

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".json,application/json";
  fileInput.style.display = "none";

  const finishRestore = () => {
    setActionButtonBusy(restoreButton, false, "복원 중...", "복원");
    fileInput.remove();
  };

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];

    if (!file) {
      finishRestore();
      return;
    }

    if (!file.name.toLowerCase().endsWith(".json")) {
      showAppNotice("JSON 형식의 Creative Note 백업 파일만 복원할 수 있습니다.", "warning", {
        title: "지원하지 않는 파일",
      });
      finishRestore();
      return;
    }

    if (file.size > MAX_BACKUP_FILE_SIZE_BYTES) {
      showAppNotice("백업 파일은 10MB 이하만 복원할 수 있습니다.", "warning", {
        title: "파일이 너무 큽니다",
      });
      finishRestore();
      return;
    }

    const shouldRestore = confirm(
      "선택한 백업 파일의 메모를 현재 클라우드 메모에 추가하시겠습니까? 기존 클라우드 메모는 유지됩니다."
    );

    if (!shouldRestore) {
      finishRestore();
      return;
    }

    setActionButtonBusy(restoreButton, true, "복원 중...", "복원");
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const backupData = JSON.parse(String(reader.result || ""));

        const result = await runCloudAction(
          () => importMemosFromBackup(backupData),
          {
            loadingMessage: "백업 메모를 클라우드로 가져오는 중",
            successMessage: "클라우드 복원 완료",
            retryAction: () => handleRestoreButtonClick(),
            retryLabel: "파일 다시 선택",
          }
        );

        if (!result) {
          return;
        }

        currentCategory = "전체";
        currentSearch = "";
        searchInput.value = "";
        setActiveCategory(currentCategory);
        refreshScreen();

        showAppNotice(
          `${result.addedCount}개를 추가하고 중복 ${result.skippedCount}개를 제외했습니다.`,
          "success",
          { title: "클라우드 복원 완료", duration: 6500 }
        );
      } catch (error) {
        console.error(error);
        const message = error instanceof SyntaxError
          ? "JSON 파일 구조를 읽을 수 없습니다. 손상되지 않은 Creative Note 백업 파일인지 확인하세요."
          : translateCloudError(error);

        showAppNotice(message, "error", {
          title: "백업 복원 실패",
          actionLabel: "파일 다시 선택",
          onAction: () => handleRestoreButtonClick(),
        });
      } finally {
        finishRestore();
      }
    };

    reader.onerror = () => {
      showAppNotice(
        "파일을 읽지 못했습니다. 파일 접근 권한과 파일 상태를 확인한 뒤 다시 시도하세요.",
        "error",
        {
          title: "파일 읽기 실패",
          actionLabel: "파일 다시 선택",
          onAction: () => handleRestoreButtonClick(),
        }
      );
      finishRestore();
    };

    reader.readAsText(file, "utf-8");
  });

  document.body.appendChild(fileInput);
  fileInput.click();
}


function handleGuideToggleClick() {
  if (!guideToggleButton || !guideContent) {
    return;
  }

  const willOpen = guideContent.hidden;
  guideContent.hidden = !willOpen;
  guideContent.classList.toggle("hidden", !willOpen);
  guideToggleButton.textContent = willOpen ? "닫기" : "열기";
  guideToggleButton.setAttribute("aria-expanded", String(willOpen));
}


function bindEvents() {
  categoryTabs?.addEventListener("click", handleCategoryClick);
  categoryPickerButton?.addEventListener("click", toggleCategoryPicker);
  categoryPickerMenu?.addEventListener("click", handleCategoryPickerMenuClick);
  categoryPickerMenu?.addEventListener("keydown", handleCategoryPickerKeydown);
  categoryInput?.addEventListener("change", syncCategoryPicker);
  document.addEventListener("click", handleDocumentCategoryPickerClick);
  editorCategoryManagerButton?.addEventListener("click", openCategoryManager);
  closeCategoryManagerButton?.addEventListener("click", closeCategoryManager);
  categoryCreateForm?.addEventListener("submit", (event) => {
    void handleCategoryCreateSubmit(event);
  });
  categoryManagerList?.addEventListener("click", (event) => {
    void handleCategoryManagerListClick(event);
  });
  categoryManagerModal?.addEventListener("click", handleCategoryManagerModalClick);

  memoForm.addEventListener("submit", handleFormSubmit);
  memoForm.addEventListener("input", updateEditorDirtyState);
  memoForm.addEventListener("change", updateEditorDirtyState);
  addLinkButton?.addEventListener("click", () => openLinkEditor());
  linkEditorForm?.addEventListener("submit", handleLinkEditorSubmit);
  closeLinkEditorButton?.addEventListener("click", () => closeLinkEditor());
  cancelLinkEditorButton?.addEventListener("click", () => closeLinkEditor());
  linkEditorModal?.addEventListener("click", handleLinkEditorModalClick);
  linkDraftList?.addEventListener("click", handleLinkDraftListClick);

  document.querySelector("#addStyledParagraphButton")?.addEventListener("click", () => openStyledParagraphEditor());
  styledParagraphForm?.addEventListener("submit", handleStyledParagraphSubmit);
  closeStyledParagraphButton?.addEventListener("click", closeStyledParagraphEditor);
  cancelStyledParagraphButton?.addEventListener("click", closeStyledParagraphEditor);
  styledParagraphModal?.addEventListener("click", handleStyledParagraphModalClick);
  styledDraftList?.addEventListener("click", handleStyledDraftListClick);
  styledSizeOptions?.addEventListener("click", (event) => {
    const chip = event.target.closest("[data-size]");
    if (chip) {
      setStyledSizeSelection(chip.dataset.size);
    }
  });
  styledColorOptions?.addEventListener("click", (event) => {
    const swatch = event.target.closest("[data-color]");
    if (swatch) {
      setStyledColorSelection(swatch.dataset.color);
    }
  });

  document.querySelector("#addTableButton")?.addEventListener("click", () => openTableEditor());
  closeTableEditorButton?.addEventListener("click", closeTableEditor);
  cancelTableEditorButton?.addEventListener("click", closeTableEditor);
  tableEditorModal?.addEventListener("click", handleTableEditorModalClick);
  tableDraftList?.addEventListener("click", handleTableDraftListClick);
  addTableRowButton?.addEventListener("click", handleAddTableRow);
  addTableColButton?.addEventListener("click", handleAddTableCol);
  removeTableRowButton?.addEventListener("click", handleRemoveTableRow);
  removeTableColButton?.addEventListener("click", handleRemoveTableCol);
  saveTableButton?.addEventListener("click", handleSaveTableClick);

  document.querySelector("#addImageButton")?.addEventListener("click", openImageUploadModal);
  imageUploadForm?.addEventListener("submit", (event) => {
    void handleImageUploadSubmit(event);
  });
  closeImageUploadButton?.addEventListener("click", closeImageUploadModal);
  cancelImageUploadButton?.addEventListener("click", closeImageUploadModal);
  imageUploadModal?.addEventListener("click", handleImageUploadModalClick);
  imageDraftList?.addEventListener("click", handleImageDraftListClick);
  imageFileInput?.addEventListener("change", handleImageFileChange);

  exportPdfButton?.addEventListener("click", handleExportPdfClick);

  const memoListElement = document.querySelector("#memoList");
  memoListElement.addEventListener("click", handleMemoListClick);
  memoListElement.addEventListener("pointerdown", handleMemoListPointerDown);
  memoListElement.addEventListener("pointermove", handleMemoListPointerMove);
  memoListElement.addEventListener("pointerup", handleMemoListPointerUp);
  memoListElement.addEventListener("pointercancel", handleMemoListPointerUp);
  memoListElement.addEventListener("pointerleave", handleMemoListPointerUp);
  memoListElement.addEventListener("contextmenu", handleMemoListContextMenu);
  cancelSelectionButton?.addEventListener("click", exitMemoSelectionMode);
  deleteSelectedButton?.addEventListener("click", () => {
    void deleteSelectedMemos();
  });
  trashList?.addEventListener("click", (event) => {
    void handleTrashListClick(event);
  });
  searchInput.addEventListener("input", handleSearchInput);
  sortOptions?.addEventListener("click", handleSortClick);

  document.querySelector("#editorToggleButton").addEventListener("click", toggleEditor);
  document.querySelector("#resetButton").addEventListener("click", handleCancelEditorClick);
  document.querySelector("#closeDetailButton").addEventListener("click", closeDetailModal);
  document.querySelector("#detailModal").addEventListener("click", handleModalClick);
  document.addEventListener("click", handleOutsideDetailClick, true);
  document.querySelector("#editMemoButton").addEventListener("click", handleEditClick);
  document.querySelector("#deleteMemoButton").addEventListener("click", handleDeleteClick);

  backupButton.addEventListener("click", handleBackupClick);
  restoreButton.addEventListener("click", handleRestoreButtonClick);
  emptyTrashViewButton?.addEventListener("click", handleEmptyTrashClick);
  resetAllDataButton.addEventListener("click", handleResetAllDataClick);
  cloudRefreshButton.addEventListener("click", handleCloudRefreshClick);
  migrateLegacyButton.addEventListener("click", handleLegacyMigrationClick);

  guideToggleButton.addEventListener("click", handleGuideToggleClick);
  dataManagementToggleButton.addEventListener("click", handleDataManagementToggle);
  openSettingsButton?.addEventListener("click", handleOpenSettingsClick);
  menuSettingsBackButton?.addEventListener("click", handleMenuSettingsBackClick);
  menuAccountManagementToggleButton?.addEventListener("click", handleMenuAccountManagementToggle);
  mobileNewMemoButton.addEventListener("click", handleMobileNewMemoClick);
  restoreDraftButton.addEventListener("click", restoreLocalEditorDraft);
  discardDraftButton.addEventListener("click", discardLocalEditorDraft);

  addTaskButton.addEventListener("click", handleAddTask);
  taskInput.addEventListener("keydown", handleTaskInputKeydown);
  taskDraftList.addEventListener("click", handleTaskDraftListClick);
  taskHubViewTabs.addEventListener("click", handleTaskHubViewClick);
  taskHubList.addEventListener("click", (event) => {
    void handleTaskHubClick(event);
  });

  notesViewTab.parentElement.addEventListener("click", handlePrimaryViewClick);
  homeLogoButton?.addEventListener("click", handleHomeLogoClick);
  appMenuButton.addEventListener("click", openAppMenu);
  appMenuBackdrop.addEventListener("click", closeAppMenu);
  openTrashButton?.addEventListener("click", handleOpenTrashClick);
  categoryBrowserList?.addEventListener("click", handleCategoryBrowserClick);
  document.querySelector("#sidebarCollapseToggle")?.addEventListener("click", toggleSidebarCollapse);
  calendarPrevMonthButton?.addEventListener("click", handleCalendarPrevMonth);
  calendarNextMonthButton?.addEventListener("click", handleCalendarNextMonth);
  calendarGrid?.addEventListener("click", handleCalendarGridClick);
  calendarDayList?.addEventListener("click", handleCalendarDayListClick);
  addBookmarkButton?.addEventListener("click", handleAddBookmarkClick);
  cancelBookmarkButton?.addEventListener("click", closeBookmarkForm);
  bookmarkForm?.addEventListener("submit", (event) => {
    void handleBookmarkFormSubmit(event);
  });
  bookmarkList?.addEventListener("click", (event) => {
    void handleBookmarkListClick(event);
  });
  window.addEventListener("beforeunload", handleBeforeUnload);
  window.addEventListener("solonote-before-logout", handleBeforeLogout);

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    if (linkEditorModal && !linkEditorModal.hidden) {
      closeLinkEditor();
      return;
    }

    if (categoryManagerModal && !categoryManagerModal.hidden) {
      closeCategoryManager();
      return;
    }

    if (!appMenuPanel.hidden) {
      closeAppMenu();
      return;
    }

    if (isEditorOpen()) {
      handleEditorBackClick();
      return;
    }

    closeDetailModal();
  });

  window.addEventListener("online", () => {
    setCloudStatus("인터넷 재연결 · 동기화 준비", "loading");
    showAppNotice(
      "인터넷 연결이 복구되었습니다. 클라우드 데이터를 다시 확인합니다.",
      "success",
      { title: "온라인 상태" }
    );
    scheduleAutomaticSync("인터넷 재연결", {
      force: true,
      delay: 100,
    });
  });

  window.addEventListener("offline", () => {
    if (automaticSyncTimer) {
      clearTimeout(automaticSyncTimer);
      automaticSyncTimer = null;
    }

    setOfflineStatus();
    saveLocalEditorDraft();
    showAppNotice(
      "인터넷 연결이 끊겼습니다. 작성 중인 내용은 브라우저 초안에 유지되며 클라우드 작업은 연결 후 다시 시도해야 합니다.",
      "error",
      { title: "오프라인", persistent: true }
    );
  });

  window.addEventListener("focus", () => {
    scheduleAutomaticSync("앱 화면 복귀");
    });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      scheduleAutomaticSync("앱 화면 복귀");
    }
  });
}

initializeAppNavigation();
bindEvents();
renderTaskDraftList();
markEditorClean();
setDraftSaveStatus(
  "작성 내용은 이 브라우저에 자동 저장됩니다.",
  "ready"
);
clearMemoCache();
clearMemoCategoryCache();
renderMemoCategoryControls();
syncCategoryPicker();
refreshScreen();
refreshLegacyMigrationPanel();

if (guideContent) {
  guideContent.hidden = true;
  guideContent.classList.add("hidden");
}

if (dataManagementContent) {
  dataManagementContent.hidden = true;
}


showMenuSubview("main");

if (appMenuPanel && appMenuBackdrop) {
  appMenuPanel.classList.remove("is-open");
  appMenuBackdrop.classList.remove("is-open");
  appMenuPanel.hidden = true;
  appMenuBackdrop.hidden = true;

  try {
    sidebarCollapsed = window.localStorage.getItem("solonote_sidebar_collapsed") === "1";
  } catch (_) {
    sidebarCollapsed = false;
  }
  applySidebarCollapsedState();

  if (isDesktopLayout()) {
    appMenuPanel.setAttribute("aria-hidden", "false");
  }

  window.matchMedia("(min-width: 1024px)").addEventListener("change", (event) => {
    appMenuPanel.setAttribute("aria-hidden", event.matches ? "false" : "true");
  });
}

switchAppView("notes", {
  historyMode: "none",
  scrollBehavior: "auto",
});
if (navigator.onLine === false) {
  setOfflineStatus();
} else {
  setCloudStatus("클라우드 연결 준비 중", "loading");
}

window.addEventListener("solonote-auth-changed", (event) => {
  const session = event.detail && event.detail.session;
  if (window.solonotePasswordRecoveryActive) {
    cloudLoadSequence += 1;
    currentCloudUserId = "";
    window.solonoteNavigation?.reset();
    clearMemoCache();
    clearMemoCategoryCache();
    renderMemoCategoryControls();
    refreshScreen();
    setCloudStatus("비밀번호 재설정 중", "loading");
    return;
  }

  if (!session) {
    cloudLoadSequence += 1;
    currentCloudUserId = "";
    recoverableDraft = null;
    hideDraftRecoveryBanner();
    clearMemoCache();
    clearMemoCategoryCache();
    window.solonoteNavigation?.reset();
    closeDetailModal({ skipHistory: true });
    closeCategoryManager({ skipHistory: true });
    renderMemoCategoryControls();
    refreshScreen();
    setCloudStatus("로그인 필요", "error");
    return;
  }

  currentCloudUserId = session.user.id;
  checkForRecoverableDraft(currentCloudUserId);

  void loadCloudMemosForSession(session, {
    reason: "로그인",
    automatic: false,
  });
});

(async function initializeCloudMemos() {
  const client = window.solonoteSupabase;

  if (!client) {
    setCloudStatus("Supabase 연결 실패", "error");
    showMemoListError("Supabase 클라이언트가 준비되지 않았습니다.");
    return;
  }

  try {
    const { data, error } = await client.auth.getSession();

    if (error) {
      throw error;
    }

    if (window.solonotePasswordRecoveryActive) {
      return;
    }

    if (data && data.session) {
      currentCloudUserId = data.session.user.id;
      checkForRecoverableDraft(currentCloudUserId);

      await loadCloudMemosForSession(data.session, {
        reason: "앱 시작",
        automatic: false,
      });

      checkForRecoverableDraft(currentCloudUserId);
    }
  } catch (error) {
    console.error(error);
    const message = translateCloudError(error);
    setCloudStatus("클라우드 연결 실패", "error");
    showMemoListError(message);
  }
})();
