// App.tsx
import React from 'react';
import { ToastContainer } from 'react-toastify';
import AppRoutes from './route/routes';

const App: React.FC = () => {
  return (
    <>
      <AppRoutes />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />
    </>
  );
};

export default App;