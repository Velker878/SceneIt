# SceneIt

> For when you and your Letterboxd friends spend hours trying to find what to watch together.

SceneIt is a cinematic full-stack web application that compares public Letterboxd watchlists and recommends the perfect movie for groups to watch together.

Users enter multiple Letterboxd usernames, and SceneIt:
- fetches public watchlists,
- finds shared movies,
- analyzes group taste,
- recommends the best movie match,
- and generates AI-powered recommendation summaries.

---

# Features

## Current Goals
- Letterboxd username validation
- Public watchlist scraping
- Shared movie detection
- TMDB movie enrichment
- AI-generated recommendations
- Beautiful cinematic UI
- Filtering and sorting
- Fast caching and performance optimization

---

# Planned Tech Stack

## Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- shadcn/ui

## Backend
- NestJS
- PostgreSQL
- Prisma ORM
- Redis

## APIs & Services
- TMDB API
- OpenAI API

---

# Project Vision

SceneIt aims to make movie selection social, fun, and visually immersive.

Instead of endlessly scrolling through streaming services or group chats, users instantly discover movies everyone already wants to watch.

---

# Planned Architecture

```text
Frontend (Next.js)
        ↓
Backend API (NestJS)
        ↓
Scraper Layer (Letterboxd HTML parsing)
        ↓
Redis Cache
        ↓
PostgreSQL Database
        ↓
TMDB + OpenAI APIs
