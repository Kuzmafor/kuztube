# Implementation Plan: KuzTube Video Platform

## Overview

Пошаговая реализация видеоплатформы KuzTube на Next.js 14 с Firebase backend. Задачи организованы для инкрементальной разработки с ранней валидацией функциональности.

## Tasks

- [x] 1. Project Setup and Firebase Configuration
  - [x] 1.1 Initialize Next.js 14 project with TypeScript and Tailwind CSS
    - Create Next.js app with App Router
    - Configure Tailwind for dark theme
    - _Requirements: 7.1, 7.3_
  - [x] 1.2 Set up Firebase configuration
    - Install firebase package
    - Create lib/firebase.ts with Auth, Firestore, Storage exports
    - Create .env.local template for Firebase credentials
    - _Requirements: 1.1, 4.2_
  - [x] 1.3 Create AuthContext provider
    - Implement AuthContext with user state, login, register, logout functions
    - Wrap app in AuthProvider
    - _Requirements: 1.1, 1.4, 1.6_

- [x] 2. Core Layout and Header
  - [x] 2.1 Create root layout with dark theme
    - Set up dark background colors (#0f0f0f, #1f1f1f)
    - Configure global styles
    - _Requirements: 7.1, 7.3_
  - [x] 2.2 Create Header component
    - KuzTube logo
    - Navigation links (Home, Upload)
    - User menu (Login/Register or Profile/Logout)
    - _Requirements: 2.4, 7.2_

- [x] 3. Authentication Pages
  - [x] 3.1 Create registration page (/register)
    - Email, password, display name inputs
    - Form validation (email format, password length)
    - Firebase Auth createUserWithEmailAndPassword
    - Create user document in Firestore
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 3.2 Create login page (/login)
    - Email, password inputs
    - Firebase Auth signInWithEmailAndPassword
    - Error handling for invalid credentials
    - _Requirements: 1.4, 1.5_
  - [x] 3.3 Write property tests for validation
    - **Property 1: Email Validation Rejects Invalid Formats**
    - **Property 2: Password Length Validation**
    - **Validates: Requirements 1.2, 1.3**

- [x] 4. Home Page
  - [x] 4.1 Create VideoCard component
    - Thumbnail image
    - Title, author name, view count
    - Link to watch page
    - Dark theme styling
    - _Requirements: 2.2, 7.1_
  - [x] 4.2 Create home page with video grid
    - Fetch videos from Firestore
    - Display responsive grid of VideoCards
    - _Requirements: 2.1, 2.3_
  - [x] 4.3 Write property test for VideoCard
    - **Property 3: Video Card Displays Required Fields**
    - **Validates: Requirements 2.2**

- [x] 5. Checkpoint - Basic Navigation
  - Ensure all tests pass, ask the user if questions arise.
  - Verify: Registration, Login, Home page with video grid

- [x] 6. Video Upload
  - [x] 6.1 Create upload page (/upload)
    - Auth guard (redirect guests to login)
    - Video file input with preview
    - Thumbnail image input with preview
    - Title and description inputs
    - _Requirements: 4.1, 4.5_
  - [x] 6.2 Implement video upload logic
    - Upload video to Firebase Storage
    - Upload thumbnail to Firebase Storage
    - Create video document in Firestore
    - Redirect to watch page on success
    - _Requirements: 4.2, 4.3, 4.4, 4.6_
  - [x] 6.3 Write property test for video creation
    - **Property 7: Video Document Creation**
    - **Validates: Requirements 4.4**

- [x] 7. Video Watch Page
  - [x] 7.1 Create VideoPlayer component
    - HTML5 video element with controls
    - Responsive sizing
    - _Requirements: 5.1_
  - [x] 7.2 Create watch page (/watch/[id])
    - Fetch video data from Firestore
    - Display VideoPlayer, title, description, author, views
    - Increment view count on load
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 7.3 Create LikeDislikeButtons component
    - Like and dislike buttons with counts
    - Toggle logic for reactions
    - Store reactions in Firestore subcollection
    - _Requirements: 5.4, 5.5, 5.6, 5.7, 5.8_
  - [x] 7.4 Write property tests for reactions
    - **Property 10: Reaction State Machine**
    - **Validates: Requirements 5.4, 5.5, 5.6, 5.7, 5.8**

- [x] 8. Comments System
  - [x] 8.1 Create Comment component
    - Author avatar, name, timestamp
    - Comment text
    - Delete button (for video owner)
    - Pin button (for video owner)
    - Pinned badge
    - _Requirements: 6.1, 6.6_
  - [x] 8.2 Create CommentSection component
    - Comment input form
    - List of comments (pinned first)
    - Add comment to Firestore
    - Delete comment from Firestore
    - Pin/unpin comment
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [x] 8.3 Write property tests for comments
    - **Property 11: Comment Persistence**
    - **Property 12: Comment Deletion**
    - **Property 13: Pinned Comment Ordering**
    - **Property 14: Comment Metadata Display**
    - **Validates: Requirements 6.2, 6.3, 6.4, 6.6**

- [x] 9. Checkpoint - Video Features
  - Ensure all tests pass, ask the user if questions arise.
  - Verify: Upload, Watch, Like/Dislike, Comments

- [x] 10. Channel Page
  - [x] 10.1 Create ChannelHeader component
    - Banner image (editable for owner)
    - Avatar image (editable for owner)
    - Channel name
    - Subscriber count
    - Subscribe/Unsubscribe button
    - _Requirements: 3.1, 3.3, 3.6, 3.7_
  - [x] 10.2 Create channel page (/channel/[id])
    - Fetch user data from Firestore
    - Display ChannelHeader
    - Display grid of channel's videos
    - _Requirements: 3.1, 3.2_
  - [x] 10.3 Implement channel editing
    - Banner upload to Firebase Storage
    - Avatar upload to Firebase Storage
    - Update user document in Firestore
    - _Requirements: 3.4, 3.5_
  - [x] 10.4 Implement subscription system
    - Create/delete subscription documents
    - Update subscriber count
    - Check subscription status
    - _Requirements: 3.6, 3.7_
  - [x] 10.5 Write property tests for channel
    - **Property 4: Channel Page Displays Required Fields**
    - **Property 5: Channel Videos Belong to Owner**
    - **Property 6: Subscription Toggle Consistency**
    - **Validates: Requirements 3.1, 3.2, 3.6, 3.7**

- [x] 11. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.
  - Verify: All pages functional, dark theme consistent

## Notes

- All tasks including tests are required
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Use Firebase Emulator for local development and testing
