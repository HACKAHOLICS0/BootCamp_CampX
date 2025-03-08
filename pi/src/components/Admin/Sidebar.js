import React from 'react';
import { Link } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Category as CategoryIcon,
  ViewModule as ModuleIcon,
  Book as CourseIcon,
  QuestionAnswer as QuizIcon,
  People as UsersIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Analytics as AnalyticsIcon,
  Store as ProductsIcon,
} from '@mui/icons-material';

const drawerWidth = 240;

const Sidebar = () => {
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin' },
    { text: 'Users', icon: <UsersIcon />, path: '/admin/users' },
    { text: 'Categories', icon: <CategoryIcon />, path: '/admin/categories' },
    { text: 'Modules', icon: <ModuleIcon />, path: '/admin/modules' },
    { text: 'Courses', icon: <CourseIcon />, path: '/admin/courses' },
    { text: 'Quizzes', icon: <QuizIcon />, path: '/admin/quizs' },
    { text: 'Products', icon: <ProductsIcon />, path: '/admin/products' },
    { text: 'Analytics', icon: <AnalyticsIcon />, path: '/admin/analytics' },
    { text: 'Notifications', icon: <NotificationsIcon />, path: '/admin/notifications' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/admin/settings' },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#1a237e',
          color: 'white',
        },
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>
        <Typography variant="h6" component="div" sx={{ color: 'white' }}>
          Admin Dashboard
        </Typography>
      </Box>
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            component={Link}
            to={item.path}
            key={item.text}
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              },
              '& .MuiListItemIcon-root': {
                color: 'white',
              },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;
