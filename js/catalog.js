const BOOKS_KEY = "thuVienBooks";
const RECORDS_KEY = "thuVienBorrowRecordsByUser";
const ROLE_KEY = "thuVienRole";
const USER_KEY = "thuVienUserId";
const SHARED_PREFIX = "THU_VIEN_DATA:";
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
function readSharedData() {
    const urlData = readUrlData();
    if (urlData && (Array.isArray(urlData.books) || Array.isArray(urlData.records) || urlData.recordsByUser || urlData.role || urlData.userId)) {
        return urlData;
    }
    const nameData = readNameData();
    if (Array.isArray(nameData.books) || Array.isArray(nameData.records) || nameData.recordsByUser || nameData.role || nameData.userId) {
        return nameData;
    }
    return null;
}
function readSaved(key) {
    try {
        return JSON.parse(localStorage.getItem(key));
    } catch (error) {
        return null;
    }
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
    try { localStorage.setItem(BOOKS_KEY, JSON.stringify(books)); } catch (error) {}
    try { localStorage.setItem(RECORDS_KEY, JSON.stringify(recordsByUser)); } catch (error) {}
    window.name = SHARED_PREFIX + JSON.stringify(sharedData);
    updateCurrentUrl(sharedData);
}
function clearLoginRole() {
    try { sessionStorage.removeItem(ROLE_KEY); } catch (error) {}
    try { localStorage.removeItem(ROLE_KEY); } catch (error) {}
    try { sessionStorage.removeItem(USER_KEY); } catch (error) {}
    try { localStorage.removeItem(USER_KEY); } catch (error) {}
    const sharedData = makeSharedData();
    delete sharedData.role;
    delete sharedData.userId;
    window.name = SHARED_PREFIX + JSON.stringify(sharedData);
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
    resultCount.textContent = "Tìm thấy " + bookArray.length + " cuốn sách";
    noResult.hidden = bookArray.length !== 0;
    totalBooks.textContent = books.length;
    availableBooks.textContent = books.filter(function(book) {
        return book.status === "Còn sách";
    }).length;
    borrowedBooks.textContent = books.filter(function(book) {
        return book.status === "Đang mượn";
    }).length;
    for (let i = 0; i < bookArray.length; i++) {
        const book = bookArray[i];
        const card = document.createElement("div");
        card.className = "book-card";
        const title = document.createElement("h3");
        title.textContent = book.title;
        const author = document.createElement("p");
        author.textContent = "Tác giả: " + book.author;
        const category = document.createElement("p");
        category.textContent = "Thể loại: " + book.category;
        const status = document.createElement("span");
        status.className = "book-status";
        status.textContent = book.status;
        if (book.status !== "Còn sách") status.className += " unavailable";
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
    adminLink.textContent = "Quản lý đầu sách";
    nav.appendChild(adminLink);
}
function goToPage(link) {
    saveData();
    const nextPage = new URL(link.href, window.location.href);
    const sharedData = makeSharedData();
    if (link.classList.contains("logout-link")) {
        delete sharedData.role;
        delete sharedData.userId;
        clearLoginRole();
        nextPage.search = "";
        nextPage.searchParams.set("data", JSON.stringify(sharedData));
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
