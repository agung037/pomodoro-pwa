// DOM Elements
// Timer elements
const minutesDisplay = document.getElementById('minutes');
const secondsDisplay = document.getElementById('seconds');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const pomodoroBtn = document.getElementById('pomodoro-btn');
const shortBreakBtn = document.getElementById('short-break-btn');
const longBreakBtn = document.getElementById('long-break-btn');

// Music player elements
const musicSelector = document.getElementById('music-selector');
const playBtn = document.getElementById('play-btn');
const pauseMusicBtn = document.getElementById('pause-music-btn');
const volumeControl = document.getElementById('volume-control');

// Theme toggle element
const themeBtn = document.getElementById('theme-btn');

// Session counter element
const sessionCount = document.getElementById('session-count');

// Timer variables
let timer;
let minutes = 25;
let seconds = 0;
let isRunning = false;
let totalSessions = 0;

// Audio object for background music
const audio = new Audio();

// Timer mode durations in minutes
const POMODORO_TIME = 25;
const SHORT_BREAK_TIME = 5;
const LONG_BREAK_TIME = 15;

// Current mode
let currentMode = 'pomodoro';

// Initialize the app
function init() {
    // Set initial timer display
    updateTimerDisplay();
    
    // Load saved session count from local storage
    loadSessionCount();
    
    // Set initial theme
    loadTheme();
    
    // Add event listeners
    addEventListeners();
    
    // Check for notification permission
    checkNotificationPermission();
}

// Update the timer display with current minutes and seconds
function updateTimerDisplay() {
    minutesDisplay.textContent = minutes < 10 ? `0${minutes}` : minutes;
    secondsDisplay.textContent = seconds < 10 ? `0${seconds}` : seconds;
    
    // Update document title to show current timer
    document.title = `${minutesDisplay.textContent}:${secondsDisplay.textContent} - Pomodoro Timer`;
}

// Start the timer
function startTimer() {
    if (isRunning) return;
    
    isRunning = true;
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    
    // Add pulse animation to timer display
    document.querySelector('.timer-display').classList.add('pulse');
    
    timer = setInterval(() => {
        // Decrease seconds
        if (seconds > 0) {
            seconds--;
        } else if (minutes > 0) {
            // If seconds is 0 and minutes > 0, decrease minutes and set seconds to 59
            minutes--;
            seconds = 59;
        } else {
            // Timer complete
            clearInterval(timer);
            timerComplete();
            return;
        }
        
        // Update the display
        updateTimerDisplay();
    }, 1000);
}

// Pause the timer
function pauseTimer() {
    if (!isRunning) return;
    
    clearInterval(timer);
    isRunning = false;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    
    // Remove pulse animation
    document.querySelector('.timer-display').classList.remove('pulse');
}

// Reset the timer based on current mode
function resetTimer() {
    pauseTimer();
    
    // Set timer based on current mode
    if (currentMode === 'pomodoro') {
        minutes = POMODORO_TIME;
    } else if (currentMode === 'shortBreak') {
        minutes = SHORT_BREAK_TIME;
    } else {
        minutes = LONG_BREAK_TIME;
    }
    
    seconds = 0;
    updateTimerDisplay();
}

// Handle timer completion
function timerComplete() {
    isRunning = false;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    
    // Remove pulse animation
    document.querySelector('.timer-display').classList.remove('pulse');
    
    // If it was a pomodoro session, increment the session count
    if (currentMode === 'pomodoro') {
        incrementSessionCount();
    }
    
    // Play notification sound
    playNotificationSound();
    
    // Show notification
    showNotification();
    
    // Reset timer
    resetTimer();
}

// Play notification sound when timer completes
function playNotificationSound() {
    const notificationSound = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'+Array(20).join('AAAAAAAA'));
    notificationSound.play().catch(error => console.error('Error playing notification sound:', error));
}

// Show notification when timer completes
function showNotification() {
    // Check if the browser supports notifications and permission is granted
    if ('Notification' in window && Notification.permission === 'granted') {
        let title, body;
        
        if (currentMode === 'pomodoro') {
            title = 'Pomodoro Complete!';
            body = 'Time for a break!';
        } else {
            title = 'Break Complete!';
            body = 'Ready to focus again?';
        }
        
        // Create and show the notification
        const notification = new Notification(title, {
            body: body,
            icon: 'tomato.png'
        });
        
        // Close the notification after 5 seconds
        setTimeout(() => {
            notification.close();
        }, 5000);
    }
}

// Check for notification permission and request if needed
function checkNotificationPermission() {
    if ('Notification' in window) {
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            // Request permission for notifications
            Notification.requestPermission();
        }
    }
}

// Increment session count and save to local storage
function incrementSessionCount() {
    totalSessions++;
    sessionCount.textContent = totalSessions;
    
    // Save to local storage
    localStorage.setItem('pomodoroSessions', totalSessions);
}

// Load session count from local storage
function loadSessionCount() {
    const savedSessions = localStorage.getItem('pomodoroSessions');
    if (savedSessions) {
        totalSessions = parseInt(savedSessions);
        sessionCount.textContent = totalSessions;
    }
}

// Switch timer mode (pomodoro, short break, long break)
function switchMode(mode) {
    // Remove active class from all mode buttons
    pomodoroBtn.classList.remove('active');
    shortBreakBtn.classList.remove('active');
    longBreakBtn.classList.remove('active');
    
    // Update current mode and reset timer
    currentMode = mode;
    
    // Set minutes based on selected mode
    if (mode === 'pomodoro') {
        minutes = POMODORO_TIME;
        pomodoroBtn.classList.add('active');
    } else if (mode === 'shortBreak') {
        minutes = SHORT_BREAK_TIME;
        shortBreakBtn.classList.add('active');
    } else {
        minutes = LONG_BREAK_TIME;
        longBreakBtn.classList.add('active');
    }
    
    // Reset seconds and timer state
    seconds = 0;
    
    // If timer is running, stop it
    if (isRunning) {
        clearInterval(timer);
        isRunning = false;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    }
    
    // Update timer display
    updateTimerDisplay();
    
    // Remove pulse animation
    document.querySelector('.timer-display').classList.remove('pulse');
}

// Handle music selection
function handleMusicSelection() {
    const selectedMusic = musicSelector.value;
    
    if (selectedMusic) {
        // Set the audio source
        audio.src = selectedMusic;
        audio.loop = true;
        
        // Set volume
        audio.volume = volumeControl.value;
        
        // Enable play/pause buttons
        playBtn.disabled = false;
        pauseMusicBtn.disabled = true;
    } else {
        // Pause any playing music
        audio.pause();
        
        // Disable play/pause buttons
        playBtn.disabled = true;
        pauseMusicBtn.disabled = true;
    }
}

// Play selected music
function playMusic() {
    audio.play()
        .then(() => {
            playBtn.disabled = true;
            pauseMusicBtn.disabled = false;
        })
        .catch(error => {
            console.error('Error playing audio:', error);
            alert('Could not play the selected music. Please try again.');
        });
}

// Pause currently playing music
function pauseMusic() {
    audio.pause();
    playBtn.disabled = false;
    pauseMusicBtn.disabled = true;
}

// Adjust volume
function adjustVolume() {
    audio.volume = volumeControl.value;
}

// Toggle between light and dark theme
function toggleTheme() {
    const body = document.body;
    
    if (body.classList.contains('dark-theme')) {
        // Switch to light theme
        body.classList.remove('dark-theme');
        themeBtn.textContent = '🌙';
        localStorage.setItem('theme', 'light');
    } else {
        // Switch to dark theme
        body.classList.add('dark-theme');
        themeBtn.textContent = '☀️';
        localStorage.setItem('theme', 'dark');
    }
}

// Load theme from local storage
function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeBtn.textContent = '☀️';
    }
}

// Add all event listeners
function addEventListeners() {
    // Timer control buttons
    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);
    
    // Timer mode buttons
    pomodoroBtn.addEventListener('click', () => switchMode('pomodoro'));
    shortBreakBtn.addEventListener('click', () => switchMode('shortBreak'));
    longBreakBtn.addEventListener('click', () => switchMode('longBreak'));
    
    // Music player controls
    musicSelector.addEventListener('change', handleMusicSelection);
    playBtn.addEventListener('click', playMusic);
    pauseMusicBtn.addEventListener('click', pauseMusic);
    volumeControl.addEventListener('input', adjustVolume);
    
    // Theme toggle
    themeBtn.addEventListener('click', toggleTheme);
}

// Save user preferences to IndexedDB for better offline support
function setupIndexedDB() {
    // Check if IndexedDB is supported
    if (!('indexedDB' in window)) {
        console.warn('IndexedDB not supported - some offline features might not work');
        return;
    }
    
    // Open/create the database
    const request = indexedDB.open('PomodoroAppDB', 1);
    
    // Handle database upgrade (first time creation or version upgrade)
    request.onupgradeneeded = function(event) {
        const db = event.target.result;
        
        // Create an object store (table) for user preferences
        if (!db.objectStoreNames.contains('preferences')) {
            db.createObjectStore('preferences', { keyPath: 'id' });
        }
    };
    
    // Handle success
    request.onsuccess = function(event) {
        console.log('IndexedDB initialized successfully');
    };
    
    // Handle errors
    request.onerror = function(event) {
        console.error('IndexedDB initialization error:', event.target.error);
    };
}

// Save app state to IndexedDB for better offline experience
function saveAppState() {
    const request = indexedDB.open('PomodoroAppDB', 1);
    
    request.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction(['preferences'], 'readwrite');
        const store = transaction.objectStore('preferences');
        
        // Save current app state
        const state = {
            id: 'appState',
            minutes: minutes,
            seconds: seconds,
            isRunning: isRunning,
            currentMode: currentMode,
            totalSessions: totalSessions,
            theme: document.body.classList.contains('dark-theme') ? 'dark' : 'light'
        };
        
        store.put(state);
    };
}

// Load app state from IndexedDB
function loadAppState() {
    const request = indexedDB.open('PomodoroAppDB', 1);
    
    request.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction(['preferences'], 'readonly');
        const store = transaction.objectStore('preferences');
        
        const getState = store.get('appState');
        
        getState.onsuccess = function(event) {
            const state = event.target.result;
            
            if (state) {
                // Restore timer state
                minutes = state.minutes;
                seconds = state.seconds;
                currentMode = state.currentMode;
                totalSessions = state.totalSessions;
                
                // Update display
                updateTimerDisplay();
                sessionCount.textContent = totalSessions;
                
                // Restore theme
                if (state.theme === 'dark') {
                    document.body.classList.add('dark-theme');
                    themeBtn.textContent = '☀️';
                }
                
                // Restore active mode button
                switchMode(currentMode);
            }
        };
    };
}

// Check if the app is online
function isOnline() {
    return navigator.onLine;
}

// Add online/offline event listeners
window.addEventListener('online', function() {
    console.log('App is online');
    // You can add UI indicators for online status here
});

window.addEventListener('offline', function() {
    console.log('App is offline');
    // You can add UI indicators for offline status here
});

// Setup regular saving of app state
function setupAutoSave() {
    // Save app state every 30 seconds
    setInterval(saveAppState, 30000);
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    init();
    setupIndexedDB();
    loadAppState();
    setupAutoSave();
    
    // Disable the pause button initially
    pauseBtn.disabled = true;
}); 