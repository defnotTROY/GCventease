# ⚠️ IMPORTANT: Environment Configuration Security

## Current Issue
Your `environment.ts` file contains **real API keys** that should NOT be committed to Git.

## Solution

### Option 1: Use Git Update-Index (Recommended)
Keep the file tracked but ignore local changes:

```bash
# Tell Git to ignore changes to this file
git update-index --assume-unchanged src/environments/environment.ts
git update-index --assume-unchanged src/environments/environment.prod.ts
```

This way:
- ✅ File stays in Git with placeholder values
- ✅ Your local changes (real keys) won't be committed
- ✅ Other developers can see the structure

### Option 2: Use environment.local.ts (Better for teams)
1. Create `environment.local.ts` with your real keys
2. Add to `.gitignore`:
   ```
   src/environments/*.local.ts
   ```
3. Update Angular to use local file in development

### Option 3: Environment Variables (Production)
For production, use actual environment variables:
```typescript
export const environment = {
  production: true,
  supabaseUrl: process.env['SUPABASE_URL'] || '',
  supabaseKey: process.env['SUPABASE_KEY'] || '',
  geminiApiKey: process.env['GEMINI_API_KEY'] || '',
  backendUrl: process.env['BACKEND_URL'] || ''
};
```

## What to Do Right Now

1. **Replace your real keys with placeholders:**
   ```typescript
   supabaseUrl: 'YOUR_SUPABASE_URL',
   supabaseKey: 'YOUR_SUPABASE_ANON_KEY',
   geminiApiKey: 'YOUR_GEMINI_API_KEY',
   ```

2. **Commit the template version:**
   ```bash
   git add src/environments/environment.ts
   git commit -m "Add environment template with placeholders"
   ```

3. **Tell Git to ignore future changes:**
   ```bash
   git update-index --assume-unchanged src/environments/environment.ts
   ```

4. **Put your real keys back locally** (Git will ignore the changes)

## Security Checklist
- [ ] Replace real keys with placeholders in environment.ts
- [ ] Commit the template version
- [ ] Use git update-index to ignore local changes
- [ ] Put real keys back in your local file
- [ ] Verify keys are not in Git history

## If Keys Were Already Committed
If you already committed real keys:
1. Rotate all API keys immediately (generate new ones)
2. Use `git filter-branch` or BFG Repo-Cleaner to remove from history
3. Force push to GitHub

---

**Remember**: Never commit real API keys, passwords, or secrets to Git!
