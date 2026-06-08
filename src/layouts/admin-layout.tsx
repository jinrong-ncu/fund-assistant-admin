import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import {
  Activity,
  BookOpen,
  FileClock,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Star,
  Users,
} from 'lucide-react';
import {
  AppBar,
  Avatar,
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { useAuth } from '../lib/auth';

const drawerWidth = 256;

const navItems = [
  { to: '/dashboard', label: '概览', icon: LayoutDashboard },
  { to: '/users', label: '用户', icon: Users },
  { to: '/feedback', label: '反馈', icon: MessageSquare },
  { to: '/funds', label: '热门基金', icon: Star },
  { to: '/changelogs', label: '更新日志', icon: BookOpen },
  { to: '/configs', label: '系统配置', icon: Settings },
  { to: '/audit', label: '审计', icon: FileClock },
] as const;

const pathMap: Record<string, string> = {
  '/dashboard': '概览',
  '/users': '用户管理',
  '/feedback': '反馈管理',
  '/funds': '热门基金',
  '/changelogs': '更新日志',
  '/configs': '系统配置',
  '/audit': '操作审计',
};

export function AdminLayout() {
  const { admin, logout } = useAuth();
  const routerState = useRouterState();
  const navigate = useNavigate();

  const currentPath = routerState.location.pathname;
  const matchedKey = Object.keys(pathMap).find((key) => currentPath.startsWith(key)) || '';
  const title = pathMap[matchedKey] || '概览';

  async function handleLogout() {
    try {
      await logout();
      navigate({ to: '/login' });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: '#172033',
            color: '#dce5f5',
            borderRight: 0,
            p: 2,
          },
        }}
      >
        <Box sx={{ height: 52, px: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: 'rgba(237, 243, 255, 0.12)',
              color: '#edf3ff',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Activity size={24} />
          </Box>
          <Box>
            <Typography variant="subtitle1" color="#ffffff" sx={{ fontWeight: 800, lineHeight: 1.15 }}>
              估值助手后台
            </Typography>
            <Typography variant="caption" color="#8fa2c2">
              Fund Assistant Admin
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.09)' }} />

        <List disablePadding sx={{ display: 'grid', gap: 0.75 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const selected = currentPath.startsWith(item.to);
            return (
              <ListItemButton
                key={item.to}
                component={Link}
                to={item.to}
                selected={selected}
                sx={{
                  minHeight: 46,
                  borderRadius: 2,
                  color: selected ? '#ffffff' : '#b8c3d8',
                  textDecoration: 'none',
                  '&.Mui-selected': {
                    bgcolor: '#26344f',
                    color: '#ffffff',
                  },
                  '&.Mui-selected:hover, &:hover': {
                    bgcolor: '#26344f',
                    color: '#ffffff',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 38, color: 'inherit' }}>
                  <Icon size={21} />
                </ListItemIcon>
                <Typography sx={{ fontSize: 15, fontWeight: selected ? 800 : 650 }}>
                  {item.label}
                </Typography>
              </ListItemButton>
            );
          })}
        </List>
      </Drawer>

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <AppBar
          position="sticky"
          color="inherit"
          elevation={0}
          sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#ffffff' }}
        >
          <Toolbar sx={{ minHeight: '58px !important', px: 3, justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                后台
              </Typography>
              <Typography variant="body2" color="#c7cfdd">
                /
              </Typography>
              <Typography variant="body2" color="text.primary" sx={{ fontWeight: 800 }}>
                {title}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {admin && (
                <>
                  <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.light', color: 'primary.main', fontSize: 13 }}>
                    {admin.email.slice(0, 1).toUpperCase()}
                  </Avatar>
                  <Typography variant="body2" color="text.primary" sx={{ fontWeight: 700 }}>
                    {admin.email}
                  </Typography>
                  <Chip label={admin.role} size="small" color="primary" variant="outlined" sx={{ fontWeight: 800 }} />
                </>
              )}
              <Tooltip title="退出登录">
                <IconButton
                  onClick={handleLogout}
                  size="medium"
                  sx={{ border: '1px solid', borderColor: '#d4dbea', borderRadius: 2 }}
                  aria-label="退出登录"
                >
                  <LogOut size={18} />
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flex: 1, minWidth: 0, p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
