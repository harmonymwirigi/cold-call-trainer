/**
 * Module Manager - Enhanced with better descriptions and clearer instructions
 * Fix: D2. Module Descriptions & Instructions
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
        
        // Check temporary unlocks
        this.checkTemporaryUnlocks();
        
        console.log('📚 Module Manager initialized');
    }
    
    initializeModules() {
        return {
            opener: {
                id: 'opener',
                name: 'Opener + Early Objections',
                description: 'Master your opening line and handle early objections like a pro.',
                
                // ENHANCED: Detailed descriptions with clear flow explanation
                detailedDescription: `
                    <div class="module-flow-description">
                        <h4>🎯 What You'll Practice:</h4>
                        <div class="practice-flow">
                            <div class="flow-step">
                                <span class="step-number">1</span>
                                <div class="step-content">
                                    <strong>Practice Mode:</strong> Complete conversation flow
                                    <div class="step-details">Opener → Objection → Pitch → Meeting Request</div>
                                </div>
                            </div>
                            <div class="flow-step">
                                <span class="step-number">2</span>
                                <div class="step-content">
                                    <strong>Marathon Mode:</strong> 10 objections in a row
                                    <div class="step-details">Focus on handling various early objections quickly</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="unlock-info">
                            <strong>🔓 Unlock Next:</strong> Complete the 10-objection marathon to unlock 
                            <em>Pitch + Objections + Close</em> for 24 hours.
                        </div>
                        
                        <div class="tips-section">
                            <strong>💡 Success Tips:</strong>
                            <ul>
                                <li>Start with your name, company, and reason for calling</li>
                                <li>Show empathy when handling objections ("I understand...")</li>
                                <li>Don't argue - ask questions instead</li>
                                <li>End objection responses with forward-moving questions</li>
                            </ul>
                        </div>
                    </div>
                `,
                
                order: 1,
                unlocked: true,
                marathonCompleted: false,
                legendAvailable: false,
                legendCompleted: false,
                hasMarathon: true,
                hasLegend: true
            },
            
            pitch: {
                id: 'pitch',
                name: 'Pitch + Objections + Close',
                description: 'Perfect your pitch delivery and close for meetings like a sales pro.',
                
                detailedDescription: `
                    <div class="module-flow-description">
                        <h4>🎯 What You'll Practice:</h4>
                        <div class="practice-flow">
                            <div class="flow-step">
                                <span class="step-number">1</span>
                                <div class="step-content">
                                    <strong>Practice Mode:</strong> Pitch → Objection → Meeting Close
                                    <div class="step-details">Deliver pitch, handle post-pitch objections, book the meeting</div>
                                </div>
                            </div>
                            <div class="flow-step">
                                <span class="step-number">2</span>
                                <div class="step-content">
                                    <strong>Marathon Mode:</strong> 10 pitch sequences
                                    <div class="step-details">Rapid-fire practice of pitch → objection → close</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="unlock-info">
                            <strong>🔓 Unlock Next:</strong> Complete the 10-pitch marathon to unlock 
                            <em>Warm-up Challenge</em> for 24 hours.
                        </div>
                        
                        <div class="tips-section">
                            <strong>💡 Success Tips:</strong>
                            <ul>
                                <li>Focus on benefits, not just features</li>
                                <li>Keep pitches under 30 seconds</li>
                                <li>Handle budget objections with value, not price</li>
                                <li>Always ask for a specific meeting time</li>
                                <li>Be ready to negotiate the first time slot they reject</li>
                            </ul>
                        </div>
                    </div>
                `,
                
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
                description: 'Rapid-fire fundamentals drill - perfect for pre-call preparation.',
                
                detailedDescription: `
                    <div class="module-flow-description">
                        <h4>🎯 What You'll Practice:</h4>
                        <div class="practice-flow">
                            <div class="flow-step">
                                <span class="step-number">🔥</span>
                                <div class="step-content">
                                    <strong>25 Quick-Fire Questions</strong>
                                    <div class="step-details">Random mix of openers, pitches, objections, and meeting requests</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="challenge-rules">
                            <h4>📋 Challenge Rules:</h4>
                            <ul>
                                <li><strong>25 questions</strong> covering all cold call scenarios</li>
                                <li><strong>5-second timeout</strong> per question (move fast!)</li>
                                <li><strong>18/25 score needed</strong> to pass and unlock next module</li>
                                <li><strong>Skip button available</strong> if you're stuck</li>
                                <li><strong>Instant feedback</strong> with detailed summary at the end</li>
                            </ul>
                        </div>
                        
                        <div class="unlock-info">
                            <strong>🔓 Unlock Next:</strong> Score 18/25 or higher to unlock 
                            <em>Full Cold Call Simulation</em> for 24 hours.
                        </div>
                        
                        <div class="tips-section">
                            <strong>💡 Perfect for:</strong>
                            <ul>
                                <li>Warming up before live cold calling sessions</li>
                                <li>Practicing quick responses under pressure</li>
                                <li>Identifying weak areas in your fundamentals</li>
                                <li>Building confidence with rapid repetition</li>
                            </ul>
                        </div>
                    </div>
                `,
                
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
                description: 'Complete end-to-end cold call from hello to booked meeting.',
                
                detailedDescription: `
                    <div class="module-flow-description">
                        <h4>🎯 What You'll Practice:</h4>
                        <div class="practice-flow">
                            <div class="flow-step">
                                <span class="step-number">📞</span>
                                <div class="step-content">
                                    <strong>Complete Call Simulation</strong>
                                    <div class="step-details">Full conversation from greeting to booked meeting</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="call-flow">
                            <h4>📋 Call Flow Stages:</h4>
                            <div class="flow-stages">
                                <div class="stage">1. Opener & Introduction</div>
                                <div class="stage">2. Handle Early Objection</div>
                                <div class="stage">3. Deliver Pitch</div>
                                <div class="stage">4. Handle Post-Pitch Objection</div>
                                <div class="stage">5. Request & Confirm Meeting</div>
                            </div>
                        </div>
                        
                        <div class="unlock-info">
                            <strong>🔓 Unlock Next:</strong> Successfully book a meeting to unlock 
                            <em>Power Hour Challenge</em> for 24 hours.
                        </div>
                        
                        <div class="tips-section">
                            <strong>💡 Success Strategy:</strong>
                            <ul>
                                <li>Stay calm and professional throughout</li>
                                <li>Practice smooth transitions between stages</li>
                                <li>Be persistent but respectful</li>
                                <li>Focus on value in every interaction</li>
                                <li>Always confirm meeting details clearly</li>
                            </ul>
                        </div>
                    </div>
                `,
                
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
                description: 'Ultimate endurance test: 10 consecutive cold calls with live scoring.',
                
                detailedDescription: `
                    <div class="module-flow-description">
                        <h4>🎯 What You'll Practice:</h4>
                        <div class="practice-flow">
                            <div class="flow-step">
                                <span class="step-number">⚡</span>
                                <div class="step-content">
                                    <strong>10 Back-to-Back Cold Calls</strong>
                                    <div class="step-details">Rapid succession with live scoring and immediate feedback</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="scoring-system">
                            <h4>📊 Scoring System (0-4 points per call):</h4>
                            <div class="scoring-breakdown">
                                <div class="score-level">
                                    <span class="score">4</span>
                                    <div>Meeting booked with confirmed time slot</div>
                                </div>
                                <div class="score-level">
                                    <span class="score">3</span>
                                    <div>Meeting agreed but no firm time set</div>
                                </div>
                                <div class="score-level">
                                    <span class="score">2</span>
                                    <div>Handled objections but no meeting ask</div>
                                </div>
                                <div class="score-level">
                                    <span class="score">1</span>
                                    <div>Failed at post-pitch objection stage</div>
                                </div>
                                <div class="score-level">
                                    <span class="score">0</span>
                                    <div>Failed at early objection stage</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="challenge-features">
                            <h4>⚡ Challenge Features:</h4>
                            <ul>
                                <li><strong>Time pressure:</strong> Each call has a 15-turn maximum</li>
                                <li><strong>Instant scoring:</strong> Get 0-4 points per call immediately</li>
                                <li><strong>Micro-coaching:</strong> Quick tips between calls</li>
                                <li><strong>Progressive difficulty:</strong> Prospects get tougher as you progress</li>
                                <li><strong>Final scorecard:</strong> Detailed performance breakdown</li>
                            </ul>
                        </div>
                        
                        <div class="tips-section">
                            <strong>💡 Master Level Tips:</strong>
                            <ul>
                                <li>Maintain energy and enthusiasm throughout</li>
                                <li>Learn from each call to improve the next</li>
                                <li>Stay focused on booking meetings, not just pitching</li>
                                <li>Adapt your approach based on prospect responses</li>
                                <li>Target 30+ points (average 3+ per call) for expert level</li>
                            </ul>
                        </div>
                    </div>
                `,
                
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
        
        if (!this.app.userManager.hasAccessToModule(moduleId)) {
            this.app.uiManager.showError('You do not have access to this module.');
            return;
        }
        
        if (!module.unlocked) {
            this.showUnlockRequirements(moduleId);
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
            
            // Check if legend attempt is available
            const legendAttemptUsed = localStorage.getItem('legend_attempt_used') === 'true';
            if (legendAttemptUsed) {
                this.app.uiManager.showError('You need to pass Marathon again to unlock another Legend attempt.');
                return;
            }
            
            // Don't check marathonCompleted for legend availability anymore
            // Legend is available after any marathon pass
        }
        
        // Set up module parameters
        this.app.setCurrentModule(moduleId);
        this.app.setCurrentMode(mode);
        this.app.setCurrentProgress(0);
        
        const maxProgress = this.getMaxProgress(moduleId, mode);
        this.app.setMaxProgress(maxProgress);
        
        this.app.logActivity('module_started', { 
            module: moduleId, 
            mode, 
            maxProgress 
        });
        
        this.app.callManager.initializeCall();
    }
    unlockModulesTemporarily(moduleIds, hours = 24) {
        const unlockTime = Date.now();
        const expiryTime = unlockTime + (hours * 60 * 60 * 1000);
        
        moduleIds.forEach(moduleId => {
            const module = this.modules[moduleId];
            if (module) {
                // Store temporary unlock in localStorage
                const tempUnlocks = JSON.parse(localStorage.getItem('temporary_unlocks') || '{}');
                tempUnlocks[moduleId] = {
                    unlockTime,
                    expiryTime,
                    hours
                };
                localStorage.setItem('temporary_unlocks', JSON.stringify(tempUnlocks));
                
                // Temporarily unlock the module
                module.unlocked = true;
                console.log(`🔓 Module ${moduleId} unlocked for ${hours} hours`);
            }
        });
        
        // Save state
        this.app.progressManager.saveProgress();
    }
    
    // ADD this method to check temporary unlocks
    checkTemporaryUnlocks() {
        const tempUnlocks = JSON.parse(localStorage.getItem('temporary_unlocks') || '{}');
        const now = Date.now();
        
        Object.entries(tempUnlocks).forEach(([moduleId, unlock]) => {
            const module = this.modules[moduleId];
            if (module && unlock.expiryTime) {
                if (now < unlock.expiryTime) {
                    // Still valid
                    module.unlocked = true;
                    const hoursLeft = Math.ceil((unlock.expiryTime - now) / (60 * 60 * 1000));
                    console.log(`🔓 Module ${moduleId} unlocked for ${hoursLeft} more hours`);
                } else {
                    // Expired
                    if (!this.isPermanentlyUnlocked(moduleId)) {
                        module.unlocked = false;
                    }
                    // Remove from temporary unlocks
                    delete tempUnlocks[moduleId];
                }
            }
        });
        
        localStorage.setItem('temporary_unlocks', JSON.stringify(tempUnlocks));
    }
    
    isPermanentlyUnlocked(moduleId) {
        // Check if module is permanently unlocked (e.g., opener is always unlocked)
        return moduleId === 'opener' || this.moduleProgress[moduleId]?.permanentUnlock;
    }
    
    
    // ENHANCED: Show detailed unlock requirements
    showUnlockRequirements(moduleId) {
        const module = this.modules[moduleId];
        const prevModule = this.getPreviousModule(moduleId);
        
        if (!prevModule) {
            this.app.uiManager.showError('This module cannot be unlocked.');
            return;
        }
        
        let requirementMessage = '';
        let actionRequired = '';
        
        if (prevModule.id === 'opener') {
            requirementMessage = `To unlock <strong>${module.name}</strong>, you need to complete the <strong>Opener + Early Objections Marathon</strong>.`;
            actionRequired = 'Complete 10 objection-handling scenarios in a row to prove your mastery.';
        } else if (prevModule.id === 'pitch') {
            requirementMessage = `To unlock <strong>${module.name}</strong>, you need to complete the <strong>Pitch + Objections + Close Marathon</strong>.`;
            actionRequired = 'Complete 10 pitch-to-close sequences to demonstrate your closing skills.';
        } else if (prevModule.id === 'warmup') {
            requirementMessage = `To unlock <strong>${module.name}</strong>, you need to pass the <strong>Warm-up Challenge</strong>.`;
            actionRequired = 'Score 18 out of 25 questions correctly to prove your fundamentals.';
        } else if (prevModule.id === 'fullcall') {
            requirementMessage = `To unlock <strong>${module.name}</strong>, you need to successfully complete a <strong>Full Cold Call</strong>.`;
            actionRequired = 'Book a meeting in the complete call simulation to show end-to-end mastery.';
        }
        
        const modalContent = `
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 3rem; margin-bottom: 10px;">🔒</div>
                <h3 style="color: #667eea; margin-bottom: 15px;">Module Locked</h3>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <p style="margin-bottom: 15px; font-size: 1.1rem;">${requirementMessage}</p>
                <p style="margin-bottom: 0; font-weight: 600; color: #495057;">${actionRequired}</p>
            </div>
            
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196F3;">
                <strong>💡 Why this progression?</strong><br>
                Each module builds on the previous one. Mastering the fundamentals ensures you get maximum value from advanced training.
            </div>
        `;
        
        this.app.uiManager.showFeedbackModal(`Unlock ${module.name}`, modalContent);
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
    
    
    async completeModule(moduleId, mode) {
        const module = this.modules[moduleId];
        if (!module) return;
        
        console.log(`🎯 Completing module: ${moduleId} in ${mode} mode`);
        
        if (mode === 'marathon') {
            module.marathonCompleted = true;
            
            // For opener module, handle the special unlocks
            if (moduleId === 'opener') {
                // Unlock pitch module for 24 hours
                this.unlockModulesTemporarily(['pitch'], 24);
                
                // Reset legend attempt flag
                localStorage.setItem('legend_attempt_used', 'false');
                
                // Track marathon passes
                let marathonPasses = parseInt(localStorage.getItem('marathon_passes') || '0');
                localStorage.setItem('marathon_passes', (marathonPasses + 1).toString());
            } else {
                // Other modules use the existing unlock system
                await this.unlockNextModuleViaBackend(moduleId);
            }
            
            // Don't show marathon completion modal here - CallManager handles it
            
        } else if (mode === 'legend') {
            module.legendCompleted = true;
            
            // Legend completion doesn't unlock anything, just bragging rights
            console.log('🏆 Legend mode completed!');
            
        } else if (mode === 'practice') {
            // Existing practice mode logic
            if (moduleId === 'warmup') {
                const score = this.app.getCurrentProgress();
                if (score >= module.passingScore) {
                    await this.unlockNextModuleViaBackend(moduleId);
                    this.showWarmupPassModal(score, module.totalQuestions);
                } else {
                    this.app.uiManager.showError(`Challenge failed. Score: ${score}/${module.totalQuestions}. Need ${module.passingScore} to pass.`);
                }
            } else {
                // Regular practice completion
                this.showPracticeCompletionModal(module);
            }
        }
        
        this.updateModuleProgress(moduleId, mode);
        this.app.progressManager.saveProgress();
        this.app.uiManager.updateModuleUI();
        this.app.uiManager.updateProgressStats();
        
        this.app.logActivity('module_completed', { module: moduleId, mode });
    }
// Add this new method to ModuleManager:
async unlockNextModuleViaBackend(moduleId) {
    const moduleOrder = ['opener', 'pitch', 'warmup', 'fullcall', 'powerhour'];
    const currentIndex = moduleOrder.indexOf(moduleId);
    
    if (currentIndex >= 0 && currentIndex < moduleOrder.length - 1) {
        const nextModuleId = moduleOrder[currentIndex + 1];
        const user = this.app.getCurrentUser();
        
        if (user?.access_level === 'unlimited_locked' || user?.access_level === 'limited') {
            // Use backend unlock system
            const success = await this.app.userManager.unlockModuleTemporarily(
                nextModuleId, 
                'progression'
            );
            
            if (success) {
                console.log(`🔓 Backend unlocked: ${nextModuleId}`);
            }
        } else {
            // Unlimited users get immediate access
            const nextModule = this.modules[nextModuleId];
            if (nextModule) {
                nextModule.unlocked = true;
                console.log(`🔓 Immediately unlocked: ${nextModuleId}`);
            }
        }
    }
}
    
    // ENHANCED: Better completion modals
    showMarathonCompletionModal(module) {
        const nextModule = this.getNextModule(module.id);
        const nextModuleName = nextModule ? nextModule.name : 'Final Challenge';
        
        const modalContent = `
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 3rem; margin-bottom: 10px;">🎉</div>
                <h3 style="color: #4CAF50; margin-bottom: 15px;">Marathon Complete!</h3>
            </div>
            
            <div style="background: #e8f5e8; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <p style="margin-bottom: 15px; font-size: 1.1rem;">
                    Excellent work! You've mastered <strong>${module.name}</strong> with 10 consecutive successful interactions.
                </p>
                <p style="margin-bottom: 0; font-weight: 600; color: #2e7d32;">
                    🔓 <strong>${nextModuleName}</strong> is now unlocked for 24 hours!
                </p>
            </div>
            
            <div style="background: #fff3e0; padding: 15px; border-radius: 8px; border-left: 4px solid #ff9800;">
                <strong>⏰ 24-Hour Access:</strong><br>
                Your unlocked module will remain available for 24 hours. Complete its marathon to permanently unlock the next level!
            </div>
        `;
        
        this.app.uiManager.showFeedbackModal('🏆 Marathon Achievement Unlocked!', modalContent);
    }
    
    showWarmupPassModal(score, totalQuestions) {
        const nextModule = this.getNextModule('warmup');
        const nextModuleName = nextModule ? nextModule.name : 'Final Challenge';
        
        const modalContent = `
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 3rem; margin-bottom: 10px;">🔥</div>
                <h3 style="color: #4CAF50; margin-bottom: 15px;">Challenge Passed!</h3>
            </div>
            
            <div style="background: #e8f5e8; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <div style="text-align: center; margin-bottom: 15px;">
                    <div style="font-size: 2rem; font-weight: bold; color: #4CAF50;">${score}/${totalQuestions}</div>
                    <div style="font-size: 0.9rem; color: #666;">Correct Answers</div>
                </div>
                <p style="margin-bottom: 0; font-weight: 600; color: #2e7d32;">
                    🔓 <strong>${nextModuleName}</strong> is now unlocked for 24 hours!
                </p>
            </div>
            
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196F3;">
                <strong>💡 Pro Tip:</strong><br>
                Use the warm-up challenge before live cold calling sessions to get your mind sharp and responses flowing!
            </div>
        `;
        
        this.app.uiManager.showFeedbackModal('🎯 Fundamentals Mastered!', modalContent);
    }
    
    showPracticeCompletionModal(module) {
        const nextModule = this.getNextModule(module.id);
        const nextModuleName = nextModule ? nextModule.name : 'Final Challenge';
        
        const modalContent = `
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 3rem; margin-bottom: 10px;">✅</div>
                <h3 style="color: #4CAF50; margin-bottom: 15px;">Practice Complete!</h3>
            </div>
            
            <div style="background: #e8f5e8; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <p style="margin-bottom: 15px; font-size: 1.1rem;">
                    Great job completing <strong>${module.name}</strong> practice mode!
                </p>
                <p style="margin-bottom: 0; font-weight: 600; color: #2e7d32;">
                    🔓 <strong>${nextModuleName}</strong> is now unlocked for 24 hours!
                </p>
            </div>
            
            <div style="background: #fff3e0; padding: 15px; border-radius: 8px; border-left: 4px solid #ff9800;">
                <strong>🚀 Ready for Marathon?</strong><br>
                Try the marathon mode to really master this skill with 10 consecutive challenges!
            </div>
        `;
        
        this.app.uiManager.showFeedbackModal('🎉 Module Completed!', modalContent);
    }
    
    unlockNextModule(moduleId) {
        const moduleOrder = ['opener', 'pitch', 'warmup', 'fullcall', 'powerhour'];
        const currentIndex = moduleOrder.indexOf(moduleId);
        
        if (currentIndex >= 0 && currentIndex < moduleOrder.length - 1) {
            const nextModuleId = moduleOrder[currentIndex + 1];
            const nextModule = this.modules[nextModuleId];
            
            if (nextModule) {
                const user = this.app.getCurrentUser();
                
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
    
    getNextModule(moduleId) {
        const moduleOrder = ['opener', 'pitch', 'warmup', 'fullcall', 'powerhour'];
        const currentIndex = moduleOrder.indexOf(moduleId);
        
        if (currentIndex >= 0 && currentIndex < moduleOrder.length - 1) {
            const nextModuleId = moduleOrder[currentIndex + 1];
            return this.modules[nextModuleId];
        }
        
        return null;
    }
    updateModuleCardButtons(card, module) {
        const practiceBtn = card.querySelector('.btn-practice');
        const marathonBtn = card.querySelector('.btn-marathon');
        const legendBtn = card.querySelector('.btn-legend');
        
        if (module.unlocked) {
            // Practice always available
            if (practiceBtn) {
                practiceBtn.disabled = false;
                practiceBtn.classList.remove('disabled');
            }
            
            // Marathon available if module has it
            if (marathonBtn && module.hasMarathon) {
                marathonBtn.disabled = false;
                marathonBtn.style.display = 'inline-block';
                
                if (module.marathonCompleted) {
                    marathonBtn.innerHTML = '✅ Marathon';
                }
            }
            
            // Legend button only for opener module
            if (legendBtn && module.id === 'opener') {
                const legendAttemptUsed = localStorage.getItem('legend_attempt_used') === 'true';
                const marathonPasses = parseInt(localStorage.getItem('marathon_passes') || '0');
                
                if (marathonPasses > 0 && !legendAttemptUsed) {
                    legendBtn.style.display = 'inline-block';
                    legendBtn.disabled = false;
                    legendBtn.classList.remove('disabled');
                    legendBtn.innerHTML = '⚡ Legend (6x)';
                } else {
                    legendBtn.style.display = 'none';
                }
            } else if (legendBtn) {
                legendBtn.style.display = 'none';
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