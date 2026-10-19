const ROLE_KEY = "thuVienRole";
const USER_KEY = "thuVienUserId";
const BOOKS_KEY = "thuVienBooks";
const RECORDS_KEY = "thuVienBorrowRecordsByUser";
const OLD_RECORDS_KEY = "thuVienBorrowRecords";
const SHARED_PREFIX = "THU_VIEN_DATA:";
function readNameData() {
    if (!window.name.startsWith(SHARED_PREFIX)) return {};
    try {
        return JSON.parse(window.name.substring(SHARED_PREFIX.length));
    } catch (error) {
        return {};
    }
}
function readSharedData() {
    const text = new URLSearchParams(window.location.search).get("data");
    if (text) {
        try { return JSON.parse(text); } catch (error) {}
    }
    return readNameData();
}
function readSaved(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch (error) { return null; }
}
function setRole(role, userId) {
    const sharedData = readSharedData() || {};
    const cleanUserId = String(userId || (role === "admin" ? "admin" : "reader")).trim().toLowerCase();
    if (!Array.isArray(sharedData.books)) {
        const savedBooks = readSaved(BOOKS_KEY);
        if (Array.isArray(savedBooks)) sharedData.books = savedBooks;
    }
    const savedMap = readSaved(RECORDS_KEY);
    if (!sharedData.recordsByUser || typeof sharedData.recordsByUser !== "object" || Array.isArray(sharedData.recordsByUser)) {
        sharedData.recordsByUser = savedMap && typeof savedMap === "object" && !Array.isArray(savedMap) ? savedMap : {};
    } else if (savedMap && typeof savedMap === "object" && !Array.isArray(savedMap)) {
        Object.keys(savedMap).forEach(function(key) {
            if (!Array.isArray(sharedData.recordsByUser[key])) sharedData.recordsByUser[key] = savedMap[key];
        });
    }
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
        const oldRecords = readSaved(OLD_RECORDS_KEY);
        if (Array.isArray(oldRecords)) sharedData.recordsByUser[currentKey] = oldRecords;
        else sharedData.recordsByUser[currentKey] = [];
    }
    sharedData.role = role;
    sharedData.userId = cleanUserId;
    try { sessionStorage.setItem(ROLE_KEY, role); } catch (error) {}
    try { localStorage.setItem(ROLE_KEY, role); } catch (error) {}
    try { sessionStorage.setItem(USER_KEY, cleanUserId); } catch (error) {}
    try { localStorage.setItem(USER_KEY, cleanUserId); } catch (error) {}
    try { localStorage.setItem(RECORDS_KEY, JSON.stringify(sharedData.recordsByUser)); } catch (error) {}
    if (Array.isArray(sharedData.books)) {
        try { localStorage.setItem(BOOKS_KEY, JSON.stringify(sharedData.books)); } catch (error) {}
    }
    window.name = SHARED_PREFIX + JSON.stringify(sharedData);
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
