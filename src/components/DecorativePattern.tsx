const DecorativePattern = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
      {/* Top left corner pattern */}
      <svg
        className="absolute -top-20 -left-20 w-80 h-80 text-primary"
        viewBox="0 0 200 200"
        fill="currentColor"
      >
        <circle cx="100" cy="100" r="80" opacity="0.5" />
        <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M100 20 L100 180 M20 100 L180 100" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      </svg>

      {/* Bottom right corner pattern */}
      <svg
        className="absolute -bottom-20 -right-20 w-80 h-80 text-secondary"
        viewBox="0 0 200 200"
        fill="currentColor"
      >
        <circle cx="100" cy="100" r="80" opacity="0.5" />
        <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>

      {/* Mandala-inspired decorative elements */}
      <div className="absolute top-1/4 right-0 w-32 h-32 border-r-4 border-t-4 border-secondary/20 rounded-tr-full" />
      <div className="absolute bottom-1/4 left-0 w-32 h-32 border-l-4 border-b-4 border-primary/20 rounded-bl-full" />
    </div>
  );
};

export default DecorativePattern;
