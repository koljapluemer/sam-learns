import os
import csv

# Get the workspace root directory (3 levels up from this script)
workspace_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))

# Path to the CSV file (absolute path)
csv_path = os.path.join(workspace_root, 'public', 'data', 'learn-flags', 'iso_codes.csv')

# Path to the flags directory (absolute path)
flags_dir = os.path.join(workspace_root, 'public', 'data', 'learn-flags', 'flags')

print(f"Looking for CSV at: {csv_path}")
print(f"Looking for flags in: {flags_dir}")

# Read the CSV file
with open(csv_path, 'r', encoding='utf-8') as csvfile:
    reader = csv.reader(csvfile)
    header = next(reader)  # Skip header
    rows = list(reader)

# Get list of available flag files (excluding special files starting with _)
flag_files = [f.replace('.svg', '') for f in os.listdir(flags_dir) 
              if f.endswith('.svg') and not f.startswith('_')]

# Filter rows to only include countries with flag files
filtered_rows = [row for row in rows if row[1].lower() in flag_files]

# Write the filtered data back to the CSV
with open(csv_path, 'w', encoding='utf-8', newline='') as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow(header)
    writer.writerows(filtered_rows)

print(f"Original count: {len(rows)}")
print(f"Filtered count: {len(filtered_rows)}")
print(f"Removed {len(rows) - len(filtered_rows)} entries without flag files")
