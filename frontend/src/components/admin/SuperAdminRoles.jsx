import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserPlus, RefreshCw, CheckCircle2, Activity, Calendar, Trash2, Edit3 } from 'lucide-react';

const SuperAdminRoles = () => {
  const [staffList, setStaffList] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(''); // 👈 Date filter state
  
  // Form States
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [selectedRole, setSelectedRole] = useState('staff');
  
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchStaffAndLogs = async (dateParam = '') => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const query = dateParam ? `?date=${dateParam}` : '';
      const response = await fetch(`http://localhost:5000/api/admin/staff-users${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStaffList(data.staff || []);
        setActivityLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Fetch Staff Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffAndLogs(filterDate);
  }, [filterDate]);

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!phoneInput) return;

    if (passwordInput && passwordInput !== confirmPasswordInput) {
      alert('Passwords do not match.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/update-role', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: nameInput,
          phone: phoneInput,
          password: passwordInput,
          confirmPassword: confirmPasswordInput,
          role: selectedRole
        })
      });
      const data = await response.json();
      if (data.success) {
        showToast(data.message);
        setNameInput('');
        setPhoneInput('');
        setPasswordInput('');
        setConfirmPasswordInput('');
        fetchStaffAndLogs(filterDate);
      } else {
        alert(data.message || 'Failed to save staff account.');
      }
    } catch (error) {
      console.error('Save User Error:', error);
    }
  };

  // 🗑️ Delete Staff Handler
  const handleDeleteStaff = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to remove staff account for "${userName || 'User'}"? They will lose all administrative access.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/staff-users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        showToast('Staff account successfully removed.');
        fetchStaffAndLogs(filterDate);
      } else {
        alert(data.message || 'Failed to delete staff account.');
      }
    } catch (error) {
      console.error('Delete Staff Error:', error);
    }
  };

  // 🔄 Inline Role Change Handler
  const handleRoleChange = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/update-role', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          role: newRole
        })
      });
      const data = await response.json();
      if (data.success) {
        showToast('Role updated successfully.');
        fetchStaffAndLogs(filterDate);
      } else {
        alert(data.message || 'Failed to update role.');
      }
    } catch (error) {
      console.error('Role Change Error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1E4D58] text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-black flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Roles & Staff Access Management</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage personnel accounts and track audit logs.
          </p>
        </div>
        <button
          onClick={() => fetchStaffAndLogs(filterDate)}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Roster</span>
        </button>
      </div>

      {/* CREATE / ASSIGN USER FORM */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Add Staff or Assign Role by Phone</h3>
        
        <form onSubmit={handleSaveUser} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Staff Full Name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="px-4 py-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#1E4D58]"
          />

          <input
            type="text"
            placeholder="Phone Number (e.g. 0911000000)"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            required
            className="px-4 py-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#1E4D58]"
          />

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-4 py-3 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-[#1E4D58]"
          >
            <option value="superadmin">Super Admin (Full Platform Control)</option>
            <option value="admin">Admin (Operations)</option>
            <option value="staff">Staff (Store Approvals & Banners)</option>
            <option value="delivery">Delivery (Logistics)</option>
            <option value="customer">Customer (Revoke Access)</option>
          </select>

          <input
            type="password"
            placeholder="Login Password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            className="px-4 py-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#1E4D58]"
          />

          <input
            type="password"
            placeholder="Confirm Login Password"
            value={confirmPasswordInput}
            onChange={(e) => setConfirmPasswordInput(e.target.value)}
            className="px-4 py-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#1E4D58]"
          />

          <button
            type="submit"
            className="py-3 bg-[#1E4D58] hover:bg-[#163C45] text-white font-black text-xs rounded-xl uppercase tracking-wider transition cursor-pointer flex items-center justify-center space-x-2 sm:col-span-2 lg:col-span-1"
          >
            <UserPlus className="w-4 h-4" />
            <span>Save / Create Account</span>
          </button>
        </form>
      </div>

      {/* STAFF LIST */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Active Authorized Personnel Roster</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {staffList.map((user) => (
            <div key={user.id} className="border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-black text-slate-900 text-xs">{user.name || 'Unnamed Personnel'}</h4>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                    user.role === 'superadmin' ? 'bg-purple-600 text-white' :
                    user.role === 'admin' ? 'bg-[#1E4D58] text-white' :
                    user.role === 'delivery' ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
                  }`}>
                    {user.role}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono">Phone: {user.phone}</p>
              </div>

              {/* ACTION CONTROLS: ROLE SELECTOR & DELETE */}
              <div className="flex items-center space-x-2">
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-300 rounded-xl text-[11px] font-bold bg-white text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="superadmin">Superadmin</option>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                  <option value="delivery">Delivery</option>
                  <option value="customer">Customer</option>
                </select>

                <button
                  onClick={() => handleDeleteStaff(user.id, user.name)}
                  className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition cursor-pointer"
                  title="Remove Staff Account"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ACTIVITY AUDIT LOGS WITH DATE FILTER */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#1E4D58]" />
            Staff & Admin Activity Audit Trail
          </h3>
          
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="text-[10px] font-black text-rose-600 hover:underline cursor-pointer"
              >
                Clear Date
              </button>
            )}
          </div>
        </div>

        {activityLogs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 font-bold">No recorded activity logs found for this date.</div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {activityLogs.map((log) => (
              <div key={log.id} className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-black text-slate-900">{log.userName || log.userPhone}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-500 ml-2 bg-slate-200 px-1.5 py-0.5 rounded">{log.role}</span>
                  <p className="text-slate-600 mt-1 font-medium">{log.description}</p>
                </div>
                <span className="text-[10px] font-mono text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default SuperAdminRoles;