import { useState } from "react";

import { TEAMPL_LOGO_URL } from "../constants/assets";

interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className = "", size = 36 }: LogoProps) {
  // KT Cloud Object Storage endpoints & bucket URLs for the logo image
  const sources = [
    TEAMPL_LOGO_URL,
    "https://objectstorage.kr-central-1.ktcloud.com/teampl-storage/ChatGPT%20Image%20May%2022,%202026,%2005_24_33%20PM.png",
    "/logo.png" // Local fallback
  ];

  const [srcIndex, setSrcIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleError = () => {
    if (srcIndex < sources.length - 1) {
      setSrcIndex(prev => prev + 1);
    }
  };

  return (
    <div 
      className={`relative flex items-center justify-center overflow-hidden transition-all duration-300 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Loading state / Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-indigo-500/10 dark:from-emerald-500/20 dark:to-indigo-500/20 animate-pulse rounded-xl" />
      )}
      
      <img
        src={sources[srcIndex]}
        alt="Teampl Logo"
        onLoad={() => setIsLoaded(true)}
        onError={handleError}
        className={`object-cover rounded-xl transition-all duration-500 select-none ${
          isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
