#!/usr/bin/env python3
"""
CSV Transformation Tool for Beasiswa ITB Status Checker
This script converts your original CSV to the format expected by the system.
"""

import csv
import sys
import argparse
from urllib.request import urlretrieve
from urllib.parse import urlparse
import tempfile
import os

def download_csv(url, output_path):
    """Download CSV from URL"""
    print(f"Downloading CSV from: {url}")
    urlretrieve(url, output_path)
    print(f"Downloaded to: {output_path}")

def transform_csv(input_file, output_file):
    """Transform the original CSV to the expected format"""
    
    print(f"Transforming {input_file} -> {output_file}")
    
    # Expected column headers for our system
    expected_headers = [
        'nim', 'email', 'nama_lengkap', 'nomor_telepon', 'alamat', 'ipk', 
        'penghasilan_keluarga', 'essay', 'dokumen_pendukung', 'rekomendasi', 
        'status', 'tahap', 'catatan'
    ]
    
    transformed_count = 0
    errors = []
    
    try:
        with open(input_file, 'r', encoding='utf-8') as infile:
            # Try to detect if file has headers by checking first row
            first_line = infile.readline().strip()
            infile.seek(0)  # Reset file pointer
            
            # Read CSV
            reader = csv.reader(infile)
            
            with open(output_file, 'w', encoding='utf-8', newline='') as outfile:
                writer = csv.writer(outfile)
                
                # Write headers
                writer.writerow(expected_headers)
                
                # Process each row
                row_num = 0
                for row in reader:
                    row_num += 1
                    try:
                        # Skip empty rows
                        if not row or len(row) < 3:
                            continue
                            
                        # Your CSV structure based on analysis:
                        # 0: ID (NIM)
                        # 1: Email  
                        # 2: Full Name
                        # 3-9: Empty columns
                        # 10: Status (Diterima/Ditolak)
                        # 11: Category (Administrasi/Wawancara/Final) 
                        # 12: Message/Notes
                        
                        if len(row) >= 13:
                            nim = str(row[0]).strip().strip('"')
                            email = str(row[1]).strip().strip('"')
                            nama_lengkap = str(row[2]).strip().strip('"')
                            status = str(row[10]).strip().strip('"') if len(row) > 10 else "Dalam Review"
                            tahap = str(row[11]).strip().strip('"') if len(row) > 11 else "Administrasi"
                            catatan = str(row[12]).strip().strip('"') if len(row) > 12 else ""
                            
                            # Validate required fields
                            if not nim or not email or not nama_lengkap:
                                errors.append(f"Row {row_num}: Missing required fields (NIM, Email, or Name)")
                                continue
                            
                            # Validate email format (basic check)
                            if '@' not in email:
                                errors.append(f"Row {row_num}: Invalid email format: {email}")
                                continue
                            
                            # Map status values
                            status_mapping = {
                                'Diterima': 'Diterima',
                                'Ditolak': 'Ditolak', 
                                'Dalam Review': 'Dalam Review',
                                '': 'Dalam Review'
                            }
                            status = status_mapping.get(status, 'Dalam Review')
                            
                            # Map tahap values
                            tahap_mapping = {
                                'Administrasi': 'Administrasi',
                                'Wawancara': 'Wawancara',
                                'Final': 'Final',
                                '': 'Administrasi'
                            }
                            tahap = tahap_mapping.get(tahap, 'Administrasi')
                            
                            # Write transformed row with defaults for missing fields
                            transformed_row = [
                                nim,                           # nim
                                email,                         # email  
                                nama_lengkap,                  # nama_lengkap
                                '',                           # nomor_telepon (default empty)
                                '',                           # alamat (default empty)
                                '3.0',                        # ipk (default)
                                '5000000',                    # penghasilan_keluarga (default)
                                'Data tidak tersedia',        # essay (default)
                                'Dokumen telah dikirim',      # dokumen_pendukung (default)
                                'Rekomendasi tersedia',       # rekomendasi (default)
                                status,                       # status
                                tahap,                        # tahap
                                catatan                       # catatan
                            ]
                            
                            writer.writerow(transformed_row)
                            transformed_count += 1
                            
                        else:
                            errors.append(f"Row {row_num}: Insufficient columns (expected at least 13, got {len(row)})")
                            
                    except Exception as e:
                        errors.append(f"Row {row_num}: Error processing row - {str(e)}")
                        continue
    
    except Exception as e:
        print(f"Error reading file: {e}")
        return False, 0, [f"File error: {e}"]
    
    return True, transformed_count, errors

def main():
    parser = argparse.ArgumentParser(description='Transform CSV for Beasiswa ITB Status Checker')
    parser.add_argument('input', help='Input CSV file path or URL')
    parser.add_argument('-o', '--output', default='transformed_beasiswa.csv', 
                       help='Output CSV file path (default: transformed_beasiswa.csv)')
    parser.add_argument('--url', action='store_true', 
                       help='Treat input as URL and download first')
    
    args = parser.parse_args()
    
    input_file = args.input
    
    # Handle URL input
    if args.url or args.input.startswith('http'):
        temp_file = tempfile.mktemp(suffix='.csv')
        try:
            download_csv(args.input, temp_file)
            input_file = temp_file
        except Exception as e:
            print(f"Error downloading file: {e}")
            return 1
    
    # Check if input file exists
    if not os.path.exists(input_file):
        print(f"Error: Input file '{input_file}' not found")
        return 1
    
    # Transform the CSV
    success, count, errors = transform_csv(input_file, args.output)
    
    # Report results
    print(f"\n=== Transformation Results ===")
    if success:
        print(f"✅ Successfully transformed {count} records")
        print(f"📁 Output file: {args.output}")
        
        if errors:
            print(f"\n⚠️  {len(errors)} errors encountered:")
            for error in errors[:10]:  # Show first 10 errors
                print(f"   - {error}")
            if len(errors) > 10:
                print(f"   ... and {len(errors) - 10} more errors")
    else:
        print("❌ Transformation failed")
        if errors:
            for error in errors:
                print(f"   - {error}")
    
    # Clean up temp file
    if args.url or args.input.startswith('http'):
        try:
            os.unlink(input_file)
        except:
            pass
    
    return 0 if success else 1

if __name__ == '__main__':
    sys.exit(main())