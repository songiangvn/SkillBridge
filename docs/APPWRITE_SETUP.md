# Appwrite Backend Setup

SkillBridge can run in two backend modes:

- Local fallback mode: no `EXPO_PUBLIC_APPWRITE_PROJECT_ID`, using browser local storage.
- Appwrite Cloud mode: `.env` contains an Appwrite Cloud endpoint and project ID, so services read/write real backend data.

Appwrite Cloud is the recommended path for the web-first MVP and the later Android/iOS phase. It avoids Docker Desktop/WSL issues, and a real phone can use the same cloud endpoint without special localhost networking.

## Current Cloud Project

The local `.env` is configured for:

```env
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=69d3c0d90011722a3000
EXPO_PUBLIC_APPWRITE_DATABASE_ID=skillbridge
```

Do not commit `.env`. It is ignored by Git.

## Web Platform

In the Appwrite Console:

1. Open the `SkillBridge` project.
2. Add a Web platform.
3. Use `localhost` as the hostname.

This allows the Expo web dev server to call Appwrite from local development.

## Mobile Platforms (App Phase)

For Android/iOS testing with the same backend, add mobile platforms in Appwrite Console:

1. Add Android platform: package `com.skillbridge.app`
2. Add Apple platform: bundle ID `com.skillbridge.app`

These IDs match `app.json`.

## Schema Setup

The repo includes an idempotent setup script:

```sh
npm run setup:appwrite
```

The script reads `.env`, uses `APPWRITE_API_KEY` only server-side, and creates:

- database: `skillbridge`
- collections: `profiles`, `bridgeRequests`, `skippedProfiles`, `tutorShortlist`, `questions`, `answers`, `resources`, `savedResources`, `matches`, `threads`, `messages`
- attributes and indexes needed by the service layer
- seed profile/resource/question documents for the MVP catalog

The setup script is safe to rerun. After adding tutor requests, Q&A answers, and match/chat features, rerun it with a temporary API key so the latest attributes and the `answers`, `matches`, `threads`, and `messages` collections exist in Appwrite Cloud.

## Temporary API Key

`APPWRITE_API_KEY` is only needed for schema setup. Never prefix it with `EXPO_PUBLIC_`, because `EXPO_PUBLIC_*` values are bundled into the frontend.

After schema setup succeeds:

1. Go to Appwrite Console -> Project -> API Keys.
2. Delete or revoke the temporary setup key.
3. Remove `APPWRITE_API_KEY` from local `.env` if you do not plan to rerun schema setup soon.

If you need to rerun the script later, create a new temporary key with Database scopes.

For demo-account seeding (`npm run seed:demo`), the key also needs Users scopes:

- `users.read`
- `users.write`

## Permissions Model

The setup script uses document-level security:

- `profiles`: public read, signed-in users can create; each user owns updates/deletes for their own profile.
- `resources`: public read catalog seeded by setup.
- `questions`: public read, signed-in users can create; each question owner can update/delete their question.
- `answers`: public read, signed-in users can create; each answer owner can update/delete their answer.
- `bridgeRequests`: signed-in users can create. The requester and target user can read a request, so the app can detect mutual bridges; only the requester can update/delete it.
- `tutorShortlist`: signed-in users can save tutors and move them from `shortlisted` to `requested`.
- `skippedProfiles`, `savedResources`: signed-in users can create and only read/update/delete their own documents.
- `matches`, `threads`: both matched users can read/update/delete the shared document.
- `messages`: both matched users can read messages; only the sender can update/delete their own message.

## Match And Chat Flow

The app now supports a real mutual-match chat model:

1. User A swipes right on User B and creates a `bridgeRequests` document.
2. User B swipes right on User A.
3. The app checks for the reverse bridge request.
4. If both requests exist, it creates one `matches` document and one `threads` document.
5. Saved and Q&A show the ready chat thread.
6. `chatScreen` reads/writes `messages` by `threadId` and updates the thread preview.

The seed catalog profiles are not real Appwrite accounts, so mutual chat is best tested with two real sign-up accounts that each complete a profile and swipe each other.

## Startup Demo Seed

You can auto-create demo users and preconfigured scenarios for recording:

```sh
npm run seed:demo
```

This script creates:

- real Appwrite user accounts
- profile documents for each account
- incoming bridge requests to the main demo account for instant swipe-to-match demos
- ready `matches`, `threads`, and `messages` conversation history
- tutor shortlist/request examples
- one Q&A question with an answer

Default credentials:

- main account: `demo.owner@skillbridge.app`
- password: `APPWRITE_DEMO_PASSWORD` or `SkillBridge123!`

Run `npm run seed:demo` again whenever you want to refresh these demo scenarios.

## Q&A Flow

The Q&A tab now supports questions and answers:

1. A signed-in user posts a `questions` document.
2. Any user can read the public question feed.
3. Opening a question loads `answers` by `questionId`.
4. Posting an answer creates an `answers` document and increments the question reply count.

## Run The Web App

Restart Expo after changing `.env`:

```sh
cd /home/sg/SkillBridge
npx expo start -c --web
```

Or use the normal script:

```sh
npm run web
```

If Appwrite is configured and reachable, the service layer syncs with Appwrite. If it is not configured, the app keeps using browser-local fallback storage.

## Optional Local Self-Hosting

Local Appwrite self-hosting requires Docker. If you want to revisit that path later, use the official Appwrite self-hosting docs:

https://appwrite.io/docs/advanced/self-hosting

For this project, Appwrite Cloud is currently preferred because Docker Desktop WSL integration was unreliable on this machine and cloud will be easier for the Android/iOS phase.
