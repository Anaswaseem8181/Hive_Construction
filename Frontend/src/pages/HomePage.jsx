import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getAllProperties } from '../APis/property/property'
import {
  formatCurrency,
  formatPercent,
  getPropertyStatusColor,
  normalizeProperties,
} from '../utils/property'

export default function HomePage() {
  const [featuredProperties, setFeaturedProperties] = useState([])
  const [isLoadingProperties, setIsLoadingProperties] = useState(true)
    
  const isAuthenticated = () => {
    return !!localStorage.getItem("user");
  };

  useEffect(() => {
    let isMounted = true

    const loadProperties = async () => {
      try {
        const response = await getAllProperties()

        if (isMounted) {
          setFeaturedProperties(normalizeProperties(response).slice(0, 3))
        }
      } catch (error) {
        if (isMounted) {
          setFeaturedProperties([])
          toast.error(error?.message || 'Failed to load featured properties')
        }
      } finally {
        if (isMounted) {
          setIsLoadingProperties(false)
        }
      }
    }

    loadProperties()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section
        className="min-h-[90vh] bg-hero-pattern bg-cover bg-center bg-fixed flex items-center justify-center text-white text-center py-20"
      >
        <div className="container mx-auto px-4 md:px-8">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Build Wealth Through Smart Property Investments
          </h1>
          <p className="text-xl md:text-2xl mb-10 text-gray-200 leading-relaxed max-w-3xl mx-auto">
            75% Profit Share | Capital Protection | Trusted Construction Experts
          </p>
          <div className="flex flex-col md:flex-row gap-6 justify-center">
            <Link
              to="/properties"
              className="inline-block bg-primary hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Explore Properties
            </Link>
      {
        isAuthenticated() ? (
          <Link
            to="/investments"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            View My Investments
          </Link>
        ) : (
          <Link
            to="/register"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Register Now
          </Link>
        )
      }
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-24 md:py-32 bg-white">
        <div className="container  mx-auto px-4 md:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-dark">Why Invest With Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card-hover cursor-pointer bg-primary rounded-lg shadow-lg p-8 text-white">
              <h5 className="text-2xl font-bold mb-4">Guaranteed Returns</h5>
              <p className="text-lg leading-relaxed">Investors always get back their original investment even if the project incurs a loss.</p>
            </div>
            <div className="card-hover cursor-pointer bg-primary rounded-lg shadow-lg p-8 text-white">
              <h5 className="text-2xl font-bold mb-4">Profit Sharing</h5>
              <p className="text-lg leading-relaxed">75% of profit goes to investors and 25% to Hive Construction Ventures.</p>
            </div>
            <div className="card-hover cursor-pointer bg-primary rounded-lg shadow-lg p-8 text-white">
              <h5 className="text-2xl font-bold mb-4">Transparent Process</h5>
              <p className="text-lg leading-relaxed">Track investments, property status, and profit reports in real-time on our platform.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 md:py-32 bg-gray-100">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-16 text-dark">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="p-8 bg-white rounded-lg shadow-md">
              <div className="text-6xl mb-6 text-primary">👤</div>
              <h5 className="text-2xl font-bold mb-4">1. Create Account</h5>
              <p className="text-gray-600 text-lg leading-relaxed">Register and verify your account to start investing.</p>
            </div>
            <div className="p-8 bg-white rounded-lg shadow-md">
              <div className="text-6xl mb-6 text-primary">🏠</div>
              <h5 className="text-2xl font-bold mb-4">2. Choose Property</h5>
              <p className="text-gray-600 text-lg leading-relaxed">Browse available properties and select your investment.</p>
            </div>
            <div className="p-8 bg-white rounded-lg shadow-md">
              <div className="text-6xl mb-6 text-primary">💰</div>
              <h5 className="text-2xl font-bold mb-4">3. Earn Profits</h5>
              <p className="text-gray-600 text-lg leading-relaxed">Receive your share of profits when projects complete.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-24 md:py-32 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-dark">Featured Properties</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoadingProperties ? (
              <div className="col-span-full rounded-lg bg-gray-50 p-10 text-center text-gray-500">
                Loading featured properties...
              </div>
            ) : featuredProperties.length ? (
              featuredProperties.map((property) => (
                <div key={property._id} className="card-hover bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow">
                  <div className="w-full h-48 bg-gradient-to-br from-gray-300 to-gray-400">
                    <img
                      src={property.imageUrl}
                      alt={property.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                  </div>
                  <div className="p-6">
                    <span className={`inline-block px-4 py-2 rounded-full text-white text-sm font-semibold mb-3 ${getPropertyStatusColor(property.statusValue)}`}>
                      {property.statusLabel}
                    </span>
                    <h5 className="text-xl font-bold text-dark mb-2">{property.title}</h5>
                    <p className="text-gray-500 text-sm mb-3">{property.location}</p>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {property.description || 'A promising investment opportunity managed by Hive Construction.'}
                    </p>
                    <div className="space-y-2 mb-4 text-sm">
                      <p><strong>Investment:</strong> {formatCurrency(property.totalInvestmentRequired)}</p>
                      <p><strong>ROI:</strong> {formatPercent(property.roi_percent)}%</p>
                    </div>
                    <Link to="/properties" className="inline-block w-full text-center bg-primary hover:bg-orange-600 text-white px-4 py-2 rounded font-semibold transition">
                      Learn More
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full rounded-lg bg-gray-50 p-10 text-center text-gray-500">
                No featured properties are available right now.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
    {
        isAuthenticated() ? (
          <section className="py-16 md:py-24 bg-primary text-white">
            <div className="container mx-auto px-4 md:px-8 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-8">Ready to Invest?</h2>
              <Link
                to="/properties"
                className="inline-block bg-white hover:bg-gray-100 text-primary font-bold py-3 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Explore Properties
              </Link>
            </div>
          </section>
        ) : (
          <section className="py-16 md:py-24 bg-primary text-white">
            <div className="container mx-auto px-4 md:px-8 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-8">Join Our Investment Community</h2>
              <Link
                to="/register"
                className="inline-block bg-white hover:bg-gray-100 text-primary font-bold py-3 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Register Now
              </Link>
            </div>
          </section>
        )
    }
    </div>
  )
}
