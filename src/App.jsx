import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home'
import { ProcedureDetail } from './pages/ProcedureDetail'
import { GroupPage } from './pages/GroupPage'
import { CidSearch } from './pages/CidSearch'
import { AnamnesePage } from './pages/AnamnesePage'
import { FavoritosPage } from './pages/FavoritosPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/grupo/:co" element={<GroupPage />} />
        <Route path="/procedimento/:codigo" element={<ProcedureDetail />} />
        <Route path="/cid" element={<CidSearch />} />
        <Route path="/anamnese" element={<AnamnesePage />} />
        <Route path="/favoritos" element={<FavoritosPage />} />
      </Routes>
    </BrowserRouter>
  )
}
