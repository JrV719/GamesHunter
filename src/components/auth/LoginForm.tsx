"use client";

import { useFormStatus } from "react-dom";
import { IconUser, IconLogout } from "@/components/ui/Icon";

function Submit({ label, pending }: { label: string; pending: boolean }) {
  return (
    <button type="submit" disabled={pending} className="gh-btn gh-btn-primary w-full">
      {pending ? "Un momento..." : label}
    </button>
  );
}

export function LoginForm({
  action,
  mode,
  next,
}: {
  action: (formData: FormData) => Promise<void>;
  mode: "login" | "register";
  next?: string;
}) {
  return (
    <form action={action} className="gh-card space-y-3 p-5">
      {mode === "register" && (
        <div>
          <label htmlFor="displayName" className="gh-label">
            Nombre visible (opcional)
          </label>
          <input id="displayName" name="displayName" className="gh-input" autoComplete="name" />
        </div>
      )}

      <div>
        <label htmlFor={mode === "login" ? "identifier" : "email"} className="gh-label">
          {mode === "login" ? "Correo o usuario" : "Correo"}
        </label>
        <input
          id={mode === "login" ? "identifier" : "email"}
          name={mode === "login" ? "identifier" : "email"}
          type={mode === "login" ? "text" : "email"}
          required
          autoComplete="email"
          className="gh-input"
          placeholder="tu@correo.com"
        />
      </div>

      {mode === "register" && (
        <div>
          <label htmlFor="username" className="gh-label">
            Nombre de usuario
          </label>
          <input
            id="username"
            name="username"
            required
            minLength={3}
            maxLength={24}
            pattern="[A-Za-z0-9_.-]+"
            className="gh-input"
            placeholder="guionista_2024"
            autoComplete="username"
          />
        </div>
      )}

      <div>
        <label htmlFor="password" className="gh-label">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className="gh-input"
          placeholder="Mínimo 8 caracteres"
        />
      </div>

      {next && <input type="hidden" name="siguiente" value={next} />}

      <FormSubmit label={mode === "login" ? "Entrar" : "Crear cuenta"} />
    </form>
  );
}

function FormSubmit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <div className="pt-1">
      <Submit label={label} pending={pending} />
    </div>
  );
}

export { IconUser, IconLogout };
