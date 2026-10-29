export function GarudaEmblem({ className = "w-20 h-20" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="ตราครุฑราชการ"
    >
      {/* Royal Thai Garuda Emblem Stylized Vector Silhouette */}
      <g fill="#991B1B">
        {/* Crown / Chada */}
        <polygon points="100,6 94,22 106,22" />
        <polygon points="100,16 90,36 110,36" />
        <path d="M96 36 L104 36 L106 48 L94 48 Z" />
        <path d="M88 48 Q100 42 112 48 L114 56 Q100 50 86 56 Z" />
        
        {/* Head and Beak */}
        <path d="M94 56 Q100 54 106 56 L104 68 Q100 66 96 68 Z" />
        <path d="M100 64 L86 70 L98 74 Z" /> {/* Sharp beak pointing left */}
        <path d="M100 64 L114 70 L102 74 Z" /> {/* Right cheek curve */}
        
        {/* Neck & Chest Armor */}
        <path d="M93 72 L107 72 L112 88 L88 88 Z" />
        <path d="M88 88 Q100 82 112 88 L116 106 Q100 98 84 106 Z" />
        <path d="M86 106 L114 106 L110 128 L90 128 Z" />

        {/* Spread Out Wings - Left Wing */}
        <path d="M88 82 C72 65 52 50 26 50 C28 58 36 68 46 76 C32 72 20 74 12 80 C18 86 28 92 40 96 C26 95 16 102 12 110 C20 114 34 116 48 116 C34 122 26 132 24 142 C36 138 52 130 66 122 C58 132 54 146 56 156 C68 144 80 132 88 120 Z" />
        
        {/* Spread Out Wings - Right Wing */}
        <path d="M112 82 C128 65 148 50 174 50 C172 58 164 68 154 76 C168 72 180 74 188 80 C182 86 172 92 160 96 C174 95 184 102 188 110 C180 114 166 116 152 116 C166 122 174 132 176 142 C164 138 148 130 134 122 C142 132 146 146 144 156 C132 144 120 132 112 120 Z" />

        {/* Powerful Torso & Arms with Royal Bracelets */}
        <path d="M88 82 C76 86 66 94 62 104 C68 108 76 104 84 98 Z" />
        <path d="M112 82 C124 86 134 94 138 104 C132 108 124 104 116 98 Z" />

        {/* Lower Garment / Chong Kraben */}
        <path d="M90 128 L110 128 L114 146 L86 146 Z" />
        <polygon points="100,128 94,152 106,152" />
        
        {/* Tail Feathers (Phanom Tail) */}
        <path d="M92 148 L108 148 L112 182 Q100 192 88 182 Z" />
        <polygon points="100,148 97,192 103,192" />
        <path d="M88 182 L76 172 L86 160 Z" />
        <path d="M112 182 L124 172 L114 160 Z" />

        {/* Talons & Legs */}
        <path d="M84 144 C78 152 74 162 70 174 C76 172 82 168 86 160 Z" />
        <path d="M116 144 C122 152 126 162 130 174 C124 172 118 168 114 160 Z" />
      </g>
    </svg>
  );
}
