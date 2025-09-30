import React, { useState, useEffect, useRef } from 'react';
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
import { Upload, FileUp, Download, Users, CheckCircle, Clock, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const LOGO_URL = 'https://customer-assets.emergentagent.com/job_beasiswa-checker/artifacts/4hwsl42m_logo.png';

// Status Check Component with Enhanced Design
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
      case 'Diterima': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Ditolak': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Diterima': return <CheckCircle className="w-5 h-5" />;
      case 'Ditolak': return <XCircle className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            {/* Logo */}
            <div className="mb-6">
              <img 
                src={LOGO_URL} 
                alt="ITB untuk Semua" 
                className="h-16 w-auto mx-auto"
              />
            </div>
            
            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Cek Status Beasiswa
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Beasiswa ITB Untuk Semua - Periksa status aplikasi beasiswa Anda
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Status Check Form */}
        <div className="max-w-md mx-auto mb-8">
          <Card className="shadow-lg border-0 bg-white">
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
          <div className="max-w-2xl mx-auto mb-8">
            {result.found ? (
              <Card className="shadow-lg border-0 bg-white" data-testid="status-result">
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
                      <p className="text-sm text-gray-600">Tahap</p>
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200 font-medium" data-testid="step-badge">
                        {result.tahap || 'Administrasi'}
                      </Badge>
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
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <img src={LOGO_URL} alt="ITB untuk Semua" className="h-16 w-auto mx-auto mb-4" />
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
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    limit: 10,
    has_next: false,
    has_prev: false
  });
  const [editingApp, setEditingApp] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [newApplication, setNewApplication] = useState({
    nim: '',
    email: '',
    nama_lengkap: '',
    nomor_telepon: '',
    alamat: '',
    ipk: '',
    penghasilan_keluarga: '',
    essay: '',
    dokumen_pendukung: '',
    rekomendasi: '',
    status: 'Dalam Review',
    tahap: 'Administrasi',
    catatan: ''
  });
  const fileInputRef = useRef(null);

  const token = localStorage.getItem('admin_token');
  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const fetchApplications = async (page = 1) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/admin/applications?page=${page}&limit=10`, axiosConfig);
      setApplications(response.data.applications);
      setPagination(response.data.pagination);
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
    fetchApplications(1);
  }, []);

  const handleAdd = async () => {
    try {
      const applicationData = {
        ...newApplication,
        ipk: parseFloat(newApplication.ipk),
        penghasilan_keluarga: parseInt(newApplication.penghasilan_keluarga)
      };

      await axios.post(`${API}/admin/applications`, applicationData, axiosConfig);
      
      toast.success('Aplikasi berhasil ditambahkan');
      setIsAddDialogOpen(false);
      setNewApplication({
        nim: '',
        email: '',
        nama_lengkap: '',
        nomor_telepon: '',
        alamat: '',
        ipk: '',
        penghasilan_keluarga: '',
        essay: '',
        dokumen_pendukung: '',
        rekomendasi: '',
        status: 'Dalam Review',
        tahap: 'Administrasi',
        catatan: ''
      });
      fetchApplications(1);
    } catch (error) {
      console.error('Error adding application:', error);
      toast.error(error.response?.data?.detail || 'Gagal menambahkan aplikasi');
    }
  };

  const handleEdit = (app) => {
    setEditingApp({ ...app });
    setIsEditDialogOpen(true);
  };
  const handleUpdate = async () => {

    try {
      await axios.put(`${API}/admin/applications/${editingApp.id}`, {
        status: editingApp.status,
        tahap: editingApp.tahap,
        catatan: editingApp.catatan
      }, axiosConfig);
      
      toast.success('Data berhasil diperbarui');
      setIsEditDialogOpen(false);
      setEditingApp(null);
      fetchApplications(pagination.current_page);
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
      fetchApplications(pagination.current_page);
    } catch (error) {
      console.error('Error deleting application:', error);
      toast.error('Gagal menghapus aplikasi');
    }
  };

  const handleImportCSV = async () => {
    if (!importFile) {
      toast.error('Pilih file CSV terlebih dahulu');
      return;
    }

    setImportLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);

      const response = await axios.post(`${API}/admin/import-csv`, formData, {
        ...axiosConfig,
        headers: {
          ...axiosConfig.headers,
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = response.data;
      if (result.success) {
        toast.success(result.message);
        if (result.errors.length > 0) {
          console.log('Import errors:', result.errors);
        }
        fetchApplications(1);
      } else {
        toast.error('Gagal mengimpor data');
      }

      setIsImportDialogOpen(false);
      setImportFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast.error('Gagal mengimpor file CSV');
    } finally {
      setImportLoading(false);
    }
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      {
        nim: '13523001',
        email: 'contoh@students.itb.ac.id',
        nama_lengkap: 'Contoh Nama Lengkap',
        nomor_telepon: '081234567890',
        alamat: 'Jl. Contoh No. 123, Bandung',
        ipk: '3.75',
        penghasilan_keluarga: '5000000',
        essay: 'Essay singkat tentang motivasi beasiswa',
        dokumen_pendukung: 'KTM, KK, Slip Gaji',
        rekomendasi: 'Surat rekomendasi dosen',
        status: 'Dalam Review',
        tahap: 'Administrasi',
        catatan: 'Catatan opsional'
      }
    ];

    const csvContent = [
      Object.keys(sampleData[0]).join(','),
      ...sampleData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_beasiswa_import.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID');
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <img src={LOGO_URL} alt="ITB untuk Semua" className="h-8 sm:h-10 w-auto" />
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Dashboard Admin Beasiswa</h1>
            </div>
            <Button
              onClick={onLogout}
              variant="outline"
              data-testid="admin-logout-btn"
              className="border-red-300 text-red-600 hover:bg-red-50 w-full sm:w-auto"
            >
              Keluar
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex flex-col space-y-4 mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Daftar Aplikasi Beasiswa</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                data-testid="add-application-btn"
                className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto"
              >
                <Users className="w-4 h-4 mr-2" />
                Tambah Aplikasi
              </Button>
              <Button
                onClick={() => setIsImportDialogOpen(true)}
                data-testid="import-csv-btn"
                className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </Button>
              <Button
                onClick={() => fetchApplications(pagination.current_page)}
                disabled={loading}
                data-testid="refresh-applications-btn"
                className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
              >
                {loading ? 'Memuat...' : 'Refresh Data'}
              </Button>
            </div>
          </div>

          {/* Applications Table */}
          <Card className="shadow-lg border-0">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="min-w-[100px]">NIM</TableHead>
                      <TableHead className="min-w-[150px]">Nama</TableHead>
                      <TableHead className="hidden md:table-cell min-w-[200px]">Email</TableHead>
                      <TableHead className="hidden sm:table-cell text-center">IPK</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Tahap</TableHead>
                      <TableHead className="text-center min-w-[120px]">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell className="font-mono text-xs sm:text-sm">
                          <div>{app.nim}</div>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="max-w-[150px] truncate" title={app.nama_lengkap}>
                            {app.nama_lengkap}
                          </div>
                          <div className="text-xs text-gray-500 md:hidden mt-1 truncate" title={app.email}>
                            {app.email}
                          </div>
                          <div className="text-xs text-gray-500 sm:hidden mt-1">
                            IPK: {app.ipk}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm hidden md:table-cell">
                          <div className="max-w-[200px] truncate" title={app.email}>
                            {app.email}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-semibold hidden sm:table-cell">{app.ipk}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(app.status)}>
                            {app.status}
                          </Badge>
                          <div className="text-xs text-blue-600 lg:hidden mt-1">
                            {app.tahap || 'Administrasi'}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                            {app.tahap || 'Administrasi'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 justify-center">
                            <Button
                              size="sm"
                              onClick={() => handleEdit(app)}
                              data-testid={`edit-btn-${app.nim}`}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 text-xs"
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(app.id)}
                              data-testid={`delete-btn-${app.nim}`}
                              className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-xs"
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
              
              {/* Pagination Controls */}
              {pagination.total_pages > 1 && (
                <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Menampilkan {((pagination.current_page - 1) * pagination.limit) + 1} - {Math.min(pagination.current_page * pagination.limit, pagination.total_count)} dari {pagination.total_count} data
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchApplications(pagination.current_page - 1)}
                        disabled={!pagination.has_prev}
                        className="flex items-center"
                        data-testid="prev-page-btn"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Sebelumnya
                      </Button>
                      
                      {/* Page Numbers */}
                      <div className="hidden sm:flex space-x-1">
                        {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                          let pageNum;
                          if (pagination.total_pages <= 5) {
                            pageNum = i + 1;
                          } else if (pagination.current_page <= 3) {
                            pageNum = i + 1;
                          } else if (pagination.current_page >= pagination.total_pages - 2) {
                            pageNum = pagination.total_pages - 4 + i;
                          } else {
                            pageNum = pagination.current_page - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={pageNum === pagination.current_page ? "default" : "outline"}
                              size="sm"
                              onClick={() => fetchApplications(pageNum)}
                              className="w-8 h-8 p-0"
                              data-testid={`page-btn-${pageNum}`}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      
                      {/* Mobile page indicator */}
                      <div className="sm:hidden text-sm text-gray-600">
                        {pagination.current_page} / {pagination.total_pages}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchApplications(pagination.current_page + 1)}
                        disabled={!pagination.has_next}
                        className="flex items-center"
                        data-testid="next-page-btn"
                      >
                        Selanjutnya
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
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
              <label className="text-sm font-medium text-gray-700 mb-2 block">Tahap</label>
              <Select
                value={editingApp?.tahap || ''}
                onValueChange={(value) => setEditingApp(prev => ({ ...prev, tahap: value }))}
              >
                <SelectTrigger data-testid="step-select">
                  <SelectValue placeholder="Pilih tahap" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Administrasi">Administrasi</SelectItem>
                  <SelectItem value="Wawancara">Wawancara</SelectItem>
                  <SelectItem value="Final">Final</SelectItem>
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

      {/* Add Application Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-w-[95vw] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Tambah Aplikasi Baru</DialogTitle>
            <DialogDescription>
              Masukkan data aplikasi beasiswa baru
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">NIM *</label>
                <Input
                  placeholder="13523001"
                  value={newApplication.nim}
                  onChange={(e) => setNewApplication(prev => ({ ...prev, nim: e.target.value }))}
                  data-testid="add-nim-input"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Email *</label>
                <Input
                  type="email"
                  placeholder="email@students.itb.ac.id"
                  value={newApplication.email}
                  onChange={(e) => setNewApplication(prev => ({ ...prev, email: e.target.value }))}
                  data-testid="add-email-input"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Nama Lengkap *</label>
                <Input
                  placeholder="Nama lengkap mahasiswa"
                  value={newApplication.nama_lengkap}
                  onChange={(e) => setNewApplication(prev => ({ ...prev, nama_lengkap: e.target.value }))}
                  data-testid="add-name-input"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Nomor Telepon</label>
                <Input
                  placeholder="081234567890"
                  value={newApplication.nomor_telepon}
                  onChange={(e) => setNewApplication(prev => ({ ...prev, nomor_telepon: e.target.value }))}
                  data-testid="add-phone-input"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">IPK</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4"
                  placeholder="3.75"
                  value={newApplication.ipk}
                  onChange={(e) => setNewApplication(prev => ({ ...prev, ipk: e.target.value }))}
                  data-testid="add-ipk-input"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Penghasilan Keluarga</label>
                <Input
                  type="number"
                  placeholder="5000000"
                  value={newApplication.penghasilan_keluarga}
                  onChange={(e) => setNewApplication(prev => ({ ...prev, penghasilan_keluarga: e.target.value }))}
                  data-testid="add-income-input"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                <Select
                  value={newApplication.status}
                  onValueChange={(value) => setNewApplication(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger data-testid="add-status-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dalam Review">Dalam Review</SelectItem>
                    <SelectItem value="Diterima">Diterima</SelectItem>
                    <SelectItem value="Ditolak">Ditolak</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Tahap</label>
                <Select
                  value={newApplication.tahap}
                  onValueChange={(value) => setNewApplication(prev => ({ ...prev, tahap: value }))}
                >
                  <SelectTrigger data-testid="add-step-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Administrasi">Administrasi</SelectItem>
                    <SelectItem value="Wawancara">Wawancara</SelectItem>
                    <SelectItem value="Final">Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Alamat</label>
                <Input
                  placeholder="Alamat lengkap"
                  value={newApplication.alamat}
                  onChange={(e) => setNewApplication(prev => ({ ...prev, alamat: e.target.value }))}
                  data-testid="add-address-input"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Essay</label>
                <Textarea
                  placeholder="Essay motivasi beasiswa"
                  value={newApplication.essay}
                  onChange={(e) => setNewApplication(prev => ({ ...prev, essay: e.target.value }))}
                  data-testid="add-essay-textarea"
                  className="min-h-[80px]"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Dokumen Pendukung</label>
                <Input
                  placeholder="KTM, KK, Slip Gaji"
                  value={newApplication.dokumen_pendukung}
                  onChange={(e) => setNewApplication(prev => ({ ...prev, dokumen_pendukung: e.target.value }))}
                  data-testid="add-documents-input"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Rekomendasi</label>
                <Input
                  placeholder="Surat rekomendasi"
                  value={newApplication.rekomendasi}
                  onChange={(e) => setNewApplication(prev => ({ ...prev, rekomendasi: e.target.value }))}
                  data-testid="add-recommendation-input"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Catatan</label>
                <Textarea
                  placeholder="Catatan tambahan"
                  value={newApplication.catatan}
                  onChange={(e) => setNewApplication(prev => ({ ...prev, catatan: e.target.value }))}
                  data-testid="add-notes-textarea"
                  className="min-h-[60px]"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setNewApplication({
                  nim: '',
                  email: '',
                  nama_lengkap: '',
                  nomor_telepon: '',
                  alamat: '',
                  ipk: '',
                  penghasilan_keluarga: '',
                  essay: '',
                  dokumen_pendukung: '',
                  rekomendasi: '',
                  status: 'Dalam Review',
                  tahap: 'Administrasi',
                  catatan: ''
                });
              }}
              data-testid="cancel-add-btn"
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button
              onClick={handleAdd}
              data-testid="save-add-btn"
              className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto"
            >
              Tambah Aplikasi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import CSV Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Data CSV</DialogTitle>
            <DialogDescription>
              Upload file CSV untuk mengimpor data aplikasi beasiswa
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">File CSV</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={(e) => setImportFile(e.target.files[0])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="csv-file-input"
              />
              {importFile && (
                <p className="text-sm text-green-600 mt-1">
                  File dipilih: {importFile.name}
                </p>
              )}
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Format CSV yang Diperlukan:</h4>
              <p className="text-xs text-blue-800 mb-2">
                File CSV harus memiliki kolom: nim, email, nama_lengkap, nomor_telepon, alamat, ipk, penghasilan_keluarga, essay, dokumen_pendukung, rekomendasi, status, tahap, catatan
              </p>
              <p className="text-xs text-blue-800 mb-2">
                <strong>Catatan:</strong> Jika NIM dan email sudah ada, data akan diperbarui. Jika belum ada, data baru akan ditambahkan.
              </p>
              <Button
                onClick={downloadSampleCSV}
                variant="outline"
                size="sm"
                data-testid="download-sample-btn"
                className="text-blue-700 border-blue-300 hover:bg-blue-100"
              >
                <Download className="w-4 h-4 mr-1" />
                Unduh Contoh CSV
              </Button>
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsImportDialogOpen(false);
                  setImportFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                data-testid="cancel-import-btn"
              >
                Batal
              </Button>
              <Button
                onClick={handleImportCSV}
                disabled={!importFile || importLoading}
                data-testid="confirm-import-btn"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {importLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Mengimpor...
                  </>
                ) : (
                  <>
                    <FileUp className="w-4 h-4 mr-2" />
                    Import
                  </>
                )}
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
    
    // Check if URL path is /admin to show admin interface
    const currentPath = window.location.pathname;
    if (currentPath === '/admin') {
      setCurrentView('admin');
    }
  }, []);

  const handleAdminLogin = () => {
    setIsAdminLoggedIn(true);
    setCurrentView('admin');
    // Update URL to /admin without page reload
    window.history.pushState({}, '', '/admin');
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAdminLoggedIn(false);
    setCurrentView('public');
    // Redirect to home page
    window.history.pushState({}, '', '/');
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
          <Route 
            path="/admin" 
            element={
              <div>
                {!isAdminLoggedIn ? (
                  <AdminLogin onLogin={handleAdminLogin} />
                ) : (
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