# Admin image library configuration

Configure these server-side Vercel environment variables before deployment:

```text
GOOGLE_SERVICE_ACCOUNT_EMAIL=eureka-drive@eureka-dashboard-513605.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
GOOGLE_DRIVE_FOLDER_ID=1Tg1Wrdlt7Wr0kHv3R5G9uPLBHQeHMpwN
PEXELS_API_KEY=...
SUPABASE_URL=https://caigrloiymgfxubzprbg.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

The API route and `admin.html` are protected by the same Vercel Basic Auth middleware.
Never commit any of the secret values above.
