import os
import re

path = '/Users/user/Documents/PHOSAI_GALLEY/Insurance/frontend/src/pages/Products.jsx'
with open(path, 'r') as f:
    content = f.read()

# I'll rearrange the blocks in the clean_table_editor I just created.
# Current order: Min/Max -> Columns -> Prefill
# Target order: Columns -> Min/Max -> Prefill

# Let's find the case 3 content again.
case3_start = "case 3: {"
case3_end = "case 4:"

start_idx = content.find(case3_start)
end_idx = content.find(case3_end)

if start_idx != -1 and end_idx != -1:
    case3_content = content[start_idx:end_idx]
    
    # Extract the parts
    # Min/Max block
    min_max_pattern = r'(\<Box sx\=\{\{ display:\'flex\', gap:2, mb:2 \}\}\>.*?Min Rows.*?Max Rows.*?\<\/Box\>)'
    min_max_match = re.search(min_max_pattern, case3_content, flags=re.DOTALL)
    
    # Columns block
    columns_pattern = r'(\<Box sx\=\{\{ mb: 2 \}\}\>.*?TABLE COLUMNS.*?\<\/Box\>)'
    columns_match = re.search(columns_pattern, case3_content, flags=re.DOTALL)
    
    # Prefill block
    prefill_pattern = r'(\<Box sx\=\{\{ mt: 2 \}\}\>.*?PREFILL ROWS.*?\<\/Box\>)'
    prefill_match = re.search(prefill_pattern, case3_content, flags=re.DOTALL)
    
    if min_max_match and columns_match and prefill_match:
        min_max_block = min_max_match.group(1)
        columns_block = columns_match.group(1)
        prefill_block = prefill_match.group(1)
        
        # New order
        new_blocks = f"{columns_block}\n\n                            {min_max_block}\n\n                            {prefill_block}"
        
        # Replace the whole sequence
        sequence_pattern = r'\<Box sx\=\{\{ display:\'flex\', gap:2, mb:2 \}\}\>.*?PREFILL ROWS.*?\<\/Box\>'
        new_case3_content = re.sub(sequence_pattern, new_blocks, case3_content, flags=re.DOTALL)
        
        content = content[:start_idx] + new_case3_content + content[end_idx:]

with open(path, 'w') as f:
    f.write(content)

print("Table Editor Reordered: Columns -> Min/Max -> Prefill")
