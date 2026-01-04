# Requirements Document

## Introduction

KuzTube — это видеоплатформа, клон YouTube с тёмной темой. Платформа позволяет пользователям регистрироваться, загружать видео, создавать каналы, подписываться на других пользователей, оставлять комментарии и ставить лайки/дизлайки. Стек: Next.js + Firebase (Auth, Firestore, Storage).

## Glossary

- **System**: Видеоплатформа KuzTube
- **User**: Зарегистрированный пользователь платформы
- **Guest**: Незарегистрированный посетитель
- **Channel**: Канал пользователя с видео, баннером и аватаркой
- **Video**: Видеофайл с метаданными (название, описание, превью)
- **Comment**: Текстовый комментарий к видео
- **Subscription**: Подписка пользователя на канал

## Requirements

### Requirement 1: Authentication

**User Story:** As a guest, I want to register and login, so that I can access platform features.

#### Acceptance Criteria

1. WHEN a guest submits valid email and password on registration form, THE System SHALL create a new user account via Firebase Auth
2. WHEN a guest submits invalid email format, THE System SHALL display an error message and prevent registration
3. WHEN a guest submits password shorter than 6 characters, THE System SHALL display an error message and prevent registration
4. WHEN a registered user submits correct credentials on login form, THE System SHALL authenticate the user and redirect to home page
5. WHEN a user submits incorrect credentials, THE System SHALL display an error message and prevent login
6. WHEN a user clicks logout, THE System SHALL end the session and redirect to home page

### Requirement 2: Home Page

**User Story:** As a user, I want to browse videos on the home page, so that I can discover content.

#### Acceptance Criteria

1. WHEN a user visits the home page, THE System SHALL display a grid of video cards with dark theme styling
2. THE System SHALL display video preview thumbnail, title, author name, and view count for each video card
3. WHEN a user clicks on a video card, THE System SHALL navigate to the video watch page
4. THE System SHALL display the KuzTube logo in the header

### Requirement 3: Channel Page

**User Story:** As a user, I want to view and manage my channel, so that I can showcase my content.

#### Acceptance Criteria

1. WHEN a user visits a channel page, THE System SHALL display channel banner, avatar, name, and subscriber count
2. WHEN a user visits a channel page, THE System SHALL display a list of videos uploaded by the channel owner
3. WHEN a channel owner visits their own channel, THE System SHALL display edit controls for banner and avatar
4. WHEN a channel owner uploads a new banner image, THE System SHALL update the channel banner in Firebase Storage
5. WHEN a channel owner uploads a new avatar image, THE System SHALL update the channel avatar in Firebase Storage
6. WHEN a user clicks subscribe button on another user's channel, THE System SHALL add a subscription and increment subscriber count
7. WHEN a subscribed user clicks unsubscribe button, THE System SHALL remove the subscription and decrement subscriber count

### Requirement 4: Video Upload

**User Story:** As a channel owner, I want to upload videos, so that I can share my content.

#### Acceptance Criteria

1. WHEN an authenticated user visits the upload page, THE System SHALL display a video upload form
2. WHEN a user selects a video file, THE System SHALL upload it to Firebase Storage
3. WHEN a user selects a preview image, THE System SHALL upload it to Firebase Storage as thumbnail
4. WHEN a user submits the upload form with title and description, THE System SHALL create a video document in Firestore
5. IF a guest tries to access the upload page, THEN THE System SHALL redirect to the login page
6. WHEN video upload completes successfully, THE System SHALL redirect to the video watch page

### Requirement 5: Video Watch Page

**User Story:** As a user, I want to watch videos and interact with them, so that I can enjoy and engage with content.

#### Acceptance Criteria

1. WHEN a user visits a video watch page, THE System SHALL display the video player with the video content
2. WHEN a user visits a video watch page, THE System SHALL display video title, description, author name, and view count
3. WHEN a user visits a video watch page, THE System SHALL increment the view count by one
4. WHEN an authenticated user clicks the like button, THE System SHALL add a like and update the like count
5. WHEN an authenticated user clicks the dislike button, THE System SHALL add a dislike and update the dislike count
6. WHEN a user who already liked clicks like again, THE System SHALL remove the like
7. WHEN a user who already disliked clicks dislike again, THE System SHALL remove the dislike
8. WHEN a user switches from like to dislike or vice versa, THE System SHALL update both counts accordingly

### Requirement 6: Comments

**User Story:** As a user, I want to comment on videos, so that I can engage with the community.

#### Acceptance Criteria

1. WHEN a user visits a video watch page, THE System SHALL display all comments for that video
2. WHEN an authenticated user submits a comment, THE System SHALL add the comment to Firestore and display it
3. WHEN a video owner clicks delete on any comment, THE System SHALL remove the comment from Firestore
4. WHEN a video owner clicks pin on a comment, THE System SHALL mark the comment as pinned and display it at the top
5. IF a guest tries to submit a comment, THEN THE System SHALL prompt them to login
6. THE System SHALL display comment author name and timestamp for each comment

### Requirement 7: Dark Theme UI

**User Story:** As a user, I want a dark theme interface, so that I can comfortably browse in low-light conditions.

#### Acceptance Criteria

1. THE System SHALL use a dark color scheme similar to YouTube's dark mode
2. THE System SHALL display the KuzTube logo in the header on all pages
3. THE System SHALL provide consistent dark styling across all pages and components
