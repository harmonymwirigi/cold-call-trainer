/**
 * Module Manager - Handles module progression, unlocking, and state management
 */

export class ModuleManager {
    constructor(app) {
        this.app = app;
        this.modules = {};
        this.moduleProgress = {};
    }
    
    init() {
        this.modules = this.initializeModules();
        this.moduleProgress = this.app.progressManager.loadProgress().modules || {};
        console.log('📚 Module Manager initialized');
    }
    
    initializeModules() {
        return {
            opener: {
                id: 'opener',
                name: 'Opener + Early Objections',
                description: 'Practice delivering your opener and managing the objection.',
                detailedDescription: 'When you get confident you can do the marathon which is 10 and if you pass then you unlock the Pitch + Objections + Close roleplay for 24 hours.',
                order: 1,
                unlocked: true, // Always available
                marathonCompleted: false,
                legendAvailable: false,
                legendCompleted: false,
                hasMarathon: true,
                hasLegend: true
            },
            pitch: {
                id: 'pitch',
                name: 'Pitch + Objections + Close',
                description: 'Practice delivering your pitch, managing the objections and pushing for the meeting.',
                detailedDescription: 'When you feel confident go for the marathon which is 10 in a row and if you pass you unlock the warm up challenge for 24 hours.',
                order: 2,
                unlocked: false,
                marathonCompleted: false,
                legendAvailable: false,
                legendCompleted: false,
                hasMarathon: true,
                hasLegend: true
            },
            warmup: {
                id: 'warmup',
                name: 'Warm-up Challenge',
                description: 'The warm up challenge is perfect to do before cold calling because you will get a series of questions that you must know for any part of the cold call such as What is your pitch? Respond to early objections I have in a meeting. How do you ask for a meeting? etc.',
                detailedDescription: 'If you pass the challenge you will unlock the Full Cold Call Simulator for 24 hours.',
                order: 3,
                unlocked: false,
                marathonCompleted: false,
                legendAvailable: false,
                legendCompleted: false,
                hasMarathon: false,
                hasLegend: false,
                totalQuestions: 25,
                passingScore: 18
            },
            fullcall: {
                id: 'fullcall',
                name: 'Full Cold Call Simulation',
                description: 'Think you are ready to do an entire cold call and book a meeting. This is a simulation from start to finish.',
                detailedDescription: 'Practice until you book a meeting. When you book a meeting you will unlock The Power Hour Challenge for 24 hours.',
                order: 4,
                unlocked: false,
                marathonCompleted: false,
                legendAvailable: false,
                legendCompleted: false,
                hasMarathon: false,
                hasLegend: false
            },
            powerhour: {
                id: 'powerhour',
                name: 'Power Hour Challenge',
                description: 'How many meetings can you book with 10 calls. The Power Hour Challenge is 10 calls in a row. Are you ready for the challenge?',
                detailedDescription: '',
                order: 5,
                unlocked: false,
                marathonCompleted: false,
                legendAvailable: false,
                legendCompleted: false,
                hasMarathon: false,
                hasLegend: false
            }
        };
    }
    
    startModule(moduleId, mode) {
        const module = this.modules[moduleId];
        if (!module) {
            this.app.uiManager.showError('Module not found.');
            return;
        }
        
        // Check access permissions
        if (!this.app.userManager.hasAccessToModule(moduleId)) {
            this.app.uiManager.showError('You do not have access to this module.');
            return;
        }
        
        if (!module.unlocked) {
            this.app.uiManager.showError('This module is not yet unlocked.');
            return;
        }
        
        // Validate mode availability
        if (mode === 'marathon' && !module.hasMarathon) {
            this.app.uiManager.showError('Marathon mode is not available for this module.');
            return;
        }
        
        if (mode === 'legend') {
            if (!module.hasLegend) {
                this.app.uiManager.showError('Legend mode is not available for this module.');
                return;
            }
            if (!module.legendAvailable) {
                this.app.uiManager.showError('Complete the marathon first to unlock Legend Mode.');
                return;
            }
            if (module.legendCompleted) {
                this.app.uiManager.showError('Legend Mode can only be completed once.');
                return;
            }
        }
        
        // Set up module parameters
        this.app.setCurrentModule(moduleId);
        this.app.setCurrentMode(mode);
        this.app.setCurrentProgress(0);
        
        // Set max progress based on module and mode
        const maxProgress = this.getMaxProgress(moduleId, mode);
        this.app.setMaxProgress(maxProgress);
        
        this.app.logActivity('module_started', { 
            module: moduleId, 
            mode, 
            maxProgress 
        });
        
        // Initialize the call
        this.app.callManager.initializeCall();
    }
    
    getMaxProgress(moduleId, mode) {
        const module = this.modules[moduleId];
        
        switch (mode) {
            case 'marathon':
                return 10;
            case 'legend':
                return moduleId === 'warmup' ? 25 : 18;
            case 'practice':
                return moduleId === 'warmup' ? 25 : 1;
            default:
                return 1;
        }
    }
    
    completeModule(moduleId, mode) {
        const module = this.modules[moduleId];
        if (!module) return;
        
        console.log(`🎯 Completing module: ${moduleId} in ${mode} mode`);
        
        if (mode === 'marathon') {
            module.marathonCompleted = true;
            module.legendAvailable = true;
            
            // Unlock next module based on new order
            this.unlockNextModule(moduleId);
            
            this.app.uiManager.showSuccess(`🎉 Marathon completed! Legend Mode unlocked and next module available.`);
            
        } else if (mode === 'legend') {
            module.legendCompleted = true;
            this.app.uiManager.showSuccess(`🏆 Legend Mode completed! You're a master of ${module.name}!`);
            
        } else if (mode === 'practice') {
            // Handle special cases for practice mode
            if (moduleId === 'warmup') {
                const score = this.app.getCurrentProgress();
                if (score >= module.passingScore) {
                    this.unlockNextModule(moduleId);
                    this.app.uiManager.showSuccess(`🎉 Challenge passed! Score: ${score}/${module.totalQuestions}. Next module unlocked!`);
                } else {
                    this.app.uiManager.showError(`Challenge failed. Score: ${score}/${module.totalQuestions}. Need ${module.passingScore} to pass.`);
                }
            } else {
                // For other modules, practice completion unlocks next module
                this.unlockNextModule(moduleId);
                this.app.uiManager.showSuccess(`🎉 Practice completed! Next module unlocked.`);
            }
        }
        
        // Update progress and save
        this.updateModuleProgress(moduleId, mode);
        this.app.progressManager.saveProgress();
        
        // Update UI
        this.app.uiManager.updateModuleUI();
        this.app.uiManager.updateProgressStats();
        
        this.app.logActivity('module_completed', { module: moduleId, mode });
    }
    
    unlockNextModule(moduleId) {
        const moduleOrder = ['opener', 'pitch', 'warmup', 'fullcall', 'powerhour'];
        const currentIndex = moduleOrder.indexOf(moduleId);
        
        if (currentIndex >= 0 && currentIndex < moduleOrder.length - 1) {
            const nextModuleId = moduleOrder[currentIndex + 1];
            const nextModule = this.modules[nextModuleId];
            
            if (nextModule) {
                const user = this.app.getCurrentUser();
                
                // Handle different access levels
                if (user.accessLevel === 'unlimited') {
                    nextModule.unlocked = true;
                } else if (user.accessLevel === 'unlimited_locked') {
                    this.app.userManager.unlockModuleTemporarily(nextModuleId);
                } else if (user.accessLevel === 'limited') {
                    this.app.userManager.unlockModulePermanently(nextModuleId);
                }
                
                console.log(`🔓 Unlocked next module: ${nextModuleId}`);
            }
        }
    }
    
    updateModuleProgress(moduleId, mode) {
        if (!this.moduleProgress[moduleId]) {
            this.moduleProgress[moduleId] = { 
                marathon: 0, 
                practice: 0, 
                legend: false,
                warmupScore: 0
            };
        }
        
        const progress = this.moduleProgress[moduleId];
        const currentProgress = this.app.getCurrentProgress();
        const maxProgress = this.app.getMaxProgress();
        
        switch (mode) {
            case 'marathon':
                progress.marathon = Math.max(progress.marathon, currentProgress);
                if (currentProgress >= maxProgress) {
                    this.modules[moduleId].marathonCompleted = true;
                    this.modules[moduleId].legendAvailable = true;
                }
                break;
                
            case 'legend':
                if (currentProgress >= maxProgress) {
                    progress.legend = true;
                    this.modules[moduleId].legendCompleted = true;
                }
                break;
                
            case 'practice':
                progress.practice = Math.max(progress.practice, currentProgress);
                if (moduleId === 'warmup') {
                    progress.warmupScore = currentProgress;
                }
                break;
        }
    }
    
    getPreviousModule(moduleId) {
        const moduleOrder = ['opener', 'pitch', 'warmup', 'fullcall', 'powerhour'];
        const currentIndex = moduleOrder.indexOf(moduleId);
        return currentIndex > 0 ? this.modules[moduleOrder[currentIndex - 1]] : null;
    }
    
    getModuleByOrder(order) {
        return Object.values(this.modules).find(module => module.order === order);
    }
    
    getAllModules() {
        return Object.values(this.modules).sort((a, b) => a.order - b.order);
    }
    
    getUnlockedModules() {
        return Object.values(this.modules).filter(module => module.unlocked);
    }
    
    isModuleUnlocked(moduleId) {
        const module = this.modules[moduleId];
        if (!module) return false;
        
        return module.unlocked || this.app.userManager.hasAccessToModule(moduleId);
    }
    
    getModuleProgress(moduleId) {
        return this.moduleProgress[moduleId] || { 
            marathon: 0, 
            practice: 0, 
            legend: false,
            warmupScore: 0
        };
    }
    
    resetModule(moduleId) {
        const module = this.modules[moduleId];
        if (!module) return;
        
        module.marathonCompleted = false;
        module.legendAvailable = false;
        module.legendCompleted = false;
        
        if (moduleId !== 'opener') {
            module.unlocked = false;
        }
        
        this.moduleProgress[moduleId] = { 
            marathon: 0, 
            practice: 0, 
            legend: false,
            warmupScore: 0
        };
        
        console.log(`🔄 Reset module: ${moduleId}`);
    }
    
    resetAllModules() {
        Object.keys(this.modules).forEach(moduleId => {
            this.resetModule(moduleId);
        });
        
        // Ensure opener is always unlocked
        this.modules.opener.unlocked = true;
        
        this.app.progressManager.saveProgress();
        this.app.uiManager.updateModuleUI();
        
        console.log('🔄 All modules reset');
    }
    
    // Debug and utility methods
    debugStates() {
        console.log('🔍 DEBUG: Current Module States');
        console.log('================================');
        Object.entries(this.modules).forEach(([id, module]) => {
            console.log(`${id.toUpperCase()}:`, {
                unlocked: module.unlocked,
                marathonCompleted: module.marathonCompleted,
                legendAvailable: module.legendAvailable,
                legendCompleted: module.legendCompleted,
                hasMarathon: module.hasMarathon,
                hasLegend: module.hasLegend
            });
        });
        
        console.log('\n🔍 DEBUG: Module Progress');
        console.log('==========================');
        console.log(this.moduleProgress);
    }
    
    forceUnlock(moduleId) {
        const module = this.modules[moduleId];
        if (!module) {
            console.log(`❌ Module not found: ${moduleId}`);
            return;
        }
        
        module.unlocked = true;
        this.app.progressManager.saveProgress();
        this.app.uiManager.updateModuleUI();
        console.log(`✅ Force unlocked module: ${moduleId}`);
    }
    
    forceCompleteMarathon(moduleId) {
        const module = this.modules[moduleId];
        if (!module) return;
        
        module.marathonCompleted = true;
        module.legendAvailable = true;
        
        if (!this.moduleProgress[moduleId]) {
            this.moduleProgress[moduleId] = { marathon: 0, practice: 0, legend: false };
        }
        this.moduleProgress[moduleId].marathon = 10;
        
        this.unlockNextModule(moduleId);
        this.app.progressManager.saveProgress();
        this.app.uiManager.updateModuleUI();
        
        console.log(`✅ Force completed marathon for: ${moduleId}`);
    }
    
    getModuleStats() {
        const stats = {
            totalModules: Object.keys(this.modules).length,
            unlockedModules: this.getUnlockedModules().length,
            completedMarathons: Object.values(this.modules).filter(m => m.marathonCompleted).length,
            completedLegends: Object.values(this.modules).filter(m => m.legendCompleted).length
        };
        
        return stats;
    }
}