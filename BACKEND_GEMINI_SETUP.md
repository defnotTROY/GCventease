# Backend Package Installation Guide

## Node.js Backend - Gemini AI Setup

### 1. Install Gemini AI Package
```bash
cd backend
npm install @google/generative-ai
```

### 2. Update Environment Variables
Add to `backend/.env`:
```env
# Gemini AI (replaces OpenAI)
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Update Analytics Routes
The helper file is ready at `backend/helpers/gemini-ai.js`.

To use it in your routes (e.g., `backend/routes/analytics.js`):
```javascript
const geminiAI = require('../helpers/gemini-ai');

// Example: Generate recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const recommendations = await geminiAI.generateEventRecommendations(
      req.user.preferences,
      req.user.history,
      availableEvents
    );
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## Python Backend - Gemini AI Setup

### 1. Install Gemini AI Package
```bash
cd backend_python
pip install google-generativeai
```

Or add to `requirements.txt`:
```
google-generativeai
```

Then run:
```bash
pip install -r requirements.txt
```

### 2. Update Environment Variables
Add to `backend_python/.env`:
```env
# Gemini AI (replaces OpenAI)
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Update Analytics Endpoints
The helper file is ready at `backend_python/app/helpers/gemini_ai.py`.

To use it in your endpoints (e.g., `backend_python/app/api/v1/endpoints/analytics.py`):
```python
from app.helpers import gemini_ai

@router.get("/recommendations")
async def get_recommendations(current_user: User = Depends(get_current_user)):
    recommendations = await gemini_ai.generate_event_recommendations(
        user_preferences=current_user.preferences,
        user_history=current_user.history,
        available_events=available_events
    )
    return recommendations
```

---

## Getting a Gemini AI API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key
5. Add to your `.env` file

**Note**: The API key is free for development and has generous usage limits.

---

## Testing the Integration

### Node.js
```bash
cd backend
npm run dev
```

### Python
```bash
cd backend_python
python run.py
```

Both backends will automatically use Gemini AI if the API key is configured. If not, they will log a warning and continue without AI features.
