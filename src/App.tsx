import React from 'react';
import { ToastContainer, Slide  } from 'react-toastify';
import AppRoutes from './route/routes';
import { GoogleOAuthProvider } from '@react-oauth/google';
import 'react-toastify/dist/ReactToastify.css';

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
          transition={Slide}
          className="mt-12" 
          toastClassName="rounded-xl shadow-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 font-semibold"
          progressClassName="bg-white opacity-80"
        />
      </>
    </GoogleOAuthProvider>
  );
};

export default App;