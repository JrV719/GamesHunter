import Link from "next/link";
import { redirect } from "next/navigation";
import { registerUser, createSession, getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/auth/LoginForm";
import { headers } from "next/headers";

export const metadata = {
  title: "Crear cuenta",
  robots: { index: false },
};

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/perfil");

  return (
    <div className="gh-container flex min-h-[70dvh] items-center justify-center py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-black tracking-tight text-base-100">Crear cuenta</h1>
          <p className="mt-1.5 text-sm text-base-400">
            Guarda favoritos, sigue tu biblioteca y registra tus platinos. Sin anuncios ni correo
            obligatorio.
          </p>
        </div>

        <LoginForm
          mode="register"
          action={async (formData: FormData) => {
            "use server";
            const email = String(formData.get("email") ?? "").trim();
            const username = String(formData.get("username") ?? "").trim();
            const password = String(formData.get("password") ?? "");
            const displayName = String(formData.get("displayName") ?? "").trim();

            if (password.length < 8) {
              redirect(
                "/registro?error=" +
                  encodeURIComponent("La contraseña debe tener al menos 8 caracteres."),
              );
            }

            // Ojo: redirect() lanza una excepcion especial, asi que nunca debe
            // ejecutarse dentro de un try/catch.
            let createdId: string | null = null;
            let errorMessage: string | null = null;
            try {
              const created = await registerUser({ email, username, password, displayName });
              createdId = created!.id;
            } catch (e) {
              errorMessage = (e as Error).message;
            }
            if (errorMessage) {
              redirect("/registro?error=" + encodeURIComponent(errorMessage));
            }

            const h = await headers();
            await createSession(createdId!, { userAgent: h.get("user-agent") ?? undefined });
            redirect("/perfil?bienvenida=1");
          }}
        />

        <p className="mt-5 text-center text-[13px] text-base-400">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="gh-link font-semibold">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
