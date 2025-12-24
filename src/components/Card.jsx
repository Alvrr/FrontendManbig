const Card = ({ 
  children, 
  className = '', 
  padding = 'p-6',
  shadow = 'shadow-sm',
  rounded = 'rounded-lg',
  bg = 'bg-slate-900/40',
  variant = 'glass'
}) => {
  if (variant === 'glass') {
    return (
      <div className={`card-glass ${shadow} ${rounded} ${padding} ${className}`}>
        {children}
      </div>
    )
  }
  return (
    <div className={`${bg} ${shadow} ${rounded} ${padding} border border-white/10 text-white ${className}`}>
      {children}
    </div>
  )
}

export const CardGlass = ({ children, className = '', padding = 'p-6', shadow = 'shadow-sm', rounded = 'rounded-lg' }) => (
  <div className={`card-glass ${shadow} ${rounded} ${padding} ${className}`}>{children}</div>
)

export default Card
