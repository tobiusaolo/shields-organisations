import os

path = '/Users/user/Documents/PHOSAI_GALLEY/Insurance/frontend/src/pages/Products.jsx'
with open(path, 'r') as f:
    content = f.read()

# 1. Fix the mutation to save prefill_rows
old_mutation_map = """            order: idx,
            columns: f.columns,
            min_rows: f.min_rows,
            max_rows: f.max_rows
          }))"""

new_mutation_map = """            order: idx,
            columns: f.columns,
            min_rows: f.min_rows,
            max_rows: f.max_rows,
            prefill_rows: f.prefill_rows
          }))"""

content = content.replace(old_mutation_map, new_mutation_map)

# 2. Fix the Inspector to handle field.type and field.field_type consistently
# Actually, the inspector code I saw:
# 1128: if (field.field_type === 'section')
# 1131: if (field.field_type === 'table')
# 1158: <Chip label={field.field_type} ... />

# Since the mutation saves f.type as field_type (line 311), the inspector should work
# IF the backend returns field_type.

# Let's check the prefill_rows rendering in the inspector (line 1141)
# 1141: row[col.key || col.label?.toLowerCase().replace(/\s+/g,'_')]

# I should make sure prefill_rows are actually being rendered in the review step too.

# 3. Add full form preview to the Review step
old_review_forms = "{ title:'Compliance Forms', color:'#9C27B0', items: formData.dynamicForms.length ? formData.dynamicForms.map(f=>({label:f.name||'Unnamed Form', value:`${f.fields.length} fields · ${f.is_required?'Required':'Optional'}`})) : [{label:'', value:'No forms added'}]},"

# I'll replace the review rendering logic to show a more detailed breakdown or even the actual forms.
# But for now, let's just make the summary more detailed.

# Actually, I'll add a new section in the Review step to show the form details.

with open(path, 'w') as f:
    f.write(content)

print("Mutation fixed for prefill_rows")
