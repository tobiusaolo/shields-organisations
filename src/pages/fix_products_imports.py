import os

path = '/Users/user/Documents/PHOSAI_GALLEY/Insurance/frontend/src/pages/Products.jsx'
with open(path, 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if line.strip() == 'Functions as FormulaIcon,':
        new_lines.append(line)
        new_lines.append("  EmojiEvents as BronzeIcon,\n")
        new_lines.append("  TableChart as TableIcon,\n")
        new_lines.append("  ViewHeadline as SectionIcon,\n")
        new_lines.append("  Info as InfoIcon,\n")
        new_lines.append("  CheckCircleOutline as CheckIcon,\n")
        new_lines.append("  ContentCopy as DuplicateIcon,\n")
        new_lines.append("} from '@mui/icons-material'\n")
        skip = True
        continue
    
    if skip:
        if line.strip() == 'const CATEGORIES = [':
            skip = False
            new_lines.append(line)
        continue
    
    new_lines.append(line)

with open(path, 'w') as f:
    f.writelines(new_lines)

print("Products.jsx imports fixed")
