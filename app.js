/**
 * Jukebox Web App - Main JavaScript
 * 
 * This file contains the core functionality for the Jukebox Web App,
 * including view toggling and initialization.
 */

// SHA-256 function for PKCE (synchronous implementation)
// Based on the js-sha256 library - https://github.com/emn178/js-sha256
function sha256(data) {
    // Initial hash values (first 32 bits of the fractional parts of the square roots of the first 8 primes 2..19)
    const h = [
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
        0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ];
    
    // Constants (first 32 bits of the fractional parts of the cube roots of the first 64 primes 2..311)
    const k = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];
    
    // Process data
    const padded = padMessage(data);
    const chunks = chunk(padded, 64);
    
    chunks.forEach(chunk => processChunk(h, chunk, k));
    
    // Combine final hash values
    const result = new Uint8Array(32);
    for (let i = 0; i < 8; i++) {
        result[i * 4] = (h[i] >>> 24) & 0xff;
        result[i * 4 + 1] = (h[i] >>> 16) & 0xff;
        result[i * 4 + 2] = (h[i] >>> 8) & 0xff;
        result[i * 4 + 3] = h[i] & 0xff;
    }
    
    return result;
    
    // Helper functions
    function padMessage(data) {
        const byteLength = data.length;
        const bitLength = byteLength * 8;
        
        // Calculate padding
        const padLength = (((bitLength + 65) / 512) | 0) * 64 + 64 - (byteLength % 64) - 9;
        
        // Create padded array
        const padded = new Uint8Array(byteLength + padLength + 9);
        padded.set(data, 0);
        
        // Add 1 bit followed by zeros
        padded[byteLength] = 0x80;
        
        // Add length as 64-bit value
        const lenPos = padded.length - 8;
        const lenHigh = ((bitLength / 0x100000000) | 0);
        const lenLow = bitLength | 0;
        
        for (let i = 0; i < 4; i++) {
            padded[lenPos + i] = (lenHigh >>> (24 - i * 8)) & 0xff;
            padded[lenPos + i + 4] = (lenLow >>> (24 - i * 8)) & 0xff;
        }
        
        return padded;
    }
    
    function chunk(data, size) {
        const chunks = [];
        for (let i = 0; i < data.length; i += size) {
            chunks.push(data.subarray(i, i + size));
        }
        return chunks;
    }
    
    function processChunk(h, chunk, k) {
        const w = new Array(64);
        
        // Copy chunk into w
        for (let i = 0; i < 16; i++) {
            w[i] = (chunk[i * 4] << 24) | (chunk[i * 4 + 1] << 16) | 
                  (chunk[i * 4 + 2] << 8) | chunk[i * 4 + 3];
        }
        
        // Extend the first 16 words into the remaining 48 words of w
        for (let i = 16; i < 64; i++) {
            const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
            const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
            w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
        }
        
        // Working variables
        let [a, b, c, d, e, f, g, hVal] = h;
        
        // Main loop
        for (let i = 0; i < 64; i++) {
            const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
            const ch = (e & f) ^ (~e & g);
            const temp1 = (hVal + S1 + ch + k[i] + w[i]) | 0;
            const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
            const maj = (a & b) ^ (a & c) ^ (b & c);
            const temp2 = (S0 + maj) | 0;
            
            hVal = g;
            g = f;
            f = e;
            e = (d + temp1) | 0;
            d = c;
            c = b;
            b = a;
            a = (temp1 + temp2) | 0;
        }
        
        // Update hash values
        h[0] = (h[0] + a) | 0;
        h[1] = (h[1] + b) | 0;
        h[2] = (h[2] + c) | 0;
        h[3] = (h[3] + d) | 0;
        h[4] = (h[4] + e) | 0;
        h[5] = (h[5] + f) | 0;
        h[6] = (h[6] + g) | 0;
        h[7] = (h[7] + hVal) | 0;
    }
    
    function rightRotate(value, amount) {
        return (value >>> amount) | (value << (32 - amount));
    }
}

// Main application object
const JukeboxApp = {
    // DOM Elements
    elements: {
        playerView: null,
        adminView: null,
        viewToggleBtn: null,
        codeInput: null,
        submitCodeBtn: null,
        clearCodeBtn: null,
        feedbackArea: null,
        // Admin interface elements
        mappingForm: null,
        codeInputAdmin: null,
        trackURIInput: null,
        trackNameInput: null,
        artistNameInput: null,
        saveMappingBtn: null,
        clearFormBtn: null,
        formFeedback: null,
        codeFeedback: null,
        uriFeedback: null,
        mappingsList: null,
        noMappingsMessage: null,
        searchInput: null,
        refreshListBtn: null,
        getTrackInfoBtn: null,
        // Edit modal elements
        editModal: null,
        closeModalBtn: null,
        editMappingForm: null,
        editOriginalCode: null,
        editCodeInput: null,
        editTrackURIInput: null,
        editTrackNameInput: null,
        editArtistNameInput: null,
        updateMappingBtn: null,
        cancelEditBtn: null,
        editFormFeedback: null,
        editCodeFeedback: null,
        editURIFeedback: null,
        editGetTrackInfoBtn: null,
        // Spotify Authentication elements
        spotifyLoginBtn: null,
        spotifyLogoutBtn: null,
        spotifyStatusMessage: null,
        spotifyAuthFeedback: null
    },

    // Current state
    state: {
        currentView: 'player', // 'player' or 'admin'
        editingMapping: null, // Currently editing mapping
        mappingsCache: [], // Cached mappings for search/filter
        spotifyAuthenticated: false, // Spotify authentication status
    },

    /**
     * Code-to-Track Mappings Storage
     * Handles storing and retrieving code-to-track mappings using Local Storage
     */
    CodeMappingsStorage: {
        // Storage key for localStorage
        STORAGE_KEY: 'jukebox_code_mappings',
        
        /**
         * Initialize storage if not already present
         * @returns {Object} Result of the operation
         */
        initialize: function() {
            console.log('Initializing code mappings storage...');
            try {
                // Check if localStorage is available
                if (!this._isLocalStorageAvailable()) {
                    return {
                        success: false,
                        error: 'STORAGE_UNAVAILABLE',
                        message: 'Local Storage is not available in this browser.'
                    };
                }
                
                // Check if data already exists
                const existingData = localStorage.getItem(this.STORAGE_KEY);
                if (!existingData) {
                    // Initialize with empty array
                    this._saveToLocalStorage([]);
                    console.log('Storage initialized with empty mappings array.');
                } else {
                    // Validate existing data
                    try {
                        JSON.parse(existingData);
                        console.log('Existing mappings found in storage.');
                    } catch (e) {
                        // Data is corrupted, reset it
                        console.warn('Corrupted data found in storage. Resetting...');
                        this._saveToLocalStorage([]);
                    }
                }
                
                return {
                    success: true,
                    message: 'Code mappings storage initialized successfully.'
                };
            } catch (err) {
                console.error('Error initializing storage:', err);
                return {
                    success: false,
                    error: 'INITIALIZATION_ERROR',
                    message: 'Failed to initialize code mappings storage.'
                };
            }
        },
        
        /**
         * Get all code-to-track mappings
         * @returns {Object} Result with mappings array
         */
        getAllMappings: function() {
            try {
                if (!this._isLocalStorageAvailable()) {
                    return {
                        success: false,
                        error: 'STORAGE_UNAVAILABLE',
                        message: 'Local Storage is not available.'
                    };
                }
                
                const mappings = this._loadFromLocalStorage();
                return {
                    success: true,
                    data: mappings,
                    message: `Retrieved ${mappings.length} mappings.`
                };
            } catch (err) {
                console.error('Error getting all mappings:', err);
                return {
                    success: false,
                    error: 'RETRIEVAL_ERROR',
                    message: 'Failed to retrieve mappings.'
                };
            }
        },
        
        /**
         * Get a specific mapping by its 3-digit code
         * @param {string} code - 3-digit code to look up
         * @returns {Object} Result with mapping data if found
         */
        getMappingByCode: function(code) {
            try {
                // Validate code format
                const validation = this._validateCode(code);
                if (!validation.valid) {
                    return {
                        success: false,
                        error: 'VALIDATION_ERROR',
                        message: validation.message
                    };
                }
                
                if (!this._isLocalStorageAvailable()) {
                    return {
                        success: false,
                        error: 'STORAGE_UNAVAILABLE',
                        message: 'Local Storage is not available.'
                    };
                }
                
                const mappings = this._loadFromLocalStorage();
                const mapping = mappings.find(m => m.code === code);
                
                if (mapping) {
                    return {
                        success: true,
                        data: mapping,
                        message: `Found mapping for code ${code}.`
                    };
                } else {
                    return {
                        success: false,
                        error: 'NOT_FOUND',
                        message: `No mapping found for code ${code}.`
                    };
                }
            } catch (err) {
                console.error(`Error getting mapping for code ${code}:`, err);
                return {
                    success: false,
                    error: 'RETRIEVAL_ERROR',
                    message: `Failed to retrieve mapping for code ${code}.`
                };
            }
        },
        
        /**
         * Add a new code-to-track mapping
         * @param {Object} mapping - Mapping object {code, trackURI, trackName, artistName}
         * @returns {Object} Result of the operation
         */
        addMapping: function(mapping) {
            try {
                // Validate required fields
                if (!mapping || !mapping.code || !mapping.trackURI) {
                    return {
                        success: false,
                        error: 'VALIDATION_ERROR',
                        message: 'Code and trackURI are required.'
                    };
                }
                
                // Validate code format
                const codeValidation = this._validateCode(mapping.code);
                if (!codeValidation.valid) {
                    return {
                        success: false,
                        error: 'VALIDATION_ERROR',
                        message: codeValidation.message
                    };
                }
                
                // Validate track URI format
                const uriValidation = this._validateTrackURI(mapping.trackURI);
                if (!uriValidation.valid) {
                    return {
                        success: false,
                        error: 'VALIDATION_ERROR',
                        message: uriValidation.message
                    };
                }
                
                // Use the converted URI if provided by validation (from URL)
                const trackURI = uriValidation.convertedUri || mapping.trackURI;
                
                if (!this._isLocalStorageAvailable()) {
                    return {
                        success: false,
                        error: 'STORAGE_UNAVAILABLE',
                        message: 'Local Storage is not available.'
                    };
                }
                
                const mappings = this._loadFromLocalStorage();
                
                // Check for duplicate code
                if (mappings.some(m => m.code === mapping.code)) {
                    return {
                        success: false,
                        error: 'DUPLICATE_CODE',
                        message: `A mapping with code ${mapping.code} already exists.`
                    };
                }
                
                // Create a complete mapping object with all fields
                const newMapping = {
                    code: mapping.code,
                    trackURI: trackURI,
                    trackName: mapping.trackName || 'Unknown Track',
                    artistName: mapping.artistName || 'Unknown Artist',
                    dateAdded: new Date().toISOString()
                };
                
                // Add the new mapping
                mappings.push(newMapping);
                
                // Save to localStorage
                try {
                    this._saveToLocalStorage(mappings);
                } catch (storageErr) {
                    if (storageErr.name === 'QuotaExceededError') {
                        return {
                            success: false,
                            error: 'QUOTA_EXCEEDED',
                            message: 'Storage quota exceeded. Try removing some mappings.'
                        };
                    }
                    throw storageErr;
                }
                
                return {
                    success: true,
                    data: newMapping,
                    message: `Mapping for code ${mapping.code} added successfully.`
                };
            } catch (err) {
                console.error('Error adding mapping:', err);
                return {
                    success: false,
                    error: 'ADD_ERROR',
                    message: 'Failed to add mapping.'
                };
            }
        },
        
        /**
         * Update an existing mapping
         * @param {string} code - Code of the mapping to update
         * @param {Object} updatedMapping - New mapping data
         * @returns {Object} Result of the operation
         */
        updateMapping: function(code, updatedMapping) {
            try {
                // Validate code format
                const codeValidation = this._validateCode(code);
                if (!codeValidation.valid) {
                    return {
                        success: false,
                        error: 'VALIDATION_ERROR',
                        message: codeValidation.message
                    };
                }
                
                if (!updatedMapping) {
                    return {
                        success: false,
                        error: 'VALIDATION_ERROR',
                        message: 'Updated mapping data is required.'
                    };
                }
                
                // Validate track URI if provided
                let trackURI = updatedMapping.trackURI;
                if (updatedMapping.trackURI) {
                    const uriValidation = this._validateTrackURI(updatedMapping.trackURI);
                    if (!uriValidation.valid) {
                        return {
                            success: false,
                            error: 'VALIDATION_ERROR',
                            message: uriValidation.message
                        };
                    }
                    
                    // Use the converted URI if provided by validation (from URL)
                    if (uriValidation.convertedUri) {
                        trackURI = uriValidation.convertedUri;
                    }
                }
                
                if (!this._isLocalStorageAvailable()) {
                    return {
                        success: false,
                        error: 'STORAGE_UNAVAILABLE',
                        message: 'Local Storage is not available.'
                    };
                }
                
                const mappings = this._loadFromLocalStorage();
                
                // Find the mapping index
                const index = mappings.findIndex(m => m.code === code);
                if (index === -1) {
                    return {
                        success: false,
                        error: 'NOT_FOUND',
                        message: `No mapping found for code ${code}.`
                    };
                }
                
                // Update the mapping, preserving fields not included in update
                const existingMapping = mappings[index];
                
                // Create the updated mapping with all fields
                mappings[index] = {
                    ...existingMapping,
                    ...updatedMapping,
                    code: code, // Ensure code remains the same
                    lastUpdated: new Date().toISOString()
                };
                
                // Apply the converted trackURI if available
                if (trackURI && trackURI !== updatedMapping.trackURI) {
                    mappings[index].trackURI = trackURI;
                }
                
                // Save to localStorage
                try {
                    this._saveToLocalStorage(mappings);
                } catch (storageErr) {
                    if (storageErr.name === 'QuotaExceededError') {
                        return {
                            success: false,
                            error: 'QUOTA_EXCEEDED',
                            message: 'Storage quota exceeded. Try removing some mappings.'
                        };
                    }
                    throw storageErr;
                }
                
                return {
                    success: true,
                    data: mappings[index],
                    message: `Mapping for code ${code} updated successfully.`
                };
            } catch (err) {
                console.error(`Error updating mapping for code ${code}:`, err);
                return {
                    success: false,
                    error: 'UPDATE_ERROR',
                    message: `Failed to update mapping for code ${code}.`
                };
            }
        },
        
        /**
         * Delete a mapping by its code
         * @param {string} code - Code of the mapping to delete
         * @returns {Object} Result of the operation
         */
        deleteMapping: function(code) {
            try {
                // Validate code format
                const validation = this._validateCode(code);
                if (!validation.valid) {
                    return {
                        success: false,
                        error: 'VALIDATION_ERROR',
                        message: validation.message
                    };
                }
                
                if (!this._isLocalStorageAvailable()) {
                    return {
                        success: false,
                        error: 'STORAGE_UNAVAILABLE',
                        message: 'Local Storage is not available.'
                    };
                }
                
                const mappings = this._loadFromLocalStorage();
                
                // Check if mapping exists
                const index = mappings.findIndex(m => m.code === code);
                if (index === -1) {
                    return {
                        success: false,
                        error: 'NOT_FOUND',
                        message: `No mapping found for code ${code}.`
                    };
                }
                
                // Remove the mapping
                const deletedMapping = mappings.splice(index, 1)[0];
                
                // Save to localStorage
                this._saveToLocalStorage(mappings);
                
                return {
                    success: true,
                    data: deletedMapping,
                    message: `Mapping for code ${code} deleted successfully.`
                };
            } catch (err) {
                console.error(`Error deleting mapping for code ${code}:`, err);
                return {
                    success: false,
                    error: 'DELETE_ERROR',
                    message: `Failed to delete mapping for code ${code}.`
                };
            }
        },
        
        /**
         * Clear all mappings from storage
         * @returns {Object} Result of the operation
         */
        clearAllMappings: function() {
            try {
                if (!this._isLocalStorageAvailable()) {
                    return {
                        success: false,
                        error: 'STORAGE_UNAVAILABLE',
                        message: 'Local Storage is not available.'
                    };
                }
                
                // Save empty array to localStorage
                this._saveToLocalStorage([]);
                
                return {
                    success: true,
                    message: 'All mappings cleared successfully.'
                };
            } catch (err) {
                console.error('Error clearing mappings:', err);
                return {
                    success: false,
                    error: 'CLEAR_ERROR',
                    message: 'Failed to clear mappings.'
                };
            }
        },
        
        /**
         * Validates if a code is in the correct format
         * 
         * NOTE: Code format was updated from 3 digits to 10 digits on 2025-04-27
         * for increased capacity (10 billion vs 1000 possible codes) and to reduce
         * the risk of code collisions. This change affects all validation, UI elements,
         * and user-facing messages throughout the application.
         * 
         * @private
         * @param {string} code - The code to validate
         * @returns {Object} Validation result
         */
        _validateCode: function(code) {
            if (!code) {
                return {
                    valid: false,
                    message: 'Code is required.'
                };
            }
            
            if (typeof code !== 'string') {
                return {
                    valid: false,
                    message: 'Code must be a string.'
                };
            }
            
            // Check if code is exactly 10 digits
            if (!/^\d{10}$/.test(code)) {
                return {
                    valid: false,
                    message: 'Code must be exactly 10 digits.'
                };
            }
            
            return {
                valid: true
            };
        },
        
        /**
         * Validates if a track URI is in the correct Spotify format
         * @private
         * @param {string} uri - The track URI or URL to validate
         * @returns {Object} Validation result
         */
        _validateTrackURI: function(uri) {
            if (!uri) {
                return {
                    valid: false,
                    message: 'Track URI or URL is required.'
                };
            }
            
            if (typeof uri !== 'string') {
                return {
                    valid: false,
                    message: 'Track URI or URL must be a string.'
                };
            }
            
            // Check if it's a Spotify URL format
            const urlMatch = uri.match(/https?:\/\/open\.spotify\.com\/track\/([a-zA-Z0-9]{22})(\?|$)/);
            if (urlMatch && urlMatch[1]) {
                // It's a URL, so convert to URI format internally
                const trackId = urlMatch[1];
                // Return success but include the converted URI for use
                return {
                    valid: true,
                    convertedUri: `spotify:track:${trackId}`
                };
            }
            
            // Check if URI has the correct Spotify track format
            // Example Spotify track URI: spotify:track:4iV5W9uYEdYUVa79Axb7Rh
            if (!/^spotify:track:[a-zA-Z0-9]{22}$/.test(uri)) {
                return {
                    valid: false,
                    message: 'Invalid Spotify track format. Please use either a Spotify URI (spotify:track:4iV5W9uYEdYUVa79Axb7Rh) or a Spotify URL (https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh).'
                };
            }
            
            return {
                valid: true
            };
        },
        
        /**
         * Checks if localStorage is available in the browser
         * @private
         * @returns {boolean} True if localStorage is available
         */
        _isLocalStorageAvailable: function() {
            try {
                const test = 'test';
                localStorage.setItem(test, test);
                localStorage.removeItem(test);
                return true;
            } catch (e) {
                return false;
            }
        },
        
        /**
         * Saves mappings array to localStorage
         * @private
         * @param {Array} mappings - Array of mapping objects
         */
        _saveToLocalStorage: function(mappings) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(mappings));
        },
        
        /**
         * Loads mappings array from localStorage
         * @private
         * @returns {Array} Array of mapping objects
         */
        _loadFromLocalStorage: function() {
            try {
                const data = localStorage.getItem(this.STORAGE_KEY);
                return data ? JSON.parse(data) : [];
            } catch (e) {
                console.error('Error parsing data from localStorage:', e);
                return [];
            }
        }
    },

    /**
     * Spotify Authentication Module
     * Handles authentication with Spotify using Authorization Code with PKCE flow
     */
    SpotifyAuth: {
        // Configuration
        CLIENT_ID: 'df34b9b407dd4ac5aa8d3509e6ff226d', // Your Spotify Client ID
        REDIRECT_URI: 'http://127.0.0.1:5888', // Fixed redirect URI - must match Spotify Dashboard setting
        AUTH_ENDPOINT: 'https://accounts.spotify.com/authorize',
        TOKEN_ENDPOINT: 'https://accounts.spotify.com/api/token',
        SCOPES: [
            'streaming',           // For playback control
            'user-read-email',     // To get user info
            'user-read-private',   // Required for playback
            'user-modify-playback-state' // For playback control
        ],
        
        // Storage keys
        TOKEN_KEY: 'jukebox_spotify_token',
        TOKEN_EXPIRY_KEY: 'jukebox_spotify_token_expiry',
        REFRESH_TOKEN_KEY: 'jukebox_spotify_refresh_token',
        CODE_VERIFIER_KEY: 'jukebox_spotify_code_verifier',
        ACCESS_TOKEN_KEY: 'jukebox_spotify_access_token',
        TOKEN_EXPIRATION_KEY: 'jukebox_spotify_token_expiration',
        
        /**
         * Initialize the authentication module
         * Checks for existing token and parses URL query params if present
         */
        initialize: function() {
            console.log('Initializing Spotify authentication...');
            console.log('Current redirect URI:', this.REDIRECT_URI);
            console.log('Current window location:', window.location.href);
            
            // DIAGNOSTIC: Check if we have a stored code verifier
            const storedVerifier = localStorage.getItem(this.CODE_VERIFIER_KEY);
            console.log('At initialization - Code verifier in localStorage:', storedVerifier ? `Present (${storedVerifier.length} chars)` : 'Not found');
            
            // Check if we're returning from an auth flow redirect with a code
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('code')) {
                console.log('Authorization code found in URL params - about to handle redirect');
                this.handleRedirect();
            }
            
            // Check if we have a valid token
            this.updateAuthState();
            
            // Set up automatic token refresh if we're authenticated
            if (this.isTokenValid()) {
                this.setupAutoRefresh();
            }
            
            // Display any stored messages
            this._checkForStoredMessages();
        },

        /**
         * Setup automatic token refresh to maintain authentication
         */
        setupAutoRefresh: function() {
            // Clear any existing timers to prevent duplicates
            if (this._refreshTimer) {
                clearInterval(this._refreshTimer);
            }
            
            // Set up interval to check token every 5 minutes (300000 ms)
            this._refreshTimer = setInterval(() => {
                // Get expiration time
                const expiryTime = localStorage.getItem(this.TOKEN_EXPIRATION_KEY);
                if (!expiryTime) return;
                
                const expiry = parseInt(expiryTime);
                const now = Date.now();
                
                // If token will expire in the next 10 minutes (600000 ms), refresh it
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
            
            console.log('Automatic token refresh monitoring set up');
        },
        
        /**
         * Update UI and state based on authentication status
         */
        updateAuthState: function() {
            const isAuthenticated = this.isTokenValid();
            JukeboxApp.state.spotifyAuthenticated = isAuthenticated;
            
            // Update UI if elements exist
            if (JukeboxApp.elements.spotifyStatusMessage && 
                JukeboxApp.elements.spotifyLoginBtn && 
                JukeboxApp.elements.spotifyLogoutBtn) {
                
                if (isAuthenticated) {
                    JukeboxApp.elements.spotifyStatusMessage.innerHTML = 
                        '<span class="status-icon connected"></span> Connected to Spotify';
                    JukeboxApp.elements.spotifyStatusMessage.classList.add('auth-success');
                    JukeboxApp.elements.spotifyLoginBtn.style.display = 'none';
                    JukeboxApp.elements.spotifyLogoutBtn.style.display = 'block';
                    
                    // Get token expiry time
                    const expiryTimestamp = localStorage.getItem(this.TOKEN_EXPIRATION_KEY);
                    if (expiryTimestamp) {
                        const expiryDate = new Date(parseInt(expiryTimestamp));
                        const expiryTime = expiryDate.toLocaleTimeString();
                        JukeboxApp.elements.spotifyAuthFeedback.textContent = 
                            `Authentication valid until ${expiryTime}`;
                        JukeboxApp.elements.spotifyAuthFeedback.classList.remove('auth-error');
                    }
                    
                    // Initialize the Spotify Web Playback SDK if not already initialized
                    if (!JukeboxApp.SpotifyPlayer.player) {
                        JukeboxApp.initSpotifySDK();
                    }
                } else {
                    JukeboxApp.elements.spotifyStatusMessage.innerHTML = 
                        '<span class="status-icon disconnected"></span> Not connected to Spotify';
                    JukeboxApp.elements.spotifyStatusMessage.classList.remove('auth-success');
                    JukeboxApp.elements.spotifyLoginBtn.style.display = 'block';
                    JukeboxApp.elements.spotifyLogoutBtn.style.display = 'none';
                    JukeboxApp.elements.spotifyAuthFeedback.textContent = '';
                }
            }
        },
        
        /**
         * Start the Spotify authentication flow
         * Redirects to Spotify login page with PKCE code challenge
         */
        login: function() {
            console.log('Starting Spotify authentication flow with PKCE...');
            
            // Generate a state value for security (CSRF protection)
            const state = this._generateRandomString(16);
            localStorage.setItem('spotify_auth_state', state);
            console.log('Generated state and saved to localStorage:', state);
            
            // Generate code verifier for PKCE
            const codeVerifier = this._generateCodeVerifier();
            console.log('Generated code verifier:', codeVerifier, '(length:', codeVerifier.length, ')');
            localStorage.setItem(this.CODE_VERIFIER_KEY, codeVerifier);
            
            // DIAGNOSTIC: Verify code verifier was stored correctly
            const storedVerifier = localStorage.getItem(this.CODE_VERIFIER_KEY);
            console.log('Stored code verifier in localStorage:', storedVerifier ? `Present (${storedVerifier.length} chars)` : 'Not found');
            console.log('Stored equals generated:', storedVerifier === codeVerifier);
            
            // Generate the code challenge from the verifier
            this._generateCodeChallenge(codeVerifier).then(codeChallenge => {
                console.log('Generated code challenge:', codeChallenge, '(length:', codeChallenge.length, ')');
                
                // List all localStorage keys for debugging
                console.log('All localStorage keys for PKCE before redirect:');
                console.log(`  spotify_auth_state: ${localStorage.getItem('spotify_auth_state')}`);
                console.log(`  ${this.CODE_VERIFIER_KEY}: ${localStorage.getItem(this.CODE_VERIFIER_KEY) ? 'Present' : 'Not found'}`);
                
                // Create base redirect URI with current view state preserved
                const currentView = JukeboxApp.state.currentView;
                const redirectUri = `${this.REDIRECT_URI}?view=${currentView}`;
                console.log(`Using redirect URI with view state: ${redirectUri}`);
                
                // Create authorization URL with parameters
                const authUrl = new URL(this.AUTH_ENDPOINT);
                authUrl.searchParams.append('client_id', this.CLIENT_ID);
                authUrl.searchParams.append('response_type', 'code'); // Auth code flow, not token
                authUrl.searchParams.append('redirect_uri', redirectUri);
                authUrl.searchParams.append('state', state);
                authUrl.searchParams.append('scope', this.SCOPES.join(' '));
                authUrl.searchParams.append('code_challenge_method', 'S256');
                authUrl.searchParams.append('code_challenge', codeChallenge);
                authUrl.searchParams.append('show_dialog', 'true'); // Force showing the dialog
                
                // DEBUGGING: Log the full URL and key parameters
                console.log('Generated OAuth URL:', authUrl.toString());
                console.log('response_type parameter:', authUrl.searchParams.get('response_type'));
                console.log('code_challenge parameter:', authUrl.searchParams.get('code_challenge'));
                console.log('code_challenge_method parameter:', authUrl.searchParams.get('code_challenge_method'));
                console.log('state parameter:', authUrl.searchParams.get('state'));
                console.log('redirect_uri parameter:', authUrl.searchParams.get('redirect_uri'));
                
                // Update UI before redirect
                if (JukeboxApp.elements.spotifyAuthFeedback) {
                    JukeboxApp.elements.spotifyAuthFeedback.textContent = 'Redirecting to Spotify login...';
                    JukeboxApp.elements.spotifyAuthFeedback.classList.add('auth-loading');
                }
                
                // Redirect to the authorization URL
                window.location.href = authUrl.toString();
            }).catch(error => {
                console.error('Error generating code challenge:', error);
                if (JukeboxApp.elements.spotifyAuthFeedback) {
                    JukeboxApp.elements.spotifyAuthFeedback.textContent = 'Authentication error. Please try again.';
                    JukeboxApp.elements.spotifyAuthFeedback.classList.add('auth-error');
                }
            });
        },
        
        /**
         * Handle the redirect from Spotify after authorization
         * Parses URL for auth code and exchanges it for tokens
         */
        handleRedirect: function() {
            console.log('Handling redirect from Spotify authorization...');
            
            // Parse the URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            
            // Check for errors returned from Spotify
            const error = urlParams.get('error');
            if (error) {
                console.error('Spotify authorization error:', error);
                localStorage.setItem('spotify_auth_error', `Authentication failed: ${error}`);
                this._clearUrlParameters();
                this.updateAuthState();
                return;
            }
            
            // Extract authorization code from URL
            const code = urlParams.get('code');
            if (!code) {
                console.error('No authorization code found in redirect URL');
                localStorage.setItem('spotify_auth_error', 'Authentication failed: No authorization code received');
                this._clearUrlParameters();
                this.updateAuthState();
                return;
            }
            
            // Extract and validate state parameter (CSRF protection)
            const state = urlParams.get('state');
            const storedState = localStorage.getItem('spotify_auth_state');
            
            if (!state || state !== storedState) {
                console.error('State mismatch', { 
                    receivedState: state,
                    storedState: storedState
                });
                localStorage.setItem('spotify_auth_error', 'Authentication failed: State verification failed');
                this._clearUrlParameters();
                this.updateAuthState();
                return;
            }
            
            console.log('State validation successful');
            
            // Get the current view from URL parameters
            const viewParam = urlParams.get('view');
            
            // Get UI feedback element directly to avoid 'this' context issues
            const feedbackElement = document.getElementById('spotify-auth-feedback');
            if (feedbackElement) {
                feedbackElement.textContent = 'Finalizing authentication...';
                feedbackElement.classList.add('auth-loading');
            } else {
                console.warn('Could not find spotify-auth-feedback element');
            }
            
            // Keep the view parameter when clearing other URL parameters
            this._clearUrlParametersExceptView();
            
            // Current view parameter for the redirect URI
            const currentView = viewParam || 'player';
            const redirectUri = `${this.REDIRECT_URI}?view=${currentView}`;
            
            // Exchange the authorization code for tokens
            this._exchangeCodeForToken(code, redirectUri)
                .then(data => {
                    console.log('Token exchange completed successfully');
                    localStorage.setItem('spotify_auth_success', 'Successfully connected to Spotify');
                    this.updateAuthState();
                })
                .catch(error => {
                    console.error('Error during token exchange:', error);
                    localStorage.setItem('spotify_auth_error', `Authentication failed: ${error.message || 'Token exchange failed'}`);
                    this.updateAuthState();
                });
        },
        
        /**
         * Clear URL parameters without refreshing the page but preserve view parameter
         * @private
         */
        _clearUrlParametersExceptView: function() {
            const url = new URL(window.location);
            const viewParam = url.searchParams.get('view');
            
            // Clear all parameters
            url.search = '';
            
            // Add back the view parameter if it existed
            if (viewParam) {
                url.searchParams.set('view', viewParam);
            }
            
            window.history.replaceState({}, document.title, url);
        },
        
        /**
         * Clear all URL parameters without refreshing the page
         * @private
         */
        _clearUrlParameters: function() {
            // Remove URL parameters without causing a page reload
            const url = window.location.pathname;
            window.history.replaceState({}, document.title, url);
        },
        
        /**
         * Exchange an authorization code for access and refresh tokens
         * @param {string} code - The authorization code returned from Spotify
         * @param {string} redirectUri - The redirect URI used for the authorization (with view parameter)
         * @returns {Promise} - Promise that resolves with token data or rejects with error
         */
        _exchangeCodeForToken: function(code, redirectUri) {
            console.log('Exchanging authorization code for tokens...');
            
            // Retrieve the code verifier that was stored during the login process
            const codeVerifier = localStorage.getItem(this.CODE_VERIFIER_KEY);
            
            // DIAGNOSTIC: Log code verifier for debugging
            console.log('Retrieved code verifier for token exchange:', codeVerifier ? `Present (${codeVerifier.length} chars)` : 'Not found');
            if (!codeVerifier) {
                console.error('No code verifier found in localStorage. This will cause the token exchange to fail.');
            }
            
            // Use the provided redirect URI or fall back to the default
            const finalRedirectUri = redirectUri || this.REDIRECT_URI;
            
            // Prepare token request parameters
            const params = new URLSearchParams();
            params.append('client_id', this.CLIENT_ID);
            params.append('grant_type', 'authorization_code');
            params.append('code', code);
            params.append('redirect_uri', finalRedirectUri);
            params.append('code_verifier', codeVerifier);
            
            // Log request details for debugging
            console.log('Token request parameters:');
            console.log('- client_id:', this.CLIENT_ID);
            console.log('- grant_type: authorization_code');
            console.log('- code:', code ? 'Present (hidden for security)' : 'Not found');
            console.log('- redirect_uri:', finalRedirectUri);
            console.log('- code_verifier:', codeVerifier ? `Present (${codeVerifier.length} chars)` : 'Not found');
            
            // Make the token request
            return fetch(this.TOKEN_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString(),
            })
            .then(response => {
                // Log response status for debugging
                console.log('Token response status:', response.status);
                
                if (!response.ok) {
                    // Handle error responses by converting to JSON and then rejecting
                    return response.json().then(error => {
                        console.error('Token exchange error details:', error);
                        throw new Error(`Token request failed with status ${response.status}: ${error.error}, ${error.error_description}`);
                    });
                }
                
                return response.json();
            })
            .then(data => {
                console.log('Token exchange successful');
                
                // Store tokens in localStorage
                localStorage.setItem(this.ACCESS_TOKEN_KEY, data.access_token);
                localStorage.setItem(this.REFRESH_TOKEN_KEY, data.refresh_token);
                
                // Store expiration time
                const expiresIn = data.expires_in || 3600; // Default to 1 hour if not provided
                const expirationTime = Date.now() + (expiresIn * 1000);
                localStorage.setItem(this.TOKEN_EXPIRATION_KEY, expirationTime);
                
                console.log('Tokens stored in localStorage with expiration:', new Date(expirationTime).toISOString());
                
                // Set up automatic token refresh
                this.setupAutoRefresh();
                
                // Clean up auth-related state
                localStorage.removeItem('spotify_auth_state');
                localStorage.removeItem(this.CODE_VERIFIER_KEY);
                
                return data;
            });
        },
        
        /**
         * Refresh the access token using the refresh token
         * @returns {Promise} Resolves when token is refreshed, rejects on error
         */
        refreshToken: function() {
            const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
            
            if (!refreshToken) {
                console.error('No refresh token available');
                return Promise.reject(new Error('No refresh token available'));
            }
            
            console.log('Refreshing access token...');
            
            // Set up the form data for the token request
            const tokenRequest = new URLSearchParams();
            tokenRequest.append('client_id', this.CLIENT_ID);
            tokenRequest.append('grant_type', 'refresh_token');
            tokenRequest.append('refresh_token', refreshToken);
            
            return fetch(this.TOKEN_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: tokenRequest.toString(),
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('HTTP status ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                console.log('Token refresh successful');
                
                // Store the new access token
                const accessToken = data.access_token;
                const expiresIn = data.expires_in;
                const expiryTime = Date.now() + (expiresIn * 1000);
                
                localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
                localStorage.setItem(this.TOKEN_EXPIRATION_KEY, expiryTime.toString());
                
                // Update refresh token if a new one was provided
                if (data.refresh_token) {
                    localStorage.setItem(this.REFRESH_TOKEN_KEY, data.refresh_token);
                }
                
                // Reset the auto-refresh timer with the new expiration
                this.setupAutoRefresh();
                
                // Update UI
                this.updateAuthState();
                
                return accessToken;
            });
        },
        
        /**
         * Get the stored access token
         * @returns {Promise} Resolves with access token, refreshing if necessary
         */
        getToken: function() {
            // Check if token exists and is valid
            if (this.isTokenValid()) {
                return Promise.resolve(localStorage.getItem(this.ACCESS_TOKEN_KEY));
            }
            
            // If we have a refresh token, try to get a new access token
            if (localStorage.getItem(this.REFRESH_TOKEN_KEY)) {
                return this.refreshToken();
            }
            
            // No valid token and no refresh token
            return Promise.reject(new Error('No valid token available'));
        },
        
        /**
         * Check if the token exists and is still valid
         * @returns {boolean} True if token is valid, false otherwise
         */
        isTokenValid: function() {
            const token = localStorage.getItem(this.ACCESS_TOKEN_KEY);
            const expiryTime = localStorage.getItem(this.TOKEN_EXPIRATION_KEY);
            
            if (!token || !expiryTime) {
                return false;
            }
            
            // Check if token has expired
            const now = Date.now();
            const expiry = parseInt(expiryTime);
            
            return now < expiry;
        },
        
        /**
         * Log out from Spotify
         * Clears stored tokens and updates the UI
         */
        logout: function() {
            console.log('Logging out from Spotify...');
            
            // Stop the auto-refresh timer
            if (this._refreshTimer) {
                clearInterval(this._refreshTimer);
                this._refreshTimer = null;
            }
            
            // Disconnect the player if it exists
            if (JukeboxApp.SpotifyPlayer.player) {
                JukeboxApp.SpotifyPlayer.player.disconnect()
                    .then(() => {
                        console.log('Spotify player disconnected');
                    })
                    .catch(error => {
                        console.error('Error disconnecting Spotify player:', error);
                    });
                
                // Reset player state
                JukeboxApp.SpotifyPlayer.isReady = false;
                JukeboxApp.SpotifyPlayer.deviceId = null;
                JukeboxApp.SpotifyPlayer.currentTrack = null;
                JukeboxApp.SpotifyPlayer.showPlayerMessage('Disconnected from Spotify');
            }
            
            // Clear tokens
            localStorage.removeItem(this.ACCESS_TOKEN_KEY);
            localStorage.removeItem(this.TOKEN_EXPIRATION_KEY);
            localStorage.removeItem(this.REFRESH_TOKEN_KEY);
            localStorage.removeItem(this.CODE_VERIFIER_KEY);
            
            // Update authentication state
            JukeboxApp.state.spotifyAuthenticated = false;
            this.updateAuthState();
            
            // Provide feedback
            if (JukeboxApp.elements.spotifyAuthFeedback) {
                JukeboxApp.elements.spotifyAuthFeedback.textContent = 'Logged out from Spotify';
                JukeboxApp.elements.spotifyAuthFeedback.classList.remove('auth-error', 'auth-loading');
            }
        },
        
        /**
         * Generate a random string of specified length
         * Used for state parameter in auth flow
         * @param {number} length - The length of string to generate
         * @returns {string} Random string
         * @private
         */
        _generateRandomString: function(length) {
            console.log('Generating random string of length:', length);
            // Using only alphanumeric characters (no special chars)
            const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            console.log('Character set length:', possible.length);
            
            // Generate random values
            const values = crypto.getRandomValues(new Uint8Array(length));
            console.log('Generated random values array length:', values.length);
            
            // Map to character set
            const result = Array.from(values)
                .map(x => possible[x % possible.length])
                .join('');
                
            console.log('Random string generated with length:', result.length);
            // Only log a portion of the string for security
            console.log('Generated string preview:', result.substring(0, 5) + '...');
            
            return result;
        },
        
        /**
         * Generate a code verifier for PKCE
         * @returns {string} A random string between 43-128 characters
         * @private
         */
        _generateCodeVerifier: function() {
            console.log('Generating code verifier using Stack Overflow solution');
            
            // Generate random bytes (32 bytes = 256 bits)
            const array = new Uint8Array(32);
            window.crypto.getRandomValues(array);
            
            // Convert to base64 and replace non-url-safe chars
            // Note: btoa() expects a string, so we need to convert array to string first
            const base64String = btoa(String.fromCharCode.apply(null, array));
            const codeVerifier = base64String
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=/g, '');
                
            console.log('Code verifier generated using Stack Overflow solution, length:', codeVerifier.length);
            console.log('Verifier preview:', codeVerifier.substring(0, 5) + '...' + codeVerifier.substring(codeVerifier.length - 5));
            
            return codeVerifier;
        },
        
        /**
         * Generate a code challenge from the code verifier
         * @param {string} codeVerifier - The code verifier
         * @returns {Promise<string>} - Promise that resolves to the code challenge
         * @private
         */
        _generateCodeChallenge: async function(codeVerifier) {
            // Convert string to UTF-8 bytes
            const encoder = new TextEncoder();
            const data = encoder.encode(codeVerifier);
            
            // Generate SHA-256 hash
            const hash = await window.crypto.subtle.digest('SHA-256', data);
            
            // Convert to base64url encoding
            const base64String = btoa(String.fromCharCode.apply(null, new Uint8Array(hash)));
            const codeChallenge = base64String
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=/g, '');
                
            return codeChallenge;
        },
        
        /**
         * Encode an ArrayBuffer or string to base64url
         * @param {ArrayBuffer|string} input - The input to encode
         * @returns {string} base64url encoded string
         * @private
         */
        _base64urlEncode: function(input) {
            console.log('Starting base64url encoding. Input type:', typeof input);
            if (input instanceof ArrayBuffer) {
                console.log('Input is ArrayBuffer with byteLength:', input.byteLength);
                
                // Convert ArrayBuffer to binary string
                const bytes = new Uint8Array(input);
                let binaryString = '';
                for (let i = 0; i < bytes.byteLength; i++) {
                    binaryString += String.fromCharCode(bytes[i]);
                }
                
                // btoa for base64 encoding
                const base64 = btoa(binaryString);
                // Convert base64 to base64url
                const base64url = base64
                    .replace(/\+/g, '-')
                    .replace(/\//g, '_')
                    .replace(/=/g, '');
                
                return base64url;
            } else {
                console.error('Unsupported input type for base64urlEncode');
                return '';
            }
        },
        
        /**
         * Check for stored error or success messages and display them
         * @private
         */
        _checkForStoredMessages: function() {
            const errorMsg = localStorage.getItem('spotify_auth_error');
            const successMsg = localStorage.getItem('spotify_auth_success');
            
            if (errorMsg && JukeboxApp.elements.spotifyAuthFeedback) {
                JukeboxApp.elements.spotifyAuthFeedback.textContent = errorMsg;
                JukeboxApp.elements.spotifyAuthFeedback.classList.add('auth-error');
                localStorage.removeItem('spotify_auth_error');
            }
            
            if (successMsg && JukeboxApp.elements.spotifyAuthFeedback) {
                JukeboxApp.elements.spotifyAuthFeedback.textContent = successMsg;
                JukeboxApp.elements.spotifyAuthFeedback.classList.add('auth-success');
                localStorage.removeItem('spotify_auth_success');
                
                // Ensure the status display is in sync with the success message
                this.updateAuthState();
            }
        }
    },

    /**
     * Initialize the application
     */
    init: function() {
        console.log('Initializing Jukebox Web App...');
        
        // Cache DOM elements
        this.cacheElements();
        
        // Check URL parameters for view state
        const urlParams = new URLSearchParams(window.location.search);
        const viewParam = urlParams.get('view');
        
        // Set initial view based on URL parameter
        if (viewParam === 'admin') {
            this.state.currentView = 'admin';
            // Apply admin view immediately
            this.elements.playerView.classList.remove('active');
            this.elements.adminView.classList.add('active');
            this.elements.viewToggleBtn.textContent = 'Switch to Player View';
            console.log('Starting in admin view based on URL parameter');
        } else {
            // Default to player view
            this.state.currentView = 'player';
            this.elements.adminView.classList.remove('active');
            this.elements.playerView.classList.add('active');
            this.elements.viewToggleBtn.textContent = 'Switch to Admin View';
            console.log('Starting in player view (default or from URL parameter)');
        }
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize code mappings storage
        const storageResult = this.CodeMappingsStorage.initialize();
        if (!storageResult.success) {
            console.error('Failed to initialize code mappings storage:', storageResult.message);
        }
        
        // Initialize the admin interface
        this.manageCodeMappings();
        
        // Initialize Spotify authentication
        this.SpotifyAuth.initialize();
        
        // Check if we're already authenticated with Spotify, and initialize the SDK if so
        if (this.SpotifyAuth.isTokenValid()) {
            this.state.spotifyAuthenticated = true;
            
            // Initialize Spotify Web Playback SDK
            this.initSpotifySDK();
        }
        
        // Focus on the code input in player view for immediate use
        if (this.state.currentView === 'player' && this.elements.codeInput) {
            this.elements.codeInput.focus();
            
            // Show a welcome message to guide users
            this.showFeedback('Enter a 10-digit code to play a song!', true);
        }
        
        console.log('Jukebox Web App initialized.');
    },

    /**
     * Cache DOM elements for later use
     */
    cacheElements: function() {
        // Player view elements
        this.elements.playerView = document.getElementById('player-view');
        this.elements.adminView = document.getElementById('admin-view');
        this.elements.viewToggleBtn = document.getElementById('view-toggle');
        this.elements.codeInput = document.getElementById('code-input');
        this.elements.submitCodeBtn = document.getElementById('submit-code');
        this.elements.clearCodeBtn = document.getElementById('clear-code');
        this.elements.feedbackArea = document.getElementById('feedback-area');
        
        // Admin interface elements
        this.elements.mappingForm = document.getElementById('mapping-form');
        this.elements.codeInputAdmin = document.getElementById('code-input-admin');
        this.elements.trackURIInput = document.getElementById('track-uri-input');
        this.elements.trackNameInput = document.getElementById('track-name-input');
        this.elements.artistNameInput = document.getElementById('artist-name-input');
        this.elements.saveMappingBtn = document.getElementById('save-mapping-btn');
        this.elements.clearFormBtn = document.getElementById('clear-form-btn');
        this.elements.formFeedback = document.getElementById('form-feedback');
        this.elements.codeFeedback = document.getElementById('code-feedback');
        this.elements.uriFeedback = document.getElementById('uri-feedback');
        this.elements.mappingsList = document.getElementById('mappings-list');
        this.elements.noMappingsMessage = document.getElementById('no-mappings-message');
        this.elements.searchInput = document.getElementById('search-input');
        this.elements.refreshListBtn = document.getElementById('refresh-list-btn');
        this.elements.getTrackInfoBtn = document.getElementById('get-track-info-btn');
        
        // Edit modal elements
        this.elements.editModal = document.getElementById('edit-modal');
        this.elements.closeModalBtn = document.querySelector('.close-modal');
        this.elements.editMappingForm = document.getElementById('edit-mapping-form');
        this.elements.editOriginalCode = document.getElementById('edit-original-code');
        this.elements.editCodeInput = document.getElementById('edit-code-input');
        this.elements.editTrackURIInput = document.getElementById('edit-track-uri-input');
        this.elements.editTrackNameInput = document.getElementById('edit-track-name-input');
        this.elements.editArtistNameInput = document.getElementById('edit-artist-name-input');
        this.elements.updateMappingBtn = document.getElementById('update-mapping-btn');
        this.elements.cancelEditBtn = document.getElementById('cancel-edit-btn');
        this.elements.editFormFeedback = document.getElementById('edit-form-feedback');
        this.elements.editCodeFeedback = document.getElementById('edit-code-feedback');
        this.elements.editURIFeedback = document.getElementById('edit-uri-feedback');
        this.elements.editGetTrackInfoBtn = document.getElementById('edit-get-track-info-btn');
        
        // Spotify Authentication elements
        this.elements.spotifyLoginBtn = document.getElementById('spotify-login-btn');
        this.elements.spotifyLogoutBtn = document.getElementById('spotify-logout-btn');
        this.elements.spotifyStatusMessage = document.getElementById('spotify-status-message');
        this.elements.spotifyAuthFeedback = document.getElementById('spotify-auth-feedback');
    },

    /**
     * Set up event listeners
     */
    setupEventListeners: function() {
        // View toggle button
        this.elements.viewToggleBtn.addEventListener('click', () => {
            this.toggleView();
        });

        // Code input events
        this.elements.codeInput.addEventListener('input', (e) => {
            this.validateCodeInput(e.target);
            
            // Auto-submit when 10 digits are entered
            if (e.target.value.length === 10) {
                this.submitCode();
            }
        });

        // Submit button
        this.elements.submitCodeBtn.addEventListener('click', () => {
            this.submitCode();
        });

        // Clear button
        this.elements.clearCodeBtn.addEventListener('click', () => {
            this.clearCode();
        });

        // Initialize the Enter key handler
        this.enableEnterKeyHandler();
        
        // Admin interface event listeners
        if (this.elements.mappingForm) {
            // Form submission
            this.elements.mappingForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddMapping();
            });
            
            // Clear form button
            this.elements.clearFormBtn.addEventListener('click', () => {
                this.clearMappingForm();
            });
            
            // Form input validation
            this.elements.codeInputAdmin.addEventListener('input', (e) => {
                this.validateAdminCodeInput(e.target);
            });
            
            this.elements.trackURIInput.addEventListener('input', (e) => {
                this.validateTrackURIInput(e.target);
            });
            
            // Search input
            this.elements.searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
            
            // Refresh list button
            this.elements.refreshListBtn.addEventListener('click', () => {
                this.refreshMappingsList();
            });
            
            // Get track info button
            this.elements.getTrackInfoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleGetTrackInfo();
            });
            
            // Edit form track info button
            this.elements.editGetTrackInfoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleGetEditTrackInfo();
            });
        }
        
        // Edit modal event listeners
        if (this.elements.editModal) {
            // Close modal
            this.elements.closeModalBtn.addEventListener('click', () => {
                this.closeEditModal();
            });
            
            // Close when clicking outside modal
            window.addEventListener('click', (e) => {
                if (e.target === this.elements.editModal) {
                    this.closeEditModal();
                }
            });
            
            // Cancel edit button
            this.elements.cancelEditBtn.addEventListener('click', () => {
                this.closeEditModal();
            });
            
            // Form submission
            this.elements.editMappingForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleUpdateMapping();
            });
            
            // Form input validation
            this.elements.editCodeInput.addEventListener('input', (e) => {
                this.validateEditCodeInput(e.target);
            });
            
            this.elements.editTrackURIInput.addEventListener('input', (e) => {
                this.validateEditTrackURIInput(e.target);
            });
        }
        
        // Spotify Authentication event listeners
        if (this.elements.spotifyLoginBtn && this.elements.spotifyLogoutBtn) {
            this.elements.spotifyLoginBtn.addEventListener('click', () => {
                this.SpotifyAuth.login();
            });
            
            this.elements.spotifyLogoutBtn.addEventListener('click', () => {
                this.SpotifyAuth.logout();
            });
        }
    },

    /**
     * Toggle between player and admin views
     */
    toggleView: function() {
        // Determine the new view
        const newView = this.state.currentView === 'player' ? 'admin' : 'player';
        
        // Update the UI
        if (newView === 'admin') {
            // Switch to admin view
            this.elements.playerView.classList.remove('active');
            this.elements.adminView.classList.add('active');
            this.elements.viewToggleBtn.textContent = 'Switch to Player View';
            
            // Refresh mappings list when switching to admin view
            this.refreshMappingsList();
        } else {
            // Switch to player view
            this.elements.adminView.classList.remove('active');
            this.elements.playerView.classList.add('active');
            this.elements.viewToggleBtn.textContent = 'Switch to Admin View';
        }
        
        // Update the URL without reloading the page
        const url = new URL(window.location);
        url.searchParams.set('view', newView);
        window.history.pushState({}, '', url);
        
        // Update the state
        this.state.currentView = newView;
        
        console.log(`Switched to ${this.state.currentView} view`);
    },

    /**
     * Validate code input and show feedback
     * @param {Element} inputElement - Code input element
     */
    validateCodeInput: function(inputElement) {
        // Clear any previous error feedback since we're actively typing
        this.clearFeedback();
        
        // Get the input value
        const value = inputElement.value;
        
        // Only allow digits
        if (!/^\d*$/.test(value)) {
            inputElement.value = value.replace(/\D/g, '');
            this.showFeedback('Please enter numbers only', false);
            return;
        }
        
        // Provide helpful feedback based on digit count
        if (value.length >= 1 && value.length <= 3) {
            this.showFeedback(`Enter ${10 - value.length} more digits...`, true);
        } else if (value.length > 3 && value.length <= 6) {
            this.showFeedback(`Enter ${10 - value.length} more digits...`, true);
        } else if (value.length > 6 && value.length < 10) {
            this.showFeedback(`Enter ${10 - value.length} more digit${10 - value.length === 1 ? '' : 's'}...`, true);
        }
        
        // Ensure it's 10 digits or less
        if (value.length > 10) {
            inputElement.value = value.substring(0, 10);
        }
    },

    /**
     * Submit the entered code
     */
    submitCode: function() {
        const code = this.elements.codeInput.value;
        
        // Validate code length
        if (code.length !== 10) {
            this.showFeedback('Please enter exactly 10 digits', false);
            return;
        }
        
        // Temporarily disable the Enter key handler to prevent double submissions
        this.disableEnterKeyHandler();
        
        // Call the handle code input function
        const result = this.handleCodeInput(code);
        
        // If the code was found, we focus back on the input to prepare for next code
        // but don't clear it immediately so the user can see what was entered
        if (result) {
            // Automatically focus back on the input field for the next code
            this.elements.codeInput.focus();
            
            // Clear the input after a short delay to allow the user to see what was entered
            setTimeout(() => {
                this.clearCode();
                // Re-enable the Enter key handler after clearing the input
                this.enableEnterKeyHandler();
            }, 3000);
        } else {
            // Re-enable the Enter key handler immediately for invalid codes
            this.enableEnterKeyHandler();
        }
    },

    /**
     * Disable the Enter key handler to prevent multiple submissions
     */
    disableEnterKeyHandler: function() {
        // Remove the existing event listener if it exists
        if (this._enterKeyHandler) {
            this.elements.codeInput.removeEventListener('keypress', this._enterKeyHandler);
        }
    },

    /**
     * Enable the Enter key handler
     */
    enableEnterKeyHandler: function() {
        // Define the handler if it doesn't exist
        if (!this._enterKeyHandler) {
            this._enterKeyHandler = (e) => {
                if (e.key === 'Enter') {
                    this.submitCode();
                }
            };
        }
        
        // Add the event listener
        this.elements.codeInput.addEventListener('keypress', this._enterKeyHandler);
    },

    /**
     * Clear the code input and feedback
     */
    clearCode: function() {
        this.elements.codeInput.value = '';
        this.clearFeedback();
        this.elements.codeInput.focus();
    },

    /**
     * Show feedback message
     */
    showFeedback: function(message, isSuccess) {
        this.elements.feedbackArea.textContent = message;
        this.elements.feedbackArea.className = 'feedback-area';
        
        if (isSuccess) {
            this.elements.feedbackArea.classList.add('feedback-success');
        } else {
            this.elements.feedbackArea.classList.add('feedback-error');
        }
    },

    /**
     * Clear feedback message
     */
    clearFeedback: function() {
        this.elements.feedbackArea.textContent = '';
        this.elements.feedbackArea.className = 'feedback-area';
    },

    /**
     * Handle code input - look up code in storage and return track info
     * @param {string} code - 3-digit code to look up
     * @returns {boolean} True if code exists, false otherwise
     */
    handleCodeInput: function(code) {
        console.log(`Code entered: ${code}`);
        
        // Look up the code in storage
        const result = this.CodeMappingsStorage.getMappingByCode(code);
        
        if (result.success) {
            // Track found for this code
            const mapping = result.data;
            console.log(`Found track: ${mapping.trackName} by ${mapping.artistName}`);
            console.log(`Track URI: ${mapping.trackURI}`);
            
            // Play the Spotify track if player is ready
            if (this.state.spotifyAuthenticated && this.SpotifyPlayer.isReady) {
                console.log('DIAGNOSTIC - Attempting to play track with SpotifyPlayer');
                
                // Get diagnostic info for logging
                this.SpotifyPlayer.getDiagnosticInfo();
                
                // Update feedback with track info
                this.showFeedback(`Playing: ${mapping.trackName} by ${mapping.artistName}`, true);
                
                this.SpotifyPlayer.playTrack(mapping.trackURI)
                    .then(() => {
                        console.log('Track playback started successfully');
                    })
                    .catch(error => {
                        console.error('Failed to play track:', error);
                        this.showFeedback('Could not play track. Please try again.', false);
                    });
            } else if (!this.state.spotifyAuthenticated) {
                // Not authenticated with Spotify
                console.log('DIAGNOSTIC - Cannot play track: Not authenticated with Spotify');
                this.showFeedback('Please connect to Spotify first', false);
                
                if (this.SpotifyPlayer.elements.errorMessage) {
                    this.SpotifyPlayer.showPlayerMessage('Please connect to Spotify to play tracks', true);
                }
            } else {
                // Player not ready
                console.log('DIAGNOSTIC - Cannot play track: Player not ready');
                this.showFeedback('Player not ready yet. Please wait...', false);
                
                if (this.SpotifyPlayer.elements.errorMessage) {
                    this.SpotifyPlayer.showPlayerMessage('Player starting up. Please try again in a moment.', true);
                }
            }
            
            return true;
        } else {
            // No track found for this code
            console.log(`No track found for code: ${code}`);
            this.showFeedback(`No song found for code ${code}. Please try another code.`, false);
            return false;
        }
    },

    /**
     * Manage code-to-track mappings in the admin view
     */
    manageCodeMappings: function() {
        console.log('Initializing code mappings management...');
        
        // Initial load of mappings
        this.refreshMappingsList();
    },
    
    /**
     * Refresh the mappings list in the admin view
     */
    refreshMappingsList: function() {
        const result = this.CodeMappingsStorage.getAllMappings();
        
        if (result.success) {
            // Cache the mappings
            this.state.mappingsCache = result.data;
            
            // Render the mappings
            this.renderMappingsList(result.data);
        } else {
            console.error('Failed to load mappings:', result.message);
            this.showFormFeedback('Failed to load mappings. Please try again.', false);
        }
    },
    
    /**
     * Render the mappings list in the admin view
     * @param {Array} mappings - Array of mapping objects
     */
    renderMappingsList: function(mappings) {
        // Clear the current list
        this.elements.mappingsList.innerHTML = '';
        
        // Show/hide no mappings message
        if (mappings.length === 0) {
            this.elements.noMappingsMessage.style.display = 'block';
            return;
        } else {
            this.elements.noMappingsMessage.style.display = 'none';
        }
        
        // Create and append rows for each mapping
        mappings.forEach(mapping => {
            const row = document.createElement('tr');
            
            // Create cells
            const codeCell = document.createElement('td');
            codeCell.textContent = mapping.code;
            
            const trackCell = document.createElement('td');
            
            // Create Spotify link from URI
            const trackLink = document.createElement('a');
            
            // Convert spotify:track:id format to https://open.spotify.com/track/id
            const trackId = mapping.trackURI.split(':')[2];
            const spotifyUrl = `https://open.spotify.com/track/${trackId}`;
            
            trackLink.href = spotifyUrl;
            trackLink.textContent = mapping.trackName;
            trackLink.target = '_blank'; // Open in new tab
            trackLink.className = 'spotify-link';
            trackLink.title = 'Open in Spotify';
            
            trackCell.appendChild(trackLink);
            
            const artistCell = document.createElement('td');
            artistCell.textContent = mapping.artistName;
            
            const actionsCell = document.createElement('td');
            
            // Create action buttons
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.className = 'admin-button edit-button';
            editBtn.addEventListener('click', () => {
                this.openEditModal(mapping);
            });
            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.className = 'admin-button delete-button';
            deleteBtn.addEventListener('click', () => {
                this.handleDeleteMapping(mapping.code);
            });
            
            // Append buttons to actions cell
            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);
            
            // Append cells to row
            row.appendChild(codeCell);
            row.appendChild(trackCell);
            row.appendChild(artistCell);
            row.appendChild(actionsCell);
            
            // Append row to table
            this.elements.mappingsList.appendChild(row);
        });
    },
    
    /**
     * Handle adding a new mapping
     */
    handleAddMapping: function() {
        // Get form values
        const code = this.elements.codeInputAdmin.value.trim();
        const trackURI = this.elements.trackURIInput.value.trim();
        const trackName = this.elements.trackNameInput.value.trim();
        const artistName = this.elements.artistNameInput.value.trim();
        
        // Validate inputs
        if (!this.validateInputs(code, trackURI, trackName, artistName)) {
            return;
        }
        
        // Create mapping object
        const mapping = {
            code,
            trackURI,
            trackName,
            artistName
        };
        
        // Add mapping to storage
        const result = this.CodeMappingsStorage.addMapping(mapping);
        
        if (result.success) {
            // Show success message
            this.showFormFeedback('Mapping added successfully!', true);
            
            // Clear the form
            this.clearMappingForm();
            
            // Refresh the mappings list
            this.refreshMappingsList();
        } else {
            // Show error message
            this.showFormFeedback(`Failed to add mapping: ${result.message}`, false);
            
            // Show specific feedback for duplicate code
            if (result.error === 'DUPLICATE_CODE') {
                this.showInputFeedback(this.elements.codeFeedback, 'This code is already in use.', false);
            }
        }
    },
    
    /**
     * Validate admin form inputs
     * @param {string} code - 3-digit code
     * @param {string} trackURI - Spotify track URI
     * @param {string} trackName - Track name
     * @param {string} artistName - Artist name
     * @returns {boolean} True if all inputs are valid
     */
    validateInputs: function(code, trackURI, trackName, artistName) {
        let isValid = true;
        
        // Clear all feedback
        this.clearAllFeedback();
        
        // Validate code
        const codeValidation = this.CodeMappingsStorage._validateCode(code);
        if (!codeValidation.valid) {
            this.showInputFeedback(this.elements.codeFeedback, codeValidation.message, false);
            isValid = false;
        }
        
        // Validate track URI
        const uriValidation = this.CodeMappingsStorage._validateTrackURI(trackURI);
        if (!uriValidation.valid) {
            this.showInputFeedback(this.elements.uriFeedback, uriValidation.message, false);
            isValid = false;
        }
        
        // Validate track name
        if (!trackName) {
            this.showFormFeedback('Track name is required.', false);
            isValid = false;
        }
        
        // Validate artist name
        if (!artistName) {
            this.showFormFeedback('Artist name is required.', false);
            isValid = false;
        }
        
        return isValid;
    },
    
    /**
     * Clear the mapping form
     */
    clearMappingForm: function() {
        this.elements.mappingForm.reset();
        this.clearAllFeedback();
    },
    
    /**
     * Clear all form feedback
     */
    clearAllFeedback: function() {
        this.elements.formFeedback.textContent = '';
        this.elements.formFeedback.className = 'form-feedback';
        this.elements.codeFeedback.textContent = '';
        this.elements.uriFeedback.textContent = '';
        this.elements.editFormFeedback.textContent = '';
        this.elements.editFormFeedback.className = 'form-feedback';
        this.elements.editCodeFeedback.textContent = '';
        this.elements.editURIFeedback.textContent = '';
    },
    
    /**
     * Show feedback message for a specific input
     * @param {Element} element - Feedback element
     * @param {string} message - Feedback message
     * @param {boolean} isSuccess - Whether the feedback is for success
     */
    showInputFeedback: function(element, message, isSuccess) {
        element.textContent = message;
        element.className = 'input-feedback';
        
        if (isSuccess) {
            element.classList.add('feedback-success');
        } else {
            element.classList.add('feedback-error');
        }
    },
    
    /**
     * Show feedback in the form feedback area
     * @param {string} message - Feedback message
     * @param {boolean} isSuccess - Whether the feedback is for success
     */
    showFormFeedback: function(message, isSuccess) {
        this.elements.formFeedback.textContent = message;
        this.elements.formFeedback.className = 'form-feedback';
        
        if (isSuccess) {
            this.elements.formFeedback.classList.add('feedback-success');
        } else {
            this.elements.formFeedback.classList.add('feedback-error');
        }
    },
    
    /**
     * Show feedback in the edit form feedback area
     * @param {string} message - Feedback message
     * @param {boolean} isSuccess - Whether the feedback is for success
     */
    showEditFormFeedback: function(message, isSuccess) {
        this.elements.editFormFeedback.textContent = message;
        this.elements.editFormFeedback.className = 'form-feedback';
        
        if (isSuccess) {
            this.elements.editFormFeedback.classList.add('feedback-success');
        } else {
            this.elements.editFormFeedback.classList.add('feedback-error');
        }
    },
    
    /**
     * Validate code input in the admin form
     * @param {Element} inputElement - Code input element
     */
    validateAdminCodeInput: function(inputElement) {
        // Clear any previous feedback
        this.elements.codeFeedback.textContent = '';
        
        // Get the input value
        const value = inputElement.value;
        
        // Only allow digits
        if (!/^\d*$/.test(value)) {
            inputElement.value = value.replace(/\D/g, '');
            this.showInputFeedback(this.elements.codeFeedback, 'Please enter numbers only', false);
        }
        
        // Ensure it's 10 digits or less
        if (value.length > 10) {
            inputElement.value = value.substring(0, 10);
        }
    },
    
    /**
     * Validate code input in the edit form
     * @param {Element} inputElement - Code input element
     */
    validateEditCodeInput: function(inputElement) {
        // Clear any previous feedback
        this.elements.editCodeFeedback.textContent = '';
        
        // Get the input value
        const value = inputElement.value;
        
        // Only allow digits
        if (!/^\d*$/.test(value)) {
            inputElement.value = value.replace(/\D/g, '');
            this.showInputFeedback(this.elements.editCodeFeedback, 'Please enter numbers only', false);
        }
        
        // Ensure it's 10 digits or less
        if (value.length > 10) {
            inputElement.value = value.substring(0, 10);
        }
    },
    
    /**
     * Validate track URI input
     * @param {Element} inputElement - Track URI input element
     */
    validateTrackURIInput: function(inputElement) {
        // Clear any previous feedback
        this.elements.uriFeedback.textContent = '';
    },
    
    /**
     * Validate track URI input in the edit form
     * @param {Element} inputElement - Track URI input element
     */
    validateEditTrackURIInput: function(inputElement) {
        // Clear any previous feedback
        this.elements.editURIFeedback.textContent = '';
    },
    
    /**
     * Handle search input
     * @param {string} query - Search query
     */
    handleSearch: function(query) {
        query = query.toLowerCase().trim();
        
        // If no query, show all mappings
        if (!query) {
            this.renderMappingsList(this.state.mappingsCache);
            return;
        }
        
        // Filter mappings based on query
        const filteredMappings = this.state.mappingsCache.filter(mapping => {
            return mapping.code.includes(query) || 
                   mapping.trackName.toLowerCase().includes(query) || 
                   mapping.artistName.toLowerCase().includes(query);
        });
        
        // Render filtered mappings
        this.renderMappingsList(filteredMappings);
    },
    
    /**
     * Open edit modal for a mapping
     * @param {Object} mapping - Mapping to edit
     */
    openEditModal: function(mapping) {
        // Store the original mapping
        this.state.editingMapping = mapping;
        
        // Fill the form
        this.elements.editOriginalCode.value = mapping.code;
        this.elements.editCodeInput.value = mapping.code;
        this.elements.editTrackURIInput.value = mapping.trackURI;
        this.elements.editTrackNameInput.value = mapping.trackName;
        this.elements.editArtistNameInput.value = mapping.artistName;
        
        // Clear any previous feedback
        this.clearAllFeedback();
        
        // Show the modal
        this.elements.editModal.style.display = 'block';
    },
    
    /**
     * Close edit modal
     */
    closeEditModal: function() {
        this.elements.editModal.style.display = 'none';
        this.state.editingMapping = null;
        this.elements.editMappingForm.reset();
        this.clearAllFeedback();
    },
    
    /**
     * Handle updating a mapping
     */
    handleUpdateMapping: function() {
        // Get form values
        const originalCode = this.elements.editOriginalCode.value.trim();
        const newCode = this.elements.editCodeInput.value.trim();
        const trackURI = this.elements.editTrackURIInput.value.trim();
        const trackName = this.elements.editTrackNameInput.value.trim();
        const artistName = this.elements.editArtistNameInput.value.trim();
        
        // Validate inputs
        let isValid = true;
        
        // Clear all feedback
        this.clearAllFeedback();
        
        // Validate code
        const codeValidation = this.CodeMappingsStorage._validateCode(newCode);
        if (!codeValidation.valid) {
            this.showInputFeedback(this.elements.editCodeFeedback, codeValidation.message, false);
            isValid = false;
        }
        
        // Validate track URI
        const uriValidation = this.CodeMappingsStorage._validateTrackURI(trackURI);
        if (!uriValidation.valid) {
            this.showInputFeedback(this.elements.editURIFeedback, uriValidation.message, false);
            isValid = false;
        }
        
        // Validate track name and artist name
        if (!trackName || !artistName) {
            this.showEditFormFeedback('All fields are required.', false);
            isValid = false;
        }
        
        if (!isValid) {
            return;
        }
        
        // Create updated mapping object
        const updatedMapping = {
            trackURI,
            trackName,
            artistName
        };
        
        // Check if code has changed
        if (originalCode !== newCode) {
            // We need to delete the old mapping and add a new one with the new code
            
            // Check if new code already exists
            const checkResult = this.CodeMappingsStorage.getMappingByCode(newCode);
            if (checkResult.success) {
                // Code is already in use
                this.showInputFeedback(this.elements.editCodeFeedback, 'This code is already in use.', false);
                return;
            }
            
            // Delete old mapping
            const deleteResult = this.CodeMappingsStorage.deleteMapping(originalCode);
            if (!deleteResult.success) {
                this.showEditFormFeedback(`Failed to update mapping: ${deleteResult.message}`, false);
                return;
            }
            
            // Add new mapping with new code
            updatedMapping.code = newCode;
            const addResult = this.CodeMappingsStorage.addMapping(updatedMapping);
            
            if (addResult.success) {
                // Show success message
                this.showEditFormFeedback('Mapping updated successfully!', true);
                
                // Refresh the mappings list
                this.refreshMappingsList();
                
                // Close the modal after a short delay
                setTimeout(() => {
                    this.closeEditModal();
                }, 1500);
            } else {
                // Show error message
                this.showEditFormFeedback(`Failed to update mapping: ${addResult.message}`, false);
                
                // Try to restore the original mapping
                this.CodeMappingsStorage.addMapping(this.state.editingMapping);
            }
        } else {
            // Just update the existing mapping
            const result = this.CodeMappingsStorage.updateMapping(originalCode, updatedMapping);
            
            if (result.success) {
                // Show success message
                this.showEditFormFeedback('Mapping updated successfully!', true);
                
                // Refresh the mappings list
                this.refreshMappingsList();
                
                // Close the modal after a short delay
                setTimeout(() => {
                    this.closeEditModal();
                }, 1500);
            } else {
                // Show error message
                this.showEditFormFeedback(`Failed to update mapping: ${result.message}`, false);
            }
        }
    },
    
    /**
     * Handle deleting a mapping
     * @param {string} code - Code of the mapping to delete
     */
    handleDeleteMapping: function(code) {
        // Confirm deletion
        if (!confirm(`Are you sure you want to delete the mapping for code ${code}?`)) {
            return;
        }
        
        // Delete mapping
        const result = this.CodeMappingsStorage.deleteMapping(code);
        
        if (result.success) {
            // Refresh the mappings list
            this.refreshMappingsList();
        } else {
            alert(`Failed to delete mapping: ${result.message}`);
        }
    },
    
    /**
     * Initialize Spotify SDK
     * Loads the Spotify Web Playback SDK script and initializes the player
     */
    initSpotifySDK: function() {
        console.log('Initializing Spotify SDK...');
        
        // Initialize the Spotify Player module
        this.SpotifyPlayer.initialize();
    },

    /**
     * Spotify Player Module
     * Handles playback of tracks using Spotify Web Playback SDK
     */
    SpotifyPlayer: {
        // Properties
        deviceId: null,
        player: null,
        isReady: false,
        isPaused: true,
        currentTrack: null,
        userInitiatedPause: false, // New flag to track user pause actions
        playbackStarted: false, // New flag to track if playback has successfully started
        
        // DOM Elements
        elements: {
            playerContainer: null,
            trackInfo: null,
            albumArt: null,
            artistName: null,
            trackName: null,
            playPauseButton: null,
            volumeControl: null,
            progressBar: null,
            currentTime: null,
            totalTime: null,
            errorMessage: null
        },
        
        /**
         * Initialize the Spotify Web Playback SDK
         */
        initialize: function() {
            console.log('Initializing Spotify Web Playback SDK...');
            
            // Cache DOM elements
            this.cacheElements();
            
            // Check if user is authenticated with Spotify
            if (!JukeboxApp.state.spotifyAuthenticated) {
                this.showPlayerMessage('Please connect to Spotify to play tracks');
                return;
            }
            
            // Diagnostics: Check Spotify account type
            this.checkSpotifyAccountType()
                .then(isPremium => {
                    console.log('DIAGNOSTIC - Spotify Premium account:', isPremium ? 'Yes' : 'No');
                    if (!isPremium) {
                        console.warn('DIAGNOSTIC - Spotify Web Playback SDK requires a Premium account');
                        this.showPlayerMessage('Premium account required for playback', true);
                    }
                })
                .catch(error => {
                    console.error('DIAGNOSTIC - Error checking Spotify account type:', error);
                });
                
            // Load the Spotify Web Playback SDK script
            this.loadSpotifyScript()
                .then(() => {
                    // Script loaded successfully, initialize the player
                    this.initializePlayer();
                })
                .catch(error => {
                    console.error('Failed to load Spotify Web Playback SDK:', error);
                    this.showPlayerMessage('Failed to load Spotify player. Please try refreshing the page.');
                });
        },
        
        /**
         * Check if the user has a Spotify Premium account
         * @returns {Promise<boolean>} Resolves to true if user has Premium, false otherwise
         */
        checkSpotifyAccountType: function() {
            return new Promise((resolve, reject) => {
                // Get access token
                const token = localStorage.getItem(JukeboxApp.SpotifyAuth.ACCESS_TOKEN_KEY);
                
                if (!token) {
                    console.warn('DIAGNOSTIC - No access token found when checking account type');
                    reject(new Error('No Spotify access token available'));
                    return;
                }
                
                // Check user's account type using the Spotify Web API
                fetch('https://api.spotify.com/v1/me', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })
                .then(response => {
                    console.log('DIAGNOSTIC - Account check response status:', response.status);
                    if (!response.ok) {
                        throw new Error(`Account check failed: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('DIAGNOSTIC - Account data received:', data);
                    // Check if product field exists and is 'premium'
                    const isPremium = data.product === 'premium';
                    console.log('DIAGNOSTIC - Account type:', data.product);
                    console.log('DIAGNOSTIC - Is Premium:', isPremium);
                    resolve(isPremium);
                })
                .catch(error => {
                    console.error('DIAGNOSTIC - Error fetching account data:', error);
                    reject(error);
                });
            });
        },
        
        /**
         * Cache DOM elements related to the player
         */
        cacheElements: function() {
            this.elements.playerContainer = document.querySelector('.player-container');
            
            // Create player elements if they don't exist
            if (!document.getElementById('spotify-player-ui')) {
                this.createPlayerUI();
            }
            
            // Cache the created elements
            this.elements.trackInfo = document.getElementById('track-info');
            this.elements.albumArt = document.getElementById('album-art');
            this.elements.artistName = document.getElementById('artist-name');
            this.elements.trackName = document.getElementById('track-name');
            this.elements.playPauseButton = document.getElementById('play-pause-button');
            this.elements.volumeControl = document.getElementById('volume-control');
            this.elements.progressBar = document.getElementById('progress-bar');
            this.elements.currentTime = document.getElementById('current-time');
            this.elements.totalTime = document.getElementById('total-time');
            this.elements.errorMessage = document.getElementById('player-error-message');
        },
        
        /**
         * Create the player UI elements
         */
        createPlayerUI: function() {
            // Replace the placeholder with our player UI
            if (this.elements.playerContainer) {
                this.elements.playerContainer.innerHTML = `
                    <div id="spotify-player-ui" class="spotify-player">
                        <div id="player-error-message" class="player-message"></div>
                        <div id="album-art" class="album-art">
                            <img src="placeholder-album.jpg" alt="Album Artwork" class="artwork-img">
                        </div>
                        <div id="track-info" class="track-info">
                            <div id="track-name" class="track-name">No track playing</div>
                            <div id="artist-name" class="artist-name">Select a track to play</div>
                        </div>
                        <div class="player-controls">
                            <button id="play-pause-button" class="control-button play-button" disabled>
                                <span class="play-icon">▶</span>
                                <span class="pause-icon" style="display:none;">❚❚</span>
                            </button>
                            <div class="progress-container">
                                <div id="current-time" class="time-display">0:00</div>
                                <div class="progress-bar-container">
                                    <div id="progress-bar" class="progress-bar"></div>
                                </div>
                                <div id="total-time" class="time-display">0:00</div>
                            </div>
                            <div class="volume-container">
                                <label for="volume-control" class="volume-icon">🔊</label>
                                <input type="range" id="volume-control" class="volume-control" min="0" max="100" value="80">
                            </div>
                        </div>
                    </div>
                `;
            }
        },
        
        /**
         * Display a message in the player area
         * @param {string} message - The message to display
         * @param {boolean} isError - Whether this is an error message
         */
        showPlayerMessage: function(message, isError = false) {
            if (this.elements.errorMessage) {
                this.elements.errorMessage.textContent = message;
                this.elements.errorMessage.style.display = 'block';
                
                if (isError) {
                    this.elements.errorMessage.classList.add('error');
                } else {
                    this.elements.errorMessage.classList.remove('error');
                }
            }
        },
        
        /**
         * Hide the player message
         */
        hidePlayerMessage: function() {
            if (this.elements.errorMessage) {
                this.elements.errorMessage.style.display = 'none';
            }
        },
        
        /**
         * Load the Spotify Web Playback SDK script
         * @returns {Promise} Resolves when script is loaded
         */
        loadSpotifyScript: function() {
            return new Promise((resolve, reject) => {
                // Check if script is already loaded
                if (window.Spotify) {
                    resolve();
                    return;
                }
                
                // Create script element
                const script = document.createElement('script');
                script.src = 'https://sdk.scdn.co/spotify-player.js';
                script.async = true;
                
                // Set up callbacks
                script.onload = () => {
                    console.log('Spotify Web Playback SDK script loaded');
                    resolve();
                };
                
                script.onerror = (error) => {
                    console.error('Error loading Spotify Web Playback SDK script', error);
                    reject(new Error('Failed to load Spotify Web Playback SDK'));
                };
                
                // Add the script to the document
                document.body.appendChild(script);
                
                // Set up the Spotify.Player.ready callback
                window.onSpotifyWebPlaybackSDKReady = () => {
                    console.log('Spotify Web Playback SDK is ready');
                };
            });
        },
        
        /**
         * Initialize the Spotify Player
         */
        initializePlayer: function() {
            // Get access token
            const token = localStorage.getItem(JukeboxApp.SpotifyAuth.ACCESS_TOKEN_KEY);
            
            if (!token) {
                this.showPlayerMessage('Spotify access token not found. Please reconnect to Spotify.', true);
                return;
            }
            
            // Wait for the SDK to be ready
            if (!window.Spotify) {
                console.log('DIAGNOSTIC - Spotify SDK not yet available, retrying initialization...');
                setTimeout(() => {
                    this.initializePlayer();
                }, 200);
                return;
            }
            
            console.log('DIAGNOSTIC - Creating Spotify player instance');
            
            // Create the player
            this.player = new Spotify.Player({
                name: 'Jukebox Web App Player',
                getOAuthToken: callback => {
                    // Provide the current access token
                    console.log('DIAGNOSTIC - getOAuthToken called by SDK');
                    callback(token);
                },
                volume: 0.8 // Default volume level (0-1)
            });
            
            // Error handling
            this.player.addListener('initialization_error', ({ message }) => {
                console.error('Spotify Player initialization error:', message);
                console.error('DIAGNOSTIC - Player initialization error details:', message);
                this.showPlayerMessage(`Player initialization error: ${message}`, true);
            });
            
            this.player.addListener('authentication_error', ({ message }) => {
                console.error('Spotify Player authentication error:', message);
                console.error('DIAGNOSTIC - Player authentication error details:', message);
                this.showPlayerMessage('Authentication failed. Please reconnect to Spotify.', true);
            });
            
            this.player.addListener('account_error', ({ message }) => {
                console.error('Spotify Player account error:', message);
                console.error('DIAGNOSTIC - Player account error details (likely not Premium):', message);
                this.showPlayerMessage('Premium account required for playback.', true);
            });
            
            this.player.addListener('playback_error', ({ message }) => {
                console.error('Spotify Player playback error:', message);
                console.error('DIAGNOSTIC - Player playback error details:', message);
                this.showPlayerMessage(`Playback error: ${message}`, true);
            });
            
            // Add new listener for playback_error events
            this.player.addListener('playback_error', ({ message }) => {
                console.error('Spotify Player playback error:', message);
                console.error('DIAGNOSTIC - Player playback error details:', message);
                this.showPlayerMessage(`Playback error: ${message}`, true);
                
                // Reset playback started flag to indicate autoplay failed
                this.playbackStarted = false;
                
                // Show play hint again since autoplay likely failed
                this.showPlayHint();
            });
            
            // Playback status updates
            this.player.addListener('player_state_changed', state => {
                console.log('DIAGNOSTIC - Player state changed:', state);
                this.handlePlayerStateChanged(state);
            });
            
            // Ready event
            this.player.addListener('ready', ({ device_id }) => {
                console.log('Spotify Player ready with Device ID:', device_id);
                console.log('DIAGNOSTIC - Player ready event fired with device ID:', device_id);
                this.deviceId = device_id;
                this.isReady = true;
                this.hidePlayerMessage();
                
                // Enable UI controls
                this.updatePlayerControls();
                
                // Show ready message
                this.showPlayerMessage('Player ready. Enter a code to play a track.');
            });
            
            // Not ready event
            this.player.addListener('not_ready', ({ device_id }) => {
                console.warn('Spotify Player device is not ready:', device_id);
                console.warn('DIAGNOSTIC - Player not_ready event fired with device ID:', device_id);
                this.isReady = false;
                this.showPlayerMessage('Player disconnected. Trying to reconnect...');
            });
            
            // Connect to Spotify
            console.log('DIAGNOSTIC - Connecting Spotify player...');
            this.player.connect()
                .then(success => {
                    if (!success) {
                        throw new Error('Failed to connect to Spotify');
                    }
                    console.log('Spotify Player connected successfully');
                    console.log('DIAGNOSTIC - Player connected successfully, waiting for ready event...');
                })
                .catch(error => {
                    console.error('Failed to connect Spotify Player:', error);
                    console.error('DIAGNOSTIC - Player connection error:', error);
                    this.showPlayerMessage('Failed to connect to Spotify. Please try again.', true);
                });
                
            // Set up player UI event listeners
            this.setupPlayerEventListeners();
        },
        
        /**
         * Set up event listeners for player controls
         */
        setupPlayerEventListeners: function() {
            // Play/Pause button
            if (this.elements.playPauseButton) {
                this.elements.playPauseButton.addEventListener('click', () => {
                    this.togglePlayback();
                });
            }
            
            // Volume control
            if (this.elements.volumeControl) {
                this.elements.volumeControl.addEventListener('input', (e) => {
                    const volume = parseInt(e.target.value, 10) / 100;
                    this.setVolume(volume);
                });
            }
            
            // Progress bar (seek)
            if (this.elements.progressBar && this.elements.progressBar.parentElement) {
                this.elements.progressBar.parentElement.addEventListener('click', (e) => {
                    if (!this.isReady || !this.player) return;
                    
                    const progressContainer = this.elements.progressBar.parentElement;
                    const rect = progressContainer.getBoundingClientRect();
                    const seekPercentage = (e.clientX - rect.left) / rect.width;
                    
                    // Get the current state to find the track duration
                    this.player.getCurrentState().then(state => {
                        if (state && state.duration) {
                            const seekPosition = Math.floor(state.duration * seekPercentage);
                            this.player.seek(seekPosition);
                        }
                    });
                });
            }
        },
        
        /**
         * Handle player state changes
         * @param {Object} state - Spotify player state
         */
        handlePlayerStateChanged: function(state) {
            console.log('DIAGNOSTIC - Player state changed:', state);
            
            if (!state) {
                console.log('Player state is null - playback stopped or transferred');
                this.isPaused = true;
                this.currentTrack = null;
                this.updatePlayerDisplay();
                return;
            }
            
            // Update paused state
            const wasPaused = this.isPaused;
            this.isPaused = state.paused;
            
            // Check if playback state changed from paused to playing automatically
            if (wasPaused && !this.isPaused) {
                console.log('Playback started');
                
                // If not a user-initiated pause that was resumed, mark playback as started
                if (!this.userInitiatedPause) {
                    this.playbackStarted = true;
                    this.hidePlayHint();
                }
            }
            
            // Check if track changed
            const currentTrackId = this.currentTrack ? this.currentTrack.id : null;
            const newTrackId = state.track_window.current_track ? state.track_window.current_track.id : null;
            
            if (currentTrackId !== newTrackId) {
                // Track changed
                this.currentTrack = state.track_window.current_track;
                console.log('Current track changed to:', this.currentTrack.name);
            }
            
            // Update player display
            this.updatePlayerDisplay(state);
            
            // Update progress bar
            this.updateProgressBar(state.position, state.duration);
        },
        
        /**
         * Update the player display based on the current track
         * @param {Object} state - Optional player state for additional info
         */
        updatePlayerDisplay: function(state) {
            if (!this.currentTrack) {
                // No track playing
                if (this.elements.trackName) {
                    this.elements.trackName.textContent = 'No track playing';
                }
                if (this.elements.artistName) {
                    this.elements.artistName.textContent = 'Select a track to play';
                }
                if (this.elements.albumArt && this.elements.albumArt.querySelector('img')) {
                    this.elements.albumArt.querySelector('img').src = 'placeholder-album.jpg';
                }
                return;
            }
            
            // Update track info
            if (this.elements.trackName) {
                this.elements.trackName.textContent = this.currentTrack.name;
            }
            
            if (this.elements.artistName) {
                this.elements.artistName.textContent = this.currentTrack.artists.map(a => a.name).join(', ');
            }
            
            // Update album art
            if (this.elements.albumArt && this.elements.albumArt.querySelector('img')) {
                const albumImage = this.currentTrack.album.images[0]?.url || 'placeholder-album.jpg';
                this.elements.albumArt.querySelector('img').src = albumImage;
            }
            
            // Update play/pause button
            this.updatePlayPauseButton();
            
            // Update track times if state is provided
            if (state && this.elements.totalTime) {
                const durationStr = this.formatTime(state.duration);
                this.elements.totalTime.textContent = durationStr;
            }
        },
        
        /**
         * Update the play/pause button based on current state
         */
        updatePlayPauseButton: function() {
            if (!this.elements.playPauseButton) return;
            
            const playIcon = this.elements.playPauseButton.querySelector('.play-icon');
            const pauseIcon = this.elements.playPauseButton.querySelector('.pause-icon');
            
            if (!playIcon || !pauseIcon) return;
            
            if (this.isPaused) {
                playIcon.style.display = 'inline';
                pauseIcon.style.display = 'none';
            } else {
                playIcon.style.display = 'none';
                pauseIcon.style.display = 'inline';
            }
            
            // Enable button if player is ready
            this.elements.playPauseButton.disabled = !this.isReady;
        },
        
        /**
         * Update player controls based on current state
         */
        updatePlayerControls: function() {
            if (!this.isReady) {
                // Disable controls
                if (this.elements.playPauseButton) {
                    this.elements.playPauseButton.disabled = true;
                }
                if (this.elements.volumeControl) {
                    this.elements.volumeControl.disabled = true;
                }
            } else {
                // Enable controls
                if (this.elements.playPauseButton) {
                    this.elements.playPauseButton.disabled = false;
                }
                if (this.elements.volumeControl) {
                    this.elements.volumeControl.disabled = false;
                }
            }
        },
        
        /**
         * Update the progress bar
         * @param {number} position - Current position in ms
         * @param {number} duration - Total duration in ms
         */
        updateProgressBar: function(position, duration) {
            if (!this.elements.progressBar || !this.elements.currentTime) return;
            
            // Update progress bar width
            const progress = (position / duration) * 100;
            this.elements.progressBar.style.width = `${progress}%`;
            
            // Update current time display
            const positionStr = this.formatTime(position);
            this.elements.currentTime.textContent = positionStr;
            
            // Continue updating if playing
            if (!this.isPaused) {
                // Clear any existing update timer
                if (this._progressTimer) {
                    clearTimeout(this._progressTimer);
                }
                
                // Set up a timer to update the progress bar
                this._progressTimer = setTimeout(() => {
                    // Estimate the new position (add 1000ms)
                    const newPosition = position + 1000;
                    if (newPosition <= duration) {
                        this.updateProgressBar(newPosition, duration);
                    }
                }, 1000);
            } else if (this._progressTimer) {
                // Clear the timer if paused
                clearTimeout(this._progressTimer);
                this._progressTimer = null;
            }
        },
        
        /**
         * Format milliseconds to MM:SS
         * @param {number} ms - Time in milliseconds
         * @returns {string} Formatted time string
         */
        formatTime: function(ms) {
            if (!ms) return '0:00';
            
            const totalSeconds = Math.floor(ms / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        },
        
        /**
         * Test autoplay functionality directly using the Spotify Web API
         * This is a diagnostic function to help troubleshoot playback issues
         * @param {string} uri - Spotify track URI
         */
        testAutoplay: function(uri) {
            console.log('DIAGNOSTIC - Testing alternate autoplay method for track:', uri);
            
            // Get access token
            const token = localStorage.getItem(JukeboxApp.SpotifyAuth.ACCESS_TOKEN_KEY);
            
            if (!token) {
                console.error('DIAGNOSTIC - No access token for autoplay test');
                return;
            }
            
            if (!this.deviceId) {
                console.error('DIAGNOSTIC - No device ID for autoplay test');
                return;
            }
            
            // Test autoplay with additional parameters
            fetch(`https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    uris: [uri],
                    position_ms: 0,
                    // Explicitly tell Spotify to play (not just queue the track)
                    play: true
                })
            })
            .then(response => {
                console.log('DIAGNOSTIC - Autoplay test response status:', response.status);
                
                // For any response type, try to get diagnostic information
                return response.text().then(text => {
                    if (text) {
                        try {
                            const data = JSON.parse(text);
                            console.log('DIAGNOSTIC - Autoplay test response data:', data);
                        } catch (e) {
                            console.log('DIAGNOSTIC - Autoplay test response text:', text);
                        }
                    } else {
                        console.log('DIAGNOSTIC - Autoplay test response: empty body (success)');
                    }
                    
                    // Also try a direct player control
                    if (this.player && this.isReady) {
                        console.log('DIAGNOSTIC - Attempting direct player resume');
                        this.player.resume().then(() => {
                            console.log('DIAGNOSTIC - Direct player resume successful');
                        }).catch(err => {
                            console.error('DIAGNOSTIC - Direct player resume failed:', err);
                        });
                    }
                });
            })
            .catch(error => {
                console.error('DIAGNOSTIC - Autoplay test error:', error);
            });
        },
        
        /**
         * Toggle playback state (play/pause)
         */
        togglePlayback: function() {
            if (!this.isReady || !this.player) {
                console.warn('Player not ready for playback toggle');
                return;
            }
            
            // Check current state to determine if this is a play or pause action
            this.player.getCurrentState().then(state => {
                const willBePaused = !state?.paused;
                
                // If this will be a pause action, mark it as user-initiated
                if (willBePaused) {
                    console.log('User initiated pause detected');
                    this.userInitiatedPause = true;
                    
                    // Cancel any pending auto-play attempts
                    if (this._progressTimer) {
                        clearTimeout(this._progressTimer);
                        this._progressTimer = null;
                    }
                    
                    // Clear all auto-play related timeouts
                    this.clearAutoPlayTimeouts();
                }
                
                this.player.togglePlay()
                    .then(() => {
                        console.log('Playback toggled, new pause state:', willBePaused);
                        
                        if (!willBePaused) {
                            // User is playing - hide the hint
                            this.hidePlayHint();
                            
                            // If user manually plays, we can consider playback as started
                            this.playbackStarted = true;
                        }
                    })
                    .catch(error => {
                        console.error('Error toggling playback:', error);
                    });
            }).catch(error => {
                console.error('Error getting player state:', error);
                
                // Fallback if we couldn't get state
                this.player.togglePlay()
                    .then(() => console.log('Playback toggled (fallback)'))
                    .catch(error => console.error('Error toggling playback (fallback):', error));
            });
        },
        
        /**
         * Set the player volume
         * @param {number} volume - Volume level (0-1)
         */
        setVolume: function(volume) {
            if (!this.isReady || !this.player) return;
            
            // Ensure volume is between 0 and 1
            volume = Math.max(0, Math.min(1, volume));
            
            this.player.setVolume(volume)
                .then(() => {
                    console.log('Volume set to:', volume);
                })
                .catch(error => {
                    console.error('Error setting volume:', error);
                });
        },
        
        /**
         * Play a specific Spotify track
         * @param {string} uri - Spotify track URI
         * @returns {Promise} 
         */
        playTrack: function(uri) {
            return new Promise((resolve, reject) => {
                if (!this.isReady || !this.deviceId) {
                    this.showPlayerMessage('Player not ready. Please wait or refresh the page.');
                    console.warn('DIAGNOSTIC - Attempted to play track but player not ready', {
                        isReady: this.isReady,
                        deviceId: this.deviceId
                    });
                    reject(new Error('Player not ready'));
                    return;
                }
                
                // Reset playback flags when starting a new track
                this.playbackStarted = false;
                this.userInitiatedPause = false;
                this.playbackErrorOccurred = false; // Add a new flag to track errors
                
                // Get access token
                const token = localStorage.getItem(JukeboxApp.SpotifyAuth.ACCESS_TOKEN_KEY);
                
                if (!token) {
                    this.showPlayerMessage('Spotify access token not found. Please reconnect to Spotify.', true);
                    console.error('DIAGNOSTIC - Access token not found during playTrack');
                    reject(new Error('Access token not found'));
                    return;
                }
                
                // DIAGNOSTIC: Decode token to check scopes
                try {
                    const tokenParts = token.split('.');
                    if (tokenParts.length > 1) {
                        const tokenPayload = JSON.parse(atob(tokenParts[1]));
                        console.log('DIAGNOSTIC - Token payload:', tokenPayload);
                        
                        // Check if token has scopes property
                        if (tokenPayload.scope) {
                            console.log('DIAGNOSTIC - Token scopes:', tokenPayload.scope);
                            
                            // Check for required scopes
                            const requiredScopes = ['streaming', 'user-modify-playback-state'];
                            const missingScopes = requiredScopes.filter(scope => 
                                !tokenPayload.scope.includes(scope)
                            );
                            
                            if (missingScopes.length > 0) {
                                console.warn('DIAGNOSTIC - Missing required scopes:', missingScopes);
                            } else {
                                console.log('DIAGNOSTIC - All required scopes present');
                            }
                        }
                        
                        // Check token expiration
                        if (tokenPayload.exp) {
                            const expiresAt = new Date(tokenPayload.exp * 1000);
                            const now = new Date();
                            console.log('DIAGNOSTIC - Token expires at:', expiresAt.toLocaleString());
                            console.log('DIAGNOSTIC - Token expired:', now > expiresAt);
                        }
                    }
                } catch (error) {
                    console.error('DIAGNOSTIC - Error decoding token:', error);
                }
                
                // Show loading message
                this.showPlayerMessage('Loading track...');
                
                console.log('DIAGNOSTIC - Attempting to play track:', uri);
                console.log('DIAGNOSTIC - Using device ID:', this.deviceId);
                
                // Play the track using Spotify Web API
                fetch(`https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        uris: [uri]
                    })
                })
                .then(response => {
                    console.log('DIAGNOSTIC - Play track response status:', response.status);
                    console.log('DIAGNOSTIC - Play track response headers:', Object.fromEntries([...response.headers]));
                    
                    if (!response.ok) {
                        // For diagnostic purposes, try to get the response body even on error
                        return response.text().then(text => {
                            let errorData = text;
                            try {
                                // Try to parse as JSON if possible
                                errorData = JSON.parse(text);
                                console.error('DIAGNOSTIC - Error response body:', errorData);
                            } catch (e) {
                                console.error('DIAGNOSTIC - Error response (text):', text);
                            }
                            
                            // Check for specific error cases
                            if (response.status === 404) {
                                this.playbackErrorOccurred = true; // Mark that an error occurred
                                throw new Error('Player not found. Make sure Spotify is active.');
                            } else if (response.status === 403) {
                                this.playbackErrorOccurred = true; // Mark that an error occurred
                                throw new Error('Premium account required for playback.');
                            } else {
                                this.playbackErrorOccurred = true; // Mark that an error occurred
                                const message = errorData.error?.message || 'Failed to play track';
                                throw new Error(message);
                            }
                        });
                    }
                    
                    // Check if response is empty (HTTP 204)
                    if (response.status === 204) {
                        console.log('DIAGNOSTIC - Received empty success response (HTTP 204)');
                        this.hidePlayerMessage();
                        console.log('Playing track:', uri);
                        this.isPaused = false;
                        this.updatePlayPauseButton();
                        
                        // Show a hint to the user that they may need to press play
                        this.showPlayHint();
                        
                        // Track has been loaded, now try to auto-start playback
                        this.attemptAutoPlay();
                        
                        resolve();
                        return;
                    }
                    
                    // For non-empty responses, parse the JSON
                    return response.json().then(data => {
                        console.log('DIAGNOSTIC - Play track response data:', data);
                        this.hidePlayerMessage();
                        console.log('Playing track:', uri);
                        this.isPaused = false;
                        this.updatePlayPauseButton();
                        
                        // Show a hint to the user that they may need to press play
                        this.showPlayHint();
                        
                        // Track has been loaded, now try to auto-start playback
                        this.attemptAutoPlay();
                        
                        resolve();
                    });
                })
                .catch(error => {
                    console.error('DIAGNOSTIC - Error playing track:', error);
                    console.error('DIAGNOSTIC - Error stack:', error.stack);
                    this.showPlayerMessage(`Error playing track: ${error.message}`, true);
                    this.playbackErrorOccurred = true; // Mark that an error occurred
                    reject(error);
                });
            });
        },
        
        /**
         * Attempt to auto-play the loaded track with safeguards
         */
        attemptAutoPlay: function() {
            // Only attempt auto-play if:
            // 1. Playback hasn't already started
            // 2. User hasn't manually paused
            if (this.playbackStarted || this.userInitiatedPause) {
                console.log('Skipping auto-play attempt: playback already started or user paused');
                return;
            }
            
            // Clear any existing auto-play timeouts
            this.clearAutoPlayTimeouts();
            
            // Store timeout IDs as instance variables
            this._firstAutoPlayTimeout = setTimeout(() => {
                // Check if conditions still allow for auto-play attempt
                if (this.playbackStarted || this.userInitiatedPause) {
                    console.log('Skipping first auto-play attempt: state changed');
                    return;
                }
                
                console.log('First auto-play attempt');
                this.tryResumePlayback();
                
                // Second attempt after a longer delay if needed
                this._secondAutoPlayTimeout = setTimeout(() => {
                    // Check if we still need to attempt auto-play
                    if (this.playbackStarted || this.userInitiatedPause) {
                        console.log('Skipping second auto-play attempt: state changed');
                        return;
                    }
                    
                    console.log('Second auto-play attempt');
                    this.tryResumePlayback();
                }, 1000);
            }, 300);
        },
        
        /**
         * Clear all auto-play related timeouts
         */
        clearAutoPlayTimeouts: function() {
            if (this._firstAutoPlayTimeout) {
                clearTimeout(this._firstAutoPlayTimeout);
                this._firstAutoPlayTimeout = null;
            }
            
            if (this._secondAutoPlayTimeout) {
                clearTimeout(this._secondAutoPlayTimeout);
                this._secondAutoPlayTimeout = null;
            }
            
            if (this._playbackCheckTimeout) {
                clearTimeout(this._playbackCheckTimeout);
                this._playbackCheckTimeout = null;
            }
            
            if (this._secondaryCheckTimeout) {
                clearTimeout(this._secondaryCheckTimeout);
                this._secondaryCheckTimeout = null;
            }
        },
        
        /**
         * Try to resume playback with improved error detection
         */
        tryResumePlayback: function() {
            // Double-check that we should still try to resume
            if (!this.player || this.playbackStarted || this.userInitiatedPause) {
                console.log('Aborting resume attempt: playback started or user paused');
                return;
            }
            
            this.player.resume()
                .then(() => {
                    console.log('Resume playback attempt successful');
                    
                    // Clear any existing verification timeout
                    if (this._playbackCheckTimeout) {
                        clearTimeout(this._playbackCheckTimeout);
                    }
                    
                    // First verification - check if playback actually started
                    this._playbackCheckTimeout = setTimeout(() => {
                        // Triple-check user hasn't paused before checking state
                        if (this.userInitiatedPause) {
                            console.log('User has paused, cancelling playback check');
                            return;
                        }
                        
                        this.player.getCurrentState().then(state => {
                            if (state && !state.paused) {
                                console.log('Playback initially verified');
                                
                                // Add secondary verification after a longer delay
                                // This catches cases where playback appears to start but then fails
                                this._secondaryCheckTimeout = setTimeout(() => {
                                    this.player.getCurrentState().then(secondState => {
                                        if (secondState && !secondState.paused && secondState.position > 0) {
                                            console.log('Playback fully confirmed - audio is streaming');
                                            this.playbackStarted = true;
                                            this.hidePlayHint();
                                        } else {
                                            console.log('Secondary verification failed - playback may have stalled');
                                            // Leave play hint visible as playback likely failed
                                        }
                                    }).catch(error => {
                                        console.error('Error during secondary playback verification:', error);
                                    });
                                }, 1500); // Check again after 1.5s to verify sustained playback
                            } else {
                                console.log('Initial playback verification failed');
                            }
                        }).catch(error => {
                            console.error('Error checking playback state:', error);
                        });
                    }, 500);
                })
                .catch(error => {
                    console.error('Error resuming playback:', error);
                    // Ensure play hint remains visible
                    this.showPlayHint();
                });
        },
        
        /**
         * Show a hint to the user that they may need to press play
         */
        showPlayHint: function() {
            // Create play hint element if it doesn't exist
            if (!document.getElementById('play-hint')) {
                const hintElement = document.createElement('div');
                hintElement.id = 'play-hint';
                hintElement.className = 'play-hint';
                hintElement.innerHTML = '<span class="hint-icon">▶️</span> Track loaded! Press play to start';
                
                // Add to the player container
                if (this.elements.playerContainer) {
                    this.elements.playerContainer.appendChild(hintElement);
                }
            } else {
                // Show existing hint
                const hintElement = document.getElementById('play-hint');
                hintElement.style.display = 'block';
                hintElement.style.opacity = '1';
            }
        },
        
        /**
         * Hide the play hint
         */
        hidePlayHint: function() {
            const hintElement = document.getElementById('play-hint');
            if (hintElement) {
                // Fade out
                hintElement.style.opacity = '0';
                setTimeout(() => {
                    hintElement.style.display = 'none';
                }, 500);
            }
        },
        
        /**
         * Get diagnostic info about player state
         * @returns {Object} Object with diagnostic information
         */
        getDiagnosticInfo: function() {
            const diagnosticInfo = {
                isReady: this.isReady,
                deviceId: this.deviceId,
                isPaused: this.isPaused,
                hasCurrentTrack: !!this.currentTrack,
                playbackStarted: this.playbackStarted,
                userInitiatedPause: this.userInitiatedPause,
                authenticated: JukeboxApp.state.spotifyAuthenticated,
                hasValidToken: JukeboxApp.SpotifyAuth.isTokenValid()
            };
            
            console.log('Player diagnostic information:', diagnosticInfo);
            return diagnosticInfo;
        },
    },

    /**
     * Spotify API Module
     * Handle Spotify API requests
     */
    SpotifyAPI: {
        /**
         * Fetch track information from Spotify API
         * @param {string} trackURI - Spotify track URI or URL
         * @returns {Promise<Object>} Track information object
         */
        getTrackInfo: async function(trackURI) {
            if (!trackURI) {
                throw new Error('Track URI is required');
            }
            
            // Validate the URI format
            const uriValidation = JukeboxApp.CodeMappingsStorage._validateTrackURI(trackURI);
            if (!uriValidation.valid) {
                throw new Error(uriValidation.message);
            }
            
            // Extract the track ID from the URI or URL
            let trackId;
            if (trackURI.includes('spotify:track:')) {
                trackId = trackURI.split('spotify:track:')[1];
            } else if (trackURI.includes('open.spotify.com/track/')) {
                const urlMatch = trackURI.match(/https?:\/\/open\.spotify\.com\/track\/([a-zA-Z0-9]{22})(\?|$)/);
                trackId = urlMatch[1];
            } else {
                throw new Error('Invalid Spotify track URI or URL format');
            }
            
            // Check if a token exists
            const token = localStorage.getItem(JukeboxApp.SpotifyAuth.ACCESS_TOKEN_KEY);
            if (!token) {
                throw new Error('Please connect to Spotify first');
            }
            
            try {
                // Fetch track information from Spotify API
                const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error?.message || `Failed to fetch track info: ${response.status}`);
                }
                
                const trackData = await response.json();
                
                // Create a simplified track info object
                return {
                    trackName: trackData.name,
                    artistName: trackData.artists.map(artist => artist.name).join(', '),
                    albumName: trackData.album.name,
                    albumArt: trackData.album.images[0]?.url,
                    trackURI: trackData.uri
                };
            } catch (error) {
                console.error('Error fetching track info:', error);
                throw error;
            }
        }
    },

    /**
     * Handle getting track info for add form
     */
    handleGetTrackInfo: function() {
        // Check if user is authenticated with Spotify
        if (!this.state.spotifyAuthenticated) {
            this.showFormFeedback('Please connect to Spotify first', false);
            return;
        }
        
        const trackURI = this.elements.trackURIInput.value.trim();
        if (!trackURI) {
            this.showInputFeedback(this.elements.uriFeedback, 'Please enter a Spotify track URI or URL', false);
            return;
        }
        
        // Show loading state
        this.elements.getTrackInfoBtn.textContent = 'Loading...';
        this.elements.getTrackInfoBtn.disabled = true;
        this.showFormFeedback('Fetching track info...', true);
        
        // Fetch track info
        this.SpotifyAPI.getTrackInfo(trackURI)
            .then(trackInfo => {
                // Auto-fill the form fields
                this.elements.trackNameInput.value = trackInfo.trackName;
                this.elements.artistNameInput.value = trackInfo.artistName;
                
                // Show success feedback
                this.showFormFeedback(`Track info loaded: "${trackInfo.trackName}" by ${trackInfo.artistName}`, true);
            })
            .catch(error => {
                // Show error feedback
                this.showFormFeedback(`Error: ${error.message}`, false);
                this.showInputFeedback(this.elements.uriFeedback, error.message, false);
            })
            .finally(() => {
                // Reset button state
                this.elements.getTrackInfoBtn.textContent = 'Get Track Info';
                this.elements.getTrackInfoBtn.disabled = false;
            });
    },
    
    /**
     * Handle getting track info for edit form
     */
    handleGetEditTrackInfo: function() {
        // Check if user is authenticated with Spotify
        if (!this.state.spotifyAuthenticated) {
            this.showEditFormFeedback('Please connect to Spotify first', false);
            return;
        }
        
        const trackURI = this.elements.editTrackURIInput.value.trim();
        if (!trackURI) {
            this.showInputFeedback(this.elements.editURIFeedback, 'Please enter a Spotify track URI or URL', false);
            return;
        }
        
        // Show loading state
        this.elements.editGetTrackInfoBtn.textContent = 'Loading...';
        this.elements.editGetTrackInfoBtn.disabled = true;
        this.showEditFormFeedback('Fetching track info...', true);
        
        // Fetch track info
        this.SpotifyAPI.getTrackInfo(trackURI)
            .then(trackInfo => {
                // Auto-fill the form fields
                this.elements.editTrackNameInput.value = trackInfo.trackName;
                this.elements.editArtistNameInput.value = trackInfo.artistName;
                
                // Show success feedback
                this.showEditFormFeedback(`Track info loaded: "${trackInfo.trackName}" by ${trackInfo.artistName}`, true);
            })
            .catch(error => {
                // Show error feedback
                this.showEditFormFeedback(`Error: ${error.message}`, false);
                this.showInputFeedback(this.elements.editURIFeedback, error.message, false);
            })
            .finally(() => {
                // Reset button state
                this.elements.editGetTrackInfoBtn.textContent = 'Get Track Info';
                this.elements.editGetTrackInfoBtn.disabled = false;
            });
    },
};

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    JukeboxApp.init();
}); 