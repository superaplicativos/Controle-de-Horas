import { Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div className="min-h-screen">
      <Outlet />
    </div>
  );
}
