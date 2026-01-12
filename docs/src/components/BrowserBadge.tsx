import { cn } from "@/lib/utils";

interface BrowserBadgeProps {
  browser: "chrome" | "firefox";
  available?: boolean;
  href?: string;
  className?: string;
}

export function BrowserBadge({ browser, available = true, href, className }: BrowserBadgeProps) {
  const content = (
    <div className={cn(
      "flex items-center gap-3 px-6 py-3 rounded-xl border transition-all duration-300",
      available 
        ? "bg-card border-border hover:border-primary/50 hover:bg-secondary cursor-pointer group" 
        : "bg-secondary/30 border-border/30 opacity-70",
      className
    )}>
      {browser === "chrome" ? (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="url(#chrome-gradient)" />
          <circle cx="12" cy="12" r="4" fill="white" />
          <path d="M12 8a4 4 0 0 1 3.46 2H22a10 10 0 0 0-9-6v4.26A4 4 0 0 1 12 8z" fill="#EA4335" />
          <path d="M15.46 10a4 4 0 0 1-1.73 5.46L17.27 22a10 10 0 0 0 4.73-12H15.46z" fill="#FBBC04" />
          <path d="M13.73 15.46A4 4 0 0 1 8 12H2a10 10 0 0 0 11.27 10l.46-6.54z" fill="#34A853" />
          <defs>
            <linearGradient id="chrome-gradient" x1="0" y1="0" x2="24" y2="24">
              <stop stopColor="#4285F4" />
              <stop offset="1" stopColor="#34A853" />
            </linearGradient>
          </defs>
        </svg>
      ) : (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="url(#firefox-gradient)" />
          <defs>
            <linearGradient id="firefox-gradient" x1="0" y1="0" x2="24" y2="24">
              <stop stopColor="#FF9500" />
              <stop offset="1" stopColor="#FF3B30" />
            </linearGradient>
          </defs>
        </svg>
      )}
      <div className="text-left">
        <p className={cn(
          "text-sm font-medium",
          available ? "text-foreground" : "text-muted-foreground"
        )}>
          {browser === "chrome" ? "Chrome Web Store" : "Firefox Add-ons"}
        </p>
        <p className="text-xs text-muted-foreground">
          {available ? "Install Now" : "Coming Soon"}
        </p>
      </div>
      {available && (
        <svg 
          className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300 ml-2" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </div>
  );

  if (available && href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return content;
}
