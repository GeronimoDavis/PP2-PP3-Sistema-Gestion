"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { updatePassword } from "@/api/loginApi";
//import Home from "../../public/home.svg";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";


export default function UpdatePasswordPage() {
    const { user } = useAuth();
    //const [username, setUsername] = useState(user?.username || "");
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const data = await updatePassword(user?.username, oldPassword, newPassword);
            setMessage("Contraseña actualizada con éxito ✅");
        } catch (err: any) {
            console.error(err);
            setMessage(
                err.response?.data?.error || "Error al actualizar la contraseña ❌"
            );
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen relative">
            <div className="flex justify-end w-full p-10 ">
                <a href="/dashboard" className="text-blue-600 hover:underline">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src="/home.svg" alt="@home" />
                    <AvatarFallback>INICIO</AvatarFallback>
                    </Avatar>
                </a>
            </div>
            <h1 className="text-3xl font-bold mb-10">Actualizar contraseña</h1>
            <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-3 w-80 border p-4 rounded-lg shadow"
            >
                <input
                    type="text"
                    placeholder="Usuario"
                    value={user?.username ?? ""}
                    readOnly
                    className="border p-2 rounded"
                    required
                />
                <input
                    type="password"
                    placeholder="Contraseña actual"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="border p-2 rounded"
                    required
                />
                <input
                    type="password"
                    placeholder="Nueva contraseña"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="border p-2 rounded"
                    required
                />
                <button
                    type="submit"
                    className="bg-green-600 text-white p-2 rounded hover:bg-green-700"
                >
                    Actualizar
                </button>
            </form>
            {message && <p className="mt-3">{message}</p>}

        </div >
    );
}
