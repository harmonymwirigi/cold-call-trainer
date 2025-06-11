/**
 * UI Manager - Enhanced with better visual feedback and clearer progression indicators
 * Fix: G2. Visual Feedback & Polish
 */

export class UIManager {
    constructor(app) {
        this.app = app;
    }
    
    init() {
        this.setupUIElements();
        this.createProspectJobTitleDropdown();
        this.createProspectIndustryDropdown();
        this.addCustomBehaviorField();
        this.addAnimationStyles();
        this.enhanceVisualFeedback();
        console.log('🎨 UI Manager initialized');
    }
    
    setupUIElements() {
        this.updateHeaderText();
        this.updateFormLabels();
    }
    
    updateHeaderText() {
        const headerTitle = document.querySelector('.header h1');
        const headerSubtitle = document.querySelector('.header p');
        
        if (headerTitle) {
            headerTitle.textContent = 'AI-Powered English Cold Calling Coach for Non-Native Speakers';
        }
        
        if (headerSubtitle) {
            headerSubtitle.textContent = 'Practice real-world tech sales roleplays and sharpen your objection-handling, pitch, and closing skills in English.';
        }
        
        document.title = 'AI-Powered English Cold Calling Coach for Non-Native Speakers';
    }
    
    updateFormLabels() {
        const nameLabel = document.querySelector('label[for="userName"]');
        if (nameLabel) {
            nameLabel.textContent = 'First Name:';
        }
        
        const nameInput = document.getElementById('userName');
        if (nameInput) {
            nameInput.placeholder = 'Enter your first name';
        }
    }
    
    createProspectJobTitleDropdown() {
        const jobTitleSelect = document.getElementById('jobTitle');
        if (!jobTitleSelect) {
            console.warn('⚠️ Job title select element not found');
            return;
        }
        
        const jobTitles = [
    'Brand/Communications Manager',
    'CEO (Chief Executive Officer)',
    'CFO (Chief Financial Officer)', 
    'CIO (Chief Information Officer)',
    'CMO (Chief Marketing Officer)', // ← ADDED
    'COO (Chief Operating Officer)',
    'Content Marketing Manager',
    'CTO (Chief Technology Officer)',
    'Customer Success Manager',
    'Demand Generation Manager',
    'Digital Marketing Manager',
    'Director of Operations',
    'Engineering Manager',
    'Finance Director',
    'Founder / Owner / Managing Director (MD)',
    'Head of Product',
    'Head of Sales',
    'IT Director',
    'Marketing Director',
    'Operations Manager',
    'Product Manager',
    'Purchasing Manager',
    'R&D/Product Development Manager',
    'Sales Manager',
    'Sales Operations Manager',
    'Social Media Manager', // ← ADDED
    'UX/UI Design Lead', // ← ADDED
    'VP of Finance', // ← ADDED
    'VP of HR', // ← ADDED
    'VP of IT/Engineering', // ← ADDED
    'VP of Marketing', // ← ADDED
    'VP of Sales' // ← ADDED
];
        
        jobTitleSelect.id = 'prospectJobTitle';
        
        const label = jobTitleSelect.previousElementSibling;
        if (label && label.tagName === 'LABEL') {
            label.textContent = 'Prospect Job Title:';
            label.setAttribute('for', 'prospectJobTitle');
        }
        
        jobTitleSelect.innerHTML = '<option value="">Select prospect job title</option>';
        
        jobTitles.sort().forEach(title => {
            const option = document.createElement('option');
            option.value = title.toLowerCase().replace(/[^a-z0-9]/g, '_');
            option.textContent = title;
            jobTitleSelect.appendChild(option);
        });
        
        const otherOption = document.createElement('option');
        otherOption.value = 'other';
        otherOption.textContent = 'Other (Please specify)';
        jobTitleSelect.appendChild(otherOption);
        
        jobTitleSelect.addEventListener('change', (e) => {
            this.handleJobTitleChange(e.target.value);
        });
        
        console.log('✅ Prospect job title dropdown populated with', jobTitles.length, 'options');
    }
    
    createProspectIndustryDropdown() {
        const jobTitleSelect = document.getElementById('prospectJobTitle');
        if (!jobTitleSelect) {
            console.warn('⚠️ Job title select not found, cannot create industry dropdown');
            return;
        }
        
        const jobTitleContainer = jobTitleSelect.closest('.form-group');
        if (!jobTitleContainer) {
            console.warn('⚠️ Job title container not found');
            return;
        }
        
        const industries = [
            'Education & e-Learning',
            'Energy & Utilities', 
            'Finance & Banking',
            'Government & Public Sector',
            'Healthcare & Life Sciences',
            'Hospitality & Travel',
            'Information Technology & Services',
            'Logistics, Transportation & Supply Chain',
            'Manufacturing & Industrial',
            'Media & Entertainment',
            'Non-Profit & Associations',
            'Professional Services (Legal, Accounting, Consulting)',
            'Real Estate & Property Management',
            'Retail & e-Commerce',
            'Telecommunications'
        ];
        
        const industryGroup = document.createElement('div');
        industryGroup.className = 'form-group';
        
        const industryLabel = document.createElement('label');
        industryLabel.setAttribute('for', 'prospectIndustry');
        industryLabel.textContent = 'Prospect Industry:';
        
        const industrySelect = document.createElement('select');
        industrySelect.id = 'prospectIndustry';
        industrySelect.required = true;
        
        industrySelect.style.cssText = `
            width: 100%;
            padding: 15px;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            font-size: 1rem;
            font-family: inherit;
            background: #f8f9fa;
            transition: all 0.3s ease;
        `;
        
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select prospect industry';
        industrySelect.appendChild(defaultOption);
        
        industries.sort().forEach(industry => {
            const option = document.createElement('option');
            option.value = industry.toLowerCase().replace(/[^a-z0-9]/g, '_');
            option.textContent = industry;
            industrySelect.appendChild(option);
        });
        
        const otherOption = document.createElement('option');
        otherOption.value = 'other';
        otherOption.textContent = 'Other (Please specify)';
        industrySelect.appendChild(otherOption);
        
        industrySelect.addEventListener('focus', () => {
            industrySelect.style.borderColor = '#667eea';
            industrySelect.style.background = 'white';
            industrySelect.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
        });
        
        industrySelect.addEventListener('blur', () => {
            industrySelect.style.borderColor = '#e2e8f0';
            industrySelect.style.background = '#f8f9fa';
            industrySelect.style.boxShadow = 'none';
        });
        
        industrySelect.addEventListener('change', (e) => {
            this.handleIndustryChange(e.target.value);
        });
        
        industryGroup.appendChild(industryLabel);
        industryGroup.appendChild(industrySelect);
        
        jobTitleContainer.insertAdjacentElement('afterend', industryGroup);
        
        console.log('✅ Prospect industry dropdown created with', industries.length, 'options');
    }
    
    addCustomBehaviorField() {
        setTimeout(() => {
            const industrySelect = document.getElementById('prospectIndustry');
            if (!industrySelect) {
                console.warn('⚠️ Industry select not found, cannot create custom behavior field');
                return;
            }
            
            const industryContainer = industrySelect.closest('.form-group');
            if (!industryContainer) {
                console.warn('⚠️ Industry container not found');
                return;
            }
            
            const customGroup = document.createElement('div');
            customGroup.className = 'form-group';
            
            const customLabel = document.createElement('label');
            customLabel.setAttribute('for', 'customBehavior');
            customLabel.textContent = 'Additional AI Behavior (Optional):';
            customLabel.style.cssText = `
                display: block;
                margin-bottom: 8px;
                font-weight: 600;
                color: #4a5568;
                font-size: 0.95rem;
            `;
            
            const customTextarea = document.createElement('textarea');
            customTextarea.id = 'customBehavior';
            customTextarea.placeholder = 'e.g., "Act more skeptical", "Be very busy", "Show interest in cost savings", "Focus on budget concerns"...';
            customTextarea.rows = 3;
            customTextarea.style.cssText = `
                width: 100%;
                padding: 15px;
                border: 2px solid #e2e8f0;
                border-radius: 12px;
                font-size: 1rem;
                font-family: inherit;
                background: #f8f9fa;
                resize: vertical;
                min-height: 80px;
                transition: all 0.3s ease;
            `;
            
            const charCounter = document.createElement('div');
            charCounter.id = 'customBehaviorCounter';
            charCounter.style.cssText = `
                text-align: right;
                font-size: 0.8rem;
                color: #6c757d;
                margin-top: 5px;
            `;
            charCounter.textContent = '0/200 characters';
            
            customTextarea.addEventListener('focus', () => {
                customTextarea.style.borderColor = '#667eea';
                customTextarea.style.background = 'white';
                customTextarea.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
            });
            
            customTextarea.addEventListener('blur', () => {
                customTextarea.style.borderColor = '#e2e8f0';
                customTextarea.style.background = '#f8f9fa';
                customTextarea.style.boxShadow = 'none';
            });
            
            customTextarea.addEventListener('input', (e) => {
                const length = e.target.value.length;
                const maxLength = 200;
                charCounter.textContent = `${length}/${maxLength} characters`;
                
                if (length > maxLength) {
                    charCounter.style.color = '#dc3545';
                    e.target.value = e.target.value.substring(0, maxLength);
                    charCounter.textContent = `${maxLength}/${maxLength} characters`;
                } else if (length > maxLength * 0.8) {
                    charCounter.style.color = '#ffc107';
                } else {
                    charCounter.style.color = '#6c757d';
                }
            });
            
            customGroup.appendChild(customLabel);
            customGroup.appendChild(customTextarea);
            customGroup.appendChild(charCounter);
            
            industryContainer.insertAdjacentElement('afterend', customGroup);
            
            console.log('✅ Custom behavior field created with character counter');
        }, 100);
    }
    
    handleJobTitleChange(value) {
        this.removeCustomInput('customJobTitle');
        
        if (value === 'other') {
            this.addCustomInput('prospectJobTitle', 'customJobTitle', 'Please specify the job title:');
        }
    }
    
    handleIndustryChange(value) {
        this.removeCustomInput('customIndustry');
        
        if (value === 'other') {
            this.addCustomInput('prospectIndustry', 'customIndustry', 'Please specify the industry:');
        }
    }
    
    addCustomInput(afterElementId, inputId, labelText) {
        const afterElement = document.getElementById(afterElementId);
        if (!afterElement) return;
        
        const customInput = document.createElement('input');
        customInput.type = 'text';
        customInput.id = inputId;
        customInput.placeholder = 'Enter custom value';
        customInput.required = true;
        customInput.style.cssText = `
            width: 100%;
            padding: 12px;
            border: 2px solid #667eea;
            border-radius: 8px;
            margin-top: 10px;
            font-size: 0.9rem;
            transition: all 0.3s ease;
        `;
        
        const label = document.createElement('div');
        label.textContent = labelText;
        label.style.cssText = `
            margin-top: 10px;
            font-size: 0.9rem;
            color: #667eea;
            font-weight: 600;
        `;
        
        customInput.addEventListener('focus', () => {
            customInput.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
        });
        
        customInput.addEventListener('blur', () => {
            customInput.style.boxShadow = 'none';
        });
        
        afterElement.parentNode.appendChild(label);
        afterElement.parentNode.appendChild(customInput);
    }
    
    removeCustomInput(inputId) {
        const existingInput = document.getElementById(inputId);
        if (existingInput) {
            const label = existingInput.previousElementSibling;
            if (label) label.remove();
            existingInput.remove();
        }
    }
    
    showModuleDashboard() {
        document.getElementById('userForm').style.display = 'none';
        document.getElementById('phoneInterface').style.display = 'none';
        document.getElementById('moduleDashboard').style.display = 'block';
        
        this.updateModuleUI();
        this.updateProgressStats();
    }
    
    updateModuleUI() {
        console.log('🔄 Updating module UI...');
        
        const modules = this.app.moduleManager.getAllModules();
        
        modules.forEach(module => {
            const card = document.getElementById(`module-${module.id}`);
            if (!card) {
                console.warn(`⚠️ Module card not found: module-${module.id}`);
                return;
            }
            
            this.updateModuleCard(card, module);
        });
        
        console.log('✅ Module UI update complete');
    }
    
    // ENHANCED: Better module card updates with visual feedback
    updateModuleCard(card, module) {
        const statusIcon = card.querySelector(`#status-${module.id} .lock-icon`);
        const progressFill = card.querySelector(`#progress-${module.id}`);
        const progressText = card.querySelector(`#progressText-${module.id}`);
        const practiceBtn = card.querySelector('.btn-practice');
        const marathonBtn = card.querySelector('.btn-marathon');
        const legendBtn = card.querySelector('.btn-legend');
        
        const hasAccess = this.app.userManager.hasAccessToModule(module.id);
        const isUnlocked = module.unlocked || hasAccess;
        
        // ENHANCED: Better visual state management
        if (isUnlocked) {
            this.setUnlockedState(card, module, statusIcon, practiceBtn, marathonBtn, legendBtn);
        } else {
            this.setLockedState(card, module, statusIcon, practiceBtn, marathonBtn, legendBtn);
        }
        
        // ENHANCED: Better progress display
        this.updateModuleProgress(module, progressFill, progressText, isUnlocked);
        
        // ENHANCED: Dynamic descriptions
        this.updateModuleDescription(card, module, isUnlocked);
        
        // ENHANCED: Visual indicators for completion
        this.addCompletionIndicators(card, module);
    }
    
    // ENHANCED: Set unlocked state with better visual feedback
    setUnlockedState(card, module, statusIcon, practiceBtn, marathonBtn, legendBtn) {
        card.classList.remove('locked');
        card.classList.add('unlocked');
        
        if (statusIcon) {
            statusIcon.textContent = '🔓';
            statusIcon.style.color = '#4CAF50';
        }
        
        // Enable practice button with enhanced styling
        if (practiceBtn) {
            practiceBtn.disabled = false;
            practiceBtn.classList.remove('disabled');
            practiceBtn.classList.add('available');
        }
        
        // Handle marathon button
        if (marathonBtn) {
            if (module.hasMarathon) {
                marathonBtn.disabled = false;
                marathonBtn.style.display = 'inline-block';
                marathonBtn.classList.remove('disabled');
                marathonBtn.classList.add('available');
                
                // ENHANCED: Show completion status
                if (module.marathonCompleted) {
                    marathonBtn.classList.add('completed');
                    marathonBtn.innerHTML = '✅ Marathon';
                } else {
                    marathonBtn.classList.remove('completed');
                    marathonBtn.innerHTML = 'Marathon (10x)';
                }
            } else {
                marathonBtn.style.display = 'none';
            }
        }
        
        // Hide legend button (as per requirements)
        if (legendBtn) {
            legendBtn.style.display = 'none';
            legendBtn.classList.add('hidden');
        }
        
        // Add unlock animation
        card.style.animation = 'unlockPulse 0.6s ease-out';
        setTimeout(() => {
            card.style.animation = '';
        }, 600);
    }
    
    // ENHANCED: Set locked state with clearer messaging
    setLockedState(card, module, statusIcon, practiceBtn, marathonBtn, legendBtn) {
        card.classList.add('locked');
        card.classList.remove('unlocked');
        
        if (statusIcon) {
            statusIcon.textContent = '🔒';
            statusIcon.style.color = '#6c757d';
        }
        
        // Disable all buttons with better visual feedback
        [practiceBtn, marathonBtn, legendBtn].forEach(btn => {
            if (btn) {
                btn.disabled = true;
                btn.classList.add('disabled');
                btn.classList.remove('available', 'completed');
            }
        });
        
        // Add locked overlay effect
        card.style.position = 'relative';
        if (!card.querySelector('.locked-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'locked-overlay';
            overlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(248, 249, 250, 0.8);
                border-radius: 12px;
                pointer-events: none;
                z-index: 1;
            `;
            card.appendChild(overlay);
        }
    }
    
    // ENHANCED: Better progress display with visual indicators
    updateModuleProgress(module, progressFill, progressText, isUnlocked) {
        const progress = this.app.moduleManager.getModuleProgress(module.id);
        
        if (isUnlocked) {
            let progressPercent = 0;
            let progressLabel = '';
            let progressColor = '#667eea';
            
            if (module.id === 'warmup') {
                // Warmup shows question progress
                const score = progress.warmupScore || 0;
                progressPercent = (score / module.totalQuestions) * 100;
                progressLabel = `${score}/${module.totalQuestions} Questions`;
                
                if (score >= module.passingScore) {
                    progressLabel += ' ✅';
                    progressColor = '#4CAF50';
                } else if (score > 0) {
                    progressColor = '#ff9800';
                }
            } else if (module.hasMarathon) {
                // Marathon modules show marathon progress
                const marathonProgress = Math.min(progress.marathon, 10);
                progressPercent = (marathonProgress / 10) * 100;
                progressLabel = `${marathonProgress}/10 Marathon`;
                
                if (module.marathonCompleted) {
                    progressLabel += ' ✅';
                    progressColor = '#4CAF50';
                } else if (marathonProgress > 0) {
                    progressColor = '#ff9800';
                }
            } else {
                // Other modules show completion status
                progressPercent = progress.practice > 0 ? 100 : 0;
                if (progress.practice > 0) {
                    progressLabel = 'Completed ✅';
                    progressColor = '#4CAF50';
                } else {
                    progressLabel = 'Not Started';
                    progressColor = '#6c757d';
                }
            }
            
            if (progressFill) {
                progressFill.style.width = `${progressPercent}%`;
                progressFill.style.backgroundColor = progressColor;
                
                // Add animated effect for progress
                progressFill.style.transition = 'all 0.5s ease-in-out';
            }
            
            if (progressText) {
                progressText.textContent = progressLabel;
                progressText.style.color = progressColor;
                progressText.style.fontWeight = progressPercent > 0 ? '600' : '500';
            }
        } else {
            // ENHANCED: Better locked state messaging
            if (progressFill) {
                progressFill.style.width = '0%';
                progressFill.style.backgroundColor = '#e9ecef';
            }
            
            if (progressText) {
                const prevModule = this.app.moduleManager.getPreviousModule(module.id);
                let lockMessage = 'Locked';
                
                if (prevModule) {
                    if (prevModule.id === 'opener') {
                        lockMessage = '🏃 Complete Opener Marathon to unlock';
                    } else if (prevModule.id === 'pitch') {
                        lockMessage = '🎯 Complete Pitch Marathon to unlock';
                    } else if (prevModule.id === 'warmup') {
                        lockMessage = '🔥 Pass Warm-up Challenge to unlock';
                    } else if (prevModule.id === 'fullcall') {
                        lockMessage = '📞 Complete Full Call to unlock';
                    }
                }
                
                progressText.textContent = lockMessage;
                progressText.style.color = '#6c757d';
                progressText.style.fontWeight = '500';
                progressText.style.fontSize = '0.85rem';
            }
        }
    }
    
    // ENHANCED: Dynamic module descriptions based on state
    updateModuleDescription(card, module, isUnlocked) {
        const descriptionEl = card.querySelector('p');
        if (!descriptionEl) return;
        
        if (isUnlocked) {
            // Show active description
            descriptionEl.innerHTML = module.detailedDescription || module.description;
            descriptionEl.style.color = '#495057';
        } else {
            // Show unlock hint
            const prevModule = this.app.moduleManager.getPreviousModule(module.id);
            let unlockHint = 'Complete the previous module to unlock this training.';
            
            if (prevModule) {
                if (prevModule.id === 'opener') {
                    unlockHint = '🎯 Complete the <strong>Opener Marathon</strong> (10 objections in a row) to unlock this advanced training.';
                } else if (prevModule.id === 'pitch') {
                    unlockHint = '🚀 Complete the <strong>Pitch Marathon</strong> (10 pitch sequences) to unlock this challenge.';
                } else if (prevModule.id === 'warmup') {
                    unlockHint = '🔥 Score <strong>18/25</strong> in the Warm-up Challenge to unlock complete call practice.';
                } else if (prevModule.id === 'fullcall') {
                    unlockHint = '📞 Successfully <strong>book a meeting</strong> in Full Call mode to unlock the ultimate challenge.';
                }
            }
            
            descriptionEl.innerHTML = unlockHint;
            descriptionEl.style.color = '#6c757d';
            descriptionEl.style.fontStyle = 'italic';
        }
    }
    
    // ENHANCED: Add completion indicators and badges
    addCompletionIndicators(card, module) {
        // Remove existing indicators
        const existingIndicators = card.querySelectorAll('.completion-indicator');
        existingIndicators.forEach(indicator => indicator.remove());
        
        const header = card.querySelector('.module-header');
        if (!header) return;
        
        const indicators = [];
        
        // Marathon completion indicator
        if (module.hasMarathon && module.marathonCompleted) {
            indicators.push({
                emoji: '🏆',
                text: 'Marathon Mastered',
                color: '#4CAF50'
            });
        }
        
        // Practice completion indicator
        const progress = this.app.moduleManager.getModuleProgress(module.id);
        if (module.id === 'warmup' && progress.warmupScore >= module.passingScore) {
            indicators.push({
                emoji: '🔥',
                text: 'Challenge Passed',
                color: '#ff9800'
            });
        } else if (module.id !== 'warmup' && progress.practice > 0) {
            indicators.push({
                emoji: '✅',
                text: 'Practice Complete',
                color: '#2196F3'
            });
        }
        
        // Add indicators to the card
        indicators.forEach(indicator => {
            const badge = document.createElement('div');
            badge.className = 'completion-indicator';
            badge.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                background: ${indicator.color};
                color: white;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 0.7rem;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 4px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                z-index: 2;
            `;
            badge.innerHTML = `${indicator.emoji} ${indicator.text}`;
            
            header.style.position = 'relative';
            header.appendChild(badge);
        });
    }
    
    updateProgressStats() {
        const practiceMinutes = Math.floor(this.app.totalPracticeTime / (1000 * 60));
        const unlockedCount = this.app.moduleManager.getUnlockedModules().length;
        
        const practiceTimeEl = document.getElementById('totalPracticeTime');
        const unlockedModulesEl = document.getElementById('unlockedModules');
        
        if (practiceTimeEl) {
            practiceTimeEl.textContent = `${practiceMinutes}m`;
            
            // ENHANCED: Visual feedback for milestones
            if (practiceMinutes >= 60) {
                practiceTimeEl.style.color = '#4CAF50';
                practiceTimeEl.style.fontWeight = '700';
            } else if (practiceMinutes >= 30) {
                practiceTimeEl.style.color = '#ff9800';
                practiceTimeEl.style.fontWeight = '600';
            }
        }
        
        if (unlockedModulesEl) {
            unlockedModulesEl.textContent = `${unlockedCount}/5`;
            
            // ENHANCED: Progress color coding
            if (unlockedCount === 5) {
                unlockedModulesEl.style.color = '#4CAF50';
                unlockedModulesEl.style.fontWeight = '700';
            } else if (unlockedCount >= 3) {
                unlockedModulesEl.style.color = '#ff9800';
                unlockedModulesEl.style.fontWeight = '600';
            }
        }
        
        // Check for 30-minute unlock
        if (practiceMinutes >= 30 && !this.allModulesUnlocked()) {
            this.show30MinuteUnlock();
        }
    }
    
    allModulesUnlocked() {
        return this.app.moduleManager.getUnlockedModules().length === 5;
    }
    
    show30MinuteUnlock() {
        const unlockNotice = document.getElementById('unlockNotice');
        if (unlockNotice) {
            unlockNotice.style.display = 'block';
            unlockNotice.style.animation = 'slideInUp 0.5s ease-out';
        }
    }
    
    hideUnlockNotice() {
        const unlockNotice = document.getElementById('unlockNotice');
        if (unlockNotice) {
            unlockNotice.style.display = 'none';
        }
    }
    
    // ENHANCED: Better notification system
    showSuccess(message) {
        this.showNotification(message, 'success', 5000);
    }
    
    showError(message) {
        this.showNotification(message, 'error', 6000);
    }
    
    showWarning(message) {
        this.showNotification(message, 'warning', 5000);
    }
    
    showNotification(message, type = 'info', duration = 4000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 0;
            border-radius: 12px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            max-width: 350px;
            min-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideInRight 0.3s ease-out;
            overflow: hidden;
        `;
        
        const contentStyle = `
            padding: 16px 20px;
            display: flex;
            align-items: center;
            gap: 12px;
            background: ${this.getNotificationColor(type)};
        `;
        
        notification.querySelector('.notification-content').style.cssText = contentStyle;
        
        // Enhanced styling for close button
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 1.2rem;
            cursor: pointer;
            padding: 0;
            margin-left: auto;
            opacity: 0.8;
            transition: opacity 0.2s ease;
        `;
        
        closeBtn.addEventListener('mouseover', () => closeBtn.style.opacity = '1');
        closeBtn.addEventListener('mouseout', () => closeBtn.style.opacity = '0.8');
        
        document.body.appendChild(notification);
        
        // Auto-remove notification
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
    }
    
    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }
    
    getNotificationColor(type) {
        const colors = {
            success: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
            error: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
            warning: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
            info: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)'
        };
        return colors[type] || colors.info;
    }
    
    // ENHANCED: Better modal management
    showFeedbackModal(title, content) {
        const modal = document.getElementById('feedbackModal');
        const titleEl = document.getElementById('feedbackTitle');
        const contentEl = document.getElementById('feedbackContent');
        
        if (titleEl) titleEl.textContent = title;
        if (contentEl) contentEl.innerHTML = content;
        if (modal) {
            modal.style.display = 'flex';
            modal.style.animation = 'fadeIn 0.3s ease-out';
        }
    }
    
    closeFeedbackModal() {
        const modal = document.getElementById('feedbackModal');
        if (modal) {
            modal.style.animation = 'fadeOut 0.3s ease-in';
            setTimeout(() => {
                modal.style.display = 'none';
                this.showModuleDashboard();
            }, 300);
        }
    }
    
    // Enhanced visual feedback methods
    activateVoiceVisualizer() {
        const visualizer = document.getElementById('voiceVisualizer');
        if (visualizer) {
            visualizer.classList.add('active');
        }
    }
    
    deactivateVoiceVisualizer() {
        const visualizer = document.getElementById('voiceVisualizer');
        if (visualizer) {
            visualizer.classList.remove('active');
        }
    }
    
    resetVoiceVisualizer() {
        this.deactivateVoiceVisualizer();
    }
    
    showQuickSuccess() {
        const feedback = document.createElement('div');
        feedback.className = 'quick-success';
        feedback.innerHTML = `
            <div class="success-content">
                <span class="success-icon">✅</span>
                <span class="success-text">Great response!</span>
            </div>
        `;
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            color: white;
            padding: 20px 30px;
            border-radius: 12px;
            font-weight: 600;
            z-index: 1000;
            animation: successPulse 2s ease;
            box-shadow: 0 4px 20px rgba(76, 175, 80, 0.3);
        `;
        
        const contentStyle = `
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 1.1rem;
        `;
        
        feedback.querySelector('.success-content').style.cssText = contentStyle;
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.remove();
        }, 2000);
    }
    
    showCallFeedback(feedback, success) {
        const feedbackEl = document.createElement('div');
        feedbackEl.className = `call-feedback ${success ? 'success' : 'error'}`;
        feedbackEl.innerHTML = `
            <div class="feedback-content">
                <span class="feedback-icon">${success ? '✅' : '❌'}</span>
                <span class="feedback-text">${feedback}</span>
            </div>
        `;
        
        feedbackEl.style.cssText = `
            position: absolute;
            bottom: 120px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 20px;
            border-radius: 12px;
            color: white;
            font-size: 0.9rem;
            z-index: 100;
            max-width: 300px;
            text-align: center;
            background: ${success ? 
                'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)' : 
                'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)'};
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            animation: slideUpFade 3s ease-in-out;
        `;
        
        const contentStyle = `
            display: flex;
            align-items: center;
            gap: 8px;
            justify-content: center;
        `;
        
        feedbackEl.querySelector('.feedback-content').style.cssText = contentStyle;
        
        const phoneInterface = document.getElementById('phoneInterface');
        if (phoneInterface) {
            phoneInterface.appendChild(feedbackEl);
            
            setTimeout(() => {
                feedbackEl.remove();
            }, 3000);
        }
    }
    
    // ENHANCED: Advanced visual feedback system
    enhanceVisualFeedback() {
        // Add progress indicators
        this.addProgressIndicators();
        
        // Add hover effects
        this.addHoverEffects();
        
        // Add focus management
        this.addFocusManagement();
    }
    
    addProgressIndicators() {
        // Add subtle progress indicators for form completion
        const forms = document.querySelectorAll('.user-form, .verification-form');
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input[required], select[required]');
            const progressBar = document.createElement('div');
            progressBar.className = 'form-progress';
            progressBar.style.cssText = `
                height: 3px;
                background: #e9ecef;
                border-radius: 2px;
                margin-bottom: 20px;
                overflow: hidden;
            `;
            
            const progressFill = document.createElement('div');
            progressFill.className = 'form-progress-fill';
            progressFill.style.cssText = `
                height: 100%;
                background: linear-gradient(90deg, #667eea, #764ba2);
                width: 0%;
                transition: width 0.3s ease;
            `;
            
            progressBar.appendChild(progressFill);
            form.insertBefore(progressBar, form.firstChild);
            
            // Update progress on input changes
            inputs.forEach(input => {
                input.addEventListener('input', () => {
                    const completed = Array.from(inputs).filter(i => i.value.trim() !== '').length;
                    const progress = (completed / inputs.length) * 100;
                    progressFill.style.width = `${progress}%`;
                });
            });
        });
    }
    
    addHoverEffects() {
        // Enhanced button hover effects
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                if (!btn.disabled) {
                    btn.style.transform = 'translateY(-2px)';
                    btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }
            });
            
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'translateY(0)';
                btn.style.boxShadow = '';
            });
        });
    }
    
    addFocusManagement() {
        // Better focus management for accessibility
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                input.style.outline = '2px solid #667eea';
                input.style.outlineOffset = '2px';
            });
            
            input.addEventListener('blur', () => {
                input.style.outline = '';
                input.style.outlineOffset = '';
            });
        });
    }
    
    // ENHANCED: Additional CSS animations and styles
    addAnimationStyles() {
        if (!document.getElementById('enhancedAnimationStyles')) {
            const style = document.createElement('style');
            style.id = 'enhancedAnimationStyles';
            style.textContent = `
                @keyframes unlockPulse {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
                    50% { transform: scale(1.02); box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
                }
                
                @keyframes successPulse {
                    0%, 100% { transform: translate(-50%, -50%) scale(1); }
                    50% { transform: translate(-50%, -50%) scale(1.05); }
                }
                
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
                
                @keyframes slideUpFade {
                    0% { transform: translateX(-50%) translateY(20px); opacity: 0; }
                    20%, 80% { transform: translateX(-50%) translateY(0); opacity: 1; }
                    100% { transform: translateX(-50%) translateY(-10px); opacity: 0; }
                }
                
                @keyframes slideInUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
                
                /* Enhanced module card states */
                .module-card.unlocked {
                    border: 2px solid #4CAF50;
                    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.1);
                }
                
                .module-card.locked {
                    opacity: 0.6;
                    background: #f8f9fa;
                    border: 2px dashed #dee2e6;
                }
                
                .locked-overlay {
                    transition: opacity 0.3s ease;
                }
                
                /* Enhanced button states */
                .btn.available {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    transition: all 0.3s ease;
                }
                
                .btn.completed {
                    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                }
                
                .btn.disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                /* Progress bar enhancements */
                .progress-fill {
                    transition: all 0.5s ease-in-out;
                    position: relative;
                    overflow: hidden;
                }
                
                .progress-fill::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                    animation: progressShine 2s infinite;
                }
                
                @keyframes progressShine {
                    0% { left: -100%; }
                    100% { left: 100%; }
                }
                
                /* Enhanced completion indicators */
                .completion-indicator {
                    animation: badgeAppear 0.4s ease-out;
                }
                
                @keyframes badgeAppear {
                    from { transform: scale(0) rotate(180deg); opacity: 0; }
                    to { transform: scale(1) rotate(0deg); opacity: 1; }
                }
                
                /* Form progress indicator */
                .form-progress-fill {
                    background: linear-gradient(90deg, #667eea, #764ba2);
                    position: relative;
                    overflow: hidden;
                }
                
                .form-progress-fill::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
                    animation: progressShine 1.5s infinite;
                }
                
                /* Enhanced notification styles */
                .notification {
                    transform-origin: right center;
                }
                
                .notification-close:hover {
                    background: rgba(255,255,255,0.2);
                    border-radius: 50%;
                }
                
                /* Enhanced modal animations */
                .modal {
                    backdrop-filter: blur(5px);
                }
                
                .modal-content {
                    transform: scale(0.9);
                    transition: transform 0.3s ease;
                }
                
                .modal[style*="flex"] .modal-content {
                    transform: scale(1);
                }
            `;
            document.head.appendChild(style);
        }
    }
}