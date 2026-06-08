import { RouterProvider } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { queryClient } from '../lib/query';
import { AuthProvider, useAuth } from '../lib/auth';
import { router } from '../lib/router';
import { theme } from './theme';

function AppRouter() {
  const auth = useAuth();
  return <RouterProvider router={router} context={{ auth }} />;
}

export function Providers() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
