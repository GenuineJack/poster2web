# 🖥️ Medical Poster to Website Converter

Transform your medical conference posters into professional, responsive websites in minutes. This web-based tool automatically extracts content from PDF, Word documents, and text files, then creates beautiful, customizable websites that can be easily shared and accessed on any device.

## 🌟 Features

### Core Functionality
- **Multi-Format File Support**: Extract content from PDF, Word (DOCX), and text files
- **Image Handling**: Supports direct upload of PNG, JPG, and JPEG images, treating them as posters
- **Smart Content Organization**: Intelligently identifies sections like Abstract, Introduction, Methods, Results, and Conclusion from text-based files
- **Rich Text Editing**: Format your content with bold, italic, underline, superscript, and lists
- **Custom Content Blocks**: Add unlimited text and image blocks within each section
- **Image Support**: Upload images for both the logo and individual sections, including captions
- **Responsive Design**: Websites automatically adapt to desktop, tablet, and mobile devices, with a dedicated preview mode

### Customization Options
- **Multiple Layout Styles**:
  - Single Page Scroll - Traditional scrolling website
  - Section Navigation - Fixed navigation menu with section links
  - Hamburger Menu - A mobile-friendly collapsible menu
- **Design Controls**:
  - 5 pre-defined color schemes (Clinical, Research, Pharma, Modern, Academic)
  - Custom color picker for primary and secondary colors
  - 3 font styles (System, Serif, Monospace)
  - Adjustable text sizes for titles and content using a slider
  - Logo size control (60-200px)
  - Header Alignment (Center, Left, Right)
- **Section Management**:
  - Collapsible accordion interface for easy editing
  - Reorder sections and content blocks with up/down arrows
  - Add unlimited custom sections
  - Delete sections and content blocks

### Export Options
- **Standalone HTML**: A single file ready to deploy anywhere
- **React Component**: A modern React component with styled components
- **Next.js Page**: A server-side rendered page for Next.js projects

## 🚀 Quick Start

### Option 1: Use the Hosted Version
Simply open the `fixed-poster-converter-CLEAN2.html` file in a modern web browser. No installation or server required!

### Option 2: Local Development
```bash
# Clone the repository
git clone <your_repo_url>

# Navigate to project directory
cd medical-poster-converter

# Open the file directly
open fixed-poster-converter-CLEAN2.html
# or use a local server
python -m http.server 8000
# then navigate to http://localhost:8000
