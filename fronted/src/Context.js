import React, { createContext, useState } from 'react'
import { useAllUserData } from './redux/reducers/userDataReducer';
import { SuccessSvgIcon, ErrorSvgIcon } from './Utils/SVG';

export const AppContext = createContext()

const Context = ({ children }) => {

  const allUsersData = useAllUserData();

  const [loginForm, setLoginForm] = useState(false);
  const [allUsersList, setAllUsersList] = useState(allUsersData);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  return (
    <AppContext.Provider value={{ loginForm, setLoginForm, allUsersList, setAllUsersList, showToast }}>
      {children}
      {toast.show && (
        <div className={`custom_toast ${toast.type}`}>
          <div className="toast_content">
            {toast.type === 'success' ? <SuccessSvgIcon /> : <ErrorSvgIcon />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </AppContext.Provider>
  )
}

export default Context