// ============================================================================
// 📱 جسر ربط تطبيق الفون (GitHub Pages PWA) بـ Google Drive وفولدرات البيرسونات
// الرابط النشط حالياً:
// https://script.google.com/macros/s/AKfycbxVlbP4XYk-jZ_Z9ZwL2aMz1qTyvE9A3KGsVnvmy-ccGuNgMXFBd8V3jTFEMMPHlK80/exec
// ============================================================================
const VAULT_FOLDER_NAME = "Conversation_Memory_Vault";
const SOURCES_FOLDER_NAME = "MONAD_Sources";
const WORKSPACES_ROOT_NAME = "Shared_Persona_Workspaces";

function getOrCreateFolder(name, parentFolder) {
  const root = parentFolder || DriveApp;
  const it = root.getFoldersByName(name);
  return it.hasNext() ? it.next() : root.createFolder(name);
}

function resolvePersonaWorkspaceFolder(personaFolderName) {
  const wsRoot = getOrCreateFolder(WORKSPACES_ROOT_NAME);
  return getOrCreateFolder(personaFolderName, wsRoot);
}

function doGet(e) {
  const action = (e.parameter.action || "list_vault");
  const personaFolder = (e.parameter.persona_folder || "").trim();
  const out = { status: "ok", action: action, items: [] };

  let folder;
  if (personaFolder) {
    folder = resolvePersonaWorkspaceFolder(personaFolder);
  } else {
    folder = getOrCreateFolder(action === "list_sources" ? SOURCES_FOLDER_NAME : VAULT_FOLDER_NAME);
  }

  const files = folder.getFiles();
  while (files.hasNext() && out.items.length < 100) {
    const f = files.next();
    out.items.push({
      file_id: f.getId(),
      file_name: f.getName(),
      updated_at: Utilities.formatDate(f.getLastUpdated(), "GMT+3", "yyyy-MM-dd HH:mm:ss"),
      size_kb: Math.round(f.getSize() / 1024)
    });
  }
  if (action === "read_file" && e.parameter.file_id) {
    const file = DriveApp.getFileById(e.parameter.file_id);
    out.file_name = file.getName();
    out.content = file.getBlob().getDataAsString("UTF-8");
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents || "{}");
  const personaFolder = (data.persona_folder || "").trim();
  let folder;
  if (personaFolder) {
    folder = resolvePersonaWorkspaceFolder(personaFolder);
  } else {
    const targetFolder = (data.target_folder === "sources") ? SOURCES_FOLDER_NAME : VAULT_FOLDER_NAME;
    folder = getOrCreateFolder(targetFolder);
  }
  const fname = (data.file_name || ("Session_" + new Date().getTime() + ".json"));
  const contentStr = (typeof data.payload === "string") ? data.payload : JSON.stringify(data.payload || data, null, 2);

  // تحديث الملف إن كان موجوداً بنفس الاسم (مثل PERSONA_CAPSULE_HUB.json) أو إنشاء ملف جديد
  const existing = folder.getFilesByName(fname);
  let file;
  if (existing.hasNext() && (fname.indexOf("PERSONA_CAPSULE_HUB.json") !== -1 || data.overwrite === true)) {
    file = existing.next();
    file.setContent(contentStr);
  } else {
    file = folder.createFile(fname, contentStr, MimeType.PLAIN_TEXT);
  }
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    file_id: file.getId(),
    file_name: file.getName(),
    persona_folder: personaFolder
  })).setMimeType(ContentService.MimeType.JSON);
}
