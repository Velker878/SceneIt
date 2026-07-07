# SceneIt

SceneIt is a full-stack web application that helps friend groups decide what movie to watch by comparing their public Letterboxd watchlists in real time.

Users enter multiple Letterboxd usernames, and SceneIt finds every film shared across their watchlists. A custom recommendation algorithm evaluates each movie using factors such as ratings, popularity, genre similarity, and runtime to recommend the best option for the group. An AI-generated summary explains the recommendation based on the group's combined tastes.


## Why I Built It

Choosing a movie with friends usually means scrolling through multiple watchlists and trying to find something everyone is interested in. SceneIt was built to simplify that process by turning shared watchlists into a single recommendation that's quick, personalized, and easy to understand.

## Demo Images

<img width="2880" height="1800" alt="Screenshot 2026-07-07 173911" src="https://github.com/user-attachments/assets/efbd3066-057d-4b21-beec-55d332909c52" />
<img width="2880" height="1800" alt="Screenshot 2026-07-07 174028" src="https://github.com/user-attachments/assets/cfb765d7-4e9c-4dc0-8fc3-3787241019a2" />
<img width="2880" height="1800" alt="Screenshot 2026-07-07 174059" src="https://github.com/user-attachments/assets/d5bd8f42-3712-4b9f-9aa8-32cfc258ac13" />

## Features

- Compare multiple Letterboxd watchlists at once
- Find movies shared across every user's watchlist
- Custom recommendation algorithm based on ratings, popularity, genres, and runtime
- AI-generated recommendation summaries
- Filter by mood, genre, and release decade
- Real-time Letterboxd username validation with profile avatars
- Redis caching for faster response times

## Tech Stack

**Frontend**
- Next.js
- TypeScript

**Backend**
- NestJS
- Redis
- TMDB API
- OpenAI API
