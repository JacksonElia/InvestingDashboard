# Testing Guide for Critical Fixes

This guide provides step-by-step test cases to verify all three critical fixes are working correctly.

## Prerequisites
- npm packages installed: `npm install`
- Build successful: `npm run build` (should have zero TypeScript errors)
- Development server running: `npm run dev`
- Open browser to `http://localhost:5173`

---

## Test Case 1: Delete Button Only Deletes One Stock ✅

### Test Steps
1. Click "Add Investment" button
2. Add three stocks:
   - **Stock 1**: AAPL, Apple Inc., 10 shares, $150 avg price
   - **Stock 2**: MSFT, Microsoft Corp., 20 shares, $300 avg price
   - **Stock 3**: GOOGL, Alphabet Inc., 5 shares, $140 avg price
3. Verify all three appear in the table
4. Click delete button (trash icon) on **MSFT** (the middle stock)
5. Confirmation modal should appear asking about "MSFT (Microsoft Corp.)"
6. Click "Delete" to confirm

### Expected Result
✅ **Only MSFT is deleted**
✅ AAPL and GOOGL remain in the portfolio
✅ Table shows 2 remaining stocks
✅ Portfolio page still displays correctly

### Failure Indicators
❌ All stocks deleted instead of just one
❌ Wrong stock deleted (e.g., AAPL deleted instead of MSFT)
❌ Multiple confirmation modals appear
❌ Modal doesn't show which stock is being deleted

---

## Test Case 2: Invalid Ticker Shows Error Without Breaking Form ✅

### Test Steps
1. Click "Add Investment" button
2. Enter invalid ticker: "XXXXXX"
3. Enter: Tesla Inc., 5 shares, $250 avg price
4. Leave "Current Price" empty (optional)
5. Watch for auto-fetch attempt on ticker blur or press Enter on ticker field
6. Click "Add Investment" button

### Expected Result
✅ Error message shown (e.g., "Unable to fetch price for XXXXXX")
✅ Form still submits successfully
✅ Stock is added to portfolio with avgPrice as current price
✅ No page crash or form lock-up
✅ Portfolio page loads normally
✅ Error message is dismissible

### Failure Indicators
❌ Form won't submit due to price error
❌ Page becomes unresponsive
❌ Red error message blocks form submission
❌ "Current Price" required validation error
❌ Page crashes

---

## Test Case 3: Valid Ticker Shows Fetched Price ✅

### Test Steps
1. Click "Add Investment" button
2. Enter valid ticker: "AAPL"
3. Enter: Apple Inc., 10 shares, $150 avg price
4. Leave "Current Price" empty initially
5. Press Enter or Tab away from ticker field (should auto-fetch)
   OR click "Get Price" button if visible
6. Wait for price to appear

### Expected Result
✅ "Current Price" field auto-populates with current market price
✅ Price is fetched from Yahoo Finance (will be > $0)
✅ Form submits successfully with fetched price
✅ Stock appears in Portfolio table with correct current price

### Failure Indicators
❌ No price appears
❌ Price shows as 0 or NaN
❌ Form shows validation error for price
❌ Timeout when trying to fetch
❌ Form doesn't submit

---

## Test Case 4: Multiple Stocks Load with Auto-Fetching ✅

### Test Steps
1. Reload the page (browser refresh)
2. If portfolio has stocks, observe the table
3. Watch for loading spinners next to prices
4. Wait for prices to load

### Expected Result
✅ Table displays immediately with all stocks
✅ **Current Price** column shows loading spinners (animated)
✅ Prices update in real-time as they are fetched
✅ No page blocking or freezing
✅ All stocks display within 5 seconds (network permitting)
✅ If one fails, others still load

### Failure Indicators
❌ Page shows loading spinner before table appears
❌ No loading indicators next to prices
❌ Page freezes waiting for prices
❌ One failed price blocks others from loading
❌ Prices never appear
❌ Cannot interact with page while prices load

---

## Test Case 5: Add Stock Without Current Price ✅

### Test Steps
1. Click "Add Investment"
2. Enter: GOOGL, Alphabet Inc., 5 shares, $2800 avg price
3. **Leave "Current Price" empty**
4. Set Daily Change to 1.5%
5. Click "Add Investment"

### Expected Result
✅ Form accepts submission
✅ Stock is added to portfolio
✅ Current Price shows loading spinner initially
✅ Portfolio fetches actual price when page loads/refreshes
✅ Current Price updates with fetched market price
✅ No error message about required field
✅ Portfolio table shows the stock correctly

### Failure Indicators
❌ Validation error "Current Price is required"
❌ Form won't submit
❌ Stock never appears in table
❌ Current Price stays blank
❌ Page error message

---

## Test Case 6: Prices Auto-Fetch on Page Reload ✅

### Test Steps
1. Ensure portfolio has at least 2 stocks (AAPL, MSFT, GOOGL)
2. Reload the browser (F5 or refresh button)
3. Observe Portfolio page loading

### Expected Result
✅ Portfolio loads quickly
✅ Table displays with all stocks immediately
✅ Loading spinners appear next to prices
✅ Current market prices appear as they're fetched
✅ Page is interactive while prices load
✅ Prices stabilize within 5 seconds

### Failure Indicators
❌ Page shows loading state and blocks interaction
❌ Prices take more than 10 seconds
❌ One failed price blocks loading
❌ Page freezes or becomes unresponsive
❌ Prices never appear

---

## Test Case 7: Mixed Valid and Invalid Tickers ✅

### Test Steps
1. Portfolio has: AAPL (valid), XXXXXX (invalid)
2. Reload the page
3. Observe the Portfolio page

### Expected Result
✅ AAPL price fetches successfully and displays
✅ XXXXXX shows loading spinner briefly, then displays avgPrice
✅ Yellow warning banner appears (optional) about fetch error
✅ No page error or crash
✅ Can still delete/edit either stock
✅ Portfolio remains fully functional

### Failure Indicators
❌ Entire page shows error
❌ Page becomes unresponsive
❌ Valid price fetch is blocked by invalid one
❌ Can't interact with portfolio

---

## Test Case 8: Delete After Price Fetch Completes ✅

### Test Steps
1. Add 2 stocks: AAPL, MSFT
2. Wait for prices to load completely
3. Click delete on AAPL
4. Confirm deletion

### Expected Result
✅ Confirmation modal shows correctly
✅ Delete completes successfully
✅ AAPL is removed from portfolio
✅ MSFT remains with its fetched price intact
✅ Page updates immediately

### Failure Indicators
❌ Modal shows wrong stock name
❌ Delete operation fails
❌ Wrong stock deleted
❌ MSFT price becomes incorrect

---

## Test Case 9: Edit Stock After Fetch ✅

### Test Steps
1. Add stock: AAPL
2. Wait for price to fetch
3. Click edit button (pencil icon)
4. Change shares to 20
5. Click save

### Expected Result
✅ Edit modal opens with current data
✅ Changes saved successfully
✅ Portfolio updates immediately
✅ Current price remains correct

### Failure Indicators
❌ Edit modal doesn't open
❌ Data shows incorrectly
❌ Save fails
❌ Price becomes incorrect

---

## Test Case 10: Search After Prices Load ✅

### Test Steps
1. Portfolio has: AAPL, MSFT, GOOGL all with fetched prices
2. Type "Microsoft" in search field
3. Observe filtered results

### Expected Result
✅ Search filters correctly to MSFT
✅ Price still displays correctly
✅ Loading spinners not shown (already loaded)
✅ Can delete/edit filtered results

### Failure Indicators
❌ Search doesn't filter
❌ Filtered item shows wrong price
❌ Price loading breaks search display
❌ Can't interact with filtered results

---

## Performance Benchmarks

| Metric | Target | Expected |
|--------|--------|----------|
| Portfolio page load | < 2s | ✅ Instant |
| Price fetch (1-5 tickers) | < 5s | ✅ 2-4s |
| Delete operation | < 1s | ✅ Instant |
| Form submission | < 1s | ✅ Instant |
| Page responsiveness while fetching | Always | ✅ Smooth |

---

## Network Error Simulation (Advanced)

### Simulate Network Error
1. Open browser DevTools (F12)
2. Go to Network tab
3. Right-click and select "Throttle" → "Offline"
4. Add a stock without current price
5. Switch back to "Online"

### Expected Result
✅ Stock adds successfully (uses avgPrice)
✅ Portfolio page loads
✅ Price fetch fails gracefully
✅ Warning message shown (optional)
✅ Page remains usable

---

## Rollback Instructions (If Issues Found)

If any test case fails:

```bash
# Revert to previous commit
git revert HEAD

# Or reset to specific commit
git reset --hard <previous-commit-sha>

# Clean rebuild
npm install
npm run build
```

---

## Documentation
- [Critical Fixes Applied](./CRITICAL_FIXES_APPLIED.md) - Technical details
- [Build Status](#build-status) - Compilation verification
- TypeScript Errors: **0** ✅
- Build Status: **Success** ✅
