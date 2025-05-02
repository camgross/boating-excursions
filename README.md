# Boating Excursions Booking System

A modern web application for booking boating excursions, built with Next.js, TypeScript, and Tailwind CSS.

## Features

- Browse available excursions
- View detailed excursion information
- Book excursions with date and time selection
- Submit custom excursion suggestions
- User authentication and profile management
- Admin dashboard for excursion management
- Responsive design for all devices

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Zustand (State Management)
- ESLint

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # Reusable UI components
│   ├── layout/         # Layout components
│   ├── excursions/     # Excursion-related components
│   └── booking/        # Booking-related components
├── lib/                # Utility functions and API clients
├── types/              # TypeScript type definitions
└── styles/             # Global styles and Tailwind configuration
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Development Phases

1. **Phase 1: Core Features**
   - Basic excursion browsing
   - Simple booking system
   - User authentication

2. **Phase 2: Enhanced Features**
   - Advanced booking system
   - User profiles
   - Payment integration

3. **Phase 3: Admin Features**
   - Admin dashboard
   - Excursion management
   - Analytics and reporting

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
