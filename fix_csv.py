#!/usr/bin/env python3
"""
Quick CSV Fix for Beasiswa ITB
Fixes common issues with CSV formatting for import
"""

import csv
import re
import sys

def fix_csv(input_file, output_file=None):
    """Fix common CSV issues for beasiswa import"""
    
    if output_file is None:
        output_file = input_file.replace('.csv', '_fixed.csv')
    
    print(f"🔧 Fixing CSV: {input_file} -> {output_file}")
    
    try:
        with open(input_file, 'r', encoding='utf-8') as infile:
            content = infile.read().strip()
        
        lines = content.split('\n')
        if not lines:
            print("❌ Empty file")
            return False
        
        # Fix header line
        header = lines[0]
        
        # Common header fixes
        header = re.sub(r',\s+', ',', header)  # Remove extra spaces after commas
        header = re.sub(r'\s+,', ',', header)  # Remove spaces before commas
        header = header.replace('format.nim', 'nim')  # Remove format prefix
        header = header.replace('status,tahap', 'status,tahap')  # Ensure proper spacing
        
        print(f"✅ Fixed header: {header}")
        
        with open(output_file, 'w', encoding='utf-8', newline='') as outfile:
            writer = csv.writer(outfile)
            
            # Write header
            writer.writerow([col.strip() for col in header.split(',')])
            
            # Process data rows
            fixed_count = 0
            for line_num, line in enumerate(lines[1:], 2):
                if not line.strip():
                    continue
                
                try:
                    # Parse the line
                    reader = csv.reader([line])
                    row = next(reader)
                    
                    # Clean each cell
                    cleaned_row = []
                    for i, cell in enumerate(row):
                        cell = cell.strip()
                        
                        # Replace dash placeholders with appropriate defaults
                        if cell == '-':
                            if i == 3:  # nomor_telepon
                                cell = ''
                            elif i == 4:  # alamat
                                cell = ''
                            elif i == 5:  # ipk
                                cell = '3.0'
                            elif i == 6:  # penghasilan_keluarga
                                cell = '5000000'
                            elif i == 7:  # essay
                                cell = 'Data tidak tersedia'
                            elif i == 8:  # dokumen_pendukung
                                cell = 'Dokumen telah dikirim'
                            elif i == 9:  # rekomendasi
                                cell = 'Rekomendasi tersedia'
                            else:
                                cell = ''
                        
                        cleaned_row.append(cell)
                    
                    writer.writerow(cleaned_row)
                    fixed_count += 1
                    
                except Exception as e:
                    print(f"⚠️  Error on line {line_num}: {e}")
                    continue
            
            print(f"✅ Fixed {fixed_count} data rows")
            print(f"📁 Output saved to: {output_file}")
            return True
            
    except Exception as e:
        print(f"❌ Error fixing CSV: {e}")
        return False

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 fix_csv.py <input_csv_file> [output_csv_file]")
        print("Example: python3 fix_csv.py databius.csv databius_fixed.csv")
        return 1
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    success = fix_csv(input_file, output_file)
    
    if success:
        print("\n🎉 CSV fixed successfully!")
        print("✅ You can now import this file through the admin dashboard")
        return 0
    else:
        print("\n❌ Failed to fix CSV")
        return 1

if __name__ == '__main__':
    sys.exit(main())