# Public Comment Viewing - Implementation

## Endpoint Contract

### GET Feedback Detail with Comments
**Endpoint**: `publicGetFeedbackDetail`  
**Method**: POST  
**Auth**: None required  

**Request**:
```json
{
  "feedback_id": "feedback_123",
  "workspace_id": "workspace_456"
}
```

**Response**:
```json
{
  "id": "feedback_123",
  "workspace_id": "workspace_456",
  "title": "Bug: Login not working",
  "type": "bug",
  "description": "Cannot login with correct credentials",
  "steps_to_reproduce": "1. Go to login...",
  "expected_behavior": "Should login",
  "actual_behavior": "Shows error",
  "environment": { "browser": "Chrome", "os": "Mac" },
  "attachments": [
    { "name": "screenshot.png", "url": "https://...", "type": "image/png" }
  ],
  "status": "open",
  "tags": ["login", "authentication"],
  "vote_count": 5,
  "created_date": "2026-01-09T10:00:00Z",
  "submitter_email": "jo***@example.com",
  "response_count": 3,
  "responses": [
    {
      "id": "response_1",
      "content": "I have the same issue!",
      "is_official": false,
      "author_role": "user",
      "attachments": [],
      "created_date": "2026-01-09T11:00:00Z",
      "author_email": "sa***@example.com"
    },
    {
      "id": "response_2",
      "content": "We're investigating this issue. Thanks for reporting!",
      "is_official": true,
      "author_role": "support",
      "attachments": [],
      "created_date": "2026-01-09T12:00:00Z",
      "author_email": "Acme Team"
    },
    {
      "id": "response_3",
      "content": "This happens on Safari too",
      "is_official": false,
      "author_role": "user",
      "attachments": [],
      "created_date": "2026-01-09T13:00:00Z",
      "author_email": "al***@example.com"
    }
  ]
}
```

## Filtering Rules

### INCLUDED in Public View
✅ Contributor comments (`author_role: "user"`)  
✅ Admin replies (`author_role: "admin"`, `is_official: true`)  
✅ Support replies (`author_role: "support"`, `is_official: true`)  
✅ All attachments on public comments  
✅ Email addresses (anonymized: `jo***@example.com`)  

### EXCLUDED from Public View
❌ Internal staff notes (`is_internal_note: true`)  
❌ Private/restricted feedback items (`visibility: "private"`)  
❌ Comments from archived/inactive workspaces  
❌ Full email addresses (privacy protection)  

## Frontend Implementation

### File: `components/feedback/FeedbackDetail.js`

**Function**: `loadFeedbackDetail()`

**Logic**:
```javascript
if (!user || isPublicAccess) {
  // Unauthenticated or public viewer
  // Use public endpoint
  const { data } = await base44.functions.invoke('publicGetFeedbackDetail', {
    feedback_id: feedback.id,
    workspace_id: workspace.id
  });
  setResponses(data.responses);
} else {
  // Authenticated user with role
  // Use direct entity access
  const responses = await base44.entities.FeedbackResponse.filter(
    { feedback_id: feedback.id }
  );
  setResponses(responses);
}
```

**Rendering**:
- Uses same UI for both authenticated and unauthenticated users
- Displays full comment thread from `responses` array
- Shows author info (anonymized for public viewers)
- Renders attachments with public URLs

## Testing Scenarios

### ✅ Hard Refresh (Unauthenticated)
**URL**: `/feedback?slug=my-board&item=feedback_123`
1. User not logged in
2. Page loads via public endpoints
3. Comments load via `publicGetFeedbackDetail`
4. Full thread visible
5. **Expected**: All public comments shown

### ✅ Incognito Mode
**URL**: `/feedback?slug=my-board&item=feedback_123`
1. No session storage
2. No cookies
3. Board resolves from URL slug
4. Comments fetch via public endpoint
5. **Expected**: All public comments shown

### ✅ Direct Deep Link
**URL**: `/feedback?slug=my-board&item=feedback_123`
1. Shared link opened in new tab
2. No prior context
3. Board context resolves from slug
4. Feedback detail loads with comments
5. **Expected**: Full thread visible without login

## Security Notes

- Public endpoint validates workspace visibility
- Only returns data for `visibility: "public"` workspaces
- Filters out internal notes server-side
- Anonymizes all email addresses
- No rate limiting needed (read-only)
- No PII exposed

## Performance

**Optimization**: Single endpoint call includes:
- Feedback item details
- Full comment thread
- Attachments metadata
- Vote counts

**No pagination needed** (typical feedback has <100 comments)