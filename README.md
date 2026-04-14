# SkillBridge

SkillBridge is an Expo/React Native MVP for a two-way learning platform. It reuses the original Humbble dating-app structure and turns the swipe/match flow into a learning partner experience.

## MVP Scope

- **Learning partner matching**: swipe or press buttons to save bridge requests through the service layer.
- **Mutual match chat**: when two real users bridge each other, the app creates a match thread and enables one-to-one messages.
- **Tutor marketplace preview**: shortlist tutors and request a focused session.
- **Global Q&A**: post questions, open a question, and add/remove answers through the service layer.
- **Resource library preview**: save verified learning resources to the Saved tab.
- **Profile editor**: edit role, teach/learn skills, availability, mode, level, location, credentials, hourly rate, and learning goal.
- **Demo auth mode**: sign-in/sign-up routes work locally even before Appwrite is configured.

## Architecture Phase

The UI talks to a service layer in `services/` instead of calling local storage directly from each screen. The service layer now has an Appwrite adapter and keeps browser-local storage as a fallback, so the app still runs before Docker/Appwrite are configured.

## Recommended Local Workflow

For the fastest MVP loop, run the web target first. It uses the same Expo/React Native codebase and is much quicker to inspect locally than native Android/iOS builds.

```sh
cd /home/sg/SkillBridge
npm install
npm run web
```

You can also start the general Expo dev server:

```sh
npm start
```

After Expo starts:

- Press `w` for web.
- Scan the QR code with Expo Go for a device preview.
- Press `a` for Android if an emulator is ready.
- Press `i` for iOS if you are on macOS with the iOS simulator available.

## Native Targets

Android and iOS folders already exist, but they still carry some old native `humbble` naming from the source project. For this MVP, prefer web or Expo Go first. Do the deeper Gradle/Xcode package rename later, after the product direction is stable.

```sh
npm run android
npm run ios
```

## Backend Notes

Appwrite config is environment-driven through `EXPO_PUBLIC_*` variables. The current recommended backend is Appwrite Cloud, because it works for both web localhost and the later Android/iOS phase without Docker/localhost networking issues.

Copy the example env file when you are ready to configure a backend:

```sh
cp .env.example .env
```

Then fill:

```env
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here
```

The repo also includes a schema setup script:

```sh
npm run setup:appwrite
```

That script uses a temporary non-public `APPWRITE_API_KEY` from `.env` to create the database, collections, indexes, and seed catalog data. Revoke the key after setup. Full setup notes are in `docs/APPWRITE_SETUP.md`.

## Demo Video Mode

To generate startup-demo data with ready test users, pre-liked cards, instant matches, and seeded chat threads:

```sh
npm run seed:demo
```

`seed:demo` requires `.env` to contain:

- `APPWRITE_API_KEY` with Database scopes and Users read/write scopes
- `APPWRITE_DEMO_PASSWORD` (optional, defaults to `SkillBridge123!`)

After seeding, use `demo.owner@skillbridge.app` as the main demo account and sign in from a second browser profile with any other demo account to simulate the second user in real time.

## App Phase Activation

For Android app testing from this same codebase:

1. Keep Appwrite Cloud enabled in `.env` (do not use localhost endpoint for phone testing).
2. In Appwrite Console, add mobile platforms for the package IDs currently in `app.json`.
3. Start Expo and open on device:

```sh
npm start
```

Then press `a` for Android emulator or scan the QR code in Expo Go.

If no project ID is configured, auth screens run in demo mode and the app falls back to browser-local storage.

## Useful Files

- `DB/userDB.tsx`: mock SkillBridge users and resources.
- `components/PeopleCard.tsx`: core swipe matching card.
- `components/UserCard.tsx`: discover/tutor/resource cards.
- `services/`: app-facing service layer for auth, profile, bridge requests, tutors, Q&A answers, and resources.
- `services/appwriteAdapter.ts`: Appwrite persistence adapter used when `.env` is configured.
- `services/catalogService.ts`: profile/resource catalog source with Appwrite-first, mock-data fallback behavior.
- `services/matchService.ts`: mutual-match thread and message service with local fallback.
- `utils/storage.ts`: browser-local MVP persistence helpers.
- `docs/APPWRITE_SETUP.md`: Appwrite Cloud/backend setup guide.
- `scripts/seed-appwrite-demo.mjs`: creates demo accounts and seeded product scenarios for recording.
- `app/(tabs)/people.tsx`: main SkillBridge tab.
- `app/(tabs)/discover.tsx`: partners, tutors, and resources.
- `app/(tabs)/index.tsx`: saved bridge requests, tutor shortlist, and resources.
- `app/(tabs)/(chats)/index.tsx`: Q&A feed.
- `app/(tabs)/profile.tsx`: learning profile MVP.
- `SKILLBRIDGE_REPO_NOTES.md`: exploration notes and conversion guide.
