import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import HowToMintZama from './pages/HowToMintZama'
import './index.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/blog/how-to-mint-zama" element={<HowToMintZama />} />
      </Routes>
    </Router>
  )
}

export default App