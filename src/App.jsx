import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home'
import { ProcedureDetail } from './pages/ProcedureDetail'
import { GroupPage } from './pages/GroupPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/grupo/:co" element={<GroupPage />} />
        <Route path="/procedimento/:codigo" element={<ProcedureDetail />} />
      </Routes>
    </BrowserRouter>
  )
}
