const BOOKS_KEY = "thuVienBooks";
const RECORDS_KEY = "thuVienBorrowRecords";
const SHARED_PREFIX = "THU_VIEN_DATA:";
const ROLE_KEY = "thuVienRole";
const STATUS_AVAILABLE = "Còn sách";
const STATUS_BORROWED = "Đang mượn";
const FIELDS = ["title", "author", "category", "publisher", "year", "shelf", "description"];
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
    try { return JSON.parse(window.name.substring(SHARED_PREFIX.length)); } catch (error) { return {}; }
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
    try { return JSON.parse(localStorage.getItem(key)); } catch (error) { return null; }
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
function loadBooks() {
    const shared = readSharedData();
    if (shared && Array.isArray(shared.books)) return shared.books;
    const saved = readSaved(BOOKS_KEY);
    if (Array.isArray(saved)) return saved;
    return defaultBooks.map(function(book) { return { ...book }; });
}
function loadBorrowRecords() {
    const shared = readSharedData();
    if (shared && Array.isArray(shared.records)) return shared.records;
    const saved = readSaved(RECORDS_KEY);
    return Array.isArray(saved) ? saved : [];
}
let books = loadBooks();
let borrowRecords = loadBorrowRecords();
let editingBook = null;
let toastTimer = null;
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
function checkAdmin() {
    if (getCurrentRole() !== "admin") {
        alert("Bạn cần đăng nhập bằng tài khoản admin để vào trang này.");
        window.location.href = "index.html";
        return false;
    }
    return true;
}
const $ = function(id) { return document.getElementById(id); };
const bookGrid = $("bookGrid");
const overlay = $("overlay");
const bookForm = $("bookForm");
const formMessage = $("formMessage");
const searchInput = $("searchInput");
const statusFilter = $("statusFilter");
const categoryFilter = $("categoryFilter");
const sortSelect = $("sortSelect");
function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}
function showToast(text, type) {
    const toast = $("toast");
    toast.textContent = text;
    toast.className = "toast" + (type ? " " + type : "");
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function() { toast.hidden = true; }, 3000);
}

function coverIndex(category) {
    let sum = 0;
    for (let i = 0; i < category.length; i++) sum += category.charCodeAt(i);
    return sum % 5;
}

function getShownBooks() {
    const keyword = searchInput.value.toLowerCase().trim();
    const list = books.filter(function(book) {
        const text = [book.title, book.author, book.category, book.publisher || ""].join(" ").toLowerCase();
        return text.includes(keyword) &&
            (statusFilter.value === "" || book.status === statusFilter.value) &&
            (categoryFilter.value === "" || book.category === categoryFilter.value);
    });
    if (sortSelect.value === "new") return list.reverse();
    list.sort(function(a, b) { return a.title.localeCompare(b.title, "vi"); });
    if (sortSelect.value === "za") list.reverse();
    return list;
}

function renderCategories() {
    const current = categoryFilter.value;
    const names = [];
    books.forEach(function(book) { if (names.indexOf(book.category) === -1) names.push(book.category); });
    names.sort(function(a, b) { return a.localeCompare(b, "vi"); });
    categoryFilter.innerHTML = "";
    const all = el("option", "", "Mọi thể loại");
    all.value = "";
    categoryFilter.appendChild(all);
    $("categoryList").innerHTML = "";
    names.forEach(function(name) {
        const option = el("option", "", name);
        option.value = name;
        categoryFilter.appendChild(option);
        const hint = document.createElement("option");
        hint.value = name;
        $("categoryList").appendChild(hint);
    });
    categoryFilter.value = names.indexOf(current) === -1 ? "" : current;
}

function createCard(book) {
    const card = el("article", "book-card");
    const cover = el("div", "book-cover cover-" + coverIndex(book.category));
    cover.appendChild(el("span", "cover-title", book.title));
    cover.appendChild(el("span", "cover-author", book.author));
    const info = el("div", "book-info");
    info.appendChild(el("h3", "book-name", book.title));
    info.appendChild(el("p", "book-meta", book.author));
    const detail = [book.category, book.publisher, book.year].filter(Boolean).join(" · ");
    info.appendChild(el("p", "book-meta", detail));
    if (book.shelf) info.appendChild(el("p", "book-meta", "Kệ: " + book.shelf));
    info.appendChild(el("span", "book-status" + (book.status === STATUS_AVAILABLE ? "" : " unavailable"), book.status));
    const actions = el("div", "card-actions");
    const editButton = el("button", "action-button edit-button", "Sửa");
    editButton.type = "button";
    editButton.addEventListener("click", function() { openForm(book); });
    const deleteButton = el("button", "action-button delete-button", "Xóa");
    deleteButton.type = "button";
    deleteButton.addEventListener("click", function() { deleteBook(book); });
    actions.appendChild(editButton);
    actions.appendChild(deleteButton);
    info.appendChild(actions);
    card.appendChild(cover);
    card.appendChild(info);
    return card;
}

function render() {
    renderCategories();
    const shown = getShownBooks();
    $("totalBooks").textContent = books.length;
    $("availableBooks").textContent = books.filter(function(b) { return b.status === STATUS_AVAILABLE; }).length;
    $("borrowedBooks").textContent = books.filter(function(b) { return b.status === STATUS_BORROWED; }).length;
    $("resultCount").textContent = "Hiển thị " + shown.length + " / " + books.length + " cuốn sách";
    bookGrid.innerHTML = "";
    if (shown.length === 0) {
        bookGrid.appendChild(el("p", "empty-state", books.length === 0 ? "Chưa có sách nào. Bấm \"+ Thêm sách\" để bắt đầu." : "Không tìm thấy sách phù hợp."));
    }
    shown.forEach(function(book) { bookGrid.appendChild(createCard(book)); });
}

function openForm(book) {
    editingBook = book || null;
    FIELDS.forEach(function(name) { $("field-" + name).value = book && book[name] ? book[name] : ""; });
    $("formTitle").textContent = book ? "Sửa thông tin sách" : "Thêm sách mới";
    $("saveButton").textContent = book ? "Lưu thay đổi" : "Thêm sách";
    formMessage.textContent = "";
    overlay.hidden = false;
    $("field-title").focus();
}

function closeForm() {
    overlay.hidden = true;
    editingBook = null;
}

function validate(values) {
    if (values.title === "" || values.author === "" || values.category === "") {
        return "Vui lòng nhập đầy đủ tên sách, tác giả và thể loại.";
    }
    if (values.title.length > 150 || values.author.length > 80 || values.category.length > 80 || values.publisher.length > 80 || values.shelf.length > 40) {
        return "Có ô nhập quá dài, vui lòng rút gọn.";
    }
    if (values.description.length > 500) return "Mô tả không được dài quá 500 ký tự.";
    if (values.year !== "" && (!/^[0-9]{4}$/.test(values.year) || Number(values.year) < 1000 || Number(values.year) > new Date().getFullYear())) {
        return "Năm xuất bản phải gồm 4 chữ số và không lớn hơn năm hiện tại.";
    }
    for (let i = 0; i < books.length; i++) {
        if (books[i] !== editingBook && books[i].title.toLowerCase() === values.title.toLowerCase()) {
            return "Sách này đã có trong thư viện.";
        }
    }
    return "";
}

function renameInRecords(oldTitle, newTitle) {
    borrowRecords.forEach(function(record) {
        if (record.bookTitle === oldTitle) record.bookTitle = newTitle;
    });
}

function deleteBook(book) {
    if (book.status === STATUS_BORROWED) {
        showToast("Không thể xóa \"" + book.title + "\" vì sách đang được mượn.", "error");
        return;
    }
    if (!confirm("Bạn có chắc muốn xóa sách \"" + book.title + "\" không?")) return;
    books.splice(books.indexOf(book), 1);
    saveData();
    render();
    showToast("Đã xóa sách \"" + book.title + "\".");
}

bookForm.addEventListener("submit", function(event) {
    event.preventDefault();
    const values = {};
    FIELDS.forEach(function(name) { values[name] = $("field-" + name).value.trim(); });
    const error = validate(values);
    if (error !== "") {
        formMessage.textContent = error;
        return;
    }
    if (editingBook) {
        const oldTitle = editingBook.title;
        Object.assign(editingBook, values);
        renameInRecords(oldTitle, values.title);
        showToast("Đã cập nhật sách \"" + values.title + "\".");
    } else {
        books.push({ ...values, status: STATUS_AVAILABLE });
        showToast("Đã thêm sách \"" + values.title + "\".");
    }
    saveData();
    closeForm();
    render();
});
$("addButton").addEventListener("click", function() { openForm(null); });
$("closeButton").addEventListener("click", closeForm);
$("cancelButton").addEventListener("click", closeForm);
overlay.addEventListener("click", function(event) { if (event.target === overlay) closeForm(); });
document.addEventListener("keydown", function(event) { if (event.key === "Escape" && !overlay.hidden) closeForm(); });
[searchInput, statusFilter, categoryFilter, sortSelect].forEach(function(control) {
    control.addEventListener("input", render);
});
document.querySelectorAll(".nav-link").forEach(function(link) {
    link.addEventListener("click", function(event) {
        event.preventDefault();
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
    render();
});
if (checkAdmin()) {
    saveData();
    render();
}
