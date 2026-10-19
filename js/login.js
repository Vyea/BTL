const ROLE_KEY = "thuVienRole";
const SHARED_PREFIX = "THU_VIEN_DATA:";

function readNameData() {
    if (!window.name.startsWith(SHARED_PREFIX)) return {};
    try {
        return JSON.parse(window.name.substring(SHARED_PREFIX.length));
    } catch (error) {
        return {};
    }
}
function readSharedData() {
    const urlData = new URLSearchParams(window.location.search).get("data");
    if (urlData) {
        try { return JSON.parse(urlData); } catch (error) {}
    }
    return readNameData();
}
function setRole(role) {
    try { sessionStorage.setItem(ROLE_KEY, role); } catch (error) {}
    try { localStorage.setItem(ROLE_KEY, role); } catch (error) {}
    const sharedData = readSharedData();
    sharedData.role = role;
    try {
        const savedBooks = JSON.parse(localStorage.getItem("thuVienBooks"));
        if (!Array.isArray(sharedData.books) && Array.isArray(savedBooks)) sharedData.books = savedBooks;
    } catch (error) {}
    try {
        const savedRecords = JSON.parse(localStorage.getItem("thuVienBorrowRecords"));
        if (!Array.isArray(sharedData.records) && Array.isArray(savedRecords)) sharedData.records = savedRecords;
    } catch (error) {}

    window.name = SHARED_PREFIX + JSON.stringify(sharedData);
    return sharedData;
}
document.getElementById("loginForm").addEventListener("submit", function(event) {
    event.preventDefault();
    const user = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value.trim();
    const errorMsg = document.getElementById("errorMsg");
    if (user === "" || pass === "") {
        errorMsg.textContent = "Vui lòng nhập đầy đủ thông tin!";
        return;
    }
    let role = "reader";
    let destination = "catalog.html";

    if (user === "admin" && pass === "123456") {
        role = "admin";
        destination = "admin.html";
        alert("Đăng nhập thành công với admin!");
    } else {
        alert("Đăng nhập thành công!");
    }
    const sharedData = setRole(role);
    const nextPage = new URL(destination, window.location.href);
    nextPage.searchParams.set("role", role);
    nextPage.searchParams.set("data", JSON.stringify(sharedData));
    window.location.href = nextPage.href;
});
