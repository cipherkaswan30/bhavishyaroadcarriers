import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export interface SupabaseData {
  bills: any[];
  memos: any[];
  loadingSlips: any[];
  parties: any[];
  suppliers: any[];
  vehicles: any[];
  bankingEntries: any[];
  ledgerEntries: any[];
  fuelWallets: any[];
  vehicleFuelExpenses: any[];
}

export const useSupabase = (user: User | null, companyId: string | null) => {
  const [data, setData] = useState<SupabaseData>({
    bills: [],
    memos: [],
    loadingSlips: [],
    parties: [],
    suppliers: [],
    vehicles: [],
    bankingEntries: [],
    ledgerEntries: [],
    fuelWallets: [],
    vehicleFuelExpenses: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !companyId) {
      setLoading(false);
      return;
    }

    // Proceed with database operations for real company ID
    console.log('Loading data for company:', companyId);

    loadData();
    setupRealtimeSubscription();
  }, [user, companyId]);

  const loadData = async () => {
    if (!companyId) return;

    try {
      setLoading(true);

      // Load all data in parallel
      const [
        billsRes,
        memosRes,
        loadingSlipsRes,
        partiesRes,
        suppliersRes,
        vehiclesRes,
        bankTransactionsRes,
        ledgerEntriesRes
      ] = await Promise.all([
        supabase.from('bills').select('*').eq('company_id', companyId),
        supabase.from('memos').select('*').eq('company_id', companyId),
        supabase.from('loading_slips').select('*').eq('company_id', companyId),
        supabase.from('parties').select('*').eq('company_id', companyId),
        supabase.from('suppliers').select('*').eq('company_id', companyId),
        supabase.from('vehicles').select('*').eq('company_id', companyId),
        supabase.from('bank_transactions').select('*').eq('company_id', companyId),
        supabase.from('ledger_entries').select('*').eq('company_id', companyId)
      ]);

      setData({
        bills: billsRes.data || [],
        memos: memosRes.data || [],
        loadingSlips: loadingSlipsRes.data || [],
        parties: partiesRes.data || [],
        suppliers: suppliersRes.data || [],
        vehicles: vehiclesRes.data || [],
        bankingEntries: bankTransactionsRes.data || [],
        ledgerEntries: ledgerEntriesRes.data || [],
        fuelWallets: [], // Will be derived from ledger entries
        vehicleFuelExpenses: [] // Will be derived from ledger entries
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!companyId) return;

    const channel = supabase.channel('realtime-company')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'bills', filter: `company_id=eq.${companyId}` },
        () => loadData()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'memos', filter: `company_id=eq.${companyId}` },
        () => loadData()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'loading_slips', filter: `company_id=eq.${companyId}` },
        () => loadData()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'parties', filter: `company_id=eq.${companyId}` },
        () => loadData()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'suppliers', filter: `company_id=eq.${companyId}` },
        () => loadData()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'vehicles', filter: `company_id=eq.${companyId}` },
        () => loadData()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'bank_transactions', filter: `company_id=eq.${companyId}` },
        () => loadData()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'ledger_entries', filter: `company_id=eq.${companyId}` },
        () => loadData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // CRUD operations
  const addBill = async (billData: any) => {
    if (!companyId) return;
    
    const { data, error } = await supabase
      .from('bills')
      .insert({ ...billData, company_id: companyId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  };

  const addMemo = async (memoData: any) => {
    if (!companyId) return;
    
    const { data, error } = await supabase
      .from('memos')
      .insert({ ...memoData, company_id: companyId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  };

  const addLoadingSlip = async (slipData: any) => {
    if (!companyId) return;
    
    const { data, error } = await supabase
      .from('loading_slips')
      .insert({ ...slipData, company_id: companyId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  };

  const addParty = async (partyData: any) => {
    if (!companyId) return;
    
    const { data, error } = await supabase
      .from('parties')
      .insert({ ...partyData, company_id: companyId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  };

  const addSupplier = async (supplierData: any) => {
    if (!companyId) return;
    
    const { data, error } = await supabase
      .from('suppliers')
      .insert({ ...supplierData, company_id: companyId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  };

  const addVehicle = async (vehicleData: any) => {
    if (!companyId) return;
    
    const { data, error } = await supabase
      .from('vehicles')
      .insert({ ...vehicleData, company_id: companyId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  };

  const updateBillStatus = async (billId: string, status: 'pending' | 'received') => {
    const { data, error } = await supabase
      .from('bills')
      .update({ 
        status, 
        received_at: status === 'received' ? new Date().toISOString() : null 
      })
      .eq('id', billId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  };

  const updateMemoStatus = async (memoId: string, status: 'pending' | 'paid') => {
    const { data, error } = await supabase
      .from('memos')
      .update({ 
        status, 
        paid_at: status === 'paid' ? new Date().toISOString() : null 
      })
      .eq('id', memoId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  };

  return {
    data,
    loading,
    addBill,
    addMemo,
    addLoadingSlip,
    addParty,
    addSupplier,
    addVehicle,
    updateBillStatus,
    updateMemoStatus,
    refreshData: loadData
  };
};
