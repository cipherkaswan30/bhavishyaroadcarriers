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
      console.log('🔄 Loading data for company:', companyId);

      // Test basic connection first
      const { error: testError } = await supabase
        .from('bills')
        .select('*')
        .limit(1);

      if (testError) {
        console.error('❌ Basic database connection failed:', testError);
        throw testError;
      }

      console.log('✅ Database connection working, loading all data...');

      // Test with simple table first
      const { data: testData, error: testTableError } = await supabase
        .from('simple_test')
        .select('*');
        
      if (testTableError) {
        console.error('❌ Simple test table failed:', testTableError);
      } else {
        console.log('✅ Simple test table works:', testData);
      }

      // Load all data from Supabase WITHOUT company_id filter to test
      const [
        billsRes,
        memosRes,
        loadingSlipsRes,
        partiesRes,
        suppliersRes,
        vehiclesRes
      ] = await Promise.all([
        supabase.from('bills').select('*'),
        supabase.from('memos').select('*'),
        supabase.from('loading_slips').select('*'),
        supabase.from('parties').select('*'),
        supabase.from('suppliers').select('*'),
        supabase.from('vehicles').select('*')
      ]);

      console.log('📊 Raw data from database:', {
        bills: billsRes.data?.length || 0,
        memos: memosRes.data?.length || 0,
        loadingSlips: loadingSlipsRes.data?.length || 0,
        parties: partiesRes.data?.length || 0,
        suppliers: suppliersRes.data?.length || 0,
        vehicles: vehiclesRes.data?.length || 0
      });

      setData({
        bills: billsRes.data || [],
        memos: memosRes.data || [],
        loadingSlips: loadingSlipsRes.data || [],
        parties: partiesRes.data || [],
        suppliers: suppliersRes.data || [],
        vehicles: vehiclesRes.data || [],
        bankingEntries: [],
        ledgerEntries: [],
        fuelWallets: [],
        vehicleFuelExpenses: []
      });
      
      console.log('✅ Data loaded successfully from Supabase');
    } catch (error) {
      console.error('❌ Error loading data:', error);
      // Fallback to empty data if database fails
      setData({
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // CRUD operations - using real Supabase database
  const addBill = async (billData: any) => {
    if (!companyId) return;
    
    console.log('🔄 Adding bill to database:', billData);
    
    const { data, error } = await supabase
      .from('bills')
      .insert({ ...billData, company_id: companyId })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Failed to add bill:', error);
      throw error;
    }
    
    console.log('✅ Bill added successfully:', data);
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
