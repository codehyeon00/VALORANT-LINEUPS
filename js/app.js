const mapList = ["abyss", "ascent", "bind", "breeze", "corrode", "fracture", "haven", "icebox", "lotus", "pearl", "split", "summit", "sunset"];

let state = {
    map: "Abyss",
    side: "Attacker",
    agent: "Yoru",
    ability: "All"
};

let player = null;
let stopTimer = null;

// 1. 초기화
function init() {
    renderMapGrid();
    setupEventListeners();
    setupCoordinateLogger();
    updateView();
}

// 2. 맵 클릭 좌표 콘솔 출력 (F12)
function setupCoordinateLogger() {
    currentMapImg.addEventListener("click", (e) => {
        const rect = currentMapImg.getBoundingClientRect();
        const x = (((e.clientX - rect.left) / rect.width) * 100).toFixed(1);
        const y = (((e.clientY - rect.top) / rect.height) * 100).toFixed(1);
        console.log(`[클릭 좌표] x: ${x}, y: ${y}`);
    });
}

// 3. DOM 요소 참조
const mapSelectBtn = document.getElementById("map-select-btn");
const mapGridModal = document.getElementById("map-grid-modal");
const closeMapGridBtn = document.getElementById("close-map-grid");
const mapGridEl = document.getElementById("map-grid");
const currentMapImg = document.getElementById("current-map-img");
const pinsContainer = document.getElementById("pins-container");
const lineSvg = document.getElementById("line-svg");
const detailModal = document.getElementById("detail-modal");

// 4. 맵 선택 그리드
function renderMapGrid() {
    mapGridEl.innerHTML = "";
    mapList.forEach(mapName => {
        const formattedName = mapName.charAt(0).toUpperCase() + mapName.slice(1);
        const card = document.createElement("div");
        card.className = `map-card ${formattedName === state.map ? 'active' : ''}`;
        
        card.innerHTML = `
            <img src="assets/maps/thumbnails/${mapName}.jpg" alt="${formattedName}">
            <span>${formattedName}</span>
        `;
        
        card.addEventListener("click", () => {
            state.map = formattedName;
            document.getElementById("selected-map-thumb").src = `assets/maps/thumbnails/${mapName}.jpg`;
            document.getElementById("selected-map-name").textContent = formattedName;
            mapGridModal.classList.add("hidden");
            updateView();
        });
        mapGridEl.appendChild(card);
    });
}

// 5. 화면 업데이트
function updateView() {
    currentMapImg.src = `assets/maps/minimaps/${state.map.toLowerCase()}.png`;
    clearLines();
    renderPins();
}

// 6. 데이터 가져오기
function getAllLineups() {
    let allData = [];
    if (typeof abyssLineups !== "undefined") allData = allData.concat(abyssLineups);
    return allData;
}

// 7. 핀 렌더링
function renderPins() {
    pinsContainer.innerHTML = "";
    const allData = getAllLineups();

    const filtered = allData.filter(item => {
        const mapMatch = item.map.toLowerCase() === state.map.toLowerCase();
        const sideMatch = item.side === state.side;
        const abilityMatch = (state.ability === "All" || item.ability === state.ability);
        return mapMatch && sideMatch && abilityMatch;
    });

    filtered.forEach(lineup => {
        const pin = document.createElement("div");
        pin.className = "pin";
        pin.style.left = `${lineup.end.x}%`;
        pin.style.top = `${lineup.end.y}%`;
        pin.innerHTML = `<img src="assets/skills/yoru_${lineup.ability.toLowerCase()}.png" alt="${lineup.ability}">`;

        pin.addEventListener("mouseenter", () => showHoverPath(lineup));
        pin.addEventListener("mouseleave", clearLines);
        pin.addEventListener("click", () => openDetailModal(lineup));

        pinsContainer.appendChild(pin);
    });
}

// 8. 호버 패스
function showHoverPath(lineup) {
    lineSvg.innerHTML = `
        <line 
            x1="${lineup.start.x}%" y1="${lineup.start.y}%" 
            x2="${lineup.end.x}%" y2="${lineup.end.y}%" 
            stroke="#f59e0b" 
            stroke-width="3"
            stroke-dasharray="5,5"
        />
    `;

    const agentPin = document.createElement("div");
    agentPin.className = "pin start-agent-pin";
    agentPin.id = "active-start-pin";s
    agentPin.style.left = `${lineup.start.x}%`;
    agentPin.style.top = `${lineup.start.y}%`;
    agentPin.innerHTML = `<img src="assets/agents/Yoru-Profile.jpg" alt="Yoru">`;

    pinsContainer.appendChild(agentPin);
}

function clearLines() {
    lineSvg.innerHTML = "";
    const activeStartPin = document.getElementById("active-start-pin");
    if (activeStartPin) activeStartPin.remove();
}

// 9. 비디오 모달 및 유튜브 API 파싱 (구간 무한 반복 재생 적용)
function openDetailModal(lineup) {
    const startSec = lineup.startTime || 0;
    const endSec = lineup.endTime || null;

    if (stopTimer) clearInterval(stopTimer);

    // 유튜브 플레이어 생성/재생
    if (player && typeof player.loadVideoById === "function") {
        player.loadVideoById({
            videoId: lineup.youtubeId,
            startSeconds: startSec,
            endSeconds: endSec
        });
    } else {
        player = new YT.Player('modal-player', {
            videoId: lineup.youtubeId,
            playerVars: {
                'autoplay': 1,
                'start': startSec,
                'end': endSec
            },
            events: {
                'onReady': (e) => e.target.playVideo()
            }
        });
    }

    // endTime 도달 시 startTime으로 돌아가는 구간 무한 루프 타이머
    if (endSec) {
        stopTimer = setInterval(() => {
            if (player && typeof player.getCurrentTime === "function") {
                if (player.getCurrentTime() >= endSec) {
                    player.seekTo(startSec, true);
                    player.playVideo();
                }
            }
        }, 300);
    }

    document.getElementById("modal-video-title").textContent = lineup.title;
    document.getElementById("modal-map-img").src = `assets/maps/minimaps/${lineup.map.toLowerCase()}.png`;
    document.getElementById("info-map").textContent = lineup.map;
    document.getElementById("info-agent").textContent = lineup.agent;
    document.getElementById("info-side").textContent = lineup.side;

    const modalSvg = document.getElementById("modal-line-svg");
    modalSvg.innerHTML = `
        <line x1="${lineup.start.x}%" y1="${lineup.start.y}%" x2="${lineup.end.x}%" y2="${lineup.end.y}%" stroke="#f59e0b" stroke-width="3" stroke-dasharray="4"/>
    `;

    const modalPins = document.getElementById("modal-pins-container");
    modalPins.innerHTML = `
        <div class="pin start-agent-pin" style="left:${lineup.start.x}%; top:${lineup.start.y}%;">
            <img src="assets/agents/Yoru-Profile.jpg">
        </div>
        <div class="pin" style="left:${lineup.end.x}%; top:${lineup.end.y}%;">
            <img src="assets/skills/yoru_${lineup.ability.toLowerCase()}.png">
        </div>
    `;

    detailModal.classList.remove("hidden");
}

function closeModal() {
    if (player && typeof player.stopVideo === "function") {
        player.stopVideo();
    }
    if (stopTimer) clearInterval(stopTimer);
    detailModal.classList.add("hidden");
}

// 10. 이벤트 등록
function setupEventListeners() {
    mapSelectBtn.addEventListener("click", () => mapGridModal.classList.toggle("hidden"));
    closeMapGridBtn.addEventListener("click", () => mapGridModal.classList.add("hidden"));

    document.querySelectorAll(".side-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            document.querySelectorAll(".side-btn").forEach(b => b.classList.remove("active"));
            e.currentTarget.classList.add("active");
            state.side = e.currentTarget.dataset.side;
            updateView();
        });
    });

    document.querySelectorAll(".ability-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            document.querySelectorAll(".ability-btn").forEach(b => b.classList.remove("active"));
            e.currentTarget.classList.add("active");
            state.ability = e.currentTarget.dataset.ability;
            updateView();
        });
    });

    document.getElementById("close-detail-modal").addEventListener("click", closeModal);
    detailModal.addEventListener("click", (e) => {
        if (e.target === detailModal) closeModal();
    });
}

init();