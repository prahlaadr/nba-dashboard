# NBA Match Dashboard

Interactive dashboard for exploring NBA games: shot charts, box scores, and game flow.

**Live:** https://nbadashboard.pyaarproject.org

## What it does

Pulls game data from the NBA Stats API and renders it as an interactive dashboard. Shot charts use D3 hex-binning to show shooting efficiency by court location, alongside per-game box scores and scoring trends.

## Stack

- Next.js (App Router) + React + TypeScript
- D3 with `d3-hexbin` for the shot-chart visualizations
- Tailwind CSS

## Structure

- `app/` Next.js frontend (the deployed app, Vercel root directory)
- `data/` cached game data and fetch scripts

## Local development

```bash
cd app
bun install
bun run dev
```

## Notes

The NBA Stats API V2 endpoints are unreliable, so data fetching targets the V3 endpoints. See the project writeup on pyaarproject.org for the full story.
