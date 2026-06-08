import { createTheme } from '@mui/material/styles';
import { zhCN } from '@mui/material/locale';

export const theme = createTheme(
  {
    palette: {
      mode: 'light',
      primary: {
        main: '#2458c6',
        dark: '#1b449c',
        light: '#edf3ff',
      },
      background: {
        default: '#f5f7fb',
        paper: '#ffffff',
      },
      text: {
        primary: '#1d2433',
        secondary: '#66738a',
      },
      divider: '#dfe4ee',
    },
    shape: {
      borderRadius: 8,
    },
    typography: {
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      button: {
        textTransform: 'none',
        fontWeight: 700,
      },
    },
    components: {
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderColor: '#dfe4ee',
            boxShadow: '0 1px 2px rgba(30, 43, 68, 0.04)',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            backgroundColor: '#f8fafd',
            color: '#5f6b7d',
            fontSize: 12,
            fontWeight: 700,
          },
          body: {
            color: '#263248',
            fontSize: 13,
          },
        },
      },
    },
  },
  zhCN
);
