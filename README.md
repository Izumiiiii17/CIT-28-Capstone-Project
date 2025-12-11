# NUTRIGUIDE: AI – POWERED NUTRITION PLANNING PLATFORM FOR ATHLETES IN DEVELOPING REGIONS 
### CIT-28 Capstone Project | PSCS_543 - Nutrition Application For Athletes

A comprehensive React.js application that provides personalized nutrition and fitness planning using artificial intelligence, designed to support UN Sustainable Development Goals 2 (Zero Hunger) and 3 (Good Health and Well-being).

## 🚀 Features

### Core Functionality
- **AI-Powered Meal Planning**: Personalized meal recommendations using Gemini AI
- **Scientific TDEE Calculation**: Accurate calorie calculations using Mifflin-St Jeor equation
- **Athlete-Specific Training**: Tailored recommendations for different sports and activities
- **Interactive Data Visualization**: Macronutrient breakdown charts using Recharts
- **Progressive Web App**: Offline support and install-to-home functionality

### User Experience
- **Responsive Design**: Optimized for all devices (mobile, tablet, desktop, smart TV)
- **Accessibility Compliant**: WCAG guidelines, semantic HTML, keyboard navigation
- **Multi-step Form**: User-friendly profile creation with validation
- **Real-time Results**: Instant plan generation with visual feedback

### Technical Features
- **Modern Stack**: React 18, TypeScript, Tailwind CSS, Framer Motion
- **Authentication**: Supabase integration for secure user management
- **Form Validation**: React Hook Form with Zod schema validation
- **State Management**: React Context for global state
- **API Integration**: Ready for Nutrition APIs and Gemini AI

## 🏗️ Architecture

```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   ├── layout/          # Layout components (Header, Footer)
│   └── features/        # Feature-specific components
├── pages/               # Page components
├── hooks/               # Custom React hooks
├── context/             # React contexts
├── utils/               # Utility functions
├── types/               # TypeScript type definitions
├── data/                # Mock data and constants
└── lib/                 # Third-party integrations
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account (for authentication)
- Google AI Studio account (for Gemini API)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/nutriguide.git
cd nutriguide
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Fill in your API keys:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `VITE_GEMINI_API_KEY`: Your Google Gemini API key
- `VITE_NUTRITION_API_KEY`: Your nutrition API key (optional)

4. Start the development server:
```bash
npm run dev
```

## 🔧 Configuration

### Supabase Setup
1. Create a new Supabase project
2. Enable authentication with email/password
3. Disable email confirmation (optional)
4. Copy your project URL and anonymous key to `.env`

### API Integration
The application is designed to integrate with:
- **Gemini AI API**: For meal plan generation
- **Nutrition APIs**: Edamam, Nutritionix, or Open Food Database
- **Supabase**: For user profiles and data storage

## 📱 PWA Features

NutriGuide is a full Progressive Web App with:
- **Offline Support**: Core functionality works without internet
- **Install Prompt**: Users can install the app on their devices
- **Service Worker**: Caches resources for better performance
- **Responsive Icons**: Optimized for all device types

## 🎨 Design System

### Color Palette
- Primary: Emerald (#10B981) - Health and growth
- Secondary: Blue (#3B82F6) - Trust and reliability  
- Accent: Orange (#F97316) - Energy and motivation
- Success, Warning, Error states with proper contrast ratios

### Typography
- Modern, readable fonts with proper line spacing
- Responsive sizing from mobile to desktop
- Maximum 3 font weights for consistency

### Spacing
- 8px base spacing system
- Consistent margins and padding
- Proper visual hierarchy

## 🔒 Security & Privacy

- **Authentication**: Secure email/password auth via Supabase
- **Data Protection**: User profiles encrypted and stored securely
- **Privacy First**: No unnecessary data collection
- **GDPR Compliant**: User control over personal data

## 🌐 UN SDG Alignment

### SDG-2: Zero Hunger
- Budget-friendly meal planning
- Focus on locally available ingredients
- Nutritional education and awareness
- Accessible pricing for all economic levels

### SDG-3: Good Health and Well-being
- Evidence-based nutrition recommendations
- Mental health considerations in planning
- Preventive health through proper nutrition
- Inclusive design for all abilities

## 🚀 Deployment

### Vercel Deployment (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on git push

### Manual Build
```bash
npm run build
npm run preview
```

## 🤝 Contributing

We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 📞 Support

- **Documentation**: Check our [Wiki](https://github.com/your-username/nutriguide/wiki)
- **Issues**: Report bugs via GitHub Issues
- **Email**: support@nutriguide.com
- **Community**: Join our Discord server

## 🔮 Roadmap

### Phase 1 (Current)
- ✅ Core MVP functionality
- ✅ Basic AI meal planning
- ✅ TDEE calculations
- ✅ PWA implementation

### Phase 2 (Next Quarter)
- 🔄 Advanced AI training
- 🔄 Social features and community
- 🔄 Integration with fitness trackers
- 🔄 Multi-language support

### Phase 3 (Future)
- ⏳ Nutritionist consultations
- ⏳ Grocery delivery integration
- ⏳ Advanced analytics dashboard
- ⏳ White-label solutions

---

**Built with ❤️ for global health and wellness**
