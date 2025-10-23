"use client";

import { useEffect, useState } from "react";
import {
  BoxIcon,
  DollarSign,
  Leaf,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react";

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
import { addDays, subDays, format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getPersons } from "@/api/personsApi";
import {
  getTotalSales,
  getRecentTransactions,
  getSalesWithPendingBalance,
  getTotalPurchases,
  getProductsWithoutStock,
  getSalesSummary,
} from "@/api/dashboardApi";
import { formatNumber } from "@/utils/numUtils";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const [clients, setClients] = useState({ clients: [] });
  const [totalSales, setTotalSales] = useState({ total_sales: 0 });
  const [totalPurchases, setTotalPurchases] = useState({ total_purchases: 0 });
  const [recentSales, setRecentSales] = useState({
    recent_transactions: [{ company_name: "", date: "", total_a_pagar: "" }],
  });
  const [productsWithoutStock, setProductsWithoutStock] = useState({
    products: [],
  });
  const [salesWithPendingBalance, setSalesWithPendingBalance] = useState([]);
  const [salesSummary, setSalesSummary] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const { user, token, validateToken, loading } = useAuth();
  const router = useRouter();
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(2020, 0, 1),
    to: new Date(),
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!date?.from || !date?.to || !token) return;
      setIsDataLoading(true);

      const fromDate = format(date.from, "yyyy-MM-dd");
      // Agregar un día a la fecha "to" para incluir todo el día seleccionado
      const toDateExtended = addDays(date.to, 1);
      const toDate = format(toDateExtended, "yyyy-MM-dd");

      try {
        const [
          sales,
          purchases,
          recent,
          pending,
          summary,
          activeClients,
          withoutStock,
        ] = await Promise.all([
          getTotalSales(fromDate, toDate),
          getTotalPurchases(fromDate, toDate),
          getRecentTransactions(fromDate, toDate),
          getSalesWithPendingBalance(fromDate, toDate),
          getSalesSummary(fromDate, toDate),
          getPersons(),
          getProductsWithoutStock(),
        ]);

        setTotalSales(sales);
        setTotalPurchases(purchases);
        setRecentSales(recent);
        setSalesWithPendingBalance(pending);
        setSalesSummary(summary);
        setClients(activeClients);
        setProductsWithoutStock(withoutStock);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchDashboardData();
  }, [date, token]);

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

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    // La cadena 'YYYY-MM-DD' se interpreta como medianoche UTC.
    const date = new Date(dateString);
    // Agregamos el desfase de la zona horaria del usuario para corregir la fecha a la local.
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return format(date, "dd/MM/yyyy");
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <DatePickerWithRange date={date} setDate={setDate} />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isDataLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-1/3" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Ventas Totales
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(totalSales.total_sales)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {/* +20.1% respecto al mes anterior */}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Compras Totales
                </CardTitle>
                <Package className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(totalPurchases.total_purchases)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Ventas con Saldo Pendiente
                </CardTitle>
                <DollarSign className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {salesWithPendingBalance.length}
                </div>
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
                <div className="text-2xl font-bold">
                  {productsWithoutStock.products.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Requieren reposición urgente
                </p>
              </CardContent>
            </Card>
          </>
        )}
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
            {isDataLoading ? (
              <div className="h-[350px] w-full flex items-center justify-center">
                <p className="text-muted-foreground">Cargando datos...</p>
              </div>
            ) : salesSummary.length > 0 ? (
              <Overview data={salesSummary} />
            ) : (
              <div className="h-[350px] w-full flex items-center justify-center">
                <p className="text-muted-foreground">
                  No hay datos disponibles para este período.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Ventas Recientes</CardTitle>
            <CardDescription>Últimas transacciones realizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 overflow-y-auto max-h-[350px]">
              {isDataLoading ? (
                <div className="h-[350px] w-full flex items-center justify-center">
                  <p className="text-muted-foreground">Cargando datos...</p>
                </div>
              ) : recentSales.recent_transactions.length > 0 ? (
                recentSales.recent_transactions.map((venta, index) => (
                  <RecentVentas
                    key={index}
                    nombreCliente={venta.company_name}
                    fechaVenta={formatDate(venta.date)}
                    montoVenta={formatNumber(venta.total_a_pagar)}
                  />
                ))
              ) : (
                <div className="h-[350px] w-full flex items-center justify-center">
                  <p className="text-muted-foreground">
                    No hay ventas recientes en este período.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
