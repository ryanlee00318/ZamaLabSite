import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import HowToStakeZama from './pages/HowToStakeZama'
import ChatManage from './pages/ChatManage'
import './index.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/blog/how-to-stake-zama" element={<HowToStakeZama />} />
        <Route path="/chat-manage" element={<ChatManage />} />
      </Routes>
    </Router>
  )
}

export default App