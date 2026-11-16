import React from "react";

// KisanSathi Logo Icon
export const KisanSathiLogoIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Earth Soil Arcs */}
    <path d="M6 34C14 42 34 42 42 34" stroke="#2D6A4F" strokeWidth="4" strokeLinecap="round" />
    <path d="M10 39C16 45 32 45 38 39" stroke="#E76F51" strokeWidth="3" strokeLinecap="round" />
    {/* Sprout Stem */}
    <path d="M24 38V18" stroke="#2D6A4F" strokeWidth="3.5" strokeLinecap="round" />
    {/* Left Leaf */}
    <path d="M24 24C16 23 10 16 11 8C19 9 24 16 24 24Z" fill="#52B788" stroke="#1B4332" strokeWidth="1.5" />
    {/* Right Leaf */}
    <path d="M24 20C32 19 38 12 37 4C29 5 24 12 24 20Z" fill="#74C69D" stroke="#1B4332" strokeWidth="1.5" />
    {/* Small Center Bud */}
    <circle cx="24" cy="16" r="3" fill="#D8F3DC" />
  </svg>
);

// Sidebar Bottom Scenic Farm Landscape
export const SidebarFarmLandscape: React.FC<{ className?: string }> = ({ className = "w-full h-auto" }) => (
  <svg viewBox="0 0 260 170" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#E9F5EB" />
        <stop offset="100%" stopColor="#FFFFFF" />
      </linearGradient>
      <linearGradient id="hillGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#C7E6C9" />
        <stop offset="100%" stopColor="#A5D6A7" />
      </linearGradient>
      <linearGradient id="hillGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#81C784" />
        <stop offset="100%" stopColor="#4CAF50" />
      </linearGradient>
      <linearGradient id="foregroundCrop" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#43A047" />
        <stop offset="100%" stopColor="#2E7D32" />
      </linearGradient>
    </defs>

    {/* Sky & Distant Mountains */}
    <rect width="260" height="170" fill="url(#skyGrad)" rx="16" />
    <path d="M-10 110 Q40 60 110 95 Q180 65 270 100 L270 170 L-10 170 Z" fill="url(#hillGrad1)" opacity="0.7" />
    
    {/* Middle Hill */}
    <path d="M-20 125 Q70 85 160 115 Q220 100 280 130 L280 170 L-20 170 Z" fill="url(#hillGrad2)" />

    {/* Farm House / Village Hut */}
    <g transform="translate(32, 100)">
      {/* House Wall */}
      <rect x="10" y="24" width="46" height="24" fill="#D7CCC8" stroke="#8D6E63" strokeWidth="1" rx="2" />
      {/* Roof */}
      <path d="M5 24 L33 4 L61 24 Z" fill="#A1887F" stroke="#6D4C41" strokeWidth="1.2" />
      <path d="M12 24 L33 8 L54 24 Z" fill="#8D6E63" opacity="0.3" />
      {/* Door */}
      <rect x="28" y="32" width="10" height="16" fill="#5D4037" rx="1" />
      {/* Window */}
      <rect x="14" y="30" width="8" height="8" fill="#FFF9C4" stroke="#8D6E63" strokeWidth="0.8" />
      <line x1="18" y1="30" x2="18" y2="38" stroke="#8D6E63" strokeWidth="0.8" />
      <line x1="14" y1="34" x2="22" y2="34" stroke="#8D6E63" strokeWidth="0.8" />
    </g>

    {/* Big Farm Tree */}
    <g transform="translate(100, 78)">
      {/* Trunk */}
      <path d="M22 45 L20 62 L26 62 L24 45 Z" fill="#5D4037" />
      {/* Foliage Clouds */}
      <circle cx="16" cy="36" r="14" fill="#388E3C" />
      <circle cx="28" cy="32" r="16" fill="#4CAF50" />
      <circle cx="22" cy="20" r="13" fill="#66BB6A" />
      <circle cx="34" cy="38" r="12" fill="#2E7D32" />
    </g>

    {/* Furrow lines / Crop Rows */}
    <path d="M-10 160 Q80 135 270 148" stroke="#2E7D32" strokeWidth="2.5" strokeDasharray="6,4" />
    <path d="M-10 150 Q100 120 270 140" stroke="#1B5E20" strokeWidth="2" strokeDasharray="5,4" />

    {/* Foreground Sprout Leaves */}
    <g transform="translate(0, 130)">
      <path d="M0 40 Q25 15 50 40 L50 40 Z" fill="url(#foregroundCrop)" />
      <path d="M30 40 Q65 10 95 40 Z" fill="#2E7D32" />
      <path d="M190 40 Q225 12 260 40 Z" fill="url(#foregroundCrop)" />
      <path d="M220 40 Q245 18 270 40 Z" fill="#1B5E20" />
    </g>

    {/* Distant Birds */}
    <path d="M60 45 Q64 42 68 45 Q72 42 76 45" stroke="#78909C" strokeWidth="1" strokeLinecap="round" fill="none" />
    <path d="M85 38 Q88 35 91 38 Q94 35 97 38" stroke="#78909C" strokeWidth="0.8" strokeLinecap="round" fill="none" />
  </svg>
);

// Farmer Mascot with White Turban (For Hero Banner)
export const FarmerHeroMascot: React.FC<{ className?: string }> = ({ className = "w-48 h-48" }) => (
  <svg viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="skinTone" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#E0A96D" />
        <stop offset="100%" stopColor="#C68B59" />
      </linearGradient>
      <linearGradient id="turbanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#E2E8F0" />
      </linearGradient>
      <linearGradient id="kurtaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#F8FAFC" />
        <stop offset="100%" stopColor="#E2E8F0" />
      </linearGradient>
      <linearGradient id="scarfGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#388E3C" />
        <stop offset="100%" stopColor="#1B5E20" />
      </linearGradient>
    </defs>

    {/* Turban (Pagri) */}
    <g id="turban">
      <path d="M55 70 C50 40, 85 20, 105 20 C130 20, 155 40, 150 70 C155 60, 140 35, 105 35 C70 35, 55 60, 55 70 Z" fill="url(#turbanGrad)" stroke="#CBD5E1" strokeWidth="1.5" />
      <path d="M50 68 C55 45, 100 35, 148 50 C152 68, 140 82, 105 80 C70 80, 50 75, 50 68 Z" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1.2" />
      {/* Turban folds */}
      <path d="M60 55 Q105 45 145 60" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
      <path d="M55 65 Q105 58 140 70" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
      {/* Turban tail/fan */}
      <path d="M135 25 C145 15, 160 20, 155 45 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
    </g>

    {/* Ears */}
    <ellipse cx="65" cy="100" rx="8" ry="12" fill="url(#skinTone)" />
    <ellipse cx="145" cy="100" rx="8" ry="12" fill="url(#skinTone)" />

    {/* Face */}
    <path d="M68 85 C68 75, 142 75, 142 85 C142 120, 135 140, 105 145 C75 140, 68 120, 68 85 Z" fill="url(#skinTone)" />

    {/* Eyes & Eyebrows */}
    <path d="M80 88 Q88 83 96 88" stroke="#332211" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M114 88 Q122 83 130 88" stroke="#332211" strokeWidth="2.5" strokeLinecap="round" />
    <ellipse cx="88" cy="95" rx="3.5" ry="4.5" fill="#2D1F10" />
    <ellipse cx="122" cy="95" rx="3.5" ry="4.5" fill="#2D1F10" />
    <circle cx="89.5" cy="93.5" r="1.2" fill="#FFFFFF" />
    <circle cx="123.5" cy="93.5" r="1.2" fill="#FFFFFF" />

    {/* Nose */}
    <path d="M105 92 L102 110 Q105 113 108 110 Z" fill="#B77947" opacity="0.7" />

    {/* Mustache & Smile */}
    <path d="M84 116 C92 112, 102 118, 105 120 C108 118, 118 112, 126 116 C132 120, 120 126, 105 123 C90 126, 78 120, 84 116 Z" fill="#2D1F10" />
    <path d="M96 128 Q105 133 114 128" stroke="#78350F" strokeWidth="2" strokeLinecap="round" fill="none" />

    {/* Neck */}
    <path d="M90 138 L90 155 L120 155 L120 138 Z" fill="url(#skinTone)" />

    {/* Shoulders & White Kurta */}
    <path d="M40 170 C40 150, 80 148, 105 148 C130 148, 170 150, 170 170 L175 240 L35 240 Z" fill="url(#kurtaGrad)" stroke="#CBD5E1" strokeWidth="1.5" />

    {/* Green Gamcha / Angavastram Scarf */}
    <path d="M72 150 C72 165, 65 195, 60 240 L82 240 C86 200, 90 170, 92 150 Z" fill="url(#scarfGrad)" />
    <path d="M138 150 C138 165, 145 195, 150 240 L128 240 C124 200, 120 170, 118 150 Z" fill="url(#scarfGrad)" />

    {/* Folded Arms */}
    <g id="folded-arms">
      <path d="M45 185 C55 215, 80 225, 105 225 C130 225, 155 215, 165 185" stroke="#94A3B8" strokeWidth="2" fill="none" />
      {/* Forearms crossed */}
      <rect x="62" y="195" width="86" height="30" rx="12" fill="url(#skinTone)" stroke="#A0693B" strokeWidth="1.5" />
      <rect x="52" y="180" width="30" height="24" rx="8" fill="url(#kurtaGrad)" />
      <rect x="128" y="180" width="30" height="24" rx="8" fill="url(#kurtaGrad)" />
    </g>
  </svg>
);

// Farmer Avatar Icon (For Top Bar)
export const FarmerAvatarIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="30" cy="30" r="30" fill="#E8F5E9" />
    {/* Turban */}
    <path d="M16 22 C15 12, 26 6, 31 6 C39 6, 46 12, 45 22 C47 18, 42 10, 31 10 C20 10, 16 18, 16 22 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
    <path d="M15 21 C17 14, 30 11, 45 15 C46 21, 42 26, 31 25 C20 25, 15 23, 15 21 Z" fill="#F8FAFC" />
    {/* Face */}
    <path d="M20 26 C20 23, 41 23, 41 26 C41 38, 39 44, 30 46 C22 44, 20 38, 20 26 Z" fill="#DDA15E" />
    {/* Eyes */}
    <circle cx="26" cy="29" r="1.5" fill="#283618" />
    <circle cx="35" cy="29" r="1.5" fill="#283618" />
    {/* Mustache */}
    <path d="M25 35 C28 33, 31 35, 31 36 C31 35, 34 33, 37 35 C38 37, 34 38, 31 37 C28 38, 24 37, 25 35 Z" fill="#283618" />
    {/* Shoulders & Green Angavastram */}
    <path d="M12 56 C12 48, 22 47, 30 47 C39 47, 49 48, 49 56 Z" fill="#F8FAFC" />
    <path d="M21 47 L18 60 L24 60 L26 47 Z" fill="#2D6A4F" />
    <path d="M40 47 L43 60 L37 60 L35 47 Z" fill="#2D6A4F" />
  </svg>
);

// Cotton Plant Vector Art (Matching UI Card)
export const CottonPlantArtwork: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="soilBg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#E3EEDC" />
        <stop offset="100%" stopColor="#C9DCBD" />
      </linearGradient>
      <linearGradient id="cottonBoll" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#EBF0E6" />
      </linearGradient>
    </defs>

    {/* Background Soft Field Tone */}
    <rect width="200" height="200" rx="16" fill="url(#soilBg)" />
    
    {/* Distant landscape horizon */}
    <path d="M0 160 Q100 130 200 150 L200 200 L0 200 Z" fill="#A8C999" />
    <path d="M0 175 Q100 155 200 170 L200 200 L0 200 Z" fill="#88B476" />

    {/* Main Stem & Branches */}
    <g transform="translate(10, 5)">
      <path d="M90 190 Q92 110 85 45" stroke="#5D4037" strokeWidth="5" strokeLinecap="round" />
      {/* Side branch left */}
      <path d="M88 125 Q55 105 35 115" stroke="#5D4037" strokeWidth="3.5" strokeLinecap="round" />
      {/* Side branch right */}
      <path d="M87 95 Q125 80 145 92" stroke="#5D4037" strokeWidth="3.5" strokeLinecap="round" />
      {/* Lower branch right */}
      <path d="M89 140 Q130 135 150 150" stroke="#5D4037" strokeWidth="3.5" strokeLinecap="round" />

      {/* Green Leaves */}
      {/* Leaf 1 */}
      <path d="M45 100 Q20 85 30 65 Q50 70 52 95 Z" fill="#4CAF50" stroke="#2E7D32" strokeWidth="1.2" />
      {/* Leaf 2 */}
      <path d="M125 75 Q155 60 160 80 Q145 95 125 85 Z" fill="#43A047" stroke="#1B5E20" strokeWidth="1.2" />
      {/* Leaf 3 top */}
      <path d="M85 45 Q70 20 88 15 Q100 25 88 45 Z" fill="#66BB6A" stroke="#2E7D32" strokeWidth="1.2" />
      {/* Leaf 4 lower */}
      <path d="M55 140 Q25 145 35 165 Q60 160 62 142 Z" fill="#388E3C" stroke="#1B5E20" strokeWidth="1.2" />

      {/* Cotton Bolls (White Fluffy Clouds) */}
      {/* Boll 1 - Top Center */}
      <g transform="translate(85, 45)">
        {/* Sepal Calyx (Brown Star) */}
        <path d="M-10 8 L0 -4 L10 8 L0 14 Z" fill="#795548" />
        {/* 4 White Petals */}
        <circle cx="-12" cy="-6" r="14" fill="url(#cottonBoll)" stroke="#D0DBC7" strokeWidth="1" />
        <circle cx="12" cy="-6" r="14" fill="url(#cottonBoll)" stroke="#D0DBC7" strokeWidth="1" />
        <circle cx="0" cy="-18" r="15" fill="url(#cottonBoll)" stroke="#D0DBC7" strokeWidth="1" />
        <circle cx="0" cy="4" r="13" fill="url(#cottonBoll)" stroke="#D0DBC7" strokeWidth="1" />
        <circle cx="0" cy="-5" r="8" fill="#FFFFFF" />
      </g>

      {/* Boll 2 - Left */}
      <g transform="translate(35, 115)">
        <path d="M-8 6 L0 -3 L8 6 L0 10 Z" fill="#6D4C41" />
        <circle cx="-10" cy="-4" r="12" fill="url(#cottonBoll)" stroke="#D0DBC7" strokeWidth="1" />
        <circle cx="10" cy="-4" r="12" fill="url(#cottonBoll)" stroke="#D0DBC7" strokeWidth="1" />
        <circle cx="0" cy="-14" r="13" fill="url(#cottonBoll)" stroke="#D0DBC7" strokeWidth="1" />
        <circle cx="0" cy="4" r="11" fill="url(#cottonBoll)" stroke="#D0DBC7" strokeWidth="1" />
      </g>

      {/* Boll 3 - Right */}
      <g transform="translate(145, 95)">
        <path d="M-8 6 L0 -3 L8 6 L0 10 Z" fill="#6D4C41" />
        <circle cx="-9" cy="-3" r="11" fill="url(#cottonBoll)" stroke="#D0DBC7" strokeWidth="1" />
        <circle cx="9" cy="-3" r="11" fill="url(#cottonBoll)" stroke="#D0DBC7" strokeWidth="1" />
        <circle cx="0" cy="-12" r="12" fill="url(#cottonBoll)" stroke="#D0DBC7" strokeWidth="1" />
        <circle cx="0" cy="3" r="10" fill="url(#cottonBoll)" stroke="#D0DBC7" strokeWidth="1" />
      </g>
    </g>
  </svg>
);

// Tomato Plant Vector Art (Matching UI Card)
export const TomatoPlantArtwork: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="tomatoSoilBg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#F5EFEB" />
        <stop offset="100%" stopColor="#DFD5CB" />
      </linearGradient>
      <linearGradient id="ripeTomato" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF5252" />
        <stop offset="100%" stopColor="#D50000" />
      </linearGradient>
      <linearGradient id="rawTomato" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#AEEA00" />
        <stop offset="100%" stopColor="#64DD17" />
      </linearGradient>
    </defs>

    {/* Background Soft Field Tone */}
    <rect width="200" height="200" rx="16" fill="url(#tomatoSoilBg)" />

    {/* Farm Soil Ground */}
    <path d="M0 165 Q100 145 200 160 L200 200 L0 200 Z" fill="#BCAAA4" />
    <path d="M0 180 Q100 165 200 178 L200 200 L0 200 Z" fill="#8D6E63" />

    {/* Wooden Bamboo Support Stake */}
    <rect x="110" y="20" width="8" height="175" fill="#A1887F" stroke="#6D4C41" strokeWidth="1" rx="2" />
    <line x1="110" y1="50" x2="118" y2="50" stroke="#5D4037" strokeWidth="1" />
    <line x1="110" y1="90" x2="118" y2="90" stroke="#5D4037" strokeWidth="1" />
    <line x1="110" y1="130" x2="118" y2="130" stroke="#5D4037" strokeWidth="1" />

    {/* Tomato Plant Vine */}
    <g transform="translate(10, 5)">
      {/* Main vine wrapping */}
      <path d="M85 190 Q95 130 90 80 Q98 50 92 25" stroke="#388E3C" strokeWidth="4.5" strokeLinecap="round" />
      
      {/* Leaves Cluster 1 (Top) */}
      <path d="M92 40 Q60 25 70 10 Q95 20 92 40 Z" fill="#4CAF50" stroke="#2E7D32" strokeWidth="1" />
      <path d="M95 35 Q130 20 125 5 Q105 18 95 35 Z" fill="#66BB6A" stroke="#2E7D32" strokeWidth="1" />

      {/* Leaves Cluster 2 (Middle) */}
      <path d="M88 85 Q50 65 55 50 Q78 68 88 85 Z" fill="#43A047" stroke="#1B5E20" strokeWidth="1" />
      <path d="M92 80 Q140 70 135 55 Q110 75 92 80 Z" fill="#4CAF50" stroke="#2E7D32" strokeWidth="1" />

      {/* Leaves Cluster 3 (Bottom) */}
      <path d="M86 130 Q45 115 50 100 Q75 115 86 130 Z" fill="#388E3C" stroke="#1B5E20" strokeWidth="1" />
      <path d="M90 135 Q145 120 140 105 Q115 125 90 135 Z" fill="#43A047" stroke="#2E7D32" strokeWidth="1" />

      {/* Tomatoes Group */}
      {/* 1. Green Unripe Tomato */}
      <g transform="translate(112, 95)">
        <circle cx="0" cy="0" r="16" fill="url(#rawTomato)" stroke="#33691E" strokeWidth="1" />
        {/* Calyx Star */}
        <path d="M-6 -16 L0 -10 L6 -16 L3 -8 L10 -8 L2 -5 L5 0 L-1 -4 L-7 0 L-4 -6 Z" fill="#2E7D32" />
        {/* Highlight sheen */}
        <ellipse cx="-4" cy="-5" rx="3" ry="5" fill="#DCEDC8" opacity="0.6" transform="rotate(-30, -4, -5)" />
      </g>

      {/* 2. Juicy Ripe Red Tomato (Big) */}
      <g transform="translate(68, 115)">
        <circle cx="0" cy="0" r="22" fill="url(#ripeTomato)" stroke="#B71C1C" strokeWidth="1.2" />
        {/* Calyx Star */}
        <path d="M-8 -22 L0 -14 L8 -22 L4 -12 L14 -12 L3 -8 L7 0 L-2 -6 L-10 0 L-6 -8 Z" fill="#2E7D32" />
        {/* Highlight sheen */}
        <ellipse cx="-6" cy="-7" rx="5" ry="8" fill="#FFCDD2" opacity="0.7" transform="rotate(-35, -6, -7)" />
      </g>

      {/* 3. Small Medium Red Tomato */}
      <g transform="translate(62, 70)">
        <circle cx="0" cy="0" r="14" fill="url(#ripeTomato)" stroke="#B71C1C" strokeWidth="1" />
        <path d="M-5 -14 L0 -9 L5 -14 L2 -7 L8 -7 L2 -4 L4 0 L-1 -3 L-6 0 L-3 -5 Z" fill="#2E7D32" />
        <ellipse cx="-3" cy="-4" rx="2.5" ry="4" fill="#FFCDD2" opacity="0.6" transform="rotate(-35, -3, -4)" />
      </g>
    </g>
  </svg>
);
