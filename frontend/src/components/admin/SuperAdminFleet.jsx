// frontend/src/components/admin/SuperAdminFleet.jsx
import React, { useState, useEffect } from 'react';
import { 
  Truck, PhoneCall, ShieldAlert, Plus, RefreshCw, 
  CheckCircle2, MapPin, UserCheck, Clock 
} from 'lucide-react';

const SuperAdminFleet = () => {
  const [drivers, setDrivers] = useState([]);
  const [stats, setStats] = useState({ totalDrivers: 0, availableDrivers: 0, onTripDrivers: 0 });
  const [loading, setLoading] = useState(true);

  // Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('Motorcycle');
  const [plateNumber, setPlateNumber] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchFleet = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/fleet', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setDrivers(data.drivers || []);
        setStats(data.stats || { totalDrivers: 0, availableDrivers: 0, onTripDrivers: 0 });
      }
    } catch (error) {
      console.error('Fetch Fleet Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleet();
  }, []);

  const handleAddDriver = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/fleet/drivers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, phone, vehicleType, plateNumber })
      });
      const data = await response.json();
      if (data.success) {
        showToast(data.message);
        setIsAddModalOpen(false);
        setName('');
        setPhone('');
        setPlateNumber('');
        fetchFleet();
      }
    } catch (error) {
      console.error('Add Driver Error:', error);
    }
  };

  const updateStatus = async (driverId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/fleet/drivers/${driverId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (data.success) {
        showToast(`Driver status updated to ${newStatus.toUpperCase()}`);
        fetchFleet();
      }
    } catch (error) {
      console.error('Update Driver Status Error:', error);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1E4D58] text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-black flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Fleet Logistics Hub</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage delivery couriers, vehicle records, and telephone dispatch updates.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-[#1E4D58] hover:bg-[#163C45] text-white font-black text-xs rounded-xl flex items-center space-x-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Driver</span>
          </button>

          <button
            onClick={fetchFleet}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Fleet</span>
          </button>
        </div>
      </div>

      {/* FLEET PROTOCOL NOTICE */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs font-semibold text-amber-800 flex items-start space-x-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-black text-amber-900 mb-0.5">Fleet Protocol Notice</strong>
          Drivers do not have a dedicated app dashboard and report trip status via telephone directly to staff members. Staff members manually adjust their status below.
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Couriers</span>
          <div className="text-3xl font-black text-slate-900 mt-1">{stats.totalDrivers}</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Available On-Call</span>
          <div className="text-3xl font-black text-emerald-600 mt-1">{stats.availableDrivers}</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Currently On Trip</span>
          <div className="text-3xl font-black text-[#1E4D58] mt-1">{stats.onTripDrivers}</div>
        </div>
      </div>

      {/* DRIVERS MANIFEST TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Active Couriers Roster</h3>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs font-bold flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#1E4D58]" />
            <span>Loading database records...</span>
          </div>
        ) : drivers.length === 0 ? (
          <div className="py-12 border border-dashed border-slate-200 rounded-2xl text-center space-y-2">
            <Truck className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">No drivers registered yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {drivers.map((driver) => (
              <div key={driver.id} className="border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-black text-slate-900 text-xs">{driver.name}</h4>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                      driver.status === 'available' ? 'bg-emerald-100 text-emerald-800' :
                      driver.status === 'on_trip' ? 'bg-sky-100 text-sky-800' :
                      'bg-slate-200 text-slate-700'
                    }`}>
                      {driver.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">
                    Phone: {driver.phone} • {driver.vehicleType} {driver.plateNumber ? `(${driver.plateNumber})` : ''}
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => { window.location.href = `tel:${driver.phone}`; }}
                    className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 font-bold text-xs rounded-xl flex items-center space-x-1 cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call Driver</span>
                  </button>

                  <select
                    value={driver.status}
                    onChange={(e) => updateStatus(driver.id, e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-bold cursor-pointer"
                  >
                    <option value="available">Available</option>
                    <option value="on_trip">On Trip</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD DRIVER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 relative space-y-4 shadow-2xl border border-slate-200">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-black text-base cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-base font-black text-[#1E4D58]">Add New Courier / Driver</h3>

            <form onSubmit={handleAddDriver} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Yohannes Haile"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#1E4D58]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. 0911223344"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#1E4D58]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Vehicle Type</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-white"
                  >
                    <option value="Motorcycle">Motorcycle</option>
                    <option value="Van">Van / Mini-Truck</option>
                    <option value="Truck">Isuzu / Heavy Truck</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Plate Number</label>
                  <input
                    type="text"
                    placeholder="e.g. AA 3-12345"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#1E4D58]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#1E4D58] hover:bg-[#163C45] text-white font-black text-xs rounded-xl uppercase tracking-wider transition cursor-pointer mt-2"
              >
                Save Driver Record
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SuperAdminFleet;