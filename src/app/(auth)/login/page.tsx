"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(
        signInError.message === "Invalid login credentials"
          ? "Email o contraseña incorrectos"
          : signInError.message
      );
      setLoading(false);
      return;
    }

    router.push("/panel");
    router.refresh();
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
        <h2 className="auth-title">Inicia sesion</h2>
        <p className="auth-subtitle">Ingresa a tu cuenta</p>

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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
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

          {error && <p className="auth-error">{error}</p>}

          <div className="auth-actions">
            <Link href="/signup" className="auth-link">
              Crear cuenta
            </Link>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Ingresando..." : "Siguiente"}
            </button>
          </div>
        </form>

        <p className="auth-legal">
          Al iniciar sesion, aceptas nuestros Terminos de Servicio y Politica de
          Privacidad.
        </p>
      </div>
    </div>
  );
}
