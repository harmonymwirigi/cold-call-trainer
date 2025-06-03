/**
 * UI Manager - Handles all user interface updates and interactions
 * Phase 2 Update: Enhanced prospect targeting and form improvements
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
        console.log('🎨 UI Manager initialized');
    }
    
    setupUIElements() {
        // Update header text (already done in Phase 1)
        this.updateHeaderText();
        
        // Update form labels for Phase 2
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
        
        // Also update the document title
        document.title = 'AI-Powered English Cold Calling Coach for Non-Native Speakers';
    }
    
    updateFormLabels() {
        // Update to "First Name" (Phase 2 B1)
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
        // Find the job title form group and select element
        const jobTitleSelect = document.getElementById('jobTitle');
        if (!jobTitleSelect) {
            console.warn('⚠️ Job title select element not found');
            return;
        }
        
        // Phase 2 C1: Complete list of 25 prospect job titles
        const jobTitles = [
            'Brand/Communications Manager',
            'CEO (Chief Executive Officer)',
            'CFO (Chief Financial Officer)', 
            'CIO (Chief Information Officer)',
            'CMO (Chief Marketing Officer)',
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
            'Sales Operations Manager'
        ];
        
        // Update the select element ID and attributes (Phase 2 C1)
        jobTitleSelect.id = 'prospectJobTitle';
        
        // Update label to "Prospect Job Title"
        const label = jobTitleSelect.previousElementSibling;
        if (label && label.tagName === 'LABEL') {
            label.textContent = 'Prospect Job Title:';
            label.setAttribute('for', 'prospectJobTitle');
        }
        
        // Clear existing options and add new ones
        jobTitleSelect.innerHTML = '<option value="">Select prospect job title</option>';
        
        // Add all job title options in alphabetical order
        jobTitles.sort().forEach(title => {
            const option = document.createElement('option');
            option.value = title.toLowerCase().replace(/[^a-z0-9]/g, '_');
            option.textContent = title;
            jobTitleSelect.appendChild(option);
        });
        
        // Add "Other" option
        const otherOption = document.createElement('option');
        otherOption.value = 'other';
        otherOption.textContent = 'Other (Please specify)';
        jobTitleSelect.appendChild(otherOption);
        
        // Add event listener for "Other" selection
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
        
        // Phase 2 C2: Complete list of 15 industries
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
        
        // Create industry dropdown
        const industryGroup = document.createElement('div');
        industryGroup.className = 'form-group';
        
        const industryLabel = document.createElement('label');
        industryLabel.setAttribute('for', 'prospectIndustry');
        industryLabel.textContent = 'Prospect Industry:';
        
        const industrySelect = document.createElement('select');
        industrySelect.id = 'prospectIndustry';
        industrySelect.required = true;
        
        // Style the select to match existing form elements
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
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select prospect industry';
        industrySelect.appendChild(defaultOption);
        
        // Add industry options in alphabetical order
        industries.sort().forEach(industry => {
            const option = document.createElement('option');
            option.value = industry.toLowerCase().replace(/[^a-z0-9]/g, '_');
            option.textContent = industry;
            industrySelect.appendChild(option);
        });
        
        // Add "Other" option
        const otherOption = document.createElement('option');
        otherOption.value = 'other';
        otherOption.textContent = 'Other (Please specify)';
        industrySelect.appendChild(otherOption);
        
        // Add focus/blur effects
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
        
        // Add event listener for "Other" selection
        industrySelect.addEventListener('change', (e) => {
            this.handleIndustryChange(e.target.value);
        });
        
        industryGroup.appendChild(industryLabel);
        industryGroup.appendChild(industrySelect);
        
        // Insert after job title group
        jobTitleContainer.insertAdjacentElement('afterend', industryGroup);
        
        console.log('✅ Prospect industry dropdown created with', industries.length, 'options');
    }
    
    addCustomBehaviorField() {
        // Wait for industry dropdown to be created first
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
            
            // Phase 2 C3: Custom AI Behavior field
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
            
            // Add character counter
            const charCounter = document.createElement('div');
            charCounter.id = 'customBehaviorCounter';
            charCounter.style.cssText = `
                text-align: right;
                font-size: 0.8rem;
                color: #6c757d;
                margin-top: 5px;
            `;
            charCounter.textContent = '0/200 characters';
            
            // Add focus/blur effects and character counting
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
            
            // Insert after industry group
            industryContainer.insertAdjacentElement('afterend', customGroup);
            
            console.log('✅ Custom behavior field created with character counter');
        }, 100); // Small delay to ensure industry dropdown exists
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
        
        // Add focus effect
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
    
    updateModuleCard(card, module) {
        const statusIcon = card.querySelector(`#status-${module.id} .lock-icon`);
        const progressFill = card.querySelector(`#progress-${module.id}`);
        const progressText = card.querySelector(`#progressText-${module.id}`);
        const practiceBtn = card.querySelector('.btn-practice');
        const marathonBtn = card.querySelector('.btn-marathon');
        const legendBtn = card.querySelector('.btn-legend');
        
        // Update lock status and access
        const hasAccess = this.app.userManager.hasAccessToModule(module.id);
        const isUnlocked = module.unlocked || hasAccess;
        
        if (isUnlocked) {
            card.classList.remove('locked');
            if (statusIcon) statusIcon.textContent = '🔓';
            
            // Enable practice button
            if (practiceBtn) practiceBtn.disabled = false;
            
            // Handle marathon button - only show for modules that have marathon
            if (marathonBtn) {
                if (module.hasMarathon) {
                    marathonBtn.disabled = false;
                    marathonBtn.style.display = 'inline-block';
                    // Fix marathon button text centering (from Phase 1)
                    marathonBtn.style.textAlign = 'center';
                    marathonBtn.style.whiteSpace = 'nowrap';
                    marathonBtn.style.overflow = 'hidden';
                } else {
                    marathonBtn.style.display = 'none';
                }
            }
            
            // Handle legend button - REMOVE from UI (Phase 1 F1)
            if (legendBtn) {
                legendBtn.style.display = 'none';
            }
        } else {
            card.classList.add('locked');
            if (statusIcon) statusIcon.textContent = '🔒';
            
            // Disable all buttons
            if (practiceBtn) practiceBtn.disabled = true;
            if (marathonBtn) marathonBtn.disabled = true;
            if (legendBtn) legendBtn.disabled = true;
        }
        
        // Update progress display
        this.updateModuleProgress(module, progressFill, progressText, isUnlocked);
        
        // Update descriptions
        this.updateModuleDescription(card, module);
    }
    
    updateModuleProgress(module, progressFill, progressText, isUnlocked) {
        const progress = this.app.moduleManager.getModuleProgress(module.id);
        
        if (isUnlocked) {
            let progressPercent = 0;
            let progressLabel = '';
            
            if (module.id === 'warmup') {
                // Warmup shows question progress
                const score = progress.warmupScore || 0;
                progressPercent = (score / module.totalQuestions) * 100;
                progressLabel = `${score}/${module.totalQuestions} Questions`;
                if (score >= module.passingScore) {
                    progressLabel += ' ✓';
                }
            } else if (module.hasMarathon) {
                // Marathon modules show marathon progress
                const marathonProgress = Math.min(progress.marathon, 10);
                progressPercent = (marathonProgress / 10) * 100;
                progressLabel = `${marathonProgress}/10 Marathon`;
                if (module.marathonCompleted) {
                    progressLabel += ' ✓';
                }
            } else {
                // Other modules show completion status
                progressPercent = progress.practice > 0 ? 100 : 0;
                progressLabel = progress.practice > 0 ? 'Completed ✓' : 'Not Started';
            }
            
            if (progressFill) {
                progressFill.style.width = `${progressPercent}%`;
            }
            
            if (progressText) {
                progressText.textContent = progressLabel;
            }
        } else {
            // Locked state with improved messaging (Phase 1 G1)
            if (progressFill) {
                progressFill.style.width = '0%';
            }
            
            if (progressText) {
                const prevModule = this.app.moduleManager.getPreviousModule(module.id);
                if (prevModule) {
                    progressText.textContent = `Complete ${prevModule.name} Marathon to unlock`;
                } else {
                    progressText.textContent = 'Locked';
                }
            }
        }
    }
    
    updateModuleDescription(card, module) {
        const descriptionEl = card.querySelector('p');
        if (descriptionEl && module.detailedDescription) {
            descriptionEl.textContent = module.detailedDescription;
        }
    }
    
    updateProgressStats() {
        const practiceMinutes = Math.floor(this.app.totalPracticeTime / (1000 * 60));
        const unlockedCount = this.app.moduleManager.getUnlockedModules().length;
        
        const practiceTimeEl = document.getElementById('totalPracticeTime');
        const unlockedModulesEl = document.getElementById('unlockedModules');
        
        if (practiceTimeEl) practiceTimeEl.textContent = `${practiceMinutes}m`;
        if (unlockedModulesEl) unlockedModulesEl.textContent = `${unlockedCount}/5`;
        
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
        }
    }
    
    hideUnlockNotice() {
        const unlockNotice = document.getElementById('unlockNotice');
        if (unlockNotice) {
            unlockNotice.style.display = 'none';
        }
    }
    
    // Notification system
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showWarning(message) {
        this.showNotification(message, 'warning');
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            max-width: 300px;
            animation: slideIn 0.3s ease;
        `;
        
        switch (type) {
            case 'success':
                notification.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
                break;
            case 'error':
                notification.style.background = 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)';
                break;
            case 'warning':
                notification.style.background = 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)';
                break;
            default:
                notification.style.background = 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)';
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }
    
    // Modal management
    showFeedbackModal(title, content) {
        const modal = document.getElementById('feedbackModal');
        const titleEl = document.getElementById('feedbackTitle');
        const contentEl = document.getElementById('feedbackContent');
        
        if (titleEl) titleEl.textContent = title;
        if (contentEl) contentEl.innerHTML = content;
        if (modal) modal.style.display = 'flex';
    }
    
    closeFeedbackModal() {
        const modal = document.getElementById('feedbackModal');
        if (modal) modal.style.display = 'none';
        this.showModuleDashboard();
    }
    
    // Add missing UI helper methods
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
        feedback.textContent = '✓ Great response!';
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(76, 175, 80, 0.9);
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            font-weight: 600;
            z-index: 1000;
            animation: fadeInOut 2s ease;
        `;
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.remove();
        }, 2000);
    }
    
    showCallFeedback(feedback, success) {
        const feedbackEl = document.createElement('div');
        feedbackEl.className = `call-feedback ${success ? 'success' : 'error'}`;
        feedbackEl.textContent = feedback;
        feedbackEl.style.cssText = `
            position: absolute;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            padding: 10px 15px;
            border-radius: 8px;
            color: white;
            font-size: 0.9rem;
            z-index: 100;
            max-width: 280px;
            text-align: center;
            background: ${success ? 'rgba(76, 175, 80, 0.9)' : 'rgba(244, 67, 54, 0.9)'};
        `;
        
        const phoneInterface = document.getElementById('phoneInterface');
        if (phoneInterface) {
            phoneInterface.appendChild(feedbackEl);
            
            setTimeout(() => {
                feedbackEl.remove();
            }, 3000);
        }
    }
    
    // Additional CSS for animations and Phase 1 fixes
    addAnimationStyles() {
        if (!document.getElementById('uiAnimationStyles')) {
            const style = document.createElement('style');
            style.id = 'uiAnimationStyles';
            style.textContent = `
                @keyframes fadeInOut {
                    0%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    20%, 80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
                
                .quick-success {
                    pointer-events: none;
                }
                
                .call-feedback {
                    animation: slideUp 0.3s ease;
                }
                
                @keyframes slideUp {
                    from { transform: translateX(-50%) translateY(20px); opacity: 0; }
                    to { transform: translateX(-50%) translateY(0); opacity: 1; }
                }
                
                /* Fix marathon button text centering (Phase 1 F2) */
                .btn-marathon {
                    text-align: center !important;
                    white-space: nowrap !important;
                    overflow: hidden !important;
                    text-overflow: ellipsis !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    padding: 8px 12px !important;
                }
                
                /* Phone interface improvements (Phase 1 G1) */
                .call-btn.decline-btn {
                    position: relative !important;
                    z-index: 10 !important;
                    margin: 0 auto !important;
                    max-width: 80px !important;
                    max-height: 80px !important;
                }
                
                .call-actions {
                    display: flex !important;
                    justify-content: center !important;
                    align-items: center !important;
                    padding: 0 20px !important;
                }
                
                /* Better locked state indicators (Phase 1 G1) */
                .module-card.locked {
                    opacity: 0.6;
                    background: #f8f9fa;
                    border: 2px dashed #dee2e6;
                }
                
                .module-card.locked .progress-text {
                    font-weight: 600;
                    color: #6c757d;
                    background: rgba(108, 117, 125, 0.1);
                    padding: 5px 10px;
                    border-radius: 5px;
                    font-size: 0.85rem;
                }

                /* Phase 2: Enhanced form styling */
                .user-form {
                    position: relative;
                    transition: all 0.3s ease;
                }
                
                .user-form.verification-mode {
                    transform: translateX(-10px);
                }
                
                #verificationForm {
                    animation: slideInRight 0.4s ease;
                }
                
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                /* Enhanced select and textarea styling */
                select:focus, textarea:focus {
                    outline: none !important;
                    border-color: #667eea !important;
                    background: white !important;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
                }
                
                /* Character counter styling */
                .char-counter {
                    font-size: 0.8rem;
                    color: #6c757d;
                    text-align: right;
                    margin-top: 5px;
                    transition: color 0.3s ease;
                }
                
                .char-counter.warning {
                    color: #ffc107;
                }
                
                .char-counter.danger {
                    color: #dc3545;
                }
                
                /* Custom input animations */
                .custom-input-appear {
                    animation: fadeInDown 0.3s ease;
                }
                
                @keyframes fadeInDown {
                    from { transform: translateY(-10px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                
                /* Verification code input styling */
                #verificationCode {
                    text-align: center !important;
                    font-size: 1.2rem !important;
                    letter-spacing: 0.2rem !important;
                    font-weight: 600 !important;
                }
                
                #verificationCode:focus {
                    letter-spacing: 0.3rem !important;
                    transform: scale(1.02);
                }
                
                /* Success animations */
                .success-bounce {
                    animation: successBounce 0.6s ease;
                }
                
                @keyframes successBounce {
                    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-10px); }
                    60% { transform: translateY(-5px); }
                }
                
                /* Loading states */
                .loading-dots::after {
                    content: '';
                    animation: loadingDots 1.5s steps(4, end) infinite;
                }
                
                @keyframes loadingDots {
                    0%, 20% { content: '.'; }
                    40% { content: '..'; }
                    60% { content: '...'; }
                    80%, 100% { content: ''; }
                }
            `;
            document.head.appendChild(style);
        }
    }
}