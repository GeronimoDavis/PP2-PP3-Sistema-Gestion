"use client";

import { useEffect, useState } from "react";
import { DollarSign, Leaf, Package, ShoppingCart, Users } from "lucide-react";

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
import { getAllActiveClients } from "@/api/personsApi";
import {
  getTotalSales,
  getRecentTransactions,
  getSalesWithPendingBalance,
} from "@/api/dashboardApi";
import { getProductsWithoutStock } from "@/api/dashboardApi";
import { formatNumber } from "@/utils/numUtils";

export default function DashboardPage() {
  const [clients, setClients] = useState({ clients: [] });
  const [totalSales, setTotalSales] = useState({ total_sales: 0 });
  const [recentSales, setRecentSales] = useState({
    recent_transactions: [{ company_name: "", date: "", total_a_pagar: "" }],
  });
  const [productsWithoutStock, setProductsWithoutStock] = useState({
    products: [],
  });
  const [salesWithPendingBalance, setSalesWithPendingBalance] = useState([]);
  const { user, token, validateToken, loading } = useAuth();
  const router = useRouter();
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  useEffect(() => {
    const fetchTotalSales = async () => {
      const sales = await getTotalSales();
      setTotalSales(sales);
    };
    fetchTotalSales();
  }, []);

  useEffect(() => {
    const fetchRecentTransactions = async () => {
      const transactions = await getRecentTransactions();
      setRecentSales(transactions);
    };
    fetchRecentTransactions();
  }, []);

  useEffect(() => {
    const fetchProductsWithoutStock = async () => {
      const products = await getProductsWithoutStock();
      setProductsWithoutStock(products);
      console.log(products);
    };
    fetchProductsWithoutStock();
  }, []);

  useEffect(() => {
    const fetchClients = async () => {
      const clients = await getAllActiveClients();
      setClients(clients);
    };
    fetchClients();
  }, []);

  useEffect(() => {
    const fetchSalesWithPendingBalance = async () => {
      const sales = await getSalesWithPendingBalance();
      setSalesWithPendingBalance(sales);
      console.log(sales);
    };
    fetchSalesWithPendingBalance();
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ventas Totales
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $ {formatNumber(totalSales.total_sales)}
            </div>
            <p className="text-xs text-muted-foreground">
              {/* +20.1% respecto al mes anterior */}
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
            <div className="space-y-6 overflow-y-auto max-h-[350px]">
              {recentSales.recent_transactions.map((venta, index) => (
                <RecentVentas
                  key={index}
                  nombreCliente={venta.company_name}
                  fechaVenta={formatDate(venta.date)}
                  montoVenta={formatNumber(venta.total_a_pagar)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
