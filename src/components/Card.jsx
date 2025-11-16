const Card = ({ 
  children, 
  className = '', 
  padding = 'p-6',
  shadow = 'shadow-sm',
  rounded = 'rounded-lg',
  bg = 'bg-white'
}) => {
  return (
    <div className={`${bg} ${shadow} ${rounded} ${padding} border border-gray-200 ${className}`}>
      {children}
    </div>
  )
}

export default Card
