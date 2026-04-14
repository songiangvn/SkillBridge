# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
npm install          # install dependencies
npm run web          # preferred dev target — starts Expo and opens in browser
npm start            # general Expo dev server (press w=web, a=Android, i=iOS)
npm run android      # native Android build
npm run ios          # native iOS build (macOS only)
npm run lint         # ESLint via expo lint
npx tsc --noEmit     # type-check without emitting
npm test             # Jest in watch mode (use npx jest --testPathPattern=<file> for single tests)
npx expo export --platform web --output-dir dist  # web build validation
```

### Backend setup (one-time)

```sh
cp .env.example .env         # fill EXPO_PUBLIC_APPWRITE_PROJECT_ID
npm run setup:appwrite       # create DB schema, collections, indexes, seed catalog
npm run seed:demo            # create demo accounts + seeded match/chat scenarios
```

Revoke `APPWRITE_API_KEY` in Appwrite Console after running setup. See `docs/APPWRITE_SETUP.md` for full details.

## Architecture

SkillBridge is an Expo/React Native app using `expo-router` (file-based routing). It was originally the Humbble dating app; the native `android/` and `ios/` folders still carry `humbble` package names — do not rename them without careful Gradle/Xcode coordination.

### Routing

- `app/_layout.tsx` — root Stack; registers `(tabs)`, `chatScreen`, `auth/signin`, `auth/signup`, `charscreenf`
- `app/(tabs)/_layout.tsx` — bottom tab bar; initial route is `people`
- Tab routes: `people` (Bridge), `discover`, `(chats)` (Q&A), `index` (Saved/Chat), `profile`
- `app/(tabs)/(chats)/index.tsx` — Q&A feed + match-thread links
- `app/chatScreen.tsx` — one-to-one match chat, keyed by `threadId` query param

### Service layer (`services/`)

Screens never touch storage directly. All reads/writes go through these services:

| Service | Responsibility |
|---|---|
| `authService.ts` | Sign-in / sign-up / sign-out via Appwrite |
| `profileService.ts` | Read/write user learning profile |
| `bridgeService.ts` | Bridge requests (swipe right = request, left = skip) |
| `matchService.ts` | Mutual-match detection, thread creation, messages |
| `catalogService.ts` | Load profiles/resources — Appwrite-first, mock fallback |
| `tutorService.ts` | Tutor shortlist |
| `questionService.ts` | Q&A questions |
| `resourceService.ts` | Saved learning resources |
| `appwriteAdapter.ts` | All Appwrite SDK calls, shared by all services above |

### Persistence strategy

- **Appwrite configured** (`.env` has `EXPO_PUBLIC_APPWRITE_PROJECT_ID`): full backend via `appwriteAdapter.ts`
- **No project ID**: app runs in demo/fallback mode — data persists to browser-local storage via `utils/storage.ts`; auth screens still work without a backend

`isAppwriteConfigured` in `constants/appwrite.ts` is the runtime switch; every service checks it before calling the adapter.

### Data & mock layer

- `DB/userDB.tsx` — mock `SkillBridgeUser[]` and `LearningResource[]`; used as fallback when Appwrite catalog is unavailable
- `utils/storage.ts` — browser-local helpers for bridge requests, tutor shortlist, questions, messages, threads

### Key components

- `components/PeopleCard.tsx` — swipe card powered by `react-native-deck-swiper`; swipe right = bridge request, left = skip; writes through `bridgeService`
- `components/UserCard.tsx` — horizontal-list card for Discover carousels
- `components/Avatar.tsx`, `components/Header.tsx` — shared UI pieces

### Environment variables

All runtime config uses `EXPO_PUBLIC_*` prefix. See `.env.example` for the full list. `APPWRITE_API_KEY` is server-side only (setup/seed scripts) and must never be prefixed with `EXPO_PUBLIC_`.

### Native naming note

iOS bundle ID and Android package are still `com.anonymous.humbble` (from the source project). Defer the rename until after product direction is stable.
