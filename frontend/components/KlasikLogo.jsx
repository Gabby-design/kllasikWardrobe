export function KlasikLogo({ height = 48, className = '', fill = 'currentColor' }) {
  return (
    <svg
      className={`klasik-brand-logo ${className}`}
      height={height}
      viewBox="0 0 420 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <g transform="translate(210, 90) rotate(-9) translate(-210, -90)">
        {/* Top-Left Bracket & Speed Marks */}
        <path d="M 42 28 L 42 62 M 42 28 L 78 28" stroke={fill} strokeWidth="4" strokeLinecap="square" />
        <path d="M 54 18 L 98 18" stroke={fill} strokeWidth="2.5" strokeLinecap="round" />

        {/* Top-Right Speed Marks */}
        <path d="M 235 22 L 310 18" stroke={fill} strokeWidth="3" strokeLinecap="round" />
        <path d="M 255 12 L 335 8" stroke={fill} strokeWidth="2.5" strokeLinecap="round" />

        {/* KLASIK Text */}
        <text
          x="205"
          y="76"
          textAnchor="middle"
          fontFamily="'Impact', 'Arial Black', 'Montserrat', 'Trebuchet MS', sans-serif"
          fontWeight="900"
          fontSize="70"
          fill={fill}
          letterSpacing="3"
        >
          KLASIK
        </text>

        {/* WARDROBE Text */}
        <text
          x="205"
          y="136"
          textAnchor="middle"
          fontFamily="'Impact', 'Arial Black', 'Montserrat', 'Trebuchet MS', sans-serif"
          fontWeight="900"
          fontSize="52"
          fill={fill}
          letterSpacing="1.5"
        >
          WARDROBE
        </text>

        {/* Bottom-Left Speed Marks */}
        <path d="M 68 152 L 132 152" stroke={fill} strokeWidth="3" strokeLinecap="round" />
        <path d="M 78 162 L 122 162" stroke={fill} strokeWidth="2.5" strokeLinecap="round" />

        {/* Bottom-Right Bracket & Speed Marks */}
        <path d="M 185 142 L 358 142 L 358 115" stroke={fill} strokeWidth="3.5" strokeLinecap="square" strokeLinejoin="miter" />
        <path d="M 370 128 L 370 156 M 345 156 L 370 156" stroke={fill} strokeWidth="4" strokeLinecap="square" />
        <path d="M 325 168 L 378 168" stroke={fill} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 338 176 L 370 176" stroke={fill} strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}
