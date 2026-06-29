import { Outlet } from 'react-router-dom';
import { ToastProvider } from './Toast';

// The persistent phone frame (#app). Every screen renders into it via <Outlet/>;
// the toast lives here so it pins to the bottom of the frame.
export default function RootLayout() {
  return (
    <div id="app">
      <ToastProvider>
        <Outlet />
      </ToastProvider>
    </div>
  );
}
