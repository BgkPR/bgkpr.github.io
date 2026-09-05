import { toggleVisibility, switchElements, getElements, getLastKnownMatch, clearFirstElementChild, getAllMatches, getUsers, getElementById, getAllMatchChatMessages, getMessagesForUser, getMatchChatMessages } from "./IAA.js";
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
    const mainPageSwitches = ["matchInfo", "matchesContainer", "matchesHeader", "homePage", "playersContainer"];
    const roster = getElementById("playerRoster");
    clearFirstElementChild("dataMatches");

    viewMatchesBtn.addEventListener("click", () => {
        switchElements(mainPageSwitches, {"matchesContainer": true, "matchesHeader": true})
    });
    anchorHome.addEventListener("click", () => {
        switchElements(mainPageSwitches, {"matchesContainer": true, "matchesHeader": true, "homePage":true})

    });
    viewPlayersBtn.addEventListener("click", () => {
        switchElements(mainPageSwitches, {"playersContainer": true})
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
            const uniqueMatches = [];
            const seenSteamIds = new Set();
            for (const match of matchingMatches) {
                const matchingPlayer = match.players.find(player => player.username.toLowerCase().includes(filterText) || player.steamid.toLowerCase().includes(filterText));
                if (matchingPlayer && !seenSteamIds.has(matchingPlayer.steamid)) {
                    uniqueMatches.push(match);
                    seenSteamIds.add(matchingPlayer.steamid);
                }
            }
            const limitedMatches = uniqueMatches.slice(0, 4);
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
                    //option.href = `#${match.matchId}`;
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
                    //option.href = `#${match.matchId}`;
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
                const steamIdLink = document.createElement("a")
                indexCell.textContent = playerIndex.toString();
                steamIdLink.href = `player.html?user=${player.steamid}`
                steamIdLink.textContent = `${player.steamid}`
                usernameCell.textContent = player.username;
                row.appendChild(indexCell);
                row.appendChild(usernameCell);
                steamIdCell.appendChild(steamIdLink)
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
    const users = await getUsers();
    const lastKnownMatch = await getLastKnownMatch();
    matches.forEach(match => {
        const matchId = match.matchId;
        const players = match.players;
        if (matchId && players) {
            const row = document.createElement("tr");
            const matchIdCell = document.createElement("td");
            const playersCell = document.createElement("td");
            const matchLink = document.createElement("a");
            matchLink.classList.add("btn", "btn-link")
            //matchLink.href = `#${matchId}`;
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
    const paginatedArray = [];
    const pageSize = 10;
    for (const steamid of Object.keys(users)){

        const aliases = users[steamid].steamAliases
        const userCard = document.createElement("div");
        userCard.classList.add("card", "mb-3");
        const cardBody = document.createElement("div");
        cardBody.classList.add("card-body");
        const headerCard = document.createElement("div");
        headerCard.classList.add("d-flex", "flex-column", "flex-md-row", "align-items-start", "align-items-md-center",  "justify-content-center", "gap-3")
        const steamidElement = document.createElement("h5");
        steamidElement.textContent = lastKnownMatch[steamid.slice(1,steamid.length-2)]?.username;
        steamidElement.classList.add("text-center")
        const ref = document.createElement("a");
        ref.textContent = `${steamid.slice(1,steamid.length-2)}`;
        ref.href = `player.html?user=${steamid.slice(1,steamid.length-2)}`;
        ref.classList.add("btn", "btn-link")
        steamidElement.appendChild(document.createElement("br"));
        steamidElement.appendChild(ref);

        const aliasesElement = document.createElement("p");
        aliasesElement.classList.add("text-muted")
        aliasesElement.textContent = aliases.join(", ");
        headerCard.appendChild(steamidElement)
        cardBody.appendChild(headerCard);
        cardBody.appendChild(aliasesElement);
        userCard.appendChild(cardBody);

        const playersContainer = document.getElementById("playersContainer");
        if (playersContainer) {
            paginatedArray.push(userCard);
            if (paginatedArray.length === pageSize) {
                const pageDiv = document.createElement("div");
                pageDiv.classList.add("page");
                pageDiv.hidden = true;
                paginatedArray.forEach(card => pageDiv.appendChild(card));
                playersContainer.appendChild(pageDiv);
                paginatedArray.length = 0;
            }
        }
    }

    const playersContainer = document.getElementById("playersContainer");
    if (playersContainer && paginatedArray.length > 0) {
        const pageDiv = document.createElement("div");
        pageDiv.classList.add("page");
        paginatedArray.forEach(card => pageDiv.appendChild(card));
        playersContainer.appendChild(pageDiv);
    }

    const paginationNextButton = document.getElementById("playersNextPage");
    const paginationPrevButton = document.getElementById("playersPreviousPage");
    const pageIndicator = document.getElementById("playersPageLabel");
    const pageField = document.getElementById("playersPageInput");
    const totalPages = Math.ceil(Object.keys(users).length / pageSize);

    pageField.addEventListener("change", () => {
        const newPage = parseInt(pageField.value);
        if (newPage >= 1 && newPage <= totalPages) {
            currentPage = newPage;
            updatePagination();
        } else {
            pageField.value = currentPage;
        }
    });

    let currentPage = 1;
    function updatePagination() {
        const pages = playersContainer.getElementsByClassName("page");
        Array.from(pages).forEach((page, index) => {
            page.hidden = index !== currentPage - 1;
        });
        pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
        paginationPrevButton.disabled = currentPage === 1;
        paginationNextButton.disabled = currentPage === totalPages;
        pageField.value = currentPage;
    }

    paginationPrevButton.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            updatePagination();
        }
    });
    paginationNextButton.addEventListener("click", () => {
        if (currentPage < totalPages) {
            currentPage++;
            updatePagination();
        }
    });

    updatePagination();
});