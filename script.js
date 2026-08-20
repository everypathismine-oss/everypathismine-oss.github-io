const FOCUS_DEFAULT = 100 * 60;
const BREAK_DEFAULT = 20 * 60;

let focusTimeLeft = FOCUS_DEFAULT;
let breakTimeLeft = BREAK_DEFAULT;

let focusInterval = null;
let breakInterval = null;

let focusWarningPlayed = false;
let breakWarningPlayed = false;

let audioCtx = null;
let activeHarshAlarmNode = null;

// New variable to hold the screen awake lock
let wakeLock = null;

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

// Automatically stops your phone from locking its screen
async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
        }
    } catch (err) {
        // Screen stay-awake not supported or blocked
    }
}

// Lets your phone go back to sleeping normally
function releaseWakeLock() {
    if (wakeLock !== null) {
        wakeLock.release();
        wakeLock = null;
    }
}

function playSoftWarning() {
    initAudio(); 
    if (!audioCtx) return;
    
    let now = audioCtx.currentTime;
    [0, 0.15].forEach(delay => {
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.type = 'triangle'; 
        osc.frequency.setValueAtTime(1200, now + delay); 
        gain.gain.setValueAtTime(0.4, now + delay); 
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.08); 
    });
}

function startHarshAlarm() {
    initAudio();
    if (!audioCtx) return;
    stopHarshAlarm();

    activeHarshAlarmNode = audioCtx.createOscillator();
    let gainNode = audioCtx.createGain();
    activeHarshAlarmNode.type = 'square'; 
    activeHarshAlarmNode.frequency.setValueAtTime(950, audioCtx.currentTime); 
    gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime);

    activeHarshAlarmNode.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    activeHarshAlarmNode.start();
}

function stopHarshAlarm() {
    if (activeHarshAlarmNode) {
        try {
            activeHarshAlarmNode.stop();
            activeHarshAlarmNode.disconnect();
        } catch (e) {}
        activeHarshAlarmNode = null;
    }
}

function showPopup(text) {
    popupMessage.innerHTML = text;
    customPopup.classList.remove("popup-hidden");
}

function closePopup() {
    customPopup.classList.add("popup-hidden");
    stopHarshAlarm(); 
    releaseWakeLock(); // Let the screen rest now
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

function toggleFocus(e) {
    if (e) e.preventDefault(); 
    initAudio(); 
    if (breakInterval) toggleBreak(); 

    if (focusInterval) {
        clearInterval(focusInterval);
        focusInterval = null;
        focusCard.classList.remove("active-card");
        releaseWakeLock(); // Allow screen sleep on pause
    } else {
        focusCard.classList.add("active-card");
        requestWakeLock(); // Lock screen awake on start!
        focusInterval = setInterval(() => {
            if (focusTimeLeft <= 0) {
                clearInterval(focusInterval);
                focusInterval = null;
                focusCard.classList.remove("active-card");
                startHarshAlarm(); 
                showPopup("Focus Session Finished! Time to stretch."); 
            } else {
                focusTimeLeft--;
                if (focusTimeLeft === 20 * 60 && !focusWarningPlayed) {
                    playSoftWarning();
                    focusWarningPlayed = true;
                }
                updateDisplays(); 
            }
        }, 1000);
    }
}

function toggleBreak(e) {
    if (e) e.preventDefault(); 
    initAudio(); 
    if (focusInterval) toggleFocus(); 

    if (breakInterval) {
        clearInterval(breakInterval);
        breakInterval = null;
        breakCard.classList.remove("active-card");
        releaseWakeLock(); // Allow screen sleep on pause
    } else {
        breakCard.classList.add("active-card");
        requestWakeLock(); // Lock screen awake on start!
        breakInterval = setInterval(() => {
            if (breakTimeLeft <= 0) {
                clearInterval(breakInterval);
                breakInterval = null;
                breakCard.classList.remove("active-card");
                startHarshAlarm(); 
                showPopup("Break Over! Let's get back to work."); 
            } else {
                breakTimeLeft--;
                if (breakTimeLeft === 5 * 60 && !breakWarningPlayed) {
                    playSoftWarning();
                    breakWarningPlayed = true;
                }
                updateDisplays(); 
            }
        }, 1000);
    }
}

function resetFocus(e) {
    if(e) {
        e.preventDefault();
        e.stopPropagation(); 
    }
    clearInterval(focusInterval);
    focusInterval = null;
    focusTimeLeft = FOCUS_DEFAULT;
    focusWarningPlayed = false;
    focusCard.classList.remove("active-card");
    stopHarshAlarm(); 
    releaseWakeLock();
    updateDisplays();
}

function resetBreak(e) {
    if(e) {
        e.preventDefault();
        e.stopPropagation(); 
    }
    clearInterval(breakInterval);
    breakInterval = null;
    breakTimeLeft = BREAK_DEFAULT;
    breakWarningPlayed = false;
    breakCard.classList.remove("active-card");
    stopHarshAlarm(); 
    releaseWakeLock();
    updateDisplays();
}

const touchEvent = 'ontouchstart' in window ? 'touchstart' : 'click';

focusDisplay.addEventListener(touchEvent, toggleFocus);
breakDisplay.addEventListener(touchEvent, toggleBreak);
focusResetBtn.addEventListener(touchEvent, resetFocus);
breakResetBtn.addEventListener(touchEvent, resetBreak);
closePopupBtn.addEventListener(touchEvent, function(e) {
    if (e) e.preventDefault();
    closePopup();
});

updateDisplays();
