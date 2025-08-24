# Training Center Mapper

A modern web application for mapping and discovering training centers using Next.js, React, and interactive maps.

## 🚀 Features

- **Interactive Map Interface**: Built with Leaflet.js for seamless map navigation
- **Training Center Discovery**: Search and explore training centers in your area
- **Modern UI/UX**: Beautiful interface built with Tailwind CSS and Radix UI components
- **Real-time Data**: Live scraping and data export capabilities
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Theme Support**: Light/dark mode toggle for better user experience

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, CSS Modules
- **UI Components**: Radix UI, Lucide React icons
- **Maps**: Leaflet.js
- **Forms**: React Hook Form with Zod validation
- **State Management**: React hooks and context
- **Build Tool**: Next.js with PostCSS

## 📋 Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm
- Gemini API key (for AI-powered features)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/trainingcentermapper.git
cd trainingcentermapper
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
# or
yarn install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Required for AI features
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Run the Development Server

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 📁 Project Structure

```
trainingcentermapper/
├── app/                    # Next.js 14 app directory
│   ├── api/              # API routes
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── leaflet-map.tsx   # Map component
│   ├── search-bar.tsx    # Search functionality
│   └── results-panel.tsx # Results display
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
├── types/                 # TypeScript type definitions
└── public/                # Static assets
```

## 🎯 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🔧 Configuration

### Tailwind CSS
The project uses Tailwind CSS for styling. Configuration can be found in `tailwind.config.ts`.

### Next.js
Next.js configuration is in `next.config.mjs`.

### TypeScript
TypeScript configuration is in `tsconfig.json`.

## 🌐 API Routes

- `/api/scrape-training-centers` - Scrape training center data
- `/api/export-data` - Export data in various formats
- `/api/check-gemini-health` - Check Gemini API status
- `/api/test-gemini` - Test Gemini API functionality
- `/api/debug-system` - System debugging information

## 🎨 Customization

### Adding New Components
1. Create your component in the `components/` directory
2. Import and use it in your pages
3. Follow the existing component patterns

### Styling
- Use Tailwind CSS classes for styling
- Custom CSS can be added to `app/globals.css`
- Component-specific styles can use CSS Modules

## 📱 Mobile Support

The application is fully responsive and includes mobile-specific optimizations through the `use-mobile` hook.

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push

### Other Platforms
The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/yourusername/trainingcentermapper/issues) page
2. Create a new issue with detailed information
3. Include steps to reproduce the problem

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Leaflet](https://leafletjs.com/) for the interactive maps
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/) for accessible UI components

---

**Made with ❤️ using Next.js and modern web technologies**
