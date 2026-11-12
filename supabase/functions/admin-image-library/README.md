# Admin image library

Local implementation for the Eureka Trips admin image picker.

Required Supabase Edge Function secrets:

```text
GOOGLE_SERVICE_ACCOUNT_EMAIL=eureka-drive@eureka-dashboard-513605.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
GOOGLE_DRIVE_FOLDER_ID=1Tg1Wrdlt7Wr0kHv3R5G9uPLBHQeHMpwN
PEXELS_API_KEY=...
```

The Google Drive folder must be shared as Viewer with the service-account email.
The function imports selected Drive/stock images into the existing public
`eureka-images` Supabase Storage bucket before returning a URL to the editor.

Do not commit the service-account JSON or any API key to the repository.
