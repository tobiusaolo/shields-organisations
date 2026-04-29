path = '/Users/user/Documents/PHOSAI_GALLEY/Insurance/frontend/src/pages/Policies.jsx'
with open(path, 'r') as f:
    lines = f.readlines()

new_lines = []
skip_empty = False
for i, line in enumerate(lines):
    if '// Policy Details & Q&A State' in line:
        new_lines.append(line)
        new_lines.append('  const [detailsOpen, setDetailsOpen] = useState(false)\n')
        new_lines.append('  const [selectedPolicy, setSelectedPolicy] = useState(null)\n')
        new_lines.append('  const [detailsTab, setDetailsTab] = useState(0)\n')
        new_lines.append('  const [newQuestion, setNewQuestion] = useState(\'\')\n')
        # Skip the next few lines until answerInputs
        skip_empty = True
        continue
    
    if skip_empty:
        if 'const [answerInputs' in line:
            skip_empty = False
            new_lines.append(line)
        continue
    
    new_lines.append(line)

with open(path, 'w') as f:
    f.writelines(new_lines)

print("Policies.jsx state fixed")
