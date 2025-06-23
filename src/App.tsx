import React from 'react';
import { ToastContainer } from 'react-toastify';
import AppRoutes from './route/routes';
import { GoogleOAuthProvider } from '@react-oauth/google';

const App: React.FC = () => {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
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
    </GoogleOAuthProvider>
  );
};

export default App;