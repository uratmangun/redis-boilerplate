import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from 'react-router-dom'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ThemeToggle } from '@/components/ThemeToggle'
import { AISearchPage } from '@/components/AISearchPage'
import { HomePage } from '@/components/HomePage'

function AISearchPageWrapper() {
  const navigate = useNavigate()
  const handleBack = () => navigate('/')

  return <AISearchPage onBack={handleBack} />
}

function App() {
  return (
    <Router>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <ThemeToggle />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/aisearchpage" element={<AISearchPageWrapper />} />
        </Routes>
      </ThemeProvider>
    </Router>
  )
}

export default App
