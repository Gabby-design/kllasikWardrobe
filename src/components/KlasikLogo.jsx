export function KlasikLogo({ height = 48, className = '', fill = 'currentColor', alt = 'Kllasik Wardrobe' }) {
  const isLight = Boolean(
    fill && ['#f9f8f6', '#fff', '#ffffff', 'white', '#fafafa'].includes(String(fill).trim().toLowerCase())
  );

  const logoSrc = isLight ? '/images/klasik-logo-white.png' : '/images/klasik-logo-black.png';

  return (
    <img
      src={logoSrc}
      alt={alt}
      height={typeof height === 'number' ? height : undefined}
      className={`klasik-brand-logo object-contain transition-all duration-300 select-none ${className}`}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        width: 'auto',
        display: 'inline-block',
        verticalAlign: 'middle',
      }}
    />
  );
}
