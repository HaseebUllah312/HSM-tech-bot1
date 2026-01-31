/**
 * AI Service Module
 * Google Gemini API integration for intelligent responses
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('./config');
const logger = require('./logger');

let genAI = null;
let model = null;

/**
 * Initialize Gemini AI
 */
function initializeAI() {
    if (!config.GEMINI_API_KEY) {
        logger.warn('Gemini API key not configured - AI features disabled');
        return false;
    }

    try {
        genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
        model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        logger.info('Gemini AI initialized successfully');
        return true;
    } catch (err) {
        logger.error('Failed to initialize Gemini AI', err);
        return false;
    }
}

/**
 * Check if a message is a question or needs AI response
 * @param {string} message - Message text
 * @returns {boolean} True if should use AI
 */
function shouldUseAI(message) {
    if (!message || message.length < 5) return false;

    const text = message.toLowerCase().trim();

    // Check for question patterns
    const questionPatterns = [
        /\?$/,                          // Ends with ?
        /^(what|who|where|when|why|how|which|can|could|would|should|is|are|do|does|did|will|explain|tell|describe)/i,
        /^(kya|kaise|kyun|kab|kahan|kaun|batao|bata|samjhao)/i,  // Urdu/Hindi
    ];

    // Skip if it's a command or greeting
    if (text.startsWith(config.BOT_PREFIX)) return false;

    // Skip short messages
    if (text.length < 10) return false;

    // Check if matches question pattern
    return questionPatterns.some(pattern => pattern.test(text));
}

/**
 * Generate AI response for a message
 * @param {string} message - User's message
 * @returns {Promise<string|null>} AI response or null
 */
async function generateResponse(message) {
    if (!model) {
        if (!initializeAI()) {
            return null;
        }
    }

    try {
        const prompt = `You are a helpful, knowledgeable assistant for a WhatsApp study group. 
Answer the following question concisely and accurately. Keep response under 500 characters.
Be friendly and use emojis occasionally. If you don't know something, say so honestly.
Respond in the same language as the question (English, Urdu, or Hindi).

Question: ${message}

Answer:`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        if (response && response.trim()) {
            logger.info('AI response generated', {
                question: message.substring(0, 50),
                responseLength: response.length
            });
            return response.trim();
        }

        return null;
    } catch (err) {
        logger.error('Failed to generate AI response', err);
        return null;
    }
}

/**
 * Check if AI is enabled and configured
 * @returns {boolean} True if AI is ready
 */
function isAIEnabled() {
    return config.FEATURE_AI_ENABLED && config.GEMINI_API_KEY;
}

module.exports = {
    initializeAI,
    shouldUseAI,
    generateResponse,
    isAIEnabled
};
