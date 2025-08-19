# Poster2Web

Transform documents into beautiful, responsive websites in minutes. No coding required.

## ✨ Features

### 🚀 **Lightning Fast Conversion**
- Upload PDF, PowerPoint (PPTX), Word documents, text files, or images
- Automatic content extraction and intelligent section detection
- Convert to professional websites in under 60 seconds

### 🎨 **Beautiful Design System**
- 8 pre-built color schemes (Growth Green, Trust Blue, Premium Purple, etc.)
- Customizable logos, fonts, and typography
- Responsive design that works on all devices
- Modern, professional templates

### 📱 **Multiple Layout Options**
- **Single Page**: Traditional scrolling layout
- **Section Navigation**: Sticky navigation bar with section links
- **Hamburger Menu**: Collapsible mobile-friendly menu

### 📄 **Export Formats**
- **HTML**: Standalone files ready to deploy anywhere
- **React**: Modern JSX components with hooks
- **Next.js**: Server-side rendered pages with SEO optimization

### 🛠️ **Advanced Editor**
- Rich text editor with formatting tools
- Drag-and-drop section reordering
- Image upload and caption editing
- Custom button configuration (download links, contact forms)
- Real-time preview

## 🎯 Use Cases

- **Research Posters**: Convert academic posters to interactive websites
- **Event Pages**: Create registration and information pages
- **Product Launches**: Build landing pages with features and pricing
- **Company Profiles**: Professional business presentations
- **Academic Papers**: Structured research presentations
- **Portfolios**: Personal and professional showcases

## 🚀 Quick Start

### Option 1: Use Online (Recommended)
Visit the [live demo](https://your-domain.com) and start creating immediately.

### Option 2: Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/poster2web.git
   cd poster2web
   ```

2. **Open in browser**
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Or simply open index.html in your browser
   ```

3. **Start creating**
   Navigate to `http://localhost:8000` and upload your first document!

## 📖 How It Works

### 1. **Upload Your Content**
Drag and drop or browse to select:
- PDF files (with text extraction)
- PowerPoint presentations (.pptx)
- Word documents (.docx) 
- Plain text files (.txt, .md)
- Images (.png, .jpg, .jpeg, .gif, .webp)

### 2. **Intelligent Processing**
- **PDFs**: Extracts text using PDF.js, detects sections automatically
- **PowerPoint**: Parses slide content and speaker notes using JSZip
- **Images**: Creates visual layouts, optional OCR integration
- **Text**: Smart section detection based on headers and content structure

### 3. **Edit & Customize**
- **Content Tab**: Edit sections, add text blocks and images
- **Design Tab**: Customize colors, fonts, logo, and layout
- **Settings Tab**: Configure download buttons, contact info, analytics

### 4. **Export & Deploy**
Choose your preferred format and download ready-to-use code.

## 🎨 Templates

Poster2Web includes several built-in templates:

- **Medical Poster**: Research-focused with Abstract, Methods, Results, Discussion
- **Event Page**: Schedule, speakers, registration information
- **Product Launch**: Features, pricing, demo sections
- **Portfolio**: Projects, experience, skills showcase
- **Company Profile**: About, services, team, contact
- **Academic Paper**: Structured research presentation
- **Landing Page**: Lead capture with CTAs and testimonials

## 🔧 Technical Architecture

### Core Technologies
- **Frontend**: Vanilla JavaScript (ES6+), CSS3, HTML5
- **PDF Processing**: PDF.js for text extraction
- **Office Documents**: JSZip for PowerPoint parsing
- **File Handling**: FileReader API for client-side processing
- **Export**: Dynamic code generation for multiple frameworks

### Key Components

```
src/
├── js/
│   ├── app.js          # Main application orchestrator
│   ├── editor.js       # Rich text editor and section management
│   ├── fileHandlers.js # Document processing (PDF, PPTX, etc.)
│   ├── export.js       # Code generation (HTML, React, Next.js)
│   ├── templates.js    # Pre-built templates and suggestions
│   ├── utils.js        # Helper functions and utilities
│   └── ocr.js          # OCR integration (Google Vision API)
├── css/
│   └── styles.css      # Complete design system
└── index.html          # Main application entry point
```

### Architecture Highlights
- **Modular Design**: Each component is self-contained with clear APIs
- **No Build Process**: Runs entirely in the browser
- **Progressive Enhancement**: Graceful degradation for older browsers
- **Offline Capable**: All processing happens client-side

## 🔌 Optional Integrations

### Google Vision API (OCR)
Enable text extraction from images by adding your API key:

1. Get an API key from [Google Cloud Console](https://cloud.google.com/vision/docs/setup)
2. Click the settings icon in the app
3. Enter your API key in the OCR settings
4. Upload images to extract text automatically

### Analytics Integration
Add tracking codes in the Settings tab to include:
- Google Analytics
- Facebook Pixel  
- Custom tracking scripts

## 🎨 Customization

### Color Schemes
Built-in options include:
- Growth Green (`#16a34a`)
- Trust Blue (`#0ea5e9`) 
- Premium Purple (`#9333ea`)
- Bold Red (`#dc2626`)
- Modern Teal (`#14b8a6`)
- Sunset Orange (`#f97316`)
- Energy Yellow (`#eab308`)
- Professional Grey (`#6b7280`)

### Custom Styling
The CSS uses CSS custom properties for easy theming:

```css
:root {
  --primary: #16a34a;
  --secondary: #15803d;
  --background: #ffffff;
  --foreground: #0a0a0a;
  /* ... more variables */
}
```

## 📱 Browser Support

- **Chrome** 80+ ✅
- **Firefox** 75+ ✅  
- **Safari** 13+ ✅
- **Edge** 80+ ✅

### Required APIs
- File API
- Canvas API
- Local Storage
- CSS Custom Properties

## 🚀 Deployment

### Static Hosting
Deploy to any static hosting service:

```bash
# Netlify
netlify deploy --dir=.

# Vercel  
vercel --prod

# GitHub Pages
# Push to gh-pages branch

# Firebase Hosting
firebase deploy
```

### Docker
```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Test thoroughly**
5. **Commit with clear messages**
   ```bash
   git commit -m "Add amazing feature"
   ```
6. **Push and create a Pull Request**

### Development Guidelines
- Use semantic commit messages
- Add tests for new features
- Update documentation
- Follow existing code style
- Test across multiple browsers

### Areas for Contribution
- 🌐 Additional export formats (Vue, Svelte, etc.)
- 📄 More document format support
- 🎨 New templates and themes
- 🔧 Performance optimizations
- 🌍 Internationalization
- ♿ Accessibility improvements

## 📊 Roadmap

### Version 2.0
- [ ] Vue.js and Svelte export options
- [ ] Advanced animation system
- [ ] Team collaboration features
- [ ] Cloud storage integration
- [ ] Advanced SEO controls

### Version 2.1
- [ ] Video content support
- [ ] Interactive elements (forms, charts)
- [ ] A/B testing capabilities
- [ ] Performance analytics
- [ ] White-label options

## 🐛 Known Issues

- Large PDF files (>50MB) may cause performance issues
- OCR requires an internet connection and an API key
- Some complex PowerPoint layouts may not convert perfectly
- Browser compatibility testing needed for older versions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [PDF.js](https://mozilla.github.io/pdf.js/) for PDF processing
- [JSZip](https://stuk.github.io/jszip/) for PowerPoint parsing  
- [Google Vision API](https://cloud.google.com/vision) for OCR capabilities
- The open-source community for inspiration and feedback
