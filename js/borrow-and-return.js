const BOOKS_KEY = "thuVienBooks";
const RECORDS_KEY = "thuVienBorrowRecordsByUser";
const ROLE_KEY = "thuVienRole";
const USER_KEY = "thuVienUserId";
const SHARED_PREFIX = "THU_VIEN_DATA:";
const SHARED_DATA_KEY = "thuVienSharedData";
const defaultBooks = [
    { title: "Dế Mèn phiêu lưu ký", author: "Tô Hoài", category: "Văn học", status: "Còn sách" },
    { title: "Lão Hạc", author: "Nam Cao", category: "Truyện ngắn", status: "Còn sách" },
    { title: "Cho tôi xin một vé đi tuổi thơ", author: "Nguyễn Nhật Ánh", category: "Văn học", status: "Còn sách" },
    { title: "Clean Code", author: "Robert C. Martin", category: "Công nghệ thông tin", status: "Còn sách" },
    { title: "Lập trình Java cơ bản", author: "Nguyễn Văn A", category: "Công nghệ thông tin", status: "Còn sách" },
    { title: "Đắc nhân tâm", author: "Dale Carnegie", category: "Kỹ năng sống", status: "Còn sách" },
    { title: "Nhà giả kim", author: "Paulo Coelho", category: "Tiểu thuyết", status: "Còn sách" },
    { title: "Tuổi trẻ đáng giá bao nhiêu", author: "Rosie Nguyễn", category: "Kỹ năng sống", status: "Còn sách" },
    { title: "Harry Potter và Hòn đá Phù thủy", author: "J. K. Rowling", category: "Fantasy", status: "Còn sách" },
    { title: "Tôi thấy hoa vàng trên cỏ xanh", author: "Nguyễn Nhật Ánh", category: "Văn học", status: "Còn sách" },
    { title: "Lập trình Python cơ bản", author: "Nguyễn Văn B", category: "Công nghệ thông tin", status: "Còn sách" },
    { title: "Số đỏ", author: "Vũ Trọng Phụng", category: "Văn học", status: "Còn sách" }
];
function readNameData() {
    if (!window.name.startsWith(SHARED_PREFIX)) return null;
    try {
        return JSON.parse(window.name.substring(SHARED_PREFIX.length));
    } catch (error) {
        return null;
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
        const text = localStorage.getItem(key);
        return text ? JSON.parse(text) : null;
    } catch (error) {
        return null;
    }
}
function getSharedCandidates() {
    const candidates = [
        readSaved(SHARED_DATA_KEY),
        readNameData(),
        readUrlData()
    ];
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
    if (candidates.length === 0) return null;
    return candidates[candidates.length - 1];
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
                const existingIndex = merged[userKey].findIndex(function(item) {
                    const existingId = item.id !== undefined
                        ? String(item.id)
                        : [item.studentId, item.bookTitle, item.borrowDate].join("|");
                    return existingId === recordId;
                });
                if (existingIndex === -1) {
                    merged[userKey].push(record);
                    return;
                }
                const existing = merged[userKey][existingIndex];
                const existingTime = Number(existing.updatedAt || existing.createdAt || 0);
                const incomingTime = Number(record.updatedAt || record.createdAt || 0);
                if (incomingTime > existingTime ||
                    (incomingTime === existingTime && record.status === "Đã trả" && existing.status !== "Đã trả")) {
                    merged[userKey][existingIndex] = record;
                }
            });
        });
    }
    return merged;
}
function getCurrentRole() {
    const params = new URLSearchParams(window.location.search);
    const urlRole = params.get("role");
    if (urlRole === "admin" || urlRole === "reader") return urlRole;
    const urlData = readUrlData();
    if (urlData && (urlData.role === "admin" || urlData.role === "reader")) return urlData.role;
    const nameRole = (readNameData() || {}).role;
    if (nameRole === "admin" || nameRole === "reader") return nameRole;
    const sharedData = readSharedData();
    if (sharedData && (sharedData.role === "admin" || sharedData.role === "reader")) return sharedData.role;
    try {
        const role = sessionStorage.getItem(ROLE_KEY);
        if (role === "admin" || role === "reader") return role;
    } catch (error) {}
    try {
        const role = localStorage.getItem(ROLE_KEY);
        if (role === "admin" || role === "reader") return role;
    } catch (error) {}
    return "";
}
function getCurrentUserId() {
    const params = new URLSearchParams(window.location.search);
    const urlUser = params.get("user");
    if (urlUser) return urlUser.trim().toLowerCase();
    const urlData = readUrlData();
    if (urlData && urlData.userId) return String(urlData.userId).trim().toLowerCase();
    const nameUser = (readNameData() || {}).userId;
    if (nameUser) return String(nameUser).trim().toLowerCase();
    const sharedData = readSharedData();
    if (sharedData && sharedData.userId) return String(sharedData.userId).trim().toLowerCase();
    try {
        const savedUser = localStorage.getItem(USER_KEY);
        if (savedUser) return savedUser.trim().toLowerCase();
    } catch (error) {}
    return getCurrentRole() === "admin" ? "admin" : (getCurrentRole() === "reader" ? "reader" : "");
}
function getCurrentUserKey() {
    const role = getCurrentRole() || "reader";
    const userId = getCurrentUserId() || (role === "admin" ? "admin" : "reader");
    return role + ":" + userId;
}
function loadBooks() {
    const sharedData = readSharedData();
    if (sharedData && Array.isArray(sharedData.books)) {
        return sharedData.books.map(function(book) { return { ...book }; });
    }
    const savedBooks = readSaved(BOOKS_KEY);
    if (Array.isArray(savedBooks)) return savedBooks;
    return defaultBooks.map(function(book) { return { ...book }; });
}
function loadRecordsMap() {
    const candidates = getSharedCandidates();
    const maps = candidates.map(function(data) { return data.recordsByUser; });
    maps.push(readSaved(RECORDS_KEY));
    const recordsMap = mergeRecordsMaps.apply(null, maps);
    const hasRecords = Object.keys(recordsMap).some(function(userKey) {
        return Array.isArray(recordsMap[userKey]) && recordsMap[userKey].length > 0;
    });
    if (!hasRecords) {
        for (let i = candidates.length - 1; i >= 0; i--) {
            const data = candidates[i];
            if (Array.isArray(data.records)) {
                const role = data.role || getCurrentRole() || "reader";
                const userId = String(data.userId || getCurrentUserId() || (role === "admin" ? "admin" : "reader")).toLowerCase();
                recordsMap[role + ":" + userId] = data.records;
                break;
            }
        }
        if (Object.keys(recordsMap).length === 0) {
            const oldRecords = readSaved("thuVienBorrowRecords");
            if (Array.isArray(oldRecords)) recordsMap[getCurrentUserKey()] = oldRecords;
        }
    }
    return recordsMap;
}
function loadBorrowRecords() {
    const userKey = getCurrentUserKey();
    if (!Array.isArray(recordsByUser[userKey])) recordsByUser[userKey] = [];
    return recordsByUser[userKey];
}
function makeSharedData() {
    const sharedData = readSharedData() || {};
    sharedData.books = books;
    sharedData.recordsByUser = recordsByUser;
    sharedData.recordsByUser[getCurrentUserKey()] = borrowRecords;
    delete sharedData.records;
    const role = getCurrentRole();
    const userId = getCurrentUserId();
    if (role) sharedData.role = role;
    else delete sharedData.role;
    if (userId) sharedData.userId = userId;
    else delete sharedData.userId;
    return sharedData;
}
function syncBookStatuses() {
    const activeLoans = {};
    Object.keys(recordsByUser).forEach(function(userKey) {
        const records = recordsByUser[userKey];
        if (!Array.isArray(records)) return;
        records.forEach(function(record) {
            if (record.status === "Đang mượn" && record.bookTitle) {
                activeLoans[record.bookTitle.trim().toLowerCase()] = true;
            }
        });
    });
    books.forEach(function(book) {
        const title = book.title.trim().toLowerCase();
        book.status = activeLoans[title] ? "Đang mượn" : "Còn sách";
    });
}
function updateCurrentUrl(sharedData) {
    try {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set("data", JSON.stringify(sharedData));
        if (sharedData.role) currentUrl.searchParams.set("role", sharedData.role);
        else currentUrl.searchParams.delete("role");
        if (sharedData.userId) currentUrl.searchParams.set("user", sharedData.userId);
        else currentUrl.searchParams.delete("user");
        window.history.replaceState(null, "", currentUrl.href);
    } catch (error) {
    }
}
function saveSharedData(sharedData) {
    window.name = SHARED_PREFIX + JSON.stringify(sharedData);
    try { localStorage.setItem(SHARED_DATA_KEY, JSON.stringify(sharedData)); } catch (error) {}
}
function saveData() {
    syncBookStatuses();
    recordsByUser[getCurrentUserKey()] = borrowRecords;
    const sharedData = makeSharedData();
    sharedData.savedAt = Date.now();
    try { localStorage.setItem(BOOKS_KEY, JSON.stringify(books)); } catch (error) {}
    try { localStorage.setItem(RECORDS_KEY, JSON.stringify(recordsByUser)); } catch (error) {}
    saveSharedData(sharedData);
    updateCurrentUrl(sharedData);
}
function clearLoginRole(dataToKeep) {
    try { sessionStorage.removeItem(ROLE_KEY); } catch (error) {}
    try { localStorage.removeItem(ROLE_KEY); } catch (error) {}
    try { sessionStorage.removeItem(USER_KEY); } catch (error) {}
    try { localStorage.removeItem(USER_KEY); } catch (error) {}
    const sharedData = dataToKeep || makeSharedData();
    delete sharedData.role;
    delete sharedData.userId;
    sharedData.savedAt = Date.now();
    saveSharedData(sharedData);
    updateCurrentUrl(sharedData);
    return sharedData;
}
function findBookByName(name) {
    const wantedName = name.trim().toLowerCase();
    return books.find(function(book) {
        return book.title.trim().toLowerCase() === wantedName;
    });
}
let books = loadBooks();
let borrowRecords = loadBorrowRecords();
const borrowForm = document.getElementById("borrowForm");
const studentIdInput = document.getElementById("studentId");
const bookNameInput = document.getElementById("bookName");
const borrowDateInput = document.getElementById("borrowDate");
const dueDateInput = document.getElementById("dueDate");
const tableBody = document.getElementById("borrowTableBody");
function setBorrowDateToToday() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    borrowDateInput.value = year + "-" + month + "-" + day;
}
function appendTextCell(row, value, className) {
    const cell = document.createElement("td");
    if (className) cell.className = className;
    cell.textContent = value || "";
    row.appendChild(cell);
    return cell;
}
function createStatusBadge(label, statusClass) {
    const badge = document.createElement("span");
    badge.className = "borrow-status " + statusClass;
    badge.textContent = label;
    return badge;
}
function renderBorrowRecords() {
    tableBody.innerHTML = "";
    if (borrowRecords.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 6;
        cell.className = "empty-row";
        cell.textContent = "Chưa có phiếu mượn nào được lập.";
        row.appendChild(cell);
        tableBody.appendChild(row);
        return;
    }
    for (let i = 0; i < borrowRecords.length; i++) {
        const record = borrowRecords[i];
        const row = document.createElement("tr");
        appendTextCell(row, record.studentId, "cell-strong");
        appendTextCell(row, record.bookTitle, "cell-strong");
        appendTextCell(row, record.borrowDate, "date-cell");
        appendTextCell(row, record.dueDate, "date-cell");
        const statusCell = document.createElement("td");
        statusCell.className = "status-cell";
        if (record.status === "Đang mượn") {
            statusCell.appendChild(createStatusBadge("Đang mượn", "borrowing"));
        } else {
            statusCell.appendChild(createStatusBadge("Đã trả", "returned"));
        }
        row.appendChild(statusCell);
        const actionCell = document.createElement("td");
        const returnButton = document.createElement("button");
        returnButton.type = "button";
        returnButton.className = "action-button return-button";
        if (record.status === "Đang mượn") {
            returnButton.textContent = "Đã trả";
            returnButton.addEventListener("click", function() {
                returnBook(record.id);
            });
        } else {
            returnButton.textContent = "Đã hoàn tất";
            returnButton.disabled = true;
            returnButton.classList.add("is-complete");
        }
        actionCell.appendChild(returnButton);
        row.appendChild(actionCell);
        tableBody.appendChild(row);
    }
}
function addBorrowRecord(event) {
    event.preventDefault();
    const studentId = studentIdInput.value.trim();
    const bookName = bookNameInput.value.trim();
    const borrowDate = borrowDateInput.value;
    const dueDate = dueDateInput.value;
    dueDateInput.setCustomValidity("");
    if (dueDate < borrowDate) {
        dueDateInput.setCustomValidity("Ngày hẹn trả không được trước ngày mượn.");
        dueDateInput.reportValidity();
        return;
    }
    const book = findBookByName(bookName);
    if (!book) {
        alert("Sách không có trong thư viện");
        return;
    }
    if (book.status === "Đang mượn") {
        alert("Sách này đang được mượn, vui lòng chọn sách khác.");
        return;
    }
    book.status = "Đang mượn";
    const record = {
        id: String(Date.now()),
        studentId: studentId,
        bookTitle: book.title,
        borrowDate: borrowDate,
        dueDate: dueDate,
        status: "Đang mượn",
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    borrowRecords.unshift(record);
    saveData();
    renderBorrowRecords();
    borrowForm.reset();
    setBorrowDateToToday();
}
function returnBook(recordId) {
    const record = borrowRecords.find(function(item) {
        return item.id === recordId;
    });
    if (!record || record.status === "Đã trả") return;
    const book = findBookByName(record.bookTitle);
    if (book) book.status = "Còn sách";
    record.status = "Đã trả";
    record.updatedAt = Date.now();
    saveData();
    renderBorrowRecords();
}
function addAdminLinkIfNeeded() {
    if (getCurrentRole() !== "admin") return;
    const nav = document.querySelector(".sidebar nav");
    if (!nav || nav.querySelector('a[href="admin.html"]')) return;
    const adminLink = document.createElement("a");
    adminLink.href = "admin.html";
    adminLink.className = "nav-link";
    adminLink.textContent = "Quản lý đầu sách";
    nav.appendChild(adminLink);
}
function goToPage(link) {
    saveData();
    const nextPage = new URL(link.href, window.location.href);
    const sharedData = makeSharedData();
    if (link.classList.contains("logout-link")) {
        const logoutData = clearLoginRole(sharedData);
        nextPage.search = "";
        nextPage.searchParams.set("data", JSON.stringify(logoutData));
        window.location.href = nextPage.href;
        return;
    }
    const role = getCurrentRole();
    const userId = getCurrentUserId();
    nextPage.searchParams.set("data", JSON.stringify(sharedData));
    if (role) nextPage.searchParams.set("role", role);
    else nextPage.searchParams.delete("role");
    if (userId) nextPage.searchParams.set("user", userId);
    else nextPage.searchParams.delete("user");
    window.location.href = nextPage.href;
}
borrowForm.addEventListener("submit", addBorrowRecord);
dueDateInput.addEventListener("input", function() {
    dueDateInput.setCustomValidity("");
});
addAdminLinkIfNeeded();
document.querySelectorAll(".nav-link").forEach(function(link) {
    link.addEventListener("click", function(event) {
        event.preventDefault();
        goToPage(link);
    });
});
window.addEventListener("storage", function(event) {
    if (event.key !== BOOKS_KEY && event.key !== RECORDS_KEY && event.key !== "thuVienBorrowRecords") return;
    const savedBooks = readSaved(BOOKS_KEY);
    const savedMap = readSaved(RECORDS_KEY);
    if (Array.isArray(savedBooks)) books = savedBooks;
    if (savedMap && typeof savedMap === "object" && !Array.isArray(savedMap)) {
        recordsByUser = savedMap;
        borrowRecords = Array.isArray(recordsByUser[getCurrentUserKey()]) ? recordsByUser[getCurrentUserKey()] : [];
    }
    window.name = SHARED_PREFIX + JSON.stringify(makeSharedData());
    renderBorrowRecords();
});
setBorrowDateToToday();
saveData();
renderBorrowRecords();
