// =========================================================
// STANDINGS & FINAL MATCH
// =========================================================

function getStandingsData() {
    var n = teams.length;
    var wins = new Array(n).fill(0);   // match wins
    var sw = new Array(n).fill(0);     // sets won
    var sl = new Array(n).fill(0);     // sets lost
    schedule.forEach(function (s) {
        var m = matchData[s.id]; if (!m) return;
        var setsA = m.setsWonA || 0;
        var setsB = m.setsWonB || 0;
        sw[s.team1Index] += setsA; sl[s.team1Index] += setsB;
        sw[s.team2Index] += setsB; sl[s.team2Index] += setsA;
        // Count match wins only for completed matches
        if (m.matchComplete) {
            if (setsA > setsB) wins[s.team1Index]++;
            else wins[s.team2Index]++;
        }
    });
    var data = [];
    for (var i = 0; i < n; i++) data.push({ idx: i, name: teams[i].name, wins: wins[i], sw: sw[i], sl: sl[i] });
    data.sort(function (a, b) {
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (a.sl !== b.sl) return a.sl - b.sl;
        return (b.sw - b.sl) - (a.sw - a.sl);
    });
    return data;
}

function updateStandings() {
    var table = document.getElementById("standingsTable");
    if (!table) return;
    var data = getStandingsData();
    var html = "<tr><th>#</th><th>Team</th><th>MW</th><th>SL</th><th>Diff</th><th>SW</th></tr>";
    data.forEach(function (row, idx) {
        var diff = row.sw - row.sl;
        html += "<tr>" +
            "<td>" + (idx + 1) + "</td>" +
            "<td>" + escHtml(row.name) + "</td>" +
            "<td style='font-weight:700;'>" + row.wins + "</td>" +
            "<td>" + row.sl + "</td>" +
            "<td style='color:" + (diff >= 0 ? "var(--green)" : "var(--red)") + ";font-weight:600;'>" + (diff >= 0 ? "+" : "") + diff + "</td>" +
            "<td>" + row.sw + "</td>" +
            "</tr>";
    });
    table.innerHTML = html;
}

function buildFinalMatch() {
    if (!isScorer) return;
    var data = getStandingsData();
    if (!data || data.length < 2) { alert("Need at least 2 teams."); return; }

    var t1Index = data[0].idx, t2Index = data[1].idx;
    matchData[FINAL_MATCH_ID] = createEmptyMatchState(FINAL_MATCH_ID, t1Index, t2Index);

    var finalCard = document.getElementById("finalCard");
    var finalContent = document.getElementById("finalContent");
    var finalLabel = document.getElementById("finalTeamsLabel");

    var html = buildMatchCardHTML(FINAL_MATCH_ID, t1Index, t2Index, true);
    if (finalContent) finalContent.innerHTML = html;
    if (finalLabel) finalLabel.textContent = teams[t1Index].name + " vs " + teams[t2Index].name;
    if (finalCard) finalCard.style.display = "block";

    renderRotation(FINAL_MATCH_ID, "A");
    renderRotation(FINAL_MATCH_ID, "B");
    refreshScoreUI(FINAL_MATCH_ID);
    renderServerButtons(FINAL_MATCH_ID);
    renderServiceLogTable(FINAL_MATCH_ID);
    updateSubUI(FINAL_MATCH_ID, "A");
    updateSubUI(FINAL_MATCH_ID, "B");
    saveToFirebase();
}
