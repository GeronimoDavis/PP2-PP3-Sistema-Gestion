"use client";

import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getProductByCode, getProductByName } from "@/api/productsApi";
import { Loader2 } from "lucide-react";
import { createTransaction } from "@/api/transactionsApi";
import { createPayment } from "@/api/paymentsApi";
import { getPersons } from "@/api/personsApi";
import { createItem } from "@/api/itemsApi";

export default function VentasPage() {
  const { user, token } = useAuth();

  if (!token || !user) {
    return redirect("/");
  }

  // Definir el tipo de item del carrito
  const [cartItems, setCartItems] = useState<Array<{
    id: number;
    codigo: string;
    nombre: string;
    precio: number;
    cantidad: number;
    total: number;
  }>>([]);

  const total = cartItems.reduce((sum, item) => sum + item.total, 0);

  //VENTA
  //busqueda de productos
  const [searchTerm, setSearchTerm] = useState("");
  //lista de productos encontrados
  const [searchResults, setSearchResults] = useState<Array<{
    product_id: number;
    code: string;
    name: string;
    purchase_price: number;
    stock: number;
  }>>([]);
  //estado de carga
  const [isLoading, setIsLoading] = useState(false);
  //error de la busqueda
  const [error, setError] = useState("");
  //debounce para búsqueda automática
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  //PAGO DE LA VENTA
  //metodo de pago
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  //monto de pago
  const [paymentAmount, setPaymentAmount] = useState(0);
  //fecha de pago
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  //nota de pago
  const [paymentNote, setPaymentNote] = useState("");
  //estado de procesamiento de pago
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  //CLIENTES
  //lista de clientes disponibles
  const [clients, setClients] = useState<Array<{
    person_id: number;
    name: string;
    email: string;
    phone: string;
    company_name: string;
    active: boolean;
  }>>([]);
  //cliente seleccionado para la venta
  const [selectedClient, setSelectedClient] = useState<string>("");
  //búsqueda de clientes
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  //resultados de búsqueda de clientes
  const [clientSearchResults, setClientSearchResults] = useState<Array<{
    person_id: number;
    name: string;
    email: string;
    phone: string;
    company_name: string;
    active: boolean;
  }>>([]);
  //mostrar resultados de búsqueda de clientes
  const [showClientResults, setShowClientResults] = useState(false);

  // calculo de IVA
  const calculateTax = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
    return subtotal * 0.21;
  };
  // calculo de total con IVA 
  const calculateTotalWithTax = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.21; // 21% IVA
    return subtotal + tax;
  };
  
  

    //FUNCIONES DE LA VENTA
  //busqueda de productos por codigo o nomrbe
  const handleSearch = async (searchValue = searchTerm) => {
    if (!searchValue.trim()) {
      setError("Por favor ingrese un término de búsqueda");
      return;
    }

    setIsLoading(true);
    setError("");
    setSearchResults([]);

    // Verificar token
    const currentToken = localStorage.getItem("token");
    

    try {
      let results = [];
      
      // Siempre buscar por nombre para permitir búsquedas parciales
      
      const products = await getProductByName(searchValue);
      
      results = products && products.products ? products.products : [];
      
      // Si no se encontraron resultados por nombre y parece un código, intentar por código
      if (results.length === 0 && /^[A-Z]{2}/.test(searchValue.toUpperCase())) {
        
        try {
          const product = await getProductByCode(searchValue.toUpperCase());
          
          if (product && product.product) results = [product.product];
        } catch (codeError) {
          
        }
      }
      
      console.log("Resultados finales:", results);

      setSearchResults(results);
      
      // Mostrar mensaje cuando no se encuentran productos
      if (results.length === 0) {
        setError("No se encontraron productos relacionados");
      } else {
        setError(""); // Limpiar error si se encontraron productos
      }
    } catch (error: any) {
      console.error("Error completo:", error);
      console.error("Error response:", error.response);
      setError("Error al buscar productos: " + (error.response?.data?.message || error.message || "Error desconocido"));
    } finally {
      setIsLoading(false);
    }
  };

  // Función para el botón de búsqueda
  const handleSearchButton = () => {
    handleSearch();
  };

  // Búsqueda automática mientras escribes
  useEffect(() => {
    // Limpiar timeout anterior
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Si el término de búsqueda está vacío, limpiar resultados
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setError("");
      return;
    }

    // Crear nuevo timeout para búsqueda automática
    const timeout = setTimeout(() => {
      if (searchTerm.trim().length >= 2) { // Solo buscar si hay al menos 2 caracteres
        handleSearch(searchTerm);
      }
    }, 500); 

    setSearchTimeout(timeout);

    // Cleanup function
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [searchTerm]);

  // Cargar clientes cuando se carga el componente
  useEffect(() => {
    loadClients();
  }, []);

  // Cerrar dropdown de clientes al hacer click fuera o presionar Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.client-search-container')) {
        setShowClientResults(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowClientResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Búsqueda de clientes mientras escribes
  const handleClientSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setClientSearchResults([]);
      setShowClientResults(false);
      return;
    }

    const filteredClients = clients.filter((client) =>
      client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setClientSearchResults(filteredClients);
    setShowClientResults(true);
  };



  //CLIENTES
  //cargar lista de clientes desde la API
  const loadClients = async () => {
    try {
      const response = await getPersons();
      
      // Filtrar solo clientes activos y ordenar por nombre
      const activeClients = response.persons
        ?.filter((client: any) => client.active === true)
        ?.sort((a: any, b: any) => a.name.localeCompare(b.name)) || [];
      
      setClients(activeClients);
    } catch (error: any) {
      console.error("Error al cargar clientes:", error);
      // Si hay error, mantener array vacío
      setClients([]);
    }
  };

  //finalizar venta
  const handleFinalizeSale = async () => {
    if (cartItems.length === 0) {
      alert("El carrito está vacío");
      return;
    }

    if (!selectedPaymentMethod) {
      alert("Por favor seleccione un método de pago");
      return;
    }

    if (!selectedClient) {
      alert("Por favor seleccione un cliente");
      return;
    }

    setIsProcessingPayment(true);

    try {
      // 1. Crear la transacción
      const transactionData = {
        date: new Date().toISOString().split('T')[0],
        is_sale: true,
        person_id: parseInt(selectedClient),
        transport_id: null, 
        tax_type: "Consumidor Final",
        tracking_number: null
      };

      console.log("Creando transacción:", transactionData);
      const transaction = await createTransaction(transactionData);
      console.log("Transacción creada:", transaction);
      console.log("Transaction ID:", transaction.transaction?.transaction_id || transaction.transaction_id);

      // 2. Crear los items de la transacción
      console.log("Creando items de la transacción...");
      const transactionId = transaction.transaction?.transaction_id || transaction.transaction_id;
      console.log("Transaction ID para items:", transactionId);
      
      for (const item of cartItems) {
        const itemData = {
          transaction_id: transactionId,
          product_id: item.id, // Usar el id del item como product_id
          quantity: item.cantidad,
          price: item.precio,
          
        };

        console.log("Creando item:", itemData);
        const itemResponse = await createItem(itemData);
        console.log("Item creado:", itemResponse);
      }

  

      
   

      // 4. Limpiar el formulario
      setCartItems([]);
      setSelectedPaymentMethod("");
      setSelectedClient("");
      setClientSearchTerm("");
      setPaymentAmount(0);
      setPaymentNote("");
      
      alert("Venta finalizada exitosamente!");

    } catch (error: any) {
      console.error("Error al finalizar la venta:", error);
      alert("Error al finalizar la venta: " + (error.message || "Error desconocido"));
    } finally {
      setIsProcessingPayment(false);
    }
  };

  //cambio de metodo de pago
  const handlePaymentMethodChange = (method: string) => {
    setSelectedPaymentMethod(method);
    
    // Si es credito, ajustar la fecha
    if (method === "Credito") {
      const creditDate = new Date();
      creditDate.setDate(creditDate.getDate() + 30);
      setPaymentDate(creditDate.toISOString().split('T')[0]);
    } else {
      setPaymentDate(new Date().toISOString().split('T')[0]);
    }
  };
  
  const validatePayment = () => {
    if (cartItems.length === 0) {
      alert("El carrito está vacío");
      return false;
    }
    
    if (!selectedPaymentMethod) {
      alert("Por favor seleccione un método de pago");
      return false;
    }
    
    return true;
  };

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
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1"
                  />
                  <Button onClick={handleSearchButton} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Buscar
                  </Button>
                </div>

                {/* Mensaje de error  */}
                {error && (
                  <div className="text-amber-600 text-sm bg-amber-50 border border-amber-200 p-3 rounded-md mb-4 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                )}

                {/* Resultados de búsqueda */}
                {searchResults.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">Productos encontrados:</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead className="text-right">Precio</TableHead>
                          <TableHead className="text-right">Stock</TableHead>
                          <TableHead className="text-right">Cantidad</TableHead>
                          <TableHead className="text-right">Acción</TableHead>
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
                              <Input
                                type="number"
                                min="1"
                                max={product.stock}
                                className="w-16 text-right"
                                onChange={(e) => {
                                  const qty = Number(e.target.value);
                                  if (qty > 0 && qty <= product.stock) {
                                    const newItem = {
                                      id: product.product_id,
                                      codigo: product.code,
                                      nombre: product.name,
                                      precio: product.purchase_price,
                                      cantidad: qty,
                                      total: product.purchase_price * qty,
                                    };
                                    setCartItems([...cartItems, newItem]);
                                    setSearchResults([]);
                                    setSearchTerm("");
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newItem = {
                                    id: product.product_id, 
                                    codigo: product.code,
                                    nombre: product.name,
                                    precio: product.purchase_price,
                                    cantidad: 1,
                                    total: product.purchase_price,
                                  };
                                  setCartItems([...cartItems, newItem]);
                                  setSearchResults([]);
                                  setSearchTerm("");
                                }}
                              >
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
                  <div className="relative client-search-container">
                    <Input
                      placeholder="Buscar cliente por nombre o empresa..."
                      value={clientSearchTerm}
                      onChange={(e) => {
                        setClientSearchTerm(e.target.value);
                        handleClientSearch(e.target.value);
                      }}
                      onFocus={() => {
                        if (clientSearchTerm.trim()) {
                          setShowClientResults(true);
                        }
                      }}
                    />
                    
                    {/* Resultados de búsqueda de clientes */}
                    {showClientResults && clientSearchResults.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {clientSearchResults.map((client) => (
                          <div
                            key={client.person_id}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                            onClick={() => {
                              setSelectedClient(client.person_id.toString());
                              setClientSearchTerm(client.name);
                              setShowClientResults(false);
                            }}
                          >
                            <div className="font-medium">{client.name}</div>
                            <div className="text-sm text-gray-500">{client.company_name}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Cliente seleccionado */}
                    {selectedClient && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                        <div className="text-sm text-green-800">
                          Cliente seleccionado: {clients.find(c => c.person_id.toString() === selectedClient)?.name}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Método de Pago</Label>
                  <Select 
                    value={selectedPaymentMethod} 
                    onValueChange={setSelectedPaymentMethod}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Efectivo">Efectivo</SelectItem>
                      <SelectItem value="Transferencia">Transferencia Bancaria</SelectItem>
                      <SelectItem value="Tarjeta">Tarjeta de Crédito/Débito</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                      <SelectItem value="Credito">Crédito (30 días)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Fecha de Pago</Label>
                  <Input 
                    type="date" 
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notas</Label>
                  <Input 
                    placeholder="Agregar notas a la venta..." 
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                  />
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${total.toLocaleString("es-AR")}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span>IVA (21%)</span>
                    <span>${calculateTax().toLocaleString("es-AR")}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg mt-4">
                    <span>Total</span>
                    <span>${calculateTotalWithTax().toLocaleString("es-AR")}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleFinalizeSale}
                  disabled={isProcessingPayment || cartItems.length === 0}
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Finalizar Venta
                    </>
                  )}
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
