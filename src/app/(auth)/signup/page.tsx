"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Eye, EyeOff } from "lucide-react";

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
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-card-form" style={{ width: "100%", textAlign: "center" }}>
          <img src="/logoo.png" alt="Logo" style={{ width: 64, height: 64, margin: "0 auto 16px" }} />
          <h2 className="auth-title">Revisa tu email</h2>
          <p className="auth-subtitle">
            Enviamos un link de confirmacion a <strong>{email}</strong>.
            Hace click en el link para activar tu cuenta.
          </p>
          <div className="auth-actions" style={{ justifyContent: "center", marginTop: 24 }}>
            <button
              type="button"
              className="auth-submit"
              onClick={() => router.push("/login")}
            >
              Volver al login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-card">
      {/* Left side - Branding */}
      <div className="auth-card-brand">
        <img src="/logoo.png" alt="Logo" className="auth-logo" />
        <h1 className="auth-brand-name">WorldWideHustle</h1>
        <p className="auth-brand-sub">Digital Products Dashboard</p>
      </div>

      {/* Right side - Form */}
      <div className="auth-card-form">
        <h2 className="auth-title">Crear cuenta</h2>
        <p className="auth-subtitle">Registrate para comenzar</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="email">Correo electronico</label>
            <input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Contraseña</label>
            <div className="auth-password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Minimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-eye-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="confirmPassword">Confirmar contraseña</label>
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Repetir contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <div className="auth-actions">
            <Link href="/login" className="auth-link">
              Iniciar sesion
            </Link>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Creando..." : "Siguiente"}
            </button>
          </div>
        </form>

        <p className="auth-legal">
          Al registrarte, aceptas nuestros Terminos de Servicio y Politica de
          Privacidad.
        </p>
      </div>
    </div>
  );
}
