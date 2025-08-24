"use client";

import { Label } from "@/components/ui/label";

import { useEffect, useState } from "react";
import { Download, Plus, ShoppingBag, Trash2, UserPlus, Search, X } from "lucide-react";
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
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getProducts, getProductByCode, getProductByName } from "@/api/productsApi";

// Interfaces TypeScript para los tipos de datos
interface CartItem {
  id: number;
  codigo: string;
  nombre: string;
  precioCompra: number;
  cantidad: number;
  total: number;
}

interface Product {
  product_id: number;
  name: string;
  code: string;
  stock: number;
  purchase_price: number;
  category_id: number;
  active: number;
}

export default function ComprasPage() {
  const { user, token, validateToken, loading } = useAuth();
  const router = useRouter();

  // COMPRA
  // items del carrito
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  // agregar proveedor
  const [isProveedorDialogOpen, setIsProveedorDialogOpen] = useState(false);
  // proveedor seleccionado
  const [selectedProvider, setSelectedProvider] = useState("");
  // metodo de pago
  const [paymentMethod, setPaymentMethod] = useState("");
  // fecha de entrega
  const [deliveryDate, setDeliveryDate] = useState("");
  // notas
  const [notes, setNotes] = useState("");

  // BÚSQUEDA DE PRODUCTOS
  // termino de búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  // lista de productos encontrados
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  // estado de carga
  const [isSearching, setIsSearching] = useState(false);
  // mostrar resultados de búsqueda
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    // La lógica de validación se mueve aquí dentro
    if (!loading) {
      if (!token || !user || !validateToken(token)) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
        router.push("/"); // Usar router.push para redirección en el cliente
      }
    }
  }, [user, token, validateToken, router, loading]); // Dependencias del efecto

  // Definir el tipo de item del carrito
  const total = cartItems.reduce((sum, item) => sum + item.total, 0);

  // COMPRA
  // eliminar item del carrito
  const removeItem = (id: number) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
  };

  // actualizar cantidad del item
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

  // actualizar precio del item
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

  // BÚSQUEDA DE PRODUCTOS
  // buscar productos
  const searchProducts = async () => {
    const currentSearchTerm = searchTerm.trim();
    if (!currentSearchTerm) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    setShowSearchResults(true);

    try {
      let results: Product[] = [];

      // Buscar por código (búsqueda exacta)
      if (currentSearchTerm.length >= 3) {
        try {
          const codeResult = await getProductByCode(currentSearchTerm);
          if (codeResult.product) {
            results.push(codeResult.product);
          }
        } catch (error) {
          // Si no encuentra por código, continuar con búsqueda por nombre
        }
      }

      // Buscar por nombre (búsqueda parcial)
      try {
        const nameResult = await getProductByName(currentSearchTerm);
        if (nameResult.products && nameResult.products.length > 0) {
          // Filtrar duplicados si ya encontramos por código
          const existingIds = results.map((p: Product) => p.product_id);
          const newProducts = nameResult.products.filter((p: Product) => !existingIds.includes(p.product_id));
          results = [...results, ...newProducts];
        }
      } catch (error) {
        console.error("Error buscando por nombre:", error);
      }

      // Si no encontramos nada específico, buscar en todos los productos
      if (results.length === 0) {
        try {
          const allProducts = await getProducts();
          if (allProducts.products) {
            results = allProducts.products.filter((product: Product) => 
              product.name.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
              product.code.toLowerCase().includes(currentSearchTerm.toLowerCase())
            );
          }
        } catch (error) {
          console.error("Error buscando en todos los productos:", error);
        }
      }

      setSearchResults(results);
    } catch (error) {
      console.error("Error en búsqueda:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // agregar producto al carrito
  const addProductToCart = (product: Product) => {
    const newItem: CartItem = {
      id: product.product_id,
      codigo: product.code,
      nombre: product.name,
      precioCompra: product.purchase_price || 0,
      cantidad: 1,
      total: product.purchase_price || 0,
    };

    setCartItems([...cartItems, newItem]);
    setShowSearchResults(false);
    setSearchTerm("");
  };

  // limpiar búsqueda
  const clearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // búsqueda en tiempo real con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        searchProducts();
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300); // 300ms de delay para evitar demasiadas llamadas

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // buscar productos al presionar Enter (mantener para compatibilidad)
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchProducts();
    }
  };

  const confirmPurchase = () => {
    // confirmar la compra
    console.log("Confirmar compra", {
      items: cartItems,
      provider: selectedProvider,
      paymentMethod,
      deliveryDate,
      notes
    });
  };
 
  // renderizar el componente
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
                                 <div className="flex items-center space-x-2 mb-4 relative">
                   <div className="flex-1 relative">
                     <Input
                       placeholder="Buscar productos por código o nombre..."
                       className="flex-1 pr-10"
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                     />
                     {searchTerm && (
                       <Button
                         variant="ghost"
                         size="sm"
                         className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                         onClick={clearSearch}
                       >
                         <X className="h-4 w-4" />
                       </Button>
                     )}
                     {isSearching && (
                       <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                       </div>
                     )}
                   </div>
                 </div>

                                                  {/* Resultados de búsqueda */}
                 {isSearching && (
                   <div className="mb-4 text-center py-4">
                     <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                     <p className="mt-2 text-sm text-gray-600">Buscando productos...</p>
                   </div>
                 )}

                 {searchResults.length > 0 && (
                   <div className="mb-4">
                     <h3 className="font-semibold mb-2">
                       Productos encontrados:
                     </h3>
                     <Table>
                       <TableHeader>
                         <TableRow>
                           <TableHead>Código</TableHead>
                           <TableHead>Producto</TableHead>
                           <TableHead className="text-right">Precio Compra</TableHead>
                           <TableHead className="text-right">Stock</TableHead>
                           <TableHead className="text-right">Acciones</TableHead>
                         </TableRow>
                       </TableHeader>
                       <TableBody>
                         {searchResults.map((product) => (
                           <TableRow key={product.product_id}>
                             <TableCell className="font-medium">
                               {product.code}
                             </TableCell>
                             <TableCell>{product.name}</TableCell>
                             <TableCell className="text-right">
                               ${product.purchase_price?.toLocaleString("es-AR") || "0"}
                             </TableCell>
                             <TableCell className="text-right">
                               {product.stock || 0}
                             </TableCell>
                             <TableCell className="text-right">
                               <Button 
                                 variant="outline"
                                 size="sm" 
                                 onClick={() => addProductToCart(product)}
                               >
                                 <Plus className="h-3 w-3 mr-1" />
                                 Agregar
                               </Button>
                             </TableCell>
                           </TableRow>
                         ))}
                       </TableBody>
                     </Table>
                   </div>
                 )}

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
                          {/* precio de compra */}
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
                    {/* seleccionar proveedor */}
                    <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Seleccionar proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="loading">Cargando proveedores...</SelectItem>
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
                  {/* seleccionar metodo de pago */}
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
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
                  <Input 
                    type="date" 
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notas</Label>
                  <Input 
                    placeholder="Agregar notas a la compra..." 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
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
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={confirmPurchase}
                  disabled={cartItems.length === 0 || !selectedProvider || !paymentMethod}
                >
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
                    <TableCell
                      colSpan={7}
                      className="text-center py-4 text-muted-foreground"
                    >
                      No hay compras registradas
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
                    <TableCell
                      colSpan={7}
                      className="text-center py-4 text-muted-foreground"
                    >
                      No hay proveedores registrados
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
