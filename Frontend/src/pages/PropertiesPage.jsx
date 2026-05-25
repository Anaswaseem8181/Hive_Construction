import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import PropertyCard from '../components/PropertyCard'
import { getAllProperties } from '../APis/property/property'
import { normalizeProperties } from '../utils/property'

export default function PropertiesPage() {
  const [properties, setProperties] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const loadProperties = async () => {
    try {
      const response = await getAllProperties()
      setProperties(normalizeProperties(response))
    } catch (error) {
      setProperties([])
      toast.error(error?.message || 'Failed to load properties')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    const loadProperties = async () => {
      try {
        const response = await getAllProperties()

        if (isMounted) {
          setProperties(normalizeProperties(response))
        }
      } catch (error) {
        if (isMounted) {
          setProperties([])
          toast.error(error?.message || 'Failed to load properties')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadProperties()

    return () => {
      isMounted = false
    }
  }, [refreshKey])

  // Handle successful investment - refresh properties to get updated funded amounts
  const handleInvestmentSuccess = (property) => {
    // Refresh properties to get updated investment data
    loadProperties()
    toast.success('Investment successful!')
  }

  const handleInvest = (property) => {
    // This is now handled by the PropertyCard's internal modal
    // Kept for backward compatibility
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-dark text-white py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Investment Opportunities</h1>
          <p className="text-lg md:text-xl text-gray-300">Choose a project and start earning today</p>
        </div>
      </section>

      {/* Properties Grid */}
      <div className="container mx-auto px-4 md:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            <div className="col-span-full rounded-lg bg-white p-10 text-center text-gray-500 shadow">
              Loading available properties...
            </div>
          ) : properties.length ? (
            properties.map((property) => (
              <PropertyCard
                key={property._id}
                property={property}
                onInvest={handleInvest}
                onInvestmentSuccess={handleInvestmentSuccess}
              />
            ))
          ) : (
            <div className="col-span-full rounded-lg bg-white p-10 text-center text-gray-500 shadow">
              No properties are available right now. Please check back soon.
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <section className="bg-primary text-white py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Investment Terms</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="text-5xl md:text-6xl font-bold mb-4">75%</div>
              <p className="text-lg md:text-xl">Investor Share</p>
            </div>
            <div className="text-center p-6">
              <div className="text-5xl md:text-6xl font-bold mb-4">25%</div>
              <p className="text-lg md:text-xl">Hive Share</p>
            </div>
            <div className="text-center p-6">
              <div className="text-5xl md:text-6xl font-bold mb-4">100%</div>
              <p className="text-lg md:text-xl">Capital Protection</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
