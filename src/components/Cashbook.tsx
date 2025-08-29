import React, { useState } from 'react';
import { Plus, CreditCard, TrendingUp, TrendingDown, Calendar, Trash, Edit } from 'lucide-react';
import { formatCurrency } from '../utils/numberGenerator';
import BankingForm from './forms/BankingForm';
import type { BankingEntry } from '../types';
import { useDataStore } from '../lib/store';

const CashbookComponent: React.FC = () => {
  const { cashbookEntries: entries, addCashbookEntry, updateCashbookEntry, deleteCashbookEntry } = useDataStore();
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<BankingEntry | null>(null);

  const handleCreateEntry = (entryData: Omit<BankingEntry, 'id' | 'created_at'>) => {
    if (editingEntry) {
      // Update existing entry
      const updatedEntry: BankingEntry = {
        ...entryData,
        id: editingEntry.id,
        created_at: editingEntry.created_at,
      };
      updateCashbookEntry(updatedEntry);
      setEditingEntry(null);
    } else {
      // Create new entry
      const newEntry: BankingEntry = {
        ...entryData,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
      };
      addCashbookEntry(newEntry);
    }
    setShowForm(false);
  };

  const handleEditEntry = (entry: BankingEntry) => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setShowForm(false);
  };

  const totalCredits = entries
    .filter(entry => entry.type === 'credit')
    .reduce((sum, entry) => sum + entry.amount, 0);

  const totalDebits = entries
    .filter(entry => entry.type === 'debit')
    .reduce((sum, entry) => sum + entry.amount, 0);

  const netBalance = totalCredits - totalDebits;

  const confirmAndDelete = (id: string) => {
    if (window.confirm('Delete this cashbook entry? This will also remove related ledger entries.')) {
      deleteCashbookEntry(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Cashbook</h1>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Entry</span>
        </button>
      </div>

      {showForm && (
        <BankingForm
          onSubmit={handleCreateEntry}
          onCancel={handleCancelEdit}
          editingEntry={editingEntry}
        />
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Credits</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(totalCredits)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Debits</p>
              <p className="text-2xl font-bold text-red-600 mt-2">{formatCurrency(totalDebits)}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Balance</p>
              <p className={`text-2xl font-bold mt-2 ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netBalance)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Cashbook Entries</h3>
        </div>
        <div className="overflow-x-auto">
          {entries.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No cashbook entries found</p>
              <p className="text-sm">Add your first cashbook entry to get started</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Narration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{new Date(entry.date).toLocaleDateString('en-IN')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        entry.type === 'credit' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {entry.type === 'credit' ? 'Credit' : 'Debit'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {entry.category.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        {entry.reference_id && (
                          <div className="font-medium">{entry.reference_id}</div>
                        )}
                        <div className="text-gray-500">{entry.reference_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={entry.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                        {entry.type === 'credit' ? '+' : '-'}{formatCurrency(entry.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {entry.narration}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditEntry(entry)}
                          className="inline-flex items-center px-2 py-1 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded"
                          title="Edit entry"
                        >
                          <Edit className="w-3 h-3 mr-1" /> Edit
                        </button>
                        <button
                          onClick={() => confirmAndDelete(entry.id)}
                          className="inline-flex items-center px-2 py-1 text-xs text-white bg-red-600 hover:bg-red-700 rounded"
                          title="Delete entry"
                        >
                          <Trash className="w-3 h-3 mr-1" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default CashbookComponent;
