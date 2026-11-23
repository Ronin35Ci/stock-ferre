document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault(); 
    const usuario = document.getElementById('username').value.trim().toLowerCase();
    const clave = document.getElementById('password').value;
    const mensajeError = document.getElementById('mensajeError');

    if (usuario === "admin" && clave === "1234") {
        localStorage.setItem("usuarioLogueado", "Administrador");
        window.location.href = "dashboard.html";
        return;
    }

    if (usuario.startsWith("vendedor") && clave === "5678") {
        localStorage.setItem("usuarioLogueado", usuario.toUpperCase()); 
        window.location.href = "dashboard-vendedor.html"; 
        return;
    }

    mensajeError.textContent = "Usuario o contraseña incorrectos. Intente nuevamente.";
});