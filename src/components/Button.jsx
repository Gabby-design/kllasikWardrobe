import { motion } from 'framer-motion';

export function AvantGardeButton({ children, onClick, className = '', disabled = false }) {
  return (
    <motion.button
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={`relative overflow-hidden bg-transparent text-foreground border border-foreground font-sans text-xs uppercase tracking-[0.2em] px-6 py-3 transition-colors duration-300 group ${className}`}
      whileHover="hover"
      initial="initial"
    >
      <motion.div
        className="absolute inset-0 bg-foreground z-0"
        variants={{
          initial: { scaleY: 0, transformOrigin: 'bottom' },
          hover: { scaleY: 1, transformOrigin: 'bottom' }
        }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      />
      <span className="relative z-10 group-hover:text-background transition-colors duration-300">
        {children}
      </span>
    </motion.button>
  );
}
