# Cinegma Studio — Mobile App

A React Native (Expo) mobile app for the Cinegma Studio admin dashboard. Manage articles, upload media, view analytics, and more — all from your Android phone.

## Features

- **Articles** — Create, edit, publish, and delete blog posts with Markdown
- **Upload Image** — Pick images from gallery, auto-optimize to AVIF on CDN
- **Upload Video** — Upload videos/audio up to 50 MB to Bunny Stream CDN
- **Media Library** — Browse all uploaded assets, tap to copy URL
- **Messages** — Read contact form submissions, mark as read, reply via email
- **Site Analytics** — View page views, visitors, top pages, browsers, devices
- **Activity Log** — Audit trail of all dashboard actions with pagination
- **Admin Management** — Add/remove admin accounts (owner only)
- **Settings** — Configure server URL, view profile, sign out

## Setup

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your Android phone (from Play Store)

### Install & Run

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with Expo Go on your phone.

### Configure Server URL

On first launch, go to **Settings** and enter your Cinegma website URL:
```
https://your-site.vercel.app
```

Then sign in with your admin credentials.

## Build APK

To build a standalone Android APK:

```bash
npx eas build --platform android --profile preview
```

Add this to `eas.json` first:
```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {}
    }
  }
}
```

## Tech Stack

- React Native (Expo SDK 52)
- React Navigation (Drawer)
- Expo SecureStore (session tokens)
- Expo ImagePicker / DocumentPicker
- Same Supabase + Vercel API backend as the web dashboard
