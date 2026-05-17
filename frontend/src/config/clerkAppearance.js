/**
 * Embedded SignIn / SignUp — match CRM auth: indigo/violet primary, rounded-xl fields.
 * Hide Clerk footer links (sign-in ↔ sign-up); this app uses /login and /register instead.
 * Hide footer legal links so users are not sent to Clerk-hosted pages from the embed.
 */
export const clerkEmbedAppearance = {
  elements: {
    rootBox: 'w-full max-w-full flex justify-center',
    card: '!shadow-none !border-0 !bg-transparent p-0 gap-5 w-full max-w-full',
    header: 'hidden',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    main: 'gap-5 w-full',
    socialButtonsRoot: 'grid grid-cols-1 gap-3 sm:grid-cols-2',
    socialButtonsBlockButton:
      '!rounded-xl !border !border-slate-200/90 !bg-white hover:!bg-slate-50/90 !text-slate-800 !font-semibold !shadow-sm',
    formButtonPrimary:
      '!rounded-lg !bg-blue-600 hover:!bg-blue-700 !shadow-sm !font-semibold',
    formFieldInput:
      '!rounded-xl !border-slate-200/90 focus:!ring-4 focus:!ring-indigo-500/15 focus:!border-indigo-500',
    footer: '!hidden',
    footerAction: '!hidden',
    footerPages: '!hidden',
    footerActionLink: '!hidden',
    developmentModeBadge: '!opacity-90',
  },
}
