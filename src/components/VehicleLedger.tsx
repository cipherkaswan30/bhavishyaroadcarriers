import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Download, Truck, FileText } from 'lucide-react';
import { formatCurrency } from '../utils/numberGenerator';
import { useDataStore } from '../lib/store';

const VehicleLedger: React.FC = () => {
  const { vehicles, ledgerEntries, bankingEntries } = useDataStore();
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Filter own vehicles only
  const ownVehicles = vehicles.filter(v => v.ownership_type === 'own');

  const filteredData = useMemo(() => {
    if (!selectedVehicle) return [];

    // Get only ledger entries for the selected vehicle (no banking entries to avoid duplicates)
    // Exclude bill-related entries as they are not actual vehicle transactions
    const vehicleLedgerEntries = ledgerEntries.filter(entry => {
      const matchesVehicle = entry.vehicle_no === selectedVehicle;
      const matchesDate = (!dateFrom || entry.date >= dateFrom) && (!dateTo || entry.date <= dateTo);
      const isNotBillEntry = entry.ledger_type !== 'party'; // Exclude bill entries
      return matchesVehicle && matchesDate && isNotBillEntry;
    });

    // Map ledger entries to display format
    const allEntries = vehicleLedgerEntries.map(entry => ({
      ...entry,
      source: 'ledger' as const,
      amount: entry.credit - entry.debit,
      type: entry.credit > 0 ? 'income' : 'expense'
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return allEntries;
  }, [selectedVehicle, dateFrom, dateTo, ledgerEntries]);

  const calculateVehicleSummary = (vehicleNo: string) => {
    const vehicleLedgerEntries = ledgerEntries.filter(entry => 
      entry.vehicle_no === vehicleNo &&
      (!dateFrom || entry.date >= dateFrom) &&
      (!dateTo || entry.date <= dateTo)
    );


    // Total income from memo amount (freight amount WITHOUT deductions)
    // This includes vehicle_income + commission + mamul to get the original freight amount
    const vehicleIncome = vehicleLedgerEntries
      .filter(entry => entry.ledger_type === 'vehicle_income')
      .reduce((sum, entry) => sum + (entry.credit || 0), 0);
    
    const commission = vehicleLedgerEntries
      .filter(entry => entry.ledger_type === 'commission')
      .reduce((sum, entry) => sum + (entry.credit || 0), 0);

    const mamul = vehicleLedgerEntries
      .filter(entry => entry.ledger_type === 'mamul')
      .reduce((sum, entry) => sum + (entry.credit || 0), 0);

    // Total income = freight amount before deductions (vehicle_income + commission + mamul)
    const totalIncome = vehicleIncome + commission + mamul;

    // Detention charges (should be added to profit)
    const detention = vehicleLedgerEntries
      .filter(entry => entry.ledger_type === 'detention')
      .reduce((sum, entry) => sum + (entry.credit || 0), 0);

    // Extra charges (toll, RTO fine, POD charges - should be added to profit)
    const extraCharges = vehicleLedgerEntries
      .filter(entry => ['toll', 'rto_fine', 'pod_charges'].includes(entry.ledger_type))
      .reduce((sum, entry) => sum + (entry.credit || 0), 0);

    // Commission and Mamul are shown separately but NOT double-counted in total expenses
    // They are already deducted from the running balance concept
    const commissionExpense = commission;
    const mamulExpense = mamul;
    
    // Vehicle expenses from ledger entries (includes fuel, banking expenses, etc.)
    const vehicleExpenses = vehicleLedgerEntries
      .filter(entry => entry.ledger_type === 'vehicle_expense' && entry.debit > 0)
      .reduce((sum, entry) => sum + entry.debit, 0);

    // Fuel expenses (subset of vehicle expenses for display)
    const fuelExpensesFromLedger = vehicleLedgerEntries
      .filter(entry => entry.ledger_type === 'vehicle_expense' && entry.debit > 0 && 
                      (entry.description?.toLowerCase().includes('fuel') || 
                       entry.reference_name?.toLowerCase().includes('fuel')))
      .reduce((sum, entry) => sum + entry.debit, 0);

    // Other vehicle expenses (non-fuel)
    const otherVehicleExpenses = vehicleExpenses - fuelExpensesFromLedger;

    // Total expenses from vehicle ledger only (for own vehicles)
    const totalExpenses = vehicleExpenses;

    // For breakdown display
    const fuelExpenses = fuelExpensesFromLedger;
    const otherExpenses = otherVehicleExpenses;
    
    // Net profit calculation: (Freight - Commission - Mamul) - Other Expenses + Detention + Extra Charges
    // This matches the "running balance" concept where commission and mamul are deducted from freight first
    const netProfit = (totalIncome - commissionExpense - mamulExpense) - totalExpenses + detention + extraCharges;

    return {
      totalIncome,
      fuelExpenses,
      otherExpenses,
      totalExpenses,
      netProfit,
      commissionExpense,
      mamulExpense,
      detention,
      extraCharges
    };
  };

  const summary = useMemo(() => {
    const vehicleSummary = calculateVehicleSummary(selectedVehicle);

    return {
      totalIncome: vehicleSummary.totalIncome,
      fuelExpenses: vehicleSummary.fuelExpenses,
      otherExpenses: vehicleSummary.otherExpenses,
      totalExpenses: vehicleSummary.totalExpenses,
      netProfit: vehicleSummary.netProfit
    };
  }, [selectedVehicle, dateFrom, dateTo, ledgerEntries]);

  const exportToCSV = () => {
    if (!selectedVehicle || filteredData.length === 0) return;

    const headers = ['Date', 'Description', 'Type', 'Income', 'Expense', 'Balance'];
    let runningBalance = 0;
    
    const csvData = filteredData.map(entry => {
      runningBalance += entry.amount;
      const description = 'description' in entry ? entry.description : entry.narration || '';
      const category = 'category' in entry ? entry.category : entry.ledger_type || '';
      return [
        entry.date,
        description,
        category,
        entry.amount > 0 ? formatCurrency(entry.amount) : '',
        entry.amount < 0 ? formatCurrency(Math.abs(entry.amount)) : '',
        formatCurrency(runningBalance)
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vehicle-ledger-${selectedVehicle}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Vehicle Ledger</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={exportToCSV}
            disabled={!selectedVehicle || filteredData.length === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Vehicle (Own Vehicles Only)
            </label>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Vehicle</option>
              {ownVehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.vehicle_no}>
                  {vehicle.vehicle_no} ({vehicle.vehicle_type})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {selectedVehicle && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Income</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {formatCurrency(summary.totalIncome)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600 mt-2">
                    {formatCurrency(summary.totalExpenses)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Net Profit/Loss</p>
                  <p className={`text-2xl font-bold mt-2 ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(summary.netProfit)}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${summary.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  {summary.netProfit >= 0 ? 
                    <TrendingUp className="w-6 h-6 text-green-600" /> : 
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  }
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <button
                    onClick={exportToCSV}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Expense Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Fuel Expenses</p>
                  <p className="text-2xl font-bold text-orange-600 mt-2">
                    {formatCurrency(summary.fuelExpenses)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Truck className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Other Expenses</p>
                  <p className="text-2xl font-bold text-red-600 mt-2">
                    {formatCurrency(summary.otherExpenses)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Ledger Entries Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Ledger Entries for {selectedVehicle}
              </h3>
            </div>
            <div className="overflow-x-auto">
              {filteredData.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No entries found for the selected criteria</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Income
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expense
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Running Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(() => {
                      let runningBalance = 0;
                      return filteredData.map((entry, index) => {
                        runningBalance += entry.amount;
                        return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(entry.date).toLocaleDateString('en-IN')}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {'description' in entry ? entry.description : entry.narration || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                entry.type === 'income' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {('category' in entry ? entry.category : (entry.ledger_type || 'general')) as string}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                              {entry.amount > 0 ? (
                                <span className="text-green-600 font-medium">
                                  {formatCurrency(entry.amount)}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                              {entry.amount < 0 ? (
                                <span className="text-red-600 font-medium">
                                  {formatCurrency(Math.abs(entry.amount))}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                              <span className={runningBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {formatCurrency(runningBalance)}
                              </span>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VehicleLedger;
