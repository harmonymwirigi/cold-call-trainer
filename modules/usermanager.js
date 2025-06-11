/**
 * User Manager - Fixed with Session Persistence and Better Error Handling
 * Fix: Session persistence, user update errors, and form state management
 */

export class UserManager {
    constructor(app) {
        this.app = app;
        
        // Enhanced Access Levels
        this.accessLevels = {
            UNLIMITED: 'unlimited',           // All roleplays unlocked (50 hours/month fair usage)
            UNLIMITED_LOCKED: 'unlimited_locked', // Only roleplay 1 unlocked, others 24hr unlock (50 hours/month)
            LIMITED: 'limited'               // 3 hours or 7 days lifetime, roleplay 1 only (permanent unlocks)
        };
        
        // Usage tracking
        this.usageTracking = {
            sessionTime: 0,
            totalUsage: 0,
            monthlyUsage: 0,
            lastReset: null,
            accessLevel: null
        };

        // Verification state
        this.verificationState = {
            email: null,
            pendingUser: null,
            attemptsLeft: 5,
            expiresAt: null,
            canResend: true
        };
        
        // CRITICAL FIX: Check for existing session on initialization
        this.initializeSession();
    }
    
    // CRITICAL FIX: Initialize session and check for existing user
    initializeSession() {
        try {
            // Check if user is already logged in
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                const user = JSON.parse(savedUser);
                console.log('🔄 Found existing user session:', user.firstName);
                
                // Set the current user
                this.app.setCurrentUser(user);
                
                // Initialize usage tracking
                this.initializeUsageTracking(user);
                
                // Hide the form and show dashboard
                document.getElementById('userForm').style.display = 'none';
                
                // Show welcome back message
                this.app.uiManager.showSuccess(`Welcome back, ${user.firstName}!`);
                
                // Show dashboard after a brief delay
                setTimeout(() => {
                    this.app.uiManager.showModuleDashboard();
                }, 1500);
            }
        } catch (error) {
            console.error('Failed to initialize session:', error);
            // Clear potentially corrupted session data
            localStorage.removeItem('currentUser');
        }
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
            
            // Analytics data
            userAgent: navigator.userAgent,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            screenResolution: `${screen.width}x${screen.height}`,
            referrer: document.referrer,
            utmSource: this.getUrlParameter('utm_source'),
            utmMedium: this.getUrlParameter('utm_medium'),
            utmCampaign: this.getUrlParameter('utm_campaign'),
            sessionId: this.generateSessionId(),
            fingerprintId: this.generateFingerprint(),
            timeToRegister: Date.now() - performance.timing.navigationStart
        };
        
        // Send email verification via API
        this.sendEmailVerification(user);
    }
    
    async sendEmailVerification(user) {
        try {
            this.app.uiManager.showNotification('Sending verification email...', 'info');
            
            const response = await fetch('/api/send-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(user)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to send verification email');
            }
            
            // Store verification state
            this.verificationState = {
                email: user.email,
                pendingUser: user,
                attemptsLeft: 5,
                expiresAt: data.expiresAt,
                canResend: false
            };
            
            this.app.uiManager.showSuccess('Verification email sent! Check your inbox.');
            this.showVerificationForm();
            
            // Start resend cooldown
            this.startResendCooldown();
            
        } catch (error) {
            console.error('Send verification error:', error);
            this.app.uiManager.showError(error.message || 'Failed to send verification email. Please try again.');
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
        
        // Create enhanced verification form
        const verificationHTML = `
            <div id="verificationForm" class="user-form verification-form">
                <div class="verification-header">
                    <div class="verification-icon">📧</div>
                    <h3>Verify Your Email</h3>
                    <p>We've sent a 6-digit verification code to <strong>${this.verificationState.email}</strong></p>
                    <div class="verification-timer" id="verificationTimer">
                        <span id="timerDisplay">Code expires in 10:00</span>
                    </div>
                </div>
                <div class="form-group">
                    <label for="verificationCode">Verification Code:</label>
                    <input type="text" id="verificationCode" placeholder="Enter 6-digit code" maxlength="6" required 
                           style="text-align: center; font-size: 1.4rem; letter-spacing: 0.3rem; font-weight: 600;">
                    <div class="verification-status" id="verificationStatus"></div>
                    <div class="attempts-left" id="attemptsLeft">
                        <span id="attemptsCount">${this.verificationState.attemptsLeft}</span> attempts remaining
                    </div>
                </div>
                <div class="form-actions">
                    <button class="btn btn-secondary" onclick="showRegistrationForm()">← Back</button>
                    <button class="btn btn-primary" id="verifyBtn" onclick="verifyEmailCode()">Verify & Continue</button>
                </div>
                <div class="verification-footer">
                    <p>Didn't receive the code? 
                        <a href="#" onclick="resendVerificationCode()" id="resendLink" style="display: none;">Resend Code</a>
                        <span id="resendCountdown">You can resend in <span id="resendTimer">60</span>s</span>
                    </p>
                </div>
            </div>
        `;
        
        // Insert after the original user form
        document.getElementById('userForm').insertAdjacentHTML('afterend', verificationHTML);
        
        // Start verification timer
        this.startVerificationTimer();
        
        // Focus on verification input
        setTimeout(() => {
            document.getElementById('verificationCode').focus();
        }, 100);
        
        // Auto-submit when 6 digits entered
        document.getElementById('verificationCode').addEventListener('input', (e) => {
            const value = e.target.value.replace(/\D/g, ''); // Only digits
            e.target.value = value;
            
            if (value.length === 6) {
                setTimeout(() => {
                    this.verifyEmailCode();
                }, 500);
            }
            
            // Real-time validation feedback
            if (value.length === 6) {
                this.updateVerificationStatus('Checking code...', 'checking');
            } else {
                this.updateVerificationStatus('', '');
            }
        });
    }
    
    startVerificationTimer() {
        if (!this.verificationState.expiresAt) return;
        
        const timer = setInterval(() => {
            const now = new Date();
            const expiresAt = new Date(this.verificationState.expiresAt);
            const timeLeft = expiresAt - now;
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                this.handleVerificationExpiry();
                return;
            }
            
            const minutes = Math.floor(timeLeft / 60000);
            const seconds = Math.floor((timeLeft % 60000) / 1000);
            
            const timerDisplay = document.getElementById('timerDisplay');
            if (timerDisplay) {
                timerDisplay.textContent = `Code expires in ${minutes}:${seconds.toString().padStart(2, '0')}`;
                
                // Warning colors
                if (timeLeft < 120000) { // Less than 2 minutes
                    timerDisplay.style.color = '#ff6b6b';
                } else if (timeLeft < 300000) { // Less than 5 minutes
                    timerDisplay.style.color = '#ffa726';
                }
            }
        }, 1000);
    }
    
    startResendCooldown() {
        let countdown = 60;
        const resendLink = document.getElementById('resendLink');
        const resendCountdown = document.getElementById('resendCountdown');
        const resendTimer = document.getElementById('resendTimer');
        
        this.verificationState.canResend = false;
        
        const timer = setInterval(() => {
            countdown--;
            if (resendTimer) resendTimer.textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(timer);
                this.verificationState.canResend = true;
                if (resendLink) resendLink.style.display = 'inline';
                if (resendCountdown) resendCountdown.style.display = 'none';
            }
        }, 1000);
    }
    
    updateVerificationStatus(message, type) {
        const status = document.getElementById('verificationStatus');
        if (!status) return;
        
        status.textContent = message;
        status.className = `verification-status ${type}`;
    }
    
    updateAttemptsLeft() {
        const attemptsCount = document.getElementById('attemptsCount');
        if (attemptsCount) {
            attemptsCount.textContent = this.verificationState.attemptsLeft;
            
            if (this.verificationState.attemptsLeft <= 2) {
                attemptsCount.style.color = '#ff6b6b';
            }
        }
    }
    
    handleVerificationExpiry() {
        this.updateVerificationStatus('Verification code expired. Please request a new one.', 'error');
        
        const verifyBtn = document.getElementById('verifyBtn');
        const codeInput = document.getElementById('verificationCode');
        
        if (verifyBtn) verifyBtn.disabled = true;
        if (codeInput) codeInput.disabled = true;
        
        // Auto-show resend option
        const resendLink = document.getElementById('resendLink');
        const resendCountdown = document.getElementById('resendCountdown');
        
        if (resendLink) resendLink.style.display = 'inline';
        if (resendCountdown) resendCountdown.style.display = 'none';
        
        this.verificationState.canResend = true;
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
    
    async verifyEmailCode() {
        const enteredCode = document.getElementById('verificationCode').value.trim();
        
        if (!enteredCode) {
            this.updateVerificationStatus('Please enter the verification code.', 'error');
            return;
        }
        
        if (enteredCode.length !== 6) {
            this.updateVerificationStatus('Verification code must be 6 digits.', 'error');
            return;
        }
        
        if (this.verificationState.attemptsLeft <= 0) {
            this.updateVerificationStatus('Maximum attempts exceeded. Please request a new code.', 'error');
            return;
        }
        
        try {
            this.updateVerificationStatus('Verifying code...', 'checking');
            
            // CRITICAL FIX: Include all the original user data in verification
            const verificationData = {
                email: this.verificationState.email,
                verificationCode: enteredCode,
                // Include all the original form data
                firstName: this.verificationState.pendingUser.firstName,
                prospectJobTitle: this.verificationState.pendingUser.prospectJobTitle,
                prospectIndustry: this.verificationState.pendingUser.prospectIndustry,
                targetMarket: this.verificationState.pendingUser.targetMarket,
                customBehavior: this.verificationState.pendingUser.customBehavior,
                // Include analytics data
                userAgent: this.verificationState.pendingUser.userAgent,
                timezone: this.verificationState.pendingUser.timezone,
                language: this.verificationState.pendingUser.language,
                screenResolution: this.verificationState.pendingUser.screenResolution,
                referrer: this.verificationState.pendingUser.referrer,
                utmSource: this.verificationState.pendingUser.utmSource,
                utmMedium: this.verificationState.pendingUser.utmMedium,
                utmCampaign: this.verificationState.pendingUser.utmCampaign
            };
            
            const response = await fetch('/api/verify-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(verificationData)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                this.verificationState.attemptsLeft--;
                this.updateAttemptsLeft();
                
                if (this.verificationState.attemptsLeft <= 0) {
                    this.updateVerificationStatus('Maximum attempts exceeded. Please request a new code.', 'error');
                    const verifyBtn = document.getElementById('verifyBtn');
                    if (verifyBtn) verifyBtn.disabled = true;
                } else {
                    this.updateVerificationStatus(data.message || 'Invalid verification code. Please try again.', 'error');
                }
                
                // Clear the input and focus
                const codeInput = document.getElementById('verificationCode');
                codeInput.value = '';
                codeInput.focus();
                
                // Add shake animation
                codeInput.style.animation = 'shake 0.5s ease-in-out';
                setTimeout(() => {
                    codeInput.style.animation = '';
                }, 500);
                
                return;
            }
            
            this.updateVerificationStatus('✓ Code verified successfully!', 'success');
            
            // Complete registration
            setTimeout(() => {
                this.completeRegistration(data.user, data.isNewUser);
                
                // Remove verification form
                const verificationForm = document.getElementById('verificationForm');
                if (verificationForm) {
                    verificationForm.remove();
                }
            }, 1000);
            
        } catch (error) {
            console.error('Verification error:', error);
            this.updateVerificationStatus('Network error. Please try again.', 'error');
        }
    }
    
    async resendVerificationCode() {
        if (!this.verificationState.canResend) {
            this.app.uiManager.showWarning('Please wait before requesting a new code.');
            return;
        }
        
        if (!this.verificationState.email) {
            this.app.uiManager.showError('Session expired. Please start registration again.');
            this.showRegistrationForm();
            return;
        }
        
        try {
            this.app.uiManager.showNotification('Sending new verification code...', 'info');
            
            const response = await fetch('/api/resend-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: this.verificationState.email
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                if (response.status === 429) {
                    this.app.uiManager.showWarning(`Please wait ${data.retryAfter} seconds before requesting a new code.`);
                } else {
                    throw new Error(data.message || 'Failed to resend verification code');
                }
                return;
            }
            
            // Reset verification state
            this.verificationState.attemptsLeft = 5;
            this.verificationState.expiresAt = data.expiresAt;
            
            this.updateVerificationStatus('New code sent successfully!', 'success');
            this.updateAttemptsLeft();
            
            // Reset form state
            const verifyBtn = document.getElementById('verifyBtn');
            const codeInput = document.getElementById('verificationCode');
            
            if (verifyBtn) verifyBtn.disabled = false;
            if (codeInput) {
                codeInput.disabled = false;
                codeInput.value = '';
                codeInput.focus();
            }
            
            // Restart timers
            this.startVerificationTimer();
            this.startResendCooldown();
            
            this.app.uiManager.showSuccess('New verification code sent!');
            
        } catch (error) {
            console.error('Resend verification error:', error);
            this.app.uiManager.showError(error.message || 'Failed to resend verification code. Please try again.');
        }
    }
    
    completeRegistration(user, isNewUser) {
        // CRITICAL FIX: Save user session to localStorage
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        this.app.setCurrentUser(user);
        this.app.logActivity('user_registered', { user, isNewUser });
        
        // Initialize usage tracking
        this.initializeUsageTracking(user);
        
        // Show success message
        const welcomeMessage = isNewUser 
            ? `Welcome ${user.firstName}! Your account has been created and verified.`
            : `Welcome back ${user.firstName}! Your email has been verified.`;
            
        this.app.uiManager.showSuccess(welcomeMessage);
        
        // Show dashboard
        setTimeout(() => {
            this.app.uiManager.showModuleDashboard();
        }, 1500);
    }
    
    // CRITICAL FIX: Add logout functionality
    logout() {
        try {
            // Clear session data
            localStorage.removeItem('currentUser');
            
            // Reset app state
            this.app.setCurrentUser(null);
            this.usageTracking = {
                sessionTime: 0,
                totalUsage: 0,
                monthlyUsage: 0,
                lastReset: null,
                accessLevel: null
            };
            
            // Stop any active sessions
            if (this.usageTimer) {
                clearInterval(this.usageTimer);
            }
            
            // Show registration form
            document.getElementById('userForm').style.display = 'block';
            document.getElementById('moduleDashboard').style.display = 'none';
            document.getElementById('phoneInterface').style.display = 'none';
            
            // Clear form fields
            document.getElementById('userName').value = '';
            document.getElementById('userEmail').value = '';
            document.getElementById('prospectJobTitle').value = '';
            document.getElementById('targetMarket').value = '';
            
            this.app.uiManager.showSuccess('Logged out successfully');
            
            console.log('🚪 User logged out');
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
    
    initializeUsageTracking(user) {
        this.usageTracking = {
            sessionTime: 0,
            totalUsage: 0,
            monthlyUsage: 0,
            lastReset: new Date().toISOString(),
            accessLevel: user.accessLevel
        };
        
        // Start session tracking
        this.startSessionTimer();
    }
    
    startSessionTimer() {
        this.sessionStartTime = Date.now();
        
        // Update usage every minute
        this.usageTimer = setInterval(() => {
            this.updateUsage();
        }, 60000);
    }
    
    updateUsage() {
        if (!this.sessionStartTime) return;
        
        const currentTime = Date.now();
        const sessionDuration = currentTime - this.sessionStartTime;
        
        this.usageTracking.sessionTime = sessionDuration;
        
        // Check usage limits
        this.checkUsageLimits();
    }
    
    checkUsageLimits() {
        const user = this.app.getCurrentUser();
        if (!user) return;
        
        const hourlyUsage = this.usageTracking.sessionTime / (1000 * 60 * 60);
        
        // Check limits based on access level
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
        
        if (this.app.isInCall()) {
            this.app.callManager.endCall();
        }
    }
    
    async hasAccessToModule(moduleId) {
    const user = this.app.getCurrentUser();
    if (!user?.id) return false;
    
    // Use backend check for accurate access control
    return await this.checkModuleAccess(moduleId);
}
    
    isTemporarilyUnlocked(moduleId) {
        // This would be implemented with Supabase data
        // For now, return false
        return false;
    }
    
async checkModuleAccess(moduleId) {
    const user = this.app.getCurrentUser();
    if (!user?.id) return false;
    
    try {
        const response = await fetch('/api/check-module-access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.id,
                moduleId: moduleId
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            console.error('Access check failed:', data.error);
            return false;
        }
        
        if (!data.hasAccess && data.reason) {
            this.app.uiManager.showWarning(data.reason);
        }
        
        return data.hasAccess;
        
    } catch (error) {
        console.error('Module access check error:', error);
        return false;
    }
}

async unlockModuleTemporarily(moduleId, unlockType = 'marathon_completion') {
    const user = this.app.getCurrentUser();
    if (!user?.id) return false;
    
    try {
        const response = await fetch('/api/unlock-module-temporary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.id,
                moduleId: moduleId,
                unlockType: unlockType
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            console.error('Unlock failed:', data.error);
            this.app.uiManager.showError(data.error);
            return false;
        }
        
        this.app.uiManager.showSuccess(data.message);
        
        // Update UI to reflect new access
        this.app.uiManager.updateModuleUI();
        
        return true;
        
    } catch (error) {
        console.error('Module unlock error:', error);
        this.app.uiManager.showError('Failed to unlock module. Please try again.');
        return false;
    }
}

    isPermanentlyUnlocked(moduleId) {
        // This would be implemented with Supabase data
        // For now, return false
        return false;
    }
    
    // Utility methods
    generateSessionId() {
        return 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }
    
    generateFingerprint() {
        const components = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            navigator.hardwareConcurrency || 'unknown'
        ];
        
        let hash = 0;
        const str = components.join('|');
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        
        return 'fp_' + Math.abs(hash).toString(36);
    }
    
    getUrlParameter(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param) || '';
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