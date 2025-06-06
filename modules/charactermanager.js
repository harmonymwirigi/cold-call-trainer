/**
 * Character Manager - Handles AI character selection and behavior
 */

export class CharacterManager {
    constructor(app) {
        this.app = app;
        this.characters = {};
        this.currentCharacter = null;
    }
    
    init() {
        this.characters = this.initializeCharacters();
        console.log('👥 Character Manager initialized');
    }
    
    initializeCharacters() {
        return {
            male: [
                {
                    id: 'david_chen',
                    name: 'David Chen',
                    title: 'VP of Sales',
                    company: 'TechCorp Solutions',
                    voice: 'Matthew',
                    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
                    personality: 'analytical, skeptical, busy',
                    market: 'usa'
                },
                {
                    id: 'james_wilson',
                    name: 'James Wilson',
                    title: 'Operations Director',
                    company: 'Global Manufacturing Ltd',
                    voice: 'Joey',
                    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
                    personality: 'friendly, cautious, detail-oriented',
                    market: 'uk'
                },
                {
                    id: 'marcus_berg',
                    name: 'Marcus Berg',
                    title: 'Geschäftsführer',
                    company: 'Deutsche Industrie GmbH',
                    voice: 'Hans',
                    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face',
                    personality: 'direct, efficient, formal',
                    market: 'germany'
                },
                {
                    id: 'pierre_dubois',
                    name: 'Pierre Dubois',
                    title: 'Directeur Commercial',
                    company: 'Entreprise Française SA',
                    voice: 'Mathieu',
                    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face',
                    personality: 'charming, sophisticated, discerning',
                    market: 'france'
                },
                {
                    id: 'connor_murphy',
                    name: 'Connor Murphy',
                    title: 'Business Development Manager',
                    company: 'Aussie Enterprises Pty',
                    voice: 'Russell',
                    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face',
                    personality: 'laid-back, friendly, straightforward',
                    market: 'australia'
                }
            ],
            female: [
                {
                    id: 'sarah_mitchell',
                    name: 'Sarah Mitchell',
                    title: 'Chief Marketing Officer',
                    company: 'Innovation Dynamics',
                    voice: 'Joanna',
                    image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
                    personality: 'strategic, busy, results-focused',
                    market: 'usa'
                },
                {
                    id: 'emily_thompson',
                    name: 'Emily Thompson',
                    title: 'Finance Director',
                    company: 'British Financial Services',
                    voice: 'Emma',
                    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
                    personality: 'analytical, cautious, professional',
                    market: 'uk'
                },
                {
                    id: 'anna_mueller',
                    name: 'Anna Müller',
                    title: 'Leiterin Einkauf',
                    company: 'Bavarian Solutions AG',
                    voice: 'Marlene',
                    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&crop=face',
                    personality: 'thorough, methodical, quality-focused',
                    market: 'germany'
                },
                {
                    id: 'marie_laurent',
                    name: 'Marie Laurent',
                    title: 'Directrice des Opérations',
                    company: 'Lyon Technologies SARL',
                    voice: 'Celine',
                    image: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=400&fit=crop&crop=face',
                    personality: 'elegant, discerning, relationship-focused',
                    market: 'france'
                },
                {
                    id: 'rebecca_wilson',
                    name: 'Rebecca Wilson',
                    title: 'Regional Sales Director',
                    company: 'Melbourne Trading Co',
                    voice: 'Nicole',
                    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
                    personality: 'energetic, approachable, goal-oriented',
                    market: 'australia'
                }
            ]
        };
    }
    
    selectRandomCharacter() {
        const user = this.app.getCurrentUser();
        const targetMarket = user?.targetMarket || 'usa';
        
        const allCharacters = [...this.characters.male, ...this.characters.female];
        const marketCharacters = allCharacters.filter(char => char.market === targetMarket);
        
        // If no characters for specific market, use all characters
        const availableCharacters = marketCharacters.length > 0 ? marketCharacters : allCharacters;
        
        // Update character job title and company based on user's prospect selection
        const selectedCharacter = availableCharacters[Math.floor(Math.random() * availableCharacters.length)];
        
        // Customize character based on user selections
        return this.customizeCharacter(selectedCharacter);
    }
    
    customizeCharacter(character) {
        const user = this.app.getCurrentUser();
        if (!user) return character;
        
        const customizedCharacter = { ...character };
        
        // Update job title if user selected specific prospect job title
        if (user.prospectJobTitle && user.prospectJobTitle !== 'other') {
            customizedCharacter.title = this.getJobTitleText(user.prospectJobTitle);
        }
        
        // Update company based on industry
        if (user.prospectIndustry && user.prospectIndustry !== 'other') {
            customizedCharacter.company = this.generateCompanyName(user.prospectIndustry);
        }
        
        // Add custom behavior if specified
        if (user.customBehavior) {
            customizedCharacter.personality += `, ${user.customBehavior}`;
        }
        
        return customizedCharacter;
    }
    
    getJobTitleText(jobTitleKey) {
        const jobTitleMap = {
            'brand_communications_manager': 'Brand/Communications Manager',
            'ceo_chief_executive_officer': 'CEO (Chief Executive Officer)',
            'cfo_chief_financial_officer': 'CFO (Chief Financial Officer)',
            'cio_chief_information_officer': 'CIO (Chief Information Officer)',
            'coo_chief_operating_officer': 'COO (Chief Operating Officer)',
            'content_marketing_manager': 'Content Marketing Manager',
            'cto_chief_technology_officer': 'CTO (Chief Technology Officer)',
            'demand_generation_manager': 'Demand Generation Manager',
            'digital_marketing_manager': 'Digital Marketing Manager',
            'engineering_manager': 'Engineering Manager',
            'finance_director': 'Finance Director',
            'founder___owner___managing_director__md_': 'Founder / Owner / Managing Director (MD)',
            'head_of_product': 'Head of Product',
            'purchasing_manager': 'Purchasing Manager',
            'r_d_product_development_manager': 'R&D/Product Development Manager',
            'sales_manager': 'Sales Manager',
            'sales_operations_manager': 'Sales Operations Manager',
            'social_media_manager': 'Social Media Manager',
            'ux_ui_design_lead': 'UX/UI Design Lead',
            'vp_of_finance': 'VP of Finance',
            'vp_of_hr': 'VP of HR',
            'vp_of_it_engineering': 'VP of IT/Engineering',
            'vp_of_marketing': 'VP of Marketing',
            'vp_of_sales': 'VP of Sales'
        };
        
        return jobTitleMap[jobTitleKey] || 'Business Executive';
    }
    
    generateCompanyName(industryKey) {
        const industryCompanies = {
            'education___e_learning': ['EduTech Solutions', 'Learning Dynamics Inc', 'Academic Excellence Corp'],
            'energy___utilities': ['PowerGrid Systems', 'Energy Solutions Ltd', 'Utility Innovations Co'],
            'finance___banking': ['Financial Services Group', 'Capital Partners LLC', 'Banking Solutions Inc'],
            'government___public_sector': ['Public Services Agency', 'Government Solutions Corp', 'Civic Technology Ltd'],
            'healthcare___life_sciences': ['HealthTech Innovations', 'Medical Solutions Group', 'BioLife Sciences'],
            'hospitality___travel': ['Travel Excellence Inc', 'Hospitality Partners', 'Tourism Solutions Corp'],
            'information_technology___services': ['TechCorp Solutions', 'IT Services Group', 'Digital Innovations Ltd'],
            'logistics__transportation___supply_chain': ['LogiTech Systems', 'Transport Solutions Inc', 'Supply Chain Dynamics'],
            'manufacturing___industrial': ['Industrial Partners LLC', 'Manufacturing Excellence', 'Production Systems Corp'],
            'media___entertainment': ['Media Dynamics Group', 'Entertainment Solutions', 'Creative Productions Inc'],
            'non_profit___associations': ['Community Partners', 'Social Impact Organization', 'Nonprofit Alliance'],
            'professional_services__legal__accounting__consulting_': ['Professional Partners LLC', 'Business Solutions Group', 'Consulting Excellence Inc'],
            'real_estate___property_management': ['Property Solutions Corp', 'Real Estate Partners', 'Development Group LLC'],
            'retail___e_commerce': ['Retail Innovations Inc', 'E-Commerce Solutions', 'Shopping Excellence Corp'],
            'telecommunications': ['TeleComm Systems', 'Communications Group', 'Network Solutions Inc']
        };
        
        const companies = industryCompanies[industryKey] || ['Business Solutions Corp', 'Industry Leaders Inc', 'Professional Services LLC'];
        return companies[Math.floor(Math.random() * companies.length)];
    }
    
    getCurrentCharacter() {
        return this.currentCharacter;
    }
    
    setCurrentCharacter(character) {
        this.currentCharacter = character;
    }
    
    buildSystemPrompt(moduleId, context) {
        const character = this.currentCharacter;
        const user = this.app.getCurrentUser();
        
        if (!character) return this.getDefaultPrompt(moduleId);
        
        const basePrompt = `You are ${character.name}, ${character.title} at ${character.company}. Your personality: ${character.personality}.`;
        
        const modulePrompts = {
            warmup: this.buildWarmupPrompt(character, context),
            opener: this.buildOpenerPrompt(character, context),
            pitch: this.buildPitchPrompt(character, context),
            fullcall: this.buildFullCallPrompt(character, context),
            powerhour: this.buildPowerHourPrompt(character, context)
        };
        
        const moduleSpecificPrompt = modulePrompts[moduleId] || modulePrompts.opener;
        
        // Add industry-specific behavior
        let industryContext = '';
        if (user?.prospectIndustry && user.prospectIndustry !== 'other') {
            industryContext = this.getIndustryContext(user.prospectIndustry);
        }
        
        return `${basePrompt}\n\n${moduleSpecificPrompt}\n\n${industryContext}\n\nContext: ${context}`;
    }
    
    buildWarmupPrompt(character, context) {
        return `You're running Module 3 - Warm-Up Quickfire training.

PURPOSE: Rapid-fire warm-up so the rep practices every key line before live dialing. Ask 25 prompts in random order.

FLOW: Pick random prompts from the master list. After each response, immediately give the next prompt. No detailed coaching during drill.

PROMPTS INCLUDE:
- Give your opener
- What's your pitch in one sentence?  
- Ask me for a meeting
- Handle objections like: "What's this about?", "I'm not interested", "Send me an email"
- Post-pitch objections like: "It's too expensive", "We have no budget", "Your competitor is cheaper"

Keep responses brief and immediately move to the next prompt.`;
    }
    
    buildOpenerPrompt(character, context) {
        return `You're running Module 1 - Opener + Early Objection Practice.

PURPOSE: Pressure-test the sales rep's opener and early-objection handling. The drill STOPS after the first objection is handled.

FLOW LOGIC:
- START in slow mode. Wait for the rep's opener.
- Respond with ONE random early objection from the list.
- Judge using RUBRIC: (1) Shows empathy (2) Non-argumentative language (3) Addresses/reframes objection (4) Ends with forward-moving question.
- If PASS: "Great! Want another objection?" If fail: coaching feedback.
- Mode progression: slow (6 passes) → marathon (10 objections) → legend (15 objections)

EARLY OBJECTIONS: "What's this about?", "I'm not interested", "We don't take cold calls", "Now is not a good time", "I have a meeting", "Can you call me later?", "Send me an email", "Who gave you this number?", "What are you trying to sell me?", "Is this a sales call?", "We are ok for the moment", "We're not looking for anything", "How long is this going to take?", "What company are you calling from?", "I never heard of you"

Current progress: ${this.app.getCurrentProgress()}/${this.app.getMaxProgress()}. Mode: ${this.app.getCurrentMode()}.`;
    }
    
    buildPitchPrompt(character, context) {
        return `You're running Module 2 - Pitch + Post-Pitch Objection + Meeting.

PURPOSE: Practice delivering a pitch, handling post-pitch objections, and booking a meeting.

FLOW LOGIC:
1. AI says: "Go ahead with your pitch" if learner hasn't pitched yet
2. After pitch, give ONE objection from remaining list
3. Learner must: (a) Address/reframe objection AND (b) Ask for a meeting
4. When AI agrees to meeting, ALWAYS reject first suggested time slot: "That slot doesn't work for me"
5. Accept second time slot, then say "Great, see you then! Ready for another pitch?"

POST-PITCH OBJECTIONS: "It's too expensive for us", "We have no budget right now", "Your competitor is cheaper", "This isn't a good time", "We've already set this year's budget", "Call me back next quarter", "We already use a competitor", "How exactly are you better?", "I've never heard of your company", "I'm not the decision-maker", "I need approval from my team", "How long does this take to implement?"

Current progress: ${this.app.getCurrentProgress()}/${this.app.getMaxProgress()}. Mode: ${this.app.getCurrentMode()}.`;
    }
    
    buildFullCallPrompt(character, context) {
        return `You're running Module 4 - Full Cold-Call simulation.

PURPOSE: Simulate a live cold-call from hello to meeting booking. Learner must clear every gate in order:
1. Handle early objection after opener
2. Deliver a pitch  
3. Handle post-pitch objection
4. Ask for meeting → prospect agrees
5. Negotiate day & time (first slot rejected, second accepted)

PASS CRITERIA: 
- Early objection: empathy + non-argumentative + address/reframe + forward question
- Post-pitch: same criteria + meeting ask
- Meeting negotiation: first slot rejected, second accepted

You may use mild profanity if feeling hostile. Act like a real business prospect - sometimes interested, sometimes skeptical, with natural interruptions and reactions.

Current stage: opener. Turn count: ${this.app.getCurrentProgress()}/25.`;
    }
    
    buildPowerHourPrompt(character, context) {
        return `You're running Module 5 - Power Hour (10 back-to-back cold calls).

PURPOSE: Run ten cold-call simulations in one session. Each call follows the full "Opener → Pitch → Meeting" flow.

CALL FLOW: Same as Module 4 but faster pace. Each call has 15-turn cap. After every call: instant score (0-4), micro-coaching, auto-start next call.

SCORING:
0 = fail early objection
1 = fail first post-pitch objection  
2 = handled objections but no meeting ask
3 = meeting agreed but no firm time
4 = meeting booked (second slot accepted)

You're prospect #${this.app.getCurrentProgress() + 1} of 10. Be challenging but fair. Use time pressure.`;
    }
    
    getIndustryContext(industryKey) {
        const industryContexts = {
            'education___e_learning': 'You work in education technology. You care about student outcomes, learning analytics, and budget constraints typical of educational institutions.',
            'energy___utilities': 'You work in energy/utilities. You focus on grid reliability, regulatory compliance, sustainability initiatives, and long-term infrastructure planning.',
            'finance___banking': 'You work in financial services. You prioritize security, regulatory compliance, risk management, and customer data protection.',
            'government___public_sector': 'You work in government/public sector. You focus on public service delivery, budget accountability, transparency, and citizen satisfaction.',
            'healthcare___life_sciences': 'You work in healthcare. You prioritize patient outcomes, HIPAA compliance, clinical efficiency, and cost management.',
            'hospitality___travel': 'You work in hospitality/travel. You focus on customer experience, seasonal fluctuations, booking optimization, and guest satisfaction.',
            'information_technology___services': 'You work in IT services. You care about technical specifications, scalability, integration capabilities, and technical support.',
            'logistics__transportation___supply_chain': 'You work in logistics/supply chain. You focus on efficiency, cost optimization, delivery reliability, and inventory management.',
            'manufacturing___industrial': 'You work in manufacturing. You prioritize production efficiency, quality control, supply chain reliability, and operational safety.',
            'media___entertainment': 'You work in media/entertainment. You focus on audience engagement, content quality, distribution channels, and creative production.',
            'non_profit___associations': 'You work in nonprofit sector. You prioritize mission impact, budget constraints, donor relations, and community outcomes.',
            'professional_services__legal__accounting__consulting_': 'You work in professional services. You focus on client outcomes, billing efficiency, expertise demonstration, and service quality.',
            'real_estate___property_management': 'You work in real estate/property management. You focus on property values, tenant satisfaction, maintenance costs, and market trends.',
            'retail___e_commerce': 'You work in retail/e-commerce. You prioritize customer experience, sales conversion, inventory management, and competitive pricing.',
            'telecommunications': 'You work in telecommunications. You focus on network reliability, bandwidth needs, service uptime, and technical infrastructure.'
        };
        
        return industryContexts[industryKey] || 'You work in a professional business environment with standard business concerns about ROI, efficiency, and growth.';
    }
    
    getDefaultPrompt(moduleId) {
        return `You are a business professional participating in a cold call training simulation. Act as a realistic prospect for Module ${moduleId}. Be appropriately challenging but fair in your responses.`;
    }
    
    // Utility methods for character management
    getCharactersByMarket(market) {
        const allCharacters = [...this.characters.male, ...this.characters.female];
        return allCharacters.filter(char => char.market === market);
    }
    
    getAvailableVoices() {
        const allCharacters = [...this.characters.male, ...this.characters.female];
        return [...new Set(allCharacters.map(char => char.voice))];
    }
    
    getCharacterPersonalities() {
        const allCharacters = [...this.characters.male, ...this.characters.female];
        return [...new Set(allCharacters.map(char => char.personality))];
    }
    
    // Character behavior adaptation based on user progress
    adaptCharacterBehavior() {
        if (!this.currentCharacter) return;
        
        const user = this.app.getCurrentUser();
        const moduleProgress = this.app.moduleManager.getModuleProgress(this.app.getCurrentModule());
        
        // Make character more challenging as user progresses
        if (moduleProgress.marathon >= 5) {
            this.currentCharacter.personality += ', more demanding';
        }
        
        if (moduleProgress.legend) {
            this.currentCharacter.personality += ', expert-level challenging';
        }
    }
    
    // Dynamic personality adjustments
    adjustPersonalityForModule(moduleId) {
        if (!this.currentCharacter) return;
        
        const modulePersonalities = {
            warmup: 'patient, instructional',
            opener: 'busy, skeptical',
            pitch: 'analytical, questioning',
            fullcall: 'realistic, varied mood',
            powerhour: 'time-pressured, direct'
        };
        
        const modulePersonality = modulePersonalities[moduleId];
        if (modulePersonality) {
            this.currentCharacter.personality += `, ${modulePersonality}`;
        }
    }
}