import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { register } from '../api/authApi'
import loginHero from '../../../assets/newFondo.png'
import logo from '../../../assets/Logo.png'

const PREGUNTAS_SEGURIDAD = [
  '¿Cuál es el nombre de tu primera mascota?',
  '¿En qué ciudad naciste?',
  '¿Cuál es tu comida favorita?',
  '¿Cuál es el nombre de tu mejor amigo de la infancia?',
]

export function RegisterPage() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  const [preguntaSeguridad, setPreguntaSeguridad] = useState(PREGUNTAS_SEGURIDAD[0])
  const [respuestaSeguridad, setRespuestaSeguridad] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [errorPasswords, setErrorPasswords] = useState(false)
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: register,
    onSuccess: () => {
      navigate('/')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (password !== confirmarPassword) {
      setErrorPasswords(true)
      return
    }

    setErrorPasswords(false)
    mutation.mutate({ nombre, email, password, preguntaSeguridad, respuestaSeguridad })
  }

  const mensajeError = errorPasswords
    ? 'Las contraseñas no coinciden.'
    : isAxiosError(mutation.error) && mutation.error.response?.status === 409
      ? 'Ya existe una cuenta registrada con ese correo.'
      : mutation.isError
        ? 'No fue posible completar el registro. Intenta de nuevo.'
        : null

  return (
    <div className="h-dvh w-full flex overflow-hidden">
      <div className="relative min-w-0 flex-1 overflow-hidden">
        <img
          src={loginHero}
          alt="Ilustración de una carretera entre montañas, representando el trayecto de una tornaguía"
          className="absolute inset-0 h-full w-full object-cover object-left"
        />
        <img
          src={logo}
          alt="Tornaguía Asistente"
          className="absolute left-1/2 top-[calc(25%+60px)] w-[37.3%] min-w-[136px] max-w-[328px] -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)]"
        />
      </div>

      <div className="relative h-full w-full sm:w-[clamp(380px,35%,560px)] shrink-0 overflow-hidden bg-gradient-to-br from-sky-100 via-white to-emerald-50 shadow-xl">
        <div className="pointer-events-none absolute -top-20 -right-16 h-72 w-72 rounded-full bg-marca-medio/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-marca-verde/30 blur-3xl" />

        <div className="relative h-full overflow-y-auto bg-white/25 backdrop-blur-md">
        <div className="h-full flex flex-col sm:items-center sm:justify-center">
          <div className="sm:hidden flex-1 min-h-0 flex items-center justify-center px-6">
            <img
              src={logo}
              alt="Tornaguía Asistente"
              className="w-[191.5px] max-w-[46.7%] translate-y-[60px]"
            />
          </div>
          <div className="flex-none flex items-center justify-center w-full p-6 sm:p-8">
          <div className="w-full max-w-md">
            <h1 className="text-2xl font-bold text-marca-oscuro mb-1 text-center">
              Crear cuenta
            </h1>
            <p className="text-sm text-gray-700 mb-8 text-center">
              Regístrate para empezar a generar tornaguías
            </p>

            <form onSubmit={handleSubmit}>
              <label className="block text-sm text-gray-700 mb-1">
                Nombre completo
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                className="w-full bg-white/60 border border-gray-200 rounded-lg px-3 py-2.5 mb-4 focus:outline-none focus:ring-2 focus:ring-marca-medio"
                required
              />

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
              <div className="relative mb-4">
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Crea una contraseña"
                  className="w-full bg-white/60 border border-gray-200 rounded-lg px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-marca-medio"
                  minLength={8}
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

              <label className="block text-sm text-gray-700 mb-1">
                Confirmar contraseña
              </label>
              <input
                type={mostrarPassword ? 'text' : 'password'}
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                className="w-full bg-white/60 border border-gray-200 rounded-lg px-3 py-2.5 mb-2 focus:outline-none focus:ring-2 focus:ring-marca-medio"
                minLength={8}
                required
              />

              <label className="block text-sm text-gray-700 mb-1">
                Pregunta de seguridad
              </label>
              <select
                value={preguntaSeguridad}
                onChange={(e) => setPreguntaSeguridad(e.target.value)}
                className="w-full bg-white/60 border border-gray-200 rounded-lg px-3 py-2.5 mb-4 focus:outline-none focus:ring-2 focus:ring-marca-medio"
                required
              >
                {PREGUNTAS_SEGURIDAD.map((pregunta) => (
                  <option key={pregunta} value={pregunta}>
                    {pregunta}
                  </option>
                ))}
              </select>

              <label className="block text-sm text-gray-700 mb-1">
                Respuesta de seguridad
              </label>
              <p className="text-xs text-gray-600 mb-1">
                La usarás para recuperar tu contraseña si la olvidas.
              </p>
              <input
                type="text"
                value={respuestaSeguridad}
                onChange={(e) => setRespuestaSeguridad(e.target.value)}
                placeholder="Tu respuesta"
                className="w-full bg-white/60 border border-gray-200 rounded-lg px-3 py-2.5 mb-2 focus:outline-none focus:ring-2 focus:ring-marca-medio"
                required
              />

              {mensajeError && (
                <p className="text-sm text-red-600 mt-2 mb-4">{mensajeError}</p>
              )}

              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full bg-marca-oscuro text-white font-semibold py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50 mt-4"
              >
                {mutation.isPending ? 'Creando cuenta...' : 'Crear cuenta'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-700 drop-shadow-[0_1px_3px_rgba(255,255,255,0.95)] mt-6">
              ¿Ya tienes cuenta?{' '}
              <Link to="/" className="text-marca-oscuro font-semibold">
                Inicia sesión
              </Link>
            </p>
          </div>
          </div>
          <div className="sm:hidden flex-1 min-h-0" />
        </div>
        </div>
      </div>
    </div>
  )
}
