/**
 * Cold Call Roleplay Trainer - Core Application Class
 * Updated with Supabase and Resend integration
 */

import { UserManager } from './modules/usermanager.js';
import { ModuleManager } from './modules/modulemanager.js';
import { CallManager } from './modules/callmanager.js';
import { SpeechManager } from './modules/speechmanager.js';
import { CharacterManager } from './modules/charactermanager.js';
import { UIManager } from './modules/uimanager.js';
import { ProgressManager } from './modules/progressmanager.js';
import { AudioManager } from './modules/audiomanager.js';

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
            this.uiManager.updateModuleUI();
            
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
            
            // Cleanup on page unload
            this.userManager.cleanup();
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
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
        
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
            case 'Enter':
                // Enter key shortcuts for verification form
                if (document.getElementById('verificationForm')) {
                    e.preventDefault();
                    this.verifyEmailCode();
                }
                break;
        }
    }
    
    // Public API methods for global functions
    startTraining() {
        return this.userManager.startTraining();
    }
    
    verifyEmailCode() {
        return this.userManager.verifyEmailCode();
    }
    
    resendVerificationCode() {
        return this.userManager.resendVerificationCode();
    }
    
    showRegistrationForm() {
        return this.userManager.showRegistrationForm();
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
    
    // Enhanced activity logging
    logActivity(action, data = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            action,
            user: this.currentUser?.firstName || 'Anonymous',
            userId: this.currentUser?.id || null,
            sessionId: this.userManager?.verificationState?.pendingUser?.sessionId || null,
            ...data
        };
        
        console.log('📊 Activity:', logEntry);
        
        try {
            // Store locally
            const logs = JSON.parse(localStorage.getItem('coldCallLogs') || '[]');
            logs.push(logEntry);
            
            // Keep only last 1000 entries
            if (logs.length > 1000) {
                logs.splice(0, logs.length - 1000);
            }
            
            localStorage.setItem('coldCallLogs', JSON.stringify(logs));
            
            // TODO: Send to Supabase activity_logs table
            this.sendActivityToDatabase(logEntry);
            
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    }
    
    async sendActivityToDatabase(logEntry) {
        // Only send if user is logged in
        if (!this.currentUser?.id) return;
        
        try {
            // This would be implemented with a Supabase API call
            // For now, we'll just log it
            console.log('📊 Would send to database:', logEntry);
        } catch (error) {
            console.error('Failed to send activity to database:', error);
        }
    }
    
    // Health check method
    async checkSystemHealth() {
        try {
            const response = await fetch('/api/health');
            const health = await response.json();
            
            console.log('🏥 System health:', health);
            
            if (health.status !== 'OK') {
                this.uiManager.showWarning('Some features may not be available. Please refresh if you experience issues.');
            }
            
            return health;
        } catch (error) {
            console.error('Health check failed:', error);
            return { status: 'ERROR', error: error.message };
        }
    }
}

// Global app instance
let app;

// Global Functions for HTML onclick handlers
window.startTraining = function() {
    app?.startTraining();
};

window.verifyEmailCode = function() {
    app?.verifyEmailCode();
};

window.resendVerificationCode = function() {
    app?.resendVerificationCode();
};

window.showRegistrationForm = function() {
    app?.showRegistrationForm();
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

// Enhanced debug functions
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

window.checkSystemHealth = function() {
    if (!app) {
        console.log('App not initialized yet');
        return;
    }
    return app.checkSystemHealth();
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Cold Call Roleplay Trainer Loading...');
    
    // Browser compatibility check
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn('⚠️ Speech recognition not supported');
        // Show compatibility notice
        const notice = document.createElement('div');
        notice.innerHTML = `
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px; border-radius: 8px; color: #856404;">
                <strong>⚠️ Speech Recognition Not Supported</strong><br>
                Your browser doesn't support speech recognition. You can still use the app, but voice features won't work.
                Please use Chrome, Edge, or Safari for the best experience.
            </div>
        `;
        document.body.insertBefore(notice, document.body.firstChild);
    }
    
    // Initialize the main application
    app = new ColdCallTrainer();
    
    // Mobile optimizations
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
        console.log('📱 Mobile device detected - applying optimizations');
        document.body.classList.add('mobile-device');
        
        // Add mobile-specific styles
        const mobileStyles = document.createElement('style');
        mobileStyles.textContent = `
            .mobile-device .user-form {
                padding: 15px;
            }
            .mobile-device input, .mobile-device select, .mobile-device textarea {
                font-size: 16px; /* Prevents zoom on iOS */
            }
            .mobile-device .verification-form input[type="text"] {
                font-size: 18px;
            }
        `;
        document.head.appendChild(mobileStyles);
    }
    
    // Perform health check
    setTimeout(() => {
        app.checkSystemHealth();
    }, 2000);
    
    console.log('✅ Cold Call Roleplay Trainer Loaded Successfully!');
});

// Enhanced error boundary
window.addEventListener('error', function(event) {
    console.error('❌ Unhandled error:', event.error);
    if (app) {
        app.uiManager.showError('An unexpected error occurred. Please refresh if issues persist.');
        
        // Log error to activity system
        app.logActivity('error_occurred', {
            error: event.error?.message || 'Unknown error',
            stack: event.error?.stack,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
        });
    }
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('❌ Unhandled promise rejection:', event.reason);
    if (app) {
        app.uiManager.showError('Connection or processing error. Please try again.');
        
        // Log promise rejection to activity system
        app.logActivity('promise_rejection', {
            reason: event.reason?.message || 'Unknown promise rejection',
            stack: event.reason?.stack
        });
    }
});

// Export for testing
export { ColdCallTrainer };