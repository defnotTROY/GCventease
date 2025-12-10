# 📧 Email Verification Troubleshooting Guide

## Issue: Not Receiving Verification Emails

If you're not receiving verification emails after signing up, here are the most common causes and solutions:

---

## ✅ Quick Fixes

### 1. Check Supabase Email Settings

**Go to your Supabase Dashboard:**
1. Navigate to **Authentication** → **Email Templates**
2. Check if email sending is enabled
3. Verify the "Confirm signup" template is active

### 2. Check Supabase SMTP Configuration

**For Development (Default):**
- Supabase uses their own SMTP by default
- Has rate limits (30 emails per hour for free tier)
- May be blocked by some email providers

**Solution for Development:**
1. Go to Supabase Dashboard → **Authentication** → **Settings**
2. Scroll to **SMTP Settings**
3. Check if "Enable Custom SMTP" is needed
4. For testing, you can **disable email confirmation temporarily**

### 3. Disable Email Confirmation (For Testing Only)

**⚠️ Only for development/testing:**

1. Go to Supabase Dashboard → **Authentication** → **Providers**
2. Click on **Email** provider
3. **Uncheck** "Confirm email"
4. Save changes

This allows users to login immediately without email verification.

**Important:** Re-enable this for production!

---

## 🔍 Check Email Delivery

### Check Spam/Junk Folder
- Supabase emails often end up in spam
- Check your spam folder for emails from `noreply@mail.app.supabase.io`

### Check Email Logs in Supabase
1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Find your test user
3. Check if the confirmation email was sent
4. Look for any error messages

### Verify Email Address
- Make sure you're using a valid, accessible email address
- Gordon College emails (`@gordoncollege.edu.ph`) must be real and accessible
- For testing, you can use personal emails

---

## 🛠️ Alternative Solutions

### Option 1: Use Magic Link Instead

Modify the signup to use magic link authentication (passwordless):

```typescript
// In auth.service.ts
async signUpWithMagicLink(email: string) {
    const { error } = await this.supabaseService.supabase.auth.signInWithOtp({
        email: email,
        options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
        }
    });
    
    if (error) {
        return { success: false, error: error.message };
    }
    
    return { 
        success: true, 
        message: 'Check your email for the magic link!' 
    };
}
```

### Option 2: Manual Email Verification

For development, you can manually verify users in Supabase:

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Find the user
3. Click on the user
4. Manually set `email_confirmed_at` to current timestamp

### Option 3: Configure Custom SMTP

Use your own email service (Gmail, SendGrid, etc.):

1. Go to Supabase Dashboard → **Project Settings** → **Auth**
2. Scroll to **SMTP Settings**
3. Enable Custom SMTP
4. Configure with your email provider credentials

**Gmail Example:**
- SMTP Host: `smtp.gmail.com`
- Port: `587`
- Username: Your Gmail address
- Password: App-specific password (not your regular password)

---

## 🧪 Testing Without Email Verification

For development, you can temporarily skip email verification:

### Update Auth Service

```typescript
// In auth.service.ts signIn method
// Comment out the email verification check:

if (data.user) {
    // TEMPORARILY DISABLED FOR TESTING
    // if (!data.user.email_confirmed_at) {
    //     await this.supabaseService.signOut();
    //     return { 
    //         success: false, 
    //         error: 'Please verify your email...' 
    //     };
    // }

    this.router.navigate(['/dashboard']);
    return { success: true, user: data.user };
}
```

**Remember to re-enable this for production!**

---

## 📋 Recommended Setup for Development

**Best approach for testing:**

1. **Disable email confirmation in Supabase** (for now)
2. **Test the signup/login flow** without email verification
3. **Re-enable email confirmation** when ready for production
4. **Set up custom SMTP** for production use

---

## 🔐 Production Checklist

Before going to production:

- [ ] Enable email confirmation in Supabase
- [ ] Configure custom SMTP (recommended)
- [ ] Test email delivery with real email addresses
- [ ] Set up email templates with your branding
- [ ] Configure email rate limits
- [ ] Add SPF/DKIM records for your domain (if using custom domain)

---

## 🆘 Still Not Working?

If emails still aren't arriving:

1. **Check Supabase Status**: Visit status.supabase.com
2. **Check Logs**: Supabase Dashboard → Logs → Auth Logs
3. **Contact Support**: Supabase Discord or GitHub issues
4. **Use Alternative**: Consider magic links or OAuth providers

---

## Quick Fix for Right Now

**To test immediately without email verification:**

1. Go to Supabase Dashboard
2. Authentication → Providers → Email
3. Uncheck "Confirm email"
4. Save
5. Try signing up again

You should now be able to login immediately without waiting for email verification!
