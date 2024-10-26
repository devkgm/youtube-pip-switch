let videoElement = null;
let isPiPActive = false;
let userClose = false;
let setTimer = false;
let modalTimeout;

function initializeVideoElement() {
    videoElement = document.querySelector("#movie_player > div.html5-video-container > video");
    if (videoElement) {
        addScrollEventListener();
    }
}

function handleUrlUpdate(url) {
    console.log("받은 URL 변경 메시지:", url);
    initializeVideoElement();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === "url_updated") {
        handleUrlUpdate(request.url);
    }
});

function addScrollEventListener() {
    window.addEventListener("scroll", handleScroll);
}

function handleScroll() {
    if (document.pictureInPictureElement !== videoElement && isPiPActive) {
        console.log("사용자가 직접 PiP 종료");
        isPiPActive = false;
        userClose = true;
    }

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const videoRect = videoElement.getBoundingClientRect();

    if (scrollTop === 0 || videoRect.height / 2 < videoRect.bottom) {
        handleScrollToTop();
    } else if (videoRect.bottom < 0) {
        handleScrollPastVideo();
    }
}

function handleScrollToTop() {
    clearTimeout(modalTimeout);
    setTimer = false;
    hideModal();
    userClose = false;
    if (isPiPActive && document.pictureInPictureElement === videoElement) {
        togglePiP();
    }
}

function handleScrollPastVideo() {
    if (!isPiPActive && !userClose && !setTimer) {
        showModal();
        setTimer = true;
        modalTimeout = setTimeout(modalTimer, 4000);
    }
}

function modalTimer() {
    hideModal();
    userClose = true;
}

const modalStyle = createModalStyle();
const modalHTML = createModalHTML();

document.body.insertAdjacentHTML("beforeend", modalHTML);
document.head.appendChild(modalStyle);

const modal = document.querySelector(".modal-container");
modal.addEventListener("mousemove", handleModalMouseMove);
modal.addEventListener("mouseleave", handleModalMouseLeave);

function handleModalMouseMove() {
    clearTimeout(modalTimeout);
    setTimer = false;
}

function handleModalMouseLeave() {
    clearTimeout(modalTimeout);
    setTimer = false;
    modalTimeout = setTimeout(modalTimer, 1000);
}

function showModal() {
    modal.classList.add("show");
    modal.style.pointerEvents = "auto";
}

function hideModal() {
    modal.classList.remove("show");
    modal.style.pointerEvents = "none";
}

const confirmButton = document.getElementById("confirmButton");
confirmButton.addEventListener("click", handleConfirmClick);

const closeButton = document.getElementById("closeButton");
closeButton.addEventListener("click", handleCloseClick);

function handleConfirmClick() {
    hideModal();
    togglePiP();
    clearTimeout(modalTimeout);
    setTimer = false;
}

function handleCloseClick() {
    hideModal();
    userClose = true;
    console.log("User Close");
    clearTimeout(modalTimeout);
    setTimer = false;
}

async function togglePiP() {
    try {
        if (document.pictureInPictureElement === videoElement) {
            await document.exitPictureInPicture();
            isPiPActive = false;
        } else {
            await videoElement.requestPictureInPicture();
            isPiPActive = true;
        }
    } catch (error) {
        console.error("PiP 모드 전환 실패: ", error);
    }
}

function createModalStyle() {
    const style = document.createElement("style");
    style.textContent = `
        .modal-container {
            position: fixed;
            top: 50%;
            left: 45%;
            transform: translate(-50%, -50%);
            background-color: #fff;
            padding: 20px;
            box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.5);
            border-radius: 20px;
            z-index: 9999;
            opacity: 0;
            transform: translateY(50px); 
            transition: opacity 0.3s ease, transform 0.3s ease; 
            pointer-events: none;
        }
        .modal-container.show {
            opacity: 1; 
            transform: translateY(0); 
        }
        .modal-title {
            font-size: 18px;
            margin-bottom: 10px;
        }
        .button-container {
            text-align: center;
        }
        .modal-button {
            background-color: #007BFF;
            color: #fff;
            padding: 10px 20px;
            font-size: 16px;
            border-radius: 5px;
            cursor: pointer;
            margin-right: 10px;
            border: none;
            font-weight: 500;
        }
        .modal-button:hover {
            opacity: 0.6;
            transition: 0.1s;
        }
        .close {
            background-color: #A4A4A4;
        }
    `;
    return style;
}

function createModalHTML() {
    return `
        <div class="modal-container">
            <p class="modal-title">PiP 모드를 실행하겠습니까?</p>
            <div class="button-container">
                <button class="modal-button confirm" id="confirmButton">실행</button>
                <button class="modal-button close" id="closeButton">닫기</button>
            </div>
        </div>
    `;
}

initializeVideoElement();
