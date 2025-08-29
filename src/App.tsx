import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { useSupabase } from './hooks/useSupabase';
import { Auth } from './components/Auth';
import Dashboard from './components/Dashboard';
import LoadingSlipComponent from './components/LoadingSlip';
import MemoComponent from './components/Memo';
import BillsComponent from './components/Bills';
import MemosAndBills from './components/MemosAndBills';
import Banking from './components/Banking';
import Cashbook from './components/Cashbook';
import PartyMaster from './components/PartyMaster';
import SupplierMaster from './components/SupplierMaster';
import VehicleLedger from './components/VehicleLedger';
import Ledgers from './components/Ledgers';
import FuelManagement from './components/FuelManagement';
import POD from './components/POD';
import { LogOut, Menu, X, Home, FileText, Clipboard, Receipt, CreditCard, BookOpen, Users, Truck, BarChart3, Fuel, Package } from 'lucide-react';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { loading } = useSupabase(user, companyId);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        // Get company ID from user metadata
        const companyId = session.user.user_metadata?.company_id;
        if (companyId) {
          setCompanyId(companyId);
        }
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (session?.user) {
        setUser(session.user);
        const companyId = session.user.user_metadata?.company_id;
        if (companyId) {
          setCompanyId(companyId);
        }
      } else {
        setUser(null);
        setCompanyId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthChange = (newUser: User | null, newCompanyId: string | null) => {
    console.log('App handleAuthChange called:', { newUser: newUser?.id, newCompanyId });
    setUser(newUser);
    setCompanyId(newCompanyId);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCompanyId(null);
  };

  if (!user || !companyId) {
    return <Auth onAuthChange={handleAuthChange} />;
  }

  const renderCurrentPage = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    switch (currentPage) {
      case 'loading-slip':
        return <LoadingSlipComponent />;
      case 'memo':
        return <MemoComponent />;
      case 'bill':
        return <BillsComponent />;
      case 'paid-memo':
        return <MemosAndBills />;
      case 'received-bill':
        return <MemosAndBills />;
      case 'banking':
        return <Banking />;
      case 'cashbook':
        return <Cashbook />;
      case 'party-master':
        return <PartyMaster />;
      case 'supplier-master':
        return <SupplierMaster />;
      case 'vehicle-ledger':
        return <VehicleLedger />;
      case 'ledgers':
        return <Ledgers />;
      case 'fuel-management':
        return <FuelManagement />;
      case 'pod':
        return <POD />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(true)}
          className="bg-white p-2 rounded-md shadow-md"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <div className="flex items-center space-x-3">
            <img 
              src="/src/assets/IMG_8496.jpg" 
              alt="BRC Logo" 
              className="w-12 h-12 rounded-lg object-contain bg-white p-1"
              onError={(e) => {
                // Fallback to text logo if image fails to load
                const target = e.currentTarget as HTMLImageElement;
                const fallback = target.nextElementSibling as HTMLElement;
                target.style.display = 'none';
                fallback.style.display = 'flex';
              }}
            />
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center" style={{display: 'none'}}>
              <span className="text-white font-bold text-sm">BRC</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900">BHAVISHYA</h1>
              <p className="text-xs text-gray-500">ROAD CARRIERS</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <nav className="mt-8">
          <div className="px-4 space-y-2">
            {[
              { key: 'dashboard', label: 'Dashboard', icon: Home },
              { key: 'loading-slip', label: 'Loading Slip', icon: FileText },
              { key: 'memo', label: 'Memo', icon: Clipboard },
              { key: 'bill', label: 'Bill', icon: Receipt },
              { key: 'paid-memo', label: 'Paid Memo', icon: Clipboard },
              { key: 'received-bill', label: 'Received Bill', icon: Receipt },
              { key: 'banking', label: 'Banking', icon: CreditCard },
              { key: 'cashbook', label: 'Cashbook', icon: BookOpen },
              { key: 'party-master', label: 'Party Master', icon: Users },
              { key: 'supplier-master', label: 'Supplier Master', icon: Users },
              { key: 'vehicle-ledger', label: 'Vehicle Ledger', icon: Truck },
              { key: 'ledgers', label: 'General Ledger', icon: BarChart3 },
              { key: 'fuel-management', label: 'Fuel Management', icon: Fuel },
              { key: 'pod', label: 'POD', icon: Package }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setCurrentPage(key); setSidebarOpen(false); }}
                className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md ${currentPage === key ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Icon className="w-4 h-4 mr-3" />
                {label}
              </button>
            ))}
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <header className="bg-white shadow-sm border-b lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-700"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">BRC Transport</h1>
            <div></div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-6 py-8">
            {renderCurrentPage()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;