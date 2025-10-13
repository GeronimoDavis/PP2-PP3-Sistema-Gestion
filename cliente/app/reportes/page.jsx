"use client";

import { useEffect, useState } from "react";
import { BarChart3, Download, LineChart, PieChart } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DatePickerWithRange } from "@/components/date-range-picker";
import { addDays } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Overview } from "@/components/overview";
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  getSalesByPeriod,
  getSalesByCategory,
  getTopSellingProducts,
  getSalesTrendsByCategory,
} from "@/api/reportsApi";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = [
  "#FF6384",
  "#36A2EB",
  "#FFCE56",
  "#4BC0C0",
  "#9966FF",
  "#FF9F40",
];

export default function ReportesPage() {
  const [date, setDate] = useState({
    from: new Date(2020, 0, 1),
    to: new Date(),
  });
  const [viewPeriod, setViewPeriod] = useState("monthly");

  const [salesByPeriodData, setSalesByPeriodData] = useState([]);
  const [salesByCategoryData, setSalesByCategoryData] = useState([]);
  const [topProductsData, setTopProductsData] = useState([]);
  const [salesTrendsData, setSalesTrendsData] = useState([]);
  const [trendCategories, setTrendCategories] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const { user, token, validateToken, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!token || !user || !validateToken(token)) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
        router.push("/");
      }
    }
  }, [user, token, validateToken, router, loading]);

  useEffect(() => {
    if (date?.from && date?.to && token) {
      const fetchData = async () => {
        setIsDataLoading(true);
        try {
          // Agregar un día a la fecha "to" para incluir todo el día seleccionado
          const toDateExtended = addDays(date.to, 1);

          const [salesPeriod, salesCategory, topProducts, salesTrends] =
            await Promise.all([
              getSalesByPeriod(date.from, toDateExtended, viewPeriod),
              getSalesByCategory(date.from, toDateExtended),
              getTopSellingProducts(date.from, toDateExtended),
              getSalesTrendsByCategory(date.from, toDateExtended),
            ]);

          setSalesByPeriodData(salesPeriod);
          setSalesByCategoryData(salesCategory);
          setTopProductsData(topProducts);
          setSalesTrendsData(salesTrends);
          if (salesTrends.length > 0) {
            const categories = Object.keys(salesTrends[0]).filter(
              (key) => key !== "name"
            );
            setTrendCategories(categories);
          } else {
            setTrendCategories([]);
          }
        } catch (error) {
          console.error("Error fetching report data:", error);
        } finally {
          setIsDataLoading(false);
        }
      };
      fetchData();
    }
  }, [date, viewPeriod, token]);

  if (loading) {
    return <div>Cargando...</div>;
  }

  const topProductsTotal = topProductsData.reduce(
    (acc, product) => acc + parseFloat(product.total_sales),
    0
  );

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Reportes</h2>
        <div className="flex items-center space-x-2">
          <DatePickerWithRange date={date} setDate={setDate} />
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="ventas" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ventas">
            <BarChart3 className="mr-2 h-4 w-4" />
            Ventas
          </TabsTrigger>
          <TabsTrigger value="productos">
            <PieChart className="mr-2 h-4 w-4" />
            Productos
          </TabsTrigger>
          <TabsTrigger value="tendencias">
            <LineChart className="mr-2 h-4 w-4" />
            Tendencias
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ventas">
          {isDataLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[350px] w-full" />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Ventas por Período</CardTitle>
                <CardDescription>
                  Análisis de ventas durante el período seleccionado
                </CardDescription>
                <div className="flex justify-end">
                  <Select value={viewPeriod} onValueChange={setViewPeriod}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Seleccionar vista" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Vista Diaria</SelectItem>
                      <SelectItem value="weekly">Vista Semanal</SelectItem>
                      <SelectItem value="monthly">Vista Mensual</SelectItem>
                      <SelectItem value="annual">Vista Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="pl-2">
                {salesByPeriodData.length > 0 ? (
                  <Overview data={salesByPeriodData} />
                ) : (
                  <div className="h-[350px] w-full flex items-center justify-center">
                    <p className="text-muted-foreground">
                      No hay datos de ventas en este período.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="productos">
          {isDataLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[300px] w-full" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[300px] w-full" />
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Distribución de Ventas por Categoría</CardTitle>
                  <CardDescription>
                    Porcentaje de ventas por categoría de producto
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {salesByCategoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RePieChart>
                        <Pie
                          data={salesByCategoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {salesByCategoryData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RePieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] w-full flex items-center justify-center">
                      <p className="text-muted-foreground">
                        No hay datos de categorías en este período.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Productos Más Vendidos</CardTitle>
                  <CardDescription>
                    Top productos por volumen de ventas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {topProductsData.length > 0 ? (
                    <div className="space-y-4">
                      {topProductsData.map((product, index) => {
                        const percentage =
                          topProductsTotal > 0
                            ? (product.total_sales / topProductsTotal) * 100
                            : 0;
                        return (
                          <div className="flex items-center" key={index}>
                            <div className="w-full">
                              <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium">
                                  {product.name}
                                </span>
                                <span className="text-sm font-medium">
                                  {percentage.toFixed(0)}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                <div
                                  className="h-2.5 rounded-full"
                                  style={{
                                    width: `${percentage}%`,
                                    backgroundColor:
                                      COLORS[index % COLORS.length],
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-[300px] w-full flex items-center justify-center">
                      <p className="text-muted-foreground">
                        No hay productos vendidos en este período.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="tendencias">
          {isDataLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[400px] w-full" />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Tendencias de Ventas por Categoría</CardTitle>
                <CardDescription>
                  Evolución de ventas por categoría de producto
                </CardDescription>
              </CardHeader>
              <CardContent>
                {salesTrendsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <ReLineChart
                      data={salesTrendsData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => [
                          `$${value.toLocaleString()}`,
                          undefined,
                        ]}
                      />
                      <Legend />
                      {trendCategories.map((category, index) => (
                        <Line
                          key={category}
                          type="monotone"
                          dataKey={category}
                          stroke={COLORS[index % COLORS.length]}
                          activeDot={{ r: 8 }}
                        />
                      ))}
                    </ReLineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[400px] w-full flex items-center justify-center">
                    <p className="text-muted-foreground">
                      No hay tendencias de ventas en este período.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
