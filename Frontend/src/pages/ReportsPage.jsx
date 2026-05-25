import { useState, useEffect } from 'react';
import { getAdminReports } from '../APIs/report/report';
import SummaryCard from '../components/SummaryCard';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // all, month, quarter, year, custom
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const fetchReports = async (from = '', to = '') => {
    setLoading(true);
    try {
      const data = await getAdminReports({ from, to });
      setReportData(data);
    } catch (error) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFilterChange('all');
  }, []);

  const handleFilterChange = (type) => {
    setFilterType(type);
    let fromDate = new Date();
    let toDate = new Date();

    switch (type) {
      case 'month':
        fromDate.setMonth(fromDate.getMonth() - 1);
        break;
      case 'quarter':
        fromDate.setMonth(fromDate.getMonth() - 3);
        break;
      case 'year':
        fromDate.setFullYear(fromDate.getFullYear() - 1);
        break;
      case 'all':
      default:
        fetchReports();
        return;
    }
    fetchReports(fromDate.toISOString(), toDate.toISOString());
  };

  const applyCustomFilter = () => {
    if (!customFrom || !customTo) {
      toast.error('Please select both dates for custom filter');
      return;
    }
    fetchReports(new Date(customFrom).toISOString(), new Date(customTo).toISOString());
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading && !reportData) {
    return <div className="min-h-screen flex justify-center items-center">Loading reports...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Admin Reports</h1>
            <p className="text-gray-500 mt-1">Detailed overview of investments, properties, and profit/loss.</p>
          </div>

          {/* Time Filters */}
          <div className="mt-4 md:mt-0 flex flex-wrap gap-2 items-center bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            {['all', 'month', 'quarter', 'year', 'custom'].map((ft) => (
              <button
                key={ft}
                onClick={() => setFilterType(ft)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md capitalize transition ${filterType === ft ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {ft === 'all' ? 'All Time' : ft}
              </button>
            ))}
          </div>
        </div>

        {filterType === 'custom' && (
          <div className="mb-8 flex gap-4 items-end bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">From Date</label>
              <input type="date" className="border rounded px-3 py-2 text-sm" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">To Date</label>
              <input type="date" className="border rounded px-3 py-2 text-sm" value={customTo} onChange={e => setCustomTo(e.target.value)} />
            </div>
            <button onClick={applyCustomFilter} className="bg-primary text-white px-4 py-2 rounded text-sm font-bold">Apply Filter</button>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center">Loading filtered data...</div>
        ) : reportData && (
          <div className="space-y-8">
            {/* Profit / Loss Section */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Profit & Loss Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SummaryCard title="Total Generated Profit" amount={formatCurrency(reportData.profitDetails.totalProfit)} bgColor="bg-green-600" />
                <SummaryCard title="Hive's Share (25%)" amount={formatCurrency(reportData.profitDetails.hiveProfit)} bgColor="bg-blue-600" />
                <SummaryCard title="Investors' Share (75%)" amount={formatCurrency(reportData.profitDetails.investorsProfit)} bgColor="bg-purple-600" />
              </div>
            </section>

            {/* Loss Handling Section */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 text-red-600">Loss Handling (Guaranteed Returns)</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SummaryCard title="Properties Sold at Loss" amount={reportData.lossReports.propertiesSoldAtLoss} bgColor="bg-red-500" />
                <SummaryCard title="Total Hive Loss Absorbed" amount={formatCurrency(reportData.lossReports.totalHiveLoss)} bgColor="bg-red-700" />
                <SummaryCard title="Investor Capital Protected" amount={formatCurrency(reportData.lossReports.investorProtectedCapital)} bgColor="bg-green-500" />
              </div>
            </section>

            {/* Exit Plan & Activities */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Exit Plan Reports</h2>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Early Withdrawals</span>
                    <span className="text-xl font-bold text-orange-600">{reportData.exitPlanReports.earlyWithdrawals}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Matured Investments (greater than or equal to 1 Year)</span>
                    <span className="text-xl font-bold text-green-600">{reportData.exitPlanReports.maturedInvestments}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Pending Exits</span>
                    <span className="text-xl font-bold text-blue-600">{reportData.exitPlanReports.pendingExits}</span>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Investor Activities</h2>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Total Registered Investors</span>
                    <span className="text-xl font-bold text-dark">{reportData.investorActivities.totalInvestors}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Active Investments</span>
                    <span className="text-xl font-bold text-green-600">{reportData.investorActivities.activeInvestments}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Withdrawn Investments</span>
                    <span className="text-xl font-bold text-red-600">{reportData.investorActivities.withdrawnInvestments}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Detailed Table */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Detailed Investor Activities</h2>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="px-4 py-3">Investor Name</th>
                      <th className="px-4 py-3">Property</th>
                      <th className="px-4 py-3">Invested Amount</th>
                      <th className="px-4 py-3">Share %</th>
                      <th className="px-4 py-3">Profit Earned</th>
                      <th className="px-4 py-3">Withdrawal Status</th>
                      <th className="px-4 py-3">Investment Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.detailedActivities.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-4 py-8 text-center text-gray-500">No activities found for this period.</td>
                      </tr>
                    ) : (
                      reportData.detailedActivities.map((inv) => (
                        <tr key={inv._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{inv.investor?.name || 'Unknown'}</td>
                          <td className="px-4 py-3">{inv.property?.title || 'Unknown'}</td>
                          <td className="px-4 py-3 font-semibold">{formatCurrency(inv.amount)}</td>
                          <td className="px-4 py-3">{inv.ownershipPercent?.toFixed(2)}%</td>
                          <td className="px-4 py-3 text-green-600 font-semibold">{formatCurrency(inv.profitShare || 0)}</td>
                          <td className="px-4 py-3 capitalize">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${inv.status === 'withdrawn' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500">{new Date(inv.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
