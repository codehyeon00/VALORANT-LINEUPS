// 라인업 데이터
const abyssLineups = [
    {
        id: "yoru-abyss-tp-1",
        agent: "Yoru",
        map: "Abyss",
        side: "Attacker",
        ability: "E",
        title: "A 메인 -> A 사이트 백사이트 텔포",
        start: { x: 69.2, y: 17.3 },
        end:   { x: 32.4, y: 2.1 },
        youtubeId: "Vg5MMIQUnio",
        startTime: 6,
        endTime: 30
    },
    {
        id: "yoru-abyss-tp-2",
        agent: "Yoru",
        map: "Abyss",
        side: "Attacker",
        ability: "E",
        title: "미드 -> B 사이트 헤븐 텔포",
        start: { x: 65.3, y: 35.8 },
        end:   { x: 27.0, y: 83.3 },
        youtubeId: "WGeE5j3W5HY",
        startTime: 1,
        endTime: 20
    }
];

const mapList = ["abyss", "ascent", "bind", "breeze", "fracture", "haven", "icebox", "lotus", "pearl", "split", "sunset"];

let state = {
    map: "Abyss",
    side: "Attacker",
    agent: "Yoru",
    ability: "All"
};

let player = null;
let stopTimer = null;

// DOM 요소 참조
const mapSelectBtn = document.getElementById("map-select-btn");
const mapGridModal = document.getElementById("map-grid-modal");
const closeMapGridBtn = document.getElementById("close-map-grid");
const mapGridEl = document.getElementById("map-grid");
const currentMapImg = document.getElementById("current-map-img");
const pinsContainer = document.getElementById("pins-container");
const lineSvg = document.getElementById("line-svg");
const detailModal = document.getElementById("detail-modal");

function init() {
    renderMapGrid();
    setupEventListeners();
    updateView();
}

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

function updateView() {
    currentMapImg.src = `assets/maps/minimaps/${state.map.toLowerCase()}.png`;
    lineSvg.innerHTML = "";
    renderPins();
}

// 📌 핀 렌더링: 기본으로는 스킬 아이콘만 생성하고, 마우스를 올릴 때 요루 얼굴과 궤적이 나타남
function renderPins() {
    pinsContainer.innerHTML = "";
    lineSvg.innerHTML = "";

    const filtered = abyssLineups.filter(item => {
        const mapMatch = item.map.toLowerCase() === state.map.toLowerCase();
        const sideMatch = item.side === state.side;
        const abilityMatch = (state.ability === "All" || item.ability.toUpperCase() === state.ability.toUpperCase());
        return mapMatch && sideMatch && abilityMatch;
    });

    filtered.forEach(lineup => {
        // 1. 도착 지점 핀 (항상 보이는 스킬 아이콘)
        const targetPin = document.createElement("div");
        targetPin.className = "pin";
        targetPin.style.left = `${lineup.end.x}%`;
        targetPin.style.top = `${lineup.end.y}%`;
        const skillFileName = `yoru_${lineup.ability.toLowerCase()}`;
        targetPin.innerHTML = `<img src="assets/skills/${skillFileName}.png" alt="${lineup.ability}">`;

        // 2. 출발 지점 핀 (평소엔 숨겨져 있다가 마우스 올리면 생성될 요루 얼굴 핀 엘리먼트)
        let startPin = null;

        const handleEnter = () => {
            // 궤적 그리기
            lineSvg.innerHTML = `
                <line 
                    x1="${lineup.start.x}%" y1="${lineup.start.y}%" 
                    x2="${lineup.end.x}%" y2="${lineup.end.y}%" 
                    stroke="#f59e0b" 
                    stroke-width="3"
                    stroke-dasharray="5,5"
                />
            `;

            // 요루 얼굴 핀 생성해서 추가
            if (!startPin) {
                startPin = document.createElement("div");
                startPin.className = "pin start-agent-pin";
                startPin.style.left = `${lineup.start.x}%`;
                startPin.style.top = `${lineup.start.y}%`;
                startPin.innerHTML = `<img src="assets/agents/Yoru-Profile.jpg" alt="Yoru">`;
                
                // 요루 얼굴 핀을 눌러도 모달이 열리게
                startPin.addEventListener("click", () => openDetailModal(lineup));
                pinsContainer.appendChild(startPin);
            }
        };

        const handleLeave = () => {
            // 마우스가 멀어지면 궤적과 요루 얼굴 제거
            lineSvg.innerHTML = "";
            if (startPin) {
                startPin.remove();
                startPin = null;
            }
        };

        const handleClick = () => openDetailModal(lineup);

        // 스킬 아이콘에 마우스 이벤트 바인딩
        targetPin.addEventListener("mouseenter", handleEnter);
        targetPin.addEventListener("mouseleave", handleLeave);
        targetPin.addEventListener("click", handleClick);

        pinsContainer.appendChild(targetPin);
    });
}

// 영상 모달 열기
function openDetailModal(lineup) {
    const startSec = lineup.startTime || 0;
    const endSec = lineup.endTime || null;

    if (stopTimer) clearInterval(stopTimer);

    if (player && typeof player.loadVideoById === "function") {
        player.loadVideoById({
            videoId: lineup.youtubeId,
            startSeconds: startSec,
            endSeconds: endSec
        });
    } else {
        player = new YT.Player('modal-player', {
            videoId: lineup.youtubeId,
            playerVars: { 'autoplay': 1, 'start': startSec, 'end': endSec },
            events: { 'onReady': (e) => e.target.playVideo() }
        });
    }

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
    if (player && typeof player.stopVideo === "function") player.stopVideo();
    if (stopTimer) clearInterval(stopTimer);
    detailModal.classList.add("hidden");
}

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
            const targetBtn = e.currentTarget;
            targetBtn.classList.add("active");
            state.ability = targetBtn.dataset.ability;
            updateView();
        });
    });

    document.getElementById("close-detail-modal").addEventListener("click", closeModal);
    detailModal.addEventListener("click", (e) => {
        if (e.target === detailModal) closeModal();
    });
}

init();