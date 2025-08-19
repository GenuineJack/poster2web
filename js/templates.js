/**
 * SITEWEAVE - TEMPLATES
 * Template definitions and initialization system
 */

// ===================================================
// TEMPLATE DEFINITIONS
// ===================================================

/**
 * Medical poster template
 */
const MEDICAL_POSTER_TEMPLATE = {
    id: 'medical-poster',
    name: 'Medical Poster',
    description: 'Research-focused with sections for Abstract, Methods, Results, Discussion',
    icon: '🏥',
    colorScheme: 'growth-green',
    sections: [
        {
            id: 'header',
            icon: '🏥',
            name: 'Header',
            isHeader: true,
            content: [
                { 
                    type: 'text', 
                    value: '<h1>Research Poster Title</h1><p><strong>Authors:</strong> Dr. Jane Smith¹, Dr. John Doe², Prof. Sarah Johnson¹</p><p><em>¹University Medical Center, ²Research Institute</em></p>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'abstract',
            icon: '📄',
            name: 'Abstract',
            content: [
                { 
                    type: 'text', 
                    value: '<p><strong>Background:</strong> Enter your study background here...</p><p><strong>Methods:</strong> Describe your methodology...</p><p><strong>Results:</strong> Present your key findings...</p><p><strong>Conclusions:</strong> State your conclusions...</p>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'introduction',
            icon: '📖',
            name: 'Introduction',
            content: [
                { 
                    type: 'text', 
                    value: '<p>Provide context and background for your research. Include relevant literature and the rationale for your study.</p>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'methods',
            icon: '🔬',
            name: 'Methods',
            content: [
                { 
                    type: 'text', 
                    value: '<p><strong>Study Design:</strong> Describe your study design...</p><p><strong>Participants:</strong> Detail your participant selection...</p><p><strong>Procedures:</strong> Explain your procedures...</p><p><strong>Analysis:</strong> Describe your analysis methods...</p>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'results',
            icon: '📊',
            name: 'Results',
            content: [
                { 
                    type: 'text', 
                    value: '<p>Present your findings clearly and objectively. Include statistical analyses where appropriate.</p>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'discussion',
            icon: '💬',
            name: 'Discussion',
            content: [
                { 
                    type: 'text', 
                    value: '<p>Interpret your results, discuss limitations, and compare with existing literature.</p>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'conclusion',
            icon: '✅',
            name: 'Conclusion',
            content: [
                { 
                    type: 'text', 
                    value: '<p>Summarize key findings and their implications for clinical practice or future research.</p>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'references',
            icon: '📚',
            name: 'References',
            content: [
                { 
                    type: 'text', 
                    value: '<ol><li>Smith J, et al. Example reference. Journal Name. 2024;1(1):1-10.</li><li>Doe J, et al. Another reference. Medical Journal. 2023;2(3):15-25.</li></ol>', 
                    allowHtml: false 
                }
            ]
        }
    ]
};

/**
 * Event page template
 */
const EVENT_PAGE_TEMPLATE = {
    id: 'event-page',
    name: 'Event Page',
    description: 'Event details, schedule, registration, speakers',
    icon: '🎟️',
    colorScheme: 'modern-teal',
    sections: [
        {
            id: 'header',
            icon: '🎟️',
            name: 'Event Header',
            isHeader: true,
            content: [
                { 
                    type: 'text', 
                    value: '<h1>Conference Name 2025</h1><p><strong>Date:</strong> March 15-17, 2025</p><p><strong>Location:</strong> Convention Center, City</p>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'about',
            icon: '📋',
            name: 'About the Event',
            content: [
                { 
                    type: 'text', 
                    value: '<p>Join us for an exciting three-day conference featuring industry leaders, cutting-edge research, and networking opportunities.</p><p>This year\'s theme: <strong>"Innovation in Action"</strong></p>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'schedule',
            icon: '⏰',
            name: 'Schedule',
            content: [
                { 
                    type: 'text', 
                    value: '<h3>Day 1 - March 15</h3><ul><li><strong>9:00 AM</strong> - Registration & Welcome Coffee</li><li><strong>10:00 AM</strong> - Opening Keynote</li><li><strong>12:00 PM</strong> - Lunch & Networking</li><li><strong>2:00 PM</strong> - Breakout Sessions</li><li><strong>5:00 PM</strong> - Welcome Reception</li></ul>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'speakers',
            icon: '🎤',
            name: 'Speakers',
            content: [
                { 
                    type: 'text', 
                    value: '<p>Meet our distinguished speakers and industry experts who will be sharing their insights.</p><ul><li><strong>Dr. Jane Smith</strong> - AI Research Lead at TechCorp</li><li><strong>Prof. John Doe</strong> - Innovation Director at FutureLab</li><li><strong>Sarah Johnson</strong> - CEO of StartupSuccess</li></ul>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'registration',
            icon: '📝',
            name: 'Registration',
            content: [
                { 
                    type: 'text', 
                    value: '<p><strong>Early Bird Special</strong> (until February 1):<br>• Regular: $299<br>• Student: $99<br>• Group (5+): $249 each</p><p><strong>Standard Pricing:</strong><br>• Regular: $399<br>• Student: $149</p><p>Register now to secure your spot!</p>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'contact',
            icon: '📧',
            name: 'Contact',
            content: [
                { 
                    type: 'text', 
                    value: '<p>For questions and inquiries:</p><p>📧 Email: info@conference2025.com<br>📞 Phone: (555) 123-4567<br>🌐 Website: www.conference2025.com</p>', 
                    allowHtml: false 
                }
            ]
        }
    ]
};

/**
 * Product launch template
 */
const PRODUCT_LAUNCH_TEMPLATE = {
    id: 'product-launch',
    name: 'Product Launch',
    description: 'Feature highlights, benefits, launch details',
    icon: '🚀',
    colorScheme: 'sunset-orange',
    sections: [
        {
            id: 'header',
            icon: '🚀',
            name: 'Product Hero',
            isHeader: true,
            content: [
                { 
                    type: 'text', 
                    value: '<h1>Introducing ProductName</h1><p>The revolutionary solution that changes everything</p><p><strong>Launch Date: Coming Spring 2025</strong></p>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'features',
            icon: '⭐',
            name: 'Key Features',
            content: [
                { 
                    type: 'text', 
                    value: '<h3>What Makes Us Different</h3><ul><li><strong>Lightning Fast:</strong> 10x faster than competitors</li><li><strong>Easy to Use:</strong> No learning curve required</li><li><strong>Secure:</strong> Enterprise-grade security built-in</li><li><strong>Scalable:</strong> Grows with your business</li></ul>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'benefits',
            icon: '💎',
            name: 'Benefits',
            content: [
                { 
                    type: 'text', 
                    value: '<p>Discover how our product will transform your workflow:</p><ul><li>Save 10+ hours per week</li><li>Reduce errors by 95%</li><li>Increase productivity by 300%</li><li>Cut costs by 50%</li></ul>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'demo',
            icon: '🎬',
            name: 'See It in Action',
            content: [
                { 
                    type: 'text', 
                    value: '<p>Watch our product demo or schedule a personalized walkthrough with our team.</p><p><strong>Live Demo Sessions:</strong><br>• Every Tuesday at 2 PM EST<br>• Every Thursday at 11 AM PST</p>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'pricing',
            icon: '💰',
            name: 'Pricing',
            content: [
                { 
                    type: 'text', 
                    value: '<h3>Simple, Transparent Pricing</h3><p><strong>Starter</strong> - $49/month<br>• Up to 5 users<br>• Core features<br>• Email support</p><p><strong>Professional</strong> - $149/month<br>• Up to 20 users<br>• All features<br>• Priority support</p><p><strong>Enterprise</strong> - Custom pricing<br>• Unlimited users<br>• Custom features<br>• Dedicated support</p>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'cta',
            icon: '🎯',
            name: 'Get Started',
            content: [
                { 
                    type: 'text', 
                    value: '<p><strong>Join the waitlist today and get 50% off your first 3 months!</strong></p><p>Be among the first to experience the future.</p>', 
                    allowHtml: false 
                }
            ]
        }
    ]
};

/**
 * Portfolio template
 */
const PORTFOLIO_TEMPLATE = {
    id: 'portfolio',
    name: 'Portfolio',
    description: 'Individual showcase with projects and bio',
    icon: '👤',
    colorScheme: 'premium-purple',
    sections: [
        {
            id: 'header',
            icon: '👤',
            name: 'About Me',
            isHeader: true,
            content: [
                { 
                    type: 'text', 
                    value: '<h1>Your Name</h1><p><strong>Professional Title</strong> | Location</p><p>Passionate about creating amazing experiences through design and technology.</p>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'experience',
            icon: '💼',
            name: 'Experience',
            content: [
                { 
                    type: 'text', 
                    value: '<h3>Senior Developer</h3><p><strong>Tech Company</strong> | 2022 - Present</p><p>Leading development of cutting-edge web applications using modern technologies.</p><h3>Full Stack Developer</h3><p><strong>Startup Inc</strong> | 2020 - 2022</p><p>Built and maintained multiple client projects from concept to deployment.</p>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'projects',
            icon: '🎯',
            name: 'Featured Projects',
            content: [
                { 
                    type: 'text', 
                    value: '<h3>Project Alpha</h3><p>A revolutionary platform that connects businesses with customers.</p><p><strong>Technologies:</strong> React, Node.js, MongoDB</p><h3>Project Beta</h3><p>Mobile app for real-time collaboration and communication.</p><p><strong>Technologies:</strong> React Native, Firebase, GraphQL</p>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'skills',
            icon: '🛠️',
            name: 'Skills',
            content: [
                { 
                    type: 'text', 
                    value: '<p><strong>Programming:</strong> JavaScript, Python, TypeScript, Java</p><p><strong>Frameworks:</strong> React, Vue, Angular, Node.js, Django</p><p><strong>Tools:</strong> Git, Docker, AWS, CI/CD, Kubernetes</p><p><strong>Soft Skills:</strong> Leadership, Communication, Problem-solving, Team collaboration</p>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'education',
            icon: '🎓',
            name: 'Education',
            content: [
                { 
                    type: 'text', 
                    value: '<h3>Master of Computer Science</h3><p><strong>University Name</strong> | 2018 - 2020</p><p>Specialized in Machine Learning and Artificial Intelligence</p><h3>Bachelor of Software Engineering</h3><p><strong>College Name</strong> | 2014 - 2018</p><p>Graduated with Honors</p>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'contact',
            icon: '📬',
            name: 'Get in Touch',
            content: [
                { 
                    type: 'text', 
                    value: '<p>I\'m always interested in new opportunities and collaborations.</p><p>📧 your.email@example.com<br>💼 linkedin.com/in/yourprofile<br>🐙 github.com/yourusername<br>🌐 yourwebsite.com</p>', 
                    allowHtml: false 
                }
            ]
        }
    ]
};

/**
 * Landing page template
 */
const LANDING_PAGE_TEMPLATE = {
    id: 'landing-page',
    name: 'Landing Page',
    description: 'Lead capture focused with forms and CTAs',
    icon: '🎯',
    colorScheme: 'trust-blue',
    sections: [
        {
            id: 'header',
            icon: '🎯',
            name: 'Hero Section',
            isHeader: true,
            content: [
                { 
                    type: 'text', 
                    value: '<h1>Solve Your Biggest Challenge</h1><p>Get the solution that thousands of professionals trust</p><p><strong>Start your free trial today - No credit card required</strong></p>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'problem',
            icon: '⚠️',
            name: 'The Problem',
            content: [
                { 
                    type: 'text', 
                    value: '<p>Are you struggling with [specific pain point]?</p><p>You\'re not alone. Studies show that <strong>80% of professionals</strong> face this exact challenge every day.</p><ul><li>Wasting hours on repetitive tasks</li><li>Missing important deadlines</li><li>Losing track of important information</li></ul>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'solution',
            icon: '💡',
            name: 'Our Solution',
            content: [
                { 
                    type: 'text', 
                    value: '<p>Introducing our proven system that has helped over <strong>10,000 people</strong> overcome this challenge.</p><p>Our unique approach combines:</p><ul><li>Cutting-edge technology</li><li>Proven methodologies</li><li>Expert support</li></ul>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'benefits',
            icon: '✅',
            name: 'Key Benefits',
            content: [
                { 
                    type: 'text', 
                    value: '<h3>What You\'ll Get:</h3><ul><li><strong>Save 10+ hours per week</strong> with automation</li><li><strong>Increase productivity by 200%</strong> with our streamlined workflow</li><li><strong>Reduce stress</strong> and improve work-life balance</li><li><strong>Join a community</strong> of successful professionals</li></ul>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'testimonials',
            icon: '⭐',
            name: 'Success Stories',
            content: [
                { 
                    type: 'text', 
                    value: '<blockquote>"This completely transformed how I work. I can\'t imagine going back!"<br><em>- Sarah J., Marketing Director</em></blockquote><blockquote>"The ROI was immediate. We saved thousands in the first month alone."<br><em>- Mike T., CEO</em></blockquote>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'cta',
            icon: '🚀',
            name: 'Get Started Today',
            content: [
                { 
                    type: 'text', 
                    value: '<p><strong>Limited Time Offer: Get 50% off your first 3 months!</strong></p><p>✅ 14-day free trial<br>✅ No credit card required<br>✅ Cancel anytime<br>✅ Full money-back guarantee</p><p>Join thousands of satisfied customers today!</p>', 
                    allowHtml: false 
                }
            ]
        }
    ]
};

/**
 * Company profile template
 */
const COMPANY_PROFILE_TEMPLATE = {
    id: 'company-profile',
    name: 'Company Profile',
    description: 'About, team, services, contact',
    icon: '🏢',
    colorScheme: 'professional-grey',
    sections: [
        {
            id: 'header',
            icon: '🏢',
            name: 'Company Overview',
            isHeader: true,
            content: [
                { 
                    type: 'text', 
                    value: '<h1>Company Name</h1><p><strong>Your Trusted Partner in Innovation</strong></p><p>Delivering excellence since 2010</p>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'about',
            icon: '📖',
            name: 'About Us',
            content: [
                { 
                    type: 'text', 
                    value: '<p>We are a leading provider of innovative solutions that help businesses achieve their goals and transform their operations.</p><p><strong>Our Mission:</strong> To empower businesses with cutting-edge technology and exceptional service.</p><p><strong>Our Vision:</strong> To be the global leader in digital transformation solutions.</p>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'services',
            icon: '⚙️',
            name: 'Our Services',
            content: [
                { 
                    type: 'text', 
                    value: '<h3>What We Offer</h3><ul><li><strong>Consulting:</strong> Strategic guidance for your digital transformation</li><li><strong>Development:</strong> Custom software solutions tailored to your needs</li><li><strong>Support:</strong> 24/7 dedicated support for all our clients</li><li><strong>Training:</strong> Comprehensive training programs for your team</li></ul>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'team',
            icon: '👥',
            name: 'Our Team',
            content: [
                { 
                    type: 'text', 
                    value: '<p>Meet the passionate professionals who make our success possible.</p><p><strong>100+ experts</strong> across technology, design, and business</p><p><strong>15+ years</strong> average industry experience</p><p><strong>30+ certifications</strong> in leading technologies</p>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'achievements',
            icon: '🏆',
            name: 'Achievements',
            content: [
                { 
                    type: 'text', 
                    value: '<ul><li>🏆 Best Tech Company 2024</li><li>⭐ 5-Star Customer Rating</li><li>🌍 500+ Global Clients</li><li>📈 200% Growth Year-over-Year</li></ul>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'contact',
            icon: '📞',
            name: 'Contact Us',
            content: [
                { 
                    type: 'text', 
                    value: '<p><strong>Get in Touch</strong></p><p>📍 123 Business Street, Suite 100<br>City, State 12345</p><p>📞 (555) 123-4567<br>📧 hello@company.com<br>🌐 www.company.com</p><p><strong>Office Hours:</strong><br>Monday - Friday: 9:00 AM - 6:00 PM<br>Saturday - Sunday: Closed</p>', 
                    allowHtml: false 
                }
            ]
        }
    ]
};

/**
 * Academic paper template
 */
const ACADEMIC_PAPER_TEMPLATE = {
    id: 'academic-paper',
    name: 'Academic Paper',
    description: 'Structured academic content presentation',
    icon: '🎓',
    colorScheme: 'bold-red',
    sections: [
        {
            id: 'header',
            icon: '🎓',
            name: 'Paper Title',
            isHeader: true,
            content: [
                { 
                    type: 'text', 
                    value: '<h1>Research Paper Title</h1><p><strong>Authors:</strong> First Author¹, Second Author², Third Author¹</p><p><em>¹Department, University Name<br>²Another Department, Another University</em></p>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'abstract',
            icon: '📋',
            name: 'Abstract',
            content: [
                { 
                    type: 'text', 
                    value: '<p>This paper presents... [Provide a concise summary of your research including background, methods, results, and conclusions in 150-250 words]</p>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'keywords',
            icon: '🔑',
            name: 'Keywords',
            content: [
                { 
                    type: 'text', 
                    value: '<p><strong>Keywords:</strong> keyword1, keyword2, keyword3, keyword4, keyword5</p>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'introduction',
            icon: '📖',
            name: 'Introduction',
            content: [
                { 
                    type: 'text', 
                    value: '<p>Introduce the research problem, review relevant literature, and state your research objectives and hypotheses.</p>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'literature',
            icon: '📚',
            name: 'Literature Review',
            content: [
                { 
                    type: 'text', 
                    value: '<p>Discuss previous work in the field and how your research builds upon or differs from existing studies.</p>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'methodology',
            icon: '🔬',
            name: 'Methodology',
            content: [
                { 
                    type: 'text', 
                    value: '<h3>Research Design</h3><p>Describe your research design...</p><h3>Data Collection</h3><p>Explain your data collection methods...</p><h3>Analysis Methods</h3><p>Detail your analytical approaches...</p>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'results',
            icon: '📊',
            name: 'Results',
            content: [
                { 
                    type: 'text', 
                    value: '<p>Present your research findings objectively with supporting data and statistical analysis.</p>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'discussion',
            icon: '💭',
            name: 'Discussion',
            content: [
                { 
                    type: 'text', 
                    value: '<p>Interpret your findings, discuss implications, compare with previous studies, and acknowledge limitations.</p>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'conclusion',
            icon: '🎯',
            name: 'Conclusion',
            content: [
                { 
                    type: 'text', 
                    value: '<p>Summarize key contributions, practical implications, and suggest areas for future research.</p>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'references',
            icon: '📚',
            name: 'References',
            content: [
                { 
                    type: 'text', 
                    value: '<p>[1] Author, A. (2024). Title of paper. Journal Name, 1(1), 1-10.</p><p>[2] Author, B., & Author, C. (2023). Another paper title. Conference Proceedings, 123-456.</p>', 
                    allowHtml: false 
                }
            ]
        }
    ]
};

/**
 * Blank template for starting from scratch
 */
const BLANK_TEMPLATE = {
    id: 'blank',
    name: 'Blank',
    description: 'Start from scratch with complete creative control',
    icon: '📄',
    colorScheme: 'growth-green',
    sections: [
        {
            id: 'header',
            icon: '✨',
            name: 'Header',
            isHeader: true,
            content: [
                { 
                    type: 'text', 
                    value: '<h1>Your Title Here</h1><p>Subtitle or description</p>', 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'content',
            icon: '📝',
            name: 'Content',
            content: [
                { 
                    type: 'text', 
                    value: '<p>Start writing your content here...</p>', 
                    allowHtml: false 
                }
            ]
        }
    ]
};

// ===================================================
// TEMPLATE REGISTRY
// ===================================================

/**
 * All available templates
 */
const TEMPLATES = {
    'medical-poster': MEDICAL_POSTER_TEMPLATE,
    'event-page': EVENT_PAGE_TEMPLATE,
    'landing-page': LANDING_PAGE_TEMPLATE,
    'product-launch': PRODUCT_LAUNCH_TEMPLATE,
    'portfolio': PORTFOLIO_TEMPLATE,
    'company-profile': COMPANY_PROFILE_TEMPLATE,
    'academic-paper': ACADEMIC_PAPER_TEMPLATE,
    'blank': BLANK_TEMPLATE
};

// ===================================================
// TEMPLATE FUNCTIONS
// ===================================================

/**
 * Get all available templates
 */
function getAllTemplates() {
    return Object.values(TEMPLATES);
}

/**
 * Get template by ID
 */
function getTemplate(templateId) {
    return TEMPLATES[templateId] || null;
}

/**
 * Create project from template
 */
function createProjectFromTemplate(templateId, customTitle = null) {
    const template = getTemplate(templateId);
    if (!template) {
        console.error(`Template not found: ${templateId}`);
        return createProjectFromTemplate('blank', customTitle);
    }
    
    // Deep clone the template to avoid modifying the original
    const project = JSON.parse(JSON.stringify(template));
    
    // Set custom title if provided
    if (customTitle) {
        project.title = customTitle;
        // Update header section title if it exists
        const headerSection = project.sections.find(s => s.isHeader);
        if (headerSection && headerSection.content.length > 0) {
            headerSection.content[0].value = headerSection.content[0].value.replace(
                /<h1>.*?<\/h1>/,
                `<h1>${escapeHtml(customTitle)}</h1>`
            );
        }
    }
    
    // Add unique IDs to ensure no conflicts
    const timestamp = Date.now();
    project.sections = project.sections.map((section, index) => ({
        ...section,
        id: `${section.id}-${timestamp}-${index}`,
        content: section.content.map((content, contentIndex) => ({
            ...content,
            id: `content-${timestamp}-${index}-${contentIndex}`
        }))
    }));
    
    // Set default logo URL
    project.logoUrl = null;
    
    return project;
}

/**
 * Suggest template based on content analysis
 */
function suggestTemplate(extractedText) {
    if (!extractedText) return 'blank';
    
    const text = extractedText.toLowerCase();
    
    // Keywords for different template types with weighted scoring
    const patterns = {
        'medical-poster': {
            keywords: ['abstract', 'methods', 'results', 'discussion', 'conclusion', 'background', 'clinical', 'study', 'patient', 'treatment', 'hypothesis', 'intervention', 'outcome'],
            weight: 1.5
        },
        'academic-paper': {
            keywords: ['research', 'methodology', 'findings', 'literature', 'hypothesis', 'analysis', 'journal', 'publication', 'theory', 'empirical', 'qualitative', 'quantitative'],
            weight: 1.3
        },
        'event-page': {
            keywords: ['conference', 'workshop', 'seminar', 'event', 'registration', 'schedule', 'speaker', 'agenda', 'venue', 'attendee', 'program', 'session'],
            weight: 1.4
        },
        'product-launch': {
            keywords: ['product', 'launch', 'features', 'benefits', 'pricing', 'demo', 'solution', 'release', 'announcement', 'innovation', 'unveiling'],
            weight: 1.2
        },
        'company-profile': {
            keywords: ['company', 'business', 'services', 'team', 'about us', 'contact', 'organization', 'mission', 'vision', 'values', 'corporate'],
            weight: 1.1
        },
        'portfolio': {
            keywords: ['portfolio', 'experience', 'projects', 'skills', 'cv', 'resume', 'about me', 'work', 'showcase', 'achievements'],
            weight: 1.2
        },
        'landing-page': {
            keywords: ['sign up', 'download', 'free trial', 'get started', 'call to action', 'conversion', 'offer', 'subscribe', 'limited time'],
            weight: 1.0
        }
    };
    
    let bestMatch = 'blank';
    let bestScore = 0;
    
    Object.entries(patterns).forEach(([templateId, config]) => {
        const score = config.keywords.reduce((acc, keyword) => {
            return acc + (text.includes(keyword) ? config.weight : 0);
        }, 0);
        
        if (score > bestScore) {
            bestScore = score;
            bestMatch = templateId;
        }
    });
    
    // Require minimum score threshold
    return bestScore > 2 ? bestMatch : 'blank';
}

/**
 * Get template settings (color scheme, fonts, etc.)
 */
function getTemplateSettings(templateId) {
    const template = getTemplate(templateId);
    if (!template) return getDefaultSettings();
    
    const colorScheme = window.LWB_Utils?.getColorScheme(template.colorScheme) || { primary: '#16a34a', secondary: '#15803d' };
    
    return {
        primaryColor: colorScheme.primary,
        secondaryColor: colorScheme.secondary,
        titleSize: '32',
        contentSize: '16',
        fontStyle: 'system',
        headerAlignment: 'center',
        logoSize: '120',
        layoutStyle: 'single'
    };
}

/**
 * Get default settings
 */
function getDefaultSettings() {
    return {
        primaryColor: '#16a34a',
        secondaryColor: '#15803d',
        titleSize: '32',
        contentSize: '16',
        fontStyle: 'system',
        headerAlignment: 'center',
        logoSize: '120',
        layoutStyle: 'single'
    };
}

/**
 * Merge user content with template structure
 */
function mergeContentWithTemplate(templateId, extractedSections) {
    const template = getTemplate(templateId);
    if (!template) return extractedSections;
    
    const mergedSections = JSON.parse(JSON.stringify(template.sections));
    
    // Try to match extracted sections with template sections
    extractedSections.forEach(extracted => {
        const extractedName = extracted.name.toLowerCase();
        
        const templateMatch = mergedSections.find(templateSection => {
            const templateName = templateSection.name.toLowerCase();
            return templateName.includes(extractedName) ||
                   extractedName.includes(templateName) ||
                   (extracted.icon === templateSection.icon);
        });
        
        if (templateMatch && !templateMatch.isHeader) {
            // Merge content, keeping template structure but using extracted content
            if (extracted.content && extracted.content.length > 0) {
                templateMatch.content = extracted.content;
            }
        }
    });
    
    // Add any extracted sections that didn't match template sections
    const unmatchedSections = extractedSections.filter(extracted => {
        const extractedName = extracted.name.toLowerCase();
        return !mergedSections.some(templateSection => {
            const templateName = templateSection.name.toLowerCase();
            return templateName.includes(extractedName) || extractedName.includes(templateName);
        });
    });
    
    mergedSections.push(...unmatchedSections);
    
    return mergedSections;
}

/**
 * Validate template structure
 */
function validateTemplate(template) {
    const errors = [];
    
    if (!template.id) errors.push('Template must have an ID');
    if (!template.name) errors.push('Template must have a name');
    if (!template.sections || !Array.isArray(template.sections)) {
        errors.push('Template must have sections array');
    } else {
        // Validate sections
        let hasHeader = false;
        template.sections.forEach((section, index) => {
            if (!section.id) errors.push(`Section ${index} must have an ID`);
            if (!section.name) errors.push(`Section ${index} must have a name`);
            if (!section.content || !Array.isArray(section.content)) {
                errors.push(`Section ${index} must have content array`);
            }
            if (section.isHeader) hasHeader = true;
        });
        
        if (!hasHeader) {
            errors.push('Template must have at least one header section');
        }
    }
    
    return errors;
}

/**
 * Escape HTML for safe display
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===================================================
// EXPORTS
// ===================================================

// Make functions and templates available globally for the modular system
window.LWB_Templates = {
    // Template registry
    TEMPLATES,
    getAllTemplates,
    getTemplate,
    
    // Template operations
    createProjectFromTemplate,
    suggestTemplate,
    getTemplateSettings,
    getDefaultSettings,
    mergeContentWithTemplate,
    validateTemplate
};