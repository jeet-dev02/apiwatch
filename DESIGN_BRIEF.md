# APIWatch — Design Brief

## Project
API Testing Dashboard for internal office use.
Tests REST, GraphQL, and Auth-protected APIs.
Shows health scores, performance metrics, and alerts.

## Tech Stack
- Next.js 14 (App Router)
- Tailwind CSS
- shadcn/ui components
- Recharts (for all charts)
- Lucide React (for all icons)
- TypeScript

## Visual Style
- Clean, flat, enterprise dashboard
- Reference: Linear.app, Vercel Dashboard
- No gradients, no heavy shadows
- White main background, light gray sidebar highlight
- Thin borders: 1px #e5e7eb

## Colors
- Primary blue: #2563eb (buttons, links, active nav)
- Sidebar background: #ffffff
- Main background: #f9fafb
- Card background: #ffffff
- Success / Healthy: #16a34a (green)
- Warning: #d97706 (amber)
- Critical / Error: #dc2626 (red)
- Text primary: #111827
- Text secondary: #6b7280
- Border: #e5e7eb

## HTTP Method Badge Colors
- GET: blue background #dbeafe, text #1d4ed8
- POST: green background #dcfce7, text #15803d
- PUT: amber background #fef9c3, text #a16207
- DELETE: red background #fee2e2, text #b91c1c

## Status Code Colors
- 2xx: #16a34a green
- 4xx: #d97706 amber
- 5xx: #dc2626 red

## Typography
- Font: Inter (Google Fonts)
- Heading: 600 weight
- Body: 400 weight
- Small labels: 500 weight, uppercase, tracked

## Layout
- Sidebar: fixed, 220px wide
- Top header: 64px tall
- Content padding: 24px
- Card border radius: 12px
- Stat card border radius: 12px

## Pages to build (frontend only, mock data)
1. Overview Dashboard (main page)
2. Projects list page
3. API Manager page (add/edit APIs)
4. Test Runs page
5. Alerts page

## Mock Data
All data is hardcoded for now. No API calls yet.