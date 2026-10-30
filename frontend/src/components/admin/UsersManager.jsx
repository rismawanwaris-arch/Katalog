import React, { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, Search, Edit2, Key, Trash2, Shield, CheckCircle2, XCircle, Store, X, AlertCircle, RefreshCw, Lock, Eye, EyeOff, Copy, Check, Sparkles } from 'lucide-react';

export default function UsersManager({ adminToken, outlets = [] }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedOutlet, setSelectedOutlet] = useState('ALL');

  // Modal Create
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(getInitialCreateForm());
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Modal Edit
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ full_name: '', role: 'KASIR', assigned_outlet: '', status: 'ACTIVE' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Modal Reset Password
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  function generateRandomPassword() {
    const words = ['Alfa', 'Bintang', 'Suci', 'Katalog', 'Aksesoris', 'Ugreen', 'Vention', 'Kasir', 'Toko'];
    const symbols = ['@', '#', '$', '!'];
    const word = words[Math.floor(Math.random() * words.length)];
    const num = Math.floor(100 + Math.random() * 900);
    const sym = symbols[Math.floor(Math.random() * symbols.length)];
    const gen = `${word}${sym}${num}`;
    setNewPassword(gen);
    setShowPassword(true);
  }

  function copyToClipboard() {
    if (!newPassword) return;
    navigator.clipboard.writeText(newPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Delete State
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  function getInitialCreateForm() {
    return {
      username: '',
      password: '',
      full_name: '',
      role: 'KASIR',
      assigned_outlet: outlets[0] || 'ALFA 7',
      status: 'ACTIVE'
    };
  }

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': adminToken }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Create User
  async function handleCreateUser(e) {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminToken
        },
        body: JSON.stringify(createForm)
      });
      const data = await res.json();

      if (data.success) {
        setIsCreateOpen(false);
        setCreateForm(getInitialCreateForm());
        loadUsers();
      } else {
        setCreateError(data.message || 'Gagal membuat pengguna');
      }
    } catch (err) {
      setCreateError('Kesalahan server: ' + err.message);
    } finally {
      setCreateLoading(false);
    }
  }

  // Open Edit
  function handleOpenEdit(u) {
    setEditUser(u);
    setEditForm({
      full_name: u.full_name || '',
      role: u.role || 'KASIR',
      assigned_outlet: u.assigned_outlet || '',
      status: u.status || 'ACTIVE'
    });
    setEditError('');
    setIsEditOpen(true);
  }

  // Save Edit
  async function handleSaveEdit(e) {
    e.preventDefault();
    if (!editUser) return;
    setEditLoading(true);
    setEditError('');

    try {
      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminToken
        },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();

      if (data.success) {
        setIsEditOpen(false);
        loadUsers();
      } else {
        setEditError(data.message || 'Gagal menyimpan data');
      }
    } catch (err) {
      setEditError('Kesalahan server: ' + err.message);
    } finally {
      setEditLoading(false);
    }
  }

  // Open Reset Password
  function handleOpenReset(u) {
    setResetTargetUser(u);
    setNewPassword('');
    setResetError('');
    setIsResetOpen(true);
  }

  // Save Reset Password
  async function handleSaveResetPassword(e) {
    e.preventDefault();
    if (!resetTargetUser) return;
    setResetLoading(true);
    setResetError('');

    try {
      const res = await fetch(`/api/admin/users/${resetTargetUser.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminToken
        },
        body: JSON.stringify({ newPassword })
      });
      const data = await res.json();

      if (data.success) {
        setIsResetOpen(false);
        alert(`Password untuk '${resetTargetUser.username}' berhasil di-reset!`);
      } else {
        setResetError(data.message || 'Gagal me-reset password');
      }
    } catch (err) {
      setResetError('Kesalahan server: ' + err.message);
    } finally {
      setResetLoading(false);
    }
  }

  // Toggle Status
  async function handleToggleStatus(u) {
    const nextStatus = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminToken
        },
        body: JSON.stringify({
          full_name: u.full_name,
          role: u.role,
          assigned_outlet: u.assigned_outlet,
          status: nextStatus
        })
      });
      const data = await res.json();
      if (data.success) {
        loadUsers();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Gagal mengubah status: ' + err.message);
    }
  }

  // Delete User
  async function handleDeleteUser(id) {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': adminToken }
      });
      const data = await res.json();
      if (data.success) {
        setDeleteConfirmId(null);
        loadUsers();
      } else {
        alert(data.message || 'Gagal menghapus user');
      }
    } catch (err) {
      alert('Kesalahan server: ' + err.message);
    }
  }

  // Helpers
  function getRoleBadge(role) {
    switch (role) {
      case 'SUPERADMIN':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200">SUPERADMIN</span>;
      case 'SUPERVISOR':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200">KEPALA TOKO</span>;
      case 'GUDANG':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">ADMIN GUDANG</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">KASIR / STAF</span>;
    }
  }

  const filteredUsers = users.filter(u => {
    const matchSearch = u.username.toLowerCase().includes(search.toLowerCase().trim()) ||
      u.full_name.toLowerCase().includes(search.toLowerCase().trim()) ||
      (u.assigned_outlet || '').toLowerCase().includes(search.toLowerCase().trim());
    const matchRole = selectedRole === 'ALL' || u.role === selectedRole;
    const matchOutlet = selectedOutlet === 'ALL' || u.assigned_outlet === selectedOutlet;
    return matchSearch && matchRole && matchOutlet;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Konsol Pengelolaan Pengguna ({users.length} Akun)
          </h2>
          <p className="text-xs text-slate-500">
            Atur hak akses kasir, kepala toko cabang, admin gudang, dan superadministrator
          </p>
        </div>

        <button
          onClick={() => {
            setCreateForm(getInitialCreateForm());
            setCreateError('');
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pengguna Baru</span>
        </button>
      </div>

      {/* Role Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium block">Total Pengguna</span>
          <span className="text-xl font-black text-slate-800">{users.length}</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] text-emerald-600 font-medium block">Kasir / Staf Toko</span>
          <span className="text-xl font-black text-emerald-700">
            {users.filter(u => u.role === 'KASIR').length}
          </span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] text-blue-600 font-medium block">Kepala Toko / SPV</span>
          <span className="text-xl font-black text-blue-700">
            {users.filter(u => u.role === 'SUPERVISOR').length}
          </span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] text-purple-600 font-medium block">Superadministrator</span>
          <span className="text-xl font-black text-purple-700">
            {users.filter(u => u.role === 'SUPERADMIN').length}
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari username, nama lengkap, atau cabang toko..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />
        </div>

        <select
          value={selectedRole}
          onChange={e => setSelectedRole(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white font-medium"
        >
          <option value="ALL">Semua Peran / Role</option>
          <option value="KASIR">Kasir / Staf Cabang</option>
          <option value="SUPERVISOR">Kepala Toko / SPV</option>
          <option value="GUDANG">Admin Gudang</option>
          <option value="SUPERADMIN">Superadmin</option>
        </select>

        <select
          value={selectedOutlet}
          onChange={e => setSelectedOutlet(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white font-medium max-w-[180px] truncate"
        >
          <option value="ALL">Semua Cabang Toko</option>
          {outlets.map(o => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>

        <button
          onClick={loadUsers}
          className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
          title="Refresh Pengguna"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
        </button>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-3">Role / Peran</th>
                <th className="py-3 px-3">Toko / Cabang Tugas</th>
                <th className="py-3 px-3 text-center">Status Akun</th>
                <th className="py-3 px-3">Dibuat Pada</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
                      <span>Memuat data pengguna...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    Tidak ada pengguna yang cocok dengan kriteria filter Anda.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isMainAdmin = u.username === 'admin' || u.id === 1;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition">
                      
                      {/* User Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {u.full_name ? u.full_name.charAt(0).toUpperCase() : u.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {u.full_name}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono block">
                              @{u.username}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-3">
                        {getRoleBadge(u.role)}
                      </td>

                      {/* Assigned Outlet */}
                      <td className="py-3 px-3">
                        {u.assigned_outlet ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                            <Store className="w-3.5 h-3.5 text-sky-600" />
                            <span>{u.assigned_outlet}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Semua Cabang / Pusat</span>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={isMainAdmin}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                          } ${isMainAdmin ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
                          title={isMainAdmin ? 'Akun Superadmin tidak bisa dinonaktifkan' : 'Klik untuk ganti status aktif/nonaktif'}
                        >
                          {u.status === 'ACTIVE' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Aktif</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-slate-400" />
                              <span>Nonaktif</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Created At */}
                      <td className="py-3 px-3 text-slate-500 text-[11px] font-mono">
                        {u.created_at ? u.created_at.split('T')[0] : '-'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Reset Password Button */}
                          <button
                            onClick={() => handleOpenReset(u)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:border-amber-400 hover:text-amber-700 text-slate-500 transition"
                            title="Reset Password Pengguna"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Details Button */}
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:border-sky-500 hover:text-sky-700 text-slate-500 transition"
                            title="Edit Data Pengguna"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          {!isMainAdmin && (
                            deleteConfirmId === u.id ? (
                              <div className="inline-flex items-center gap-1 bg-rose-50 border border-rose-300 p-1 rounded-lg">
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold"
                                >
                                  Ya
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="px-1 py-0.5 text-slate-500 text-[10px]"
                                >
                                  X
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(u.id)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:border-rose-400 hover:text-rose-600 text-slate-400 transition"
                                title="Hapus Pengguna"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )
                          )}

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: TAMBAH PENGGUNA BARU */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Tambah Pengguna Baru</h3>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Username Login *</label>
                <input
                  type="text"
                  value={createForm.username}
                  onChange={e => setCreateForm({ ...createForm, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                  placeholder="contoh: kasir_bintang"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password Awal *</label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="Minimal 4 karakter..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  value={createForm.full_name}
                  onChange={e => setCreateForm({ ...createForm, full_name: e.target.value })}
                  placeholder="Contoh: Rian - Kasir Bintang"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Peran / Role</label>
                  <select
                    value={createForm.role}
                    onChange={e => setCreateForm({ ...createForm, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-semibold"
                  >
                    <option value="KASIR">Kasir / Staf</option>
                    <option value="SUPERVISOR">Kepala Toko</option>
                    <option value="GUDANG">Admin Gudang</option>
                    <option value="SUPERADMIN">Superadmin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cabang Toko</label>
                  <select
                    value={createForm.assigned_outlet}
                    onChange={e => setCreateForm({ ...createForm, assigned_outlet: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 truncate"
                  >
                    <option value="">Semua Cabang</option>
                    {outlets.map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 rounded-xl bg-sky-700 text-white font-bold hover:bg-sky-800 disabled:opacity-50"
                >
                  {createLoading ? 'Membuat...' : 'Buat Pengguna'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL: EDIT PENGGUNA */}
      {isEditOpen && editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Edit Pengguna: @{editUser.username}</h3>
              </div>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Peran / Role</label>
                  <select
                    value={editForm.role}
                    onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                    disabled={editUser.username === 'admin'}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-semibold disabled:bg-slate-100"
                  >
                    <option value="KASIR">Kasir / Staf</option>
                    <option value="SUPERVISOR">Kepala Toko</option>
                    <option value="GUDANG">Admin Gudang</option>
                    <option value="SUPERADMIN">Superadmin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cabang Toko</label>
                  <select
                    value={editForm.assigned_outlet}
                    onChange={e => setEditForm({ ...editForm, assigned_outlet: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 truncate"
                  >
                    <option value="">Semua Cabang</option>
                    {outlets.map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status Akun</label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  disabled={editUser.username === 'admin'}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 disabled:bg-slate-100"
                >
                  <option value="ACTIVE">Aktif (Dapat Login)</option>
                  <option value="INACTIVE">Nonaktif (Diblokir)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 rounded-xl bg-sky-700 text-white font-bold hover:bg-sky-800 disabled:opacity-50"
                >
                  {editLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL: RESET PASSWORD PENGGUNA */}
      {isResetOpen && resetTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-100">
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Reset Password</h3>
              </div>
              <button onClick={() => setIsResetOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Atur ulang password untuk akun <strong>@{resetTargetUser.username}</strong> ({resetTargetUser.full_name}).
            </p>

            {resetError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handleSaveResetPassword} className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    Password Baru *
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:text-sky-900"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Acak Password</span>
                  </button>
                </div>
                
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Minimal 4 karakter..."
                    className="w-full pl-3 pr-10 py-2 rounded-lg border border-slate-200 font-mono text-sm"
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {newPassword && (
                  <div className="mt-2 flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="font-mono text-xs text-slate-700 font-bold truncate max-w-[180px]">
                      {newPassword}
                    </span>
                    <button
                      type="button"
                      onClick={copyToClipboard}
                      className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 shadow-2xs"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-500" />
                          <span>Salin Password</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
                <p className="text-[10px] text-slate-400 mt-1">
                  💡 Salin password baru ini untuk dibagikan ke kasir via WhatsApp/SMS.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsResetOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-5 py-2 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 disabled:opacity-50"
                >
                  {resetLoading ? 'Menyimpan...' : 'Simpan Password Baru'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
