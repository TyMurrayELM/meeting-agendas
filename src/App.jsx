import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import BranchManagerMeeting from './components/BranchManagerMeeting'

function App() {
  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <BranchManagerMeeting />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  )
}

export default App