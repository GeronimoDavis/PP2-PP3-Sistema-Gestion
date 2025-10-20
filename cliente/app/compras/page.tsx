"use client";

import { Label } from "@/components/ui/label";

import { useEffect, useState, useMemo } from "react";
import {
  Plus,
  ShoppingBag,
  Trash2,
  Search,
  X,
  Eye,
  Download,
  Banknote,
} from "lucide-react";
import { useNotification } from "@/hooks/use-notification";
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
import { Textarea } from "@/components/ui/textarea";
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

import {
  getProducts,
  getProductByCode,
  getProductByName,
  updateProductStockForPurchase,
} from "@/api/productsApi";
import { getAllActiveProviders } from "@/api/personsApi";
import {
  createPurchase,
  getPurchasesHistory,
  getPurchaseDetails,
} from "@/api/transactionsApi";

import { createItem } from "@/api/itemsApi";
import { createPayment } from "@/api/paymentsApi";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

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

interface PurchaseHistoryItem {
  transaction_id: number;
  date: string;
  provider_name: string;
  provider_company: string;
  total_transaction: number;
  items_count: number;
}

interface Provider {
  person_id: number;
  name: string;
  company_name: string;
  phone: string;
  email: string;
  active: boolean;
}

// Interfaces para los detalles de compra
interface PurchaseItem {
  item_id: number;
  transaction_id: number;
  product_id: number;
  quantity: number;
  price: number;
  product_name: string;
  product_code: string;
  product_cost: number;
}

interface PurchaseTransaction {
  transaction_id: number;
  date: string;
  is_sale: boolean;
  person_id: number;
  transport_id: number | null;
  tax_type: string;
  tracking_number: string | null;
  provider_name: string;
  provider_company: string;
  provider_email: string;
  provider_phone: string;
  provider_tax_id: string;
  transport_company: string | null;
  transport_url: string | null;
}

interface PurchaseTotals {
  items: number;
  transaction: number;
}

interface PurchaseDetails {
  transaction: PurchaseTransaction;
  items: PurchaseItem[];
  totals: PurchaseTotals;
}

// Interfaces para pagos
interface Payment {
  payment_id: number;
  transaction_id: number;
  amount: number;
  type: string;
  date: string;
  note: string;
}

interface PurchaseHistoryItemWithPayments extends PurchaseHistoryItem {
  total_paid: number;
  payment_status: string;
}

export default function ComprasPage() {
  const { user, token, validateToken, loading } = useAuth();
  const notification = useNotification();
  const router = useRouter();

  // COMPRA
  // items del carrito
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  // PROVEEDORES
  // lista de proveedores disponibles
  const [providers, setProviders] = useState<
    Array<{
      person_id: number;
      name: string;
      email: string;
      phone: string;
      company_name: string;
      active: boolean;
    }>
  >([]);
  // proveedor seleccionado para la compra
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  // búsqueda de proveedores
  const [providerSearchTerm, setProviderSearchTerm] = useState("");
  // resultados de búsqueda de proveedores
  const [providerSearchResults, setProviderSearchResults] = useState<
    Array<{
      person_id: number;
      name: string;
      email: string;
      phone: string;
      company_name: string;
      active: boolean;
    }>
  >([]);
  // mostrar resultados de búsqueda de proveedores
  const [showProviderResults, setShowProviderResults] = useState(false);
  // metodo de pago
  const [paymentMethod, setPaymentMethod] = useState("");
  // PAGO INICIAL DE LA COMPRA
  //monto de pago inicial
  const [paymentAmount, setPaymentAmount] = useState(0);
  //fecha de pago inicial
  const [paymentDate, setPaymentDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  //nota de pago inicial
  const [paymentNote, setPaymentNote] = useState("");
  // fecha de compra
  const [purchaseDate, setPurchaseDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  // notas
  const [notes, setNotes] = useState("");
  // IVA
  const [excludeTax, setExcludeTax] = useState(false);
  // Estado de procesamiento de compra
  const [isProcessingPurchase, setIsProcessingPurchase] = useState(false);
  // Errores de validación en tiempo real
  const [cartItemErrors, setCartItemErrors] = useState<{
    [key: number]: { price?: string; quantity?: string };
  }>({});

  // HISTORIAL DE COMPRAS
  const [purchasesHistory, setPurchasesHistory] = useState<
    PurchaseHistoryItemWithPayments[]
  >([]);
  // historial de compras original
  const [originalPurchasesHistory, setOriginalPurchasesHistory] = useState<
    PurchaseHistoryItemWithPayments[]
  >([]);
  // estado de carga de historial de compras
  const [isLoadingPurchases, setIsLoadingPurchases] = useState(false);
  // error de historial de compras
  const [purchasesError, setPurchasesError] = useState("");
  // total de compras
  const [totalPurchases, setTotalPurchases] = useState(0);
  // página actual de historial de compras
  const [currentPurchasesPage, setCurrentPurchasesPage] = useState(1);
  // items por página de historial de compras
  const [purchasesItemsPerPage, setPurchasesItemsPerPage] = useState(10);

  // Filtros del historial de compras
  const [purchasesFilters, setPurchasesFilters] = useState({
    start_date: "",
    end_date: "",
    provider_name: "",
    limit: 10 as number | undefined,
    sort_by: "date",
    sort_direction: "desc",
  });

  // Detalles de compra
  const [selectedPurchase, setSelectedPurchase] =
    useState<PurchaseDetails | null>(null);
  const [showPurchaseDetails, setShowPurchaseDetails] = useState(false);
  const [isLoadingPurchaseDetails, setIsLoadingPurchaseDetails] =
    useState(false);

  // Estados para pagos
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPurchaseForPayment, setSelectedPurchaseForPayment] =
    useState<PurchaseHistoryItemWithPayments | null>(null);
  const [newPaymentAmount, setNewPaymentAmount] = useState(0);
  const [newPaymentMethod, setNewPaymentMethod] = useState("");
  const [newPaymentDate, setNewPaymentDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [newPaymentNote, setNewPaymentNote] = useState("");
  const [isProcessingNewPayment, setIsProcessingNewPayment] = useState(false);
  const [purchasePayments, setPurchasePayments] = useState<Payment[]>([]);
  const [showPaymentConfirmationModal, setShowPaymentConfirmationModal] =
    useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState<any>(null);

  const requestPurchasesSort = (key: string) => {
    const newDirection =
      purchasesFilters.sort_by === key &&
      purchasesFilters.sort_direction === "asc"
        ? "desc"
        : "asc";

    setPurchasesFilters((prev) => ({
      ...prev,
      sort_by: key,
      sort_direction: newDirection,
    }));
  };

  const getPurchasesSortIndicator = (key: string) => {
    if (purchasesFilters.sort_by !== key) {
      return null;
    }
    return purchasesFilters.sort_direction === "asc" ? " ▲" : " ▼";
  };

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

  // Cálculos de IVA
  const calculateTax = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
    return excludeTax ? 0 : subtotal * 0.21;
  };

  const calculateTotalWithTax = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
    const tax = excludeTax ? 0 : subtotal * 0.21; // 21% IVA
    return subtotal + tax;
  };

  // funcion para validar la compra
  const validatePurchase = () => {
    const errors: string[] = [];

    // Validar que haya productos en el carrito
    if (cartItems.length === 0) {
      errors.push("El carrito está vacío");
    }

    // Validar proveedor seleccionado
    if (!selectedProvider) {
      errors.push("Debe seleccionar un proveedor de la lista");
    }

    // Validar método de pago
    if (!paymentMethod) {
      errors.push("Debe seleccionar un método de pago");
    }

    // Validar pago inicial si se especifica un monto
    if (paymentAmount > 0 && !paymentMethod) {
      errors.push("Por favor seleccione un método de pago");
    }

    // Validar fecha de compra
    if (!purchaseDate) {
      errors.push("Debe seleccionar una fecha de compra");
    } else {
      const selectedDate = new Date(purchaseDate);
      const today = new Date();
      const maxFutureDate = new Date();
      maxFutureDate.setFullYear(today.getFullYear() + 1); // Máximo 1 año en el futuro

      if (selectedDate > maxFutureDate) {
        errors.push(
          "La fecha de compra no puede ser más de 1 año en el futuro"
        );
      }
    }

    // Verificar si hay errores en los campos del carrito
    const hasCartErrors = Object.values(cartItemErrors).some(
      (error) => error.price || error.quantity
    );

    if (hasCartErrors) {
      errors.push(
        "Hay errores en los campos del carrito. Por favor, corríjalos antes de continuar"
      );
    }

    // Validar productos individuales
    cartItems.forEach((item, index) => {
      if (isNaN(item.precioCompra) || item.precioCompra <= 0) {
        errors.push(`El producto "${item.nombre}" tiene un precio inválido`);
      }
      if (isNaN(item.cantidad) || item.cantidad <= 0) {
        errors.push(`El producto "${item.nombre}" tiene una cantidad inválida`);
      }
      if (isNaN(item.total) || item.total <= 0) {
        errors.push(`El producto "${item.nombre}" tiene un total inválido`);
      }
    });

    return errors;
  };

  // COMPRA
  // eliminar item del carrito
  const removeItem = (id: number) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
    // Limpiar errores del item eliminado
    setCartItemErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[id];
      return newErrors;
    });
  };

  // actualizar cantidad del item
  const updateQuantity = (id: number, cantidad: number) => {
    // Limpiar error previo
    setCartItemErrors((prev) => ({
      ...prev,
      [id]: { ...prev[id], quantity: undefined },
    }));

    // Validar cantidad
    if (isNaN(cantidad)) {
      setCartItemErrors((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          quantity: "La cantidad debe ser un número válido",
        },
      }));
      return;
    }

    if (cantidad <= 0) {
      setCartItemErrors((prev) => ({
        ...prev,
        [id]: { ...prev[id], quantity: "La cantidad debe ser mayor a 0" },
      }));
      return;
    }

    if (cantidad > 999999999) {
      setCartItemErrors((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          quantity: "La cantidad no puede ser mayor a 999,999,999",
        },
      }));
      return;
    }

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
    // Limpiar error previo
    setCartItemErrors((prev) => ({
      ...prev,
      [id]: { ...prev[id], price: undefined },
    }));

    // Validar precio
    if (isNaN(precioCompra)) {
      setCartItemErrors((prev) => ({
        ...prev,
        [id]: { ...prev[id], price: "El precio debe ser un número válido" },
      }));
      return;
    }

    if (precioCompra <= 0) {
      setCartItemErrors((prev) => ({
        ...prev,
        [id]: { ...prev[id], price: "El precio debe ser mayor a 0" },
      }));
      return;
    }

    if (precioCompra > 999999999999.99) {
      setCartItemErrors((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          price: "El precio no puede ser mayor a $999,999,999,999.99",
        },
      }));
      return;
    }

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
          const newProducts = nameResult.products.filter(
            (p: Product) => !existingIds.includes(p.product_id)
          );
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
            results = allProducts.products.filter(
              (product: Product) =>
                product.name
                  .toLowerCase()
                  .includes(currentSearchTerm.toLowerCase()) ||
                product.code
                  .toLowerCase()
                  .includes(currentSearchTerm.toLowerCase())
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
    // Validar que el producto tenga un precio válido
    if (!product.purchase_price || product.purchase_price <= 0) {
      notification.warning("El producto no tiene un precio de compra válido");
      return;
    }

    // Verificar si el producto ya está en el carrito
    const existingItem = cartItems.find(
      (item) => item.id === product.product_id
    );
    if (existingItem) {
      notification.warning(
        `El producto "${product.name}" ya está en el carrito. Puede modificar su cantidad desde la tabla.`
      );
      return;
    }

    const newItem: CartItem = {
      id: product.product_id,
      codigo: product.code,
      nombre: product.name,
      precioCompra: product.purchase_price,
      cantidad: 1,
      total: product.purchase_price,
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

  const confirmPurchase = async () => {
    // Validar antes de confirmar
    const errors = validatePurchase();

    if (errors.length > 0) {
      notification.error("Errores de validación:\n" + errors.join("\n"));
      return;
    }

    // Estado de procesamiento de compra
    setIsProcessingPurchase(true);

    try {
      // Crear la transacción de compra
      const transactionData = {
        date: purchaseDate,
        is_sale: false, // false = compra
        person_id: parseInt(selectedProvider),
        transport_id: null, // Por ahora sin transporte
        tracking_number: null,
        tax_type: excludeTax ? "Exento" : "R.I", // Responsable Inscripto o Exento
        has_tax: !excludeTax, // true si NO se excluye el IVA, false si se excluye
      };

      const transactionResponse = await createPurchase(transactionData);
      const transactionId = transactionResponse.transaction.transaction_id;

      // Crear los items de la compra y actualizar stock
      for (const item of cartItems) {
        const itemData = {
          transaction_id: transactionId,
          product_id: item.id,
          quantity: item.cantidad,
          price: item.precioCompra,
        };

        await createItem(itemData);

        // Actualizar el stock del producto (incrementar)
        await updateProductStockForPurchase(item.id, item.cantidad);
      }

      // Crear pago inicial si se especificó un monto
      if (paymentAmount > 0) {
        const paymentData = {
          transaction_id: transactionId,
          amount: paymentAmount,
          type: paymentMethod,
          date: paymentDate + " " + new Date().toTimeString().split(" ")[0],
          note: paymentNote || "",
        };

        try {
          await createPayment(paymentData);
        } catch (error) {
          console.error("Error al crear pago inicial:", error);
          // No fallar la compra si hay error en el pago
        }
      }

      // Limpiar el carrito y mostrar mensaje de éxito
      setCartItems([]);
      setCartItemErrors({});
      setSelectedProvider("");
      setProviderSearchTerm("");
      setProviderSearchResults([]);
      setShowProviderResults(false);
      setPaymentMethod("");
      setPaymentAmount(0);
      setPaymentDate(new Date().toISOString().split("T")[0]);
      setPaymentNote("");
      setNotes("");
      setSearchTerm("");
      setSearchResults([]);
      setShowSearchResults(false);

      // Recargar el historial de compras para mostrar la nueva compra
      await loadPurchasesHistory();

      notification.success("¡Compra confirmada exitosamente!");
    } catch (error: any) {
      console.error("Error al confirmar la compra:", error);
      notification.error(
        "Error al confirmar la compra: " +
          (error.response?.data?.error || error.message || "Error desconocido")
      );
    } finally {
      setIsProcessingPurchase(false);
    }
  };

  // PROVEEDORES
  // cargar lista de proveedores desde la API
  const loadProviders = async () => {
    try {
      const response = await getAllActiveProviders();

      // Ordenar proveedores por nombre
      const sortedProviders =
        response.providers?.sort((a: any, b: any) =>
          a.name.localeCompare(b.name)
        ) || [];

      setProviders(sortedProviders);
    } catch (error: any) {
      console.error("Error al cargar proveedores:", error);
      // Si hay error, mantener array vacío
      setProviders([]);
    }
  };

  // Búsqueda de proveedores mientras escribes
  const handleProviderSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setProviderSearchResults([]);
      setShowProviderResults(false);
      return;
    }

    const filteredProviders = providers.filter(
      (provider) =>
        provider.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setProviderSearchResults(filteredProviders);
    setShowProviderResults(true);
  };

  // Cargar proveedores cuando se carga el componente
  useEffect(() => {
    loadProviders();
  }, []);

  // Cargar historial de compras cuando se carga el componente
  useEffect(() => {
    loadPurchasesHistory();
  }, []);

  // Recargar cuando cambien los filtros o la página
  useEffect(() => {
    loadPurchasesHistory();
  }, [purchasesFilters, currentPurchasesPage, purchasesItemsPerPage]);

  // HISTORIAL DE COMPRAS
  const loadPurchasesHistory = async () => {
    setIsLoadingPurchases(true);
    setPurchasesError("");

    try {
      const offset = (currentPurchasesPage - 1) * purchasesItemsPerPage;
      const filtersWithPagination = {
        ...purchasesFilters,
        limit: purchasesItemsPerPage,
        offset: offset,
      };

      const response = await getPurchasesHistory(filtersWithPagination);
      const purchasesData = response.purchases || [];

      // Los datos ya vienen con total_paid desde la vista de la base de datos
      const purchasesWithPayments = purchasesData.map((purchase: any) => ({
        ...purchase,
        total_paid: purchase.total_paid || 0,
        payment_status: getPaymentStatusText({
          ...purchase,
          total_paid: purchase.total_paid || 0,
        }),
      }));

      setPurchasesHistory(purchasesWithPayments);
      setOriginalPurchasesHistory(purchasesWithPayments);
      setTotalPurchases(response.total || 0);
    } catch (error: any) {
      console.error("Error al cargar historial de compras:", error.message);
      setPurchasesError("Error al cargar el historial de compras");
      setPurchasesHistory([]);
      setOriginalPurchasesHistory([]);
      setTotalPurchases(0);
    } finally {
      setIsLoadingPurchases(false);
    }
  };

  const handlePurchasesFilterChange = (key: string, value: string) => {
    setPurchasesFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handlePurchasesSearch = () => {
    setCurrentPurchasesPage(1); // Reset a la primera página
    loadPurchasesHistory();
  };

  const handleClearPurchasesFilters = () => {
    setPurchasesFilters({
      start_date: "",
      end_date: "",
      provider_name: "",
      limit: 10 as number | undefined,
      sort_by: "date",
      sort_direction: "desc",
    });
    setCurrentPurchasesPage(1);
    loadPurchasesHistory();
  };

  const handleViewPurchaseDetails = async (transactionId: number) => {
    setIsLoadingPurchaseDetails(true);
    try {
      const response = await getPurchaseDetails(transactionId);
      setSelectedPurchase(response);
      setShowPurchaseDetails(true);
    } catch (error: any) {
      console.error("Error al cargar detalles de la compra:", error);
      notification.error("Error al cargar los detalles de la compra");
    } finally {
      setIsLoadingPurchaseDetails(false);
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

  // Funciones para manejo de pagos
  const openPaymentModal = (purchase: PurchaseHistoryItemWithPayments) => {
    setSelectedPurchaseForPayment(purchase);
    setNewPaymentAmount(0);
    setNewPaymentMethod("");
    setNewPaymentDate(new Date().toISOString().split("T")[0]);
    setNewPaymentNote("");
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedPurchaseForPayment(null);
    setNewPaymentAmount(0);
    setNewPaymentMethod("");
    setNewPaymentNote("");
  };

  const handleAddPayment = async () => {
    if (!selectedPurchaseForPayment) return;

    if (newPaymentAmount <= 0) {
      notification.warning("Por favor ingrese un monto válido");
      return;
    }

    if (!newPaymentMethod) {
      notification.warning("Por favor seleccione un método de pago");
      return;
    }

    // Calcular el monto pendiente
    const pendingAmount =
      selectedPurchaseForPayment.total_transaction -
      (selectedPurchaseForPayment.total_paid || 0);

    // Si el monto del pago excede el monto pendiente, mostrar confirmación
    if (newPaymentAmount > pendingAmount) {
      const paymentData = {
        transaction_id: selectedPurchaseForPayment.transaction_id,
        date: newPaymentDate,
        type: newPaymentMethod,
        amount: newPaymentAmount,
        note: newPaymentNote,
      };

      setPendingPaymentData(paymentData);
      setShowPaymentConfirmationModal(true);
      return;
    }

    // Si el monto es válido, proceder con el pago
    await processPayment({
      transaction_id: selectedPurchaseForPayment.transaction_id,
      date: newPaymentDate,
      type: newPaymentMethod,
      amount: newPaymentAmount,
      note: newPaymentNote,
    });
  };

  // Función para procesar el pago
  const processPayment = async (paymentData: any) => {
    setIsProcessingNewPayment(true);

    try {
      await createPayment(paymentData);

      // Recargar el historial de compras
      loadPurchasesHistory();

      notification.success("Pago agregado exitosamente!");
      closePaymentModal();
    } catch (error: any) {
      console.error("Error al agregar pago:", error);
      notification.error(
        "Error al agregar pago: " + (error.message || "Error desconocido")
      );
    } finally {
      setIsProcessingNewPayment(false);
    }
  };

  // Función para confirmar el pago excedente
  const confirmExcessPayment = async () => {
    if (pendingPaymentData) {
      await processPayment(pendingPaymentData);
    }
    setShowPaymentConfirmationModal(false);
    setPendingPaymentData(null);
  };

  const cancelExcessPayment = () => {
    setShowPaymentConfirmationModal(false);
    setPendingPaymentData(null);
  };

  // Función para obtener el estado de pago
  const getPaymentStatusText = (purchase: PurchaseHistoryItemWithPayments) => {
    if (!purchase.total_paid) return "Sin pagos";
    if (purchase.total_paid >= purchase.total_transaction)
      return "Pagado completo";
    if (purchase.total_paid > 0) return "Pago parcial";
    return "Sin pagos";
  };

  const getPaymentStatusColor = (purchase: PurchaseHistoryItemWithPayments) => {
    if (!purchase.total_paid) return "bg-gray-100 text-gray-800";
    if (purchase.total_paid >= purchase.total_transaction)
      return "bg-green-100 text-green-800";
    if (purchase.total_paid > 0) return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-800";
  };

  // Función para determinar si una compra tiene IVA
  const hasIVA = (taxType: string): boolean => {
    return taxType === "R.I" || taxType === "Responsable Inscripto";
  };

  // Función para obtener descripción del tipo de impuesto
  const getIVADescription = (taxType: string): string => {
    switch (taxType) {
      case "R.I":
      case "Responsable Inscripto":
        return "Responsable Inscripto - Incluye IVA";
      case "Exento":
        return "Exento de IVA";
      default:
        return "No especificado";
    }
  };

  // Funciones de paginación para compras

  const totalPurchasesPages = Math.ceil(totalPurchases / purchasesItemsPerPage);

  // Cerrar dropdown de proveedores al hacer click fuera o presionar Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".provider-search-container")) {
        setShowProviderResults(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowProviderResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // renderizar el componente
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Compras</h2>
      </div>

      <Tabs defaultValue="nueva" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="nueva">Nueva Compra</TabsTrigger>
          <TabsTrigger value="historial">Historial de Compras</TabsTrigger>
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
                    <p className="mt-2 text-sm text-gray-600">
                      Buscando productos...
                    </p>
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
                          <TableHead className="text-right">
                            Precio Compra
                          </TableHead>
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
                              $
                              {product.purchase_price?.toLocaleString(
                                "es-AR"
                              ) || "0"}
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
                          <div className="flex flex-col items-end">
                            <Input
                              type="number"
                              value={item.precioCompra}
                              onChange={(e) =>
                                updatePrice(
                                  item.id,
                                  Number.parseFloat(e.target.value)
                                )
                              }
                              className={`w-24 text-right ${
                                cartItemErrors[item.id]?.price
                                  ? "border-red-500"
                                  : ""
                              }`}
                            />
                            {cartItemErrors[item.id]?.price && (
                              <span className="text-xs text-red-500 mt-1">
                                {cartItemErrors[item.id]?.price}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
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
                              className={`w-20 text-right ${
                                cartItemErrors[item.id]?.quantity
                                  ? "border-red-500"
                                  : ""
                              }`}
                            />
                            {cartItemErrors[item.id]?.quantity && (
                              <span className="text-xs text-red-500 mt-1">
                                {cartItemErrors[item.id]?.quantity}
                              </span>
                            )}
                          </div>
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
                  <div className="relative provider-search-container">
                    <Input
                      placeholder="Buscar proveedor por nombre o empresa..."
                      value={providerSearchTerm}
                      onChange={(e) => {
                        setProviderSearchTerm(e.target.value);
                        // Limpiar selección cuando el usuario escribe
                        setSelectedProvider("");
                        handleProviderSearch(e.target.value);
                      }}
                      onFocus={() => {
                        if (providerSearchTerm.trim()) {
                          setShowProviderResults(true);
                        }
                      }}
                      disabled={!!selectedProvider}
                    />

                    {/* Resultados de búsqueda de proveedores */}
                    {showProviderResults && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {providerSearchResults.length > 0 ? (
                          providerSearchResults.map((provider) => (
                            <div
                              key={provider.person_id}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                              onClick={() => {
                                setSelectedProvider(
                                  provider.person_id.toString()
                                );
                                setProviderSearchTerm(provider.name);
                                setShowProviderResults(false);
                              }}
                            >
                              <div className="font-medium">{provider.name}</div>
                              <div className="text-sm text-gray-500">
                                {provider.company_name}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-gray-500 text-center">
                            No se encontraron proveedores
                          </div>
                        )}
                      </div>
                    )}

                    {/* Proveedor seleccionado */}
                    {selectedProvider && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md flex justify-between items-center">
                        <div className="text-sm text-green-800">
                          <div className="font-medium">
                            {
                              providers.find(
                                (p) =>
                                  p.person_id.toString() === selectedProvider
                              )?.name
                            }
                          </div>
                          <div className="text-xs text-green-600">
                            {
                              providers.find(
                                (p) =>
                                  p.person_id.toString() === selectedProvider
                              )?.company_name
                            }
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedProvider("");
                            setProviderSearchTerm("");
                          }}
                          className="h-6 w-6 p-0 hover:bg-green-100"
                        >
                          <X className="h-4 w-4 text-green-700" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Método de Pago</Label>
                  {/* seleccionar metodo de pago */}
                  <Select
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Efectivo">Efectivo</SelectItem>
                      <SelectItem value="Transferencia">
                        Transferencia Bancaria
                      </SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                      <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                      <SelectItem value="Credito30">Crédito 30 días</SelectItem>
                      <SelectItem value="Credito60">Crédito 60 días</SelectItem>
                      <SelectItem value="Credito90">Crédito 90 días</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Monto a Pagar</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const total = calculateTotalWithTax();
                        setPaymentAmount(total);
                      }}
                      className="text-xs"
                    >
                      Total
                    </Button>
                  </div>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={
                      !isNaN(paymentAmount) && paymentAmount > 0
                        ? paymentAmount.toString()
                        : ""
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || value === "0") {
                        setPaymentAmount(0);
                      } else {
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue) && numValue >= 0) {
                          setPaymentAmount(numValue);
                        }
                      }
                    }}
                    min="0"
                    step="0.01"
                  />
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
                  <Label>Notas del Pago</Label>
                  <Input
                    placeholder="Agregar notas al pago..."
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha de Compra</Label>
                  <Input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => {
                      const selectedDate = new Date(e.target.value);
                      const today = new Date();
                      const maxFutureDate = new Date();
                      maxFutureDate.setFullYear(today.getFullYear() + 1);

                      if (selectedDate > maxFutureDate) {
                        notification.warning(
                          "La fecha de compra no puede ser más de 1 año en el futuro"
                        );
                        return;
                      }
                      setPurchaseDate(e.target.value);
                    }}
                    max={(() => {
                      const maxDate = new Date();
                      maxDate.setFullYear(maxDate.getFullYear() + 1);
                      return maxDate.toISOString().split("T")[0];
                    })()}
                    required
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

                  {/* Mostrar información de pago */}
                  {paymentAmount > 0 && (
                    <div className="pt-4 border-t space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Monto a Pagar</span>
                        <span className="font-medium">
                          ${paymentAmount.toLocaleString("es-AR")}
                        </span>
                      </div>
                      {paymentAmount < calculateTotalWithTax() && (
                        <div className="flex justify-between text-sm">
                          <span>Pendiente</span>
                          <span className="font-medium text-orange-600">
                            $
                            {(
                              calculateTotalWithTax() - paymentAmount
                            ).toLocaleString("es-AR")}
                          </span>
                        </div>
                      )}
                      {paymentAmount > calculateTotalWithTax() && (
                        <div className="flex justify-between text-sm">
                          <span>Exceso</span>
                          <span className="font-medium text-green-600">
                            $
                            {(
                              paymentAmount - calculateTotalWithTax()
                            ).toLocaleString("es-AR")}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={confirmPurchase}
                  disabled={
                    isProcessingPurchase ||
                    cartItems.length === 0 ||
                    !selectedProvider ||
                    !paymentMethod ||
                    !purchaseDate
                  }
                >
                  {isProcessingPurchase ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Confirmar Compra
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
              <CardTitle>Historial de Compras</CardTitle>
              <CardDescription>
                Registro de todas las compras realizadas a proveedores
              </CardDescription>

              {/* Filtros */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Fecha Desde</Label>
                  <Input
                    type="date"
                    value={purchasesFilters.start_date}
                    onChange={(e) =>
                      handlePurchasesFilterChange("start_date", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha Hasta</Label>
                  <Input
                    type="date"
                    value={purchasesFilters.end_date}
                    onChange={(e) =>
                      handlePurchasesFilterChange("end_date", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Proveedor</Label>
                  <Input
                    placeholder="Buscar por proveedor..."
                    value={purchasesFilters.provider_name}
                    onChange={(e) =>
                      handlePurchasesFilterChange(
                        "provider_name",
                        e.target.value
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <div className="flex gap-2">
                    <Button onClick={handlePurchasesSearch} className="flex-1">
                      <Search className="mr-2 h-4 w-4" />
                      Buscar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleClearPurchasesFilters}
                      className="px-3"
                    >
                      Limpiar
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingPurchases ? (
                <Card>
                  <CardContent className="p-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                      <p className="mt-2 text-gray-600">
                        Cargando historial de compras...
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : purchasesError ? (
                <Card>
                  <CardContent className="p-8">
                    <div className="text-center">
                      <p className="text-red-600">{purchasesError}</p>
                      <Button
                        onClick={loadPurchasesHistory}
                        className="mt-4 bg-blue-600 hover:bg-blue-700"
                      >
                        Reintentar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : purchasesHistory.length === 0 ? (
                <Card>
                  <CardContent className="p-8">
                    <div className="text-center">
                      <p className="text-gray-600">No se encontraron compras</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">
                          <Button
                            variant="ghost"
                            onClick={() =>
                              requestPurchasesSort("transaction_id")
                            }
                          >
                            Nº Compra
                            {getPurchasesSortIndicator("transaction_id")}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            onClick={() =>
                              requestPurchasesSort("provider_name")
                            }
                          >
                            Proveedor
                            {getPurchasesSortIndicator("provider_name")}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            onClick={() => requestPurchasesSort("date")}
                          >
                            Fecha
                            {getPurchasesSortIndicator("date")}
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">
                          <Button
                            variant="ghost"
                            onClick={() =>
                              requestPurchasesSort("total_transaction")
                            }
                          >
                            Total
                            {getPurchasesSortIndicator("total_transaction")}
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">Pagado</TableHead>
                        <TableHead className="text-center">
                          Estado Pago
                        </TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchasesHistory.map((purchase) => (
                        <TableRow key={purchase.transaction_id}>
                          <TableCell className="font-medium">
                            #{purchase.transaction_id}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {purchase.provider_name}
                              </div>
                              {purchase.provider_company && (
                                <div className="text-sm text-muted-foreground">
                                  {purchase.provider_company}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(purchase.date)}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(purchase.total_transaction)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(purchase.total_paid || 0)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={getPaymentStatusColor(purchase)}>
                              {getPaymentStatusText(purchase)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleViewPurchaseDetails(
                                    purchase.transaction_id
                                  )
                                }
                                disabled={isLoadingPurchaseDetails}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {(purchase.total_paid || 0) <
                                purchase.total_transaction && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openPaymentModal(purchase)}
                                  className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                                >
                                  <Banknote className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Paginación */}
                  {totalPurchases > 0 && (
                    <div className="flex items-center justify-between px-2 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-700">Mostrar:</span>
                        <Select
                          value={purchasesItemsPerPage.toString()}
                          onValueChange={(value) => {
                            setPurchasesItemsPerPage(parseInt(value));
                            setCurrentPurchasesPage(1); // Reset a la primera página
                            // No necesitamos llamar loadPurchasesHistory() aquí porque el useEffect se encarga
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
                          {(currentPurchasesPage - 1) * purchasesItemsPerPage +
                            1}{" "}
                          a{" "}
                          {Math.min(
                            currentPurchasesPage * purchasesItemsPerPage,
                            totalPurchases
                          )}{" "}
                          de {totalPurchases} compras
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPurchasesPage(1)}
                          disabled={currentPurchasesPage === 1}
                        >
                          Primera
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPurchasesPage(currentPurchasesPage - 1)
                          }
                          disabled={currentPurchasesPage === 1}
                        >
                          Anterior
                        </Button>

                        <span className="text-sm text-gray-700">
                          Página {currentPurchasesPage} de {totalPurchasesPages}
                        </span>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPurchasesPage(currentPurchasesPage + 1)
                          }
                          disabled={
                            currentPurchasesPage === totalPurchasesPages
                          }
                        >
                          Siguiente
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPurchasesPage(totalPurchasesPages)
                          }
                          disabled={
                            currentPurchasesPage === totalPurchasesPages
                          }
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

      {/* Modal de Detalles de Compra */}
      <Dialog open={showPurchaseDetails} onOpenChange={setShowPurchaseDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detalles de Compra #
              {selectedPurchase?.transaction?.transaction_id}
            </DialogTitle>
          </DialogHeader>

          {isLoadingPurchaseDetails ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              <span className="ml-2">Cargando detalles...</span>
            </div>
          ) : selectedPurchase ? (
            <div className="space-y-6">
              {/* Información del Proveedor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold mb-2">
                    Información del Proveedor
                  </h3>
                  <p>
                    <strong>Nombre:</strong>{" "}
                    {selectedPurchase.transaction.provider_name}
                  </p>
                  <p>
                    <strong>Empresa:</strong>{" "}
                    {selectedPurchase.transaction.provider_company}
                  </p>
                  <p>
                    <strong>Email:</strong>{" "}
                    {selectedPurchase.transaction.provider_email}
                  </p>
                  <p>
                    <strong>Teléfono:</strong>{" "}
                    {selectedPurchase.transaction.provider_phone}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">
                    Información de la Compra
                  </h3>
                  <p>
                    <strong>Fecha:</strong>{" "}
                    {formatDate(selectedPurchase.transaction.date)}
                  </p>
                  <div className="flex items-center gap-2 mb-2">
                    <strong>Tipo de Impuesto:</strong>
                    <Badge
                      variant={
                        hasIVA(selectedPurchase.transaction.tax_type)
                          ? "default"
                          : "secondary"
                      }
                      className={
                        hasIVA(selectedPurchase.transaction.tax_type)
                          ? "bg-green-100 text-green-800 border-green-200"
                          : "bg-gray-100 text-gray-800 border-gray-200"
                      }
                    >
                      {hasIVA(selectedPurchase.transaction.tax_type)
                        ? "Con IVA"
                        : "Sin IVA"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {getIVADescription(selectedPurchase.transaction.tax_type)}
                  </p>
                  {selectedPurchase.transaction.tracking_number && (
                    <p>
                      <strong>Número de Seguimiento:</strong>{" "}
                      {selectedPurchase.transaction.tracking_number}
                    </p>
                  )}
                  {selectedPurchase.transaction.transport_company && (
                    <p>
                      <strong>Transporte:</strong>{" "}
                      {selectedPurchase.transaction.transport_company}
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
                      <TableHead className="text-right">
                        Precio Compra
                      </TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedPurchase.items.map((item: any) => (
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

              {/* Resumen */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-3">Resumen</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p>
                      <strong>Subtotal Productos:</strong>{" "}
                      {formatCurrency(selectedPurchase.totals.items)}
                    </p>
                    <p className="text-lg font-bold">
                      Total:{" "}
                      {formatCurrency(selectedPurchase.totals.transaction)}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          hasIVA(selectedPurchase.transaction.tax_type)
                            ? "bg-green-100 text-green-800 border-green-300 font-semibold"
                            : "bg-red-100 text-red-800 border-red-300 font-semibold"
                        }
                      >
                        {hasIVA(selectedPurchase.transaction.tax_type)
                          ? "Incluye IVA"
                          : "No incluye IVA"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPurchaseDetails(false)}
            >
              Cerrar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                if (selectedPurchase) {
                  // Crear una ventana nueva para imprimir/descargar el recibo
                  const printWindow = window.open("", "_blank");
                  if (printWindow) {
                    printWindow.document.write(`
                      <!DOCTYPE html>
                      <html>
                      <head>
                        <title>Recibo de Compra #${
                          selectedPurchase.transaction.transaction_id
                        }</title>
                        <style>
                          * {
                            box-sizing: border-box;
                          }
                          body { 
                            font-family: Arial, sans-serif; 
                            margin: 10px; 
                            padding: 0;
                            background: white;
                          }
                          .header {
                            text-align: center;
                            border-bottom: 2px solid #333;
                            padding-bottom: 20px;
                            margin-bottom: 30px;
                          }
                          .header h1 {
                            margin: 0;
                            color: #333;
                            font-size: 28px;
                          }
                          .header h2 {
                            margin: 5px 0 0 0;
                            color: #666;
                            font-size: 18px;
                            font-weight: normal;
                          }
                          .info-grid {
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 30px;
                            margin-bottom: 30px;
                          }
                          .info-section h3 {
                            margin: 0 0 15px 0;
                            color: #333;
                            font-size: 16px;
                            border-bottom: 1px solid #ddd;
                            padding-bottom: 5px;
                          }
                          .info-section p {
                            margin: 5px 0;
                            color: #555;
                          }
                          table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-bottom: 30px;
                          }
                          th, td {
                            border: 1px solid #ddd;
                            padding: 12px;
                            text-align: left;
                          }
                          th {
                            background-color: #f5f5f5;
                            font-weight: bold;
                            color: #333;
                          }
                          .text-right {
                            text-align: right;
                          }
                          .summary {
                            background-color: #f9f9f9;
                            padding: 20px;
                            border-radius: 5px;
                            margin-top: 20px;
                          }
                          .summary h3 {
                            margin: 0 0 15px 0;
                            color: #333;
                          }
                          .summary-row {
                            display: flex;
                            justify-content: space-between;
                            margin: 5px 0;
                            padding: 5px 0;
                          }
                          .total {
                            font-weight: bold;
                            font-size: 18px;
                            border-top: 2px solid #333;
                            padding-top: 10px;
                            margin-top: 10px;
                          }
                          .footer {
                            text-align: center;
                            margin-top: 30px;
                            padding-top: 20px;
                            border-top: 1px solid #ddd;
                            color: #666;
                          }
                          @media print {
                            body { margin: 0; }
                            .no-print { display: none; }
                          }
                        </style>
                      </head>
                      <body>
                        <div class="header">
                          <h1>RECIBO DE COMPRA</h1>
                          <h2>Compra #${
                            selectedPurchase.transaction.transaction_id
                          }</h2>
                        </div>

                        <div class="info-grid">
                          <div class="info-section">
                            <h3>Información del Proveedor</h3>
                            <p><strong>Nombre:</strong> ${
                              selectedPurchase.transaction.provider_name
                            }</p>
                            <p><strong>Empresa:</strong> ${
                              selectedPurchase.transaction.provider_company
                            }</p>
                            <p><strong>Email:</strong> ${
                              selectedPurchase.transaction.provider_email
                            }</p>
                            <p><strong>Teléfono:</strong> ${
                              selectedPurchase.transaction.provider_phone
                            }</p>
                          </div>
                          <div class="info-section">
                            <h3>Información de la Compra</h3>
                            <p><strong>Fecha:</strong> ${formatDate(
                              selectedPurchase.transaction.date
                            )}</p>
                            <p><strong>Tipo de Impuesto:</strong> ${getIVADescription(
                              selectedPurchase.transaction.tax_type
                            )}</p>
                            ${
                              selectedPurchase.transaction.tracking_number
                                ? `<p><strong>Número de Seguimiento:</strong> ${selectedPurchase.transaction.tracking_number}</p>`
                                : ""
                            }
                            ${
                              selectedPurchase.transaction.transport_company
                                ? `<p><strong>Transporte:</strong> ${selectedPurchase.transaction.transport_company}</p>`
                                : ""
                            }
                          </div>
                        </div>

                        <h3>Productos</h3>
                        <table>
                          <thead>
                            <tr>
                              <th>Código</th>
                              <th>Producto</th>
                              <th class="text-right">Cantidad</th>
                              <th class="text-right">Precio Compra</th>
                              <th class="text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${selectedPurchase.items
                              .map(
                                (item: any) => `
                              <tr>
                                <td>${item.product_code}</td>
                                <td>${item.product_name}</td>
                                <td class="text-right">${item.quantity}</td>
                                <td class="text-right">${formatCurrency(
                                  item.price
                                )}</td>
                                <td class="text-right">${formatCurrency(
                                  item.quantity * item.price
                                )}</td>
                              </tr>
                            `
                              )
                              .join("")}
                          </tbody>
                        </table>

                        <div class="summary">
                          <h3>Resumen</h3>
                          <div class="summary-row">
                            <span><strong>Subtotal Productos:</strong></span>
                            <span>${formatCurrency(
                              selectedPurchase.totals.items
                            )}</span>
                          </div>
                          <div class="summary-row total">
                            <span><strong>Total:</strong></span>
                            <span>${formatCurrency(
                              selectedPurchase.totals.transaction
                            )}</span>
                          </div>
                        </div>

                        <div class="footer">
                          <p>Recibo generado el ${new Date().toLocaleDateString(
                            "es-AR"
                          )}</p>
                        </div>

                        <script>
                          window.onload = function() {
                            window.print();
                          };
                        </script>
                      </body>
                      </html>
                    `);
                    printWindow.document.close();
                  }
                }
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Imprimir Recibo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Agregar Pago */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Pago</DialogTitle>
            <DialogDescription>
              Agregar pago para la compra #
              {selectedPurchaseForPayment?.transaction_id}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Monto del Pago</Label>
              <Input
                type="number"
                value={newPaymentAmount}
                onChange={(e) => setNewPaymentAmount(Number(e.target.value))}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
              {selectedPurchaseForPayment && (
                <p className="text-sm text-gray-600">
                  Monto pendiente:{" "}
                  {formatCurrency(
                    selectedPurchaseForPayment.total_transaction -
                      (selectedPurchaseForPayment.total_paid || 0)
                  )}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Método de Pago</Label>
              <Select
                value={newPaymentMethod}
                onValueChange={setNewPaymentMethod}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Efectivo">Efectivo</SelectItem>
                  <SelectItem value="Transferencia">Transferencia</SelectItem>
                  <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="Credito30">Crédito 30 días</SelectItem>
                  <SelectItem value="Credito60">Crédito 60 días</SelectItem>
                  <SelectItem value="Credito90">Crédito 90 días</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fecha del Pago</Label>
              <Input
                type="date"
                value={newPaymentDate}
                onChange={(e) => setNewPaymentDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Notas (Opcional)</Label>
              <Input
                value={newPaymentNote}
                onChange={(e) => setNewPaymentNote(e.target.value)}
                placeholder="Agregar notas al pago..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closePaymentModal}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddPayment}
              disabled={
                isProcessingNewPayment || !newPaymentAmount || !newPaymentMethod
              }
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessingNewPayment ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Procesando...
                </>
              ) : (
                "Agregar Pago"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmación de Pago Excedente */}
      <Dialog
        open={showPaymentConfirmationModal}
        onOpenChange={setShowPaymentConfirmationModal}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Pago Excedente</DialogTitle>
            <DialogDescription>
              El monto del pago excede el monto pendiente. ¿Desea continuar?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Monto del pago:</strong>{" "}
                {formatCurrency(pendingPaymentData?.amount || 0)}
              </p>
              <p className="text-sm text-yellow-800">
                <strong>Monto pendiente:</strong>{" "}
                {selectedPurchaseForPayment &&
                  formatCurrency(
                    selectedPurchaseForPayment.total_transaction -
                      (selectedPurchaseForPayment.total_paid || 0)
                  )}
              </p>
              <p className="text-sm text-yellow-800">
                <strong>Exceso:</strong>{" "}
                {selectedPurchaseForPayment &&
                  formatCurrency(
                    (pendingPaymentData?.amount || 0) -
                      (selectedPurchaseForPayment.total_transaction -
                        (selectedPurchaseForPayment.total_paid || 0))
                  )}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={cancelExcessPayment}>
              Cancelar
            </Button>
            <Button
              onClick={confirmExcessPayment}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Confirmar Pago Excedente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
