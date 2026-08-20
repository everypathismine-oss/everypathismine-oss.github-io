const FOCUS_DEFAULT = 100 * 60;
const BREAK_DEFAULT = 20 * 60;

let focusTimeLeft = FOCUS_DEFAULT;
let breakTimeLeft = BREAK_DEFAULT;

let focusInterval = null;
let breakInterval = null;

let focusWarningPlayed = false;
let breakWarningPlayed = false;

let audioCtx = null;

const focusDisplay = document.getElementById("focusDisplay");
const breakDisplay = document.getElementById("breakDisplay");
const focusCard = document.getElementById("focusCard");
const breakCard = document.getElementById("breakCard");
const focusResetBtn = document.getElementById("focusResetBtn");
const breakResetBtn = document.getElementById("breakResetBtn");
const customPopup = document.getElementById("customPopup");
const popupMessage = document.getElementById("popupMessage");
const closePopupBtn = document.getElementById("closePopupBtn");

function initAudio() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            audioCtx = new AudioContext();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Offline Electronic Sound Generator
function playBeep(type) {
    initAudio(); 
    if (!audioCtx) return;
    
    if (type === 'soft') {
        // NEW SHARPER MID BEEP: A piercing double-chirp using a sharp triangle wave
        let now = audioCtx.currentTime;
        [0, 0.15].forEach(delay => {
            let osc = audioCtx.createOscillator();
            let gain = audioCtx.createGain();
            osc.type = 'triangle'; // Clearer, sharper tone than a sine wave
            osc.frequency.setValueAtTime(1200, now + delay); // High piercing pitch
            gain.gain.setValueAtTime(0.4, now + delay); // Louder volume
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now + delay);
            osc.stop(now + delay + 0.08); // Quick sharp snaps
        });
    } else if (type === 'urgent') {
        // Final finish alarm: Loud buzzer sound
        let now = audioCtx.currentTime;
        [0, 0.3, 0.6].forEach(delay => {
            let osc = audioCtx.createOscillator();
            let gain = audioCtx.createGain();
            osc.type = 'square'; 
            osc.frequency.setValueAtTime(880, now + delay); 
            gain.gain.setValueAtTime(0.3, now + delay); 
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now + delay);
            osc.stop(now + delay + 0.2);
        });
    }
}

function showPopup(text) {
    popupMessage.innerHTML = text;
    customPopup.classList.remove("popup-hidden");
}

function closePopup() {
    customPopup.classList.add("popup-hidden");
}

function formatTime(totalSeconds) {
    let mins = Math.floor(totalSeconds / 60);
    let secs = totalSeconds % 60;
    if (secs < 10) secs = "0" + secs;
    return mins + ":" + secs;
}

function updateDisplayColors() {
    let focusMins = Math.ceil(focusTimeLeft / 60);
    let breakMins = Math.ceil(breakTimeLeft / 60);

    const brightRed = "#ff1e43";    
    const prominentOrange = "#ff8c00"; 
    const brightGreen = "#00ff66";  

    if (focusMins <= 20) {
        focusDisplay.style.color = brightRed;
    } else if (focusMins <= 40) {
        focusDisplay.style.color = prominentOrange;
    } else {
        focusDisplay.style.color = brightGreen;
    }

    if (breakMins <= 5) {
        breakDisplay.style.color = brightRed;
    } else if (breakMins <= 10) {
        breakDisplay.style.color = prominentOrange;
    } else {
        breakDisplay.style.color = brightGreen;
    }
}

function updateDisplays() {
    focusDisplay.innerHTML = formatTime(focusTimeLeft);
    breakDisplay.innerHTML = formatTime(breakTimeLeft);
    updateDisplayColors();
}

function toggleFocus() {
    initAudio(); 
    if (breakInterval) toggleBreak(); 

    if (focusInterval) {
        clearInterval(focusInterval);
        focusInterval = null;
        focusCard.classList.remove("active-card");
    } else {
        focusCard.classList.add("active-card");
        focusInterval = setInterval(() => {
            if (focusTimeLeft <= 0) {
                clearInterval(focusInterval);
                focusInterval = null;
                focusCard.classList.remove("active-card");
                playBeep('urgent'); 
                showPopup("Focus Session Finished! Time to stretch."); 
            } else {
                focusTimeLeft--;
                
                // Triggers sharp beep at 20 minutes left. No pop-up box.
                if (focusTimeLeft === 20 * 60 && !focusWarningPlayed) {
                    playBeep('soft');
                    focusWarningPlayed = true;
                }
                
                updateDisplays(); 
            }
        }, 1000);
    }
}

function toggleBreak() {
    initAudio(); 
    if (focusInterval) toggleFocus(); 

    if (breakInterval) {
        clearInterval(breakInterval);
        breakInterval = null;
        breakCard.classList.remove("active-card");
    } else {
        breakCard.classList.add("active-card");
        breakInterval = setInterval(() => {
            if (breakTimeLeft <= 0) {
                clearInterval(breakInterval);
                breakInterval = null;
                breakCard.classList.remove("active-card");
                playBeep('urgent'); 
                showPopup("Break Over! Let's get back to work."); 
            } else {
                breakTimeLeft--;
                
                // Triggers sharp beep at 5 minutes left. No pop-up box.
                if (breakTimeLeft === 5 * 60 && !breakWarningPlayed) {
                    playBeep('soft');
                    breakWarningPlayed = true;
                }
                
                updateDisplays(); 
            }
        }, 1000);
    }
}

function resetFocus(e) {
    if(e) e.stopPropagation(); 
    clearInterval(focusInterval);
    focusInterval = null;
    focusTimeLeft = FOCUS_DEFAULT;
    focusWarningPlayed = false;
    focusCard.classList.remove("active-card");
    updateDisplays();
}

function resetBreak(e) {
    if(e) e.stopPropagation(); 
    clearInterval(breakInterval);
    breakInterval = null;
    breakTimeLeft = BREAK_DEFAULT;
    breakWarningPlayed = false;
    breakCard.classList.remove("active-card");
    updateDisplays();
}

focusDisplay.addEventListener("click", toggleFocus);
breakDisplay.addEventListener("click", toggleBreak);
focusResetBtn.addEventListener("click", resetFocus);
breakResetBtn.addEventListener("click", resetBreak);
closePopupBtn.addEventListener("click", closePopup);

updateDisplays();
