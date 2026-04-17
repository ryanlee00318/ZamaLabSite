import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import HowToStakeZama from './pages/HowToStakeZama'
import './index.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/blog/how-to-stake-zama" element={<HowToStakeZama />} />
      </Routes>
    </Router>
  )
}

export default App