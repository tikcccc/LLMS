# Debug: Work Lot Task Alert Colors

## Issue
Work Lots are showing as gray (taskAlert=undefined) instead of colored based on their task status.

## Expected Behavior
- 🔴 **Red (overdue)**: Work Lot has at least one overdue task
- 🟡 **Yellow (inProgress)**: Work Lot has open tasks (not overdue)
- 🟢 **Green (completed)**: All tasks for Work Lot are completed
- ⚪ **Gray (no-tasks)**: Work Lot has no tasks

## Expected Results by Work Lot
Based on mock data (today = 2026-02-03):

| Work Lot ID | Name | Expected Color | Reason |
|-------------|------|----------------|--------|
| WL-2025-001 | Sunrise Logistics | 🔴 Red | Has overdue task (2026-01-15) |
| WL-2025-002 | Harbor Kitchen | 🟢 Green | All tasks Done |
| WL-2025-003 | Metro Retail | 🟡 Yellow | Has open task (2026-02-25) |
| WL-2025-004 | Hilltop Residents | 🔴 Red | Has overdue tasks (2026-01-10, 2026-01-20) |
| WL-2025-005 | Garden Community | 🟡 Yellow | Has open task (2026-02-20) |
| WL-2025-006 | Ocean View Plaza | 🔴 Red | Has overdue task (2026-01-25) |
| WL-2025-007 | Peak Residence | ⚪ Gray | No tasks |
| WL-2025-008 | Valley Market | 🟢 Green | All tasks Done |
| WL-2025-009 | Riverside Apartments | 🟡 Yellow | Has open tasks (2026-02-28, 2026-03-05) |
| WL-2025-010 | Central Tower | 🔴 Red | Has overdue tasks (2026-01-28, 2026-01-30) |

## Debug Steps Added

### 1. Store Initialization Logging
Added console logs in `onMounted()` to verify:
- Stores are seeded in correct order
- Task store has 17 tasks
- Work Lot store has 10 work lots

### 2. Feature Creation Logging
Added console log in `createWorkFeature()` to show:
- Work Lot name
- Calculated taskAlert value
- Number of tasks for that Work Lot

### 3. Feature Property Setting
Modified `createWorkFeature()` to:
- Calculate taskAlert using `getWorkLotTaskAlert()`
- Set taskAlert AFTER feature creation using `feature.set()`
- Ensure operatorName is also set explicitly

## How to Debug

1. **Refresh your browser** (Ctrl+Shift+R or Cmd+Shift+R) to clear cache
2. **Open browser console** (F12)
3. **Look for these logs**:
   ```
   [MapPage] onMounted - seeding stores
   [MapPage] landLots seeded: X
   [MapPage] workLots seeded: 10
   [MapPage] tasks seeded: 17
   [MapPage] relations seeded
   [createWorkFeature] Sunrise Logistics: taskAlert=overdue, tasks.length=2
   [createWorkFeature] Harbor Kitchen: taskAlert=completed, tasks.length=2
   ... (8 more work lots)
   [MapPage] map initialized
   ```

4. **Check if taskAlert is correct**:
   - If `tasks.length=0` for all Work Lots → Tasks not loaded yet
   - If `taskAlert=null` but `tasks.length>0` → Logic issue in `getWorkLotTaskAlert()`
   - If `taskAlert=undefined` → Feature property not being set correctly

## Possible Issues

### Issue 1: Timing Problem
If tasks show `tasks.length=0`, it means tasks aren't loaded when features are created.
- **Solution**: The watch on `taskStore.tasks` should trigger `refreshWorkSource()` when tasks load

### Issue 2: localStorage Cache
If you have old data in localStorage without tasks:
- **Solution**: Click "Reset Demo" button to clear and reseed data

### Issue 3: Feature Property Not Preserved
If taskAlert is calculated correctly but not showing in style function:
- **Solution**: Already fixed by setting taskAlert AFTER feature creation with `feature.set()`

## Verification Script

Run `VERIFY_TASK_ALERTS.js` in browser console to test the logic independently:
```javascript
// Copy and paste the content of VERIFY_TASK_ALERTS.js into console
```

This will show you what taskAlert value each Work Lot SHOULD have based on today's date.

## Next Steps

After refreshing browser:
1. Check console logs to see what's happening
2. Verify taskAlert values match expected results
3. If still showing undefined, check if watch on taskStore.tasks is triggering
4. If watch isn't triggering, may need to force refresh after tasks load
