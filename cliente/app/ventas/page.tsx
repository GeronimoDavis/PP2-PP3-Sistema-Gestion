"use client";

import { Label } from "@/components/ui/label";

import { useState } from "react";
import { Download, Plus, ShoppingCart, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { redirect } from "next/navigation";

export default function VentasPage() {
  const { user, token, validateToken } = useAuth();

  if (!token || !user || !validateToken(token)) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return redirect("/");
  }

  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      codigo: "SEM001",
      nombre: "Semilla de Maíz Premium",
      precio: 15500,
      cantidad: 2,
      total: 31000,
    },
    {
      id: 2,
      codigo: "FER002",
      nombre: "Fertilizante NPK 20-20-20",
      precio: 8750,
      cantidad: 1,
      total: 8750,
    },
  ]);

  const removeItem = (id: number) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: number, cantidad: number) => {
    setCartItems(
      cartItems.map((item) => {
        if (item.id === id) {
          return { ...item, cantidad, total: item.precio * cantidad };
        }
        return item;
      })
    );
  };

  const total = cartItems.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Ventas</h2>
      </div>

      <Tabs defaultValue="nueva" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="nueva">Nueva Venta</TabsTrigger>
          <TabsTrigger value="historial">Historial de Ventas</TabsTrigger>
        </TabsList>
        <TabsContent value="nueva">
          <div className="grid gap-4 md:grid-cols-12">
            <Card className="md:col-span-8">
              <CardHeader>
                <CardTitle>Productos</CardTitle>
                <CardDescription>
                  Busque y agregue productos a la venta actual
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-4">
                  <Input
                    placeholder="Buscar productos por código o nombre..."
                    className="flex-1"
                  />
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cartItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.codigo}
                        </TableCell>
                        <TableCell>{item.nombre}</TableCell>
                        <TableCell className="text-right">
                          ${item.precio.toLocaleString("es-AR")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={item.cantidad}
                            onChange={(e) =>
                              updateQuantity(
                                item.id,
                                Number.parseInt(e.target.value)
                              )
                            }
                            min="1"
                            className="w-16 text-right"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          ${item.total.toLocaleString("es-AR")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {cartItems.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-4 text-muted-foreground"
                        >
                          No hay productos en el carrito
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card className="md:col-span-4">
              <CardHeader>
                <CardTitle>Resumen de Venta</CardTitle>
                <CardDescription>Detalles de la venta actual</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Juan Pérez</SelectItem>
                      <SelectItem value="2">
                        Estancia El Amanecer S.A.
                      </SelectItem>
                      <SelectItem value="3">
                        Cooperativa Agrícola Regional
                      </SelectItem>
                      <SelectItem value="4">María González</SelectItem>
                      <SelectItem value="5">Agrícola San Martín</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Método de Pago</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="transferencia">
                        Transferencia Bancaria
                      </SelectItem>
                      <SelectItem value="tarjeta">
                        Tarjeta de Crédito/Débito
                      </SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="credito">Crédito (30 días)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notas</Label>
                  <Input placeholder="Agregar notas a la venta..." />
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${total.toLocaleString("es-AR")}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span>IVA (21%)</span>
                    <span>${(total * 0.21).toLocaleString("es-AR")}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg mt-4">
                    <span>Total</span>
                    <span>${(total * 1.21).toLocaleString("es-AR")}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Finalizar Venta
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="historial">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Ventas</CardTitle>
              <CardDescription>
                Registro de todas las ventas realizadas
              </CardDescription>
              <div className="flex items-center space-x-2 mt-2">
                <Input placeholder="Buscar ventas..." className="w-[250px]" />
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Nº Venta</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">#1001</TableCell>
                    <TableCell>Estancia El Amanecer S.A.</TableCell>
                    <TableCell>10/05/2023</TableCell>
                    <TableCell className="text-right">$245,630.00</TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-green-500">Completada</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Ver detalles
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">#1002</TableCell>
                    <TableCell>Juan Pérez</TableCell>
                    <TableCell>08/05/2023</TableCell>
                    <TableCell className="text-right">$37,850.00</TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-green-500">Completada</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Ver detalles
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">#1003</TableCell>
                    <TableCell>Cooperativa Agrícola Regional</TableCell>
                    <TableCell>05/05/2023</TableCell>
                    <TableCell className="text-right">$156,780.00</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="outline"
                        className="text-yellow-600 border-yellow-600"
                      >
                        Pendiente
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Ver detalles
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">#1004</TableCell>
                    <TableCell>María González</TableCell>
                    <TableCell>01/05/2023</TableCell>
                    <TableCell className="text-right">$12,450.00</TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-green-500">Completada</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Ver detalles
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">#1005</TableCell>
                    <TableCell>Agrícola San Martín</TableCell>
                    <TableCell>28/04/2023</TableCell>
                    <TableCell className="text-right">$89,320.00</TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-green-500">Completada</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Ver detalles
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
