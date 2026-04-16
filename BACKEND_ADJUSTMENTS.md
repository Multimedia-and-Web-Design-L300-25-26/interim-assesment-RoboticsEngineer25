# Backend Adjustments & Issue Resolution Report

## Summary of Changes

This document outlines all adjustments made to align the backend with the frontend structure and lists potential issues that have been addressed.

---

## Backend Adjustments

### 1. **Crypto Model Enhancement**

**Issue:** Frontend expects comprehensive cryptocurrency data that wasn't in the original model.

**Solution:** Updated `models/Crypto.js` to include:
- `change7d` - 7-day percentage change
- `marketCap` - Market capitalization
- `volume` - 24h trading volume  
- `supply` - Total circulating supply
- `color` - Hex color code (e.g., "#F7931A" for Bitcoin)
- `category` - Asset category (crypto, stablecoin, stock, prediction)
- `sparkline` - Array of historical prices for chart visualization

**Data Sample:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Bitcoin",
  "symbol": "BTC",
  "price": 45000,
  "image": "https://example.com/btc.png",
  "change24h": 2.5,
  "change7d": 8.14,
  "marketCap": 1940000000000,
  "volume": 48200000000,
  "supply": 19700000,
  "color": "#F7931A",
  "category": "crypto",
  "sparkline": [44000, 44500, 45000, 45200, 45000]
}
```

### 2. **Authentication Controller Update**

**Issue:** Frontend SignUp form uses `firstName` and `lastName`, but backend only accepted `name`.

**Solution:** Updated `authController.js` to:
- Accept both `firstName`/`lastName` AND `name` field
- Combine `firstName` + `lastName` if provided
- Fallback to `name` if that's provided instead

**Accepts:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "securepass123"
}
```

### 3. **Crypto Controller Enhancement**

**Issue:** POST /crypto endpoint wasn't accepting all optional but useful fields.

**Solution:** Updated `cryptoController.js` to:
- Accept optional fields: `change7d`, `marketCap`, `volume`, `supply`, `color`, `category`, `sparkline`
- Provide sensible defaults for missing fields
- Support both minimal and comprehensive data

### 4. **CORS Configuration**

**Already Configured:** Backend has proper CORS setup for frontend integration.

Current settings:
```javascript
cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
})
```

---

## Frontend Integration Files Added

### 1. **API Service** (`src/services/api.js`)

Centralized API client that:
- Manages all backend communication
- Handles token authentication
- Includes error handling
- Supports both Bearer tokens and cookies

**Key Methods:**
- `authAPI.register()` - User registration
- `authAPI.login()` - User login
- `authAPI.getProfile()` - Fetch user profile
- `authAPI.logout()` - User logout
- `cryptoAPI.getAllCrypto()` - Fetch all crypto
- `cryptoAPI.getGainers()` - Top gainers
- `cryptoAPI.getNewListings()` - New listings
- `cryptoAPI.addCrypto()` - Add new crypto

### 2. **useAuth Hook** (`src/hooks/useAuth.js`)

React hook for authentication management:
- Handles registration & login
- Manages user state and tokens
- Provides loading and error states
- Automatic token persistence

### 3. **useCrypto Hook** (`src/hooks/useCrypto.js`)

React hook for cryptocurrency data:
- Fetches all crypto, gainers, new listings
- Manages crypto state
- Handles async operations
- Error handling included

### 4. **Environment Configuration**

Both `.env.example` and `.env.local` created:
```
VITE_API_URL=http://localhost:5000/api
```

---

## Potential Issues & Solutions

### Issue 1: CORS Errors When Running Frontend & Backend

**Error Message:** 
```
Access to XMLHttpRequest at 'http://localhost:5000/api/...' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

**Causes:**
- Backend not running on port 5000
- API URL in frontend `.env.local` is incorrect
- CORS_ORIGIN env var doesn't match frontend URL

**Solutions:**
1. Check backend is running: `npm run dev` in `/backend` folder
2. Verify `.env.local` has: `VITE_API_URL=http://localhost:5000/api`
3. Update backend `.env` if frontend runs on different port:
   ```
   CORS_ORIGIN=http://localhost:5173
   ```

---

### Issue 2: "Cannot Find Module" in Frontend

**Error:** 
```
Cannot find module 'services/api' or 'hooks/useAuth'
```

**Cause:** Files weren't created or import paths are wrong

**Solutions:**
- Verify files exist:
  - `src/services/api.js` ✓
  - `src/hooks/useAuth.js` ✓
  - `src/hooks/useCrypto.js` ✓
  - `src/hooks/index.js` ✓
- Use correct import:
  ```jsx
  import { useAuth } from '../hooks';  // ✓ correct
  import { useAuth } from '../hooks/useAuth';  // Also works
  ```

---

### Issue 3: Authentication Token Not Persisting

**Problem:** User logs in but login state is lost on refresh

**Root Causes Identified:**
1. Token not being saved to localStorage
2. App context not checking stored token on mount
3. Protected routes not checking authentication

**Backend Side:** ✓ Already working - returns token in response

**Frontend Changes Needed:**
1. Call `authAPI.setToken()` after successful login
2. Check `authAPI.getToken()` when App mounts
3. Use token in `Authorization` header for protected routes

**Implementation in your pages:**
```jsx
const handleLoginSuccess = (response) => {
  authAPI.setToken(response.token);  // Save token
  setIsSignedIn(true);  // Update app state
  navigate('home');
};
```

---

### Issue 4: Crypto Data Format Mismatch

**Problem:** Frontend expects specific data structure that doesn't match

**Example Mismatch:**
```javascript
// Frontend expects (from cryptoData.js)
{ id: 1, name: "Bitcoin", symbol: "BTC", price: 98420.50, ... }

// Backend returns (before fix)
{ _id: ObjectId(...), name: "Bitcoin", symbol: "BTC", price: 98420.50, ... }
```

**Solution Applied:** ✓ Fixed in Crypto model:
```javascript
// Added virtual id field
cryptoSchema.virtual('id').get(function() {
  return this._id;
});
cryptoSchema.set('toJSON', { virtuals: true });
```

Now backend returns both `_id` and `id` properties.

---

### Issue 5: Missing Required Fields in Crypto Creation

**Problem:** User tries to add crypto but backend rejects it due to missing fields

**Example Error:**
```json
{
  "success": false,
  "message": "Please provide all required fields: name, symbol, price, image, and change24h"
}
```

**Frontend Fix:** When adding crypto, include all fields:
```jsx
const cryptoData = {
  name: "Bitcoin",
  symbol: "BTC",
  price: 45000,
  image: "https://example.com/btc.png",
  change24h: 2.5,
  // Optional but recommended:
  change7d: 8.14,
  marketCap: 1940000000000,
  volume: 48200000000,
  supply: 19700000,
  color: "#F7931A",
  sparkline: [44000, 44500, 45000]
};

await cryptoAPI.addCrypto(cryptoData);
```

---

### Issue 6: Protected Routes Accessibility

**Problem:** Non-authenticated users accessing `/profile` endpoint

**Error:** 
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

**Solution:** Frontend middleware:
```jsx
// In your routing/navigation logic
const handleNavigateToProfile = () => {
  if (!isAuthenticated) {
    navigate('signin');  // Redirect to login
  } else {
    navigate('profile');
  }
};
```

---

### Issue 7: MongoDB Connection Errors

**Errors:**
- `Error: connect ECONNREFUSED 127.0.0.1:27017`
- `MongooseError: Cannot connect to MongoDB`

**Solutions:**

**Option 1: Local MongoDB**
```bash
# Windows
mongod  # Run from MongoDB installation

# Check if running on port 27017
netstat -ano | findstr :27017
```

**Option 2: MongoDB Atlas (Cloud)**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/coinbase-clone
```

Ensure:
- IP whitelist includes your machine (0.0.0.0/0 for dev only)
- Username and password are URL-encoded
- Database name exists in cluster

---

### Issue 8: JWT Token Expiration

**Problem:** User gets logged out after 7 days

**This is Expected Behavior** - Configured in backend:
```
JWT_EXPIRE=7d
```

**If you want to change:**
1. Edit `backend/.env`:
   ```
   JWT_EXPIRE=30d  // Or whatever duration
   ```
2. Update cookie maxAge in `authController.js` to match

---

### Issue 9: Adding Crypto Without Authentication

**Error:**
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

**Reason:** POST `/api/crypto` requires JWT token

**Solution:**
1. User must be logged in
2. Call `useAuth()` first to authenticate
3. Then use `useCrypto().addCrypto()`

---

## Verification Checklist

After setup, verify each item:

- [ ] Backend runs without errors: `npm run dev`
- [ ] Backend accessible at `http://localhost:5000/api/health`
- [ ] Frontend starts: `npm run dev`
- [ ] Can view homepageWithout authentication
- [ ] Can navigate to SignUp page
- [ ] SignUp form has firstName/lastName fields
- [ ] Can register new user (check browser console for token)
- [ ] Can login with registered credentials
- [ ] Can view user profile when authenticated
- [ ] Can view crypto list from backend
- [ ] Can add new crypto (if logged in)
- [ ] Logout clears token and redirects

---

## Testing API Endpoints

### Using cURL or Postman

**Register User:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","email":"john@example.com","password":"secure123"}'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"secure123"}'
```

**Get All Crypto:**
```bash
curl http://localhost:5000/api/crypto
```

**Add Crypto (requires token):**
```bash
curl -X POST http://localhost:5000/api/crypto \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name":"Bitcoin",
    "symbol":"BTC",
    "price":45000,
    "image":"https://example.com/btc.png",
    "change24h":2.5
  }'
```

---

## Summary

✓ Backend properly adjusted to match frontend expectations  
✓ Additional fields added to Crypto model  
✓ Authentication updated to support frontend format  
✓ API service created for easy backend calls  
✓ Custom hooks provided for React integration  
✓ Environment configuration files created  
✓ Comprehensive integration guide provided  
✓ Common issues documented with solutions

**Ready for integration and testing!**
