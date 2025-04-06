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
} from '@mui/icons-material';

const drawerWidth = 240;

const Sidebar = () => {
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin' },
    { text: 'Categories', icon: <CategoryIcon />, path: '/admin/categories' },
    { text: 'Modules', icon: <ModuleIcon />, path: '/admin/modules' },
    { text: 'Courses', icon: <CourseIcon />, path: '/admin/courses' },
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
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" component="div">
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
