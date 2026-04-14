# SkillBridge Repo Exploration Notes

Date: 2026-04-06. This repo started as the Humbble dating app codebase inside the `SkillBridge` directory. The purpose of this note is to preserve the useful exploration findings while converting the app into SkillBridge: a two-way learning connection platform.

## MVP Update

The first SkillBridge MVP pass has been applied. The fastest local path is web-first:

```sh
cd /home/sg/SkillBridge
npm install
npm run web
```

The current MVP uses an Appwrite-ready service layer with browser-local fallback and includes:

- learning partner swipe cards in `components/PeopleCard.tsx` that save bridge/skip actions
- What2Eat-inspired swipe deck polish: stacked image card, bottom gradient, top info button, drag overlay badges, and floating X/info/heart actions
- SkillBridge mock users/resources in `DB/userDB.tsx`
- Discover sections for partners, tutor marketplace, and resources with save/shortlist actions
- Saved tab that reads local bridge requests, tutor shortlist, and resources
- Q&A/study-room screens that can post/remove questions and add/remove answers
- tutor shortlist flow with request-session status for focused help
- mutual bridge chat flow in `services/matchService.ts`: reverse bridge detection, match thread storage, and one-to-one messages
- demo scenario seeding script in `scripts/seed-appwrite-demo.mjs` for startup video recording (real test users, incoming bridge requests, ready matches, and seeded messages)
- editable learning profile and checklist with product fields: role, skills to teach, skills to learn, availability, mode, level, location, credentials, hourly rate, and learning goal
- service layer in `services/` so screens no longer own persistence details directly
- Appwrite adapter in `services/appwriteAdapter.ts` for auth-backed profile/catalog/bridge/tutor/Q&A/resource persistence
- catalog service in `services/catalogService.ts` so Bridge and Discover can read profiles/resources from Appwrite when configured
- Appwrite Cloud schema setup script in `scripts/setup-appwrite-schema.mjs`
- local persistence helpers in `utils/storage.ts`
- updated auth copy and Appwrite SDK method names
- demo auth mode while Appwrite is not configured
- cleaner app-style auth screens inspired by the What2Eat form structure
- a rewritten English `README.md`
- Appwrite Cloud/backend setup guide in `docs/APPWRITE_SETUP.md`
- `.env.example` for Appwrite endpoint, project, database, and collection IDs
- lint config via `.eslintrc.js`

Validation run:

- `npm run lint`
- `npx tsc --noEmit`
- `npx expo export --platform web --output-dir dist`

## 1. Stack Overview

- Framework: Expo + React Native, using `expo-router` for file-based routing.
- Native targets already exist: `android/` and `ios/`, both still carrying the old `humbble` naming.
- Language: mostly TypeScript/TSX. `components/Button.jsx` is plain JS.
- UI libraries currently in use:
  - `@expo/vector-icons`
  - `expo-linear-gradient`
  - `react-native-deck-swiper` for swipe cards
  - `@react-navigation/bottom-tabs`, `@react-navigation/native`
- Backend/auth: Appwrite SDK is present. `constants/appwrite.ts` reads Expo public environment variables and leaves demo/fallback mode enabled when no project ID is configured.
- `node_modules` was not present during the first exploration; it has since been installed for local validation.

## 2. Important Repo Structure

- `app/_layout.tsx`: root layout. Loads the font, sets up `ThemeProvider`, and registers Stack routes for `(tabs)`, auth screens, `charscreenf`, and not-found.
- `app/(tabs)/_layout.tsx`: bottom tab layout. Current tabs are `Profile`, `Discover`, `Bridge`, `Q&A`, and `Saved`. The initial route is `people`.
- `app/(tabs)/people.tsx`: swipe people screen. Renders `PeopleCard`. This is now the core learning-partner matching screen.
- `components/PeopleCard.tsx`: swipe card component using `react-native-deck-swiper`; reads data from `DB/userDB.tsx`.
- `app/(tabs)/discover.tsx`: recommendation carousels such as recommendations, same dating goal, communities in common, and similar interests. This can be repurposed for learning partners, tutors, and resources.
- `components/UserCard.tsx`: simple card for horizontal lists on Discover.
- `app/(tabs)/(chats)/index.tsx`: Q&A/study-room shell, question answers, and ready match-thread links.
- `app/(tabs)/(chats)/chatScreen.tsx`: one-to-one learning match chat screen keyed by `threadId`.
- `app/charscreenf.tsx`: root-level global study room placeholder. The Q&A card currently pushes to this route.
- `app/(tabs)/profile.tsx`: learning profile checklist and MVP profile summary.
- `app/auth/signin.tsx` and `app/auth/signup.tsx`: sign-in/sign-up UI with background images and gradients; both call Appwrite account APIs.
- `DB/userDB.tsx`: mock SkillBridge user and resource data.
- `constants/Colors.ts`: existing theme colors.
- `constants/appwrite.ts`: Appwrite client config from `EXPO_PUBLIC_*` environment variables.
- `docs/APPWRITE_SETUP.md`: Docker/Appwrite local backend setup guide.
- `assets/images/sign-in.jpg`, `assets/images/sign-up.jpg`: auth background images.

## 3. Current App Flow

- The app boots into the tab layout, with `people`/Bridge as the initial tab.
- Bottom tabs:
  - `Bridge`: swipe through learning partner profiles.
  - `Discover`: horizontal lists for learning partners, tutors, and verified resources.
  - `Q&A`: question feed with answers, global study-room posting screen, and quick links to mutual-match chats.
  - `Profile`: editable local learning profile, strength score, and checklist.
  - `Saved`: mutual match threads, pending bridge requests, tutor shortlist, and resources.
- Auth is not required before entering the app. The Profile screen now has `Switch account` and `Sign out` actions for faster multi-account testing.
- Sign up/sign in now use the current Appwrite SDK method names. If Appwrite is not configured through `.env`, they run in demo mode and store profile data locally.

## 4. Reusable Pieces For SkillBridge

- Swipe matching:
  - `PeopleCard` is the most valuable reusable piece.
  - `SuggestedUsers` has been replaced with learning-oriented data: `canTeach`, `wantsToLearn`, `availability`, `goal`, `mode`, and optional `rating`/`hourlyRate`.
  - The left/right overlay behavior now writes through the service layer: left = skip, right = bridge request.

- Discover carousel:
  - `Recommendations for you` -> "Learning partners for you".
  - `Same dating goal` -> "Same learning goal".
  - `Communities in common` -> "Same study community".
  - `Similar interests` -> "Similar subjects".
  - Add a tutor marketplace section, for example "Tutors available this week".
  - Add a resource library section, for example "Verified resources".

- Profile:
  - The profile screen now has an editable local learning profile.
  - It stores name, skills the user can teach, skills they want to learn, availability, and learning goal.
  - Future backend work can add certificates, proof, and moderation.

- Chats:
  - The `(chats)` tab is now "Q&A".
  - Users can post/remove local questions.
  - `charscreenf.tsx` posts into the same local question feed.
  - Mutual bridge threads open `chatScreen` and persist messages through the service layer.

- Auth UI:
  - The two auth screens have a strong visual base and can be reused.
  - Rewrite copy for learning, e.g. "Welcome Back" -> "Continue learning"; "Join Us Today" -> "Join SkillBridge".
  - The existing Appwrite skeleton can be kept if Appwrite is the chosen backend.

## 5. SkillBridge Product Mapping

- Core matching:
  - Convert tab `people` to `match`, or keep the route name and change the UI label to "Bridge".
  - Cards should show:
    - name + role: learner/tutor/both
    - "Can teach"
    - "Wants to learn"
    - availability
    - learning goal
    - connection action or swipe cue

- Tutor marketplace:
  - Start as a section inside `discover.tsx` before creating a separate tab.
  - Later, it can become a dedicated `tutors` tab.
  - Data should include credentials, certificates, hourly rate, rating, availability, and subjects.

- Global chat / Q&A:
  - Reuse the `(chats)` tab.
  - Rename "Chats" to "Q&A" or "Study Chat".
  - Suggested models: `questions`, `answers`, `threads`, `messages`.

- Resource library:
  - Start as a section inside `discover.tsx`.
  - Later, it can become a dedicated `resources` route/tab.
  - Data should include subject, level, tags, verifier/moderator, file URL, and description.

## 6. Rename And Cleanup Work

- `package.json` name is now `skillbridge`.
- `app.json` now has:
  - `name`: `SkillBridge`
  - `slug`: `skillbridge`
  - `scheme`: `skillbridge`
  - iOS bundle id: `com.anonymous.humbble`
  - Android package: `com.anonymous.humbble`
- Native folders and projects still use `ios/humbble*` and Android package `com.anonymous.humbble`.
- `README.md` has been rewritten for SkillBridge.
- Native iOS/Android package renaming should be done carefully later because it can affect Gradle and Xcode config.

## 7. Current Risks / Bugs Found

- Appwrite is only active after `.env` has a project ID. Without it, the app intentionally stays in local fallback mode.
- The project now uses Appwrite Cloud as the recommended backend path because Docker Desktop WSL integration was unreliable on this machine.
- Appwrite Cloud schema has been set up with `skillbridge` database, MVP collections, indexes, and seed catalog data.
- `npm run seed:demo` can also create demo Appwrite accounts and preconfigured match/chat scenarios for recording.
- Revoke the temporary `APPWRITE_API_KEY` after setup if it is no longer needed.
- Browser-local fallback remains in place. Clearing browser storage resets fallback bridge requests, tutor shortlist, resources, questions, and profile edits.
- Native bundle/package identifiers still use the old `humbble` naming.
- `test` script is `jest --watchAll`; add a one-shot script like `test:ci` for CI/local verification.

## 8. Suggested Initial Data Model

```ts
type SkillBridgeUser = {
  id: string;
  name: string;
  avatarUrl: string;
  role: "learner" | "tutor" | "both";
  canTeach: string[];
  wantsToLearn: string[];
  level: "beginner" | "intermediate" | "advanced";
  goals: string[];
  availability: string[];
  learningMode: "online" | "offline" | "hybrid";
  bio: string;
  rating?: number;
  hourlyRate?: number;
  certificates?: string[];
};
```

For the MVP, mock data in `DB/userDB.tsx` remains as fallback data. Appwrite-backed catalog data is loaded through `services/catalogService.ts` when configured.

## 9. Fast MVP Conversion Path

1. Update basic branding and copy:
   - `README.md`
   - `package.json`
   - `app.json`
   - tab titles in `app/(tabs)/_layout.tsx`
   - header/copy in `people.tsx`, `discover.tsx`, `profile.tsx`, and auth screens.

2. Replace mock data:
   - Convert `DB/userDB.tsx` into SkillBridge data.
   - Update `PeopleCard` and `UserCard` to show skills/goals instead of age/dating bio.

3. Build core matching first:
   - Swipe right = request learning partner.
   - Swipe left = skip.
   - Add card details: can teach / wants to learn / availability.

4. After core matching:
   - Convert `Discover` into marketplace + resources.
   - Convert `Chats` into Q&A/global chat.
   - Finish auth/Appwrite setup.

## 10. Local Hosting / Running The App

Run from the repo:

```sh
cd /home/sg/SkillBridge
```

Install dependencies:

```sh
npm install
```

Start the Expo dev server:

```sh
npm start
```

After Expo starts:

- Press `w` in the terminal to open the web version locally.
- Or scan the QR code with Expo Go on your phone.
- Or press `a` if you have an Android emulator ready.

Run web directly:

```sh
npm run web
```

Run Android native:

```sh
npm run android
```

Run iOS native:

```sh
npm run ios
```

Notes:

- This machine currently has Node `v22.18.0` and npm `10.9.3`.
- `node_modules` is present in this workspace, but fresh clones should still run `npm install` before running the app.
- Login/signup use Appwrite when `EXPO_PUBLIC_APPWRITE_PROJECT_ID` is configured in `.env`; otherwise they use demo mode.
- If you only want to inspect the UI first, you can enter the tab app without logging in.
