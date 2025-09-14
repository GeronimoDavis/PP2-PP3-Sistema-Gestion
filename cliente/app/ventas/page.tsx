"use client";

import { Label } from "@/components/ui/label";

import { useEffect, useState } from "react";
import {
  Download,
  Plus,
  ShoppingCart,
  Trash2,
  Search,
  Eye,
  Calendar,
  User,
  X,
} from "lucide-react";
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
} from "@/components/ui/dialog";
import {
  getProductByCode,
  getProductByName,
  updateProductStock,
} from "@/api/productsApi";
import { Loader2 } from "lucide-react";
import { createTransaction } from "@/api/transactionsApi";
import { createPayment } from "@/api/paymentsApi";
import { getPersons } from "@/api/personsApi";
import { createItem } from "@/api/itemsApi";
import { getSalesHistory, getSaleDetails } from "@/api/transactionsApi";
import { format } from "date-fns";

// Interfaces TypeScript para los tipos de datos
interface SaleItem {
  item_id: number;
  transaction_id: number;
  product_id: number;
  quantity: number;
  price: number;
  product_name: string;
  product_code: string;
  product_cost: number;
}

interface SaleExtra {
  extra_id: number;
  transaction_id: number;
  type: string;
  price: number;
  note: string;
}

interface SalePayment {
  payment_id: number;
  transaction_id: number;
  date: string;
  type: string;
  amount: number;
  note: string;
}

interface SaleTransaction {
  transaction_id: number;
  date: string;
  is_sale: boolean;
  person_id: number;
  transport_id: number | null;
  tax_type: string;
  tracking_number: string | null;
  client_name: string;
  client_company: string;
  client_email: string;
  client_phone: string;
  client_tax_id: string;
  transport_company: string | null;
  transport_url: string | null;
}

interface SaleTotals {
  items: number;
  extras: number;
  transaction: number;
  paid: number;
  pending: number;
}

interface SaleDetails {
  transaction: SaleTransaction;
  items: SaleItem[];
  extras: SaleExtra[];
  payments: SalePayment[];
  totals: SaleTotals;
}

interface SalesHistoryItem {
  transaction_id: number;
  date: string;
  client_name: string;
  client_company: string;
  total_transaction: number;
  total_paid: number;
  total_items: number;
  total_extras: number;
  items_count: number;
  extras_count: number;
  payments_count: number;
}

export default function VentasPage() {
  const { user, token, validateToken, loading } = useAuth();

  const router = useRouter(); // Usar el hook useRouter

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
  const [cartItems, setCartItems] = useState<
    Array<{
      id: number;
      codigo: string;
      nombre: string;
      precio: number;
      precioOriginal: number; // Precio original del producto
      cantidad: number;
      total: number;
    }>
  >([]);

  const total = cartItems.reduce((sum, item) => sum + item.total, 0);

  //VENTA
  //busqueda de productos
  const [searchTerm, setSearchTerm] = useState("");
  //lista de productos encontrados
  const [searchResults, setSearchResults] = useState<
    Array<{
      product_id: number;
      code: string;
      name: string;
      sell_price: number;
      stock: number;
    }>
  >([]);
  //estado de carga
  const [isLoading, setIsLoading] = useState(false);
  //error de la busqueda
  const [error, setError] = useState("");
  //cantidades seleccionadas para cada producto
  const [productQuantities, setProductQuantities] = useState<{
    [key: number]: number;
  }>({});
  //debounce para búsqueda automática
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  //PAGO DE LA VENTA
  //metodo de pago
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  //monto de pago
  const [paymentAmount, setPaymentAmount] = useState(0);
  //fecha de pago
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  //nota de pago
  const [paymentNote, setPaymentNote] = useState("");
  //estado de procesamiento de pago
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  //excluir IVA
  const [excludeTax, setExcludeTax] = useState(false);

  //CLIENTES
  //lista de clientes disponibles
  const [clients, setClients] = useState<
    Array<{
      person_id: number;
      name: string;
      email: string;
      phone: string;
      company_name: string;
      active: boolean;
    }>
  >([]);
  //cliente seleccionado para la venta
  const [selectedClient, setSelectedClient] = useState<string>("");
  //búsqueda de clientes
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  //resultados de búsqueda de clientes
  const [clientSearchResults, setClientSearchResults] = useState<
    Array<{
      person_id: number;
      name: string;
      email: string;
      phone: string;
      company_name: string;
      active: boolean;
    }>
  >([]);
  //mostrar resultados de búsqueda de clientes
  const [showClientResults, setShowClientResults] = useState(false);

  // HISTORIAL DE VENTAS
  const [salesHistory, setSalesHistory] = useState<SalesHistoryItem[]>([]);
  const [originalSalesHistory, setOriginalSalesHistory] = useState<
    SalesHistoryItem[]
  >([]);
  const [isLoadingSales, setIsLoadingSales] = useState(false);
  const [salesError, setSalesError] = useState("");
  const [totalSales, setTotalSales] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filtros del historial
  const [salesFilters, setSalesFilters] = useState({
    start_date: "",
    end_date: "",
    client_name: "",
    limit: 10 as number | undefined,
  });

  // Detalles de venta - Corregido el tipo
  const [selectedSale, setSelectedSale] = useState<SaleDetails | null>(null);
  const [showSaleDetails, setShowSaleDetails] = useState(false);
  const [isLoadingSaleDetails, setIsLoadingSaleDetails] = useState(false);

  // calculo de IVA
  const calculateTax = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
    return excludeTax ? 0 : subtotal * 0.21;
  };
  // calculo de total con IVA
  const calculateTotalWithTax = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
    const tax = excludeTax ? 0 : subtotal * 0.21; // 21% IVA
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
        } catch (codeError) {}
      }

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
      setError(
        "Error al buscar productos: " +
          (error.response?.data?.message ||
            error.message ||
            "Error desconocido")
      );
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
      if (searchTerm.trim().length >= 2) {
        // Solo buscar si hay al menos 2 caracteres
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
      if (!target.closest(".client-search-container")) {
        setShowClientResults(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowClientResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Búsqueda de clientes mientras escribes
  const handleClientSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setClientSearchResults([]);
      setShowClientResults(false);
      return;
    }

    const filteredClients = clients.filter(
      (client) =>
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
      const activeClients =
        response.persons
          ?.filter((client: any) => client.active === true)
          ?.sort((a: any, b: any) => a.name.localeCompare(b.name)) || [];

      setClients(activeClients);
    } catch (error: any) {
      console.error("Error al cargar clientes:", error);
      // Si hay error, mantener array vacío
      setClients([]);
    }
  };

  // HISTORIAL DE VENTAS
  const loadSalesHistory = async (filters = salesFilters) => {
    setIsLoadingSales(true);
    setSalesError("");

    try {
      const response = await getSalesHistory(filters);
      const salesData = response.sales || [];
      setSalesHistory(salesData);
      setOriginalSalesHistory(salesData);
      setTotalSales(response.total || 0);
    } catch (error: any) {
      console.error("Error al cargar historial de ventas:", error.message);
      setSalesError("Error al cargar el historial de ventas");
      setSalesHistory([]);
      setOriginalSalesHistory([]);
      setTotalSales(0);
    } finally {
      setIsLoadingSales(false);
    }
  };

  const handleSalesFilterChange = (key: string, value: string) => {
    setSalesFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSalesSearch = () => {
    loadSalesHistory(salesFilters);
  };

  const handleClearSalesFilters = () => {
    const newFilters = {
      start_date: "",
      end_date: "",
      client_name: "",
      limit: 10,
      offset: 0,
    };
    setSalesFilters(newFilters);
    setCurrentPage(1);
    loadSalesHistory(newFilters);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const limit = salesFilters.limit || 10;
    const offset = (page - 1) * limit;

    const newFilters = {
      ...salesFilters,
      offset: offset,
    };

    setSalesFilters(newFilters);
    loadSalesHistory(newFilters);
  };

  const handleLimitChange = (newLimit: number) => {
    setCurrentPage(1);
    const newFilters = {
      ...salesFilters,
      limit: newLimit,
      offset: 0,
    };
    setSalesFilters(newFilters);
    loadSalesHistory(newFilters);
  };

  const totalPages = Math.ceil(totalSales / (salesFilters.limit || 10));

  const handleViewSaleDetails = async (transactionId: number) => {
    setIsLoadingSaleDetails(true);
    try {
      const response = await getSaleDetails(transactionId);
      setSelectedSale(response);
      setShowSaleDetails(true);
    } catch (error: any) {
      console.error("Error al cargar detalles de la venta:", error);
      alert("Error al cargar los detalles de la venta");
    } finally {
      setIsLoadingSaleDetails(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    // La cadena 'YYYY-MM-DD' se interpreta como medianoche UTC.
    const date = new Date(dateString);
    // Agregamos el desfase de la zona horaria del usuario para corregir la fecha a la local.
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return format(date, "dd/MM/yyyy");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);
  };

  const getPaymentStatus = (totalTransaction: number, totalPaid: number) => {
    if (totalPaid >= totalTransaction) {
      return { status: "Pagado", color: "bg-green-100 text-green-800" };
    } else if (totalPaid > 0) {
      return { status: "Parcial", color: "bg-yellow-100 text-yellow-800" };
    } else {
      return { status: "Pendiente", color: "bg-red-100 text-red-800" };
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
        date: new Date().toISOString().split("T")[0],
        is_sale: true,
        person_id: parseInt(selectedClient),
        transport_id: null,
        tax_type: "Consumidor Final",
        tracking_number: null,
      };

      const transaction = await createTransaction(transactionData);

      // 2. Crear los items de la transacción
      const transactionId =
        transaction.transaction?.transaction_id || transaction.transaction_id;

      for (const item of cartItems) {
        const itemData = {
          transaction_id: transactionId,
          product_id: item.id, // Usar el id del item como product_id
          quantity: item.cantidad,
          price: excludeTax ? item.precio : item.precio * 1.21,
        };

        await createItem(itemData);

        // Actualizar el stock del producto
        await updateProductStock(item.id, item.cantidad);
      }

      // 4. Limpiar el formulario
      setCartItems([]);
      setSelectedPaymentMethod("");
      setSelectedClient("");
      setClientSearchTerm("");
      setPaymentAmount(0);
      setPaymentNote("");
      setSearchResults([]);
      setSearchTerm("");
      setError("");
      setProductQuantities({});

      // 5. Recargar el historial de ventas
      loadSalesHistory(salesFilters);

      alert("Venta finalizada exitosamente!");
    } catch (error: any) {
      console.error("Error al finalizar la venta:", error);
      alert(
        "Error al finalizar la venta: " + (error.message || "Error desconocido")
      );
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
      setPaymentDate(creditDate.toISOString().split("T")[0]);
    } else {
      setPaymentDate(new Date().toISOString().split("T")[0]);
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

  // Función para restaurar precio original
  const restoreOriginalPrice = (productId: number) => {
    setCartItems(
      cartItems.map((item) => {
        if (item.id === productId) {
          return {
            ...item,
            precio: item.precioOriginal,
            total: item.precioOriginal * item.cantidad,
          };
        }
        return item;
      })
    );
  };

  // Función para verificar si el precio fue modificado
  const isPriceModified = (item: any) => {
    return item.precio !== item.precioOriginal;
  };

  // Función para recargar los resultados de búsqueda
  const reloadSearchResults = async () => {
    if (searchTerm.trim()) {
      await handleSearch(searchTerm);
    }
  };

  // Función para verificar si un producto ya está en el carrito
  const isProductInCart = (productId: number) => {
    return cartItems.some((item) => item.id === productId);
  };

  // Función para obtener la cantidad total de un producto en el carrito
  const getProductQuantityInCart = (productId: number) => {
    return cartItems.reduce((total, item) => {
      return item.id === productId ? total + item.cantidad : total;
    }, 0);
  };

  // Función para verificar si hay stock disponible
  const hasAvailableStock = (product: any, requestedQuantity: number = 1) => {
    const quantityInCart = getProductQuantityInCart(product.product_id);
    return product.stock > quantityInCart + requestedQuantity - 1;
  };

  // Función para manejar el cambio de cantidad de un producto
  const handleQuantityChange = (productId: number, quantity: number) => {
    setProductQuantities((prev) => ({
      ...prev,
      [productId]: quantity,
    }));
  };

  // Función para agregar o actualizar producto en el carrito
  const addOrUpdateProductInCart = (product: any, quantity: number) => {
    const existingItemIndex = cartItems.findIndex(
      (item) => item.id === product.product_id
    );

    if (existingItemIndex !== -1) {
      // Si el producto ya existe, actualizar la cantidad
      const updatedItems = [...cartItems];
      const existingItem = updatedItems[existingItemIndex];
      const newQuantity = existingItem.cantidad + quantity;
      updatedItems[existingItemIndex] = {
        ...existingItem,
        cantidad: newQuantity,
        total: existingItem.precio * newQuantity,
      };
      setCartItems(updatedItems);
    } else {
      // Si el producto no existe, agregarlo como nuevo item
      const newItem = {
        id: product.product_id, // ID del producto
        codigo: product.code, // Código del producto
        nombre: product.name, // Nombre del producto
        precio: product.sell_price, // Precio de venta
        precioOriginal: product.sell_price, // Guardar precio original
        cantidad: quantity, // Cantidad del producto
        total: product.sell_price * quantity, // Total del producto
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  // Cargar historial cuando se cambia de tab
  useEffect(() => {
    if (salesHistory.length === 0 && !loading && token) {
      loadSalesHistory(salesFilters);
    }
  }, [loading, token, user]);

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
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSearchButton}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
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
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {error}
                  </div>
                )}

                {/* Resultados de búsqueda */}
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
                          <TableHead className="text-right">Precio</TableHead>
                          <TableHead className="text-right">Stock</TableHead>
                          <TableHead className="text-right">Cantidad</TableHead>
                          <TableHead className="text-right">Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {searchResults.map((product) => {
                          const availableStock = Math.max(
                            0,
                            product.stock -
                              getProductQuantityInCart(product.product_id)
                          );
                          const hasStock = hasAvailableStock(product);

                          return (
                            <TableRow
                              key={product.product_id}
                              className={
                                !hasStock ? "opacity-50 bg-gray-50" : ""
                              }
                            >
                              <TableCell className="font-medium">
                                {product.code}
                              </TableCell>
                              <TableCell>{product.name}</TableCell>
                              <TableCell className="text-right">
                                $
                                {product.sell_price?.toLocaleString("es-AR") ||
                                  "0"}
                              </TableCell>
                              <TableCell className="text-right">
                                <span
                                  className={
                                    !hasStock ? "text-red-600 font-medium" : ""
                                  }
                                >
                                  {Math.max(
                                    0,
                                    product.stock -
                                      getProductQuantityInCart(
                                        product.product_id
                                      )
                                  )}
                                </span>
                                {!hasStock && (
                                  <div className="text-xs text-red-500 mt-1">
                                    Sin stock disponible
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  min="1"
                                  max={Math.max(
                                    0,
                                    product.stock -
                                      getProductQuantityInCart(
                                        product.product_id
                                      )
                                  )}
                                  className="w-16 text-right"
                                  disabled={!hasAvailableStock(product)}
                                  placeholder="1"
                                  value={
                                    productQuantities[product.product_id] || 1
                                  }
                                  onChange={(e) => {
                                    const qty = Number(e.target.value);
                                    if (qty > 0) {
                                      handleQuantityChange(
                                        product.product_id,
                                        qty
                                      );
                                    }
                                  }}
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={!hasAvailableStock(product)}
                                  onClick={async () => {
                                    const quantity =
                                      productQuantities[product.product_id] ||
                                      1;
                                    const availableStock = Math.max(
                                      0,
                                      product.stock -
                                        getProductQuantityInCart(
                                          product.product_id
                                        )
                                    );

                                    if (
                                      quantity > 0 &&
                                      quantity <= availableStock
                                    ) {
                                      addOrUpdateProductInCart(
                                        product,
                                        quantity
                                      );

                                      // Limpiar después de agregar
                                      setTimeout(() => {
                                        setSearchResults([]);
                                        setSearchTerm("");
                                        setProductQuantities({});
                                      }, 50);
                                    }
                                  }}
                                >
                                  Agregar
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
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
                        <TableCell className="text-right align-middle">
                          <div className="flex items-center justify-end space-x-2">
                            <div className="relative">
                              <Input
                                type="number"
                                value={item.precio}
                                onChange={(e) => {
                                  const newPrice =
                                    parseFloat(e.target.value) || 0;
                                  setCartItems(
                                    cartItems.map((cartItem) => {
                                      if (cartItem.id === item.id) {
                                        return {
                                          ...cartItem,
                                          precio: newPrice,
                                          total: newPrice * cartItem.cantidad,
                                        };
                                      }
                                      return cartItem;
                                    })
                                  );
                                }}
                                min="0"
                                step="0.01"
                                className={`w-24 text-right h-8 ${
                                  isPriceModified(item)
                                    ? "border-orange-300 bg-orange-50"
                                    : ""
                                }`}
                              />
                              {isPriceModified(item) && (
                                <div className="absolute -top-1 -right-1">
                                  <div
                                    className="w-2 h-2 bg-orange-500 rounded-full"
                                    title="Precio modificado"
                                  ></div>
                                </div>
                              )}
                            </div>
                            {isPriceModified(item) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => restoreOriginalPrice(item.id)}
                                className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700"
                                title="Restaurar precio original"
                              >
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                  />
                                </svg>
                              </Button>
                            )}
                          </div>
                          {isPriceModified(item) && (
                            <div className="text-xs text-orange-600 mt-1 text-right">
                              Original: $
                              {item.precioOriginal.toLocaleString("es-AR")}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right align-middle">
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
                            className="w-16 text-right h-8"
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
                            <div className="text-sm text-gray-500">
                              {client.company_name}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Cliente seleccionado */}
                    {selectedClient && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                        <div className="text-sm text-green-800">
                          Cliente seleccionado:{" "}
                          {
                            clients.find(
                              (c) => c.person_id.toString() === selectedClient
                            )?.name
                          }
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
                      <SelectItem value="Transferencia">
                        Transferencia Bancaria
                      </SelectItem>
                      <SelectItem value="Tarjeta">
                        Tarjeta de Crédito/Débito
                      </SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                      <SelectItem value="Credito30">
                        Crédito (30 días)
                      </SelectItem>
                      <SelectItem value="Credito60">
                        Crédito (60 días)
                      </SelectItem>
                      <SelectItem value="Credito90">
                        Crédito (90 días)
                      </SelectItem>
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
                  {/* Indicador para precios modificados */}
                  {cartItems.some((item) => isPriceModified(item)) && (
                    <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded-md">
                      <div className="flex items-center text-orange-700 text-sm">
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="font-medium">
                          Venta con precio modificado
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${total.toLocaleString("es-AR")}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <div className="flex items-center space-x-2">
                      <span>IVA (21%)</span>
                      <input
                        type="checkbox"
                        id="excludeTax"
                        checked={excludeTax}
                        onChange={(e) => setExcludeTax(e.target.checked)}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="excludeTax"
                        className="text-sm text-gray-500"
                      >
                        Excluir
                      </label>
                    </div>
                    <span>${calculateTax().toLocaleString("es-AR")}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg mt-4">
                    <span>Total</span>
                    <span>
                      ${calculateTotalWithTax().toLocaleString("es-AR")}
                    </span>
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

              {/* Filtros */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Fecha Desde</Label>
                  <Input
                    type="date"
                    value={salesFilters.start_date}
                    onChange={(e) =>
                      handleSalesFilterChange("start_date", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha Hasta</Label>
                  <Input
                    type="date"
                    value={salesFilters.end_date}
                    onChange={(e) =>
                      handleSalesFilterChange("end_date", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Input
                    placeholder="Buscar por cliente..."
                    onChange={(e) => {
                      const searchTerm = e.target.value.toLowerCase();
                      if (searchTerm === "") {
                        setSalesHistory(originalSalesHistory);
                      } else {
                        const filteredSales = originalSalesHistory.filter(
                          (sale) =>
                            sale.client_name
                              .toLowerCase()
                              .includes(searchTerm) ||
                            sale.client_company
                              ?.toLowerCase()
                              .includes(searchTerm) ||
                            sale.transaction_id.toString().includes(searchTerm)
                        );
                        setSalesHistory(filteredSales);
                      }
                      setCurrentPage(1); // Reset a la primera página
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <div className="flex gap-2">
                    <Button onClick={handleSalesSearch} className="flex-1">
                      <Search className="mr-2 h-4 w-4" />
                      Buscar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleClearSalesFilters}
                      className="px-3"
                    >
                      Limpiar filtros
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingSales ? (
                <Card>
                  <CardContent className="p-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                      <p className="mt-2 text-gray-600">
                        Cargando historial de ventas...
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : salesError ? (
                <Card>
                  <CardContent className="p-8">
                    <div className="text-center">
                      <p className="text-red-600">{salesError}</p>
                      <Button
                        onClick={loadSalesHistory}
                        className="mt-4 bg-blue-600 hover:bg-blue-700"
                      >
                        Reintentar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : salesHistory.length === 0 ? (
                <Card>
                  <CardContent className="p-8">
                    <div className="text-center">
                      <p className="text-gray-600">No se encontraron ventas</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Nº Venta</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Pagado</TableHead>
                        <TableHead className="text-right">Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesHistory.map((sale) => {
                        const paymentStatus = getPaymentStatus(
                          sale.total_transaction,
                          sale.total_paid
                        );
                        return (
                          <TableRow key={sale.transaction_id}>
                            <TableCell className="font-medium">
                              #{sale.transaction_id}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {sale.client_name}
                                </div>
                                {sale.client_company && (
                                  <div className="text-sm text-muted-foreground">
                                    {sale.client_company}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{formatDate(sale.date)}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(sale.total_transaction)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(sale.total_paid)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge className={paymentStatus.color}>
                                {paymentStatus.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleViewSaleDetails(sale.transaction_id)
                                }
                                disabled={isLoadingSaleDetails}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  {/* Paginación local */}
                  {salesHistory.length > 0 && (
                    <div className="flex items-center justify-between px-2 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-700">Mostrar:</span>
                        <Select
                          value={(salesFilters.limit || 10).toString()}
                          onValueChange={(value) => {
                            handleLimitChange(parseInt(value));
                          }}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="text-sm text-gray-700">
                          Mostrando{" "}
                          {(currentPage - 1) * (salesFilters.limit || 10) + 1} a{" "}
                          {Math.min(
                            currentPage * (salesFilters.limit || 10),
                            totalSales
                          )}{" "}
                          de {totalSales} ventas
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(1)}
                          disabled={currentPage === 1}
                        >
                          Primera
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Anterior
                        </Button>

                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
                            const page = i + 1;
                            return (
                              <Button
                                key={page}
                                variant={
                                  currentPage === page ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => handlePageChange(page)}
                              >
                                {page}
                              </Button>
                            );
                          }
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Siguiente
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(totalPages)}
                          disabled={currentPage === totalPages}
                        >
                          Última
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Detalles de Venta */}
      <Dialog open={showSaleDetails} onOpenChange={setShowSaleDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detalles de Venta #{selectedSale?.transaction?.transaction_id}
            </DialogTitle>
          </DialogHeader>

          {isLoadingSaleDetails ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Cargando detalles...</span>
            </div>
          ) : selectedSale ? (
            <div className="space-y-6">
              {/* Información del Cliente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold mb-2">
                    Información del Cliente
                  </h3>
                  <p>
                    <strong>Nombre:</strong>{" "}
                    {selectedSale.transaction.client_name}
                  </p>
                  <p>
                    <strong>Empresa:</strong>{" "}
                    {selectedSale.transaction.client_company}
                  </p>
                  <p>
                    <strong>Email:</strong>{" "}
                    {selectedSale.transaction.client_email}
                  </p>
                  <p>
                    <strong>Teléfono:</strong>{" "}
                    {selectedSale.transaction.client_phone}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">
                    Información de la Venta
                  </h3>
                  <p>
                    <strong>Fecha:</strong>{" "}
                    {formatDate(selectedSale.transaction.date)}
                  </p>
                  <p>
                    <strong>Tipo de Impuesto:</strong>{" "}
                    {selectedSale.transaction.tax_type}
                  </p>
                  {selectedSale.transaction.tracking_number && (
                    <p>
                      <strong>Número de Seguimiento:</strong>{" "}
                      {selectedSale.transaction.tracking_number}
                    </p>
                  )}
                  {selectedSale.transaction.transport_company && (
                    <p>
                      <strong>Transporte:</strong>{" "}
                      {selectedSale.transaction.transport_company}
                    </p>
                  )}
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-semibold mb-3">Productos</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Precio Unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedSale.items.map((item: any) => (
                      <TableRow key={item.item_id}>
                        <TableCell className="font-medium">
                          {item.product_code}
                        </TableCell>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell className="text-right">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.price)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.quantity * item.price)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Extras */}
              {selectedSale.extras.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Cargos Adicionales</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedSale.extras.map((extra: any) => (
                        <TableRow key={extra.extra_id}>
                          <TableCell className="font-medium">
                            {extra.type}
                          </TableCell>
                          <TableCell>{extra.note}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(extra.price)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagos */}
              <div>
                <h3 className="font-semibold mb-3">Pagos</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedSale.payments.map((payment: any) => (
                      <TableRow key={payment.payment_id}>
                        <TableCell>{formatDate(payment.date)}</TableCell>
                        <TableCell className="font-medium">
                          {payment.type}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Resumen */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-3">Resumen</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p>
                      <strong>Subtotal Productos:</strong>{" "}
                      {formatCurrency(selectedSale.totals.items)}
                    </p>
                    <p>
                      <strong>Cargos Adicionales:</strong>{" "}
                      {formatCurrency(selectedSale.totals.extras)}
                    </p>
                    <p className="text-lg font-bold">
                      Total: {formatCurrency(selectedSale.totals.transaction)}
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong>Total Pagado:</strong>{" "}
                      {formatCurrency(selectedSale.totals.paid)}
                    </p>
                    <p>
                      <strong>Pendiente:</strong>{" "}
                      {formatCurrency(selectedSale.totals.pending)}
                    </p>
                    <Badge
                      className={
                        getPaymentStatus(
                          selectedSale.totals.transaction,
                          selectedSale.totals.paid
                        ).color
                      }
                    >
                      {
                        getPaymentStatus(
                          selectedSale.totals.transaction,
                          selectedSale.totals.paid
                        ).status
                      }
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaleDetails(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
