import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './features/home/Home';
import Portfolio from './features/portfolio/Portfolio';
import News from './features/news/News';
import Disruptors from './features/disruptors/Disruptors';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/news" element={<News />} />
          <Route path="/disruptors" element={<Disruptors />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
