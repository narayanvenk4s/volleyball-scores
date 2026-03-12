// =========================================================
// ROTATION MANAGEMENT
// =========================================================

var touchDragOverElement = null;

function renderRotation(matchId, teamKey) {
    var m = matchData[matchId]; if (!m) return;
    var rot = (teamKey === "A") ? m.rotationA : m.rotationB;
    // Use active (possibly substituted) roster if available
    var players = (teamKey === "A" ? m.activePlayersA : m.activePlayersB)
        || teams[(teamKey === "A") ? m.team1Index : m.team2Index].players || [];

    function slotLabel(posNum) {
        var name = players[posNum - 1] || ("P" + posNum);
        return posNum + ": " + name;
    }

    var containerId = "rotCourt_" + matchId + "_" + teamKey;
    var container = document.getElementById(containerId);
    if (!container) return;

    var pos4 = rot[3], pos3 = rot[2], pos2 = rot[1];
    var pos5 = rot[4], pos1 = rot[0], pos6 = rot[5];

    function posCell(courtPos, label, isServerSlot) {
        var classes = "rot-pos" + (isServerSlot ? " server-slot" : "") + (isScorer ? " draggable" : "");
        if (!isScorer) return "<div class='" + classes + "'>" + label + "</div>";
        // data attributes used by touch handlers; inline handlers kept for mouse drag-and-drop
        return "<div class='" + classes + "'" +
            " data-match-id='" + matchId + "'" +
            " data-team-key='" + teamKey + "'" +
            " data-court-pos='" + courtPos + "'" +
            " draggable='true'" +
            " ondragstart=\"onRotationDragStart(event,'" + matchId + "','" + teamKey + "'," + courtPos + ")\"" +
            " ondragover='onRotationDragOver(event)'" +
            " ondragleave='onRotationDragLeave(event)'" +
            " ondrop=\"onRotationDrop(event,'" + matchId + "','" + teamKey + "'," + courtPos + ")\">" +
            label + "</div>";
    }

    container.innerHTML =
        "<div class='rot-row'>" +
        "  " + posCell(4, slotLabel(pos4), false) +
        "  " + posCell(3, slotLabel(pos3), false) +
        "  " + posCell(2, slotLabel(pos2), false) +
        "</div>" +
        "<div class='rot-row'>" +
        "  " + posCell(5, slotLabel(pos5), false) +
        "  " + posCell(1, slotLabel(pos1), true) +
        "  " + posCell(6, slotLabel(pos6), false) +
        "</div>";

    // Attach touch listeners after rendering.
    // passive:false on touchmove is required so preventDefault() can block page scroll.
    if (isScorer) {
        var cells = container.querySelectorAll('.rot-pos');
        for (var i = 0; i < cells.length; i++) {
            cells[i].addEventListener('touchstart', onRotationTouchStart, { passive: true });
            cells[i].addEventListener('touchmove', onRotationTouchMove, { passive: false });
            cells[i].addEventListener('touchend', onRotationTouchEnd, { passive: true });
        }
    }
}

// ---- Mouse drag-and-drop (desktop) ----

function onRotationDragStart(event, matchId, teamKey, courtPos) {
    if (!isScorer) return;
    rotationDragState = { matchId: matchId, teamKey: teamKey, courtPos: courtPos };
    if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
}

function onRotationDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add("drag-over");
}

function onRotationDragLeave(event) {
    event.currentTarget.classList.remove("drag-over");
}

function onRotationDrop(event, matchId, teamKey, targetPos) {
    event.preventDefault();
    event.currentTarget.classList.remove("drag-over");
    if (!isScorer || !rotationDragState) return;
    if (rotationDragState.matchId !== matchId || rotationDragState.teamKey !== teamKey) return;
    var fromPos = rotationDragState.courtPos;
    rotationDragState = null;
    if (fromPos === targetPos) return;
    var m = matchData[matchId]; if (!m) return;
    var rot = (teamKey === "A") ? m.rotationA : m.rotationB;
    var temp = rot[fromPos - 1];
    rot[fromPos - 1] = rot[targetPos - 1];
    rot[targetPos - 1] = temp;
    if (teamKey === "A") m.rotationA = rot; else m.rotationB = rot;
    renderRotation(matchId, teamKey);
    saveToFirebase();
}

// ---- Touch drag-and-drop (mobile) ----

function onRotationTouchStart(event) {
    if (!isScorer) return;
    var el = event.currentTarget;
    rotationDragState = {
        matchId: el.getAttribute('data-match-id'),
        teamKey: el.getAttribute('data-team-key'),
        courtPos: parseInt(el.getAttribute('data-court-pos'), 10)
    };
}

function onRotationTouchMove(event) {
    if (!rotationDragState) return;
    event.preventDefault(); // block page scroll while dragging
    var touch = event.touches[0];
    var el = document.elementFromPoint(touch.clientX, touch.clientY);

    // Clear highlight from previous target
    if (touchDragOverElement && touchDragOverElement !== el) {
        touchDragOverElement.classList.remove('drag-over');
    }

    // Highlight new target if it's a rotation slot
    if (el && el.classList && el.classList.contains('rot-pos')) {
        el.classList.add('drag-over');
        touchDragOverElement = el;
    } else {
        touchDragOverElement = null;
    }
}

function onRotationTouchEnd(event) {
    if (!isScorer || !rotationDragState) return;

    if (touchDragOverElement) {
        touchDragOverElement.classList.remove('drag-over');
        touchDragOverElement = null;
    }

    // elementFromPoint finds the element under the finger at release
    var touch = event.changedTouches[0];
    var el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!el || !el.classList || !el.classList.contains('rot-pos')) {
        rotationDragState = null;
        return;
    }

    var targetMatchId = el.getAttribute('data-match-id');
    var targetTeamKey = el.getAttribute('data-team-key');
    var targetPos = parseInt(el.getAttribute('data-court-pos'), 10);

    if (targetMatchId !== rotationDragState.matchId || targetTeamKey !== rotationDragState.teamKey) {
        rotationDragState = null;
        return;
    }

    var fromPos = rotationDragState.courtPos;
    rotationDragState = null;
    if (fromPos === targetPos) return;

    var m = matchData[targetMatchId]; if (!m) return;
    var rot = (targetTeamKey === "A") ? m.rotationA : m.rotationB;
    var temp = rot[fromPos - 1];
    rot[fromPos - 1] = rot[targetPos - 1];
    rot[targetPos - 1] = temp;
    if (targetTeamKey === "A") m.rotationA = rot; else m.rotationB = rot;
    renderRotation(targetMatchId, targetTeamKey);
    saveToFirebase();
}

// ---- Manual rotation buttons ----

function manualRotate(matchId, teamKey) {
    if (!isScorer) return;
    var m = matchData[matchId]; if (!m) return;
    var rot = (teamKey === "A") ? m.rotationA : m.rotationB;
    rot = rotateArray(rot);
    if (teamKey === "A") m.rotationA = rot; else m.rotationB = rot;

    // NOTE: Do NOT change m.serverTeam here — manual rotation is only for
    // arranging player positions, not for declaring who's serving.
    // Only setServer() and side-out logic in changeScore() change serverTeam.

    renderRotation(matchId, teamKey);
    highlightServerButton(matchId);
    saveToFirebase();
}

// Internal rotate that doesn't trigger a separate save
function manualRotateInternal(matchId, teamKey) {
    var m = matchData[matchId]; if (!m) return;
    var rot = (teamKey === "A") ? m.rotationA : m.rotationB;
    rot = rotateArray(rot);
    if (teamKey === "A") m.rotationA = rot; else m.rotationB = rot;

    var players = (teamKey === "A")
        ? (m.activePlayersA || teams[m.team1Index].players || [])
        : (m.activePlayersB || teams[m.team2Index].players || []);
    var pos1Num = rot[0];
    var newServerPlayer = players[pos1Num - 1] || null;
    m.serverTeam = teamKey;
    if (teamKey === "A") m.serverPlayerA = newServerPlayer;
    else m.serverPlayerB = newServerPlayer;

    renderRotation(matchId, teamKey);
    highlightServerButton(matchId);
}
