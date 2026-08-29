# 💰 Savings Goals - Visual Test Guide

## What You Should See at Each Step

---

## 1️⃣ Dashboard

```text
┌─────────────────────────────┐
│ Welcome back                │
│ Main Account                │
├─────────────────────────────┤
│ 🟢 Monthly Budget           │
│ ₦20,000 spent               │
│ View Budget →               │
├─────────────────────────────┤
│ 🎯 Savings Goals       →    │ 👈 TAP THIS
│ Track your progress         │
├─────────────────────────────┤
│ Recent Transactions         │
└─────────────────────────────┘
```

**Action:** Tap the "Savings Goals" card

---

## 2️⃣ Savings Goals List (Empty)

```text
┌─────────────────────────────┐
│ ← Savings Goals             │
├─────────────────────────────┤
│                             │
│ No savings goals yet        │
│                             │
│ Create your first savings   │
│ goal to start tracking      │
│ your progress!              │
│                             │
│ ┌─────────────────────────┐ │
│ │  + Add Savings Goal     │ │ 👈 TAP THIS
│ └─────────────────────────┘ │
│                             │
└─────────────────────────────┘
```

**Action:** Tap "+ Add Savings Goal"

---

## 3️⃣ Create Savings Goal Screen

```text
┌─────────────────────────────┐
│ ← Create Savings Goal       │
├─────────────────────────────┤
│ Create a Savings Goal       │
│                             │
│ Name                        │
│ ┌─────────────────────────┐ │
│ │ New Laptop              │ │ 👈 ENTER THIS
│ └─────────────────────────┘ │
│                             │
│ Target Amount               │
│ ┌─────────────────────────┐ │
│ │ 500000                  │ │ 👈 ENTER THIS
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │     Create Goal         │ │ 👈 TAP THIS
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**Action:** 
1. Enter "New Laptop" in Name field
2. Enter "500000" in Target Amount field
3. Tap "Create Goal"

---

## 4️⃣ Success Alert

```text
┌─────────────────────────────┐
│                             │
│   Goal Created 🎉           │
│                             │
│   "New Laptop" has been     │
│   created successfully.     │
│                             │
│   ┌───────────────────────┐ │
│   │    View Goals         │ │ 👈 TAP THIS
│   └───────────────────────┘ │
│                             │
└─────────────────────────────┘
```

**Action:** Tap "View Goals"

---

## 5️⃣ Savings Goals List (With New Goal) ✅

```text
┌─────────────────────────────┐
│ ← Savings Goals             │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ New Laptop          →   │ │ 👈 NEW GOAL APPEARS!
│ │                         │ │
│ │ ₦0 of ₦500,000          │ │
│ │                         │ │
│ │ ━━━━━━━━━━━━━━━━━━━━   │ │
│ │                         │ │
│ │ 0% complete             │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │  + Add Savings Goal     │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**⚠️ CRITICAL CHECK:** The "New Laptop" goal MUST appear here immediately!

**Action:** Tap on the "New Laptop" card

---

## 6️⃣ Goal Detail Screen

```text
┌─────────────────────────────┐
│ ← Savings Goal              │
├─────────────────────────────┤
│ New Laptop                  │
│ Track your progress...      │
│                             │
│ ┌─────────────────────────┐ │
│ │ 0% Complete             │ │
│ │ ₦0 saved                │ │
│ │ Target: ₦500,000        │ │
│ │ ━━━━━━━━━━━━━━━━━━━━   │ │
│ └─────────────────────────┘ │
│                             │
│ Update Savings              │
│ Enter the total amount...   │
│                             │
│ ┌─────────────────────────┐ │
│ │ 0                       │ │ 👈 CHANGE TO 100000
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │   Update Progress       │ │ 👈 TAP THIS
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │   Delete Goal (red)     │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**Action:**
1. Change input field to "100000"
2. Tap "Update Progress"

---

## 7️⃣ Update Success Alert

```text
┌─────────────────────────────┐
│                             │
│   Savings updated           │
│                             │
│   Your goal progress has    │
│   been updated.             │
│                             │
│   ┌───────────────────────┐ │
│   │         OK            │ │ 👈 TAP THIS
│   └───────────────────────┘ │
│                             │
└─────────────────────────────┘
```

**Action:** Tap "OK"

---

## 8️⃣ Goal Detail Screen (Updated) ✅

```text
┌─────────────────────────────┐
│ ← Savings Goal              │
├─────────────────────────────┤
│ New Laptop                  │
│ Track your progress...      │
│                             │
│ ┌─────────────────────────┐ │
│ │ 20% Complete        ✅  │ │ 👈 UPDATED!
│ │ ₦100,000 saved      ✅  │ │ 👈 UPDATED!
│ │ Target: ₦500,000        │ │
│ │ ████░░░░░░░░░░░░░░░░    │ │ 👈 BAR FILLED 20%
│ └─────────────────────────┘ │
│                             │
│ Update Savings              │
│ ┌─────────────────────────┐ │
│ │ 100000              ✅  │ │ 👈 SHOWS NEW VALUE
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │   Update Progress       │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**Action:** Go back (tap ← or swipe back)

---

## 9️⃣ Savings Goals List (Auto-Refreshed) ✅✅

```text
┌─────────────────────────────┐
│ ← Savings Goals             │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ New Laptop          →   │ │
│ │                         │ │
│ │ ₦100,000 of ₦500,000✅  │ │ 👈 UPDATED!
│ │                         │ │
│ │ ████░░░░░░░░░░░░░░░░    │ │ 👈 20% BAR!
│ │                         │ │
│ │ 20% complete        ✅  │ │ 👈 UPDATED!
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │  + Add Savings Goal     │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**⚠️ CRITICAL CHECK:** The list MUST show ₦100,000 and 20% WITHOUT any manual refresh!

This proves `useFocusEffect` is working! 🎉

---

## 🔟 Complete a Goal (100%)

Go back into the goal and set amount to `500000`:

```text
┌─────────────────────────────┐
│ ← Savings Goal              │
├─────────────────────────────┤
│ New Laptop                  │
│                             │
│ ┌─────────────────────────┐ │
│ │ 🎉 Goal Completed!  ✅  │ │ 👈 CELEBRATION!
│ │ ₦500,000 saved          │ │
│ │ Target: ₦500,000        │ │
│ │ ████████████████████    │ │ 👈 FULL BAR!
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

---

## 1️⃣1️⃣ Delete a Goal

Tap "Delete Goal" → Confirm:

```text
┌─────────────────────────────┐
│                             │
│   Delete Savings Goal?      │
│                             │
│   This goal and its         │
│   progress will be          │
│   permanently deleted.      │
│                             │
│   ┌──────────┐  ┌─────────┐│
│   │ Cancel   │  │ Delete  ││ 👈 TAP DELETE
│   └──────────┘  └─────────┘│
│                             │
└─────────────────────────────┘
```

Then after deletion:

```text
┌─────────────────────────────┐
│                             │
│   Goal Deleted              │
│                             │
│   Your savings goal has     │
│   been deleted.             │
│                             │
│   ┌───────────────────────┐ │
│   │         OK            │ │ 👈 TAP THIS
│   └───────────────────────┘ │
│                             │
└─────────────────────────────┘
```

Returns to list → Goal is gone ✅

---

## ✅ Success Criteria Summary

If you see ALL of these, the feature is working perfectly:

1. ✅ Dashboard has clickable "Savings Goals" card
2. ✅ Can create a new goal → success alert appears
3. ✅ **NEW GOAL APPEARS IN LIST IMMEDIATELY** (useFocusEffect works)
4. ✅ Can open goal details → shows correct info
5. ✅ Can update savings → progress updates on screen
6. ✅ **UPDATED AMOUNT SHOWS IN LIST IMMEDIATELY** (useFocusEffect works)
7. ✅ Progress bar renders correctly at each percentage
8. ✅ 100% completion shows celebration message
9. ✅ Can delete goal → returns to list → goal removed
10. ✅ All navigation flows work smoothly

---

## 🚀 When All Visual Tests Pass

**Savings Goals V1 is COMPLETE!** 🎉

Next: **⚙️ Settings Module**

Then: **Full Dai V1 Feature Audit**
