// health.js - Simple health endpoint fallback
// This file can be placed in the root directory as a backup

window.healthEndpoint = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    platform: 'client-side-fallback',
    env: {
        openai: false, // Will be detected dynamically
        aws: false, // Will be detected dynamically
        region: 'unknown'
    },
    features: {
        speechRecognition: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
        textToSpeech: !!window.speechSynthesis,
        aiConversation: false, // Will be tested
        moduleGating: true,
        legendMode: true,
        practiceTimeUnlock: true,
        phoneInterface: true,
        multipleCharacters: true,
        marketSelection: true
    },
    version: '2.0.0',
    mode: 'demo'
};