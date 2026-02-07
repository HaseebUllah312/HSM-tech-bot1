/**
 * AI Service Module
 * Multi-provider AI integration: Groq (free) + Gemini fallback
 * With rate limiting and retry logic
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const https = require('https');
const config = require('./config');
const logger = require('./logger');

let genAI = null;
let model = null;

// Rate limiting
const rateLimiter = {
    lastRequest: 0,
    minInterval: 2000, // Minimum 2 seconds between requests
    requestCount: 0,
    maxPerMinute: 30,
    windowStart: Date.now()
};

/**
 * Make HTTPS POST request
 */
function httpsPost(url, headers, body) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', reject);
        req.write(JSON.stringify(body));
        req.end();
    });
}

/**
 * Generate response using Groq API (FREE - Llama 3.3)
 * Get free API key at: https://console.groq.com/keys
 */
async function generateWithGroq(message, systemInstruction) {
    const apiKey = config.GROQ_API_KEY;

    if (!apiKey) {
        return null;
    }

    const defaultSystem = 'You are a helpful assistant for a WhatsApp study group. Keep responses under 400 characters, be friendly, use emojis occasionally. Answer in the same language as the question (English, Urdu, or Hindi).';

    try {
        const response = await httpsPost(
            'https://api.groq.com/openai/v1/chat/completions',
            { 'Authorization': `Bearer ${apiKey}` },
            {
                model: 'llama-3.3-70b-versatile', // Free, fast, powerful
                messages: [
                    {
                        role: 'system',
                        content: systemInstruction || defaultSystem
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                max_tokens: 300,
                temperature: 0.7
            }
        );

        if (response.status === 200 && response.data?.choices?.[0]?.message?.content) {
            const text = response.data.choices[0].message.content.trim();
            logger.info('Groq response generated', { length: text.length });
            return text;
        }

        if (response.status === 429) {
            logger.warn('Groq rate limited');
            return null;
        }

        logger.warn('Groq API error', { status: response.status, data: response.data });
        return null;
    } catch (err) {
        logger.error('Groq API failed', err);
        return null;
    }
}

/**
 * Generate response using Gemini API
 */
async function generateWithGemini(message, systemInstruction) {
    if (!config.GEMINI_API_KEY) return null;

    const defaultSystem = `You are a helpful assistant for a WhatsApp study group. 
Keep response under 400 characters, be friendly, use emojis occasionally.
Respond in the same language as the question.`;

    const instruction = systemInstruction || defaultSystem;

    if (!model) {
        try {
            genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
            model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        } catch (err) {
            logger.error('Failed to initialize Gemini', err);
            return null;
        }
    }

    try {
        const prompt = `${instruction}

Question: ${message}

Answer:`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        if (response && response.trim()) {
            logger.info('Gemini response generated', { length: response.length });
            return response.trim();
        }
        return null;
    } catch (err) {
        if (err.message && (err.message.includes('429') || err.message.includes('quota'))) {
            logger.warn('Gemini quota exceeded, will use Groq');
        } else {
            logger.error('Gemini API failed', err);
        }
        return null;
    }
}

/**
 * Check rate limit
 */
function checkRateLimit() {
    const now = Date.now();

    if (now - rateLimiter.windowStart > 60000) {
        rateLimiter.requestCount = 0;
        rateLimiter.windowStart = now;
    }

    if (rateLimiter.requestCount >= rateLimiter.maxPerMinute) {
        return false;
    }

    if (now - rateLimiter.lastRequest < rateLimiter.minInterval) {
        return false;
    }

    return true;
}

/**
 * Wait for rate limit to clear
 */
async function waitForRateLimit() {
    const timeSince = Date.now() - rateLimiter.lastRequest;
    if (timeSince < rateLimiter.minInterval) {
        await new Promise(resolve => setTimeout(resolve, rateLimiter.minInterval - timeSince));
    }
}

/**
 * Initialize AI (check which providers are available)
 */
function initializeAI() {
    const providers = [];

    if (config.GROQ_API_KEY) {
        providers.push('Groq (Llama 3.3)');
    }

    if (config.GEMINI_API_KEY) {
        providers.push('Gemini');
    }

    if (providers.length === 0) {
        logger.warn('No AI API keys configured - AI features disabled');
        logger.info('Get FREE Groq API key at: https://console.groq.com/keys');
        return false;
    }

    logger.info(`AI initialized with providers: ${providers.join(', ')}`);
    return true;
}

/**
 * Check if message should use AI
 */
function shouldUseAI(message) {
    if (!message || message.length < 5) return false;
    const text = message.toLowerCase().trim();

    if (text.startsWith(config.BOT_PREFIX)) return false;
    if (text.length < 10) return false;

    const questionPatterns = [
        /\?$/,
        /^(what|who|where|when|why|how|which|can|could|would|should|is|are|do|does|did|will|explain|tell|describe)/i,
        /^(kya|kaise|kyun|kab|kahan|kaun|batao|bata|samjhao)/i,
    ];

    return questionPatterns.some(pattern => pattern.test(text));
}

/**
 * Generate AI response - tries Groq first (free), then Gemini
 */
async function generateResponse(message, systemInstruction) {
    if (!checkRateLimit()) {
        await waitForRateLimit();
    }

    rateLimiter.lastRequest = Date.now();
    rateLimiter.requestCount++;

    // Try Groq first (FREE, fast)
    if (config.GROQ_API_KEY) {
        const groqResponse = await generateWithGroq(message, systemInstruction);
        if (groqResponse) return groqResponse;
    }

    // Fallback to Gemini
    if (config.GEMINI_API_KEY) {
        const geminiResponse = await generateWithGemini(message, systemInstruction);
        if (geminiResponse) return geminiResponse;
    }

    logger.warn('All AI providers failed');
    return null;
}

/**
 * Check if AI is enabled
 */
function isAIEnabled() {
    return config.FEATURE_AI_ENABLED && (config.GEMINI_API_KEY || config.GROQ_API_KEY);
}

/**
 * Get rate limit status
 */
function getRateLimitStatus() {
    return {
        requestsThisMinute: rateLimiter.requestCount,
        maxPerMinute: rateLimiter.maxPerMinute,
        canRequest: checkRateLimit()
    };
}

module.exports = {
    initializeAI,
    shouldUseAI,
    generateResponse,
    isAIEnabled,
    getRateLimitStatus
};
