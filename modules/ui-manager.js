/**
 * UI Manager - Handles all user interface updates and interactions
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
        // Update header text
        this.updateHeaderText();
        
        // Update form labels
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
        
        const jobTitles = [
            'Brand/Communications Manager',
            'CEO (Chief Executive Officer)',
            'CFO (Chief Financial Officer)',
            'CIO (Chief Information Officer)',
            'COO (Chief Operating Officer)',
            'Content Marketing Manager',
            'CTO (Chief Technology Officer)',
            'Demand Generation Manager',
            'Digital Marketing Manager',
            'Engineering Manager',
            'Finance Director',
            'Founder / Owner / Managing Director (MD)',
            'Head of Product',
            'Purchasing Manager',
            'R&D/Product Development Manager',
            'Sales Manager',
            'Sales Operations Manager',
            'Social Media Manager',
            'UX/UI Design Lead',
            'VP of Finance',
            'VP of HR',
            'VP of IT/Engineering',
            'VP of Marketing',
            'VP of Sales'
        ];
        
        // Update the select element ID and attributes
        jobTitleSelect.id = 'prospectJobTitle';
        
        // Update label
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
            
            const customGroup = document.createElement('div');
            customGroup.className = 'form-group';
            
            const customLabel = document.createElement('label');
            customLabel.setAttribute('for', 'customBehavior');
            customLabel.textContent = 'Additional AI Behavior (Optional):';
            
            const customTextarea = document.createElement('textarea');
            customTextarea.id = 'customBehavior';
            customTextarea.placeholder = 'e.g., "Act more skeptical", "Be very busy", "Show interest in cost savings"...';
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
            `;
            
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
            
            customGroup.appendChild(customLabel);
            customGroup.appendChild(customTextarea);
            
            // Insert after industry group
            industryContainer.insertAdjacentElement('afterend', customGroup);
            
            console.log('✅ Custom behavior field created');
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
        `;
        
        const label = document.createElement('div');
        label.textContent = labelText;
        label.style.cssText = `
            margin-top: 10px;
            font-size: 0.9rem;
            color: #667eea;
            font-weight: 600;
        `;
        
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
                    // Fix marathon button text centering
                    marathonBtn.style.textAlign = 'center';
                    marathonBtn.style.whiteSpace = 'nowrap';
                    marathonBtn.style.overflow = 'hidden';
                } else {
                    marathonBtn.style.display = 'none';
                }
            }
            
            // Handle legend button - REMOVE from UI (F1)
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
            // Locked state
            if (progressFill) {
                progressFill.style.width = '0%';
            }
            
            if (progressText) {
                const prevModule = this.app.moduleManager.getPreviousModule(module.id);
                progressText.textContent = prevModule 
                    ? `Pass the Marathon of ${prevModule.name} to unlock this roleplay`
                    : 'Locked';
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
                
                /* Fix marathon button text centering (F2) */
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
                
                /* Phone interface improvements (G1) */
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
                
                /* Better locked state indicators (G1) */
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
            `;
            document.head.appendChild(style);
        }
    }
}