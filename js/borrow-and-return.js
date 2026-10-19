const BOOKS_KEY = "thuVienBooks";
const RECORDS_KEY = "thuVienBorrowRecords";
const ROLE_KEY = "thuVienRole";
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
    if (urlData && (Array.isArray(urlData.books) || Array.isArray(urlData.records) || urlData.role)) {
        return urlData;
    }
    const nameData = readNameData();
    if (Array.isArray(nameData.books) || Array.isArray(nameData.records) || nameData.role) {
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
function loadBooks() {
    const sharedData = readSharedData();
    if (sharedData && Array.isArray(sharedData.books)) return sharedData.books;

    const savedBooks = readSaved(BOOKS_KEY);
    if (Array.isArray(savedBooks)) return savedBooks;

    return defaultBooks.map(function(book) { return { ...book }; });
}
function loadBorrowRecords() {
    const sharedData = readSharedData();
    if (sharedData && Array.isArray(sharedData.records)) return sharedData.records;

    const savedRecords = readSaved(RECORDS_KEY);
    return Array.isArray(savedRecords) ? savedRecords : [];
}
function getCurrentRole() {
    const params = new URLSearchParams(window.location.search);
    const urlRole = params.get("role");
    if (urlRole === "admin" || urlRole === "reader") return urlRole;
    const urlData = readUrlData();
    if (urlData && (urlData.role === "admin" || urlData.role === "reader")) {
        return urlData.role;
    }
    try {
        const role = sessionStorage.getItem(ROLE_KEY);
        if (role) return role;
    } catch (error) {}
    try {
        const role = localStorage.getItem(ROLE_KEY);
        if (role) return role;
    } catch (error) {}
    const nameRole = readNameData().role;
    return nameRole === "admin" || nameRole === "reader" ? nameRole : "";
}

function saveData() {
    try { localStorage.setItem(BOOKS_KEY, JSON.stringify(books)); } catch (error) {}
    try { localStorage.setItem(RECORDS_KEY, JSON.stringify(borrowRecords)); } catch (error) {}
    const sharedData = readNameData();
    sharedData.books = books;
    sharedData.records = borrowRecords;
    const role = getCurrentRole();
    if (role) sharedData.role = role;
    else delete sharedData.role;
    window.name = SHARED_PREFIX + JSON.stringify(sharedData);
    updateCurrentUrl(sharedData);
}


function updateCurrentUrl(sharedData) {
    try {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set("data", JSON.stringify(sharedData));
        if (sharedData.role) currentUrl.searchParams.set("role", sharedData.role);
        else currentUrl.searchParams.delete("role");
        window.history.replaceState(null, "", currentUrl.href);
    } catch (error) {
    }
}
function clearLoginRole() {
    try { sessionStorage.removeItem(ROLE_KEY); } catch (error) {}
    try { localStorage.removeItem(ROLE_KEY); } catch (error) {}
    const sharedData = readSharedData() || readNameData();
    delete sharedData.role;
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
        status: "Đang mượn"
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
    if (link.classList.contains("logout-link")) {
        const latestData = { books: books, records: borrowRecords };
        clearLoginRole();
        nextPage.search = "";
        nextPage.searchParams.set("data", JSON.stringify(latestData));
        window.location.href = nextPage.href;
        return;
    }
    const role = getCurrentRole();
    const sharedData = { books: books, records: borrowRecords };
    if (role) sharedData.role = role;
    nextPage.searchParams.set("data", JSON.stringify(sharedData));
    if (role) nextPage.searchParams.set("role", role);
    else nextPage.searchParams.delete("role");
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
    if (event.key !== BOOKS_KEY && event.key !== RECORDS_KEY) return;
    const savedBooks = readSaved(BOOKS_KEY);
    const savedRecords = readSaved(RECORDS_KEY);
    if (Array.isArray(savedBooks)) books = savedBooks;
    if (Array.isArray(savedRecords)) borrowRecords = savedRecords;
    const sharedData = readNameData();
    sharedData.books = books;
    sharedData.records = borrowRecords;
    const role = getCurrentRole();
    if (role) sharedData.role = role;
    else delete sharedData.role;
    window.name = SHARED_PREFIX + JSON.stringify(sharedData);
    renderBorrowRecords();
});
setBorrowDateToToday();
saveData();
renderBorrowRecords();
