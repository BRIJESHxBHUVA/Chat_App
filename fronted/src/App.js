import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import Dashboard from './Pages/Dashboard/Dashboard';
import Login from './Pages/Login/Login';
import ProtectedRoute from './ProtectedRoute';

function App() {
  return (
    <div className='App'>
      <Router>
        <Routes>
          <Route path='/' element={<ProtectedRoute requireAuth={false}> <Login /> </ProtectedRoute>} />
          <Route path='/dashboard' element={<ProtectedRoute requireAuth={true}> <Dashboard /> </ProtectedRoute>} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
