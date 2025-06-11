/**
 * Progress Manager - Handles saving/loading progress and statistics
 */

export class ProgressManager {
    constructor(app) {
        this.app = app;
        this.saveKey = 'coldCallTrainerData';
        this.logsKey = 'coldCallLogs';
    }
    
    loadProgress() {
        try {
            const saved = localStorage.getItem(this.saveKey);
            if (saved) {
                const data = JSON.parse(saved);
                
                // Load user data
                if (data.user) {
                    this.app.setCurrentUser(data.user);
                }
                
                // Load practice time
                if (data.practiceTime) {
                    this.app.totalPracticeTime = data.practiceTime;
                }
                
                // Load module states
                if (data.modules) {
                    Object.assign(this.app.moduleManager.modules, data.modules);
                }
                
                console.log('💾 Progress loaded:', data);
                return data;
            }
        } catch (error) {
            console.error('Failed to load progress:', error);
        }
        
        return { modules: {}, progress: {}, practiceTime: 0 };
    }
    
    saveProgress() {
        try {
            const saveData = {
                modules: this.app.moduleManager.modules,
                progress: this.app.moduleManager.moduleProgress,
                practiceTime: this.app.totalPracticeTime,
                user: this.app.getCurrentUser(),
                lastSaved: new Date().toISOString()
            };
            
            localStorage.setItem(this.saveKey, JSON.stringify(saveData));
            console.log('💾 Progress saved:', saveData);
            
            return true;
        } catch (error) {
            console.error('Failed to save progress:', error);
            return false;
        }
    }
    
    resetAll() {
        try {
            // Reset modules to initial state
            this.app.moduleManager.resetAllModules();
            
            // Reset practice time
            this.app.totalPracticeTime = 0;
            
            // Clear user manager usage tracking
            if (this.app.userManager) {
                this.app.userManager.usageTracking = {
                    sessionTime: 0,
                    totalUsage: 0,
                    lastReset: null
                };
            }
            
            // Save the reset state
            this.saveProgress();
            
            // Update UI
            this.app.uiManager.updateModuleUI();
            this.app.uiManager.updateProgressStats();
            
            console.log('🔄 All progress reset');
            return true;
        } catch (error) {
            console.error('Failed to reset progress:', error);
            return false;
        }
    }
    
    exportProgress() {
        try {
            const data = {
                ...this.loadProgress(),
                exportDate: new Date().toISOString(),
                version: '2.0.0'
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `cold-call-trainer-progress-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return true;
        } catch (error) {
            console.error('Failed to export progress:', error);
            return false;
        }
    }
    
    importProgress(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // Validate data structure
                    if (!this.validateProgressData(data)) {
                        reject(new Error('Invalid progress data format'));
                        return;
                    }
                    
                    // Import the data
                    localStorage.setItem(this.saveKey, JSON.stringify(data));
                    
                    // Reload the application state
                    location.reload();
                    
                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            };
            reader.readAsText(file);
        });
    }
    
    validateProgressData(data) {
        // Basic validation of imported data
        if (!data || typeof data !== 'object') return false;
        
        const requiredFields = ['modules', 'progress', 'practiceTime'];
        return requiredFields.every(field => field in data);
    }
    
    getStatistics() {
        const data = this.loadProgress();
        const logs = this.getLogs();
        
        const stats = {
            totalSessions: logs.filter(log => log.action === 'user_registered').length,
            totalCalls: logs.filter(log => log.action === 'call_ended').length,
            completedModules: logs.filter(log => log.action === 'module_completed').length,
            totalPracticeTime: Math.floor((data.practiceTime || 0) / (1000 * 60)), // in minutes
            moduleStats: this.getModuleStatistics(data.modules || {}),
            recentActivity: logs.slice(-10), // Last 10 activities
            streaks: this.calculateStreaks(logs),
            averageSessionTime: this.calculateAverageSessionTime(logs)
        };
        
        return stats;
    }
    
    getModuleStatistics(modules) {
        const moduleStats = {};
        
        Object.entries(modules).forEach(([moduleId, module]) => {
            moduleStats[moduleId] = {
                unlocked: module.unlocked || false,
                marathonCompleted: module.marathonCompleted || false,
                legendCompleted: module.legendCompleted || false,
                practiceTime: 0, // Would need to track per-module time
                attempts: 0 // Would need to track attempts
            };
        });
        
        return moduleStats;
    }
    
    calculateStreaks(logs) {
        const dailyActivity = {};
        
        logs.forEach(log => {
            const date = new Date(log.timestamp).toDateString();
            dailyActivity[date] = true;
        });
        
        const dates = Object.keys(dailyActivity).sort();
        let currentStreak = 0;
        let maxStreak = 0;
        let lastDate = null;
        
        dates.forEach(date => {
            const currentDate = new Date(date);
            
            if (lastDate) {
                const daysDiff = (currentDate - lastDate) / (1000 * 60 * 60 * 24);
                
                if (daysDiff === 1) {
                    currentStreak++;
                } else {
                    maxStreak = Math.max(maxStreak, currentStreak);
                    currentStreak = 1;
                }
            } else {
                currentStreak = 1;
            }
            
            lastDate = currentDate;
        });
        
        maxStreak = Math.max(maxStreak, currentStreak);
        
        return {
            current: currentStreak,
            longest: maxStreak
        };
    }
    
    calculateAverageSessionTime(logs) {
        const sessionStarts = logs.filter(log => log.action === 'module_started');
        const sessionEnds = logs.filter(log => log.action === 'call_ended');
        
        if (sessionStarts.length === 0 || sessionEnds.length === 0) return 0;
        
        let totalSessionTime = 0;
        let sessionCount = 0;
        
        sessionStarts.forEach((start, index) => {
            const correspondingEnd = sessionEnds.find(end => 
                new Date(end.timestamp) > new Date(start.timestamp) &&
                end.module === start.module
            );
            
            if (correspondingEnd) {
                const sessionTime = new Date(correspondingEnd.timestamp) - new Date(start.timestamp);
                totalSessionTime += sessionTime;
                sessionCount++;
            }
        });
        
        return sessionCount > 0 ? Math.floor(totalSessionTime / (sessionCount * 1000 * 60)) : 0; // Average in minutes
    }
    
    getLogs() {
        try {
            return JSON.parse(localStorage.getItem(this.logsKey) || '[]');
        } catch (error) {
            console.error('Failed to load logs:', error);
            return [];
        }
    }
    
    clearLogs() {
        try {
            localStorage.removeItem(this.logsKey);
            console.log('📊 Activity logs cleared');
            return true;
        } catch (error) {
            console.error('Failed to clear logs:', error);
            return false;
        }
    }
    
    // Backup and restore functionality
    createBackup() {
        const backupData = {
            progress: this.loadProgress(),
            logs: this.getLogs(),
            backup_date: new Date().toISOString(),
            app_version: '2.0.0'
        };
        
        return backupData;
    }
    
    restoreFromBackup(backupData) {
        try {
            if (!backupData || !backupData.progress) {
                throw new Error('Invalid backup data');
            }
            
            // Restore progress
            localStorage.setItem(this.saveKey, JSON.stringify(backupData.progress));
            
            // Restore logs if available
            if (backupData.logs) {
                localStorage.setItem(this.logsKey, JSON.stringify(backupData.logs));
            }
            
            console.log('🔄 Backup restored successfully');
            return true;
        } catch (error) {
            console.error('Failed to restore backup:', error);
            return false;
        }
    }
    
    // Data migration for version updates
    migrateData(fromVersion, toVersion) {
        console.log(`🔄 Migrating data from ${fromVersion} to ${toVersion}`);
        
        const data = this.loadProgress();
        
        // Example migration logic (would be version-specific)
        if (fromVersion === '1.0.0' && toVersion === '2.0.0') {
            // Add new fields, restructure data, etc.
            data.version = '2.0.0';
            data.migrated = new Date().toISOString();
        }
        
        // Save migrated data
        localStorage.setItem(this.saveKey, JSON.stringify(data));
        
        return true;
    }
    
    // Storage quota management
    checkStorageQuota() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            return navigator.storage.estimate().then(estimate => {
                const used = estimate.usage || 0;
                const quota = estimate.quota || 0;
                const percentUsed = quota > 0 ? (used / quota) * 100 : 0;
                
                return {
                    used: used,
                    quota: quota,
                    percentUsed: percentUsed,
                    available: quota - used
                };
            });
        }
        
        return Promise.resolve(null);
    }
    
    cleanupOldData() {
        try {
            const logs = this.getLogs();
            
            // Keep only last 1000 log entries
            if (logs.length > 1000) {
                const trimmedLogs = logs.slice(-1000);
                localStorage.setItem(this.logsKey, JSON.stringify(trimmedLogs));
                console.log(`📊 Cleaned up ${logs.length - 1000} old log entries`);
            }
            
            // Remove temporary data older than 7 days
            const tempKeys = Object.keys(localStorage).filter(key => key.startsWith('temp_'));
            const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            
            tempKeys.forEach(key => {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data.timestamp && data.timestamp < weekAgo) {
                        localStorage.removeItem(key);
                        console.log(`🗑️ Removed old temporary data: ${key}`);
                    }
                } catch (e) {
                    // If we can't parse it, remove it
                    localStorage.removeItem(key);
                }
            });
            
            return true;
        } catch (error) {
            console.error('Failed to cleanup old data:', error);
            return false;
        }
    }
}