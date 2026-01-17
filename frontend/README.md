# Medicare - Chronic Disease Monitoring App

A beautiful, responsive web application for chronic disease monitoring with patient and doctor roles.

## Quick Start

1. Open `pages/login.html` in your browser
2. Use demo credentials to login:
   - **Patient:** patient@medicare.com / Patient123
   - **Doctor:** doctor@medicare.com / Doctor123

## Project Structure

```
frontend/
├── css/
│   ├── variables.css    # Design tokens
│   ├── base.css         # Reset & utilities
│   ├── components.css   # UI components
│   ├── navigation.css   # Nav bars
│   ├── auth.css         # Auth pages
│   ├── dashboard.css    # Dashboards
│   ├── checkup.css      # Checkup & history
│   └── doctor.css       # Doctor module
├── js/
│   ├── utils.js         # Helpers
│   ├── auth.js          # Authentication
│   ├── patient.js       # Patient module
│   └── doctor.js        # Doctor module
├── pages/
│   ├── login.html
│   ├── signup.html
│   ├── forgot-password.html
│   ├── verify-email.html
│   ├── dashboard.html
│   ├── new-checkup.html
│   ├── history.html
│   ├── settings.html
│   ├── doctor-dashboard.html
│   ├── doctor-patients.html
│   ├── doctor-review.html
│   └── doctor-settings.html
└── assets/
    └── images/          # Avatars & illustrations
```

## Features

### Patient Module
- Dashboard with health stats
- Submit health measurements (heart rate, BP, glucose, temperature)
- View AI-generated reports
- Treatment history with doctor reviews
- Profile settings

### Doctor Module
- Dashboard with pending reviews
- Patient list with search & filters
- Review patient submissions
- Add medical notes & prescriptions
- Doctor settings

## Design System

### Colors
- Primary: Purple (#7C3AED)
- Secondary: Blue (#3B82F6)
- Success: Green (#22C55E)
- Warning: Amber (#F59E0B)
- Error: Red (#EF4444)

### Typography
- Font: Inter (Google Fonts)
- Base size: 16px (accessible)

### Responsive Breakpoints
- Mobile: < 640px (bottom nav)
- Tablet: 640px - 1023px
- Desktop: ≥ 1024px (sidebar nav)

## Technologies
- HTML5 / CSS3 / Vanilla JavaScript
- Lucide Icons (via CDN)
- Google Fonts (Inter)
- No build tools required

## Browser Support
- Chrome, Firefox, Safari, Edge (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## Next Steps (Backend)
- Firebase Authentication integration
- Firestore database connection
- Cloud Functions for AI reports
- Real-time notifications
