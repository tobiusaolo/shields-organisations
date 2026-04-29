import os
import re

path = '/Users/user/Documents/PHOSAI_GALLEY/Insurance/frontend/src/pages/Products.jsx'
with open(path, 'r') as f:
    content = f.read()

# I'll rearrange the blocks in the clean_table_editor I just created.
# Current order: Min/Max -> Columns -> Prefill
# Target order: Columns -> Min/Max -> Prefill

case3_start = "case 3: {"
case3_end = "case 4:"

start_idx = content.find(case3_start)
end_idx = content.find(case3_end)

if start_idx != -1 and end_idx != -1:
    case3_content = content[start_idx:end_idx]
    
    # Extract the parts
    min_max_pattern = r'(\<Box sx\=\{\{ display:\'flex\', gap:2, mb:2 \}\}\>.*?Min Rows.*?Max Rows.*?\<\/Box\>)'
    min_max_match = re.search(min_max_pattern, case3_content, flags=re.DOTALL)
    
    columns_pattern = r'(\<Box sx\=\{\{ mb: 2 \}\}\>.*?TABLE COLUMNS.*?\<\/Box\>)'
    columns_match = re.search(columns_pattern, case3_content, flags=re.DOTALL)
    
    prefill_pattern = r'(\<Box sx\=\{\{ mt: 2 \}\}\>.*?PREFILL ROWS.*?\<\/Box\>)'
    prefill_match = re.search(prefill_pattern, case3_content, flags=re.DOTALL)
    
    if min_max_match and columns_match and prefill_match:
        min_max_block = min_max_match.group(1)
        columns_block = columns_match.group(1)
        prefill_block = prefill_match.group(1)
        
        # Identify the WHOLE block to replace
        # It starts with min_max and ends with prefill
        
        # We'll build the new block
        new_blocks = f"{columns_block}\n\n                            {min_max_block}\n\n                            {prefill_block}"
        
        # Find the start of min_max and end of prefill in case3_content
        seq_start = case3_content.find(min_max_block)
        seq_end = case3_content.find(prefill_block) + len(prefill_block)
        
        if seq_start != -1 and seq_end != -1:
            new_case3_content = case3_content[:seq_start] + new_blocks + case3_content[seq_end:]
            content = content[:start_idx] + new_case3_content + content[end_idx:]

with open(path, 'w') as f:
    f.write(content)

print("Table Editor Reordered (Non-regex replacement)")
