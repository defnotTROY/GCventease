# Gemini AI Integration for Python Backend

from google import generativeai as genai
import json
import os
from typing import List, Dict, Any, Optional

# Initialize Gemini AI
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def is_configured() -> bool:
    """Check if Gemini AI is configured"""
    return GEMINI_API_KEY is not None

async def generate_event_recommendations(
    user_preferences: Dict[str, Any],
    user_history: List[Dict[str, Any]],
    available_events: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """Generate personalized event recommendations"""
    if not is_configured():
        print("Gemini AI not configured")
        return []

    try:
        model = genai.GenerativeModel('gemini-pro')

        prompt = f"""
You are an AI assistant helping recommend events to users.

User Preferences:
{json.dumps(user_preferences, indent=2)}

User Event History:
{json.dumps(user_history, indent=2)}

Available Events:
{json.dumps(available_events, indent=2)}

Based on the user's preferences and history, recommend the top 5 most relevant events.
For each recommendation, provide:
1. Event ID
2. Event title
3. Confidence score (0-100)
4. Brief reason for recommendation

Return ONLY a JSON array with fields: eventId, title, confidence, reason.
"""

        response = model.generate_content(prompt)
        text = response.text
        
        # Extract JSON from response
        import re
        json_match = re.search(r'\[[\s\S]*\]', text)
        if json_match:
            return json.loads(json_match.group(0))
        
        return []
    except Exception as e:
        print(f"Error generating recommendations: {e}")
        return []

async def generate_insights(
    user_stats: Dict[str, Any],
    event_data: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """Generate AI insights for analytics"""
    if not is_configured():
        print("Gemini AI not configured")
        return []

    try:
        model = genai.GenerativeModel('gemini-pro')

        prompt = f"""
You are an AI assistant providing insights for an event management platform.

User Statistics:
{json.dumps(user_stats, indent=2)}

Event Data:
{json.dumps(event_data, indent=2)}

Generate 3-5 actionable insights. For each provide:
1. Title (short, catchy)
2. Description (what the data shows)
3. Recommendation (actionable advice)
4. Icon (choose from: calendar, trending-up, clock, users)

Return ONLY a JSON array with fields: title, description, recommendation, icon.
"""

        response = model.generate_content(prompt)
        text = response.text
        
        import re
        json_match = re.search(r'\[[\s\S]*\]', text)
        if json_match:
            return json.loads(json_match.group(0))
        
        return []
    except Exception as e:
        print(f"Error generating insights: {e}")
        return []

async def generate_event_schedule(
    event_type: str,
    duration: int,
    participant_count: int,
    objectives: List[str]
) -> List[Dict[str, Any]]:
    """Generate event schedule using AI"""
    if not is_configured():
        print("Gemini AI not configured")
        return get_default_schedule(duration)

    try:
        model = genai.GenerativeModel('gemini-pro')

        prompt = f"""
Generate a professional event schedule for:
- Event Type: {event_type}
- Duration: {duration} hours
- Expected Participants: {participant_count}
- Objectives: {', '.join(objectives)}

Create a balanced schedule with opening, sessions, breaks, and closing.
Start time: 09:00

Return ONLY a JSON array with fields: time (HH:MM), title, description, duration (minutes).
"""

        response = model.generate_content(prompt)
        text = response.text
        
        import re
        json_match = re.search(r'\[[\s\S]*\]', text)
        if json_match:
            return json.loads(json_match.group(0))
        
        return get_default_schedule(duration)
    except Exception as e:
        print(f"Error generating schedule: {e}")
        return get_default_schedule(duration)

async def analyze_feedback_sentiment(
    feedback_list: List[str]
) -> Dict[str, Any]:
    """Analyze feedback sentiment"""
    if not is_configured():
        return {'overall': 'neutral', 'score': 50, 'summary': 'AI analysis not available'}

    try:
        model = genai.GenerativeModel('gemini-pro')

        feedback_text = '\n'.join([f"{i+1}. {f}" for i, f in enumerate(feedback_list)])
        prompt = f"""
Analyze the sentiment of these event feedback comments:
{feedback_text}

Provide:
1. Overall sentiment (positive/neutral/negative)
2. Score (0-100, where 100 is most positive)
3. Brief summary of key themes

Return ONLY a JSON object with fields: overall, score, summary.
"""

        response = model.generate_content(prompt)
        text = response.text
        
        import re
        json_match = re.search(r'\{[\s\S]*\}', text)
        if json_match:
            return json.loads(json_match.group(0))
        
        return {'overall': 'neutral', 'score': 50, 'summary': 'Unable to analyze'}
    except Exception as e:
        print(f"Error analyzing sentiment: {e}")
        return {'overall': 'neutral', 'score': 50, 'summary': 'Analysis error'}

def get_default_schedule(duration: int) -> List[Dict[str, Any]]:
    """Default schedule fallback"""
    schedule = [
        {'time': '09:00', 'title': 'Registration & Welcome', 'description': 'Check-in and opening remarks', 'duration': 30},
        {'time': '09:30', 'title': 'Main Session', 'description': 'Primary event content', 'duration': 90},
        {'time': '11:00', 'title': 'Coffee Break', 'description': 'Networking and refreshments', 'duration': 15},
        {'time': '11:15', 'title': 'Workshop/Activity', 'description': 'Interactive session', 'duration': 60},
    ]

    if duration >= 4:
        schedule.append({'time': '12:15', 'title': 'Lunch Break', 'description': 'Meal and networking', 'duration': 45})
        schedule.append({'time': '13:00', 'title': 'Afternoon Session', 'description': 'Continued programming', 'duration': 60})

    schedule.append({'time': '14:00', 'title': 'Closing Remarks', 'description': 'Summary and next steps', 'duration': 15})

    return schedule
