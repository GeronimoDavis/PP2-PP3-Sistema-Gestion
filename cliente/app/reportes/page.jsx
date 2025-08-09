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
import { DateRange } from "react-day-picker";
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

const COLORS = ["#16a34a", "#22c55e", "#4ade80", "#86efac", "#bbf7d0"];

const pieData = [
  { name: "Semillas", value: 45 },
  { name: "Fertilizantes", value: 25 },
  { name: "Herbicidas", value: 15 },
  { name: "Maquinaria", value: 10 },
  { name: "Otros", value: 5 },
];

const lineData = [
  { name: "Ene", semillas: 400000, fertilizantes: 240000, herbicidas: 200000 },
  { name: "Feb", semillas: 300000, fertilizantes: 139000, herbicidas: 220000 },
  { name: "Mar", semillas: 200000, fertilizantes: 980000, herbicidas: 290000 },
  { name: "Abr", semillas: 278000, fertilizantes: 390000, herbicidas: 200000 },
  { name: "May", semillas: 189000, fertilizantes: 480000, herbicidas: 218000 },
  { name: "Jun", semillas: 239000, fertilizantes: 380000, herbicidas: 250000 },
  { name: "Jul", semillas: 349000, fertilizantes: 430000, herbicidas: 210000 },
];

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function ReportesPage() {
  const [date, setDate] = useState({
    from: new Date(2023, 0, 1),
    to: addDays(new Date(), 0),
  });

  const { user, token, validateToken } = useAuth();

  const router = useRouter(); // Usar el hook useRouter

  useEffect(() => {
    // La lógica de validación se mueve aquí dentro
    if (!token || !user || !validateToken(token)) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
      router.push("/"); // Usar router.push para redirección en el cliente
    }
  }, [user, token, validateToken, router]); // Dependencias del efecto

  // Opcional: Mostrar un loader mientras se valida
  if (!token || !user) {
    return <div>Cargando...</div>;
  }
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
          <Card>
            <CardHeader>
              <CardTitle>Ventas por Período</CardTitle>
              <CardDescription>
                Análisis de ventas durante el período seleccionado
              </CardDescription>
              <div className="flex justify-end">
                <Select defaultValue="mensual">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Seleccionar vista" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diario">Vista Diaria</SelectItem>
                    <SelectItem value="semanal">Vista Semanal</SelectItem>
                    <SelectItem value="mensual">Vista Mensual</SelectItem>
                    <SelectItem value="anual">Vista Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="pl-2">
              <Overview />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="productos">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Ventas por Categoría</CardTitle>
                <CardDescription>
                  Porcentaje de ventas por categoría de producto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RePieChart>
                    <Pie
                      data={pieData}
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
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
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
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-full">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">
                          Semilla de Maíz Premium
                        </span>
                        <span className="text-sm font-medium">78%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div
                          className="bg-green-600 h-2.5 rounded-full"
                          style={{ width: "78%" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-full">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">
                          Fertilizante NPK 20-20-20
                        </span>
                        <span className="text-sm font-medium">65%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div
                          className="bg-green-600 h-2.5 rounded-full"
                          style={{ width: "65%" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-full">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">
                          Semilla de Soja RR
                        </span>
                        <span className="text-sm font-medium">52%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div
                          className="bg-green-600 h-2.5 rounded-full"
                          style={{ width: "52%" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-full">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">
                          Herbicida Selectivo
                        </span>
                        <span className="text-sm font-medium">45%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div
                          className="bg-green-600 h-2.5 rounded-full"
                          style={{ width: "45%" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-full">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">
                          Pulverizadora Manual 20L
                        </span>
                        <span className="text-sm font-medium">32%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div
                          className="bg-green-600 h-2.5 rounded-full"
                          style={{ width: "32%" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tendencias">
          <Card>
            <CardHeader>
              <CardTitle>Tendencias de Ventas por Categoría</CardTitle>
              <CardDescription>
                Evolución de ventas por categoría de producto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ReLineChart
                  data={lineData}
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
                  <Line
                    type="monotone"
                    dataKey="semillas"
                    stroke="#16a34a"
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="fertilizantes"
                    stroke="#22c55e"
                  />
                  <Line type="monotone" dataKey="herbicidas" stroke="#4ade80" />
                </ReLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
