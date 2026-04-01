import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Login } from './pages/login'
import { NotFound } from './pages/NotFound'
import Dashbord from './pages/dashbord'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/Dashbord" element={<Dashbord />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
