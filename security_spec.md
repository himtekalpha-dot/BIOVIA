# BIOVIA Firestore Security Specification

## 1. Data Invariants
1. **Owner-Only User Profiles (`/users/{userId}`)**: Only an authenticated, email-verified user whose `request.auth.uid == userId` may read, create, or update their profile. `uid` and `createdAt` are immutable; `updatedAt` must equal `request.time`. No user can list `/users`.
2. **PII Isolation (`/users/{userId}/private/{infoId}`)**: Email and avatar URL are strictly isolated in the `private` subcollection. Only `isOwner(userId)` with `emailVerified()` may read or write `infoId == 'info'`.
3. **Owner-Only Material Progress (`/users/{userId}/materialProgress/{materialSlug}`)**: Only the owning verified student may read or write progress documents where `userId == request.auth.uid`, `materialSlug` matches the path parameter, scores are integers `0 <= score <= 100`, `attempts >= 1`, and `category` is one of `['manusia', 'hewan', 'tumbuhan', 'sel']`.
4. **Immutable Quiz History (`/users/{userId}/quizHistory/{attemptId}`)**: Only the owning verified student may read (`get` / `list`) or `create` attempts. Updates and deletes are permanently denied. `createdAt == request.time`.
5. **Default-Deny Safety Net**: Any unspecified collection or path is denied (`allow read, write: if false;`).

## 2. The "Dirty Dozen" Adversarial Payloads
1. Unauthenticated read of `/users/user123` -> `PERMISSION_DENIED`
2. Cross-user read of `/users/otherUser/private/info` -> `PERMISSION_DENIED`
3. Unverified email user writing `/users/user123` -> `PERMISSION_DENIED`
4. Shadow/ghost field injection (`isAdmin: true`) on `/users/user123` create -> `PERMISSION_DENIED`
5. Identity spoofing (`uid: "otherUser"`) inside `/users/user123` -> `PERMISSION_DENIED`
6. Client-forged timestamp (`createdAt: "2020-01-01"`) on `/users/user123` create -> `PERMISSION_DENIED`
7. Modifying immutable `createdAt` or `uid` on `/users/user123` update -> `PERMISSION_DENIED`
8. Oversized string (`displayName` > 100 chars) on `/users/user123` -> `PERMISSION_DENIED`
9. Invalid category (`category: "astrologi"`) on `materialProgress` -> `PERMISSION_DENIED`
10. Out-of-bounds quiz score (`bestScore: 999`) on `materialProgress` -> `PERMISSION_DENIED`
11. Mutating an immutable `quizHistory` entry via `update` -> `PERMISSION_DENIED`
12. Blanket `list` query on `/users` collection -> `PERMISSION_DENIED`
