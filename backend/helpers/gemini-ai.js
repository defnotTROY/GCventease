// Gemini AI Integration for Node.js Backend
// Replace OpenAI with Google Gemini AI

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

/**
 * Generate event recommendations using Gemini AI
 */
async function generateEventRecommendations(userPreferences, userHistory, availableEvents) {
    if (!genAI) {
        console.warn('Gemini AI not configured');
        return [];
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = `
You are an AI assistant helping recommend events to users.

User Preferences:
${JSON.stringify(userPreferences, null, 2)}

User Event History:
${JSON.stringify(userHistory, null, 2)}

Available Events:
${JSON.stringify(availableEvents, null, 2)}

Based on the user's preferences and history, recommend the top 5 most relevant events.
For each recommendation, provide:
1. Event ID
2. Event title
3. Confidence score (0-100)
4. Brief reason for recommendation

Return ONLY a JSON array with fields: eventId, title, confidence, reason.
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parse JSON from response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return [];
    } catch (error) {
        console.error('Error generating recommendations:', error);
        return [];
    }
}

/**
 * Generate AI insights for analytics
 */
async function generateInsights(userStats, eventData) {
    if (!genAI) {
        console.warn('Gemini AI not configured');
        return [];
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = `
You are an AI assistant providing insights for an event management platform.

User Statistics:
${JSON.stringify(userStats, null, 2)}

Event Data:
${JSON.stringify(eventData, null, 2)}

Generate 3-5 actionable insights. For each provide:
1. Title (short, catchy)
2. Description (what the data shows)
3. Recommendation (actionable advice)
4. Icon (choose from: calendar, trending-up, clock, users)

Return ONLY a JSON array with fields: title, description, recommendation, icon.
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return [];
    } catch (error) {
        console.error('Error generating insights:', error);
        return [];
    }
}

/**
 * Generate event schedule using AI
 */
async function generateEventSchedule(eventType, duration, participantCount, objectives) {
    if (!genAI) {
        console.warn('Gemini AI not configured');
        return getDefaultSchedule(duration);
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = `
Generate a professional event schedule for:
- Event Type: ${eventType}
- Duration: ${duration} hours
- Expected Participants: ${participantCount}
- Objectives: ${objectives.join(', ')}

Create a balanced schedule with opening, sessions, breaks, and closing.
Start time: 09:00

Return ONLY a JSON array with fields: time (HH:MM), title, description, duration (minutes).
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return getDefaultSchedule(duration);
    } catch (error) {
        console.error('Error generating schedule:', error);
        return getDefaultSchedule(duration);
    }
}

/**
 * Analyze feedback sentiment
 */
async function analyzeFeedbackSentiment(feedbackList) {
    if (!genAI) {
        return { overall: 'neutral', score: 50, summary: 'AI analysis not available' };
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = `
Analyze the sentiment of these event feedback comments:
${feedbackList.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Provide:
1. Overall sentiment (positive/neutral/negative)
2. Score (0-100, where 100 is most positive)
3. Brief summary of key themes

Return ONLY a JSON object with fields: overall, score, summary.
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return { overall: 'neutral', score: 50, summary: 'Unable to analyze' };
    } catch (error) {
        console.error('Error analyzing sentiment:', error);
        return { overall: 'neutral', score: 50, summary: 'Analysis error' };
    }
}

/**
 * Default schedule fallback
 */
function getDefaultSchedule(duration) {
    const schedule = [
        { time: '09:00', title: 'Registration & Welcome', description: 'Check-in and opening remarks', duration: 30 },
        { time: '09:30', title: 'Main Session', description: 'Primary event content', duration: 90 },
        { time: '11:00', title: 'Coffee Break', description: 'Networking and refreshments', duration: 15 },
        { time: '11:15', title: 'Workshop/Activity', description: 'Interactive session', duration: 60 },
    ];

    if (duration >= 4) {
        schedule.push({ time: '12:15', title: 'Lunch Break', description: 'Meal and networking', duration: 45 });
        schedule.push({ time: '13:00', title: 'Afternoon Session', description: 'Continued programming', duration: 60 });
    }

    schedule.push({ time: '14:00', title: 'Closing Remarks', description: 'Summary and next steps', duration: 15 });

    return schedule;
}

module.exports = {
    generateEventRecommendations,
    generateInsights,
    generateEventSchedule,
    analyzeFeedbackSentiment
};
