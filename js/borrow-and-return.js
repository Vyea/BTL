const BOOKS_KEY = "thuVienBooks";
const RECORDS_KEY = "thuVienBorrowRecords";
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

function readSharedData() {
    if (window.name.startsWith(SHARED_PREFIX)) {
        try {
            return JSON.parse(window.name.substring(SHARED_PREFIX.length));
        } catch (error) {
        }
    }
    const params = new URLSearchParams(window.location.search);
    const urlData = params.get("data");
    if (urlData) {
        try {
            return JSON.parse(urlData);
        } catch (error) {
        }
    }
    return null;
}

function loadBooks() {
    const sharedData = readSharedData();
    if (sharedData && Array.isArray(sharedData.books)) {
        return sharedData.books;
    }
    const savedBooks = localStorage.getItem(BOOKS_KEY);
    if (savedBooks) {
        try {
            return JSON.parse(savedBooks);
        } catch (error) {
        }
    }
    return defaultBooks.map(function(book) { return { ...book }; });
}

function loadBorrowRecords() {
    const sharedData = readSharedData();
    if (sharedData && Array.isArray(sharedData.records)) {
        return sharedData.records;
    }
    const savedRecords = localStorage.getItem(RECORDS_KEY);
    if (savedRecords) {
        try {
            return JSON.parse(savedRecords);
        } catch (error) {
        }
    }
    return [];
}
let books = loadBooks();
let borrowRecords = loadBorrowRecords();

function saveData() {
    localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
    localStorage.setItem(RECORDS_KEY, JSON.stringify(borrowRecords));
    window.name = SHARED_PREFIX + JSON.stringify({
        books: books,
        records: borrowRecords
    });
}
function findBookByName(name) {
    const wantedName = name.trim().toLowerCase();
    return books.find(function(book) {
        return book.title.trim().toLowerCase() === wantedName;
    });
}
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
    cell.textContent = value;
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
borrowForm.addEventListener("submit", addBorrowRecord);
dueDateInput.addEventListener("input", function() {
    dueDateInput.setCustomValidity("");
});
window.addEventListener("storage", function() {
    books = loadBooks();
    borrowRecords = loadBorrowRecords();
    renderBorrowRecords();
});

const navigationLinks = document.querySelectorAll(".nav-link");
navigationLinks.forEach(function(link) {
    link.addEventListener("click", function(event) {
        event.preventDefault();
        const nextPage = new URL(link.href);
        nextPage.searchParams.set("data", JSON.stringify({
            books: books,
            records: borrowRecords
        }));
        window.location.href = nextPage.href;
    });
});
setBorrowDateToToday();
saveData();
renderBorrowRecords();
