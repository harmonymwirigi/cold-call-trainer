/**
 * User Manager - Handles user registration, authentication, and access levels
 * Phase 2 Update: Added email verification system
 */

export class UserManager {
    constructor(app) {
        this.app = app;
        this.accessLevels = {
            UNLIMITED: 'unlimited',
            UNLIMITED_LOCKED: 'unlimited_locked', 
            LIMITED: 'limited'
        };
        this.usageTracking = {
            sessionTime: 0,
            totalUsage: 0,
            lastReset: null
        };
    }
    
    startTraining() {
        const firstName = document.getElementById('userName').value.trim();
        const email = document.getElementById('userEmail').value.trim();
        const prospectJobTitle = document.getElementById('prospectJobTitle').value;
        const prospectIndustry = document.getElementById('prospectIndustry')?.value || '';
        const targetMarket = document.getElementById('targetMarket').value;
        const customBehavior = document.getElementById('customBehavior')?.value.trim() || '';
        
        if (!firstName || !email || !prospectJobTitle || !targetMarket) {
            this.app.uiManager.showError('Please fill in all required fields to continue.');
            return;
        }
        
        if (!this.validateEmail(email)) {
            this.app.uiManager.showError('Please enter a valid email address.');
            return;
        }
        
        // Get custom job title if "other" was selected
        let finalJobTitle = prospectJobTitle;
        if (prospectJobTitle === 'other') {
            const customJobTitle = document.getElementById('customJobTitle')?.value.trim();
            if (!customJobTitle) {
                this.app.uiManager.showError('Please specify the custom job title.');
                return;
            }
            finalJobTitle = customJobTitle;
        }
        
        // Get custom industry if "other" was selected
        let finalIndustry = prospectIndustry;
        if (prospectIndustry === 'other') {
            const customIndustry = document.getElementById('customIndustry')?.value.trim();
            if (!customIndustry) {
                this.app.uiManager.showError('Please specify the custom industry.');
                return;
            }
            finalIndustry = customIndustry;
        }
        
        const user = {
            firstName,
            email,
            prospectJobTitle: finalJobTitle,
            prospectIndustry: finalIndustry,
            targetMarket,
            customBehavior,
            startTime: new Date().toISOString(),
            accessLevel: this.determineAccessLevel(email),
            emailVerified: false
        };
        
        // Start email verification process
        this.sendEmailVerification(email, firstName, user);
    }
    
    async sendEmailVerification(email, firstName, pendingUser) {
        // Generate verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000);
        
        try {
            // Store verification code and user data temporarily
            sessionStorage.setItem('verificationCode', verificationCode.toString());
            sessionStorage.setItem('pendingUser', JSON.stringify(pendingUser));
            sessionStorage.setItem('verificationEmail', email);
            
            // In production, send actual email here
            console.log(`📧 Verification code for ${email}: ${verificationCode}`);
            
            // For demo purposes, show the code in console and alert
            alert(`Demo Mode: Your verification code is ${verificationCode}\n\nIn production, this would be sent to your email.`);
            
            // Show verification form
            this.showVerificationForm();
            
            // Store lead data immediately (before verification)
            this.captureLeadData(pendingUser);
            
            return true;
        } catch (error) {
            console.error('Failed to send verification email:', error);
            this.app.uiManager.showError('Failed to send verification email. Please try again.');
            return false;
        }
    }
    
    showVerificationForm() {
        // Hide registration form
        document.getElementById('userForm').style.display = 'none';
        
        // Remove existing verification form if present
        const existingForm = document.getElementById('verificationForm');
        if (existingForm) {
            existingForm.remove();
        }
        
        // Create verification form
        const verificationHTML = `
            <div id="verificationForm" class="user-form">
                <h3>✉️ Verify Your Email</h3>
                <p>We've sent a 6-digit verification code to your email address.</p>
                <div class="form-group">
                    <label for="verificationCode">Verification Code:</label>
                    <input type="text" id="verificationCode" placeholder="Enter 6-digit code" maxlength="6" required 
                           style="text-align: center; font-size: 1.2rem; letter-spacing: 0.2rem;">
                </div>
                <div class="form-actions">
                    <button class="btn btn-secondary" onclick="showRegistrationForm()">← Back</button>
                    <button class="btn btn-primary" onclick="verifyEmailCode()">Verify & Continue</button>
                </div>
                <p style="text-align: center; margin-top: 15px; color: #6c757d;">
                    Didn't receive the code? <a href="#" onclick="resendVerificationCode()" style="color: #667eea;">Resend Code</a>
                </p>
            </div>
        `;
        
        // Insert after the original user form
        document.getElementById('userForm').insertAdjacentHTML('afterend', verificationHTML);
        
        // Focus on verification input
        setTimeout(() => {
            document.getElementById('verificationCode').focus();
        }, 100);
        
        // Auto-submit when 6 digits entered
        document.getElementById('verificationCode').addEventListener('input', (e) => {
            if (e.target.value.length === 6) {
                setTimeout(() => {
                    this.verifyEmailCode();
                }, 500);
            }
        });
    }
    
    showRegistrationForm() {
        // Show registration form
        document.getElementById('userForm').style.display = 'block';
        
        // Hide verification form
        const verificationForm = document.getElementById('verificationForm');
        if (verificationForm) {
            verificationForm.style.display = 'none';
        }
    }
    
    verifyEmailCode() {
        const enteredCode = document.getElementById('verificationCode').value.trim();
        const storedCode = sessionStorage.getItem('verificationCode');
        const pendingUser = JSON.parse(sessionStorage.getItem('pendingUser') || '{}');
        
        if (!enteredCode) {
            this.app.uiManager.showError('Please enter the verification code.');
            return;
        }
        
        if (enteredCode === storedCode) {
            // Clean up verification data
            sessionStorage.removeItem('verificationCode');
            sessionStorage.removeItem('pendingUser');
            sessionStorage.removeItem('verificationEmail');
            
            // Complete registration
            const user = {
                ...pendingUser,
                emailVerified: true
            };
            
            this.completeRegistration(user);
            
            // Remove verification form
            const verificationForm = document.getElementById('verificationForm');
            if (verificationForm) {
                verificationForm.remove();
            }
            
        } else {
            this.app.uiManager.showError('Invalid verification code. Please try again.');
            
            // Clear the input and focus
            const codeInput = document.getElementById('verificationCode');
            codeInput.value = '';
            codeInput.focus();
        }
    }
    
    resendVerificationCode() {
        const email = sessionStorage.getItem('verificationEmail');
        const pendingUser = JSON.parse(sessionStorage.getItem('pendingUser') || '{}');
        
        if (!email || !pendingUser.firstName) {
            this.app.uiManager.showError('Session expired. Please start registration again.');
            this.showRegistrationForm();
            return;
        }
        
        // Generate new code
        const verificationCode = Math.floor(100000 + Math.random() * 900000);
        sessionStorage.setItem('verificationCode', verificationCode.toString());
        
        // In production, send actual email here
        console.log(`📧 New verification code for ${email}: ${verificationCode}`);
        alert(`Demo Mode: Your new verification code is ${verificationCode}`);
        
        this.app.uiManager.showSuccess('New verification code sent!');
        
        // Clear and focus input
        const codeInput = document.getElementById('verificationCode');
        if (codeInput) {
            codeInput.value = '';
            codeInput.focus();
        }
    }
    
    completeRegistration(user) {
        this.app.setCurrentUser(user);
        this.app.logActivity('user_registered', { user });
        
        // Initialize usage tracking
        this.initializeUsageTracking(user);
        
        // Show success message
        this.app.uiManager.showSuccess(`Welcome ${user.firstName}! Your email has been verified.`);
        
        // Show dashboard
        setTimeout(() => {
            this.app.uiManager.showModuleDashboard();
        }, 1500);
    }
    
    async captureLeadData(user) {
        try {
            // Enhanced lead data with verification status
            const leadData = {
                firstName: user.firstName,
                email: user.email,
                prospectJobTitle: user.prospectJobTitle,
                prospectIndustry: user.prospectIndustry,
                targetMarket: user.targetMarket,
                customBehavior: user.customBehavior,
                timestamp: user.startTime,
                source: 'cold-call-trainer',
                emailVerified: user.emailVerified || false,
                accessLevel: user.accessLevel,
                userAgent: navigator.userAgent,
                referrer: document.referrer
            };
            
            console.log('📧 Enhanced lead captured:', leadData);
            
            // Store locally
            const leads = JSON.parse(localStorage.getItem('capturedLeads') || '[]');
            leads.push(leadData);
            localStorage.setItem('capturedLeads', JSON.stringify(leads));
            
            // In production, send to backend/CRM
            // await this.sendToBackend(leadData);
            
        } catch (error) {
            console.error('Failed to capture lead data:', error);
        }
    }
    
    // Production method for sending to backend
    async sendToBackend(leadData) {
        try {
            const response = await fetch('/api/capture-lead', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(leadData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            console.log('✅ Lead sent to backend successfully');
        } catch (error) {
            console.error('❌ Failed to send lead to backend:', error);
        }
    }
    
    determineAccessLevel(email) {
        // Enhanced access level logic
        // For demo purposes, all users get unlimited access
        return this.accessLevels.UNLIMITED;
        
        // Production logic examples:
        // if (email.includes('premium') || email.includes('pro')) return this.accessLevels.UNLIMITED;
        // if (email.includes('trial')) return this.accessLevels.UNLIMITED_LOCKED;
        // return this.accessLevels.LIMITED;
    }
    
    initializeUsageTracking(user) {
        this.usageTracking = {
            sessionTime: 0,
            totalUsage: this.loadUserUsage(user.email),
            lastReset: this.getLastResetDate(user.email),
            accessLevel: user.accessLevel
        };
        
        // Start session timer
        this.startSessionTimer();
    }
    
    startSessionTimer() {
        this.sessionStartTime = Date.now();
        
        // Update usage every minute
        this.usageTimer = setInterval(() => {
            this.updateUsage();
        }, 60000); // 1 minute
    }
    
    updateUsage() {
        if (!this.sessionStartTime) return;
        
        const currentTime = Date.now();
        const sessionDuration = currentTime - this.sessionStartTime;
        
        this.usageTracking.sessionTime = sessionDuration;
        this.usageTracking.totalUsage += sessionDuration;
        
        // Check usage limits
        this.checkUsageLimits();
        
        // Save usage
        this.saveUserUsage();
    }
    
    checkUsageLimits() {
        const user = this.app.getCurrentUser();
        if (!user) return;
        
        const hourlyUsage = this.usageTracking.totalUsage / (1000 * 60 * 60);
        
        switch (user.accessLevel) {
            case this.accessLevels.UNLIMITED:
            case this.accessLevels.UNLIMITED_LOCKED:
                if (hourlyUsage >= 50) { // 50 hours per month
                    this.handleUsageLimitReached('monthly');
                }
                break;
                
            case this.accessLevels.LIMITED:
                if (hourlyUsage >= 3) { // 3 hours total
                    this.handleUsageLimitReached('lifetime');
                }
                break;
        }
    }
    
    handleUsageLimitReached(limitType) {
        const message = limitType === 'monthly' 
            ? 'You have reached your monthly usage limit of 50 hours. Your access will reset next month.'
            : 'You have reached your lifetime usage limit of 3 hours. Please upgrade for continued access.';
            
        this.app.uiManager.showError(message);
        
        // Disable access to locked modules
        if (this.app.isInCall()) {
            this.app.callManager.endCall();
        }
    }
    
    hasAccessToModule(moduleId) {
        const user = this.app.getCurrentUser();
        if (!user) return false;
        
        // Check usage limits first
        const hourlyUsage = this.usageTracking.totalUsage / (1000 * 60 * 60);
        
        switch (user.accessLevel) {
            case this.accessLevels.UNLIMITED:
                return hourlyUsage < 50; // All modules if under limit
                
            case this.accessLevels.UNLIMITED_LOCKED:
                if (hourlyUsage >= 50) return false;
                // Only opener module or temporarily unlocked modules
                return moduleId === 'opener' || this.isTemporarilyUnlocked(moduleId);
                
            case this.accessLevels.LIMITED:
                if (hourlyUsage >= 3) return false;
                // Only opener module, permanent unlocks
                return moduleId === 'opener' || this.isPermanentlyUnlocked(moduleId);
                
            default:
                return false;
        }
    }
    
    isTemporarilyUnlocked(moduleId) {
        const unlockData = JSON.parse(localStorage.getItem('temporaryUnlocks') || '{}');
        const unlock = unlockData[moduleId];
        
        if (!unlock) return false;
        
        const unlockTime = new Date(unlock.unlockedAt);
        const now = new Date();
        const hoursElapsed = (now - unlockTime) / (1000 * 60 * 60);
        
        return hoursElapsed < 24; // 24-hour unlock
    }
    
    isPermanentlyUnlocked(moduleId) {
        const user = this.app.getCurrentUser();
        if (!user) return false;
        
        const unlockedModules = JSON.parse(localStorage.getItem(`permanentUnlocks_${user.email}`) || '[]');
        return unlockedModules.includes(moduleId);
    }
    
    unlockModuleTemporarily(moduleId) {
        const unlockData = JSON.parse(localStorage.getItem('temporaryUnlocks') || '{}');
        unlockData[moduleId] = {
            unlockedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };
        localStorage.setItem('temporaryUnlocks', JSON.stringify(unlockData));
        
        this.app.logActivity('module_unlocked_temporarily', { moduleId });
    }
    
    unlockModulePermanently(moduleId) {
        const user = this.app.getCurrentUser();
        if (!user) return;
        
        const unlockedModules = JSON.parse(localStorage.getItem(`permanentUnlocks_${user.email}`) || '[]');
        if (!unlockedModules.includes(moduleId)) {
            unlockedModules.push(moduleId);
            localStorage.setItem(`permanentUnlocks_${user.email}`, JSON.stringify(unlockedModules));
        }
        
        this.app.logActivity('module_unlocked_permanently', { moduleId });
    }
    
    loadUserUsage(email) {
        try {
            const usageData = JSON.parse(localStorage.getItem(`usage_${email}`) || '{}');
            return usageData.totalUsage || 0;
        } catch (error) {
            console.error('Failed to load user usage:', error);
            return 0;
        }
    }
    
    saveUserUsage() {
        const user = this.app.getCurrentUser();
        if (!user) return;
        
        try {
            const usageData = {
                totalUsage: this.usageTracking.totalUsage,
                lastUpdated: new Date().toISOString(),
                accessLevel: user.accessLevel
            };
            
            localStorage.setItem(`usage_${user.email}`, JSON.stringify(usageData));
        } catch (error) {
            console.error('Failed to save user usage:', error);
        }
    }
    
    getLastResetDate(email) {
        try {
            const usageData = JSON.parse(localStorage.getItem(`usage_${email}`) || '{}');
            return usageData.lastReset || new Date().toISOString();
        } catch (error) {
            return new Date().toISOString();
        }
    }
    
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    cleanup() {
        if (this.usageTimer) {
            clearInterval(this.usageTimer);
        }
        this.updateUsage(); // Final usage update
    }
}