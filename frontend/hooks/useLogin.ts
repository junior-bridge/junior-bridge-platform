import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoginErrors } from "@/types/loginTypes";
import { User } from "@/types";
import { loginUser } from "@/services/login.service";
import { startOAuth } from "@/services/auth.service";

export const useLogin=(setUser: (user: User | null) => void)=>{
    const router = useRouter();
      const [form,setForm] = useState({
            email:"",
            password:""
        })
    const [fieldErrors, setFieldErrors] = useState<LoginErrors>({});
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    
    const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null);

    async function handleLogin(event: React.SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");
        const nextErrors: LoginErrors = {};
        const normalizedEmail = form.email.trim();

        if (!normalizedEmail) {
            nextErrors.email = "El correo electrónico es obligatorio.";
        } else if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
            nextErrors.email = "Ingresá un correo electrónico válido.";
        }

        if (!form.password) {
            nextErrors.password = "La contraseña es obligatoria.";
        }

        setFieldErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        setLoading(true);

        try {
            const response = await loginUser({
                email: normalizedEmail,
                password: form.password,
            });

            setUser(response.user);
            router.push("/dashboard");
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("No se pudo iniciar sesión.");
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleOAuthLogin(provider: "google" | "github") {
        setError("");
        setOauthLoading(provider);

        try {
            const response = await startOAuth(provider, "login");

            const apiUrl =
                process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

            window.location.assign(`${apiUrl}${response.login_url}`);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("No se pudo iniciar la autenticación.");
            }

            setOauthLoading(null);
        }
    }
    return {
        form,
        setForm,
        fieldErrors,
        setFieldErrors,
        error,
        loading,
        oauthLoading,
        handleLogin,
        handleOAuthLogin
    }
}