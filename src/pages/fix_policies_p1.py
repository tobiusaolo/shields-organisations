import re

path = '/Users/user/Documents/PHOSAI_GALLEY/Insurance/frontend/src/pages/Policies.jsx'
with open(path) as f:
    src = f.read()

# 1. Add Tabs/Tab to MUI import
src = src.replace(
    "  List,\n  ListItem,\n  ListItemIcon,\n  ListItemText,\n} from '@mui/material'",
    "  List,\n  ListItem,\n  ListItemIcon,\n  ListItemText,\n  Tabs,\n  Tab,\n  LinearProgress,\n  Accordion,\n  AccordionSummary,\n  AccordionDetails,\n  Stepper,\n  Step,\n  StepLabel,\n} from '@mui/material'"
)

# 2. Add formAPI import
src = src.replace(
    "import { policyAPI, promotionAPI } from '../services/api'",
    "import { policyAPI, promotionAPI, formAPI, productAPI } from '../services/api'"
)

# 3. Add ExpandMore icon
src = src.replace(
    "  Close as CloseIcon,\n} from '@mui/icons-material'",
    "  Close as CloseIcon,\n  ExpandMore as ExpandMoreIcon,\n  Person as PersonIcon,\n  Assignment as FormIcon2,\n  QuestionAnswer as QAIcon,\n  Payment as PaymentIcon,\n} from '@mui/icons-material'"
)

# 4. Add detailsTab state after detailsOpen state
src = src.replace(
    "  const [detailsOpen, setDetailsOpen] = useState(false)\n  const [selectedPolicy, setSelectedPolicy] = useState(null)",
    "  const [detailsOpen, setDetailsOpen] = useState(false)\n  const [selectedPolicy, setSelectedPolicy] = useState(null)\n  const [detailsTab, setDetailsTab] = useState(0)"
)

# 5. Add template forms query after createQuestionMutation
template_forms_query = """
  const { data: templateForms = [] } = useQuery({
    queryKey: ['template-forms', selectedPolicy?.product_template_id],
    queryFn: async () => {
      if (!selectedPolicy?.product_template_id) return []
      const res = await formAPI.getTemplateForms(user.organization_id, selectedPolicy.product_template_id)
      return res.data || []
    },
    enabled: !!selectedPolicy?.product_template_id && detailsOpen
  })

"""
src = src.replace(
    "  const { data: customers } = useQuery({",
    template_forms_query + "  const { data: customers } = useQuery({"
)

with open(path, 'w') as f:
    f.write(src)
print("Phase 1 done")
