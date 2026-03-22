"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

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
    <>
      {/* Form centered */}
      <div className="flex flex-1 items-center justify-center px-8">
        <form className="modern-form" onSubmit={handleSubmit}>
          <h2 className="form-title">Bienvenido!</h2>
          <p className="form-subtitle">Ingresa a tu cuenta de Digital Products Dashboard</p>

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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
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

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="submit-button" disabled={loading}>
            <span className="button-glow" />
            {loading ? "Ingresando..." : "Ingresar"}
          </button>

          <div className="form-footer">
            <Link href="/signup" className="login-link">
              No tenes cuenta? <span>Crear cuenta</span>
            </Link>
          </div>

          <p className="form-legal">
            Al iniciar sesion, aceptas nuestros Terminos de Servicio y Politica de Privacidad.
          </p>
        </form>
      </div>
    </>
  );
}
