import { createBrowserRouter  } from 'react-router-dom'
import { LoginPage } from './features/auth/pages/LoginPage'
import { RegisterPage } from './features/auth/pages/RegisterPage'
import { ForgotPasswordPage } from './features/auth/pages/ForgotPasswordPage'
import { InicioPage } from './features/inicio/pages/InicioPage'
import { NuevaSolicitudPage } from './features/solicitudes/pages/NuevaSolicitudPage'
import { HistorialPage } from './features/solicitudes/pages/HistorialPage'
import { LotesPage } from './features/inventario/pages/LotesPage'
import { RutaProtegida } from './shared/components/RutaProtegida'

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
        element: <RutaProtegida />,
        children: [
            {
                path: '/inicio',
                element: <InicioPage />,
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
        ],
    },
])