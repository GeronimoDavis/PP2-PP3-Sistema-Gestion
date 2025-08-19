"use client";

import { useEffect, useState } from "react";
import { Leaf, Package, ShoppingCart, Users } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Overview } from "@/components/overview";
import { RecentVentas } from "@/components/recent-ventas";
import { DatePickerWithRange } from "@/components/date-range-picker";
import type { DateRange } from "react-day-picker";
import { addDays, subDays } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getAllActiveClients } from "@/api/personsApi";

export default function DashboardPage() {
  const [clients, setClients] = useState({ clients: [] });
  const { user, token, validateToken, loading } = useAuth();
  const router = useRouter();
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  useEffect(() => {
    const fetchClients = async () => {
      const clients = await getAllActiveClients();
      setClients(clients);
    };
    fetchClients();
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!token || !user || !validateToken(token)) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
        router.push("/"); // Usar router.push para redirección en el cliente
      }
    }
  }, [user, token, loading, validateToken, router]);

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (loading) {
    return null;
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <DatePickerWithRange date={date} setDate={setDate} />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ventas Totales
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$4,231,589.32</div>
            <p className="text-xs text-muted-foreground">
              +20.1% respecto al mes anterior
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Productos en Stock
            </CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,350</div>
            <p className="text-xs text-muted-foreground">
              +180 nuevos productos este mes
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Clientes Activos
            </CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.clients.length}</div>
            <p className="text-xs text-muted-foreground">+24 nuevos este mes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Productos Agotados
            </CardTitle>
            <Leaf className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Requieren reposición urgente
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Resumen de Ventas</CardTitle>
            <CardDescription>
              Ventas mensuales durante el período seleccionado
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Ventas Recientes</CardTitle>
            <CardDescription>Últimas transacciones realizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentVentas />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
