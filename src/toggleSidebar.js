export default function toggleSidebar() {
    const tSidebar = document.getElementById("toggleSidebar");
    const sidebar = document.getElementById("sidebar");

    tSidebar.addEventListener("click", () => {
        sidebar.classList.toggle("show");
        document.body.classList.toggle("sidebar-open");
    });

    // Cerrar al hacer clic fuera
    document.addEventListener("click", (e) => {
    if (!sidebar.contains(e.target) && !tSidebar.contains(e.target)) {
        sidebar.classList.remove("show");
        document.body.classList.remove("sidebar-open");
    }
    });
}


