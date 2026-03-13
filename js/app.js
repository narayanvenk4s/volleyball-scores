// =========================================================
// APP INITIALIZATION
// =========================================================

// Allow Enter key in password field
document.getElementById("passwordInput").addEventListener("keyup", function (e) {
    if (e.key === "Enter") attemptScorerLogin();
});

window.addEventListener("DOMContentLoaded", function () {
    initializeTheme();
    renderTeamSetup();
    showModeBanner("viewer", "");
    setHeaderDate();
    loadFromFirebase();
    initializeSetupCollapse();
});


function setHeaderDate() {
    var el = document.getElementById("headerDate");
    if (!el) return;
    var now = new Date();
    el.textContent = now.toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}

function initializeSetupCollapse() {
    var body = document.getElementById("setupBody");
    if (!body) return;
    body.classList.remove("collapsed");
}

function toggleSetupCard() {
    var body = document.getElementById("setupBody");
    var icon = document.getElementById("setupToggleIcon");
    var btn = document.getElementById("setupToggleBtn");
    if (!body || !icon || !btn) return;
    var collapsed = body.classList.toggle("collapsed");
    icon.textContent = collapsed ? "▸" : "▾";
    btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
}
