const ROLE_KEY = "thuVienRole";
const USER_KEY = "thuVienUserId";
const BOOKS_KEY = "thuVienBooks";
const RECORDS_KEY = "thuVienBorrowRecordsByUser";
const OLD_RECORDS_KEY = "thuVienBorrowRecords";
const SHARED_PREFIX = "THU_VIEN_DATA:";
const SHARED_DATA_KEY = "thuVienSharedData";
function readNameData() {
    if (!window.name.startsWith(SHARED_PREFIX)) return {};
    try {
        return JSON.parse(window.name.substring(SHARED_PREFIX.length));
    } catch (error) {
        return {};
    }
}
function readUrlData() {
    const text = new URLSearchParams(window.location.search).get("data");
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch (error) {
        return null;
    }
}
function readSaved(key) {
    try {
        return JSON.parse(localStorage.getItem(key));
    } catch (error) {
        return null;
    }
}
function mergeRecordLists(oldList, newList) {
    const result = Array.isArray(oldList) ? oldList.slice() : [];
    if (!Array.isArray(newList)) return result;
    for (let i = 0; i < newList.length; i++) {
        const newRecord = newList[i];
        const newId = newRecord.id !== undefined
            ? String(newRecord.id)
            : [newRecord.studentId, newRecord.bookTitle, newRecord.borrowDate, newRecord.dueDate].join("|");
        let foundIndex = -1;
        for (let j = 0; j < result.length; j++) {
            const oldRecord = result[j];
            const oldId = oldRecord.id !== undefined
                ? String(oldRecord.id)
                : [oldRecord.studentId, oldRecord.bookTitle, oldRecord.borrowDate, oldRecord.dueDate].join("|");
            if (oldId === newId) {
                foundIndex = j;
                break;
            }
        }
        if (foundIndex === -1) {
            result.push(newRecord);
        } else {
            const oldRecord = result[foundIndex];
            const oldTime = Number(oldRecord.updatedAt || 0);
            const newTime = Number(newRecord.updatedAt || 0);
            if (newTime >= oldTime) result[foundIndex] = newRecord;
        }
    }
    return result;
}
function mergeRecordMaps(targetMap, sourceMap) {
    if (!sourceMap || typeof sourceMap !== "object" || Array.isArray(sourceMap)) return targetMap;
    Object.keys(sourceMap).forEach(function(userKey) {
        targetMap[userKey] = mergeRecordLists(targetMap[userKey], sourceMap[userKey]);
    });
    return targetMap;
}
function syncBookStatusesWithRecords(data) {
    if (!Array.isArray(data.books) || !data.recordsByUser) return data;
    const titleStatus = {};
    Object.keys(data.recordsByUser).forEach(function(userKey) {
        const records = data.recordsByUser[userKey];
        if (!Array.isArray(records)) return;
        records.forEach(function(record) {
            const title = String(record.bookTitle || "").trim().toLowerCase();
            if (!title) return;
            if (!titleStatus[title]) titleStatus[title] = { found: false, borrowed: false };
            titleStatus[title].found = true;
            if (record.status === "Đang mượn") titleStatus[title].borrowed = true;
        });
    });
    data.books.forEach(function(book) {
        const title = String(book.title || "").trim().toLowerCase();
        const status = titleStatus[title];
        if (!status) return;
        book.status = status.borrowed ? "Đang mượn" : "Còn sách";
    });
    return data;
}
function readSharedData() {
    const candidates = [];
    const urlData = readUrlData();
    const nameData = readNameData();
    const savedData = readSaved(SHARED_DATA_KEY);
    if (urlData && typeof urlData === "object") candidates.push({ data: urlData, priority: 1 });
    if (nameData && Object.keys(nameData).length > 0) candidates.push({ data: nameData, priority: 2 });
    if (savedData && typeof savedData === "object") candidates.push({ data: savedData, priority: 3 });
    const legacyData = {};
    const savedBooks = readSaved(BOOKS_KEY);
    const savedMap = readSaved(RECORDS_KEY);
    const oldRecords = readSaved("thuVienBorrowRecords");
    if (Array.isArray(savedBooks)) legacyData.books = savedBooks;
    if (savedMap && typeof savedMap === "object" && !Array.isArray(savedMap)) legacyData.recordsByUser = savedMap;
    if (Array.isArray(oldRecords)) legacyData.records = oldRecords;
    if (Object.keys(legacyData).length > 0) candidates.push({ data: legacyData, priority: 4 });
    candidates.sort(function(a, b) {
        const timeDifference = Number(a.data.updatedAt || 0) - Number(b.data.updatedAt || 0);
        return timeDifference === 0 ? a.priority - b.priority : timeDifference;
    });
    const result = {};
    let hasBooks = false;
    let hasRecordsMap = false;
    candidates.forEach(function(candidate) {
        const data = candidate.data;
        if (Array.isArray(data.books)) {
            result.books = data.books;
            hasBooks = true;
        }
        if (data.recordsByUser && typeof data.recordsByUser === "object" && !Array.isArray(data.recordsByUser)) {
            if (!result.recordsByUser) result.recordsByUser = {};
            mergeRecordMaps(result.recordsByUser, data.recordsByUser);
            hasRecordsMap = true;
        }
        if (Array.isArray(data.records)) {
            if (!result.recordsByUser) result.recordsByUser = {};
            const oldRole = data.role || "reader";
            const oldUser = String(data.userId || (oldRole === "admin" ? "admin" : "reader")).toLowerCase();
            const oldKey = oldRole + ":" + oldUser;
            result.recordsByUser[oldKey] = mergeRecordLists(result.recordsByUser[oldKey], data.records);
            hasRecordsMap = true;
        }
        Object.keys(data).forEach(function(key) {
            if (key === "books" || key === "recordsByUser" || key === "records") return;
            result[key] = data[key];
        });
    });
    if (!hasBooks) delete result.books;
    if (!hasRecordsMap) delete result.recordsByUser;
    syncBookStatusesWithRecords(result);
    return result;
}
function persistSharedData(data) {
    if (!data.recordsByUser || typeof data.recordsByUser !== "object" || Array.isArray(data.recordsByUser)) {
        data.recordsByUser = {};
    }
    syncBookStatusesWithRecords(data);
    data.updatedAt = Date.now();
    try { localStorage.setItem(SHARED_DATA_KEY, JSON.stringify(data)); } catch (error) {}
    if (Array.isArray(data.books)) {
        try { localStorage.setItem(BOOKS_KEY, JSON.stringify(data.books)); } catch (error) {}
    }
    try { localStorage.setItem(RECORDS_KEY, JSON.stringify(data.recordsByUser)); } catch (error) {}
    window.name = SHARED_PREFIX + JSON.stringify(data);
    return data;
}
function setRole(role, userId) {
    const sharedData = readSharedData() || {};
    const cleanUserId = String(userId || (role === "admin" ? "admin" : "reader")).trim().toLowerCase();
    if (!Array.isArray(sharedData.books)) {
        const savedBooks = readSaved(BOOKS_KEY);
        if (Array.isArray(savedBooks)) sharedData.books = savedBooks;
    }
    if (!sharedData.recordsByUser || typeof sharedData.recordsByUser !== "object" || Array.isArray(sharedData.recordsByUser)) {
        sharedData.recordsByUser = {};
    }
    mergeRecordMaps(sharedData.recordsByUser, readSaved(RECORDS_KEY));
    if (Array.isArray(sharedData.records)) {
        const oldRole = sharedData.role || role;
        const oldUserId = String(sharedData.userId || cleanUserId).trim().toLowerCase();
        const oldKey = oldRole + ":" + oldUserId;
        sharedData.recordsByUser[oldKey] = mergeRecordLists(sharedData.recordsByUser[oldKey], sharedData.records);
        delete sharedData.records;
    }
    const currentKey = role + ":" + cleanUserId;
    if (!Array.isArray(sharedData.recordsByUser[currentKey])) {
        const oldRecords = readSaved(OLD_RECORDS_KEY);
        sharedData.recordsByUser[currentKey] = Array.isArray(oldRecords) ? oldRecords : [];
    }
    sharedData.role = role;
    sharedData.userId = cleanUserId;
    syncBookStatusesWithRecords(sharedData);
    persistSharedData(sharedData);
    try { sessionStorage.setItem(ROLE_KEY, role); } catch (error) {}
    try { localStorage.setItem(ROLE_KEY, role); } catch (error) {}
    try { sessionStorage.setItem(USER_KEY, cleanUserId); } catch (error) {}
    try { localStorage.setItem(USER_KEY, cleanUserId); } catch (error) {}
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
