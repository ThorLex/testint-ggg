# API Analysis Report - Navipad

**Generated:** 2026-02-26T11:15:58.172Z

## Executive Summary

- **Total Routes Documented:** 13
- **Total Interfaces Documented:** 9
- **Total Hooks Implemented:** 21
- **Total Issues Found:** 40

### Issues by Priority

- 🔴 **Critical:** 2
- 🟠 **High:** 31
- 🟡 **Medium:** 7
- 🟢 **Low:** 0

## Route Issues

### 1. 🟠 INCORRECT_PATH

**Route:** `GET /api/mobile/amodiataires/:id/announcements`
**Priority:** HIGH
**Current Value:** `/api/mobile/public/amodiataires/:id/announcements`

**Suggestion:** Update PUBLIC_AMODIATAIRE_ANNOUNCEMENTS from "/api/mobile/public/amodiataires/:id/announcements" to "/api/mobile/amodiataires/:id/announcements"

### 2. 🟠 INCORRECT_PATH

**Route:** `GET /api/mobile/amodiataires/:id/media`
**Priority:** HIGH
**Current Value:** `/api/mobile/public/amodiataires/:id/media`

**Suggestion:** Update PUBLIC_AMODIATAIRE_MEDIA from "/api/mobile/public/amodiataires/:id/media" to "/api/mobile/amodiataires/:id/media"

### 3. 🟠 INCORRECT_PATH

**Route:** `GET /api/mobile/amodiataires/:id/announcements`
**Priority:** HIGH
**Current Value:** `/api/mobile/public/amodiataires/:id/announcements`

**Suggestion:** Utility method getAmodiataireAnnouncementsUrl uses PUBLIC_AMODIATAIRE_ANNOUNCEMENTS with incorrect path

### 4. 🟠 INCORRECT_PATH

**Route:** `GET /api/mobile/amodiataires/:id/media`
**Priority:** HIGH
**Current Value:** `/api/mobile/public/amodiataires/:id/media`

**Suggestion:** Utility method getAmodiataireMediaUrl uses PUBLIC_AMODIATAIRE_MEDIA with incorrect path

## TypeScript Interface Issues

### 1. 🔴 MISSING_INTERFACE

**Interface:** `ProfilePutResponse`

### 2. 🔴 MISSING_INTERFACE

**Interface:** `SubmitValidationPostResponse`

### 3. 🟠 MISSING_PROPERTY

**Interface:** `AnnouncementsListResponse`
**Property:** `success`
**Expected:** `"boolean"`

### 4. 🟠 MISSING_PROPERTY

**Interface:** `AnnouncementsListResponse`
**Property:** `count`
**Expected:** `"number"`

### 5. 🟠 MISSING_PROPERTY

**Interface:** `AnnouncementsListResponse`
**Property:** `announcements`
**Expected:** `"object[]"`

### 6. 🟠 MISSING_PROPERTY

**Interface:** `MediaListResponse`
**Property:** `count`
**Expected:** `"number"`

### 7. 🟠 MISSING_PROPERTY

**Interface:** `MediaPostResponse`
**Property:** `success`
**Expected:** `"boolean"`

### 8. 🟠 MISSING_PROPERTY

**Interface:** `MediaPostResponse`
**Property:** `message`
**Expected:** `"string"`

### 9. 🟠 MISSING_PROPERTY

**Interface:** `MediaPostResponse`
**Property:** `media`
**Expected:** `"MediaDetail"`

### 10. 🟠 MISSING_PROPERTY

**Interface:** `MediaResponse`
**Property:** `success`
**Expected:** `"boolean"`

### 11. 🟠 MISSING_PROPERTY

**Interface:** `MediaResponse`
**Property:** `media`
**Expected:** `"MediaDetail[]"`

### 12. 🟠 MISSING_PROPERTY

**Interface:** `AnnouncementsPostResponse`
**Property:** `success`
**Expected:** `"boolean"`

### 13. 🟠 MISSING_PROPERTY

**Interface:** `AnnouncementsPostResponse`
**Property:** `announcement`
**Expected:** `"object"`

### 14. 🟠 MISSING_PROPERTY

**Interface:** `AnnouncementsResponse`
**Property:** `success`
**Expected:** `"boolean"`

### 15. 🟠 MISSING_PROPERTY

**Interface:** `AnnouncementsResponse`
**Property:** `announcements`
**Expected:** `"object[]"`

## React Query Hook Issues

### 1. 🟠 MISSING_HOOK

**Route:** `POST /api/mobile/announcements`

### 2. 🟠 INCORRECT_ROUTE

**Hook:** `useNearbyAmodiataires`
**Route:** `GET /api/mobile/public/amodiataires`
**Expected:** `"/api/mobile/public/amodiataires"`
**Actual:** `"/api/mobile/public/amodiataires/nearby"`

### 3. 🟠 INCORRECT_ROUTE

**Hook:** `useAmodiataireAnnouncements`
**Route:** `GET /api/mobile/amodiataires/:id/announcements`
**Expected:** `"/api/mobile/amodiataires/:id/announcements"`
**Actual:** `"getAmodiataireAnnouncementsUrl"`

### 4. 🟠 INCORRECT_ROUTE

**Hook:** `useAmodiataireMedia`
**Route:** `GET /api/mobile/amodiataires/:id/media`
**Expected:** `"/api/mobile/amodiataires/:id/media"`
**Actual:** `"getAmodiataireMediaUrl"`

### 5. 🟠 INCORRECT_ROUTE

**Hook:** `useAmodiatairesMinimal`
**Route:** `GET /api/mobile/public/amodiataires`
**Expected:** `"/api/mobile/public/amodiataires"`
**Actual:** `"getAmodiatairesMinimalUrl"`

### 6. 🟠 INCORRECT_ROUTE

**Hook:** `useAmodiatairesCoordinates`
**Route:** `GET /api/mobile/public/amodiataires`
**Expected:** `"/api/mobile/public/amodiataires"`
**Actual:** `"getAmodiatairesCoordinatesUrl"`

### 7. 🟠 INCORRECT_ROUTE

**Hook:** `useAmodiatairesSearch`
**Route:** `GET /api/mobile/public/amodiataires`
**Expected:** `"/api/mobile/public/amodiataires"`
**Actual:** `"getAmodiatairesSearch"`

### 8. 🟠 INCORRECT_ROUTE

**Hook:** `useUploadMedia`
**Route:** `POST /api/mobile/media`
**Expected:** `"/api/mobile/media"`

### 9. 🟠 INCORRECT_ROUTE

**Hook:** `useMediaList`
**Route:** `GET /api/mobile/amodiataires/:id/media`
**Expected:** `"/api/mobile/amodiataires/:id/media"`
**Actual:** `"/api/mobile/media"`

### 10. 🟠 INCORRECT_ROUTE

**Hook:** `useDeleteMedia`
**Route:** `POST /api/mobile/media`
**Expected:** `"/api/mobile/media"`
**Actual:** `"getDeleteMediaUrl"`

### 11. 🟠 INCORRECT_ROUTE

**Hook:** `useSubmitMediaValidation`
**Route:** `POST /api/mobile/media`
**Expected:** `"/api/mobile/media"`
**Actual:** `"/api/mobile/media/submit-validation"`

### 12. 🟠 INCORRECT_ROUTE

**Hook:** `useAnnouncementsList`
**Route:** `GET /api/mobile/amodiataires/:id/announcements`
**Expected:** `"/api/mobile/amodiataires/:id/announcements"`
**Actual:** `"/api/mobile/announcements"`

### 13. 🟡 PARAMETER_MISMATCH

**Hook:** `useAmodiatairesMinimal`
**Expected:** `["limit","offset","search"]`
**Actual:** `["options"]`

### 14. 🟡 PARAMETER_MISMATCH

**Hook:** `useAmodiatairesCoordinates`
**Expected:** `["limit","offset","search"]`
**Actual:** `["options"]`

### 15. 🟡 PARAMETER_MISMATCH

**Hook:** `useAmodiatairesSearch`
**Expected:** `["limit","offset","search"]`
**Actual:** `["query","options"]`

### 16. 🟡 INVALID_QUERY_KEY

**Hook:** `useAmodiatairesMinimal`
**Expected:** `"Query key should include parameters for cache differentiation"`
**Actual:** `["amodiataires","minimal"]`

### 17. 🟡 INVALID_QUERY_KEY

**Hook:** `useAmodiatairesCoordinates`
**Expected:** `"Query key should include parameters for cache differentiation"`
**Actual:** `["amodiataires","coordinates"]`

### 18. 🟡 INVALID_QUERY_KEY

**Hook:** `useMapData`
**Expected:** `"Query key should include parameters for cache differentiation"`
**Actual:** `["map","data"]`

### 19. 🟡 INVALID_QUERY_KEY

**Hook:** `useZoneBounds`
**Expected:** `"Query key should include parameters for cache differentiation"`
**Actual:** `["zone","bounds"]`

### 20. 🟠 MISSING_CACHE_INVALIDATION

**Hook:** `useLogin`
**Expected:** `"Mutation should invalidate relevant query caches"`

### 21. 🟠 MISSING_CACHE_INVALIDATION

**Hook:** `useLogout`
**Expected:** `"Mutation should invalidate relevant query caches"`

## Recommendations

### 1. 🔴 Create missing interface: ProfilePutResponse

**Category:** TYPE
**Priority:** CRITICAL

The interface ProfilePutResponse is documented but not found in api.ts.

**Affected Files:**
- `src/types/api.ts`

**Before:**
```typescript
// ProfilePutResponse is missing from api.ts
```

**After:**
```typescript
export interface ProfilePutResponse {
  success: boolean;
  message: string;
  status: string;
}
```

### 2. 🔴 Create missing interface: SubmitValidationPostResponse

**Category:** TYPE
**Priority:** CRITICAL

The interface SubmitValidationPostResponse is documented but not found in api.ts.

**Affected Files:**
- `src/types/api.ts`

**Before:**
```typescript
// SubmitValidationPostResponse is missing from api.ts
```

**After:**
```typescript
export interface SubmitValidationPostResponse {
  success: boolean;
  message: string;
  count: number;
}
```

### 3. 🟠 Fix incorrect route path: /api/mobile/amodiataires/:id/announcements

**Category:** ROUTE
**Priority:** HIGH

The route constant has an incorrect path. Expected: /api/mobile/amodiataires/:id/announcements, Actual: /api/mobile/public/amodiataires/:id/announcements

**Affected Files:**
- `src/services/api/routes.ts`

**Before:**
```typescript
  static readonly PUBLIC_AMODIATAIRES_ANNOUNCEMENTS = '/api/mobile/public/amodiataires/:id/announcements';
```

**After:**
```typescript
  static readonly AMODIATAIRES_ANNOUNCEMENTS = '/api/mobile/amodiataires/:id/announcements';
```

### 4. 🟠 Fix incorrect route path: /api/mobile/amodiataires/:id/media

**Category:** ROUTE
**Priority:** HIGH

The route constant has an incorrect path. Expected: /api/mobile/amodiataires/:id/media, Actual: /api/mobile/public/amodiataires/:id/media

**Affected Files:**
- `src/services/api/routes.ts`

**Before:**
```typescript
  static readonly PUBLIC_AMODIATAIRES_MEDIA = '/api/mobile/public/amodiataires/:id/media';
```

**After:**
```typescript
  static readonly AMODIATAIRES_MEDIA = '/api/mobile/amodiataires/:id/media';
```

### 5. 🟠 Fix incorrect route path: /api/mobile/amodiataires/:id/announcements

**Category:** ROUTE
**Priority:** HIGH

The route constant has an incorrect path. Expected: /api/mobile/amodiataires/:id/announcements, Actual: /api/mobile/public/amodiataires/:id/announcements

**Affected Files:**
- `src/services/api/routes.ts`

**Before:**
```typescript
  static readonly PUBLIC_AMODIATAIRES_ANNOUNCEMENTS = '/api/mobile/public/amodiataires/:id/announcements';
```

**After:**
```typescript
  static readonly AMODIATAIRES_ANNOUNCEMENTS = '/api/mobile/amodiataires/:id/announcements';
```

### 6. 🟠 Fix incorrect route path: /api/mobile/amodiataires/:id/media

**Category:** ROUTE
**Priority:** HIGH

The route constant has an incorrect path. Expected: /api/mobile/amodiataires/:id/media, Actual: /api/mobile/public/amodiataires/:id/media

**Affected Files:**
- `src/services/api/routes.ts`

**Before:**
```typescript
  static readonly PUBLIC_AMODIATAIRES_MEDIA = '/api/mobile/public/amodiataires/:id/media';
```

**After:**
```typescript
  static readonly AMODIATAIRES_MEDIA = '/api/mobile/amodiataires/:id/media';
```

### 7. 🟠 Add missing property: AnnouncementsListResponse.success

**Category:** TYPE
**Priority:** HIGH

The property success is documented but missing from interface AnnouncementsListResponse.

**Affected Files:**
- `src/types/api.ts`

**Before:**
```typescript
export interface AnnouncementsListResponse {
  // ... existing properties
  // success is missing
}
```

**After:**
```typescript
export interface AnnouncementsListResponse {
  // ... existing properties
  success: boolean;
}
```

### 8. 🟠 Add missing property: AnnouncementsListResponse.count

**Category:** TYPE
**Priority:** HIGH

The property count is documented but missing from interface AnnouncementsListResponse.

**Affected Files:**
- `src/types/api.ts`

**Before:**
```typescript
export interface AnnouncementsListResponse {
  // ... existing properties
  // count is missing
}
```

**After:**
```typescript
export interface AnnouncementsListResponse {
  // ... existing properties
  count: number;
}
```

### 9. 🟠 Add missing property: AnnouncementsListResponse.announcements

**Category:** TYPE
**Priority:** HIGH

The property announcements is documented but missing from interface AnnouncementsListResponse.

**Affected Files:**
- `src/types/api.ts`

**Before:**
```typescript
export interface AnnouncementsListResponse {
  // ... existing properties
  // announcements is missing
}
```

**After:**
```typescript
export interface AnnouncementsListResponse {
  // ... existing properties
  announcements: object[];
}
```

### 10. 🟠 Add missing property: MediaListResponse.count

**Category:** TYPE
**Priority:** HIGH

The property count is documented but missing from interface MediaListResponse.

**Affected Files:**
- `src/types/api.ts`

**Before:**
```typescript
export interface MediaListResponse {
  // ... existing properties
  // count is missing
}
```

**After:**
```typescript
export interface MediaListResponse {
  // ... existing properties
  count: number;
}
```

### 11. 🟠 Add missing property: MediaPostResponse.success

**Category:** TYPE
**Priority:** HIGH

The property success is documented but missing from interface MediaPostResponse.

**Affected Files:**
- `src/types/api.ts`

**Before:**
```typescript
export interface MediaPostResponse {
  // ... existing properties
  // success is missing
}
```

**After:**
```typescript
export interface MediaPostResponse {
  // ... existing properties
  success: boolean;
}
```

### 12. 🟠 Add missing property: MediaPostResponse.message

**Category:** TYPE
**Priority:** HIGH

The property message is documented but missing from interface MediaPostResponse.

**Affected Files:**
- `src/types/api.ts`

**Before:**
```typescript
export interface MediaPostResponse {
  // ... existing properties
  // message is missing
}
```

**After:**
```typescript
export interface MediaPostResponse {
  // ... existing properties
  message: string;
}
```

### 13. 🟠 Add missing property: MediaPostResponse.media

**Category:** TYPE
**Priority:** HIGH

The property media is documented but missing from interface MediaPostResponse.

**Affected Files:**
- `src/types/api.ts`

**Before:**
```typescript
export interface MediaPostResponse {
  // ... existing properties
  // media is missing
}
```

**After:**
```typescript
export interface MediaPostResponse {
  // ... existing properties
  media: MediaDetail;
}
```

### 14. 🟠 Add missing property: MediaResponse.success

**Category:** TYPE
**Priority:** HIGH

The property success is documented but missing from interface MediaResponse.

**Affected Files:**
- `src/types/api.ts`

**Before:**
```typescript
export interface MediaResponse {
  // ... existing properties
  // success is missing
}
```

**After:**
```typescript
export interface MediaResponse {
  // ... existing properties
  success: boolean;
}
```

### 15. 🟠 Add missing property: MediaResponse.media

**Category:** TYPE
**Priority:** HIGH

The property media is documented but missing from interface MediaResponse.

**Affected Files:**
- `src/types/api.ts`

**Before:**
```typescript
export interface MediaResponse {
  // ... existing properties
  // media is missing
}
```

**After:**
```typescript
export interface MediaResponse {
  // ... existing properties
  media: MediaDetail[];
}
```

### 16. 🟠 Add missing property: AnnouncementsPostResponse.success

**Category:** TYPE
**Priority:** HIGH

The property success is documented but missing from interface AnnouncementsPostResponse.

**Affected Files:**
- `src/types/api.ts`

**Before:**
```typescript
export interface AnnouncementsPostResponse {
  // ... existing properties
  // success is missing
}
```

**After:**
```typescript
export interface AnnouncementsPostResponse {
  // ... existing properties
  success: boolean;
}
```

### 17. 🟠 Add missing property: AnnouncementsPostResponse.announcement

**Category:** TYPE
**Priority:** HIGH

The property announcement is documented but missing from interface AnnouncementsPostResponse.

**Affected Files:**
- `src/types/api.ts`

**Before:**
```typescript
export interface AnnouncementsPostResponse {
  // ... existing properties
  // announcement is missing
}
```

**After:**
```typescript
export interface AnnouncementsPostResponse {
  // ... existing properties
  announcement: object;
}
```

### 18. 🟠 Add missing property: AnnouncementsResponse.success

**Category:** TYPE
**Priority:** HIGH

The property success is documented but missing from interface AnnouncementsResponse.

**Affected Files:**
- `src/types/api.ts`

**Before:**
```typescript
export interface AnnouncementsResponse {
  // ... existing properties
  // success is missing
}
```

**After:**
```typescript
export interface AnnouncementsResponse {
  // ... existing properties
  success: boolean;
}
```

### 19. 🟠 Add missing property: AnnouncementsResponse.announcements

**Category:** TYPE
**Priority:** HIGH

The property announcements is documented but missing from interface AnnouncementsResponse.

**Affected Files:**
- `src/types/api.ts`

**Before:**
```typescript
export interface AnnouncementsResponse {
  // ... existing properties
  // announcements is missing
}
```

**After:**
```typescript
export interface AnnouncementsResponse {
  // ... existing properties
  announcements: object[];
}
```

### 20. 🟠 Create missing hook for: /api/mobile/announcements

**Category:** HOOK
**Priority:** HIGH

No hook found for endpoint /api/mobile/announcements (POST).

**Affected Files:**
- `src/hooks/useApi.ts`

**Before:**
```typescript
// Hook useCreateMobileAnnouncements is missing for POST /api/mobile/announcements
```

**After:**
```typescript
export function useCreateMobileAnnouncements() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: RequestType) =>
      post(ApiRoutes.ROUTE_CONSTANT, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mobile","announcements"] });
    },
  });
}
```

### 21. 🟠 Fix incorrect route in hook: useNearbyAmodiataires

**Category:** HOOK
**Priority:** HIGH

Hook useNearbyAmodiataires uses incorrect route. Expected: /api/mobile/public/amodiataires, Actual: /api/mobile/public/amodiataires/nearby

**Affected Files:**
- `src/hooks/useApi.ts`

**Before:**
```typescript
export function useNearbyAmodiataires() {
  return useQuery({
    queryKey: ['key'],
    queryFn: () => get(ApiRoutes./api/mobile/public/amodiataires/nearby),
  });
}
```

**After:**
```typescript
export function useNearbyAmodiataires() {
  return useQuery({
    queryKey: ['key'],
    queryFn: () => get(ApiRoutes./api/mobile/public/amodiataires),
  });
}
```

### 22. 🟠 Fix incorrect route in hook: useAmodiataireAnnouncements

**Category:** HOOK
**Priority:** HIGH

Hook useAmodiataireAnnouncements uses incorrect route. Expected: /api/mobile/amodiataires/:id/announcements, Actual: getAmodiataireAnnouncementsUrl

**Affected Files:**
- `src/hooks/useApi.ts`

**Before:**
```typescript
export function useAmodiataireAnnouncements() {
  return useQuery({
    queryKey: ['key'],
    queryFn: () => get(ApiRoutes.getAmodiataireAnnouncementsUrl),
  });
}
```

**After:**
```typescript
export function useAmodiataireAnnouncements() {
  return useQuery({
    queryKey: ['key'],
    queryFn: () => get(ApiRoutes./api/mobile/amodiataires/:id/announcements),
  });
}
```

### 23. 🟠 Fix incorrect route in hook: useAmodiataireMedia

**Category:** HOOK
**Priority:** HIGH

Hook useAmodiataireMedia uses incorrect route. Expected: /api/mobile/amodiataires/:id/media, Actual: getAmodiataireMediaUrl

**Affected Files:**
- `src/hooks/useApi.ts`

**Before:**
```typescript
export function useAmodiataireMedia() {
  return useQuery({
    queryKey: ['key'],
    queryFn: () => get(ApiRoutes.getAmodiataireMediaUrl),
  });
}
```

**After:**
```typescript
export function useAmodiataireMedia() {
  return useQuery({
    queryKey: ['key'],
    queryFn: () => get(ApiRoutes./api/mobile/amodiataires/:id/media),
  });
}
```

### 24. 🟠 Fix incorrect route in hook: useAmodiatairesMinimal

**Category:** HOOK
**Priority:** HIGH

Hook useAmodiatairesMinimal uses incorrect route. Expected: /api/mobile/public/amodiataires, Actual: getAmodiatairesMinimalUrl

**Affected Files:**
- `src/hooks/useApi.ts`

**Before:**
```typescript
export function useAmodiatairesMinimal() {
  return useQuery({
    queryKey: ['key'],
    queryFn: () => get(ApiRoutes.getAmodiatairesMinimalUrl),
  });
}
```

**After:**
```typescript
export function useAmodiatairesMinimal() {
  return useQuery({
    queryKey: ['key'],
    queryFn: () => get(ApiRoutes./api/mobile/public/amodiataires),
  });
}
```

### 25. 🟠 Fix incorrect route in hook: useAmodiatairesCoordinates

**Category:** HOOK
**Priority:** HIGH

Hook useAmodiatairesCoordinates uses incorrect route. Expected: /api/mobile/public/amodiataires, Actual: getAmodiatairesCoordinatesUrl

**Affected Files:**
- `src/hooks/useApi.ts`

**Before:**
```typescript
export function useAmodiatairesCoordinates() {
  return useQuery({
    queryKey: ['key'],
    queryFn: () => get(ApiRoutes.getAmodiatairesCoordinatesUrl),
  });
}
```

**After:**
```typescript
export function useAmodiatairesCoordinates() {
  return useQuery({
    queryKey: ['key'],
    queryFn: () => get(ApiRoutes./api/mobile/public/amodiataires),
  });
}
```

### 26. 🟠 Fix incorrect route in hook: useAmodiatairesSearch

**Category:** HOOK
**Priority:** HIGH

Hook useAmodiatairesSearch uses incorrect route. Expected: /api/mobile/public/amodiataires, Actual: getAmodiatairesSearch

**Affected Files:**
- `src/hooks/useApi.ts`

**Before:**
```typescript
export function useAmodiatairesSearch() {
  return useQuery({
    queryKey: ['key'],
    queryFn: () => get(ApiRoutes.getAmodiatairesSearch),
  });
}
```

**After:**
```typescript
export function useAmodiatairesSearch() {
  return useQuery({
    queryKey: ['key'],
    queryFn: () => get(ApiRoutes./api/mobile/public/amodiataires),
  });
}
```

### 27. 🟠 Fix incorrect route in hook: useUploadMedia

**Category:** HOOK
**Priority:** HIGH

Hook useUploadMedia uses incorrect route. Expected: /api/mobile/media, Actual: 

**Affected Files:**
- `src/hooks/useApi.ts`

**Before:**
```typescript
export function useUploadMedia() {
  return useQuery({
    queryKey: ['key'],
    queryFn: () => get(ApiRoutes.),
  });
}
```

**After:**
```typescript
export function useUploadMedia() {
  return useQuery({
    queryKey: ['key'],
    queryFn: () => get(ApiRoutes./api/mobile/media),
  });
}
```

### 28. 🟠 Fix incorrect route in hook: useMediaList

**Category:** HOOK
**Priority:** HIGH

Hook useMediaList uses incorrect route. Expected: /api/mobile/amodiataires/:id/media, Actual: /api/mobile/media

**Affected Files:**
- `src/hooks/useApi.ts`

**Before:**
```typescript
export function useMediaList() {
  return useQuery({
    queryKey: ['key'],
    queryFn: () => get(ApiRoutes./api/mobile/media),
  });
}
```

**After:**
```typescript
export function useMediaList() {
  return useQuery({
    queryKey: ['key'],
    queryFn: () => get(ApiRoutes./api/mobile/amodiataires/:id/media),
  });
}
```

### 29. 🟠 Fix incorrect route in hook: useDeleteMedia

**Category:** HOOK
**Priority:** HIGH

Hook useDeleteMedia uses incorrect route. Expected: /api/mobile/media, Actual: getDeleteMediaUrl

**Affected Files:**
- `src/hooks/useApi.ts`

**Before:**
```typescript
export function useDeleteMedia() {
  return useQuery({
    queryKey: ['key'],
    queryFn: () => get(ApiRoutes.getDeleteMediaUrl),
  });
}
```

**After:**
```typescript
export function useDeleteMedia() {
  return useQuery({
    queryKey: ['key'],
    queryFn: () => get(ApiRoutes./api/mobile/media),
  });
}
```

### 30. 🟠 Fix incorrect route in hook: useSubmitMediaValidation

**Category:** HOOK
**Priority:** HIGH

Hook useSubmitMediaValidation uses incorrect route. Expected: /api/mobile/media, Actual: /api/mobile/media/submit-validation

**Affected Files:**
- `src/hooks/useApi.ts`

**Before:**
```typescript
export function useSubmitMediaValidation() {
  return useQuery({
    queryKey: ['key'],
    queryFn: () => get(ApiRoutes./api/mobile/media/submit-validation),
  });
}
```

**After:**
```typescript
export function useSubmitMediaValidation() {
  return useQuery({
    queryKey: ['key'],
    queryFn: () => get(ApiRoutes./api/mobile/media),
  });
}
```

### 31. 🟠 Fix incorrect route in hook: useAnnouncementsList

**Category:** HOOK
**Priority:** HIGH

Hook useAnnouncementsList uses incorrect route. Expected: /api/mobile/amodiataires/:id/announcements, Actual: /api/mobile/announcements

**Affected Files:**
- `src/hooks/useApi.ts`

**Before:**
```typescript
export function useAnnouncementsList() {
  return useQuery({
    queryKey: ['key'],
    queryFn: () => get(ApiRoutes./api/mobile/announcements),
  });
}
```

**After:**
```typescript
export function useAnnouncementsList() {
  return useQuery({
    queryKey: ['key'],
    queryFn: () => get(ApiRoutes./api/mobile/amodiataires/:id/announcements),
  });
}
```

### 32. 🟠 Add cache invalidation to mutation: useLogin

**Category:** HOOK
**Priority:** HIGH

Mutation hook useLogin is missing cache invalidation.

**Affected Files:**
- `src/hooks/useApi.ts`

**Before:**
```typescript
export function useLogin() {
  return useMutation({
    mutationFn: (data: RequestType) =>
      post(ApiRoutes.ROUTE, data),
    // Missing onSuccess with cache invalidation
  });
}
```

**After:**
```typescript
export function useLogin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: RequestType) =>
      post(ApiRoutes.ROUTE, data),
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['relevant', 'key'] });
    },
  });
}
```

### 33. 🟠 Add cache invalidation to mutation: useLogout

**Category:** HOOK
**Priority:** HIGH

Mutation hook useLogout is missing cache invalidation.

**Affected Files:**
- `src/hooks/useApi.ts`

**Before:**
```typescript
export function useLogout() {
  return useMutation({
    mutationFn: (data: RequestType) =>
      post(ApiRoutes.ROUTE, data),
    // Missing onSuccess with cache invalidation
  });
}
```

**After:**
```typescript
export function useLogout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: RequestType) =>
      post(ApiRoutes.ROUTE, data),
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['relevant', 'key'] });
    },
  });
}
```

### 34. 🟡 Fix parameter mismatch in hook: useAmodiatairesMinimal

**Category:** HOOK
**Priority:** MEDIUM

Hook useAmodiatairesMinimal has incorrect parameters. Expected: ["limit","offset","search"], Actual: ["options"]

**Affected Files:**
- `src/hooks/useApi.ts`

**Before:**
```typescript
export function useAmodiatairesMinimal() {
  return useQuery({
    queryKey: ['key'],
    queryFn: () => get(ApiRoutes.ROUTE),
  });
}
```

**After:**
```typescript
export function useAmodiatairesMinimal(params?: QueryParams) {
  return useQuery({
    queryKey: ['key', params],
    queryFn: () => get(ApiRoutes.getFullUrl(ApiRoutes.ROUTE, params)),
  });
}
```

### 35. 🟡 Fix parameter mismatch in hook: useAmodiatairesCoordinates

**Category:** HOOK
**Priority:** MEDIUM

Hook useAmodiatairesCoordinates has incorrect parameters. Expected: ["limit","offset","search"], Actual: ["options"]

**Affected Files:**
- `src/hooks/useApi.ts`

**Before:**
```typescript
export function useAmodiatairesCoordinates() {
  return useQuery({
    queryKey: ['key'],
    queryFn: () => get(ApiRoutes.ROUTE),
  });
}
```

**After:**
```typescript
export function useAmodiatairesCoordinates(params?: QueryParams) {
  return useQuery({
    queryKey: ['key', params],
    queryFn: () => get(ApiRoutes.getFullUrl(ApiRoutes.ROUTE, params)),
  });
}
```

### 36. 🟡 Fix parameter mismatch in hook: useAmodiatairesSearch

**Category:** HOOK
**Priority:** MEDIUM

Hook useAmodiatairesSearch has incorrect parameters. Expected: ["limit","offset","search"], Actual: ["query","options"]

**Affected Files:**
- `src/hooks/useApi.ts`

**Before:**
```typescript
export function useAmodiatairesSearch() {
  return useQuery({
    queryKey: ['key'],
    queryFn: () => get(ApiRoutes.ROUTE),
  });
}
```

**After:**
```typescript
export function useAmodiatairesSearch(params?: QueryParams) {
  return useQuery({
    queryKey: ['key', params],
    queryFn: () => get(ApiRoutes.getFullUrl(ApiRoutes.ROUTE, params)),
  });
}
```

### 37. 🟡 Fix query key in hook: useAmodiatairesMinimal

**Category:** HOOK
**Priority:** MEDIUM

Hook useAmodiatairesMinimal has invalid query key. Query key should include parameters for cache differentiation

**Affected Files:**
- `src/hooks/useApi.ts`

**Before:**
```typescript
export function useAmodiatairesMinimal(id: string) {
  return useQuery({
    queryKey: ['data'], // Not unique, missing id
    queryFn: () => get(`/api/data/${id}`),
  });
}
```

**After:**
```typescript
export function useAmodiatairesMinimal(id: string) {
  return useQuery({
    queryKey: ['data', 'detail', id], // Unique and includes id
    queryFn: () => get(`/api/data/${id}`),
  });
}
```

### 38. 🟡 Fix query key in hook: useAmodiatairesCoordinates

**Category:** HOOK
**Priority:** MEDIUM

Hook useAmodiatairesCoordinates has invalid query key. Query key should include parameters for cache differentiation

**Affected Files:**
- `src/hooks/useApi.ts`

**Before:**
```typescript
export function useAmodiatairesCoordinates(id: string) {
  return useQuery({
    queryKey: ['data'], // Not unique, missing id
    queryFn: () => get(`/api/data/${id}`),
  });
}
```

**After:**
```typescript
export function useAmodiatairesCoordinates(id: string) {
  return useQuery({
    queryKey: ['data', 'detail', id], // Unique and includes id
    queryFn: () => get(`/api/data/${id}`),
  });
}
```

### 39. 🟡 Fix query key in hook: useMapData

**Category:** HOOK
**Priority:** MEDIUM

Hook useMapData has invalid query key. Query key should include parameters for cache differentiation

**Affected Files:**
- `src/hooks/useApi.ts`

**Before:**
```typescript
export function useMapData(id: string) {
  return useQuery({
    queryKey: ['data'], // Not unique, missing id
    queryFn: () => get(`/api/data/${id}`),
  });
}
```

**After:**
```typescript
export function useMapData(id: string) {
  return useQuery({
    queryKey: ['data', 'detail', id], // Unique and includes id
    queryFn: () => get(`/api/data/${id}`),
  });
}
```

### 40. 🟡 Fix query key in hook: useZoneBounds

**Category:** HOOK
**Priority:** MEDIUM

Hook useZoneBounds has invalid query key. Query key should include parameters for cache differentiation

**Affected Files:**
- `src/hooks/useApi.ts`

**Before:**
```typescript
export function useZoneBounds(id: string) {
  return useQuery({
    queryKey: ['data'], // Not unique, missing id
    queryFn: () => get(`/api/data/${id}`),
  });
}
```

**After:**
```typescript
export function useZoneBounds(id: string) {
  return useQuery({
    queryKey: ['data', 'detail', id], // Unique and includes id
    queryFn: () => get(`/api/data/${id}`),
  });
}
```
