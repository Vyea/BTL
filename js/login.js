document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    const errorMsg = document.getElementById('errorMsg');
    if(user === "admin" && pass === "123456") {
        sessionStorage.setItem("thuVienRole", "admin");
        alert("Đăng nhập thành công với admin!");
        window.location.href = "admin.html";
    } else if(user !== "" && pass !== "") {
        sessionStorage.removeItem("thuVienRole");
        alert("Đăng nhập thành công!");
        window.location.href = "catalog.html";
    } else {
        errorMsg.textContent = "Vui lòng nhập đầy đủ thông tin!";
    }
});
