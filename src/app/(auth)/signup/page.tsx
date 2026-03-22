"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = useMemo(
    () => (isSupabaseConfigured() ? createClient() : null),
    []
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      setError("Supabase no esta configurado.");
      return;
    }
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <>
        <div className="px-8 py-5" />
        <div className="flex flex-1 items-center justify-center px-8">
          <div className="modern-form" style={{ textAlign: "center" }}>
            <h2 className="form-title">Revisa tu email</h2>
            <p className="form-subtitle">
              Enviamos un link de confirmacion a <strong>{email}</strong>.
              Hace click en el link para activar tu cuenta.
            </p>
            <button
              type="button"
              className="submit-button"
              onClick={() => router.push("/login")}
            >
              Volver al login
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5">
        <span className="text-lg font-semibold text-white tracking-wide">digihuss</span>
        <p className="text-sm text-slate-400">
          Ya tenes cuenta?{" "}
          <Link href="/login" className="font-medium text-white hover:underline underline-offset-4">
            Iniciar sesion
          </Link>
        </p>
      </div>

      {/* Form centered */}
      <div className="flex flex-1 items-center justify-center px-8">
        <form className="modern-form" onSubmit={handleSubmit}>
          <h2 className="form-title">Crear Cuenta</h2>
          <p className="form-subtitle">Registrate en Digital Products Dashboard</p>

          <div className="input-group">
            <label htmlFor="email">Email</label>
            <div className="input-wrapper">
              <Mail className="input-icon" />
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <div className="input-wrapper">
              <Lock className="input-icon" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="Minimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="eye-icon" /> : <Eye className="eye-icon" />}
              </button>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">Confirmar Contraseña</label>
            <div className="input-wrapper">
              <Lock className="input-icon" />
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="Repetir contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                style={{ paddingRight: 40 }}
              />
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="submit-button" disabled={loading}>
            <span className="button-glow" />
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>

          <div className="form-footer">
            <Link href="/login" className="login-link">
              Ya tenes cuenta? <span>Iniciar sesion</span>
            </Link>
          </div>

          <p className="form-legal">
            Al registrarte, aceptas nuestros Terminos de Servicio y Politica de Privacidad.
          </p>
        </form>
      </div>
    </>
  );
}
