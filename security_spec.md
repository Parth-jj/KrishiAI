# Security Specification & Payload-First TDD (`firestore.rules`)

## 1. Data Invariants
1. **Master Gate & Ownership:** Every `/users/{userId}/farms/{farmId}`, `/users/{userId}/queries/{queryId}`, `/users/{userId}/tasks/{taskId}`, and `/users/{userId}/private/info` document requires an existing parent `/users/{userId}` document and `userId == request.auth.uid`.
2. **PII Isolation:** Contact PII (`email`, `phone`) is stored strictly in `/users/{userId}/private/info` and readable/writable only by `isOwner(userId)` or `isAdmin()`.
3. **Anti-Self-Escalation:** Client writes to `/users/{userId}` on creation must lock `role == 'farmer'`, and users cannot update their `role`.
4. **Immutable Ownership & Temporal Integrity:** `uid` / `userId` and `createdAt` cannot change after creation; `createdAt` and `updatedAt` must equal `request.time`.
5. **Bounded Arrays & Strings:** All strings enforce `.size()` bounds; all lists in `QueryAdvisory` (`likelyCauses`, `recommendationTitles`, `recommendationDetails`, `precautions`, `sourceTitles`) enforce `.size() <= 10` and element type check on index `0`.
6. **Verified Identity:** Standard writes require `request.auth != null && request.auth.token.email_verified == true`.

## 2. The "Dirty Dozen" Attack Payloads (All Must Fail with PERMISSION_DENIED)
1. **Unauthenticated Read on Private PII:** Unauthenticated `get(/users/u1/private/info)`.
2. **Cross-User PII Read:** Authenticated user `u2` reading `/users/u1/private/info`.
3. **Self-Assigned Admin Role on Signup:** Creating `/users/u1` with `role: "admin"`.
4. **Role Escalation Update:** Updating `/users/u1` with `{ role: "admin", updatedAt: request.time }`.
5. **Shadow / Ghost Field Injection:** Creating `/users/u1/farms/f1` with an extra `isVerified: true` field.
6. **Identity Spoofing in Subcollection:** User `u1` creating `/users/u1/tasks/t1` with `userId: "u2"`.
7. **Orphan Subcollection Write:** Creating `/users/u1/farms/f1` when `/users/u1` does not exist.
8. **ID Poisoning:** Creating `/users/u1/tasks/invalid$id!` or a 200-char ID.
9. **Client-Spoofed Timestamp:** Creating `/users/u1/tasks/t1` with `createdAt` set to a past client timestamp instead of `request.time`.
10. **Immutable Field Tampering:** Updating `/users/u1/farms/f1` and changing `createdAt` or `userId`.
11. **Oversized Array / Wrong Element Type:** Creating `/users/u1/queries/q1` with `precautions: [123]` or 15 items (`> 10`).
12. **Blanket List Scraping:** User `u2` running `list` on `/users/u1/queries` or `/users/u1/farms`.
