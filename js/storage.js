const LEGACY_STORAGE_KEY = "solonote_memos_v1";

let memoCache = [];
let cloudMemosLoaded = false;
let memoCategoryCache = [];
let cloudMemoCategoriesLoaded = false;
let bookmarkCache = [];
let cloudBookmarksLoaded = false;

const DEFAULT_MEMO_CATEGORIES = Object.freeze(["업무", "아이디어", "일상"]);
const LEGACY_TASK_MEMO_CATEGORY = "할 일";
const COMPATIBILITY_MEMO_CATEGORIES = Object.freeze(["보관", "미분류"]);
const FALLBACK_MEMO_CATEGORY = "미분류";
const MAX_MEMO_CATEGORY_LENGTH = 20;
const MAX_MEMO_TITLE_LENGTH = 300;
const MAX_MEMO_CONTENT_LENGTH = 200000;
const MAX_MEMO_PROJECT_LENGTH = 100;
const MAX_MEMO_TASK_TEXT_LENGTH = 500;
const MAX_MEMO_TASKS = 200;
const CONTENT_FORMAT_VERSION = 1;
const MAX_MEMO_CONTENT_BLOCKS = 50;
const MAX_MEMO_LINK_BLOCKS = 20;
const MAX_MEMO_STYLED_PARAGRAPH_BLOCKS = 20;
const MAX_MEMO_TABLE_BLOCKS = 10;
const MAX_MEMO_TABLE_ROWS = 20;
const MAX_MEMO_TABLE_COLS = 10;
const MAX_MEMO_TABLE_CELL_LENGTH = 500;
const MAX_MEMO_IMAGE_BLOCKS = 10;
const MAX_MEMO_STYLED_PARAGRAPH_LENGTH = 4000;
const MAX_MEMO_LINK_URL_LENGTH = 2048;
const MAX_MEMO_LINK_LABEL_LENGTH = 300;
const MAX_BACKUP_MEMOS = 5000;
const MAX_BACKUP_CATEGORIES = 100;
const MAX_BACKUP_TOTAL_TASKS = 20000;
const MAX_BACKUP_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const RESERVED_MEMO_CATEGORY_NAMES = new Set([
  "전체",
  "중요",
  "할 일",
  "보관",
  "휴지통",
  FALLBACK_MEMO_CATEGORY,
]);


class MemoConflictError extends Error {
  constructor(serverMemo) {
    super("다른 기기에서 이 메모가 먼저 수정되었습니다.");
    this.name = "MemoConflictError";
    this.serverMemo = serverMemo || null;
  }
}

function isMemoConflictError(error) {
  return Boolean(error && error.name === "MemoConflictError");
}

function areSameCloudTimestamp(left, right) {
  if (!left || !right) {
    return false;
  }

  const leftTime = new Date(left).getTime();
  const rightTime = new Date(right).getTime();

  if (Number.isNaN(leftTime) || Number.isNaN(rightTime)) {
    return String(left) === String(right);
  }

  return leftTime === rightTime;
}

function replaceMemoInCache(memo) {
  if (!memo || !memo.id) {
    return null;
  }

  const normalizedMemo = normalizeMemo(memo);
  const exists = memoCache.some((item) => item.id === normalizedMemo.id);

  memoCache = exists
    ? memoCache.map((item) => (item.id === normalizedMemo.id ? normalizedMemo : item))
    : [normalizedMemo, ...memoCache];

  sortCacheByUpdatedDate();
  return normalizedMemo;
}

async function fetchMemoFromCloud(id) {
  const { client, user } = await getCloudContext();

  const { data, error } = await client
    .from("memos")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapDatabaseRowToMemo(data) : null;
}

function createSafeId(prefix) {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return `${prefix}_${window.crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function normalizeTask(task) {
  const providedId = task && task.id ? String(task.id) : "";
  const safeId = /^[A-Za-z0-9_-]{1,128}$/.test(providedId)
    ? providedId
    : createSafeId("task");

  return {
    id: safeId,
    text: task && typeof task.text === "string" ? task.text : "",
    done: Boolean(task && task.done),
  };
}

function normalizeTasks(tasks) {
  if (!Array.isArray(tasks)) {
    return [];
  }

  const seenIds = new Set();

  return tasks
    .map(normalizeTask)
    .filter((task) => task.text.trim().length > 0)
    .map((task) => {
      if (!seenIds.has(task.id)) {
        seenIds.add(task.id);
        return task;
      }

      const replacementTask = {
        ...task,
        id: createSafeId("task"),
      };
      seenIds.add(replacementTask.id);
      return replacementTask;
    });
}

function normalizeMemoBlockId(value, prefix = "block") {
  const candidate = value ? String(value) : "";

  if (/^[A-Za-z0-9_-]{1,128}$/.test(candidate)) {
    return candidate;
  }

  return createSafeId(prefix);
}

function normalizeHttpUrl(value) {
  const rawValue = typeof value === "string" ? value.trim() : "";

  if (!rawValue || rawValue.length > MAX_MEMO_LINK_URL_LENGTH) {
    return "";
  }

  try {
    const parsedUrl = new URL(rawValue);

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return "";
    }

    parsedUrl.hash = parsedUrl.hash || "";
    return parsedUrl.toString();
  } catch (_) {
    return "";
  }
}

function normalizeMemoLinkBlock(block) {
  const url = normalizeHttpUrl(block && block.url);

  if (!url) {
    return null;
  }

  const rawLabel = block && typeof block.label === "string" ? block.label.trim() : "";
  let fallbackLabel = "";

  try {
    fallbackLabel = new URL(url).hostname.replace(/^www\./, "");
  } catch (_) {}

  return {
    id: normalizeMemoBlockId(block && block.id, "link"),
    type: "link",
    url,
    label: (rawLabel || fallbackLabel || url).slice(0, MAX_MEMO_LINK_LABEL_LENGTH),
  };
}

const MEMO_STYLED_PARAGRAPH_COLORS = new Set([
  "default",
  "red",
  "orange",
  "green",
  "blue",
  "purple",
]);

const MEMO_STYLED_PARAGRAPH_SIZES = new Set(["small", "normal", "large"]);

function normalizeMemoStyledParagraphBlock(block) {
  const text = block && typeof block.text === "string" ? block.text.trim() : "";

  if (!text) {
    return null;
  }

  const color = MEMO_STYLED_PARAGRAPH_COLORS.has(block && block.color)
    ? block.color
    : "default";
  const size = MEMO_STYLED_PARAGRAPH_SIZES.has(block && block.size)
    ? block.size
    : "normal";

  return {
    id: normalizeMemoBlockId(block && block.id, "styled"),
    type: "styled_paragraph",
    text: text.slice(0, MAX_MEMO_STYLED_PARAGRAPH_LENGTH),
    bold: Boolean(block && block.bold),
    color,
    size,
  };
}

function normalizeMemoTableBlock(block) {
  const rawRows = Array.isArray(block && block.rows) ? block.rows : [];

  const rows = rawRows.slice(0, MAX_MEMO_TABLE_ROWS).map((row) => {
    const rawCells = Array.isArray(row) ? row : [];

    return rawCells.slice(0, MAX_MEMO_TABLE_COLS).map((cell) =>
      String(cell ?? "").slice(0, MAX_MEMO_TABLE_CELL_LENGTH)
    );
  });

  const hasContent = rows.some((row) => row.some((cell) => cell.trim().length > 0));

  if (rows.length === 0 || !hasContent) {
    return null;
  }

  return {
    id: normalizeMemoBlockId(block && block.id, "table"),
    type: "table",
    rows,
  };
}

const MEMO_IMAGE_BUCKET = "memo-images";
const MAX_MEMO_IMAGE_FILE_SIZE = 8 * 1024 * 1024;

async function uploadMemoImage(file) {
  if (!file || typeof file !== "object") {
    throw new Error("이미지 파일을 선택해주세요.");
  }

  if (file.size > MAX_MEMO_IMAGE_FILE_SIZE) {
    throw new Error("이미지 용량은 8MB 이하만 업로드할 수 있습니다.");
  }

  const { client, user } = await getCloudContext();
  const extension = (file.name && file.name.includes(".")
    ? file.name.split(".").pop()
    : file.type.split("/").pop() || "png"
  )
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 8) || "png";

  const filePath = `${user.id}/${createSafeId("img")}.${extension}`;

  const { error: uploadError } = await client.storage
    .from(MEMO_IMAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = client.storage.from(MEMO_IMAGE_BUCKET).getPublicUrl(filePath);

  if (!data || !data.publicUrl) {
    throw new Error("이미지 주소를 가져오지 못했습니다.");
  }

  return data.publicUrl;
}

function normalizeMemoImageBlock(block) {
  const url = normalizeHttpUrl(block && block.url);

  if (!url) {
    return null;
  }

  const alt = block && typeof block.alt === "string" ? block.alt.trim() : "";

  return {
    id: normalizeMemoBlockId(block && block.id, "image"),
    type: "image",
    url,
    alt: alt.slice(0, MAX_MEMO_LINK_LABEL_LENGTH),
  };
}

function normalizeMemoContentBlocks(blocks, legacyContent = "") {
  const safeBlocks = Array.isArray(blocks) ? blocks : [];
  const normalizedBlocks = [];
  let paragraphText = typeof legacyContent === "string" ? legacyContent : "";
  let paragraphId = "";
  let linkCount = 0;
  let styledCount = 0;
  let tableCount = 0;
  let imageCount = 0;

  safeBlocks.slice(0, MAX_MEMO_CONTENT_BLOCKS).forEach((block) => {
    if (!block || typeof block !== "object" || Array.isArray(block)) {
      return;
    }

    if (block.type === "paragraph" && !paragraphId) {
      paragraphText = typeof block.text === "string" ? block.text : paragraphText;
      paragraphId = normalizeMemoBlockId(block.id, "paragraph");
      return;
    }

    if (block.type === "link" && linkCount < MAX_MEMO_LINK_BLOCKS) {
      const normalizedLink = normalizeMemoLinkBlock(block);

      if (normalizedLink) {
        normalizedBlocks.push(normalizedLink);
        linkCount += 1;
      }

      return;
    }

    if (block.type === "styled_paragraph" && styledCount < MAX_MEMO_STYLED_PARAGRAPH_BLOCKS) {
      const normalizedStyled = normalizeMemoStyledParagraphBlock(block);

      if (normalizedStyled) {
        normalizedBlocks.push(normalizedStyled);
        styledCount += 1;
      }

      return;
    }

    if (block.type === "table" && tableCount < MAX_MEMO_TABLE_BLOCKS) {
      const normalizedTable = normalizeMemoTableBlock(block);

      if (normalizedTable) {
        normalizedBlocks.push(normalizedTable);
        tableCount += 1;
      }

      return;
    }

    if (block.type === "image" && imageCount < MAX_MEMO_IMAGE_BLOCKS) {
      const normalizedImage = normalizeMemoImageBlock(block);

      if (normalizedImage) {
        normalizedBlocks.push(normalizedImage);
        imageCount += 1;
      }
    }
  });

  const paragraphBlock = {
    id: paragraphId || "paragraph_main",
    type: "paragraph",
    text: paragraphText.slice(0, MAX_MEMO_CONTENT_LENGTH),
  };

  return [paragraphBlock, ...normalizedBlocks];
}

function getMemoExtraBlocksOrdered(memo) {
  return normalizeMemoContentBlocks(
    memo && (memo.contentBlocks || memo.content_blocks),
    memo && memo.content
  )
    .filter((block) => block.type !== "paragraph")
    .map((block, index) => ({ ...block, order: index + 1 }));
}

function getMemoLinks(memo) {
  return normalizeMemoContentBlocks(
    memo && (memo.contentBlocks || memo.content_blocks),
    memo && memo.content
  ).filter((block) => block.type === "link");
}

function getMemoStyledParagraphs(memo) {
  return normalizeMemoContentBlocks(
    memo && (memo.contentBlocks || memo.content_blocks),
    memo && memo.content
  ).filter((block) => block.type === "styled_paragraph");
}

function getMemoTables(memo) {
  return normalizeMemoContentBlocks(
    memo && (memo.contentBlocks || memo.content_blocks),
    memo && memo.content
  ).filter((block) => block.type === "table");
}

function getMemoImages(memo) {
  return normalizeMemoContentBlocks(
    memo && (memo.contentBlocks || memo.content_blocks),
    memo && memo.content
  ).filter((block) => block.type === "image");
}

function createMemoContentBlocks(content, links = [], extraBlocks = []) {
  return normalizeMemoContentBlocks(
    [
      {
        id: "paragraph_main",
        type: "paragraph",
        text: typeof content === "string" ? content : "",
      },
      ...(Array.isArray(links) ? links : []),
      ...(Array.isArray(extraBlocks) ? extraBlocks : []),
    ],
    content
  );
}

function getContentBlocksSearchText(blocks) {
  const normalized = normalizeMemoContentBlocks(blocks, "");

  const linkText = normalized
    .filter((block) => block.type === "link")
    .map((block) => `${block.label} ${block.url}`)
    .join(" ");

  const styledText = normalized
    .filter((block) => block.type === "styled_paragraph")
    .map((block) => block.text)
    .join(" ");

  const tableText = normalized
    .filter((block) => block.type === "table")
    .map((block) => block.rows.map((row) => row.join(" ")).join(" "))
    .join(" ");

  return `${linkText} ${styledText} ${tableText}`.trim();
}

function normalizeProject(project) {
  return typeof project === "string" ? project.trim() : "";
}

function normalizeCategory(category) {
  if (category === "프로젝트") {
    return "업무";
  }

  if (typeof category !== "string") {
    return "업무";
  }

  const normalizedCategory = category.trim().slice(0, MAX_MEMO_CATEGORY_LENGTH);

  if (normalizedCategory === LEGACY_TASK_MEMO_CATEGORY) {
    return FALLBACK_MEMO_CATEGORY;
  }

  return normalizedCategory || "업무";
}

function normalizeDueDate(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : null;
}

function normalizeMemo(memo) {
  const now = new Date().toISOString();

  return {
    ...memo,
    id: memo && memo.id ? String(memo.id) : createSafeId("memo"),
    title: memo && typeof memo.title === "string" ? memo.title : "제목 없음",
    content: memo && typeof memo.content === "string" ? memo.content : "",
    contentBlocks: normalizeMemoContentBlocks(
      memo && (memo.contentBlocks || memo.content_blocks),
      memo && memo.content
    ),
    contentFormatVersion: Number.isFinite(Number(memo && (memo.contentFormatVersion ?? memo.content_format_version)))
      ? Number(memo.contentFormatVersion ?? memo.content_format_version)
      : 0,
    category: normalizeCategory(memo && memo.category),
    project: normalizeProject(memo && memo.project),
    createdAt: (memo && (memo.createdAt || memo.created_at)) || now,
    updatedAt:
      (memo && (memo.updatedAt || memo.updated_at || memo.createdAt || memo.created_at)) ||
      now,
    isArchived:
      memo && memo.isArchived !== undefined
        ? Boolean(memo.isArchived)
        : Boolean(memo && memo.category === "보관"),
    isDeleted:
      memo && memo.isDeleted !== undefined
        ? Boolean(memo.isDeleted)
        : Boolean(memo && memo.is_deleted),
    isImportant:
      memo && memo.isImportant !== undefined
        ? Boolean(memo.isImportant)
        : Boolean(memo && memo.is_important),
    isPinned:
      memo && memo.isPinned !== undefined
        ? Boolean(memo.isPinned)
        : Boolean(memo && memo.is_pinned),
    dueDate: normalizeDueDate(memo && (memo.dueDate ?? memo.due_date)),
    tasks: normalizeTasks(memo && memo.tasks),
  };
}

function mapDatabaseRowToMemo(row) {
  return normalizeMemo({
    id: row.id,
    title: row.title,
    content: row.content,
    contentBlocks: row.content_blocks,
    contentFormatVersion: row.content_format_version,
    category: row.category,
    project: row.project,
    isImportant: row.is_important,
    isPinned: row.is_pinned,
    isDeleted: row.is_deleted,
    dueDate: row.due_date,
    tasks: row.tasks,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function getMemos() {
  return memoCache;
}

function clearMemoCache() {
  memoCache = [];
  cloudMemosLoaded = false;
}

function clearMemoCategoryCache() {
  memoCategoryCache = [];
  cloudMemoCategoriesLoaded = false;
}

function hasLoadedCloudMemos() {
  return cloudMemosLoaded;
}

function hasLoadedCloudMemoCategories() {
  return cloudMemoCategoriesLoaded;
}

function normalizeMemoCategoryRecord(row) {
  return {
    id: String(row.id),
    name: normalizeCategory(row.name),
    position: Number.isFinite(Number(row.position)) ? Number(row.position) : 0,
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || row.created_at || "",
  };
}

function sortMemoCategoryCache() {
  memoCategoryCache.sort((left, right) => {
    const positionCompare = left.position - right.position;

    if (positionCompare !== 0) {
      return positionCompare;
    }

    return left.name.localeCompare(right.name, "ko-KR");
  });
}

function getMemoCategories() {
  return memoCategoryCache.map((category) => ({ ...category }));
}

function isReservedMemoCategoryName(name) {
  return RESERVED_MEMO_CATEGORY_NAMES.has(normalizeCategory(name));
}

function validateMemoCategoryName(name, options = {}) {
  const { excludeId = "" } = options;
  const normalizedName = typeof name === "string" ? name.trim() : "";

  if (!normalizedName) {
    throw new Error("카테고리 이름을 입력해주세요.");
  }

  if (normalizedName.length > MAX_MEMO_CATEGORY_LENGTH) {
    throw new Error(`카테고리 이름은 ${MAX_MEMO_CATEGORY_LENGTH}자 이하로 입력해주세요.`);
  }

  if (/\p{Cc}/u.test(normalizedName)) {
    throw new Error("카테고리 이름에 제어 문자를 사용할 수 없습니다.");
  }

  if (isReservedMemoCategoryName(normalizedName)) {
    throw new Error(`“${normalizedName}”은 시스템에서 사용하는 이름입니다.`);
  }

  const duplicateCategory = memoCategoryCache.find(
    (category) =>
      category.id !== excludeId &&
      category.name.localeCompare(normalizedName, "ko-KR", { sensitivity: "accent" }) === 0
  );

  if (duplicateCategory) {
    throw new Error("같은 이름의 카테고리가 이미 있습니다.");
  }

  return normalizedName;
}

function getDiscoveredMemoCategoryNames(options = {}) {
  const { includeDefaults = false } = options;
  const discoveredNames = memoCache
    .map((memo) => normalizeCategory(memo.category))
    .filter((name) => !isReservedMemoCategoryName(name));

  return [
    ...new Set([
      ...(includeDefaults ? DEFAULT_MEMO_CATEGORIES : []),
      ...discoveredNames,
    ]),
  ];
}

function getLegacyMemoCount() {
  const savedMemos = localStorage.getItem(LEGACY_STORAGE_KEY);

  if (!savedMemos) {
    return 0;
  }

  try {
    const parsed = JSON.parse(savedMemos);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch (error) {
    return 0;
  }
}


function getLegacyMemos() {
  const savedMemos = localStorage.getItem(LEGACY_STORAGE_KEY);

  if (!savedMemos) {
    return [];
  }

  try {
    const parsed = JSON.parse(savedMemos);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map(normalizeMemo);
  } catch (error) {
    console.error("기존 브라우저 메모를 읽지 못했습니다.", error);
    return [];
  }
}

function hasLegacyMemoData() {
  return getLegacyMemos().length > 0;
}

async function importLegacyMemosToCloud() {
  const legacyMemos = getLegacyMemos();

  if (legacyMemos.length === 0) {
    return {
      addedCount: 0,
      skippedCount: 0,
      totalImportedCount: 0,
      source: "localStorage",
    };
  }

  const result = await importMemosFromBackup({
    app: "SoloNote",
    backupVersion: "legacy-localStorage",
    storage: "localStorage",
    exportedAt: new Date().toISOString(),
    memos: legacyMemos,
  });

  return {
    ...result,
    source: "localStorage",
  };
}

async function getCloudContext() {
  const client = window.solonoteSupabase;

  if (!client) {
    throw new Error("Supabase 클라이언트가 준비되지 않았습니다.");
  }

  const { data, error } = await client.auth.getSession();

  if (error) {
    throw error;
  }

  const session = data && data.session;

  if (!session || !session.user) {
    throw new Error("로그인 세션이 없습니다. 다시 로그인해주세요.");
  }

  return {
    client,
    session,
    user: session.user,
  };
}

async function fetchMemoCategories(client, userId) {
  const { data, error } = await client
    .from("memo_categories")
    .select("id, name, position, created_at, updated_at")
    .eq("user_id", userId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []).map(normalizeMemoCategoryRecord);
}

async function insertMissingMemoCategories(client, userId, names, startPosition = 0) {
  const existingNames = new Set(
    memoCategoryCache.map((category) => category.name.toLocaleLowerCase("ko-KR"))
  );
  const uniqueNames = [];

  names.forEach((name) => {
    const normalizedName = normalizeCategory(name);
    const comparisonName = normalizedName.toLocaleLowerCase("ko-KR");

    if (
      isReservedMemoCategoryName(normalizedName) ||
      existingNames.has(comparisonName)
    ) {
      return;
    }

    existingNames.add(comparisonName);
    uniqueNames.push(normalizedName);
  });

  if (uniqueNames.length === 0) {
    return [];
  }

  const payload = uniqueNames.map((name, index) => ({
    user_id: userId,
    name,
    position: startPosition + index,
  }));

  const { data, error } = await client
    .from("memo_categories")
    .insert(payload)
    .select("id, name, position, created_at, updated_at");

  if (error && error.code !== "23505") {
    throw error;
  }

  return (data || []).map(normalizeMemoCategoryRecord);
}

async function loadMemoCategoriesFromCloud() {
  const { client, user } = await getCloudContext();

  memoCategoryCache = await fetchMemoCategories(client, user.id);

  const discoveredNames = getDiscoveredMemoCategoryNames({
    includeDefaults: memoCategoryCache.length === 0,
  });
  const nextPosition = memoCategoryCache.reduce(
    (highestPosition, category) => Math.max(highestPosition, category.position + 1),
    0
  );

  await insertMissingMemoCategories(
    client,
    user.id,
    discoveredNames,
    nextPosition
  );

  memoCategoryCache = await fetchMemoCategories(client, user.id);
  sortMemoCategoryCache();
  cloudMemoCategoriesLoaded = true;

  return getMemoCategories();
}

async function addMemoCategory(name) {
  const normalizedName = validateMemoCategoryName(name);
  const { client, user } = await getCloudContext();
  const nextPosition = memoCategoryCache.reduce(
    (highestPosition, category) => Math.max(highestPosition, category.position + 1),
    0
  );

  const { data, error } = await client
    .from("memo_categories")
    .insert({
      user_id: user.id,
      name: normalizedName,
      position: nextPosition,
    })
    .select("id, name, position, created_at, updated_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("같은 이름의 카테고리가 이미 있습니다.");
    }

    throw error;
  }

  const newCategory = normalizeMemoCategoryRecord(data);
  memoCategoryCache.push(newCategory);
  sortMemoCategoryCache();
  cloudMemoCategoriesLoaded = true;

  return { ...newCategory };
}

async function renameMemoCategory(categoryId, name) {
  const category = memoCategoryCache.find((item) => item.id === categoryId);

  if (!category) {
    throw new Error("변경할 카테고리를 찾지 못했습니다. 새로고침 후 다시 시도해주세요.");
  }

  const normalizedName = validateMemoCategoryName(name, { excludeId: categoryId });

  if (category.name === normalizedName) {
    return { ...category };
  }

  const { client } = await getCloudContext();
  const { error } = await client.rpc("rename_memo_category", {
    target_category_id: categoryId,
    replacement_name: normalizedName,
  });

  if (error) {
    if (error.code === "23505" || /already exists|duplicate/i.test(error.message || "")) {
      throw new Error("같은 이름의 카테고리가 이미 있습니다.");
    }

    throw error;
  }

  memoCategoryCache = memoCategoryCache.map((item) =>
    item.id === categoryId
      ? { ...item, name: normalizedName, updatedAt: new Date().toISOString() }
      : item
  );
  await loadMemosFromCloud();
  sortMemoCategoryCache();

  return { ...memoCategoryCache.find((item) => item.id === categoryId) };
}

async function deleteMemoCategory(categoryId) {
  const category = memoCategoryCache.find((item) => item.id === categoryId);

  if (!category) {
    throw new Error("삭제할 카테고리를 찾지 못했습니다. 새로고침 후 다시 시도해주세요.");
  }

  if (memoCategoryCache.length <= 1) {
    throw new Error("메모 작성을 위해 카테고리를 최소 1개는 남겨주세요.");
  }

  const { client } = await getCloudContext();
  const { data, error } = await client.rpc("delete_memo_category", {
    target_category_id: categoryId,
  });

  if (error) {
    throw error;
  }

  const affectedMemoCount = Number(data) || 0;
  memoCategoryCache = memoCategoryCache.filter((item) => item.id !== categoryId);
  await loadMemosFromCloud();
  sortMemoCategoryCache();

  return {
    deletedCategory: { ...category },
    affectedMemoCount,
  };
}

function getBookmarks() {
  return bookmarkCache.map((bookmark) => ({ ...bookmark }));
}

function normalizeBookmarkRecord(row) {
  return {
    id: String(row.id),
    title: row.title,
    url: row.url,
    groupName: row.group_name || "",
    position: Number.isFinite(Number(row.position)) ? Number(row.position) : 0,
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || row.created_at || "",
  };
}

function sortBookmarkCache() {
  bookmarkCache.sort((left, right) => left.position - right.position);
}

function normalizeBookmarkUrl(url) {
  const trimmed = (url || "").trim();

  if (!trimmed) {
    throw new Error("웹사이트 주소를 입력해주세요.");
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

async function loadBookmarksFromCloud() {
  const { client, user } = await getCloudContext();
  const { data, error } = await client
    .from("bookmarks")
    .select("id, title, url, group_name, position, created_at, updated_at")
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }

  bookmarkCache = (data || []).map(normalizeBookmarkRecord);
  sortBookmarkCache();
  cloudBookmarksLoaded = true;

  return getBookmarks();
}

async function addBookmark(title, url) {
  const normalizedTitle = (title || "").trim();

  if (!normalizedTitle) {
    throw new Error("사이트 이름을 입력해주세요.");
  }

  const normalizedUrl = normalizeBookmarkUrl(url);
  const { client, user } = await getCloudContext();
  const nextPosition = bookmarkCache.reduce(
    (highestPosition, bookmark) => Math.max(highestPosition, bookmark.position + 1),
    0
  );

  const { data, error } = await client
    .from("bookmarks")
    .insert({
      user_id: user.id,
      title: normalizedTitle,
      url: normalizedUrl,
      position: nextPosition,
    })
    .select("id, title, url, group_name, position, created_at, updated_at")
    .single();

  if (error) {
    throw error;
  }

  const newBookmark = normalizeBookmarkRecord(data);
  bookmarkCache.push(newBookmark);
  sortBookmarkCache();
  cloudBookmarksLoaded = true;

  return { ...newBookmark };
}

async function updateBookmark(id, title, url) {
  const normalizedTitle = (title || "").trim();

  if (!normalizedTitle) {
    throw new Error("사이트 이름을 입력해주세요.");
  }

  const normalizedUrl = normalizeBookmarkUrl(url);
  const { client, user } = await getCloudContext();

  const { data, error } = await client
    .from("bookmarks")
    .update({
      title: normalizedTitle,
      url: normalizedUrl,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, title, url, group_name, position, created_at, updated_at")
    .single();

  if (error) {
    throw error;
  }

  const updatedBookmark = normalizeBookmarkRecord(data);
  bookmarkCache = bookmarkCache.map((bookmark) =>
    bookmark.id === id ? updatedBookmark : bookmark
  );
  sortBookmarkCache();

  return { ...updatedBookmark };
}

async function deleteBookmark(id) {
  const { client, user } = await getCloudContext();
  const { error } = await client
    .from("bookmarks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }

  bookmarkCache = bookmarkCache.filter((bookmark) => bookmark.id !== id);

  return true;
}

function hasLoadedCloudBookmarks() {
  return cloudBookmarksLoaded;
}

function validateMemoForWrite(memoData) {
  const stringFields = [
    ["제목", memoData.title, MAX_MEMO_TITLE_LENGTH],
    ["내용", memoData.content, MAX_MEMO_CONTENT_LENGTH],
    ["프로젝트", memoData.project, MAX_MEMO_PROJECT_LENGTH],
    ["카테고리", memoData.category, MAX_MEMO_CATEGORY_LENGTH],
  ];

  stringFields.forEach(([label, value, maxLength]) => {
    if (value !== undefined && value !== null && typeof value !== "string") {
      throw new Error(`${label} 형식이 올바르지 않습니다.`);
    }

    if (typeof value === "string" && value.length > maxLength) {
      throw new Error(`${label}은 ${maxLength}자 이하로 입력해주세요.`);
    }

    if (typeof value === "string" && value.includes("\u0000")) {
      throw new Error(`${label}에 사용할 수 없는 문자가 포함되어 있습니다.`);
    }
  });

  if (memoData.contentBlocks !== undefined && !Array.isArray(memoData.contentBlocks)) {
    throw new Error("메모 블록 형식이 올바르지 않습니다.");
  }

  const rawContentBlocks = Array.isArray(memoData.contentBlocks)
    ? memoData.contentBlocks
    : [];

  if (rawContentBlocks.length > MAX_MEMO_CONTENT_BLOCKS) {
    throw new Error(`메모 요소는 ${MAX_MEMO_CONTENT_BLOCKS}개까지 저장할 수 있습니다.`);
  }

  const rawLinkBlocks = rawContentBlocks.filter(
    (block) => block && typeof block === "object" && !Array.isArray(block) && block.type === "link"
  );

  if (rawLinkBlocks.length > MAX_MEMO_LINK_BLOCKS) {
    throw new Error(`링크는 메모 하나에 ${MAX_MEMO_LINK_BLOCKS}개까지 저장할 수 있습니다.`);
  }

  rawContentBlocks.forEach((block, index) => {
    if (!block || typeof block !== "object" || Array.isArray(block)) {
      throw new Error(`${index + 1}번째 메모 요소 형식이 올바르지 않습니다.`);
    }

    if (block.type === "paragraph") {
      if (typeof block.text !== "string" || block.text.length > MAX_MEMO_CONTENT_LENGTH) {
        throw new Error(`${index + 1}번째 텍스트 요소 형식이 올바르지 않습니다.`);
      }
      return;
    }

    if (block.type === "link") {
      if (!normalizeHttpUrl(block.url)) {
        throw new Error(`${index + 1}번째 링크 주소가 올바르지 않습니다.`);
      }

      if (block.label !== undefined && typeof block.label !== "string") {
        throw new Error(`${index + 1}번째 링크 이름 형식이 올바르지 않습니다.`);
      }

      if (String(block.label || "").length > MAX_MEMO_LINK_LABEL_LENGTH) {
        throw new Error(`링크 이름은 ${MAX_MEMO_LINK_LABEL_LENGTH}자 이하로 입력해주세요.`);
      }
      return;
    }

    if (block.type === "styled_paragraph") {
      if (typeof block.text !== "string" || block.text.length > MAX_MEMO_STYLED_PARAGRAPH_LENGTH) {
        throw new Error(`${index + 1}번째 서식 문단 형식이 올바르지 않습니다.`);
      }
      return;
    }

    if (block.type === "table") {
      if (!Array.isArray(block.rows)) {
        throw new Error(`${index + 1}번째 표 형식이 올바르지 않습니다.`);
      }
      return;
    }

    if (block.type === "image") {
      if (!normalizeHttpUrl(block.url)) {
        throw new Error(`${index + 1}번째 이미지 주소가 올바르지 않습니다.`);
      }
      return;
    }

    throw new Error(`${index + 1}번째 메모 요소 유형을 지원하지 않습니다.`);
  });

  if (memoData.tasks !== undefined && !Array.isArray(memoData.tasks)) {
    throw new Error("체크리스트 형식이 올바르지 않습니다.");
  }

  const tasks = Array.isArray(memoData.tasks) ? memoData.tasks : [];

  if (tasks.length > MAX_MEMO_TASKS) {
    throw new Error(`체크리스트는 메모 하나에 ${MAX_MEMO_TASKS}개까지 저장할 수 있습니다.`);
  }

  tasks.forEach((task, index) => {
    if (!task || typeof task !== "object" || Array.isArray(task)) {
      throw new Error(`${index + 1}번째 체크리스트 형식이 올바르지 않습니다.`);
    }

    if (typeof task.text !== "string") {
      throw new Error(`${index + 1}번째 체크리스트 내용 형식이 올바르지 않습니다.`);
    }

    if (task.text.length > MAX_MEMO_TASK_TEXT_LENGTH) {
      throw new Error(
        `체크리스트 내용은 ${MAX_MEMO_TASK_TEXT_LENGTH}자 이하로 입력해주세요.`
      );
    }

    if (task.text.includes("\u0000")) {
      throw new Error("체크리스트에 사용할 수 없는 문자가 포함되어 있습니다.");
    }
  });
}

function toDatabasePayload(memoData, userId) {
  validateMemoForWrite(memoData);

  return {
    user_id: userId,
    title: typeof memoData.title === "string" ? memoData.title : "",
    content: typeof memoData.content === "string" ? memoData.content : "",
    content_blocks: createMemoContentBlocks(memoData.content, memoData.contentBlocks),
    content_format_version: CONTENT_FORMAT_VERSION,
    category: normalizeCategory(memoData.category),
    project: normalizeProject(memoData.project),
    is_important: Boolean(memoData.isImportant),
    is_pinned: Boolean(memoData.isPinned),
    is_deleted: Boolean(memoData.isDeleted),
    due_date: normalizeDueDate(memoData.dueDate),
    tasks: normalizeTasks(memoData.tasks),
  };
}

function sortCacheByUpdatedDate() {
  memoCache.sort((a, b) => {
    return new Date(b.updatedAt || b.createdAt).getTime() -
      new Date(a.updatedAt || a.createdAt).getTime();
  });
}

async function loadMemosFromCloud() {
  const { client, user } = await getCloudContext();

  const { data, error } = await client
    .from("memos")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = data || [];
  memoCache = rows.map(mapDatabaseRowToMemo);
  cloudMemosLoaded = true;

  if (rows.some((row) => row.category === "프로젝트")) {
    const { error: migrationError } = await client
      .from("memos")
      .update({ category: "업무" })
      .eq("category", "프로젝트")
      .eq("user_id", user.id);

    if (migrationError) {
      console.warn("기존 프로젝트 카테고리를 업무로 변경하지 못했습니다.", migrationError);
    }
  }

  return memoCache;
}

async function addMemo(memoData) {
  const { client, user } = await getCloudContext();

  const payload = toDatabasePayload(
    {
      ...memoData,
      isDeleted: false,
    },
    user.id
  );

  const { data, error } = await client
    .from("memos")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  const newMemo = mapDatabaseRowToMemo(data);
  memoCache.unshift(newMemo);

  return newMemo;
}

async function updateMemo(id, updatedData, expectedUpdatedAt = "") {
  const { client, user } = await getCloudContext();

  let serverRow = null;

  if (expectedUpdatedAt) {
    const { data, error } = await client
      .from("memos")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error("이 메모가 다른 기기에서 삭제되었거나 접근할 수 없습니다.");
    }

    serverRow = data;
    const serverMemo = mapDatabaseRowToMemo(data);

    if (!areSameCloudTimestamp(serverMemo.updatedAt, expectedUpdatedAt)) {
      throw new MemoConflictError(serverMemo);
    }
  }

  const payload = toDatabasePayload(
    {
      ...updatedData,
      isDeleted: Boolean(updatedData.isDeleted),
    },
    user.id
  );

  delete payload.user_id;
  delete payload.is_deleted;

  let query = client
    .from("memos")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id);

  if (serverRow && serverRow.updated_at) {
    query = query.eq("updated_at", serverRow.updated_at);
  }

  const { data, error } = await query
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    const latestMemo = await fetchMemoFromCloud(id);
    throw new MemoConflictError(latestMemo);
  }

  const updatedMemo = mapDatabaseRowToMemo(data);
  replaceMemoInCache(updatedMemo);

  return updatedMemo;
}

async function setMemoDeletedState(id, isDeleted) {
  const { client, user } = await getCloudContext();

  const { data, error } = await client
    .from("memos")
    .update({ is_deleted: Boolean(isDeleted) })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  const updatedMemo = mapDatabaseRowToMemo(data);
  memoCache = memoCache.map((memo) => (memo.id === id ? updatedMemo : memo));
  sortCacheByUpdatedDate();

  return updatedMemo;
}

async function moveMemoToTrash(id) {
  return setMemoDeletedState(id, true);
}

async function restoreMemo(id) {
  return setMemoDeletedState(id, false);
}

async function permanentlyDeleteMemo(id) {
  const { client, user } = await getCloudContext();

  const { error } = await client
    .from("memos")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }

  memoCache = memoCache.filter((memo) => memo.id !== id);
}

async function toggleTaskDone(memoId, taskId, expectedUpdatedAt = "") {
  const memo = findMemoById(memoId);

  if (!memo) {
    return null;
  }

  const tasks = memo.tasks.map((task) => {
    if (task.id !== taskId) {
      return task;
    }

    return {
      ...task,
      done: !task.done,
    };
  });

  return updateMemo(
    memoId,
    {
      title: memo.title,
      content: memo.content,
      contentBlocks: memo.contentBlocks,
      category: memo.category,
      project: memo.project,
      isImportant: memo.isImportant,
      tasks,
    },
    expectedUpdatedAt || memo.updatedAt
  );
}

function findMemoById(id) {
  return memoCache.find((memo) => memo.id === id);
}

function getActiveMemoCount() {
  return memoCache.filter((memo) => !memo.isDeleted).length;
}

function getProjectOptions() {
  const projects = memoCache
    .filter((memo) => !memo.isDeleted)
    .map((memo) => normalizeProject(memo.project))
    .filter(Boolean);

  return [...new Set(projects)].sort((a, b) => a.localeCompare(b, "ko-KR"));
}

function createBackupData() {
  return {
    app: "SoloNote",
    backupVersion: "4.7.0-dev1.1",
    storage: "supabase",
    exportedAt: new Date().toISOString(),
    categories: getMemoCategories().map((category) => category.name),
    memos: memoCache,
  };
}

function extractMemosFromBackup(backupData) {
  if (Array.isArray(backupData)) {
    return backupData;
  }

  if (backupData && Array.isArray(backupData.memos)) {
    return backupData.memos;
  }

  throw new Error("올바른 Creative Note 백업 파일이 아닙니다.");
}

function extractMemoCategoryNamesFromBackup(backupData) {
  if (!backupData || !Array.isArray(backupData.categories)) {
    return [];
  }

  return backupData.categories
    .map((category) =>
      typeof category === "string" ? category : category && category.name
    )
    .map((name) => normalizeCategory(name))
    .filter((name) => !isReservedMemoCategoryName(name));
}

function validateBackupText(value, fieldLabel, maxLength, memoIndex) {
  if (value === undefined || value === null) {
    return;
  }

  if (typeof value !== "string") {
    throw new Error(`백업 파일의 ${memoIndex + 1}번째 메모 ${fieldLabel} 형식이 올바르지 않습니다.`);
  }

  if (value.length > maxLength) {
    throw new Error(
      `백업 파일의 ${memoIndex + 1}번째 메모 ${fieldLabel}이 허용 길이(${maxLength}자)를 초과합니다.`
    );
  }

  if (value.includes("\u0000")) {
    throw new Error(
      `백업 파일의 ${memoIndex + 1}번째 메모 ${fieldLabel}에 사용할 수 없는 문자가 포함되어 있습니다.`
    );
  }
}

function validateBackupTimestamp(value, fieldLabel, memoIndex) {
  if (value === undefined || value === null || value === "") {
    return;
  }

  if (
    typeof value !== "string" ||
    value.length > 64 ||
    Number.isNaN(new Date(value).getTime())
  ) {
    throw new Error(`백업 파일의 ${memoIndex + 1}번째 메모 ${fieldLabel} 형식이 올바르지 않습니다.`);
  }
}

function validateBackupForImport(backupData, importedMemos) {
  if (importedMemos.length > MAX_BACKUP_MEMOS) {
    throw new Error(`백업 파일은 한 번에 메모 ${MAX_BACKUP_MEMOS}개까지 복원할 수 있습니다.`);
  }

  if (
    backupData &&
    Array.isArray(backupData.categories) &&
    backupData.categories.length > MAX_BACKUP_CATEGORIES
  ) {
    throw new Error(`백업 파일은 카테고리 ${MAX_BACKUP_CATEGORIES}개까지 복원할 수 있습니다.`);
  }

  if (backupData && Array.isArray(backupData.categories)) {
    backupData.categories.forEach((category, categoryIndex) => {
      const name =
        typeof category === "string"
          ? category
          : category && typeof category === "object"
            ? category.name
            : undefined;

      if (typeof name !== "string" || !name.trim()) {
        throw new Error(`백업 파일의 ${categoryIndex + 1}번째 카테고리 형식이 올바르지 않습니다.`);
      }

      if (name.trim().length > MAX_MEMO_CATEGORY_LENGTH || name.includes("\u0000")) {
        throw new Error(`백업 파일의 ${categoryIndex + 1}번째 카테고리 이름이 올바르지 않습니다.`);
      }
    });
  }

  let totalTaskCount = 0;

  importedMemos.forEach((memo, memoIndex) => {
    if (!memo || typeof memo !== "object" || Array.isArray(memo)) {
      throw new Error(`백업 파일의 ${memoIndex + 1}번째 메모 형식이 올바르지 않습니다.`);
    }

    validateBackupText(memo.title, "제목", MAX_MEMO_TITLE_LENGTH, memoIndex);
    validateBackupText(memo.content, "내용", MAX_MEMO_CONTENT_LENGTH, memoIndex);

    if (memo.contentBlocks !== undefined && !Array.isArray(memo.contentBlocks)) {
      throw new Error(`백업 파일의 ${memoIndex + 1}번째 메모 블록 형식이 올바르지 않습니다.`);
    }

    if (Array.isArray(memo.contentBlocks)) {
      if (memo.contentBlocks.length > MAX_MEMO_CONTENT_BLOCKS) {
        throw new Error(`백업 파일의 ${memoIndex + 1}번째 메모 요소 수가 너무 많습니다.`);
      }

      memo.contentBlocks.forEach((block, blockIndex) => {
        if (!block || typeof block !== "object" || Array.isArray(block)) {
          throw new Error(`백업 파일의 ${memoIndex + 1}번째 메모 ${blockIndex + 1}번째 요소 형식이 올바르지 않습니다.`);
        }

        if (block.type === "link") {
          if (!normalizeHttpUrl(block.url)) {
            throw new Error(`백업 파일의 ${memoIndex + 1}번째 메모 링크 주소가 올바르지 않습니다.`);
          }
          validateBackupText(
            block.label,
            `${blockIndex + 1}번째 링크 이름`,
            MAX_MEMO_LINK_LABEL_LENGTH,
            memoIndex
          );
        }
      });
    }
    validateBackupText(memo.project, "프로젝트", MAX_MEMO_PROJECT_LENGTH, memoIndex);
    validateBackupText(memo.category, "카테고리", MAX_MEMO_CATEGORY_LENGTH, memoIndex);
    validateBackupTimestamp(
      memo.updatedAt || memo.updated_at,
      "수정 시각",
      memoIndex
    );
    validateBackupTimestamp(
      memo.createdAt || memo.created_at,
      "생성 시각",
      memoIndex
    );

    if (memo.tasks !== undefined && !Array.isArray(memo.tasks)) {
      throw new Error(`백업 파일의 ${memoIndex + 1}번째 메모 체크리스트 형식이 올바르지 않습니다.`);
    }

    const tasks = Array.isArray(memo.tasks) ? memo.tasks : [];

    if (tasks.length > MAX_MEMO_TASKS) {
      throw new Error(
        `백업 파일의 ${memoIndex + 1}번째 메모는 체크리스트 ${MAX_MEMO_TASKS}개까지 복원할 수 있습니다.`
      );
    }

    totalTaskCount += tasks.length;

    if (totalTaskCount > MAX_BACKUP_TOTAL_TASKS) {
      throw new Error(`백업 파일은 체크리스트를 총 ${MAX_BACKUP_TOTAL_TASKS}개까지 복원할 수 있습니다.`);
    }

    tasks.forEach((task, taskIndex) => {
      if (!task || typeof task !== "object" || Array.isArray(task)) {
        throw new Error(
          `백업 파일의 ${memoIndex + 1}번째 메모 ${taskIndex + 1}번째 체크리스트 형식이 올바르지 않습니다.`
        );
      }

      validateBackupText(
        task.text,
        `${taskIndex + 1}번째 체크리스트`,
        MAX_MEMO_TASK_TEXT_LENGTH,
        memoIndex
      );
    });
  });
}

async function importMemoCategoriesFromBackup(backupData, client, userId) {
  const categoryNames = extractMemoCategoryNamesFromBackup(backupData);

  if (categoryNames.length === 0) {
    return;
  }

  const nextPosition = memoCategoryCache.reduce(
    (highestPosition, category) => Math.max(highestPosition, category.position + 1),
    0
  );

  await insertMissingMemoCategories(
    client,
    userId,
    categoryNames,
    nextPosition
  );
}

function normalizeTextForSignature(value) {
  return String(value || "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .trim();
}

function normalizeDateForSignature(value) {
  if (!value) {
    return "";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return normalizeTextForSignature(value);
  }

  return parsedDate.toISOString();
}

function normalizeTasksForSignature(tasks) {
  if (!Array.isArray(tasks)) {
    return "[]";
  }

  return JSON.stringify(
    tasks.map((task) => ({
      text: normalizeTextForSignature(task && task.text),
      done: Boolean(task && task.done),
    }))
  );
}

function createMemoSignature(memo) {
  return [
    normalizeTextForSignature(memo.title),
    normalizeTextForSignature(memo.content),
    JSON.stringify(normalizeMemoContentBlocks(memo.contentBlocks, memo.content)),
    normalizeTextForSignature(memo.category),
    normalizeTextForSignature(memo.project),
    normalizeDateForSignature(memo.createdAt),
    String(Boolean(memo.isImportant)),
    String(Boolean(memo.isDeleted)),
    normalizeTasksForSignature(memo.tasks),
  ].join("\u241f");
}

async function importMemosFromBackup(backupData) {
  const rawImportedMemos = extractMemosFromBackup(backupData);
  validateBackupForImport(backupData, rawImportedMemos);
  const importedMemos = rawImportedMemos.map(normalizeMemo);
  const { client, user } = await getCloudContext();

  await importMemoCategoriesFromBackup(backupData, client, user.id);

  const existingSignatures = new Set(
    memoCache.map((memo) => createMemoSignature(normalizeMemo(memo)))
  );
  const memosToInsert = [];
  let skippedCount = 0;

  importedMemos.forEach((memo) => {
    const normalizedMemo = normalizeMemo(memo);
    const signature = createMemoSignature(normalizedMemo);

    if (existingSignatures.has(signature)) {
      skippedCount += 1;
      return;
    }

    existingSignatures.add(signature);
    memosToInsert.push({
      ...toDatabasePayload(normalizedMemo, user.id),
      created_at: normalizedMemo.createdAt,
      updated_at: normalizedMemo.updatedAt,
    });
  });

  if (memosToInsert.length === 0) {
    await loadMemoCategoriesFromCloud();

    return {
      addedCount: 0,
      skippedCount,
      totalImportedCount: importedMemos.length,
    };
  }

  const { data, error } = await client
    .from("memos")
    .insert(memosToInsert)
    .select();

  if (error) {
    throw error;
  }

  const addedMemos = (data || []).map(mapDatabaseRowToMemo);
  memoCache = [...addedMemos, ...memoCache];
  sortCacheByUpdatedDate();
  await loadMemoCategoriesFromCloud();

  return {
    addedCount: addedMemos.length,
    skippedCount,
    totalImportedCount: importedMemos.length,
  };
}

function getDataStats() {
  const trashCount = memoCache.filter((memo) => memo.isDeleted).length;

  return {
    totalCount: memoCache.length,
    activeCount: memoCache.length - trashCount,
    trashCount,
  };
}

async function emptyTrash() {
  const { client, user } = await getCloudContext();
  const deletedCount = memoCache.filter((memo) => memo.isDeleted).length;

  if (deletedCount === 0) {
    return 0;
  }

  const { error } = await client
    .from("memos")
    .delete()
    .eq("user_id", user.id)
    .eq("is_deleted", true);

  if (error) {
    throw error;
  }

  memoCache = memoCache.filter((memo) => !memo.isDeleted);

  return deletedCount;
}

async function resetAllData() {
  const { client, user } = await getCloudContext();
  const deletedCount = memoCache.length;

  if (deletedCount === 0) {
    return 0;
  }

  const { error } = await client
    .from("memos")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }

  memoCache = [];

  return deletedCount;
}
