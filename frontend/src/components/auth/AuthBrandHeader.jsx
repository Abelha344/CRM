import CrmLogoMark from '../CrmLogoMark'

export default function AuthBrandHeader({
  title,
  subtitle,
  showLogo = true,
  align = 'center',
}) {
  const alignCls = align === 'left' ? 'text-left' : 'text-center'

  return (
    <div className={alignCls}>
      {showLogo ? (
        <div
          className={`mb-6 flex ${align === 'left' ? 'justify-start' : 'justify-center'}`}
        >
          <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-[3px] shadow-lg shadow-indigo-500/20">
            <div className="rounded-[13px] bg-white p-2.5 sm:p-3">
              <CrmLogoMark className="h-11 w-11 sm:h-12 sm:w-12" />
            </div>
          </div>
        </div>
      ) : null}
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.65rem]">{title}</h1>
      {subtitle ? (
        <p
          className={`mt-2 text-sm leading-relaxed text-slate-500 sm:text-[0.9375rem] ${
            align === 'left' ? 'max-w-lg' : 'mx-auto max-w-md'
          }`}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  )
}
