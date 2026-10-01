import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter, Navigate, RouterProvider, useParams } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import './styles.css'
import App from './App.jsx'
import Home from './pages/Home.jsx'
import Hobby from './pages/Hobby.jsx'
import Session from './pages/Session.jsx'
import About from './pages/About.jsx'
import Place from './pages/Place.jsx'

function HobbyRoute() {
  const { hobby } = useParams()
  return <Hobby key={hobby} />
}

// Hash routing so deep links never 404 on GitHub Pages.
const router = createHashRouter([
  {
    path: '/', element: <App />,
    children: [
      { index: true, element: <Home /> },
      // keyed on the hobby so filters and the chosen view reset between hobbies
      // instead of leaking across (golf's Places tab landing you on pottery).
      { path: 'h/:hobby', element: <HobbyRoute /> },
      { path: 's/:id', element: <Session /> },
      { path: 'p/:id', element: <Place /> },
      { path: 'about', element: <About /> },
      // Old links (shared posts, bookmarks) to pages cut for the MVP land on
      // the home page instead of a blank screen.
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
