import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  HiOutlineCalendar,
  HiOutlineCash,
  HiOutlineHome,
  HiOutlineLocationMarker,
  HiOutlinePhotograph,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import {
  createProperty,
  getPropertyById,
  updateProperty,
} from '../APis/property/property'

const emptyFormState = {
  title: '',
  description: '',
  location: '',
  totalInvestmentRequired: '',
  investedAmount: '',
  expectedProfit: '',
  marketValue: '',
  status: 'available',
  soldAt: '',
  image: null,
}

const statusOptions = [
  { value: 'available', label: 'Available' },
  { value: 'fully_funded', label: 'Fully Funded' },
  { value: 'sold', label: 'Sold' },
]

const toInputValue = (value) =>
  value === null || value === undefined ? '' : String(value)

const formatDateForInput = (value) => {
  if (!value) {
    return ''
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return ''
  }

  return parsedDate.toISOString().split('T')[0]
}

const mapPropertyToFormData = (property) => ({
  title: property.title || '',
  description: property.description || '',
  location: property.location || '',
  totalInvestmentRequired: toInputValue(property.totalInvestmentRequired),
  investedAmount: toInputValue(property.investedAmount),
  expectedProfit: toInputValue(property.expectedProfit),
  marketValue: toInputValue(property.marketValue),
  status: property.status || 'available',
  soldAt: formatDateForInput(property.soldAt),
  image: null,
})

export default function CreatePropertyPage() {
  const { id: propertyId } = useParams()
  const isEditMode = Boolean(propertyId)
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [formData, setFormData] = useState(emptyFormState)
  const [initialFormData, setInitialFormData] = useState(emptyFormState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingProperty, setIsLoadingProperty] = useState(isEditMode)
  const [imagePreview, setImagePreview] = useState('')
  const [initialImagePreview, setInitialImagePreview] = useState('')

  useEffect(() => {
    if (!formData.image) {
      return undefined
    }

    const previewUrl = URL.createObjectURL(formData.image)
    setImagePreview(previewUrl)

    return () => {
      URL.revokeObjectURL(previewUrl)
    }
  }, [formData.image])

  useEffect(() => {
    if (!isEditMode) {
      setFormData(emptyFormState)
      setInitialFormData(emptyFormState)
      setImagePreview('')
      setInitialImagePreview('')
      setIsLoadingProperty(false)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      return undefined
    }

    let isMounted = true

    const loadProperty = async () => {
      setIsLoadingProperty(true)

      try {
        const property = await getPropertyById(propertyId)

        if (!isMounted) {
          return
        }

        const nextFormData = mapPropertyToFormData(property)
        const nextImagePreview = property.image?.url || ''

        setFormData(nextFormData)
        setInitialFormData(nextFormData)
        setImagePreview(nextImagePreview)
        setInitialImagePreview(nextImagePreview)

        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } catch (error) {
        if (isMounted) {
          toast.error(error?.message || 'Failed to load property details')
          navigate('/admin-dashboard')
        }
      } finally {
        if (isMounted) {
          setIsLoadingProperty(false)
        }
      }
    }

    loadProperty()

    return () => {
      isMounted = false
    }
  }, [isEditMode, navigate, propertyId])

  const handleChange = (e) => {
    const { name, value, files } = e.target

    if (name === 'image') {
      setFormData((prev) => ({
        ...prev,
        image: files?.[0] || null,
      }))

      if (!files?.[0]) {
        setImagePreview(initialImagePreview)
      }

      return
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'status' && value !== 'sold' ? { soldAt: '' } : {}),
    }))
  }

  const resetForm = () => {
    setFormData(initialFormData)
    setImagePreview(initialImagePreview)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.location.trim() || !formData.totalInvestmentRequired) {
      toast.error('Title, location, and total investment are required')
      return
    }

    if (Number(formData.totalInvestmentRequired) <= 0) {
      toast.error('Total investment must be greater than zero')
      return
    }

    if (formData.investedAmount && Number(formData.investedAmount) < 0) {
      toast.error('Invested amount cannot be negative')
      return
    }

    if (
      formData.investedAmount &&
      Number(formData.investedAmount) > Number(formData.totalInvestmentRequired)
    ) {
      toast.error('Invested amount cannot exceed total investment')
      return
    }

    if (formData.expectedProfit && Number(formData.expectedProfit) < 0) {
      toast.error('Expected profit cannot be negative')
      return
    }

    if (formData.marketValue && Number(formData.marketValue) < 0) {
      toast.error('Market value cannot be negative')
      return
    }

    if (formData.status === 'sold' && !formData.soldAt) {
      toast.error('Sold date is required when the property is marked as sold')
      return
    }

    if (formData.status === 'sold' && (!formData.marketValue || Number(formData.marketValue) <= 0)) {
      toast.error('Sale Price (Market Value) is required when marking a property as sold — it is used to calculate investor profit shares')
      return
    }

    setIsSubmitting(true)

    try {
      if (isEditMode) {
        await updateProperty(propertyId, formData)
        toast.success('Property updated successfully')
        navigate('/admin-dashboard')
        return
      }

      await createProperty(formData)
      toast.success('Property created successfully')
      resetForm()
    } catch (error) {
      toast.error(
        error?.message ||
        (isEditMode ? 'Failed to update property' : 'Failed to create property')
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingProperty) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center">
        <div className="text-yellow-500 text-xl">Loading property details...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 py-12 md:py-16">
      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-500">Admin Workspace</p>
            <h1 className="mt-2 text-4xl font-bold text-white md:text-5xl">
              {isEditMode ? 'Update Property' : 'Create Property'}
            </h1>
            <p className="mt-3 max-w-2xl text-gray-400">
              {isEditMode
                ? 'Review the latest property details, update the financials, and replace the image if needed.'
                : 'Add a new investment listing with funding details, market data, and an optional featured image.'}
            </p>
          </div>

          <Link
            to="/admin-dashboard"
            className="inline-flex items-center justify-center rounded-lg border border-yellow-500/30 bg-gray-900 px-5 py-3 font-semibold text-yellow-500 transition hover:bg-yellow-500 hover:text-black"
          >
            Back to Admin Dashboard
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)]">
          <div className="rounded-2xl bg-gray-900 border border-yellow-500/30 p-8 shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-8">
              <section>
                <div className="mb-5">
                  <h2 className="text-2xl font-bold text-yellow-500">Property Details</h2>
                  <p className="mt-1 text-sm text-gray-400">
                    The title, location, and total investment are required by the backend.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-gray-300">Property Title</label>
                    <div className="relative">
                      <HiOutlineHome className="absolute left-4 top-3.5 text-xl text-yellow-500" />
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Skyline Residency"
                        required
                        className="w-full rounded-lg bg-gray-800 border border-gray-700 py-3 pl-12 pr-4 text-white placeholder-gray-500 transition focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-gray-300">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="5"
                      placeholder="Share the property story, development stage, investor value, and standout features."
                      className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 transition focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-gray-300">Location</label>
                    <div className="relative">
                      <HiOutlineLocationMarker className="absolute left-4 top-3.5 text-xl text-yellow-500" />
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="Lahore, Pakistan"
                        required
                        className="w-full rounded-lg bg-gray-800 border border-gray-700 py-3 pl-12 pr-4 text-white placeholder-gray-500 transition focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-300">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white transition focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-300">Sold Date</label>
                    <div className="relative">
                      <HiOutlineCalendar className="absolute left-4 top-3.5 text-xl text-yellow-500" />
                      <input
                        type="date"
                        name="soldAt"
                        value={formData.soldAt}
                        onChange={handleChange}
                        disabled={formData.status !== 'sold'}
                        className="w-full rounded-lg bg-gray-800 border border-gray-700 py-3 pl-12 pr-4 text-white transition focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 disabled:cursor-not-allowed disabled:bg-gray-900 disabled:text-gray-500"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <div className="mb-5">
                  <h2 className="text-2xl font-bold text-yellow-500">Financial Snapshot</h2>
                  <p className="mt-1 text-sm text-gray-400">
                    Add the main investment figures exactly as you want them stored on the property record.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-300">Total Investment Required</label>
                    <div className="relative">
                      <HiOutlineCash className="absolute left-4 top-3.5 text-xl text-yellow-500" />
                      <input
                        type="number"
                        name="totalInvestmentRequired"
                        value={formData.totalInvestmentRequired}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        required
                        placeholder="15000000"
                        className="w-full rounded-lg bg-gray-800 border border-gray-700 py-3 pl-12 pr-4 text-white placeholder-gray-500 transition focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-300">Invested Amount</label>
                    <div className="relative">
                      <HiOutlineCash className="absolute left-4 top-3.5 text-xl text-yellow-500" />
                      <input
                        type="number"
                        name="investedAmount"
                        value={formData.investedAmount}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        placeholder="0"
                        className="w-full rounded-lg bg-gray-800 border border-gray-700 py-3 pl-12 pr-4 text-white placeholder-gray-500 transition focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-300">Expected Profit</label>
                    <div className="relative">
                      <HiOutlineCash className="absolute left-4 top-3.5 text-xl text-yellow-500" />
                      <input
                        type="number"
                        name="expectedProfit"
                        value={formData.expectedProfit}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        placeholder="2500000"
                        className="w-full rounded-lg bg-gray-800 border border-gray-700 py-3 pl-12 pr-4 text-white placeholder-gray-500 transition focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-300">
                      Market Value
                      {formData.status === 'sold' && (
                        <span className="ml-2 text-xs font-bold text-yellow-400">(= Sale Price — Required for profit distribution)</span>
                      )}
                    </label>
                    <div className="relative">
                      <HiOutlineCash className="absolute left-4 top-3.5 text-xl text-yellow-500" />
                      <input
                        type="number"
                        name="marketValue"
                        value={formData.marketValue}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        placeholder="17500000"
                        required={formData.status === 'sold'}
                        className={`w-full rounded-lg bg-gray-800 py-3 pl-12 pr-4 text-white placeholder-gray-500 transition focus:outline-none focus:ring-2 focus:ring-yellow-500/20 ${formData.status === 'sold'
                            ? 'border-2 border-yellow-400 focus:border-yellow-400'
                            : 'border border-gray-700 focus:border-yellow-500'
                          }`}
                      />
                    </div>
                    {formData.status === 'sold' && (
                      <p className="mt-1.5 text-xs text-yellow-400">
                        This value is used as the final sale price. Investors will receive 75% of (Sale Price − Total Investment) proportional to their ownership %.
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section>
                <div className="mb-5">
                  <h2 className="text-2xl font-bold text-yellow-500">Property Image</h2>
                  <p className="mt-1 text-sm text-gray-400">
                    {isEditMode
                      ? 'Upload a new image only if you want to replace the current one.'
                      : 'Upload a single image file if you want this property to have a visual cover.'}
                  </p>
                </div>

                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-yellow-500/30 bg-gray-800 px-6 py-10 text-center transition hover:border-yellow-500 hover:bg-gray-700">
                  <HiOutlinePhotograph className="mb-3 text-4xl text-yellow-500" />
                  <span className="text-lg font-semibold text-white">
                    {formData.image
                      ? formData.image.name
                      : imagePreview
                        ? 'Current property image'
                        : 'Choose property image'}
                  </span>
                  <span className="mt-1 text-sm text-gray-400">PNG, JPG, JPEG, or WEBP</span>
                  <input
                    type="file"
                    name="image"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleChange}
                    className="hidden"
                  />
                </label>
              </section>

              <div className="flex flex-col gap-4 border-t border-gray-800 pt-6 sm:flex-row">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-lg bg-yellow-500 px-6 py-3 font-bold text-black transition hover:bg-yellow-600 disabled:cursor-not-allowed disabled:bg-gray-600"
                >
                  {isSubmitting
                    ? isEditMode
                      ? 'Saving Changes...'
                      : 'Creating Property...'
                    : isEditMode
                      ? 'Save Changes'
                      : 'Create Property'}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-lg border border-yellow-500/30 bg-gray-800 px-6 py-3 font-semibold text-yellow-500 transition hover:bg-yellow-500 hover:text-black disabled:cursor-not-allowed disabled:bg-gray-900 disabled:text-gray-500"
                >
                  Reset Form
                </button>
              </div>
            </form>
          </div>

          <aside className="space-y-6">
            <div className="overflow-hidden rounded-2xl bg-gray-900 border border-yellow-500/30 shadow-lg">
              <div className="border-b border-yellow-500/30 px-6 py-5">
                <h2 className="text-2xl font-bold text-yellow-500">Image Preview</h2>
              </div>
              <div className="p-6">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Selected property preview"
                    className="h-64 w-full rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-yellow-500/30 bg-gray-800 text-center text-sm text-gray-400">
                    Upload an image to preview it here before submitting.
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}