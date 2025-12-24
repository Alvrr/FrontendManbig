const Card = ({ 
  children, 
  className = '', 
  padding = 'p-6',
  shadow = 'shadow-sm',
  rounded = 'rounded-lg',
  bg = 'bg-white',
  variant = 'solid'
}) => {
  if (variant === 'glass') {
    return (
      <div className={`card-glass ${shadow} ${rounded} ${padding} ${className}`}>
        {children}
      </div>
    )
  }
  return (
    <div className={`${bg} ${shadow} ${rounded} ${padding} border border-gray-200 text-gray-800 ${className}`}>
      {children}
    </div>
  )
}

export const CardGlass = ({ children, className = '', padding = 'p-6', shadow = 'shadow-sm', rounded = 'rounded-lg' }) => (
  <div className={`card-glass ${shadow} ${rounded} ${padding} ${className}`}>{children}</div>
)

export default Card
