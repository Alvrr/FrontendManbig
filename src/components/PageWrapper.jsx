import Card from './Card'

const PageWrapper = ({ 
  title, 
  description, 
  children, 
  action = null 
}) => {
  return (
    <div className="space-y-6 text-white">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {description && (
            <p className="text-white/80 mt-1">{description}</p>
          )}
        </div>
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>

      {/* Page Content */}
      <div>
        {children}
      </div>
    </div>
  )
}

export default PageWrapper
