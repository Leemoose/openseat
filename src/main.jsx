import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import './styles.css'
import App from './App.jsx'
import Home from './pages/Home.jsx'
import Hobby from './pages/Hobby.jsx'
import Session from './pages/Session.jsx'
import OpenSeats from './pages/OpenSeats.jsx'
import Profile from './pages/Profile.jsx'
import Pricing from './pages/Pricing.jsx'
import About from './pages/About.jsx'

// Hash routing so deep links never 404 on GitHub Pages.
const router = createHashRouter([
  {
    path: '/', element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'h/:hobby', element: <Hobby /> },
      { path: 's/:id', element: <Session /> },
      { path: 'open', element: <OpenSeats /> },
      { path: 'me', element: <Profile /> },
      { path: 'pricing', element: <Pricing /> },
      { path: 'about', element: <About /> },
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
