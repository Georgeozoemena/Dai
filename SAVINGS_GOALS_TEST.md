# 💰 Savings Goals V1 - Complete Flow Test

## Test Checklist

Use this checklist to verify the complete Savings Goals functionality.

---

## ✅ Test 1: Dashboard → Savings Goals Navigation

**Steps:**
1. Open the Dashboard
2. Scroll to find the "Savings Goals" card (after Budget Health, before Recent Transactions)
3. Tap the "Savings Goals" card

**Expected Result:**
- ✅ Navigates to `/savings-goals`
- ✅ Shows "Savings Goals" screen title
- ✅ Shows "+ Add Savings Goal" button
- ✅ Shows empty state if no goals exist

**Status:** [ ] PASS / [ ] FAIL

---

## ✅ Test 2: Create a New Goal

**Steps:**
1. From the Savings Goals screen, tap "+ Add Savings Goal"
2. Enter the following:
   - **Name:** New Laptop
   - **Target Amount:** 500000
3. Tap "Create Goal"

**Expected Result:**
- ✅ Shows success alert: "Goal Created 🎉"
- ✅ Alert message: "New Laptop has been created successfully"
- ✅ Alert button: "View Goals"
- ✅ Tap "View Goals" → Returns to Savings Goals list
- ✅ **NEW GOAL APPEARS IN THE LIST** (this is the key test!)
- ✅ Goal shows: "New Laptop"
- ✅ Goal shows: "₦0 of ₦500,000"
- ✅ Goal shows: "0% complete"

**Status:** [ ] PASS / [ ] FAIL

---

## ✅ Test 3: Open Goal Details

**Steps:**
1. From the Savings Goals list, tap on the "New Laptop" goal card
2. Observe the goal detail screen

**Expected Result:**
- ✅ Navigates to `/goal/[id]` route
- ✅ Shows "Savings Goal" screen title
- ✅ Shows goal name: "New Laptop"
- ✅ Shows "0% Complete"
- ✅ Shows "₦0 saved"
- ✅ Shows "Target: ₦500,000"
- ✅ Shows empty progress bar
- ✅ Shows "Update Savings" section with input field
- ✅ Shows "Update Progress" button
- ✅ Shows "Delete Goal" button (red border)

**Status:** [ ] PASS / [ ] FAIL

---

## ✅ Test 4: Update Savings Progress

**Steps:**
1. In the "Update Savings" input field, enter: `100000`
2. Tap "Update Progress"

**Expected Result:**
- ✅ Shows success alert: "Savings updated"
- ✅ Alert message: "Your goal progress has been updated"
- ✅ Progress updates on screen immediately
- ✅ Shows "20% Complete"
- ✅ Shows "₦100,000 saved"
- ✅ Progress bar fills to 20%
- ✅ Input field shows updated value: "100000"

**Status:** [ ] PASS / [ ] FAIL

---

## ✅ Test 5: Auto-Refresh on Navigation Back

**Steps:**
1. After updating the goal to ₦100,000, go back to the Savings Goals list
2. Observe the goal card

**Expected Result:**
- ✅ List reloads automatically (useFocusEffect triggers)
- ✅ **"New Laptop" shows updated amount: "₦100,000 of ₦500,000"**
- ✅ Shows "20% complete"
- ✅ Progress bar shows 20% filled
- ✅ NO manual refresh needed

**Status:** [ ] PASS / [ ] FAIL

**⚠️ CRITICAL:** This is the key test for `useFocusEffect`. The list MUST show the updated amount immediately without any manual refresh.

---

## 🧪 Additional Tests

### Test 6: Update Progress to 50%

**Steps:**
1. Open "New Laptop" goal
2. Change amount to: `250000`
3. Tap "Update Progress"
4. Go back to list

**Expected Result:**
- ✅ Shows "50% Complete" in details
- ✅ List shows "₦250,000 of ₦500,000"
- ✅ Progress bar shows 50%

**Status:** [ ] PASS / [ ] FAIL

---

### Test 7: Complete a Goal (100%)

**Steps:**
1. Open "New Laptop" goal
2. Change amount to: `500000`
3. Tap "Update Progress"

**Expected Result:**
- ✅ Shows "🎉 Goal Completed!"
- ✅ Progress bar fills to 100%
- ✅ Shows "₦500,000 saved"

**Status:** [ ] PASS / [ ] FAIL

---

### Test 8: Invalid Input Validation

**Steps:**
1. Open any goal
2. Enter invalid amount: `-1000` (negative)
3. Tap "Update Progress"

**Expected Result:**
- ✅ Shows alert: "Invalid amount"
- ✅ Does NOT update the goal
- ✅ Amount stays the same

**Status:** [ ] PASS / [ ] FAIL

---

### Test 9: Delete a Goal

**Steps:**
1. Open any goal
2. Scroll down and tap "Delete Goal"
3. Tap "Delete" in confirmation alert
4. Tap "OK" in success alert

**Expected Result:**
- ✅ Shows confirmation: "Delete Savings Goal?"
- ✅ Shows warning: "This goal and its progress will be permanently deleted"
- ✅ After deletion, shows: "Goal Deleted"
- ✅ Navigates to `/savings-goals`
- ✅ Goal no longer appears in list
- ✅ List refreshes automatically

**Status:** [ ] PASS / [ ] FAIL

---

### Test 10: Create Multiple Goals

**Steps:**
1. Create goal: "Emergency Fund" - ₦1,000,000
2. Create goal: "Vacation" - ₦300,000
3. Create goal: "Car" - ₦2,000,000
4. View the goals list

**Expected Result:**
- ✅ All three goals appear in list
- ✅ Each shows correct name and target
- ✅ Each shows 0% initially
- ✅ Can navigate to each goal independently

**Status:** [ ] PASS / [ ] FAIL

---

### Test 11: Switch Accounts

**Steps:**
1. Create a goal in Account A
2. Switch to Account B (from Dashboard)
3. View Savings Goals

**Expected Result:**
- ✅ Account B shows empty goals list
- ✅ Goals are account-specific
- ✅ Switch back to Account A → goal still exists

**Status:** [ ] PASS / [ ] FAIL

---

## 🔍 Key Things to Verify

### Critical Functionality:
- [ ] **useFocusEffect works:** List auto-refreshes when returning from create/detail screens
- [ ] **Progress calculation is accurate:** Percentages match actual saved/target ratio
- [ ] **Database persistence:** Goals survive app reload
- [ ] **Account isolation:** Goals are tied to specific accounts

### Navigation Flow:
- [ ] Dashboard → Savings Goals
- [ ] Savings Goals → Create Goal → Back to List (with new goal visible)
- [ ] Savings Goals → Goal Detail → Back to List (with updates visible)
- [ ] Goal Detail → Delete → Back to List (goal removed)

### UI/UX:
- [ ] Loading states show appropriately
- [ ] Error handling works (try invalid inputs)
- [ ] Success confirmations appear
- [ ] Buttons disable during operations
- [ ] Progress bars render correctly

---

## 📊 Test Results Summary

**Total Tests:** 11
**Passed:** ___ / 11
**Failed:** ___ / 11

---

## ⚠️ Most Important Test

**Test 2 + Test 5 together:**

```text
Create Goal "New Laptop" ₦500,000
   ↓ (Success alert → Tap "View Goals")
Back to list
   ↓
✅ "New Laptop" MUST appear immediately

Update goal to ₦100,000
   ↓ (Success alert → Go back)
Back to list
   ↓
✅ "₦100,000 of ₦500,000" MUST show immediately
```

If these two work, then `useFocusEffect` is working correctly! 🎉

---

## 🚀 When All Tests Pass

Savings Goals V1 is **COMPLETE** and ready for production! ✅

Next step: **⚙️ Settings Module**

---

## 🐛 If Any Test Fails

Document the failure here:

**Test #:** ___
**What happened:** ___
**Expected:** ___
**Error message (if any):** ___

Then we'll fix it! 🔧
