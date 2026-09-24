import { useState } from "react";
import {useRouter} from "next/navigation";
import { RegistrationRole } from "@/components/auth/RoleSelector";
import { RegisterFieldErrors } from "@/types/registerTypes";
import { startOAuth } from "@/services/auth.service";
import { registerUser } from "@/services/register.service";

export const useRegister = (setUser: (user: User | null) => void) => {
    const router = useRouter();
    const [selectedRole, setSelectedRole] =useState<RegistrationRole>("emprendedor");
    const [form,setForm]=useState({
        name:"",
        surname:"",
        email:"",
        password:"",
        confirmPassword:""
    })
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null);
    const isEntrepreneur = selectedRole === "emprendedor";

    async function handleRegister(event: React.SyntheticEvent<HTMLFormElement>,) {
            event.preventDefault();
            setError("");

            const nextErrors: RegisterFieldErrors = {};
            const normalizedEmail = form.email.trim();

            if (!form.name.trim()) nextErrors.name = "El nombre es obligatorio.";
            if (!form.surname.trim()) nextErrors.surname = "El apellido es obligatorio.";
            if (!normalizedEmail) {
                nextErrors.email = "El correo electrónico es obligatorio.";
            } else if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
                nextErrors.email = "Ingresá un correo electrónico válido.";
            }
            if (!form.password) {
                nextErrors.password = "La contraseña es obligatoria.";
            } else if (form.password.length < 8) {
                nextErrors.password =
                    "La contraseña debe tener al menos 8 caracteres.";
            }
            if (!form.confirmPassword) {
                nextErrors.confirmPassword = "Confirmá tu contraseña.";
            } else if (form.password !== form.confirmPassword) {
                nextErrors.confirmPassword = "Las contraseñas no coinciden.";
            }

            setFieldErrors(nextErrors);
            if (Object.keys(nextErrors).length > 0) return;

            if (!acceptedTerms) {
                setError(
                    "Debes aceptar los términos de servicio y la política de privacidad.",
                );
                return;
            }

            if (!isEntrepreneur) {
                setError(
                    "El registro de Tester Junior se realiza mediante Google o GitHub.",
                );
                return;
            }

            setLoading(true);

            try {
                const response = await registerUser({
                    name: form.name.trim(),
                    surname: form.surname.trim(),
                    email: normalizedEmail,
                    password: form.password,
                });

                setUser(response.user);

                router.push("/dashboard");
            } catch (err) {
                if (err instanceof Error) {
                    if (
                        err.message
                            .toLowerCase()
                            .includes("user with this email already exists.")
                    ) {
                        setError(
                            "Ya existe un usuario registrado con ese correo electrónico.",
                        );
                    } else {
                        setError(err.message);
                    }
                } else {
                    setError("No se pudo completar el registro.");
                }
            }
        }
    async function handleOAuth(provider: "google" | "github") {
            setError("");

            const flow = selectedRole === "emprendedor" ? "entrepreneur" : "tester";

            setOauthLoading(provider);

            try {
                const response = await startOAuth(provider, "signup", flow);

                window.location.href = `http://localhost:8000${response.login_url}`;
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError("No se pudo iniciar el registro con OAuth.");
                }

                setOauthLoading(null);
            }
        }

    return {
        form,
        setForm,
        selectedRole,
        setSelectedRole,
        acceptedTerms,
        setAcceptedTerms,
        fieldErrors,
        setFieldErrors,
        error,
        setError,
        loading,
        oauthLoading,
        isEntrepreneur,
        handleRegister,
        handleOAuth
    }
}