import { useState } from 'react'
import { Link } from 'react-router-dom'
import loginHero from '../../../assets/login.png'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // TODO: conectar con el endpoint de login cuando exista en el backend
    console.log({ email, password })
  }

  return (
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden">
        <div className="hidden md:block h-1/3 lg:h-full lg:w-1/2 relative shrink-0">
            <img
                src={loginHero}
                alt="Ilustración de una carretera entre montañas, representando el trayecto de una tornaguía"
                className="w-full h-full object-cover"
            />
        </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-marca-oscuro mb-1">
            Iniciar sesión
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Ingresa tus credenciales para continuar
          </p>

          <form onSubmit={handleSubmit}>
            <label className="block text-sm text-gray-600 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@empresa.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 mb-4 focus:outline-none focus:ring-2 focus:ring-marca-medio"
              required
            />

            <label className="block text-sm text-gray-600 mb-1">
              Contraseña
            </label>
            <div className="relative mb-2">
              <input
                type={mostrarPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-marca-medio"
                required
              />
              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {mostrarPassword ? 'Ocultar' : 'Ver'}
              </button>
            </div>

            <div className="text-right mb-6">
              <Link to="/olvide-password" className="text-sm text-marca-medio">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full bg-marca-oscuro text-white font-semibold py-3 rounded-lg hover:opacity-90 transition"
            >
              Iniciar sesión
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="text-marca-verde font-semibold">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}