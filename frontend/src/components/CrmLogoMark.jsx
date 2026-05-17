/**
 * CRM brand mark: pipeline / funnel (sales) on indigo tile — distinct from a generic bolt icon.
 */
export default function CrmLogoMark({ className = 'h-10 w-10', tileClassName = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        width="40"
        height="40"
        rx="10"
        className={`fill-indigo-600 ${tileClassName}`}
      />
      {/* Pipeline funnel + stages (abstract CRM) */}
      <path
        d="M12 12h16l-3.5 8H15.5L12 12z"
        fill="white"
        fillOpacity="0.95"
      />
      <circle cx="14" cy="26" r="2.25" fill="white" />
      <circle cx="20" cy="26" r="2.25" fill="white" />
      <circle cx="26" cy="26" r="2.25" fill="white" />
      <path
        d="M14 22h12"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  )
}
