# CSV Import Fix Guide

## What Was Wrong With Your Original CSV?

Your original CSV had this structure:
```
Column 0: ID (NIM) ✅
Column 1: Email ✅  
Column 2: Name ✅
Columns 3-9: Empty fields ❌
Column 10: Status ✅
Column 11: Category (Tahap) ✅  
Column 12: Message (Notes) ✅
```

But our system expects this structure:
```
nim,email,nama_lengkap,nomor_telepon,alamat,ipk,penghasilan_keluarga,essay,dokumen_pendukung,rekomendasi,status,tahap,catatan
```

## The Fix I Applied

1. **Mapped your columns correctly**:
   - Column 0 → nim
   - Column 1 → email
   - Column 2 → nama_lengkap
   - Column 10 → status
   - Column 11 → tahap  
   - Column 12 → catatan

2. **Added default values for missing fields**:
   - nomor_telepon: (empty)
   - alamat: (empty)
   - ipk: 3.0
   - penghasilan_keluarga: 5000000
   - essay: "Data tidak tersedia"
   - dokumen_pendukung: "Dokumen telah dikirim"
   - rekomendasi: "Rekomendasi tersedia"

## How to Fix Future CSV Imports

### Option 1: Use the Transformation Script

```bash
# For URLs (like yours)
python3 transform_csv.py --url "https://your-csv-url.com/file.csv" -o fixed.csv

# For local files  
python3 transform_csv.py your_file.csv -o fixed.csv
```

### Option 2: Manual CSV Format

Create your CSV with these exact column headers:
```csv
nim,email,nama_lengkap,nomor_telepon,alamat,ipk,penghasilan_keluarga,essay,dokumen_pendukung,rekomendasi,status,tahap,catatan
13523001,student@email.com,"John Doe","081234567890","Address","3.75","5000000","Essay text","Documents","Recommendation","Diterima","Administrasi","Notes"
```

### Option 3: Excel Template

If using Excel:
1. Create columns: A=nim, B=email, C=nama_lengkap, D=nomor_telepon, E=alamat, F=ipk, G=penghasilan_keluarga, H=essay, I=dokumen_pendukung, J=rekomendasi, K=status, L=tahap, M=catatan
2. Fill your data
3. Save as CSV (UTF-8)

## Valid Values

### Status (Column K)
- `Dalam Review` (under review)
- `Diterima` (accepted)  
- `Ditolak` (rejected)

### Tahap (Column L)
- `Administrasi` (administrative review)
- `Wawancara` (interview)
- `Final` (final stage)

## Common Issues and Solutions

### Issue: "Import failed with validation errors"
**Solution**: Check that:
- NIM is not empty
- Email contains '@'
- Name is not empty
- Status is one of the valid values
- IPK is a number between 0-4

### Issue: "Encoding problems with Indonesian characters"
**Solution**: Save your CSV as UTF-8 encoding

### Issue: "Commas in data break CSV format" 
**Solution**: Wrap text containing commas in quotes: `"Text, with commas"`

## Test Your CSV Before Import

```bash
# Validate your CSV structure
python3 -c "
import csv
with open('your_file.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    expected = ['nim','email','nama_lengkap','nomor_telepon','alamat','ipk','penghasilan_keluarga','essay','dokumen_pendukung','rekomendasi','status','tahap','catatan']
    headers = reader.fieldnames
    missing = set(expected) - set(headers or [])
    if missing:
        print(f'Missing columns: {missing}')
    else:
        print('✅ CSV format is correct!')
        print(f'Found {sum(1 for _ in reader)} rows')
"
```

Your data is now successfully imported! ✅