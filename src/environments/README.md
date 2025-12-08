# Environment Configuration

## Setup Instructions

1. The `environment.ts` and `environment.prod.ts` files contain your API keys and configuration
2. **Add your own keys** to these files:
   - Supabase URL and Key
   - Gemini AI API Key (optional)
   - Backend URL

3. These files are tracked in Git with placeholder values
4. **Never commit real API keys** - use placeholders like `YOUR_KEY_HERE`

## Getting API Keys

- **Supabase**: https://supabase.com → Settings → API
- **Gemini AI**: https://makersuite.google.com/app/apikey

## Security

- Real keys should only exist in your local files
- For production, use environment variables or secret management
