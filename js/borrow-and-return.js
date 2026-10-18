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
    if (className) {
        cell.className = className;
    }
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
    const book = findBookByTitle(bookName);
    if (!book) {
        alert("Sách không có trong thư viện");
        return;
    }
    if (book.status === "Đang mượn") {
        alert("Sách này đang được mượn, vui lòng chọn sách khác.");
        return;
    }
    book.status = "Đang mượn";
    saveBooks();
    const emptyRow = document.getElementById("emptyRow");
    if (emptyRow) {
        emptyRow.remove();
    }
    const row = document.createElement("tr");
    appendTextCell(row, studentId, "cell-strong");
    appendTextCell(row, book.title, "cell-strong");
    appendTextCell(row, borrowDate, "date-cell");
    appendTextCell(row, dueDate, "date-cell");
    const statusCell = document.createElement("td");
    statusCell.className = "status-cell";
    statusCell.appendChild(createStatusBadge("Đang mượn", "borrowing"));
    row.appendChild(statusCell);
    const actionCell = document.createElement("td");
    const returnButton = document.createElement("button");
    returnButton.type = "button";
    returnButton.className = "action-button return-button";
    returnButton.textContent = "Đã trả";
    returnButton.addEventListener("click", function() {
        returnBook(row, book.title, returnButton);
    });
    actionCell.appendChild(returnButton);
    row.appendChild(actionCell);
    tableBody.prepend(row);
    borrowForm.reset();
    setBorrowDateToToday();
}
function returnBook(row, bookTitle, button) {
    const book = findBookByTitle(bookTitle);
    if (book) {
        book.status = "Còn sách";
        saveBooks();
    }
    const statusCell = row.querySelector(".status-cell");
    statusCell.replaceChildren(createStatusBadge("Đã trả", "returned"));
    button.disabled = true;
    button.textContent = "Đã hoàn tất";
    button.classList.add("is-complete");
}
borrowForm.addEventListener("submit", addBorrowRecord);
dueDateInput.addEventListener("input", function() {
    dueDateInput.setCustomValidity("");
});
setBorrowDateToToday();
