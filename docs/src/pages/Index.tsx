import { Zap, Brain, Code, Lightbulb, Puzzle, Globe, Linkedin, Github, Twitter } from "lucide-react";
import { FeatureCard } from "@/components/FeatureCard";
import { BrowserBadge } from "@/components/BrowserBadge";
import { BackgroundEffects } from "@/components/BackgroundEffects";

const features = [
  {
    icon: Lightbulb,
    title: "Smart Hints",
    description: "Get intelligent hints to guide you through problem-solving step by step."
  },
  {
    icon: Code,
    title: "Any Language",
    description: "Solutions available in Python, Java, C++, JavaScript, and more."
  },
  {
    icon: Brain,
    title: "AI-Powered",
    description: "Advanced AI understands your problem and provides tailored assistance."
  },
  {
    icon: Zap,
    title: "LeetCode Ready",
    description: "Seamlessly integrates with LeetCode for instant coding help."
  }
];

const Index = () => {
  return (
    <div className="relative h-screen w-full flex flex-col">
      <BackgroundEffects />
      
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-muted-foreground">Now available on Chrome</span>
          </div>
          
          {/* Title */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
            <span className="gradient-text">AlgoSpark</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10">
            Your AI coding assistant for LeetCode. Get smart hints and solutions in any programming language.
          </p>
          
          {/* Browser Badges */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <BrowserBadge 
              browser="chrome" 
              available={true}
              href="https://chromewebstore.google.com/detail/algospark-ai-code-helper/nfifhhjfpkpmhpcfgdcckkcdanfbeaah"
            />
            <BrowserBadge 
              browser="firefox" 
              available={false}
            />
          </div>
          {/* GitHub Repo Link */}
          <a 
            href="https://github.com/yourusername/algospark" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-full bg-secondary/50 border border-border text-muted-foreground hover:text-primary hover:border-primary/50 transition-all duration-300"
          >
            <Github className="w-4 h-4" />
            <span className="text-sm">View Source on GitHub</span>
          </a>
        </div>
        
        {/* Features Grid */}
        <div className="w-full max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="relative z-10 py-6">
        <div className="flex flex-col items-center gap-4">
          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a 
              href="https://klka.in" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-secondary/50 border border-border text-muted-foreground hover:text-primary hover:border-primary/50 transition-all duration-300"
              aria-label="Website"
            >
              <Globe className="w-5 h-5" />
            </a>
            <a 
              href="https://linkedin.com/in/kamalkoranga" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-secondary/50 border border-border text-muted-foreground hover:text-primary hover:border-primary/50 transition-all duration-300"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </a>
            <a 
              href="https://github.com/kamalkoranga" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-secondary/50 border border-border text-muted-foreground hover:text-primary hover:border-primary/50 transition-all duration-300"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
            <a 
              href="https://x.com/klkaxkaal" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-secondary/50 border border-border text-muted-foreground hover:text-primary hover:border-primary/50 transition-all duration-300"
              aria-label="Twitter"
            >
              <Twitter className="w-5 h-5" />
            </a>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} AlgoSpark. Built with ❤️ for coders.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
