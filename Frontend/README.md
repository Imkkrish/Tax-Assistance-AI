# 🧮 Intelligent Income Tax Assistant

An AI-powered web application that helps salaried individuals calculate, understand, and file their income tax returns with complete transparency and privacy protection.

## 🌟 Features

### 🔧 Core Functionality
- **Smart Tax Calculation**: Calculate income tax for both old and new tax regimes
- **Document Processing**: Upload Form 16 PDFs for automatic data extraction
- **AI Chat Assistant**: Get AI-powered guidance for tax-related queries
- **Regime Comparison**: Visual comparison between old vs new tax regimes
- **Deduction Guide**: Comprehensive guide to all available tax deductions

### 🎯 Key Benefits
- **Privacy First**: Documents processed locally, no permanent storage
- **Multilingual**: Support for English and Hindi (expandable)
- **Transparent**: Complete breakdown of tax calculations
- **User-friendly**: Intuitive design for non-technical users
- **Accurate**: Always updated with latest tax slabs and regulations

### 🛠️ Technology Stack
- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts for data visualization
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Routing**: React Router DOM

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TEsting
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   - Navigate to `http://localhost:5174/`

### Build for Production
```bash
npm run build
npm run preview
```

## 📱 Application Pages

### 🏠 Home Page
- Welcome screen with feature overview
- Quick access to all major functions
- Benefits and app introduction

### 🧮 Tax Calculator
- Input personal and financial details
- Calculate tax for both regimes
- Visual comparison and breakdown
- Form validation and error handling

### 📄 Document Upload
- Drag-and-drop PDF upload
- Automatic Form 16 data extraction
- Editable extracted data
- Privacy-focused processing

### 🤖 AI Assistant
- Interactive chat interface
- Pre-defined example questions
- Comprehensive tax guidance
- Natural language responses

### 📊 Tax Comparison
- Side-by-side regime comparison
- Interactive charts and graphs
- Real-time calculation updates
- Detailed breakdown views

### 📚 Deduction Guide
- Complete list of available deductions
- Category-wise filtering
- Search functionality
- Tax-saving calculations

## 🔒 Privacy & Security

- **Local Processing**: Documents are processed in the browser
- **No Storage**: No permanent storage of sensitive data
- **Session Based**: Data cleared after session ends
- **HTTPS Ready**: Secure transmission support
- **Transparent**: Clear privacy policy display

## 🌐 Multilingual Support

Currently supported languages:
- **English** (Default)
- **Hindi** (हिंदी)

Additional languages can be easily added by extending the translation files.

## 🧪 Development

### Project Structure
```
src/
├── components/          # Reusable UI components
├── pages/              # Main application pages
├── utils/              # Utility functions and calculations
├── data/               # Static data and translations
└── assets/             # Images and static assets
```

### Key Files
- `src/utils/taxCalculations.js` - Tax calculation logic
- `src/data/translations.js` - Multilingual translations
- `src/components/Navbar.jsx` - Main navigation
- `tailwind.config.js` - Tailwind configuration

### Adding New Features
1. Create components in `src/components/`
2. Add pages in `src/pages/`
3. Update routing in `src/App.jsx`
4. Add translations in `src/data/translations.js`

## 📈 Future Enhancements

- **Voice Assistant**: Speech-to-text and text-to-speech
- **E-filing Integration**: Direct government portal integration
- **Advanced OCR**: Better document processing
- **Mobile App**: React Native version
- **Offline Mode**: Complete offline functionality
- **More Languages**: Regional language support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Open an issue on GitHub
- Check the documentation
- Use the AI assistant within the app

## 🙏 Acknowledgments

- Indian Income Tax Department for tax rules and regulations
- React and Vite communities for excellent tools
- Tailwind CSS for beautiful styling
- All contributors and users

---

**Built with ❤️ for the common people of India**
