import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table';
import { Textarea } from './components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Status Check Component
const StatusChecker = () => {
  const [nim, setNim] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const checkStatus = async () => {
    if (!nim.trim() || !email.trim()) {
      toast.error('NIM dan Email harus diisi');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/check-status`, {
        nim: nim.trim(),
        email: email.trim()
      });
      setResult(response.data);
      if (!response.data.found) {
        toast.error('Data tidak ditemukan. Periksa kembali NIM dan Email Anda.');
      }
    } catch (error) {
      console.error('Error checking status:', error);
      toast.error('Terjadi kesalahan saat mengecek status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Diterima': return 'bg-green-100 text-green-800 border-green-200';
      case 'Ditolak': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Cek Status Beasiswa
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Beasiswa ITB Untuk Semua - Periksa status aplikasi beasiswa Anda
          </p>
        </div>

        {/* Status Check Form */}
        <div className="max-w-md mx-auto mb-8">
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-gray-800">Periksa Status</CardTitle>
              <CardDescription>
                Masukkan NIM dan Email yang terdaftar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Nomor Induk Mahasiswa (NIM)"
                  value={nim}
                  onChange={(e) => setNim(e.target.value)}
                  data-testid="nim-input"
                  className="h-12 text-base"
                />
              </div>
              <div>
                <Input
                  type="email"
                  placeholder="Email terdaftar"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="email-input"
                  className="h-12 text-base"
                />
              </div>
              <Button
                onClick={checkStatus}
                disabled={loading}
                data-testid="check-status-btn"
                className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? 'Memeriksa...' : 'Periksa Status'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        {result && (
          <div className="max-w-2xl mx-auto">
            {result.found ? (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm" data-testid="status-result">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-800">Status Aplikasi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">NIM</p>
                      <p className="font-medium text-gray-900">{result.nim}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Nama Lengkap</p>
                      <p className="font-medium text-gray-900">{result.nama_lengkap}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <Badge className={`${getStatusColor(result.status)} font-medium`} data-testid="status-badge">
                        {result.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tanggal Daftar</p>
                      <p className="font-medium text-gray-900">{formatDate(result.tanggal_daftar)}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600">Tanggal Update Terakhir</p>
                      <p className="font-medium text-gray-900">{formatDate(result.tanggal_update)}</p>
                    </div>
                  </div>
                  {result.catatan && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Catatan</p>
                      <p className="text-gray-800" data-testid="status-notes">{result.catatan}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-lg border-0 bg-red-50 border-red-200">
                <CardContent className="p-6 text-center">
                  <p className="text-red-800 font-medium">Data tidak ditemukan</p>
                  <p className="text-red-600 text-sm mt-2">
                    Periksa kembali NIM dan Email yang Anda masukkan
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Admin Login Component
const AdminLogin = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      toast.error('Username dan password harus diisi');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/admin/login`, {
        username: username.trim(),
        password: password.trim()
      });
      
      localStorage.setItem('admin_token', response.data.access_token);
      onLogin();
      toast.success('Login berhasil');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Username atau password salah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100 flex items-center justify-center">
      <Card className="w-full max-w-md shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-gray-800">Admin Login</CardTitle>
          <CardDescription>
            Masuk ke dashboard admin beasiswa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              data-testid="admin-username-input"
              className="h-12"
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="admin-password-input"
              className="h-12"
            />
          </div>
          <Button
            onClick={handleLogin}
            disabled={loading}
            data-testid="admin-login-btn"
            className="w-full h-12 bg-slate-700 hover:bg-slate-800 text-white"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// Admin Dashboard Component
const AdminDashboard = ({ onLogout }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const token = localStorage.getItem('admin_token');
  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/admin/applications`, axiosConfig);
      setApplications(response.data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      if (error.response?.status === 401) {
        toast.error('Sesi telah berakhir, silakan login kembali');
        onLogout();
      } else {
        toast.error('Gagal memuat data aplikasi');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleEdit = (app) => {
    setEditingApp({ ...app });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingApp) return;

    try {
      await axios.put(`${API}/admin/applications/${editingApp.id}`, {
        status: editingApp.status,
        catatan: editingApp.catatan
      }, axiosConfig);
      
      toast.success('Data berhasil diperbarui');
      setIsEditDialogOpen(false);
      setEditingApp(null);
      fetchApplications();
    } catch (error) {
      console.error('Error updating application:', error);
      toast.error('Gagal memperbarui data');
    }
  };

  const handleDelete = async (appId) => {
    if (!confirm('Apakah Anda yakin ingin menghapus aplikasi ini?')) return;

    try {
      await axios.delete(`${API}/admin/applications/${appId}`, axiosConfig);
      toast.success('Aplikasi berhasil dihapus');
      fetchApplications();
    } catch (error) {
      console.error('Error deleting application:', error);
      toast.error('Gagal menghapus aplikasi');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Diterima': return 'bg-green-100 text-green-800';
      case 'Ditolak': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin Beasiswa</h1>
            <Button
              onClick={onLogout}
              variant="outline"
              data-testid="admin-logout-btn"
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              Keluar
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Daftar Aplikasi Beasiswa</h2>
            <Button
              onClick={fetchApplications}
              disabled={loading}
              data-testid="refresh-applications-btn"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Memuat...' : 'Refresh Data'}
            </Button>
          </div>

          {/* Applications Table */}
          <Card className="shadow-lg border-0">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>NIM</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>IPK</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tanggal Daftar</TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell className="font-mono text-sm">{app.nim}</TableCell>
                        <TableCell className="font-medium">{app.nama_lengkap}</TableCell>
                        <TableCell className="text-sm">{app.email}</TableCell>
                        <TableCell className="text-center font-semibold">{app.ipk}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(app.status)}>
                            {app.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(app.tanggal_daftar)}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              onClick={() => handleEdit(app)}
                              data-testid={`edit-btn-${app.nim}`}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs"
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(app.id)}
                              data-testid={`delete-btn-${app.nim}`}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-xs"
                            >
                              Hapus
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {applications.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  Belum ada aplikasi beasiswa
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Aplikasi</DialogTitle>
            <DialogDescription>
              Edit status dan catatan untuk {editingApp?.nama_lengkap}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
              <Select
                value={editingApp?.status || ''}
                onValueChange={(value) => setEditingApp(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger data-testid="status-select">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dalam Review">Dalam Review</SelectItem>
                  <SelectItem value="Diterima">Diterima</SelectItem>
                  <SelectItem value="Ditolak">Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Catatan</label>
              <Textarea
                placeholder="Tambahkan catatan..."
                value={editingApp?.catatan || ''}
                onChange={(e) => setEditingApp(prev => ({ ...prev, catatan: e.target.value }))}
                data-testid="notes-textarea"
                className="min-h-[100px]"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                data-testid="cancel-edit-btn"
              >
                Batal
              </Button>
              <Button
                onClick={handleUpdate}
                data-testid="save-changes-btn"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Simpan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Main App Component
function App() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState('public'); // 'public' or 'admin'

  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem('admin_token');
    if (token) {
      setIsAdminLoggedIn(true);
    }
  }, []);

  const handleAdminLogin = () => {
    setIsAdminLoggedIn(true);
    setCurrentView('admin');
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAdminLoggedIn(false);
    setCurrentView('public');
    toast.success('Berhasil logout');
  };

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <div>
                {/* Navigation */}
                <div className="fixed top-4 right-4 z-50">
                  {currentView === 'public' ? (
                    <Button
                      onClick={() => setCurrentView('admin')}
                      variant="outline"
                      data-testid="go-to-admin-btn"
                      className="bg-white/80 backdrop-blur-sm border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Admin
                    </Button>
                  ) : !isAdminLoggedIn ? (
                    <Button
                      onClick={() => setCurrentView('public')}
                      variant="outline"
                      data-testid="back-to-public-btn"
                      className="bg-white/80 backdrop-blur-sm border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Kembali
                    </Button>
                  ) : null}
                </div>

                {/* Main Content */}
                {currentView === 'public' && <StatusChecker />}
                {currentView === 'admin' && !isAdminLoggedIn && (
                  <AdminLogin onLogin={handleAdminLogin} />
                )}
                {currentView === 'admin' && isAdminLoggedIn && (
                  <AdminDashboard onLogout={handleAdminLogout} />
                )}
              </div>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;