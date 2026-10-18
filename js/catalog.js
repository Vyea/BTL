const STORAGE_KEY = "thuVienBooks";
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
    const params = new URLSearchParams(window.location.search);
    const urlData = params.get("data");
    if (urlData) {
        try {
            return JSON.parse(urlData);
        } catch (error) {
        }
    }
    if (window.name.startsWith(SHARED_PREFIX)) {
        try {
            return JSON.parse(window.name.substring(SHARED_PREFIX.length));
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
    const savedBooks = localStorage.getItem(STORAGE_KEY);
    if (savedBooks) {
        try {
            return JSON.parse(savedBooks);
        } catch (error) {
        }
    }
    return defaultBooks.map(function(book) {
        return { ...book };
    });
}
const books = loadBooks();
function saveBooks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    const sharedData = readSharedData() || { records: [] };
    sharedData.books = books;
    window.name = SHARED_PREFIX + JSON.stringify(sharedData);
}
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
        if (book.status !== "Còn sách") {
            status.className += " unavailable";
        }
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
window.addEventListener("storage", function() {
    const latestBooks = loadBooks();
    books.splice(0, books.length);
    latestBooks.forEach(function(book) { books.push(book); });
    searchBooks();
});
searchInput.addEventListener("input", searchBooks);
const navigationLinks = document.querySelectorAll(".nav-link");
navigationLinks.forEach(function(link) {
    link.addEventListener("click", function(event) {
        event.preventDefault();
        const sharedData = readSharedData() || { records: [] };
        sharedData.books = books;
        if (!Array.isArray(sharedData.records)) sharedData.records = [];
        const nextPage = new URL(link.href);
        nextPage.searchParams.set("data", JSON.stringify(sharedData));
        window.location.href = nextPage.href;
    });
});
saveBooks();
displayBooks(books);
