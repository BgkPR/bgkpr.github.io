import { toggleVisibility, getElements, clearFirstElementChild, getAllMatches, getElementById, getAllMatchChatMessages, getMessagesForUser, getMatchChatMessages } from "./IAA.js";
console.log("TFRecords - v2.0α");
console.log(`Base path: ${(window.location.href.substring(0, window.location.href.lastIndexOf('/')) + '/')}`);
if(typeof process != "undefined" && process.env.ENV_PROD_URL && window.location.origin === process.env.ENV_PROD_URL) {
    console.log("Running in development mode, API path SET to ENV_PROD_URL/api/TFRECORDS");
}else{
    console.log("Not running in PROD mode, removed /api/TFRECORDS");
}

document.addEventListener("DOMContentLoaded", async () => {
    const [viewMatchesBtn, viewPlayersBtn, refreshPageBtn, matchesContainer, dataMatches, matchInfo, matchesHeader, compactView, homePage, sortMatches, filterOutput] = getElements(["viewMatches", "viewPlayers", "reloadPage", "matchesContainer", "dataMatches", "matchInfo", "matchesHeader", "compactView", "homePage", "sortMatches", "filterOutput"]);
    const [anchorHome, anchorMatch, anchorID] = getElements(["anchorHome", "anchorMatch", "anchorID"]);
    const roster = getElementById("playerRoster");
    clearFirstElementChild("dataMatches");

    viewMatchesBtn.addEventListener("click", () => {
        toggleVisibility("matchInfo", false);
        toggleVisibility("matchesContainer", true);
        toggleVisibility("matchesHeader", true);
    });
    anchorHome.addEventListener("click", () => {
        toggleVisibility("matchInfo", false);
        toggleVisibility("matchesContainer", true);
        toggleVisibility("matchesHeader", true);
        toggleVisibility("homePage", true);
    });
    refreshPageBtn.addEventListener("click", () => {
        location.reload();
    });
    /*
    filterOutput.addEventListener("blur", () => {
        if(document.activeElement && document.activeElement.id === "playerMatchDropdown") {
            return;
        }
        setTimeout(() => {
            let dropdown = document.getElementById("playerMatchDropdown");
            if (dropdown) {
                dropdown.remove();
            }
        }, 200);
    });*/

    filterOutput.addEventListener("input", () => {
        const filterText = filterOutput.value.toLowerCase();
        const rows = dataMatches.getElementsByTagName("tr");
        Array.from(rows).forEach(row => {
            const matchId = row.cells[0].textContent.toLowerCase();
            const playerCount = row.cells[1].textContent.toLowerCase();
            if (matchId.includes(filterText) || playerCount.includes(filterText)) {
                row.style.display = "";
            }
            else {
                row.style.display = "none";
            }
        });

        let dropdown = document.getElementById("playerMatchDropdown");
        if (dropdown && filterText === "") {
            dropdown.remove();
            return;
        }

        const allPlayers = getAllMatches().then(matches => {
            const matchingMatches = matches.filter(match => match.players.some(player => player.username.toLowerCase().includes(filterText) || player.steamid.toLowerCase().includes(filterText)));
            const limitedMatches = matchingMatches.slice(0, 4);
            let dropdown = document.getElementById("playerMatchDropdown");
            if (!dropdown) {
                dropdown = document.createElement("div");
                dropdown.id = "playerMatchDropdown";
                dropdown.classList.add("dropdown-menu", "show");
                dropdown.style.position = "absolute";
                dropdown.style.top = `${filterOutput.getBoundingClientRect().bottom + window.scrollY}px`;
                dropdown.style.left = `${filterOutput.getBoundingClientRect().left + window.scrollX}px`;
                dropdown.style.width = `${filterOutput.offsetWidth}px`;

                for (const match of limitedMatches) {
                    const option = document.createElement("a");
                    option.classList.add("dropdown-item");
                    option.href = `#${match.matchId}`;
                    const matchingPlayer = match.players.find(player => player.username.toLowerCase().includes(filterText) || player.steamid.toLowerCase().includes(filterText));
                    var croppedUsername = matchingPlayer.username;
                    if (croppedUsername.length > 11) {
                        croppedUsername = croppedUsername.slice(0, 10).trim() + "...";
                    }
                    option.textContent = `${croppedUsername} ${matchingPlayer.steamid}`;
                    dropdown.appendChild(option);
                    option.addEventListener("click", () => {
                        toggleVisibility("homePage", false);
                        toggleVisibility("matchInfo", true);
                        toggleVisibility("matchesHeader", false);
                        displayMatchDetails(match.matchId);
                    });
                }
                document.body.appendChild(dropdown);
                filterOutput.parentNode.appendChild(dropdown);
            } else {
                dropdown.innerHTML = "";
                limitedMatches.forEach(match => {
                    const option = document.createElement("a");
                    option.classList.add("dropdown-item");
                    option.href = `#${match.matchId}`;
                    const matchingPlayer = match.players.find(player => player.username.toLowerCase().includes(filterText) || player.steamid.toLowerCase().includes(filterText));
                    var croppedUsername = matchingPlayer.username;
                    if (croppedUsername.length > 11) {
                        croppedUsername = croppedUsername.slice(0, 10).trim() + "...";
                    }
                    option.textContent = `${croppedUsername} ${matchingPlayer.steamid}`;
                    dropdown.appendChild(option);
                    option.addEventListener("click", () => {
                        toggleVisibility("homePage", false);
                        toggleVisibility("matchInfo", true);
                        toggleVisibility("matchesHeader", false);
                        displayMatchDetails(match, match.players);
                    });
                });
            }
        });
    });

    sortMatches.addEventListener("change", () => {
        const sortBy = sortMatches.value;
        const rows = Array.from(dataMatches.getElementsByTagName("tr"));
        rows.sort((a, b) => {
            const playersA = parseInt(a.cells[1].textContent || "0");
            const playersB = parseInt(b.cells[1].textContent || "0");
            if (sortBy === "Players (ASC)") {
                return playersA - playersB;
            }
            else if (sortBy === "Players (DESC)") {
                return playersB - playersA;
            }
            return 0;
        });
        rows.forEach(row => dataMatches.appendChild(row));
    });

    function tC() {
        if (compactView.checked && roster) { roster.style.maxHeight = "400px"; roster.style.overflowY = "auto"; matchesContainer.classList.add("compact"); } else if (roster) { roster.style.maxHeight = ""; roster.style.overflowY = ""; matchesContainer.classList.remove("compact"); }
    }

    async function displayMatchDetails(match, players) {
        //console.log(`Displaying details for match ${match.matchId} with players:`, players);
        toggleVisibility("homePage", false);
        toggleVisibility("matchInfo", true);
        toggleVisibility("matchesHeader", false);
        anchorID.textContent = `Match ID: ${match.matchId}`;
        const matchPlayersList = document.getElementById("dataPlayers");
        if (matchPlayersList) {
            while (matchPlayersList.firstChild) {
                matchPlayersList.removeChild(matchPlayersList.firstChild);
            }
            getElementById("reportID").textContent = `Match Report - ${match.matchId}`;
            // Placeholder until I return the map name in the API
            getElementById("serverInfo").textContent = `GAMEMODE_MAP @ [X-SERVER-IP] 169.254.232.166:15072`;
            getElementById("playerCount").textContent = `12v12 - ${players.length} Players`;
            var playerIndex = 1;
            players.forEach((player) => {
                const row = document.createElement("tr");
                const indexCell = document.createElement("td");
                const usernameCell = document.createElement("td");
                const steamIdCell = document.createElement("td");
                indexCell.textContent = playerIndex.toString();
                steamIdCell.textContent = player.steamid;
                usernameCell.textContent = player.username;
                row.appendChild(indexCell);
                row.appendChild(usernameCell);
                row.appendChild(steamIdCell);
                matchPlayersList.appendChild(row);
                playerIndex++;
            });
        }
        const chatMessages = await getMatchChatMessages(match.matchId);
        const chatContainer = document.getElementById("dataChat");
        if (chatContainer) {
            while (chatContainer.firstChild) {
                chatContainer.removeChild(chatContainer.firstChild);
            }
            if (chatMessages.length > 0) {
                chatMessages.forEach(msg => {
                    const msgElement = document.createElement("div");
                    msgElement.textContent = `${msg.username} : ${msg.message}`;
                    chatContainer.appendChild(msgElement);
                });
            }
        }
    }
    tC();
    compactView.addEventListener("change", tC);
    const matches = await getAllMatches();
    const messages = await getAllMatchChatMessages();
    matches.forEach(match => {
        const matchId = match.matchId;
        const players = match.players;
        if (matchId && players) {
            const row = document.createElement("tr");
            const matchIdCell = document.createElement("td");
            const playersCell = document.createElement("td");
            const matchLink = document.createElement("a");
            matchLink.href = `#${matchId}`;
            matchLink.textContent = matchId;
            matchIdCell.appendChild(matchLink);
            playersCell.textContent = players.length.toString();
            row.appendChild(matchIdCell);
            row.appendChild(playersCell);
            dataMatches.appendChild(row);
            matchLink.addEventListener("click", () => {
                displayMatchDetails(match, players);
            });
        }
    });
});