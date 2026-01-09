# Display Name Requirement Enforcement

## Overview
ALL write actions require a display name. Profile photo is optional.

## Enforcement Layer: `authHelpers.js`

### Central Enforcement Point
**Function**: `authorizeWriteAction()`
- Called by ALL write endpoints
- Checks authentication → workspace → role → **display name**
- Returns `NAME_REQUIRED` error (403) if name is missing
- Blocks write action at API level

### Name Validation
```javascript
function requireDisplayName(user) {
  if (!user.full_name || user.full_name.trim() === '') {
    return { success: false, error: NAME_REQUIRED }
  }
  return { success: true }
}
```

## Protected Write Actions

### 1. Feedback Operations
**Endpoints**:
- `createFeedback` - Create new feedback
- `createFeedbackResponse` - Add comments/replies
- `updateFeedback` - Edit feedback (staff)

**Enforcement**: ✅ Via `authorizeWriteAction()`

### 2. Support Operations
**Endpoints**:
- `createSupportThread` - Create support ticket
- `createSupportMessage` - Reply to threads

**Enforcement**: ✅ Via `authorizeWriteAction()`

### 3. Roadmap Operations
**Endpoints**:
- `createRoadmapItem` - Create roadmap item (staff)
- `updateRoadmapItem` - Update roadmap item (staff)

**Enforcement**: ✅ Via `authorizeWriteAction()`

### 4. Documentation Operations
**Endpoints**:
- `createDocComment` - Add doc comments/questions

**Enforcement**: ✅ Via `authorizeWriteAction()`

### 5. Votes/Reactions (Future)
**Status**: Not yet implemented
**Plan**: Will use same `authorizeWriteAction()` flow

### 6. File Uploads
**Via**: Core.UploadFile integration
**Enforcement**: Implicit - all upload contexts require auth and name

## Client-Side Guard: `useProfileGuard`

### Purpose
Provides smooth UX for name requirement before attempting write action.

### Flow
1. User attempts write action
2. `guardAction()` checks `user.full_name`
3. If missing → show `ProfileCompletionModal`
4. User enters name (+ optional photo)
5. Modal calls `base44.auth.updateMe()`
6. On success → retry original action

### Retry Safety
```javascript
const guardAction = async (action) => {
  return new Promise((resolve, reject) => {
    if (!user?.full_name) {
      // Block and show modal
      setPendingAction({ action, resolve, reject });
      setShowModal(true);
    } else {
      // Execute immediately
      return action();
    }
  });
};
```

**Safety Guarantees**:
- Action stored in closure
- Single execution after name set
- Promise-based - no race conditions
- Backend validates again (defense in depth)

## Error Response Contract

### NAME_REQUIRED Response
```json
{
  "error": "Name required",
  "code": "NAME_REQUIRED",
  "message": "Please set your display name before performing this action"
}
```

**Status Code**: 403 Forbidden
**Handling**: Client catches and shows profile modal

## Profile Photo: OPTIONAL

**Modal UI**: Shows photo upload but marked "Optional"
**Backend**: Accepts `profile_photo_url` if provided, ignores if missing
**Retry**: Works even if photo fails to upload (name is sufficient)

## NOT Protected

### Read-Only Operations
- Viewing feedback/roadmap/docs
- Searching/filtering
- Public board views
- Analytics tracking (`publicTrackBoardView`)

**Reason**: No name needed for anonymous/guest browsing

## Testing Checklist

✅ Feedback creation blocked without name  
✅ Comments/replies blocked without name  
✅ Support messages blocked without name  
✅ Profile modal shown on write attempt  
✅ Action retries after name set  
✅ No duplicate writes on retry  
✅ Photo is optional (can skip)  
✅ Backend validates even if client bypasses guard  
✅ Public views work without name