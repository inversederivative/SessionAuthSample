document.addEventListener("DOMContentLoaded", function() {
    const hamburgerIcon = document.getElementById("hamburger-icon");
    const sidebar = document.getElementById("sidebar");

    hamburgerIcon.addEventListener("click", function() {
        console.log("Hamburger icon clicked");
        sidebar.classList.toggle("sidebar-open");
    });
});
