"use client";

import { useState } from "react";
import { Download, Plus, ShoppingBag, Trash2, UserPlus } from "lucide-react";

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
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { redirect } from "next/navigation";

export default function ComprasPage() {
  const { user, token } = useAuth();

  if (!token || !user) {
    return redirect("/");
  }

  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      codigo: "SEM001",
      nombre: "Semilla de Maíz Premium",
      precioCompra: 12000,
      cantidad: 50,
      total: 600000,
    },
    {
      id: 2,
      codigo: "FER002",
      nombre: "Fertilizante NPK 20-20-20",
      precioCompra: 6500,
      cantidad: 30,
      total: 195000,
    },
  ]);

  const [isProveedorDialogOpen, setIsProveedorDialogOpen] = useState(false);

  const removeItem = (id: number) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: number, cantidad: number) => {
    setCartItems(
      cartItems.map((item) => {
        if (item.id === id) {
          return { ...item, cantidad, total: item.precioCompra * cantidad };
        }
        return item;
      })
    );
  };

  const updatePrice = (id: number, precioCompra: number) => {
    setCartItems(
      cartItems.map((item) => {
        if (item.id === id) {
          return { ...item, precioCompra, total: precioCompra * item.cantidad };
        }
        return item;
      })
    );
  };

  const total = cartItems.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Compras</h2>
      </div>

      <Tabs defaultValue="nueva" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="nueva">Nueva Compra</TabsTrigger>
          <TabsTrigger value="historial">Historial de Compras</TabsTrigger>
          <TabsTrigger value="proveedores">Proveedores</TabsTrigger>
        </TabsList>

        <TabsContent value="nueva">
          <div className="grid gap-4 md:grid-cols-12">
            <Card className="md:col-span-8">
              <CardHeader>
                <CardTitle>Productos a Comprar</CardTitle>
                <CardDescription>
                  Agregue productos y configure precios de compra
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
                      <TableHead className="text-right">
                        Precio Compra
                      </TableHead>
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
                          <Input
                            type="number"
                            value={item.precioCompra}
                            onChange={(e) =>
                              updatePrice(
                                item.id,
                                Number.parseFloat(e.target.value)
                              )
                            }
                            className="w-24 text-right"
                          />
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
                          No hay productos en la orden de compra
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card className="md:col-span-4">
              <CardHeader>
                <CardTitle>Resumen de Compra</CardTitle>
                <CardDescription>
                  Detalles de la orden de compra
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Proveedor</Label>
                  <div className="flex space-x-2">
                    <Select>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Seleccionar proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">
                          Semillas del Campo S.A.
                        </SelectItem>
                        <SelectItem value="2">
                          Fertilizantes Argentinos
                        </SelectItem>
                        <SelectItem value="3">Agroquímicos del Sur</SelectItem>
                        <SelectItem value="4">Maquinarias Rurales</SelectItem>
                        <SelectItem value="5">
                          Distribuidora Agropecuaria
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Dialog
                      open={isProveedorDialogOpen}
                      onOpenChange={setIsProveedorDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Agregar Nuevo Proveedor</DialogTitle>
                          <DialogDescription>
                            Complete los datos del proveedor.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="nombre-prov" className="text-right">
                              Nombre
                            </Label>
                            <Input id="nombre-prov" className="col-span-3" />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="cuit-prov" className="text-right">
                              CUIT
                            </Label>
                            <Input id="cuit-prov" className="col-span-3" />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                              htmlFor="telefono-prov"
                              className="text-right"
                            >
                              Teléfono
                            </Label>
                            <Input id="telefono-prov" className="col-span-3" />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email-prov" className="text-right">
                              Email
                            </Label>
                            <Input
                              id="email-prov"
                              type="email"
                              className="col-span-3"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setIsProveedorDialogOpen(false)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => setIsProveedorDialogOpen(false)}
                          >
                            Guardar
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
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
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="credito30">Crédito 30 días</SelectItem>
                      <SelectItem value="credito60">Crédito 60 días</SelectItem>
                      <SelectItem value="credito90">Crédito 90 días</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fecha de Entrega Esperada</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Notas</Label>
                  <Input placeholder="Agregar notas a la compra..." />
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
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Confirmar Compra
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="historial">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Compras</CardTitle>
              <CardDescription>
                Registro de todas las compras realizadas a proveedores
              </CardDescription>
              <div className="flex items-center space-x-2 mt-2">
                <Input placeholder="Buscar compras..." className="w-[250px]" />
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
                    <TableHead className="w-[100px]">Nº Orden</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Fecha Entrega</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">#OC001</TableCell>
                    <TableCell>Semillas del Campo S.A.</TableCell>
                    <TableCell>15/05/2023</TableCell>
                    <TableCell>20/05/2023</TableCell>
                    <TableCell className="text-right">$1,450,000.00</TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-green-500">Entregada</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Ver detalles
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">#OC002</TableCell>
                    <TableCell>Fertilizantes Argentinos</TableCell>
                    <TableCell>12/05/2023</TableCell>
                    <TableCell>18/05/2023</TableCell>
                    <TableCell className="text-right">$890,500.00</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="outline"
                        className="text-blue-600 border-blue-600"
                      >
                        En Tránsito
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Ver detalles
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">#OC003</TableCell>
                    <TableCell>Agroquímicos del Sur</TableCell>
                    <TableCell>08/05/2023</TableCell>
                    <TableCell>15/05/2023</TableCell>
                    <TableCell className="text-right">$567,800.00</TableCell>
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
                    <TableCell className="font-medium">#OC004</TableCell>
                    <TableCell>Maquinarias Rurales</TableCell>
                    <TableCell>03/05/2023</TableCell>
                    <TableCell>10/05/2023</TableCell>
                    <TableCell className="text-right">$2,340,000.00</TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-green-500">Entregada</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Ver detalles
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">#OC005</TableCell>
                    <TableCell>Distribuidora Agropecuaria</TableCell>
                    <TableCell>28/04/2023</TableCell>
                    <TableCell>05/05/2023</TableCell>
                    <TableCell className="text-right">$1,120,300.00</TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-green-500">Entregada</Badge>
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

        <TabsContent value="proveedores">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Proveedores</CardTitle>
              <CardDescription>
                Administre la información de sus proveedores
              </CardDescription>
              <div className="flex items-center space-x-2 mt-2">
                <Input
                  placeholder="Buscar proveedores..."
                  className="w-[250px]"
                />
                <Dialog
                  open={isProveedorDialogOpen}
                  onOpenChange={setIsProveedorDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Nuevo Proveedor
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Agregar Nuevo Proveedor</DialogTitle>
                      <DialogDescription>
                        Complete los datos del proveedor.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="nombre-prov" className="text-right">
                          Nombre
                        </Label>
                        <Input id="nombre-prov" className="col-span-3" />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="cuit-prov" className="text-right">
                          CUIT
                        </Label>
                        <Input id="cuit-prov" className="col-span-3" />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="telefono-prov" className="text-right">
                          Teléfono
                        </Label>
                        <Input id="telefono-prov" className="col-span-3" />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email-prov" className="text-right">
                          Email
                        </Label>
                        <Input
                          id="email-prov"
                          type="email"
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="direccion-prov" className="text-right">
                          Dirección
                        </Label>
                        <Input id="direccion-prov" className="col-span-3" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsProveedorDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => setIsProveedorDialogOpen(false)}
                      >
                        Guardar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
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
                    <TableHead>Nombre</TableHead>
                    <TableHead>CUIT</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Última Compra</TableHead>
                    <TableHead className="text-right">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">
                      Semillas del Campo S.A.
                    </TableCell>
                    <TableCell>30-12345678-9</TableCell>
                    <TableCell>11-4567-8901</TableCell>
                    <TableCell>ventas@semillasdelcampo.com.ar</TableCell>
                    <TableCell>15/05/2023</TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-green-500">Activo</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Ver detalles
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      Fertilizantes Argentinos
                    </TableCell>
                    <TableCell>30-98765432-1</TableCell>
                    <TableCell>11-2345-6789</TableCell>
                    <TableCell>contacto@fertilizantesarg.com.ar</TableCell>
                    <TableCell>12/05/2023</TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-green-500">Activo</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Ver detalles
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      Agroquímicos del Sur
                    </TableCell>
                    <TableCell>30-54321678-9</TableCell>
                    <TableCell>11-8765-4321</TableCell>
                    <TableCell>info@agroquimicossur.com.ar</TableCell>
                    <TableCell>08/05/2023</TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-green-500">Activo</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Ver detalles
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      Maquinarias Rurales
                    </TableCell>
                    <TableCell>30-11223344-5</TableCell>
                    <TableCell>11-5555-6666</TableCell>
                    <TableCell>ventas@maquinariasrurales.com.ar</TableCell>
                    <TableCell>03/05/2023</TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-green-500">Activo</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Ver detalles
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      Distribuidora Agropecuaria
                    </TableCell>
                    <TableCell>30-99887766-3</TableCell>
                    <TableCell>11-7777-8888</TableCell>
                    <TableCell>compras@distribuidoraagro.com.ar</TableCell>
                    <TableCell>28/04/2023</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="outline"
                        className="text-yellow-600 border-yellow-600"
                      >
                        Inactivo
                      </Badge>
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
