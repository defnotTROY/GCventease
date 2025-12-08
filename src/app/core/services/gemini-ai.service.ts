import { Injectable } from '@angular/core';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { environment } from '../../../environments/environment';

export interface EventRecommendation {
    eventId: string;
    title: string;
    confidence: number;
    reason: string;
}

export interface AIInsight {
    title: string;
    description: string;
    recommendation: string;
    icon: string;
}

export interface ScheduleItem {
    time: string;
    title: string;
    description: string;
    duration: number;
}

@Injectable({
    providedIn: 'root'
})
export class GeminiAiService {
    private genAI: GoogleGenerativeAI | null = null;
    private model: GenerativeModel | null = null;

    constructor() {
        // Initialize Gemini AI only if API key is provided
        if (environment.geminiApiKey) {
            this.genAI = new GoogleGenerativeAI(environment.geminiApiKey);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
        }
    }

    /**
     * Check if Gemini AI is configured and ready
     */
    isConfigured(): boolean {
        return this.model !== null;
    }

    /**
     * Generate personalized event recommendations
     */
    async generateEventRecommendations(
        userPreferences: any,
        userHistory: any[],
        availableEvents: any[]
    ): Promise<EventRecommendation[]> {
        if (!this.model) {
            console.warn('Gemini AI not configured. Returning empty recommendations.');
            return [];
        }

        try {
            const prompt = `
You are an AI assistant helping recommend events to users.

User Preferences:
${JSON.stringify(userPreferences, null, 2)}

User Event History:
${JSON.stringify(userHistory, null, 2)}

Available Events:
${JSON.stringify(availableEvents, null, 2)}

Based on the user's preferences and history, recommend the top 5 most relevant events from the available events.
For each recommendation, provide:
1. Event ID
2. Event title
3. Confidence score (0-100)
4. Brief reason for recommendation

Return the response as a JSON array of objects with fields: eventId, title, confidence, reason.
`;

            const result = await this.model.generateContent(prompt);
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
     * Generate AI insights for dashboard
     */
    async generateInsights(
        userStats: any,
        eventData: any[]
    ): Promise<AIInsight[]> {
        if (!this.model) {
            console.warn('Gemini AI not configured. Returning empty insights.');
            return [];
        }

        try {
            const prompt = `
You are an AI assistant providing insights for an event management platform.

User Statistics:
${JSON.stringify(userStats, null, 2)}

Event Data:
${JSON.stringify(eventData, null, 2)}

Generate 3-5 actionable insights based on the data. For each insight provide:
1. Title (short, catchy)
2. Description (what the data shows)
3. Recommendation (actionable advice)
4. Icon (choose from: calendar, trending-up, clock, users)

Return as JSON array with fields: title, description, recommendation, icon.
`;

            const result = await this.model.generateContent(prompt);
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
    async generateEventSchedule(
        eventType: string,
        duration: number,
        participantCount: number,
        objectives: string[]
    ): Promise<ScheduleItem[]> {
        if (!this.model) {
            console.warn('Gemini AI not configured. Returning default schedule.');
            return this.getDefaultSchedule(duration);
        }

        try {
            const prompt = `
Generate a professional event schedule for:
- Event Type: ${eventType}
- Duration: ${duration} hours
- Expected Participants: ${participantCount}
- Objectives: ${objectives.join(', ')}

Create a balanced schedule with:
- Opening/welcome
- Main sessions
- Breaks (coffee/lunch as appropriate)
- Networking time
- Closing

Return as JSON array with fields: time (HH:MM format), title, description, duration (minutes).
Start time should be 09:00.
`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            return this.getDefaultSchedule(duration);
        } catch (error) {
            console.error('Error generating schedule:', error);
            return this.getDefaultSchedule(duration);
        }
    }

    /**
     * Analyze feedback sentiment
     */
    async analyzeFeedbackSentiment(feedbackList: string[]): Promise<{
        overall: 'positive' | 'neutral' | 'negative';
        score: number;
        summary: string;
    }> {
        if (!this.model) {
            return { overall: 'neutral', score: 50, summary: 'AI analysis not available' };
        }

        try {
            const prompt = `
Analyze the sentiment of these event feedback comments:
${feedbackList.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Provide:
1. Overall sentiment (positive/neutral/negative)
2. Score (0-100, where 100 is most positive)
3. Brief summary of key themes

Return as JSON with fields: overall, score, summary.
`;

            const result = await this.model.generateContent(prompt);
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
    private getDefaultSchedule(duration: number): ScheduleItem[] {
        const schedule: ScheduleItem[] = [
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
}
