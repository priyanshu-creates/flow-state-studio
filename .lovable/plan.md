
# Fix: "Task 'undefined' not found" Error

## Problem
The AI assistant sometimes outputs action blocks with slightly different key names (e.g., `"title"` instead of `"task_title"`), causing `action.task_title` to be `undefined`. The code then shows an unhelpful toast: `Task "undefined" not found`.

## Solution

### 1. Make `parseActions` more resilient (ChatPanel.tsx)
- Normalize parsed action objects to accept common key variations: `task_title`, `title`, `name`, `task_name`
- Skip any action where the resolved task title is still missing (no toast with "undefined")

### 2. Strengthen the system prompt (chat/index.ts)
- Add emphasis that the key MUST be `"task_title"` and must match an existing task title exactly
- Add a negative example showing what NOT to do

## Technical Details

**File: `src/components/chat/ChatPanel.tsx`**
- Update `parseActions` or `executeActions` to resolve `task_title` from multiple possible keys: `action.task_title || action.title || action.name || action.task_name`
- Add an early `continue` if the resolved title is falsy, preventing the "undefined" toast

**File: `supabase/functions/chat/index.ts`**  
- Add stronger instructions in the system prompt: "You MUST use the key `task_title` (not `title` or `name`)"
- Add a note: "IMPORTANT: The `task_title` must exactly match one of the task titles listed above"
