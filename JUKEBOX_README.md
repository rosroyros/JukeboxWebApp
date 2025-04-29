# Jukebox Web App

A simple web application that allows users to play Spotify tracks by entering codes.

## Overview

The Jukebox Web App is designed as a user-friendly application that lets users (particularly toddlers) play Spotify tracks by entering 10-digit codes. The app includes a player interface for end-users and an admin interface for managing code-to-track mappings.

## Key Features

- **Simple Player Interface**: Enter a 10-digit code to play a specific Spotify track
- **Admin Interface**: Manage mappings between codes and Spotify tracks
- **Spotify Integration**: Full track playback using Spotify Web Playback SDK
- **Local Storage**: All code-to-track mappings are stored locally in the browser

## Technical Information

### Code Length Change

The application initially used 3-digit codes but has been updated to use 10-digit codes. This change was implemented on 2025-04-27 for the following reasons:

- **Increased Capacity**: Allows for many more unique code-to-track mappings (from 1,000 to 10 billion possible combinations)
- **Future-Proofing**: Provides ample room for expansion of the track library
- **Reduced Collision Risk**: Minimizes the chance of accidentally entering a valid code

### Implementation Details

The code length change impacts the following components:

1. **Validation Logic**: All code validation now checks for exactly 10 digits instead of 3
2. **UI Components**: Input fields have been updated to handle 10 digits
3. **User Feedback**: Messages and hints have been updated to reference 10-digit codes
4. **CSS Styling**: Input field widths have been adjusted to accommodate longer codes

## Usage

### For Users

1. Open the player interface
2. Enter a valid 10-digit code
3. The corresponding Spotify track will automatically play

### For Administrators

1. Switch to the admin view
2. Add new code-to-track mappings with 10-digit codes
3. Manage existing mappings through the admin interface

## Requirements

- Spotify Premium account for playback
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection

## License

[Include license information here] 