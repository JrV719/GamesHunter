import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { verifyCredentials, createSession, getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Iniciar sesión",
  robots: { index: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ siguiente?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect("/perfil");

  return (
    <div className="gh-container flex min-h-[70dvh] items-center justify-center py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-black tracking-tight text-base-100">Iniciar sesión</h1>
          <p className="mt-1.5 text-sm text-base-400">
            Accede para guardar favoritos, seguir tu biblioteca y registrar tus platinos.
          </p>
        </div>

        {sp.error && (
          <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/[0.07] px-3.5 py-2.5 text-[13px] text-rose-200">
            {sp.error}
          </div>
        )}

        <LoginForm
          mode="login"
          action={async (formData: FormData) => {
            "use server";
            const identifier = String(formData.get("identifier") ?? "").trim();
            const password = String(formData.get("password") ?? "");
            const next = String(formData.get("siguiente") ?? "/perfil");

            if (!identifier || !password) {
              redirect(`/login?error=${encodeURIComponent("Completa ambos campos.")}`);
            }
            const found = await verifyCredentials(identifier, password);
            if (!found) {
              redirect(
                `/login?error=${encodeURIComponent("Credenciales incorrectas.")}&siguiente=${encodeURIComponent(next)}`,
              );
            }
            const h = await headers();
            await createSession(found.id, { userAgent: h.get("user-agent") ?? undefined });
            redirect(next.startsWith("/") ? next : "/perfil");
          }}
          next={sp.siguiente ?? ""}
        />

        <p className="mt-5 text-center text-[13px] text-base-400">
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="gh-link font-semibold">
            Crear una
          </Link>
        </p>

        <div className="mt-6 rounded-xl border border-base-700 bg-base-850 p-3.5 text-[11px] leading-relaxed text-base-500">
          <p className="font-semibold text-base-400">Cuenta de demostración</p>
          <p className="mt-1">
            admin@gameshunter.app · gameshunter
          </p>
          <p className="mt-1.5">
            Créala con <code className="font-mono text-accent-300">npm run db:seed</code>. Cámbiala
            en producción.
          </p>
        </div>
      </div>
    </div>
  );
}
