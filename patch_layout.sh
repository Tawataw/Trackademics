sed -i "/{ to: '\/settings', label: 'Settings', icon: Settings },/a \    ...(isAdmin ? [{ to: '/admin', label: 'Admin Panel', icon: ShieldAlert }] : [])," src/layouts/DashboardLayout.tsx
sed -i "s/import { Outlet, NavLink } from 'react-router-dom';/import { Outlet, NavLink } from 'react-router-dom';\nimport { ShieldAlert } from 'lucide-react';/" src/layouts/DashboardLayout.tsx
