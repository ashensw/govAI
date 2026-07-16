export default function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="7" fill="#1d3557" />
      <path
        d="M16 6l9 4v3c0 6.2-3.7 11.2-9 13-5.3-1.8-9-6.8-9-13v-3l9-4z"
        fill="none"
        stroke="#ecb833"
        strokeWidth="1.8"
      />
      <circle cx="16" cy="15" r="2.6" fill="#ecb833" />
      <path
        d="M16 17.6v4.2M13 20.5l3-1.5 3 1.5"
        stroke="#ecb833"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
