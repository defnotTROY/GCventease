# 🔧 Student API Configuration

## Quick Setup

You need to add the Student API credentials to your `environment.ts` file.

### Step 1: Open your environment file
Open `src/environments/environment.ts` (this file is gitignored for security)

### Step 2: Add these properties

Add the following two properties to your environment object:

```typescript
export const environment = {
    production: false,
    supabaseUrl: 'https://tnapnzsdrbeaumlvhmws.supabase.co', // Your existing URL
    supabaseKey: 'YOUR_SUPABASE_KEY', // Your existing key
    geminiApiKey: 'YOUR_GEMINI_KEY', // Your existing key
    backendUrl: 'http://localhost:5000/api',
    
    // ADD THESE TWO LINES:
    studentApiUrl: 'https://class-list-eight.vercel.app',
    studentApiKey: '2360351754b04ddc801e0ea0e74d176a35f201ad35dd1100af0bd025a12a91c8'
};
```

### Step 3: Save the file

The Angular dev server will automatically reload with the new configuration.

---

## What This Enables

With the Student API integrated, the app will:

✅ **Validate student numbers** - Check if a student number exists in the system
✅ **Auto-fill student info** - Fetch student details (name, email) from the API
✅ **Login with student number** - Allow students to login using their student number instead of email
✅ **Verify Gordon College students** - Ensure only registered students can sign up

---

## API Details

- **Base URL**: `https://class-list-eight.vercel.app`
- **API Key**: `2360351754b04ddc801e0ea0e74d176a35f201ad35dd1100af0bd025a12a91c8`
- **Authentication**: API key sent in `x-api-key` header

---

## Security Note

⚠️ The `environment.ts` file is gitignored to protect your API keys. Never commit real API keys to Git!
