import { createBrowserRouter  } from 'react-router-dom'
import { LoginPage } from './features/auth/pages/LoginPage'
import { RegisterPage } from './features/auth/pages/RegisterPage'
import { ForgotPasswordPage } from './features/auth/pages/ForgotPasswordPage'
import { NuevaSolicitudPage } from './features/solicitudes/pages/NuevaSolicitudPage'
import { HistorialPage } from './features/solicitudes/pages/HistorialPage'
import { LotesPage } from './features/inventario/pages/LotesPage'

export const router = createBrowserRouter([
    {
        path: '/',
        element: <LoginPage />,
    },
    {
        path: '/registro',
        element: <RegisterPage />,
    },
    {
        path: '/olvide-password',
        element: <ForgotPasswordPage />,
    },
    {
        path: '/solicitudes/nueva',
        element: <NuevaSolicitudPage />,
    },
    {
        path: '/solicitudes/historial',
        element: <HistorialPage />,
    },
    {
        path: '/inventario/lotes',
        element: <LotesPage />,
    },
])