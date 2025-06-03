/**
 * Cold Call Roleplay Trainer - Core Application Class
 * Main application orchestrator and state management
 */

import { UserManager } from './usermanager.js';
import { ModuleManager } from './module-manager.js';
import { CallManager } from './call-manager.js';
import { SpeechManager } from './speech-manager.js';
import { CharacterManager } from './character-manager.js';
import { UIManager } from './ui-manager.js';
import { ProgressManager } from './progress-manager.js';
import { AudioManager } from './audiomanager.js';

// Global Application State
class ColdCallTrainer {
    constructor() {
        // Core state
        this.currentUser = null;
        this.currentModule = null;
        this.currentMode = null;
        this.currentProgress = 0;
        this.maxProgress = 10;
        this.isCallActive = false;
        this.callStartTime = null;
        this.totalPracticeTime = 0;
        
        // Initialize managers
        this.userManager = new UserManager(this);
        this.moduleManager = new ModuleManager(this);
        this.callManager = new CallManager(this);
        this.speechManager = new SpeechManager(this);
        this.characterManager = new CharacterManager(this);
        this.uiManager = new UIManager(this);
        this.progressManager = new ProgressManager(this);
        this.audioManager = new AudioManager(this);
        
        this.init();
    }
    
    async init() {
        console.log('🎯 Cold Call Trainer initializing...');
        
        try {
            // Initialize all managers
            await this.audioManager.init();
            await this.speechManager.init();
            this.uiManager.init();
            this.characterManager.init();
            this.moduleManager.init();
            this.progressManager.loadProgress();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Update UI
            this.uiManager.updateUI();
            
            console.log('✅ Cold Call Trainer initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            this.uiManager.showError('Failed to initialize application. Please refresh the page.');
        }
    }
    
    setupEventListeners() {
        // Window events
        window.addEventListener('beforeunload', (e) => {
            if (this.isCallActive) {
                e.preventDefault();
                e.returnValue = 'You have an active call. Are you sure you want to leave?';
            }
        });
        
        // Visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.speechManager.isRecording) {
                this.speechManager.stopListening();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
        
        // Online/offline status
        window.addEventListener('online', () => {
            this.uiManager.showSuccess('Connection restored');
        });
        
        window.addEventListener('offline', () => {
            this.uiManager.showError('Connection lost - some features may not work');
        });
    }
    
    handleKeyboardShortcuts(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        
        switch (e.code) {
            case 'Space':
                e.preventDefault();
                if (this.isCallActive && !this.speechManager.continuousListening) {
                    this.speechManager.toggleListening();
                }
                break;
            case 'Escape':
                if (this.isCallActive) {
                    this.callManager.endCall();
                } else {
                    this.uiManager.showModuleDashboard();
                }
                break;
        }
    }
    
    // Public API methods for global functions
    startTraining() {
        return this.userManager.startTraining();
    }
    
    startModule(moduleId, mode) {
        return this.moduleManager.startModule(moduleId, mode);
    }
    
    endCall() {
        return this.callManager.endCall();
    }
    
    toggleMute() {
        return this.callManager.toggleMute();
    }
    
    toggleSpeaker() {
        return this.callManager.toggleSpeaker();
    }
    
    showKeypad() {
        return this.callManager.showKeypad();
    }
    
    closeFeedbackModal() {
        return this.uiManager.closeFeedbackModal();
    }
    
    nextCall() {
        return this.callManager.nextCall();
    }
    
    hideUnlockNotice() {
        return this.uiManager.hideUnlockNotice();
    }
    
    // State getters
    getCurrentUser() {
        return this.currentUser;
    }
    
    getCurrentModule() {
        return this.currentModule;
    }
    
    getCurrentMode() {
        return this.currentMode;
    }
    
    getCurrentProgress() {
        return this.currentProgress;
    }
    
    getMaxProgress() {
        return this.maxProgress;
    }
    
    isInCall() {
        return this.isCallActive;
    }
    
    // State setters
    setCurrentUser(user) {
        this.currentUser = user;
    }
    
    setCurrentModule(moduleId) {
        this.currentModule = moduleId;
    }
    
    setCurrentMode(mode) {
        this.currentMode = mode;
    }
    
    setCurrentProgress(progress) {
        this.currentProgress = progress;
    }
    
    setMaxProgress(maxProgress) {
        this.maxProgress = maxProgress;
    }
    
    setCallActive(active) {
        this.isCallActive = active;
    }
    
    setCallStartTime(time) {
        this.callStartTime = time;
    }
    
    // Utility methods
    logActivity(action, data = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            action,
            user: this.currentUser?.name || 'Anonymous',
            ...data
        };
        
        console.log('📊 Activity:', logEntry);
        
        try {
            const logs = JSON.parse(localStorage.getItem('coldCallLogs') || '[]');
            logs.push(logEntry);
            
            // Keep only last 1000 entries
            if (logs.length > 1000) {
                logs.splice(0, logs.length - 1000);
            }
            
            localStorage.setItem('coldCallLogs', JSON.stringify(logs));
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    }
}

// Global app instance
let app;

// Global Functions for HTML onclick handlers
window.startTraining = function() {
    app?.startTraining();
};

window.startModule = function(moduleId, mode) {
    app?.startModule(moduleId, mode);
};

window.endCall = function() {
    app?.endCall();
};

window.toggleMute = function() {
    app?.toggleMute();
};

window.toggleSpeaker = function() {
    app?.toggleSpeaker();
};

window.showKeypad = function() {
    app?.showKeypad();
};

window.closeFeedbackModal = function() {
    app?.closeFeedbackModal();
};

window.nextCall = function() {
    app?.nextCall();
};

window.hideUnlockNotice = function() {
    app?.hideUnlockNotice();
};

// Debug functions
window.debugModuleStates = function() {
    if (!app) {
        console.log('App not initialized yet');
        return;
    }
    app.moduleManager.debugStates();
};

window.forceUnlockModule = function(moduleId) {
    if (!app) {
        console.log('App not initialized yet');
        return;
    }
    app.moduleManager.forceUnlock(moduleId);
};

window.resetAllProgress = function() {
    if (!app) {
        console.log('App not initialized yet');
        return;
    }
    app.progressManager.resetAll();
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Cold Call Roleplay Trainer Loading...');
    
    // Browser compatibility check
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn('⚠️ Speech recognition not supported');
        // Show compatibility notice
    }
    
    // Initialize the main application
    app = new ColdCallTrainer();
    
    // Mobile optimizations
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
        console.log('📱 Mobile device detected - applying optimizations');
        // Apply mobile-specific optimizations
    }
    
    console.log('✅ Cold Call Roleplay Trainer Loaded Successfully!');
});

// Error boundary
window.addEventListener('error', function(event) {
    console.error('❌ Unhandled error:', event.error);
    if (app) {
        app.uiManager.showError('An unexpected error occurred. Please refresh if issues persist.');
    }
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('❌ Unhandled promise rejection:', event.reason);
    if (app) {
        app.uiManager.showError('Connection or processing error. Please try again.');
    }
});

// Export for testing
export { ColdCallTrainer };