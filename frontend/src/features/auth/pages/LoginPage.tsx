import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../api/authApi'
import loginHero from '../../../assets/Fondo_Login.png'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      localStorage.setItem('token', data.token)
      localStorage.setItem('usuarioId', data.usuarioId.toString())
      localStorage.setItem('nombre', data.nombre)
      navigate('/solicitudes/nueva')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate({ email, password })
  }

  return (
    <div className="h-dvh w-full flex overflow-hidden">
      <div className="relative min-w-0 flex-1 overflow-hidden">
        <img
          src={loginHero}
          alt="Ilustración de una carretera entre montañas, representando el trayecto de una tornaguía"
          className="absolute inset-0 h-full w-full object-cover object-left"
        />
      </div>

      <div className="relative h-full w-full sm:w-[clamp(380px,35%,560px)] shrink-0 overflow-hidden bg-gradient-to-br from-sky-100 via-white to-emerald-50 shadow-xl">
        <div className="pointer-events-none absolute -top-20 -right-16 h-72 w-72 rounded-full bg-marca-medio/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-marca-verde/30 blur-3xl" />

        <div className="relative h-full overflow-y-auto bg-white/25 backdrop-blur-md">
        <div className="min-h-full flex items-center justify-center p-6 sm:p-8">
          <div className="w-full max-w-md">
            <h1 className="text-2xl font-bold text-marca-oscuro mb-1 text-center">
              Iniciar sesión
            </h1>
            <p className="text-sm text-gray-700 mb-8 text-center">
              Ingresa tus credenciales para continuar
            </p>

            <form onSubmit={handleSubmit}>
              <label className="block text-sm text-gray-700 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@empresa.com"
                className="w-full bg-white/60 border border-gray-200 rounded-lg px-3 py-2.5 mb-4 focus:outline-none focus:ring-2 focus:ring-marca-medio"
                required
              />

              <label className="block text-sm text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative mb-2">
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  className="w-full bg-white/60 border border-gray-200 rounded-lg px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-marca-medio"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600"
                >
                  {mostrarPassword ? 'Ocultar' : 'Ver'}
                </button>
              </div>

              {mutation.isError && (
                <p className="text-sm text-red-600 mb-4">
                  Correo o contraseña incorrectos.
                </p>
              )}

              <div className="text-right mb-6">
                <Link
                  to="/olvide-password"
                  className="text-sm font-semibold text-marca-oscuro drop-shadow-[0_1px_3px_rgba(255,255,255,0.95)]"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full bg-marca-oscuro text-white font-semibold py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50"
              >
                {mutation.isPending ? 'Ingresando...' : 'Iniciar sesión'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-700 drop-shadow-[0_1px_3px_rgba(255,255,255,0.95)] mt-6">
              ¿No tienes cuenta?{' '}
              <Link to="/registro" className="text-marca-oscuro font-semibold">
                Regístrate
              </Link>
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}