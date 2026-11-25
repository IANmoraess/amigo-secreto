import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Admin from './pages/Admin.jsx';
import Home from './pages/Home.jsx';
import Reveal from './pages/Reveal.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/sorteio" element={<Reveal />} />
        <Route path="/sorteio/:token" element={<Reveal />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
