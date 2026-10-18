const STORAGE_KEY = "thuVienBooks";
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
    { title: "Số đỏ", author: "Vũ Trọng Phụng", category: "Văn học", status: "Còn sách" },
];
function loadBooks() {
    const savedBooks = localStorage.getItem(STORAGE_KEY);
    if (savedBooks === null) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultBooks));
        return defaultBooks;
    }
    const booksFromStorage = JSON.parse(savedBooks);
    for (let i = 0; i < defaultBooks.length; i++) {
        const defaultBook = defaultBooks[i];
        const foundBook = booksFromStorage.find(function(book) {
            return book.title.toLowerCase() === defaultBook.title.toLowerCase();
        });
        if (!foundBook) {
            booksFromStorage.push(defaultBook);
        }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(booksFromStorage));
    return booksFromStorage;
}
function saveBooks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}
function findBookByTitle(title) {
    const wantedTitle = title.trim().toLowerCase();
    return books.find(function(book) {
        return book.title.trim().toLowerCase() === wantedTitle;
    });
}
const books = loadBooks();
