export default function SummaryCard({ title, amount, bgColor = 'bg-blue-500' }) {
  return (
    <div className={`${bgColor} rounded-lg cursor-pointer shadow-lg p-6 text-white card-hover`}>
      <h3 className="text-lg font-semibold mb-2 opacity-90">{title}</h3>
      <p className="text-3xl font-bold">{amount}</p>
    </div>
  )
}
