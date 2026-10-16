const books = [
    { title: "Dế Mèn phiêu lưu ký", author: "Tô Hoài", category: "Văn học", status: "Còn sách" },
    { title: "Lão Hạc", author: "Nam Cao", category: "Truyện ngắn", status: "Còn sách" },
    { title: "Cho tôi xin một vé đi tuổi thơ", author: "Nguyễn Nhật Ánh", category: "Văn học", status: "Đã được mượn" },
    { title: "Clean Code", author: "Robert C. Martin", category: "Công nghệ thông tin", status: "Còn sách" },
    { title: "Lập trình Java cơ bản", author: "Nguyễn Văn A", category: "Công nghệ thông tin", status: "Còn sách" },
    { title: "Đắc nhân tâm", author: "Dale Carnegie", category: "Kỹ năng sống", status: "Đã được mượn" }
];
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
        return book.status === "Đã được mượn";
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
searchInput.addEventListener("input", searchBooks);
displayBooks(books);
