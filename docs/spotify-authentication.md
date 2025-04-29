# Spotify Authentication Documentation

## Overview

The Jukebox Web App implements Spotify authentication using the OAuth 2.0 Authorization Code with PKCE (Proof Key for Code Exchange) flow. This secure authentication method is designed for browser-based applications and provides secure access to Spotify's Web Playback SDK.

## Key Features

1. **Authorization Code Flow with PKCE** - Secure OAuth 2.0 flow without exposing client secrets
2. **Token Storage & Management** - Secure storage of tokens in localStorage
3. **Automatic Token Refresh** - Background refresh mechanism to maintain long-term authentication
4. **User Interface Integration** - Visual feedback on authentication status

## Authentication Flow

1. User clicks "Connect to Spotify" button in the admin interface
2. App generates PKCE code verifier and challenge
3. User is redirected to Spotify's authorization page
4. User grants permissions to the app
5. Spotify redirects back to the app with an authorization code
6. App exchanges the code for access and refresh tokens
7. App stores tokens and refreshes them automatically

## Automatic Token Refresh Implementation

The app includes a sophisticated token refresh mechanism that extends the standard 1-hour authentication session to a practically unlimited duration. This is accomplished through:

### Background Monitoring

```javascript
setupAutoRefresh: function() {
    // Clear any existing timers to prevent duplicates
    if (this._refreshTimer) {
        clearInterval(this._refreshTimer);
    }
    
    // Set up interval to check token every 5 minutes
    this._refreshTimer = setInterval(() => {
        // Get expiration time
        const expiryTime = localStorage.getItem(this.TOKEN_EXPIRATION_KEY);
        if (!expiryTime) return;
        
        const expiry = parseInt(expiryTime);
        const now = Date.now();
        
        // If token will expire in the next 10 minutes, refresh it
        if (expiry - now < 600000 && expiry > now) {
            console.log('Token expires soon, proactively refreshing...');
            this.refreshToken()
                .then(() => console.log('Token proactively refreshed'))
                .catch(err => console.error('Failed to proactively refresh token:', err));
        }
    }, 300000); // Check every 5 minutes
    
    // Also set up a check when user returns to the tab/window
    window.addEventListener('focus', () => {
        // Immediately check if token needs refresh when user returns
        const expiryTime = localStorage.getItem(this.TOKEN_EXPIRATION_KEY);
        if (!expiryTime) return;
        
        const expiry = parseInt(expiryTime);
        const now = Date.now();
        
        // If token will expire in the next 20 minutes or has expired, refresh it
        if (expiry - now < 1200000) {
            console.log('User returned to app, checking token freshness...');
            this.refreshToken()
                .then(() => console.log('Token refreshed on user return'))
                .catch(err => console.error('Failed to refresh token on user return:', err));
        }
    });
}
```

### Key Aspects of the Implementation

1. **Proactive Refresh** - Tokens are refreshed 10 minutes before they expire, preventing any authentication gaps
2. **Periodic Monitoring** - The system checks token status every 5 minutes
3. **Tab Focus Handling** - When a user returns to the tab/window, tokens are refreshed if they're close to expiration
4. **Error Handling** - Failed refresh attempts are properly logged without disrupting the user experience
5. **Cleanup Mechanisms** - Timers are properly cleared when logging out or when setting up new timers

### Integration Points

The automatic refresh mechanism is triggered at three key points:

1. **App Initialization** - If a valid token exists when the app starts
   ```javascript
   initialize: function() {
       // ...existing code...
       
       // Set up automatic token refresh if we're authenticated
       if (this.isTokenValid()) {
           this.setupAutoRefresh();
       }
       
       // ...rest of function...
   }
   ```

2. **After Successful Authentication** - When tokens are first obtained
   ```javascript
   _exchangeCodeForToken: function(code, redirectUri) {
       // ...token exchange code...
       
       .then(data => {
           // ...store tokens...
           
           // Set up automatic token refresh
           this.setupAutoRefresh();
           
           // ...rest of function...
       });
   }
   ```

3. **After Token Refresh** - To reset the timer with the new expiration time
   ```javascript
   refreshToken: function() {
       // ...token refresh code...
       
       .then(data => {
           // ...store new token...
           
           // Reset the auto-refresh timer with the new expiration
           this.setupAutoRefresh();
           
           // ...rest of function...
       });
   }
   ```

## Token Storage

Access and refresh tokens are securely stored in the browser's localStorage:

- `jukebox_spotify_access_token`: The current access token
- `jukebox_spotify_token_expiration`: Expiration timestamp for the access token
- `jukebox_spotify_refresh_token`: The refresh token for obtaining new access tokens

## Security Considerations

1. **PKCE Implementation** - Protects against authorization code interception attacks
2. **Scope Limitation** - Only requests necessary permissions from Spotify
3. **State Parameter** - Prevents CSRF attacks during the authorization process
4. **Automatic Logout** - Clears tokens from storage when user logs out

## User Experience

The authentication process is designed to be seamless for users:

1. **Visual Status Indicators** - Shows connection status and expiration time
2. **Persistent Sessions** - Users stay authenticated across page reloads
3. **Transparent Refresh** - Token refreshes happen in the background without user intervention
4. **Graceful Error Handling** - Authentication errors are displayed clearly to the user

## Configuration

The Spotify authentication module uses these configuration parameters:

```javascript
// Configuration
CLIENT_ID: 'df34b9b407dd4ac5aa8d3509e6ff226d', // Your Spotify Client ID
REDIRECT_URI: 'http://127.0.0.1:5888', // Must match Spotify Dashboard setting
AUTH_ENDPOINT: 'https://accounts.spotify.com/authorize',
TOKEN_ENDPOINT: 'https://accounts.spotify.com/api/token',
SCOPES: [
    'streaming',           // For playback control
    'user-read-email',     // To get user info
    'user-read-private',   // Required for playback
    'user-modify-playback-state' // For playback control
]
```

## Troubleshooting

- **Authentication Failures**: Check browser console for specific error messages
- **Expired Tokens**: The automatic refresh should handle this, but if issues persist, try logging out and back in
- **CORS Issues**: Make sure the redirect URI in Spotify Dashboard matches the app's URL
- **Refresh Errors**: Check the console for "Failed to proactively refresh token" messages

## Limitations

- Requires a Spotify Premium account for playback functionality
- Automatic refresh only works while the app is open in the browser
- The refresh token itself has a longer but still limited lifespan (typically 1 year) 