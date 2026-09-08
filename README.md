# Denari Landing Page

Marketing and download landing page for the Denari personal finance app. Built with React, Vite, and Tailwind CSS.

---

## Tech Stack

- **React 19** — UI
- **Vite 8** — build tool and dev server
- **React Router v7** — client-side routing
- **Tailwind CSS v4** — utility styles
- **GSAP** — hero entrance animations
- **Plus Jakarta Sans / Anton / Fraunces** — typography (Google Fonts)

---

## Project Structure

```
src/
├── components/
│   ├── Navbar/         # Floating pill navbar with QR overlay
│   ├── Hero/           # Full-screen hero with GSAP animation
│   ├── Features/       # Product features section
│   ├── HowItWorks/     # Step-by-step section
│   ├── LifestylePhotos/
│   ├── DownloadApp/    # APK download section
│   ├── FAQ/            # Accordion FAQ
│   ├── CTA/            # Call-to-action banner
│   ├── Footer/
│   └── shared/         # Kicker, MarqueeTicker, StepBox
├── pages/
│   ├── Home.jsx
│   ├── About.jsx
│   ├── Blog.jsx
│   ├── FAQ.jsx
│   ├── Contact.jsx
│   ├── HelpCenter.jsx
│   ├── Privacy.jsx
│   ├── Terms.jsx
│   ├── Support.jsx
│   └── NotFound.jsx    # 404 page
└── main.jsx
```

---

## Getting Started

**Prerequisites:** Node.js 18+

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## APK Download Link

The Download button and QR code in the navbar both point to the APK URL defined in:

- `src/components/Navbar/Navbar.jsx` — `href="#download"` on the Download button
- `src/components/DownloadApp/DownloadApp.jsx` — main download section

GitHub APK Release URL:

```
https://github.com/Georgeozoemena/Dai/releases/download/v1.0.0-beta/Dai-preview-1.0.0
```

---

## Deployment

The site is a static SPA. Deploy to any static host.

**Vercel (recommended)**
```bash
npm i -g vercel
vercel
```

**Netlify**
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

**Important:** Configure your host to redirect all routes to `index.html` so React Router handles navigation correctly.

For Netlify, add a `public/_redirects` file:
```
/*  /index.html  200
```

For Vercel, add a `vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## Pages

| Route | Page |
|-------|------|
| `/` | Home |
| `/about` | About |
| `/blog` | Blog |
| `/faq` | FAQ |
| `/contact` | Contact |
| `/help-center` | Help Center |
| `/privacy` | Privacy Policy |
| `/terms` | Terms of Service |
| `/support` | Support |
| `*` | 404 Not Found |

---

## Assets

Public images live in `/public`. Referenced directly by filename — e.g. `/old-man.jpg`.

---

## License

Private. All rights reserved.
```
