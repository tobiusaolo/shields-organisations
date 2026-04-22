import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1A73E8',       // Google Blue
      light: '#4A90F7',
      dark: '#1557B0',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#0D47A1',
      light: '#1565C0',
      dark: '#082F6F',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#1E8E3E',
      light: '#34A853',
      dark: '#137333',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#E37400',
      light: '#F9AB00',
      dark: '#B06000',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#D93025',
      light: '#EA4335',
      dark: '#A50E0E',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#1A73E8',
      light: '#4A90F7',
      dark: '#1557B0',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F8F9FE',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#202124',
      secondary: '#5F6368',
      disabled: '#9AA0A6',
    },
    divider: '#E8EAED',
    action: {
      hover: 'rgba(26, 115, 232, 0.06)',
      selected: 'rgba(26, 115, 232, 0.12)',
      focus: 'rgba(26, 115, 232, 0.12)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Google Sans", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.025em' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700, letterSpacing: '-0.015em' },
    h4: { fontWeight: 600, letterSpacing: '-0.01em' },
    h5: { fontWeight: 600, letterSpacing: '-0.005em' },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 500 },
    body1: { lineHeight: 1.6 },
    body2: { lineHeight: 1.5 },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.01em' },
    caption: { fontWeight: 400, letterSpacing: '0.02em' },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 1px 2px rgba(0,0,0,0.06), 0px 1px 3px rgba(0,0,0,0.08)',
    '0px 2px 4px rgba(0,0,0,0.06), 0px 2px 6px rgba(0,0,0,0.08)',
    '0px 4px 8px rgba(0,0,0,0.06), 0px 4px 12px rgba(0,0,0,0.08)',
    '0px 8px 16px rgba(0,0,0,0.06), 0px 8px 24px rgba(0,0,0,0.08)',
    '0px 12px 24px rgba(0,0,0,0.08), 0px 12px 32px rgba(0,0,0,0.10)',
    '0px 16px 32px rgba(0,0,0,0.08), 0px 16px 40px rgba(0,0,0,0.10)',
    '0px 20px 40px rgba(0,0,0,0.10), 0px 20px 48px rgba(0,0,0,0.12)',
    '0px 24px 48px rgba(0,0,0,0.10), 0px 24px 56px rgba(0,0,0,0.12)',
    '0px 28px 56px rgba(0,0,0,0.12), 0px 28px 64px rgba(0,0,0,0.14)',
    '0px 32px 64px rgba(0,0,0,0.12), 0px 32px 72px rgba(0,0,0,0.14)',
    '0px 36px 72px rgba(0,0,0,0.14), 0px 36px 80px rgba(0,0,0,0.16)',
    '0px 40px 80px rgba(0,0,0,0.14), 0px 40px 88px rgba(0,0,0,0.16)',
    '0px 44px 88px rgba(0,0,0,0.16), 0px 44px 96px rgba(0,0,0,0.18)',
    '0px 48px 96px rgba(0,0,0,0.16), 0px 48px 104px rgba(0,0,0,0.18)',
    '0px 52px 104px rgba(0,0,0,0.18), 0px 52px 112px rgba(0,0,0,0.20)',
    '0px 56px 112px rgba(0,0,0,0.18), 0px 56px 120px rgba(0,0,0,0.20)',
    '0px 60px 120px rgba(0,0,0,0.20), 0px 60px 128px rgba(0,0,0,0.22)',
    '0px 64px 128px rgba(0,0,0,0.20), 0px 64px 136px rgba(0,0,0,0.22)',
    '0px 68px 136px rgba(0,0,0,0.22), 0px 68px 144px rgba(0,0,0,0.24)',
    '0px 72px 144px rgba(0,0,0,0.22), 0px 72px 152px rgba(0,0,0,0.24)',
    '0px 76px 152px rgba(0,0,0,0.24), 0px 76px 160px rgba(0,0,0,0.26)',
    '0px 80px 160px rgba(0,0,0,0.24), 0px 80px 168px rgba(0,0,0,0.26)',
    '0px 84px 168px rgba(0,0,0,0.26), 0px 84px 176px rgba(0,0,0,0.28)',
    '0px 88px 176px rgba(0,0,0,0.26), 0px 88px 184px rgba(0,0,0,0.28)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 20px',
          fontSize: '0.875rem',
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        contained: {
          '&:hover': { boxShadow: '0px 2px 8px rgba(26,115,232,0.35)' },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': { borderWidth: '1.5px' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid #E8EAED',
          boxShadow: '0px 1px 3px rgba(0,0,0,0.06)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid #E8EAED',
        },
        elevation0: { boxShadow: 'none' },
        elevation1: { boxShadow: '0px 1px 3px rgba(0,0,0,0.06)', border: '1px solid #E8EAED' },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#1A73E8' },
        },
        notchedOutline: { borderColor: '#DADCE0' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500, fontSize: '0.75rem' },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#F8F9FE',
            fontWeight: 600,
            fontSize: '0.75rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: '#5F6368',
            borderBottom: '2px solid #E8EAED',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: 'rgba(26,115,232,0.03)' },
          '&:last-child td': { borderBottom: 'none' },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: '#F1F3F4',
          padding: '14px 16px',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '2px 8px',
          padding: '10px 12px',
          '&.Mui-selected': {
            backgroundColor: 'rgba(26,115,232,0.10)',
            color: '#1A73E8',
            '& .MuiListItemIcon-root': { color: '#1A73E8' },
            '&:hover': { backgroundColor: 'rgba(26,115,232,0.15)' },
          },
          '&:hover': { backgroundColor: 'rgba(26,115,232,0.06)' },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid #E8EAED',
          boxShadow: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: '1px solid #E8EAED',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#202124',
          fontSize: '0.75rem',
          borderRadius: 6,
          fontWeight: 500,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4, height: 6 },
        bar: { borderRadius: 4 },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 10, fontWeight: 500 },
      },
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)
