const ROLE_KEY = "thuVienRole";
const USER_KEY = "thuVienUserId";
const BOOKS_KEY = "thuVienBooks";
const RECORDS_KEY = "thuVienBorrowRecordsByUser";
const OLD_RECORDS_KEY = "thuVienBorrowRecords";
const SHARED_PREFIX = "THU_VIEN_DATA:";
const SHARED_DATA_KEY = "thuVienSharedData";
function readNameData() {
    if (!window.name.startsWith(SHARED_PREFIX)) return null;
    try { return JSON.parse(window.name.substring(SHARED_PREFIX.length)); }
    catch (error) { return null; }
}
function readUrlData() {
    const text = new URLSearchParams(window.location.search).get("data");
    if (!text) return null;
    try { return JSON.parse(text); }
    catch (error) { return null; }
}
function readSaved(key) {
    try {
        const text = localStorage.getItem(key);
        return text ? JSON.parse(text) : null;
    } catch (error) { return null; }
}
function getSharedCandidates() {
    const candidates = [readSaved(SHARED_DATA_KEY), readNameData(), readUrlData()];
    const validCandidates = candidates.filter(function(data) {
        return data && typeof data === "object" && !Array.isArray(data);
    });
    validCandidates.sort(function(first, second) {
        return Number(first.savedAt || 0) - Number(second.savedAt || 0);
    });
    return validCandidates;
}
function readSharedData() {
    const candidates = getSharedCandidates();
    return candidates.length ? candidates[candidates.length - 1] : {};
}
function mergeRecordsMaps() {
    const merged = {};
    for (let mapIndex = 0; mapIndex < arguments.length; mapIndex++) {
        const map = arguments[mapIndex];
        if (!map || typeof map !== "object" || Array.isArray(map)) continue;
        Object.keys(map).forEach(function(userKey) {
            if (!Array.isArray(map[userKey])) return;
            if (!Array.isArray(merged[userKey])) merged[userKey] = [];
            map[userKey].forEach(function(record) {
                const recordId = record.id !== undefined
                    ? String(record.id)
                    : [record.studentId, record.bookTitle, record.borrowDate].join("|");
                const index = merged[userKey].findIndex(function(item) {
                    const itemId = item.id !== undefined
                        ? String(item.id)
                        : [item.studentId, item.bookTitle, item.borrowDate].join("|");
                    return itemId === recordId;
                });
                if (index === -1) {
                    merged[userKey].push(record);
                    return;
                }
                const oldRecord = merged[userKey][index];
                const oldTime = Number(oldRecord.updatedAt || oldRecord.createdAt || 0);
                const newTime = Number(record.updatedAt || record.createdAt || 0);
                if (newTime > oldTime ||
                    (newTime === oldTime && record.status === "Đã trả" && oldRecord.status !== "Đã trả")) {
                    merged[userKey][index] = record;
                }
            });
        });
    }
    return merged;
}
function saveSharedData(data) {
    window.name = SHARED_PREFIX + JSON.stringify(data);
    try { localStorage.setItem(SHARED_DATA_KEY, JSON.stringify(data)); } catch (error) {}
}
function syncBookStatuses(data) {
    if (!Array.isArray(data.books)) return;
    const activeLoans = {};
    const recordsByUser = data.recordsByUser || {};
    Object.keys(recordsByUser).forEach(function(userKey) {
        const records = recordsByUser[userKey];
        if (!Array.isArray(records)) return;
        records.forEach(function(record) {
            if (record.status === "Đang mượn" && record.bookTitle) {
                activeLoans[record.bookTitle.trim().toLowerCase()] = true;
            }
        });
    });
    data.books.forEach(function(book) {
        const title = book.title.trim().toLowerCase();
        book.status = activeLoans[title] ? "Đang mượn" : "Còn sách";
    });
}
function setRole(role, userId) {
    const sharedData = readSharedData();
    const cleanUserId = String(userId || (role === "admin" ? "admin" : "reader")).trim().toLowerCase();
    const candidates = getSharedCandidates();
    const maps = candidates.map(function(data) { return data.recordsByUser; });
    maps.push(readSaved(RECORDS_KEY));
    sharedData.recordsByUser = mergeRecordsMaps.apply(null, maps);
    if (Array.isArray(sharedData.records)) {
        const oldRole = sharedData.role || role;
        const oldUserId = String(sharedData.userId || cleanUserId).trim().toLowerCase();
        const oldKey = oldRole + ":" + oldUserId;
        if (!Array.isArray(sharedData.recordsByUser[oldKey])) {
            sharedData.recordsByUser[oldKey] = sharedData.records;
        }
        delete sharedData.records;
    }
    const currentKey = role + ":" + cleanUserId;
    if (!Array.isArray(sharedData.recordsByUser[currentKey])) {
        sharedData.recordsByUser[currentKey] = [];
    }
    if (!Array.isArray(sharedData.books)) {
        const savedBooks = readSaved(BOOKS_KEY);
        if (Array.isArray(savedBooks)) sharedData.books = savedBooks;
    }
    sharedData.role = role;
    sharedData.userId = cleanUserId;
    sharedData.savedAt = Date.now();
    syncBookStatuses(sharedData);
    try { sessionStorage.setItem(ROLE_KEY, role); } catch (error) {}
    try { localStorage.setItem(ROLE_KEY, role); } catch (error) {}
    try { sessionStorage.setItem(USER_KEY, cleanUserId); } catch (error) {}
    try { localStorage.setItem(USER_KEY, cleanUserId); } catch (error) {}
    try { localStorage.setItem(RECORDS_KEY, JSON.stringify(sharedData.recordsByUser)); } catch (error) {}
    if (Array.isArray(sharedData.books)) {
        try { localStorage.setItem(BOOKS_KEY, JSON.stringify(sharedData.books)); } catch (error) {}
    }
    saveSharedData(sharedData);
    return sharedData;
}
document.getElementById("loginForm").addEventListener("submit", function(event) {
    event.preventDefault();
    const user = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value.trim();
    const errorMsg = document.getElementById("errorMsg");
    if (user === "" || pass === "") {
        errorMsg.textContent = "Vui lòng nhập đầy đủ thông tin!";
        return;
    }
    let role = "reader";
    let destination = "catalog.html";
    let accountId = user.toLowerCase();
    if (user === "admin" && pass === "123456") {
        role = "admin";
        destination = "admin.html";
        accountId = "admin";
        alert("Đăng nhập thành công với admin!");
    } else {
        alert("Đăng nhập thành công!");
    }
    const sharedData = setRole(role, accountId);
    const nextPage = new URL(destination, window.location.href);
    nextPage.searchParams.set("role", role);
    nextPage.searchParams.set("user", accountId);
    nextPage.searchParams.set("data", JSON.stringify(sharedData));
    window.location.href = nextPage.href;
});
