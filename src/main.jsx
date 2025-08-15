import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import AuthContext from './context/AuthContext.jsx'
import UserContext from './context/UserContext.jsx'


createRoot(document.getElementById('root')).render(
    <div style={{ minHeight: '100vh', width: '100vw', overflowY: 'scroll', scrollbarGutter: 'stable' }}>
        <BrowserRouter>
            <AuthContext>
                <UserContext>
                    <App />
                </UserContext>
            </AuthContext>
        </BrowserRouter>
    </div>
)
