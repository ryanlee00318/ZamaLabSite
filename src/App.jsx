import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Home from './site/pages/Home'
import HowToStakeZama from './site/pages/HowToStakeZama'
import ChatManage from './site/pages/ChatManage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/blog/how-to-stake-zama" element={<HowToStakeZama />} />
        <Route path="/chat-manage" element={<ChatManage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
