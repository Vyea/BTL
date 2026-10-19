const BOOKS_KEY = "thuVienBooks";
const RECORDS_KEY = "thuVienBorrowRecordsByUser";
const ROLE_KEY = "thuVienRole";
const USER_KEY = "thuVienUserId";
const SHARED_PREFIX = "THU_VIEN_DATA:";
const SHARED_DATA_KEY = "thuVienSharedData";
const defaultBooks = [
    { title: "Dáº¿ MÃ¨n phiÃªu lÆ°u kÃ½", author: "TÃ´ HoÃ i", category: "VÄƒn há»c", status: "CÃ²n sÃ¡ch" },
    { title: "LÃ£o Háº¡c", author: "Nam Cao", category: "Truyá»‡n ngáº¯n", status: "CÃ²n sÃ¡ch" },
    { title: "Cho tÃ´i xin má»™t vÃ© Ä‘i tuá»•i thÆ¡", author: "Nguyá»…n Nháº­t Ãnh", category: "VÄƒn há»c", status: "CÃ²n sÃ¡ch" },
    { title: "Clean Code", author: "Robert C. Martin", category: "CÃ´ng nghá»‡ thÃ´ng tin", status: "CÃ²n sÃ¡ch" },
    { title: "Láº­p trÃ¬nh Java cÆ¡ báº£n", author: "Nguyá»…n VÄƒn A", category: "CÃ´ng nghá»‡ thÃ´ng tin", status: "CÃ²n sÃ¡ch" },
    { title: "Äáº¯c nhÃ¢n tÃ¢m", author: "Dale Carnegie", category: "Ká»¹ nÄƒng sá»‘ng", status: "CÃ²n sÃ¡ch" },
    { title: "NhÃ  giáº£ kim", author: "Paulo Coelho", category: "Tiá»ƒu thuyáº¿t", status: "CÃ²n sÃ¡ch" },
    { title: "Tuá»•i tráº» Ä‘Ã¡ng giÃ¡ bao nhiÃªu", author: "Rosie Nguyá»…n", category: "Ká»¹ nÄƒng sá»‘ng", status: "CÃ²n sÃ¡ch" },
    { title: "Harry Potter vÃ  HÃ²n Ä‘Ã¡ PhÃ¹ thá»§y", author: "J. K. Rowling", category: "Fantasy", status: "CÃ²n sÃ¡ch" },
    { title: "TÃ´i tháº¥y hoa vÃ ng trÃªn cá» xanh", author: "Nguyá»…n Nháº­t Ãnh", category: "VÄƒn há»c", status: "CÃ²n sÃ¡ch" },
    { title: "Láº­p trÃ¬nh Python cÆ¡ báº£n", author: "Nguyá»…n VÄƒn B", category: "CÃ´ng nghá»‡ thÃ´ng tin", status: "CÃ²n sÃ¡ch" },
    { title: "Sá»‘ Ä‘á»", author: "VÅ© Trá»ng Phá»¥ng", category: "VÄƒn há»c", status: "CÃ²n sÃ¡ch" }
];
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
            if (record.status === "Äang mÆ°á»£n") titleStatus[title].borrowed = true;
        });
    });
    data.books.forEach(function(book) {
        const title = String(book.title || "").trim().toLowerCase();
        const status = titleStatus[title];
        if (!status) return;
        book.status = status.borrowed ? "Äang mÆ°á»£n" : "CÃ²n sÃ¡ch";
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
function getCurrentRole() {
    const params = new URLSearchParams(window.location.search);
    const urlRole = params.get("role");
    if (urlRole === "admin" || urlRole === "reader") return urlRole;
    const urlData = readUrlData();
    if (urlData && (urlData.role === "admin" || urlData.role === "reader")) return urlData.role;
    const nameRole = readNameData().role;
    if (nameRole === "admin" || nameRole === "reader") return nameRole;
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
    const nameUser = readNameData().userId;
    if (nameUser) return String(nameUser).trim().toLowerCase();
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
    if (sharedData && Array.isArray(sharedData.books)) return sharedData.books;
    const savedBooks = readSaved(BOOKS_KEY);
    if (Array.isArray(savedBooks)) return savedBooks;
    return defaultBooks.map(function(book) { return { ...book }; });
}
function loadRecordsMap() {
    const sharedData = readSharedData() || {};
    if (sharedData.recordsByUser && typeof sharedData.recordsByUser === "object" && !Array.isArray(sharedData.recordsByUser)) {
        return sharedData.recordsByUser;
    }
    const savedMap = readSaved(RECORDS_KEY);
    if (savedMap && typeof savedMap === "object" && !Array.isArray(savedMap)) return savedMap;
    const oldRecords = Array.isArray(sharedData.records) ? sharedData.records : readSaved("thuVienBorrowRecords");
    const recordsMap = {};
    if (Array.isArray(oldRecords)) recordsMap[getCurrentUserKey()] = oldRecords;
    return recordsMap;
}
let recordsByUser = loadRecordsMap();
function loadBorrowRecords() {
    const userKey = getCurrentUserKey();
    if (!Array.isArray(recordsByUser[userKey])) recordsByUser[userKey] = [];
    return recordsByUser[userKey];
}
function makeSharedData() {
    const sharedData = readSharedData() || readNameData() || {};
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
function saveData() {
    recordsByUser[getCurrentUserKey()] = borrowRecords;
    const sharedData = makeSharedData();
    persistSharedData(sharedData);
    updateCurrentUrl(sharedData);
}
function clearLoginRole() {
    try { sessionStorage.removeItem(ROLE_KEY); } catch (error) {}
    try { localStorage.removeItem(ROLE_KEY); } catch (error) {}
    try { sessionStorage.removeItem(USER_KEY); } catch (error) {}
    try { localStorage.removeItem(USER_KEY); } catch (error) {}
    const sharedData = makeSharedData();
    sharedData.role = "";
    sharedData.userId = "";
    persistSharedData(sharedData);
    updateCurrentUrl(sharedData);
}
function findBookByName(name) {
    const wantedName = name.trim().toLowerCase();
    return books.find(function(book) {
        return book.title.trim().toLowerCase() === wantedName;
    });
}
let books = loadBooks();
let borrowRecords = loadBorrowRecords();
const searchInput = document.getElementById("searchInput");
const bookList = document.getElementById("bookList");
const resultCount = document.getElementById("resultCount");
const noResult = document.getElementById("noResult");
const totalBooks = document.getElementById("totalBooks");
const availableBooks = document.getElementById("availableBooks");
const borrowedBooks = document.getElementById("borrowedBooks");
function displayBooks(bookArray) {
    bookList.innerHTML = "";
    resultCount.textContent = "TÃ¬m tháº¥y " + bookArray.length + " cuá»‘n sÃ¡ch";
    noResult.hidden = bookArray.length !== 0;
    totalBooks.textContent = books.length;
    availableBooks.textContent = books.filter(function(book) {
        return book.status === "CÃ²n sÃ¡ch";
    }).length;
    borrowedBooks.textContent = books.filter(function(book) {
        return book.status === "Äang mÆ°á»£n";
    }).length;
    for (let i = 0; i < bookArray.length; i++) {
        const book = bookArray[i];
        const card = document.createElement("div");
        card.className = "book-card";
        const title = document.createElement("h3");
        title.textContent = book.title;
        const author = document.createElement("p");
        author.textContent = "TÃ¡c giáº£: " + book.author;
        const category = document.createElement("p");
        category.textContent = "Thá»ƒ loáº¡i: " + book.category;
        const status = document.createElement("span");
        status.className = "book-status";
        status.textContent = book.status;
        if (book.status !== "CÃ²n sÃ¡ch") status.className += " unavailable";
        card.appendChild(title);
        card.appendChild(author);
        card.appendChild(category);
        card.appendChild(status);
        bookList.appendChild(card);
    }
}
function searchBooks() {
    const keyword = searchInput.value.toLowerCase().trim();
    const filteredBooks = books.filter(function(book) {
        return book.title.toLowerCase().includes(keyword) ||
            book.author.toLowerCase().includes(keyword) ||
            book.category.toLowerCase().includes(keyword);
    });
    displayBooks(filteredBooks);
}
function addAdminLinkIfNeeded() {
    if (getCurrentRole() !== "admin") return;
    const nav = document.querySelector(".sidebar nav");
    if (!nav || nav.querySelector('a[href="admin.html"]')) return;
    const adminLink = document.createElement("a");
    adminLink.href = "admin.html";
    adminLink.className = "nav-link";
    adminLink.textContent = "Quáº£n lÃ½ Ä‘áº§u sÃ¡ch";
    nav.appendChild(adminLink);
}
function goToPage(link) {
    saveData();
    const nextPage = new URL(link.href, window.location.href);
    const sharedData = makeSharedData();
    if (link.classList.contains("logout-link")) {
        sharedData.role = "";
        sharedData.userId = "";
        clearLoginRole();
        nextPage.search = "";
        nextPage.searchParams.set("data", JSON.stringify(readNameData()));
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
    searchBooks();
});
searchInput.addEventListener("input", searchBooks);
addAdminLinkIfNeeded();
document.querySelectorAll(".nav-link").forEach(function(link) {
    link.addEventListener("click", function(event) {
        event.preventDefault();
        goToPage(link);
    });
});
saveData();
searchBooks();
