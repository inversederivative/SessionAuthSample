document.addEventListener("DOMContentLoaded", function() {
    const hamburgerIcon = document.getElementById("hamburger-icon");
    const sidebar = document.getElementById("sidebar");
    const weatherContainer = document.getElementById("weather-container");

    hamburgerIcon.addEventListener("click", function() {
        console.log("Hamburger icon clicked");
        sidebar.classList.toggle("sidebar-open");

        // Adjust the position of the weather box when the sidebar is toggled
        const sidebarWidth = sidebar.offsetWidth;
        if (sidebar.classList.contains("sidebar-open")) {
            weatherContainer.style.marginLeft = `${sidebarWidth}px`;
        } else {
            weatherContainer.style.marginLeft = "30px";
        }
    });
});