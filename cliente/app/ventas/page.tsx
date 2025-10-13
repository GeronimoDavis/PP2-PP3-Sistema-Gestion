"use client";

import { Label } from "@/components/ui/label";

import { useEffect, useMemo, useState, useRef } from "react";
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
  Banknote,
  Edit,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import PresupuestoHistory from "@/components/PresupuestoHistory";
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
import { createPayment, updatePayment, deletePayment } from "@/api/paymentsApi";
import { getPersons } from "@/api/personsApi";
import { createItem } from "@/api/itemsApi";
import { createExtra } from "@/api/extrasApi";
import {
  getSalesHistory,
  getSaleDetails,
  getBudgetsHistory,
  getBudgetDetails,
} from "@/api/transactionsApi";
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

// Función para determinar si una transacción tiene IVA
const hasIVA = (taxType: string): boolean => {
  // Los tipos que NO tienen IVA son: "Exento", "R.N.I", "Monotributo"
  // Los tipos que SÍ tienen IVA son: "R.I", "Consumidor Final"
  return taxType === "R.I" || taxType === "Consumidor Final";
};

// Función para obtener el texto descriptivo del IVA
const getIVADescription = (taxType: string): string => {
  switch (taxType) {
    case "R.I":
      return "Responsable Inscripto - Con IVA";
    case "Exento":
      return "Exento - Sin IVA";
    case "R.N.I":
      return "Responsable No Inscripto - Sin IVA";
    case "Monotributo":
      return "Monotributo - Sin IVA";
    case "Consumidor Final":
      return "Consumidor Final - Con IVA";
    default:
      return taxType;
  }
};

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
  const notification = useNotification();

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
      stock: number; // Stock disponible del producto
    }>
  >([]);

  const total = cartItems.reduce((sum, item) => sum + item.total, 0);

  // Funciones para manejar extras
  const addExtra = () => {
    if (!newExtraType.trim()) {
      notification.warning("Por favor complete el tipo de extra");
      return;
    }

    if (newExtraPrice < 0) {
      notification.warning("El monto del extra no puede ser negativo");
      return;
    }

    if (newExtraPrice === 0) {
      notification.warning("El monto del extra debe ser mayor a 0");
      return;
    }

    if (isNaN(newExtraPrice) || !isFinite(newExtraPrice)) {
      notification.warning("El monto del extra debe ser un número válido");
      return;
    }

    const newExtra = {
      id: Date.now().toString(),
      type: newExtraType.trim(),
      price: newExtraPrice,
      note: "", // Sin nota
      paidInFull: false, // Siempre false por defecto
    };

    setSaleExtras([...saleExtras, newExtra]);

    // Limpiar formulario y cerrar modal
    setNewExtraType("");
    setNewExtraPrice(0);
    setShowExtraModal(false);
  };

  const openExtraModal = () => {
    setShowExtraModal(true);
  };

  const closeExtraModal = () => {
    setShowExtraModal(false);
    // Limpiar formulario al cerrar
    setNewExtraType("");
    setNewExtraPrice(0);
  };

  const removeExtra = (id: string) => {
    setSaleExtras(saleExtras.filter((extra) => extra.id !== id));
  };

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

  //EXTRAS DE LA VENTA
  //lista de extras agregados
  const [saleExtras, setSaleExtras] = useState<
    Array<{
      id: string;
      type: string;
      price: number;
      note: string;
      paidInFull: boolean;
    }>
  >([]);
  //formulario de nuevo extra
  const [newExtraType, setNewExtraType] = useState("");
  const [newExtraPrice, setNewExtraPrice] = useState(0);
  const [newExtraNote, setNewExtraNote] = useState("");
  const [newExtraPaidInFull, setNewExtraPaidInFull] = useState(false);

  // Estado para el modal de extras
  const [showExtraModal, setShowExtraModal] = useState(false);

  // Función helper para calcular total de extras (descuentos se restan, otros se suman)
  const calculateExtrasTotal = (extras: any[]) => {
    return extras.reduce((sum, extra) => {
      return extra.type === "Descuento" ? sum - extra.price : sum + extra.price;
    }, 0);
  };

  // Calcular total de extras (descuentos se restan, otros se suman)
  const totalExtras = calculateExtrasTotal(saleExtras);

  //excluir IVA
  const [excludeTax, setExcludeTax] = useState(false);

  // calculo de IVA
  const calculateTax = () => {
    const subtotal =
      cartItems.reduce((sum, item) => sum + item.total, 0) + totalExtras;
    return excludeTax ? 0 : subtotal * 0.21;
  };
  // calculo de total con IVA
  const calculateTotalWithTax = () => {
    const subtotal =
      cartItems.reduce((sum, item) => sum + item.total, 0) + totalExtras;
    const tax = excludeTax ? 0 : subtotal * 0.21; // 21% IVA
    return subtotal + tax;
  };

  // calculo del total real (lo que se va a guardar en la base de datos)
  const calculateRealTotal = () => {
    const subtotal =
      cartItems.reduce((sum, item) => sum + item.total, 0) + totalExtras;
    return subtotal; // Siempre el subtotal, porque el IVA se calcula solo en la interfaz
  };

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
    sort_by: "transaction_id",
    sort_direction: "desc",
  });

  // Detalles de venta - Corregido el tipo
  const [selectedSale, setSelectedSale] = useState<SaleDetails | null>(null);
  const [showSaleDetails, setShowSaleDetails] = useState(false);
  const [isLoadingSaleDetails, setIsLoadingSaleDetails] = useState(false);

  // Estados para el modal de pagos
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSaleForPayment, setSelectedSaleForPayment] =
    useState<SalesHistoryItem | null>(null);
  const [newPaymentAmount, setNewPaymentAmount] = useState(0);
  const [newPaymentMethod, setNewPaymentMethod] = useState("");
  const [newPaymentDate, setNewPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [newPaymentNote, setNewPaymentNote] = useState("");
  const [isProcessingNewPayment, setIsProcessingNewPayment] = useState(false);

  // Estados para el modal de confirmación de pago excedente
  const [showPaymentConfirmationModal, setShowPaymentConfirmationModal] =
    useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState<any>(null);

  // Estados para el modal de edición de pagos
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const [selectedPaymentForEdit, setSelectedPaymentForEdit] =
    useState<SalePayment | null>(null);
  const [editPaymentAmount, setEditPaymentAmount] = useState(0);
  const [editPaymentMethod, setEditPaymentMethod] = useState("");
  const [editPaymentDate, setEditPaymentDate] = useState("");
  const [editPaymentNote, setEditPaymentNote] = useState("");
  const [isProcessingEditPayment, setIsProcessingEditPayment] = useState(false);

  // Estados para el modal de presupuesto
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  // Estados para el modal de presupuesto de transacción completada
  const [showTransactionBudgetModal, setShowTransactionBudgetModal] =
    useState(false);
  const [completedTransaction, setCompletedTransaction] = useState<any>(null);

  // Estados para el historial de presupuestos
  const [savedBudgets, setSavedBudgets] = useState<any[]>([]);
  const [budgetsLoading, setBudgetsLoading] = useState(false);
  const [budgetsError, setBudgetsError] = useState("");

  // Función para cargar historial de presupuestos
  const loadBudgetsHistory = async () => {
    try {
      setBudgetsLoading(true);
      setBudgetsError("");

      const response = await getBudgetsHistory({});
      setSavedBudgets(response.budgets || []);
    } catch (error: any) {
      console.error(
        "Error al cargar historial de presupuestos:",
        error.message
      );
      setBudgetsError("Error al cargar el historial de presupuestos");
    } finally {
      setBudgetsLoading(false);
    }
  };

  // Función para guardar presupuesto en el historial
  const saveBudgetToHistory = async () => {
    try {
      // Calcular totales
      const subtotal = total;
      const totalConExtras = total + totalExtras;
      const iva = totalConExtras * 0.21;
      const totalFinal = totalConExtras + iva;

      // Crear la transacción como presupuesto
      const transactionData = {
        person_id: selectedClient || null,
        date: new Date().toISOString().split("T")[0],
        is_sale: true, // Es una venta/presupuesto
        tax_type: "Consumidor Final", // Usar un tipo válido
        is_budget: true, // Campo adicional para distinguir presupuestos
        has_tax: true, // Incluir IVA
        items: cartItems.map((item) => ({
          product_id: item.id,
          quantity: item.cantidad,
          price: item.precio,
        })),
        extras: saleExtras.map((extra) => ({
          type: extra.type,
          price: extra.price,
          note: extra.note,
        })),
        // Agregar totales calculados
        subtotal: subtotal,
        total_extras: totalExtras,
        iva: iva,
        total: totalFinal,
      };

      console.log("Datos del presupuesto a guardar:", transactionData);

      // Llamar a la API para crear la transacción
      const response = await createTransaction(transactionData);

      // Recargar el historial de presupuestos
      loadBudgetsHistory();

      return response;
    } catch (error) {
      console.error("Error al guardar presupuesto:", error);
      throw error;
    }
  };

  const requestSalesSort = (key: keyof SalesHistoryItem | "status") => {
    const direction =
      salesFilters.sort_by === key && salesFilters.sort_direction === "asc"
        ? "desc"
        : "asc";

    setSalesFilters((prev) => ({
      ...prev,
      sort_by: key,
      sort_direction: direction,
    }));
  };

  const getSalesSortIndicator = (
    columnKey: keyof SalesHistoryItem | "status"
  ) => {
    if (salesFilters.sort_by !== columnKey) {
      return null;
    }
    return salesFilters.sort_direction === "asc" ? " ▲" : " ▼";
  };

  // Funciones para el modal de pagos
  const openPaymentModal = (sale: SalesHistoryItem) => {
    setSelectedSaleForPayment(sale);
    setNewPaymentAmount(0);
    setNewPaymentMethod("");
    setNewPaymentDate(new Date().toISOString().split("T")[0]);
    setNewPaymentNote("");
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedSaleForPayment(null);
    setNewPaymentAmount(0);
    setNewPaymentMethod("");
    setNewPaymentNote("");
  };

  const handleAddPayment = async () => {
    if (!selectedSaleForPayment) return;

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
      selectedSaleForPayment.total_transaction -
      selectedSaleForPayment.total_paid;

    // Si el monto del pago excede el monto pendiente, mostrar confirmación
    if (newPaymentAmount > pendingAmount) {
      const paymentData = {
        transaction_id: selectedSaleForPayment.transaction_id,
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
      transaction_id: selectedSaleForPayment.transaction_id,
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

      // Recargar el historial de ventas
      loadSalesHistory();

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
  const handleConfirmExcessPayment = async () => {
    if (pendingPaymentData) {
      await processPayment(pendingPaymentData);
      setShowPaymentConfirmationModal(false);
      setPendingPaymentData(null);
    }
  };

  // Función para cancelar el pago excedente
  const handleCancelExcessPayment = () => {
    setShowPaymentConfirmationModal(false);
    setPendingPaymentData(null);
  };

  // Funciones para el modal de edición de pagos
  const openEditPaymentModal = (payment: SalePayment) => {
    setSelectedPaymentForEdit(payment);
    setEditPaymentAmount(payment.amount);
    setEditPaymentMethod(payment.type);
    setEditPaymentNote(payment.note);
    setShowEditPaymentModal(true);
  };

  const closeEditPaymentModal = () => {
    setShowEditPaymentModal(false);
    setSelectedPaymentForEdit(null);
    setEditPaymentAmount(0);
    setEditPaymentMethod("");
    setEditPaymentNote("");
  };

  const handleEditPayment = async () => {
    if (!selectedPaymentForEdit) return;

    if (editPaymentAmount <= 0) {
      notification.warning("Por favor ingrese un monto válido");
      return;
    }

    if (!editPaymentMethod) {
      notification.warning("Por favor seleccione un método de pago");
      return;
    }

    setIsProcessingEditPayment(true);

    try {
      const paymentData = {
        type: editPaymentMethod,
        amount: editPaymentAmount,
        note: editPaymentNote,
      };

      await updatePayment(selectedPaymentForEdit.payment_id, paymentData);

      // Recargar los detalles de la venta
      if (selectedSale) {
        const response = await getSaleDetails(
          selectedSale.transaction.transaction_id
        );
        setSelectedSale(response);
      }

      // Recargar el historial de ventas
      loadSalesHistory();

      notification.success("Pago actualizado exitosamente!");
      closeEditPaymentModal();
    } catch (error: any) {
      console.error("Error al actualizar pago:", error);
      notification.error(
        "Error al actualizar pago: " + (error.message || "Error desconocido")
      );
    } finally {
      setIsProcessingEditPayment(false);
    }
  };

  const handleDeletePayment = async (paymentId: number) => {
    if (!confirm("¿Está seguro de que desea eliminar este pago?")) {
      return;
    }

    try {
      await deletePayment(paymentId);

      // Recargar los detalles de la venta
      if (selectedSale) {
        const response = await getSaleDetails(
          selectedSale.transaction.transaction_id
        );
        setSelectedSale(response);
      }

      // Recargar el historial de ventas
      loadSalesHistory();

      notification.success("Pago eliminado exitosamente!");
    } catch (error: any) {
      console.error("Error al eliminar pago:", error);
      notification.error(
        "Error al eliminar pago: " + (error.message || "Error desconocido")
      );
    }
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
  const loadSalesHistory = async () => {
    setIsLoadingSales(true);
    setSalesError("");

    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const filtersWithPagination = {
        ...salesFilters,
        limit: itemsPerPage,
        offset: offset,
      };

      const response = await getSalesHistory(filtersWithPagination);
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
    setCurrentPage(1);
    loadSalesHistory();
  };

  const handleClearSalesFilters = () => {
    setSalesFilters({
      start_date: "",
      end_date: "",
      client_name: "",
      limit: 10,
      sort_by: "transaction_id",
      sort_direction: "desc",
    });
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleLimitChange = (newLimit: number) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalSales / itemsPerPage);

  const handleViewSaleDetails = async (transactionId: number) => {
    setIsLoadingSaleDetails(true);
    try {
      const response = await getSaleDetails(transactionId);
      setSelectedSale(response);
      setShowSaleDetails(true);
    } catch (error: any) {
      console.error("Error al cargar detalles de la venta:", error);
      notification.error("Error al cargar los detalles de la venta");
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
      notification.warning("El carrito está vacío");
      return;
    }

    if (paymentAmount > 0 && !selectedPaymentMethod) {
      notification.warning("Por favor seleccione un método de pago");
      return;
    }

    if (!selectedClient) {
      notification.warning("Por favor seleccione un cliente");
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
        has_tax: !excludeTax, // TRUE si tiene IVA, FALSE si no
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
          price: item.precio, // Guardar precio sin IVA (el IVA se calcula en la interfaz)
        };

        await createItem(itemData);

        // Actualizar el stock del producto
        await updateProductStock(item.id, item.cantidad);
      }

      // 3. Crear los extras de la transacción
      for (const extra of saleExtras) {
        const extraData = {
          transaction_id: transactionId,
          type: extra.type,
          price: extra.price, // Guardar precio sin IVA (el IVA se calcula en la interfaz)
          note: extra.note,
        };

        await createExtra(extraData);
      }

      // 4. Crear el pago de la transacción
      if (paymentAmount > 0) {
        const paymentData = {
          transaction_id: transactionId,
          date: paymentDate,
          type: selectedPaymentMethod,
          amount: paymentAmount,
          note: paymentNote,
        };

        await createPayment(paymentData);
      }

      // 4. Limpiar el formulario
      setCartItems([]);
      setSaleExtras([]);
      setSelectedPaymentMethod("");
      setSelectedClient("");
      setClientSearchTerm("");
      setPaymentAmount(0);
      setPaymentNote("");
      setSearchResults([]);
      setSearchTerm("");
      setError("");
      setProductQuantities({});
      setNewExtraType("");
      setNewExtraPrice(0);

      // 5. Recargar el historial de ventas
      loadSalesHistory();

      // 6. Preparar datos para el presupuesto de la transacción completada
      const completedTransactionData = {
        transaction_id: transactionId,
        date: new Date().toISOString().split("T")[0],
        client: clients.find((c) => c.person_id.toString() === selectedClient),
        items: cartItems,
        extras: saleExtras,
        payment:
          paymentAmount > 0
            ? {
                amount: paymentAmount,
                method: selectedPaymentMethod,
                date: paymentDate,
                note: paymentNote,
              }
            : null,
        totals: {
          subtotal: total,
          extras: totalExtras,
          tax: calculateTax(),
          total: calculateTotalWithTax(),
        },
      };

      setCompletedTransaction(completedTransactionData);
      setShowTransactionBudgetModal(true);

      notification.success("Venta finalizada exitosamente!");
    } catch (error: any) {
      console.error("Error al finalizar la venta:", error);
      notification.error(
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
      notification.warning("El carrito está vacío");
      return false;
    }

    if (paymentAmount > 0 && !selectedPaymentMethod) {
      notification.warning("Por favor seleccione un método de pago");
      return false;
    }

    return true;
  };

  const removeItem = (id: number) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: number, cantidad: number) => {
    // Validar que la cantidad no sea negativa
    if (cantidad < 0) {
      notification.warning("La cantidad no puede ser negativa");
      return;
    }

    // Validar que la cantidad sea un número válido
    if (isNaN(cantidad) || !isFinite(cantidad)) {
      notification.warning("La cantidad debe ser un número válido");
      return;
    }

    setCartItems(
      cartItems.map((item) => {
        if (item.id === id) {
          // Usar el stock del item del carrito
          const availableStock = item.stock;

          // Asegurar que la cantidad sea al menos 1
          const minQuantity = Math.max(1, cantidad);

          // Limitar la cantidad al stock disponible
          const validQuantity = Math.min(minQuantity, availableStock);

          if (validQuantity !== cantidad) {
            if (cantidad < 1) {
              notification.warning("La cantidad mínima es 1");
            } else if (cantidad > availableStock) {
              notification.warning(
                `No hay suficiente stock. Stock disponible: ${availableStock}`
              );
            }
          }

          return {
            ...item,
            cantidad: validQuantity,
            total: item.precio * validQuantity,
          };
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
    const availableStock = product.stock - quantityInCart;
    return availableStock >= requestedQuantity;
  };

  // Función para manejar el cambio de cantidad de un producto
  const handleQuantityChange = (productId: number, quantity: number) => {
    // Validar que la cantidad no sea negativa
    if (quantity < 0) {
      notification.warning("La cantidad no puede ser negativa");
      return;
    }

    // Validar que la cantidad sea un número válido
    if (isNaN(quantity) || !isFinite(quantity)) {
      notification.warning("La cantidad debe ser un número válido");
      return;
    }

    // Encontrar el producto para obtener su stock
    const product = searchResults.find((p) => p.product_id === productId);
    if (!product) return;

    // Calcular stock disponible (stock total - cantidad ya en carrito)
    const quantityInCart = getProductQuantityInCart(productId);
    const availableStock = Math.max(0, product.stock - quantityInCart);

    // Asegurar que la cantidad sea al menos 1
    const minQuantity = Math.max(1, quantity);

    // Validar que la cantidad no exceda el stock disponible
    const validQuantity = Math.min(minQuantity, availableStock);

    if (validQuantity !== quantity) {
      if (quantity < 1) {
        notification.warning("La cantidad mínima es 1");
      } else if (quantity > availableStock) {
        notification.warning(
          `No hay suficiente stock. Stock disponible: ${availableStock}`
        );
      }
    }

    setProductQuantities((prev) => ({
      ...prev,
      [productId]: validQuantity,
    }));
  };

  // Función para agregar o actualizar producto en el carrito
  const addOrUpdateProductInCart = (product: any, quantity: number) => {
    // Validar que la cantidad no sea negativa
    if (quantity < 0) {
      notification.warning("La cantidad no puede ser negativa");
      return;
    }

    // Validar que la cantidad sea un número válido
    if (isNaN(quantity) || !isFinite(quantity)) {
      notification.warning("La cantidad debe ser un número válido");
      return;
    }

    // Validar que el precio del producto no sea negativo
    if (product.sell_price < 0) {
      notification.warning("El precio del producto no puede ser negativo");
      return;
    }

    // Validar que el precio sea un número válido
    if (isNaN(product.sell_price) || !isFinite(product.sell_price)) {
      notification.warning("El precio del producto debe ser un número válido");
      return;
    }

    const existingItemIndex = cartItems.findIndex(
      (item) => item.id === product.product_id
    );

    if (existingItemIndex !== -1) {
      // Si el producto ya existe, actualizar la cantidad
      const updatedItems = [...cartItems];
      const existingItem = updatedItems[existingItemIndex];
      const newQuantity = existingItem.cantidad + quantity;

      // Validar que la nueva cantidad total no exceda el stock
      if (newQuantity > product.stock) {
        notification.warning(
          `No hay suficiente stock. Stock disponible: ${product.stock}, cantidad actual en carrito: ${existingItem.cantidad}`
        );
        return;
      }

      updatedItems[existingItemIndex] = {
        ...existingItem,
        cantidad: newQuantity,
        total: existingItem.precio * newQuantity,
      };
      setCartItems(updatedItems);
    } else {
      // Si el producto no existe, validar stock antes de agregarlo
      if (quantity > product.stock) {
        notification.warning(
          `No hay suficiente stock. Stock disponible: ${product.stock}`
        );
        return;
      }

      // Si el producto no existe, agregarlo como nuevo item
      const newItem = {
        id: product.product_id, // ID del producto
        codigo: product.code, // Código del producto
        nombre: product.name, // Nombre del producto
        precio: product.sell_price, // Precio de venta
        precioOriginal: product.sell_price, // Guardar precio original
        cantidad: quantity, // Cantidad del producto
        total: product.sell_price * quantity, // Total del producto
        stock: product.stock, // Stock disponible del producto
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  // Cargar historial cuando se cambia de tab
  useEffect(() => {
    if (salesHistory.length === 0 && !loading && token) {
      loadSalesHistory();
    }
  }, [loading, token, user]);

  // Cargar historial de presupuestos cuando se abre el tab
  useEffect(() => {
    if (savedBudgets.length === 0 && !loading && token) {
      loadBudgetsHistory();
    }
  }, [loading, token, user]);

  // Recargar cuando cambien los filtros o la página
  useEffect(() => {
    loadSalesHistory();
  }, [salesFilters, currentPage, itemsPerPage]);

  // Ref para rastrear el valor anterior del IVA
  const prevExcludeTax = useRef(excludeTax);

  // Actualizar el monto a pagar cuando cambie el estado del IVA
  useEffect(() => {
    // Solo actualizar si hay un monto establecido y el estado del IVA cambió
    if (paymentAmount > 0 && prevExcludeTax.current !== excludeTax) {
      let newAmount;
      if (excludeTax) {
        // Si se excluye el IVA, dividir por 1.21 para obtener el monto sin IVA
        newAmount = paymentAmount / 1.21;
      } else {
        // Si se incluye el IVA, multiplicar por 1.21 para obtener el monto con IVA
        newAmount = paymentAmount * 1.21;
      }
      setPaymentAmount(Math.round(newAmount * 100) / 100); // Redondear a 2 decimales
    }
    // Actualizar el ref con el valor actual
    prevExcludeTax.current = excludeTax;
  }, [excludeTax, paymentAmount]);

  // Actualizar el monto a pagar cuando cambien los extras
  useEffect(() => {
    // Solo actualizar si hay un monto establecido y hay cambios en los extras
    if (paymentAmount > 0) {
      const newTotal = calculateTotalWithTax();
      setPaymentAmount(newTotal);
    }
  }, [saleExtras, cartItems, excludeTax]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Ventas</h2>
      </div>

      <Tabs defaultValue="nueva" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="nueva">Nueva Venta</TabsTrigger>
          <TabsTrigger value="historial">Historial de Ventas</TabsTrigger>
          <TabsTrigger value="presupuestos">
            Historial de Presupuestos
          </TabsTrigger>
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
                                <div className="flex flex-col items-end gap-1">
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
                                      const value = e.target.value;
                                      // Validar que el valor no sea negativo
                                      if (value === "" || value === "0") {
                                        handleQuantityChange(
                                          product.product_id,
                                          1
                                        );
                                        return;
                                      }
                                      const qty = Number(value);
                                      // Solo actualizar si es un número válido y positivo
                                      if (!isNaN(qty) && qty > 0) {
                                        handleQuantityChange(
                                          product.product_id,
                                          qty
                                        );
                                      }
                                    }}
                                  />
                                  <span className="text-xs text-gray-500">
                                    Stock:{" "}
                                    {product.stock -
                                      getProductQuantityInCart(
                                        product.product_id
                                      )}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={
                                    !hasAvailableStock(
                                      product,
                                      productQuantities[product.product_id] || 1
                                    )
                                  }
                                  onClick={async () => {
                                    const quantity =
                                      productQuantities[product.product_id] ||
                                      1;

                                    // La validación ya está en addOrUpdateProductInCart
                                    addOrUpdateProductInCart(product, quantity);

                                    // Limpiar después de agregar (solo si se agregó exitosamente)
                                    setTimeout(() => {
                                      setSearchResults([]);
                                      setSearchTerm("");
                                      setProductQuantities({});
                                    }, 50);
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
                        <TableCell>
                          <div>
                            <div>{item.nombre}</div>
                            <div className="text-xs text-gray-500">
                              Stock: {item.stock}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right align-middle">
                          <div className="flex items-center justify-end space-x-2">
                            <div className="relative">
                              <Input
                                type="number"
                                value={item.precio}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  // Validar que el valor no sea negativo
                                  if (value === "" || value === "0") {
                                    const newPrice = 0;
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
                                    return;
                                  }
                                  const newPrice = parseFloat(value);
                                  // Solo actualizar si es un número válido y no negativo
                                  if (!isNaN(newPrice) && newPrice >= 0) {
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
                                  } else if (newPrice < 0) {
                                    notification.warning(
                                      "El precio no puede ser negativo"
                                    );
                                  }
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
                            onChange={(e) => {
                              const value = e.target.value;
                              // Validar que el valor no sea negativo
                              if (value === "" || value === "0") {
                                updateQuantity(item.id, 1);
                                return;
                              }
                              const newQuantity = parseInt(value);
                              // Solo actualizar si es un número válido y positivo
                              if (!isNaN(newQuantity) && newQuantity > 0) {
                                updateQuantity(item.id, newQuantity);
                              }
                            }}
                            min="1"
                            max={item.stock}
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

                {/* Sección de Extras - Compacta */}
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Extras</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openExtraModal}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Agregar
                    </Button>
                  </div>

                  {/* Lista compacta de extras */}
                  {saleExtras.length > 0 && (
                    <div className="space-y-2">
                      {saleExtras.map((extra) => (
                        <div
                          key={extra.id}
                          className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm"
                        >
                          <div className="flex-1">
                            <span className="font-medium">{extra.type}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`font-medium ${
                                extra.type === "Descuento"
                                  ? "text-green-600"
                                  : ""
                              }`}
                            >
                              {extra.type === "Descuento" ? "-" : ""}$
                              {extra.price.toLocaleString("es-AR")}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeExtra(extra.id)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                  <div className="flex items-center justify-between">
                    <Label>Monto a Pagar</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Si el IVA está excluido, usar el subtotal sin IVA
                        // Si el IVA está incluido, usar el total con IVA
                        const total = excludeTax
                          ? calculateRealTotal()
                          : calculateTotalWithTax();
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

                      // Si el input está vacío, establecer 0 (no 1)
                      if (
                        value === "" ||
                        value === null ||
                        value === undefined
                      ) {
                        setPaymentAmount(0);
                        return;
                      }

                      const newAmount = parseFloat(value);

                      // Verificar que sea un número válido y no NaN
                      if (!isNaN(newAmount) && isFinite(newAmount)) {
                        // Verificar que no sea negativo
                        if (newAmount < 0) {
                          notification.warning(
                            "El monto de pago no puede ser negativo"
                          );
                          setPaymentAmount(0);
                          return;
                        }
                        const maxAmount = calculateTotalWithTax();
                        // Limitar el monto al total máximo
                        setPaymentAmount(Math.min(newAmount, maxAmount));
                      } else {
                        // Si no es un número válido, establecer 0
                        setPaymentAmount(0);
                      }
                    }}
                    min="0"
                    max={calculateTotalWithTax()}
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
                    <span>Subtotal Productos</span>
                    <span>${total.toLocaleString("es-AR")}</span>
                  </div>
                  {totalExtras !== 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Extras</span>
                      <span
                        className={`${totalExtras < 0 ? "text-green-600" : ""}`}
                      >
                        {totalExtras < 0 ? "-" : ""}$
                        {Math.abs(totalExtras).toLocaleString("es-AR")}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-medium">
                    <span>Subtotal Total</span>
                    <span>
                      ${(total + totalExtras).toLocaleString("es-AR")}
                    </span>
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
                      {/* Solo mostrar vuelto cuando se excluye el IVA */}
                      {paymentAmount > calculateTotalWithTax() &&
                        excludeTax && (
                          <div className="flex justify-between text-sm">
                            <span>Vuelto</span>
                            <span className="font-medium text-green-600">
                              $
                              {(
                                paymentAmount - calculateTotalWithTax()
                              ).toLocaleString("es-AR")}
                            </span>
                          </div>
                        )}
                      {/* Mostrar mensaje cuando se incluye IVA y no hay vuelto */}
                      {paymentAmount > calculateTotalWithTax() &&
                        !excludeTax && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500 italic">
                              Sin vuelto (IVA incluido)
                            </span>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
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
                <Button
                  variant="outline"
                  className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                  onClick={() => setShowBudgetModal(true)}
                  disabled={cartItems.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Generar Presupuesto
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
                    value={salesFilters.client_name}
                    onChange={(e) =>
                      handleSalesFilterChange("client_name", e.target.value)
                    }
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
                        onClick={() => {
                          loadSalesHistory();
                        }}
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
                        <TableHead className="w-[100px]">
                          <Button
                            variant="ghost"
                            onClick={() => requestSalesSort("transaction_id")}
                          >
                            Nº Venta
                            {getSalesSortIndicator("transaction_id")}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            onClick={() => requestSalesSort("client_name")}
                          >
                            Cliente
                            {getSalesSortIndicator("client_name")}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            onClick={() => requestSalesSort("date")}
                          >
                            Fecha
                            {getSalesSortIndicator("date")}
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">
                          <Button
                            variant="ghost"
                            onClick={() =>
                              requestSalesSort("total_transaction")
                            }
                          >
                            Total
                            {getSalesSortIndicator("total_transaction")}
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">
                          <Button
                            variant="ghost"
                            onClick={() => requestSalesSort("total_paid")}
                          >
                            Pagado
                            {getSalesSortIndicator("total_paid")}
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">
                          <Button
                            variant="ghost"
                            onClick={() => requestSalesSort("status")}
                          >
                            Estado
                            {getSalesSortIndicator("status")}
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesHistory.map((sale, index) => {
                        const paymentStatus = getPaymentStatus(
                          sale.total_transaction,
                          sale.total_paid
                        );
                        // Calcular el número de venta: la más reciente tiene el número más alto
                        const saleNumber =
                          totalSales -
                          ((currentPage - 1) * itemsPerPage + index);
                        return (
                          <TableRow key={sale.transaction_id}>
                            <TableCell className="font-medium">
                              <div>
                                <div className="font-semibold">
                                  Venta #{saleNumber}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Transacción N°{sale.transaction_id}
                                </div>
                              </div>
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
                              <div className="flex items-center justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleViewSaleDetails(sale.transaction_id)
                                  }
                                  disabled={isLoadingSaleDetails}
                                  title="Ver detalles"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {sale.total_paid < sale.total_transaction && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openPaymentModal(sale)}
                                    className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                                    title="Agregar pago"
                                  >
                                    <Banknote className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
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
                          value={itemsPerPage.toString()}
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
                          Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
                          {Math.min(currentPage * itemsPerPage, totalSales)} de{" "}
                          {totalSales} ventas
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
        <TabsContent value="presupuestos">
          <PresupuestoHistory />
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
                  <div className="flex items-center gap-2 mb-2">
                    <strong>Tipo de Impuesto:</strong>
                    <Badge
                      variant={
                        hasIVA(selectedSale.transaction.tax_type)
                          ? "default"
                          : "secondary"
                      }
                      className={
                        hasIVA(selectedSale.transaction.tax_type)
                          ? "bg-green-100 text-green-800 border-green-200"
                          : "bg-gray-100 text-gray-800 border-gray-200"
                      }
                    >
                      {hasIVA(selectedSale.transaction.tax_type)
                        ? "Con IVA"
                        : "Sin IVA"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {getIVADescription(selectedSale.transaction.tax_type)}
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
                          <TableCell
                            className={`text-right ${
                              extra.type === "Descuento" ? "text-green-600" : ""
                            }`}
                          >
                            {extra.type === "Descuento" ? "-" : ""}
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
                      <TableHead className="text-right">Acciones</TableHead>
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
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditPaymentModal(payment)}
                              title="Editar pago"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleDeletePayment(payment.payment_id)
                              }
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Eliminar pago"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
                      <span
                        className={
                          selectedSale.totals.extras < 0 ? "text-green-600" : ""
                        }
                      >
                        {selectedSale.totals.extras < 0 ? "-" : ""}
                        {formatCurrency(Math.abs(selectedSale.totals.extras))}
                      </span>
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
                    <div className="flex items-center gap-2">
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
                      <Badge
                        className={
                          hasIVA(selectedSale.transaction.tax_type)
                            ? "bg-green-100 text-green-800 border-green-300 font-semibold"
                            : "bg-red-100 text-red-800 border-red-300 font-semibold"
                        }
                      >
                        {hasIVA(selectedSale.transaction.tax_type)
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
            <Button variant="outline" onClick={() => setShowSaleDetails(false)}>
              Cerrar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                if (selectedSale) {
                  // Crear una ventana nueva para imprimir/descargar el recibo
                  const printWindow = window.open("", "_blank");
                  if (printWindow) {
                    printWindow.document.write(`
                      <!DOCTYPE html>
                      <html>
                      <head>
                        <title>Recibo de Venta #${
                          selectedSale.transaction.transaction_id
                        }</title>
                        <style>
                          * {
                            box-sizing: border-box;
                          }
                          body { 
                            font-family: Arial, sans-serif; 
                            margin: 10px; 
                            padding: 10px;
                            color: #333;
                            font-size: 12px;
                            line-height: 1.4;
                          }
                          .header { 
                            text-align: center; 
                            margin-bottom: 20px; 
                            border-bottom: 2px solid #333; 
                            padding-bottom: 15px;
                          }
                          .header h1 {
                            margin: 0 0 10px 0;
                            font-size: 24px;
                          }
                          .info-section { 
                            display: flex; 
                            justify-content: space-between; 
                            margin-bottom: 20px; 
                            background: #f5f5f5; 
                            padding: 15px; 
                            border-radius: 4px;
                          }
                          .info-column { 
                            flex: 1; 
                            margin-right: 15px;
                          }
                          .info-column:last-child { 
                            margin-right: 0; 
                          }
                          .info-column h3 {
                            margin: 0 0 10px 0;
                            font-size: 14px;
                          }
                          .info-column p {
                            margin: 5px 0;
                            font-size: 11px;
                          }
                          table { 
                            width: 100%; 
                            border-collapse: collapse; 
                            margin-bottom: 20px;
                            font-size: 11px;
                          }
                          th, td { 
                            border: 1px solid #ddd; 
                            padding: 6px 4px; 
                            text-align: left;
                            word-wrap: break-word;
                          }
                          th { 
                            background-color: #f2f2f2; 
                            font-weight: bold;
                            font-size: 10px;
                          }
                          .text-right { 
                            text-align: right;
                          }
                          .summary { 
                            background: #f5f5f5; 
                            padding: 15px; 
                            border-radius: 4px; 
                            margin-top: 15px;
                          }
                          .summary h3 {
                            margin: 0 0 10px 0;
                            font-size: 14px;
                          }
                          .summary p {
                            margin: 5px 0;
                            font-size: 11px;
                          }
                          .total { 
                            font-size: 16px; 
                            font-weight: bold; 
                            margin-top: 10px;
                          }
                          .badge { 
                            display: inline-block; 
                            padding: 2px 6px; 
                            border-radius: 3px; 
                            font-size: 10px; 
                            font-weight: bold;
                          }
                          .badge-green { 
                            background: #d4edda; 
                            color: #155724; 
                            border: 1px solid #c3e6cb;
                          }
                          .badge-red { 
                            background: #f8d7da; 
                            color: #721c24; 
                            border: 1px solid #f5c6cb;
                          }
                          .payment-info {
                            background: #e3f2fd;
                            padding: 15px;
                            border-radius: 4px;
                            margin: 15px 0;
                          }
                          @media print {
                            body { 
                              margin: 0.5in; 
                              padding: 0;
                              font-size: 11px;
                            }
                            .header h1 {
                              font-size: 20px;
                            }
                            .info-section {
                              padding: 10px;
                              margin-bottom: 15px;
                            }
                            .info-column p {
                              font-size: 10px;
                              margin: 3px 0;
                            }
                            table {
                              font-size: 10px;
                              margin-bottom: 15px;
                            }
                            th, td {
                              padding: 4px 2px;
                              font-size: 9px;
                            }
                            .summary {
                              padding: 10px;
                              margin-top: 10px;
                            }
                            .summary p {
                              font-size: 10px;
                              margin: 3px 0;
                            }
                            .total {
                              font-size: 14px;
                            }
                            .no-print { display: none; }
                          }
                        </style>
                      </head>
                      <body>
                        <div class="header">
                          <h1>RECIBO DE VENTA</h1>
                          <p>Número: #${
                            selectedSale.transaction.transaction_id
                          }</p>
                          <p>Fecha: ${formatDate(
                            selectedSale.transaction.date
                          )}</p>
                        </div>
                        
                        <div class="info-section">
                          <div class="info-column">
                            <h3>Información del Cliente</h3>
                            <p><strong>Nombre:</strong> ${
                              selectedSale.transaction.client_name
                            }</p>
                            <p><strong>Empresa:</strong> ${
                              selectedSale.transaction.client_company || "N/A"
                            }</p>
                            <p><strong>Email:</strong> ${
                              selectedSale.transaction.client_email || "N/A"
                            }</p>
                            <p><strong>Teléfono:</strong> ${
                              selectedSale.transaction.client_phone || "N/A"
                            }</p>
                          </div>
                          <div class="info-column">
                            <h3>Información de la Venta</h3>
                            <p><strong>Tipo de Impuesto:</strong> 
                              <span class="badge ${
                                hasIVA(selectedSale.transaction.tax_type)
                                  ? "badge-green"
                                  : "badge-red"
                              }">
                                ${
                                  hasIVA(selectedSale.transaction.tax_type)
                                    ? "Con IVA"
                                    : "Sin IVA"
                                }
                              </span>
                            </p>
                            <p><small>${getIVADescription(
                              selectedSale.transaction.tax_type
                            )}</small></p>
                          </div>
                        </div>

                        <h3>Productos</h3>
                        <table>
                          <thead>
                            <tr>
                              <th>Código</th>
                              <th>Producto</th>
                              <th class="text-right">Cantidad</th>
                              <th class="text-right">Precio Unit.</th>
                              <th class="text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${selectedSale.items
                              .map(
                                (item: any) => `
                              <tr>
                                <td>${item.product_code}</td>
                                <td>${item.product_name}</td>
                                <td class="text-right">${item.quantity}</td>
                                <td class="text-right">$${item.price.toLocaleString(
                                  "es-AR"
                                )}</td>
                                <td class="text-right">$${(
                                  item.quantity * item.price
                                ).toLocaleString("es-AR")}</td>
                              </tr>
                            `
                              )
                              .join("")}
                          </tbody>
                        </table>

                        ${
                          selectedSale.extras.length > 0
                            ? `
                          <h3>Cargos Adicionales</h3>
                          <table>
                            <thead>
                              <tr>
                                <th>Tipo</th>
                                <th>Descripción</th>
                                <th class="text-right">Monto</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${selectedSale.extras
                                .map(
                                  (extra: any) => `
                                <tr>
                                  <td>${extra.type}</td>
                                  <td>${extra.note}</td>
                                  <td class="text-right ${
                                    extra.type === "Descuento"
                                      ? "text-green-600"
                                      : ""
                                  }">
                                    ${
                                      extra.type === "Descuento" ? "-" : ""
                                    }$${extra.price.toLocaleString("es-AR")}
                                  </td>
                                </tr>
                              `
                                )
                                .join("")}
                            </tbody>
                          </table>
                        `
                            : ""
                        }

                        ${
                          selectedSale.payments.length > 0
                            ? `
                          <div class="payment-info">
                            <h3>Información de Pagos</h3>
                            ${selectedSale.payments
                              .map(
                                (payment: any) => `
                              <div style="margin-bottom: 10px; padding: 10px; background: white; border-radius: 4px;">
                                <div style="display: flex; justify-content: space-between;">
                                  <div>
                                    <p><strong>Método:</strong> ${
                                      payment.type
                                    }</p>
                                    <p><strong>Fecha:</strong> ${formatDate(
                                      payment.date
                                    )}</p>
                                  </div>
                                  <div>
                                    <p><strong>Monto:</strong> $${payment.amount.toLocaleString(
                                      "es-AR"
                                    )}</p>
                                    ${
                                      payment.note
                                        ? `<p><strong>Nota:</strong> ${payment.note}</p>`
                                        : ""
                                    }
                                  </div>
                                </div>
                              </div>
                            `
                              )
                              .join("")}
                          </div>
                        `
                            : ""
                        }

                        <div class="summary">
                          <h3>Resumen de la Venta</h3>
                          <p><strong>Subtotal Productos:</strong> $${selectedSale.totals.items.toLocaleString(
                            "es-AR"
                          )}</p>
                          ${
                            selectedSale.totals.extras !== 0
                              ? `
                            <p><strong>Cargos Adicionales:</strong> 
                              <span class="${
                                selectedSale.totals.extras < 0
                                  ? "text-green-600"
                                  : ""
                              }">
                                ${
                                  selectedSale.totals.extras < 0 ? "-" : ""
                                }$${Math.abs(
                                  selectedSale.totals.extras
                                ).toLocaleString("es-AR")}
                              </span>
                            </p>
                          `
                              : ""
                          }
                          <p><strong>Total Venta:</strong> $${selectedSale.totals.transaction.toLocaleString(
                            "es-AR"
                          )}</p>
                          <p><strong>Total Pagado:</strong> $${selectedSale.totals.paid.toLocaleString(
                            "es-AR"
                          )}</p>
                          <p><strong>Pendiente:</strong> $${selectedSale.totals.pending.toLocaleString(
                            "es-AR"
                          )}</p>
                          
                          <div style="margin-top: 15px;">
                            <span class="badge ${
                              hasIVA(selectedSale.transaction.tax_type)
                                ? "badge-green"
                                : "badge-red"
                            }">
                              ${
                                hasIVA(selectedSale.transaction.tax_type)
                                  ? "Incluye IVA"
                                  : "No incluye IVA"
                              }
                            </span>
                            <span class="badge ${
                              getPaymentStatus(
                                selectedSale.totals.transaction,
                                selectedSale.totals.paid
                              ).status === "Pagado"
                                ? "badge-green"
                                : getPaymentStatus(
                                    selectedSale.totals.transaction,
                                    selectedSale.totals.paid
                                  ).status === "Parcial"
                                ? "badge-yellow"
                                : "badge-red"
                            }" style="margin-left: 10px;">
                              ${
                                getPaymentStatus(
                                  selectedSale.totals.transaction,
                                  selectedSale.totals.paid
                                ).status
                              }
                            </span>
                            <p style="margin-top: 10px; font-size: 12px; color: #666;">
                              ${
                                hasIVA(selectedSale.transaction.tax_type)
                                  ? "Esta venta incluye IVA del 21%."
                                  : "Esta venta no incluye IVA."
                              }
                            </p>
                          </div>
                        </div>
                      </body>
                      </html>
                    `);
                    printWindow.document.close();
                    printWindow.print();
                    printWindow.close();
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

      {/* Modal para agregar extras */}
      <Dialog open={showExtraModal} onOpenChange={setShowExtraModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Extra</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="extraType">Tipo de Extra</Label>
              <Select value={newExtraType} onValueChange={setNewExtraType}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo de extra..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mano de obra">Mano de obra</SelectItem>
                  <SelectItem value="Envio">Envío</SelectItem>
                  <SelectItem value="Descuento">Descuento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="extraPrice">Monto</Label>
              <Input
                id="extraPrice"
                type="number"
                placeholder="0.00"
                value={newExtraPrice || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || value === "0") {
                    setNewExtraPrice(0);
                    return;
                  }
                  const price = parseFloat(value);
                  // Solo actualizar si es un número válido y no negativo
                  if (!isNaN(price) && price >= 0) {
                    setNewExtraPrice(price);
                  } else if (price < 0) {
                    notification.warning("El monto no puede ser negativo");
                  }
                }}
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={closeExtraModal}>
              Cancelar
            </Button>
            <Button onClick={addExtra}>Agregar Extra</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para agregar pagos */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Agregar Pago - Venta #{selectedSaleForPayment?.transaction_id}
            </DialogTitle>
          </DialogHeader>
          {selectedSaleForPayment && (
            <div className="space-y-4">
              {/* Información de la venta */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Cliente:</span>
                    <span className="font-medium">
                      {selectedSaleForPayment.client_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Venta:</span>
                    <span className="font-medium">
                      $
                      {selectedSaleForPayment.total_transaction.toLocaleString(
                        "es-AR"
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pagado:</span>
                    <span className="font-medium">
                      $
                      {selectedSaleForPayment.total_paid.toLocaleString(
                        "es-AR"
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Pendiente:</span>
                    <span className="text-orange-600">
                      $
                      {(
                        selectedSaleForPayment.total_transaction -
                        selectedSaleForPayment.total_paid
                      ).toLocaleString("es-AR")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Formulario de pago */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Monto del Pago</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newPaymentAmount || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || value === "0") {
                        setNewPaymentAmount(0);
                        return;
                      }
                      const amount = parseFloat(value);
                      // Solo actualizar si es un número válido y no negativo
                      if (!isNaN(amount) && amount >= 0) {
                        setNewPaymentAmount(amount);
                      } else if (amount < 0) {
                        notification.warning(
                          "El monto del pago no puede ser negativo"
                        );
                      }
                    }}
                    min="0"
                    step="0.01"
                    max={
                      selectedSaleForPayment.total_transaction -
                      selectedSaleForPayment.total_paid
                    }
                  />
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
                  <Label>Fecha del Pago</Label>
                  <Input
                    type="date"
                    value={newPaymentDate}
                    onChange={(e) => setNewPaymentDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notas (opcional)</Label>
                  <Input
                    placeholder="Agregar notas al pago..."
                    value={newPaymentNote}
                    onChange={(e) => setNewPaymentNote(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={closePaymentModal}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddPayment}
              disabled={isProcessingNewPayment}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessingNewPayment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Agregar Pago"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación para pago excedente */}
      <Dialog
        open={showPaymentConfirmationModal}
        onOpenChange={setShowPaymentConfirmationModal}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-orange-600">
              ⚠️ Confirmar Pago Excedente
            </DialogTitle>
          </DialogHeader>
          {selectedSaleForPayment && pendingPaymentData && (
            <div className="space-y-4">
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="text-sm space-y-2">
                  <p className="font-medium text-orange-800">
                    El monto del pago excede el monto pendiente de la
                    transacción.
                  </p>
                  <div className="space-y-1 text-gray-700">
                    <div className="flex justify-between">
                      <span>Cliente:</span>
                      <span className="font-medium">
                        {selectedSaleForPayment.client_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monto del Pago:</span>
                      <span className="font-medium text-orange-600">
                        ${pendingPaymentData.amount.toLocaleString("es-AR")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monto Pendiente:</span>
                      <span className="font-medium">
                        $
                        {(
                          selectedSaleForPayment.total_transaction -
                          selectedSaleForPayment.total_paid
                        ).toLocaleString("es-AR")}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Exceso:</span>
                      <span className="text-green-600">
                        $
                        {(
                          pendingPaymentData.amount -
                          (selectedSaleForPayment.total_transaction -
                            selectedSaleForPayment.total_paid)
                        ).toLocaleString("es-AR")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p>
                  ¿Está seguro de que desea continuar con este pago? El exceso
                  se registrará igualmente.
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleCancelExcessPayment}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmExcessPayment}
              disabled={isProcessingNewPayment}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isProcessingNewPayment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Confirmar Pago"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para editar pagos */}
      <Dialog
        open={showEditPaymentModal}
        onOpenChange={setShowEditPaymentModal}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Editar Pago - Venta #{selectedSale?.transaction?.transaction_id}
            </DialogTitle>
          </DialogHeader>
          {selectedPaymentForEdit && (
            <div className="space-y-4">
              {/* Formulario de edición de pago */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Monto del Pago</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={editPaymentAmount || ""}
                    onChange={(e) =>
                      setEditPaymentAmount(parseFloat(e.target.value) || 0)
                    }
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Método de Pago</Label>
                  <Select
                    value={editPaymentMethod}
                    onValueChange={setEditPaymentMethod}
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
                  <Label>Notas (opcional)</Label>
                  <Input
                    placeholder="Agregar notas al pago..."
                    value={editPaymentNote}
                    onChange={(e) => setEditPaymentNote(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={closeEditPaymentModal}>
              Cancelar
            </Button>
            <Button
              onClick={handleEditPayment}
              disabled={isProcessingEditPayment}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isProcessingEditPayment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Actualizar Pago"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Presupuesto */}
      <Dialog open={showBudgetModal} onOpenChange={setShowBudgetModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Presupuesto de Venta</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Información del Cliente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-semibold mb-2">Información del Cliente</h3>
                {selectedClient ? (
                  <>
                    <p>
                      <strong>Nombre:</strong>{" "}
                      {clients.find(
                        (c) => c.person_id.toString() === selectedClient
                      )?.name || "Cliente no encontrado"}
                    </p>
                    <p>
                      <strong>Empresa:</strong>{" "}
                      {clients.find(
                        (c) => c.person_id.toString() === selectedClient
                      )?.company_name || "N/A"}
                    </p>
                    <p>
                      <strong>Email:</strong>{" "}
                      {clients.find(
                        (c) => c.person_id.toString() === selectedClient
                      )?.email || "N/A"}
                    </p>
                    <p>
                      <strong>Teléfono:</strong>{" "}
                      {clients.find(
                        (c) => c.person_id.toString() === selectedClient
                      )?.phone || "N/A"}
                    </p>
                  </>
                ) : (
                  <p className="text-gray-500 italic">
                    No se ha seleccionado un cliente
                  </p>
                )}
              </div>
              <div>
                <h3 className="font-semibold mb-2">
                  Información del Presupuesto
                </h3>
                <p>
                  <strong>Fecha:</strong>{" "}
                  {new Date().toLocaleDateString("es-AR")}
                </p>
                <div className="flex items-center gap-2 mb-2">
                  <strong>Tipo de Impuesto:</strong>
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800 border-green-200"
                  >
                    Con IVA
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Presupuesto con IVA incluido (21%)
                </p>
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
                  {cartItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.codigo}
                      </TableCell>
                      <TableCell>{item.nombre}</TableCell>
                      <TableCell className="text-right">
                        {item.cantidad}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.precio)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Extras */}
            {saleExtras.length > 0 && (
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
                    {saleExtras.map((extra) => (
                      <TableRow key={extra.id}>
                        <TableCell className="font-medium">
                          {extra.type}
                        </TableCell>
                        <TableCell>{extra.note}</TableCell>
                        <TableCell
                          className={`text-right ${
                            extra.type === "Descuento" ? "text-green-600" : ""
                          }`}
                        >
                          {extra.type === "Descuento" ? "-" : ""}
                          {formatCurrency(extra.price)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Resumen */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-3">Resumen del Presupuesto</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p>
                    <strong>Subtotal Productos:</strong> {formatCurrency(total)}
                  </p>
                  {totalExtras !== 0 && (
                    <p>
                      <strong>Cargos Adicionales:</strong>{" "}
                      <span className={totalExtras < 0 ? "text-green-600" : ""}>
                        {totalExtras < 0 ? "-" : ""}
                        {formatCurrency(Math.abs(totalExtras))}
                      </span>
                    </p>
                  )}
                  <p>
                    <strong>Subtotal:</strong>{" "}
                    {formatCurrency(total + totalExtras)}
                  </p>
                  <p>
                    <strong>IVA (21%):</strong>{" "}
                    {formatCurrency((total + totalExtras) * 0.21)}
                  </p>
                  <p className="text-lg font-bold">
                    Total: {formatCurrency((total + totalExtras) * 1.21)}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800 border-green-300 font-semibold">
                      Incluye IVA
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Este presupuesto incluye IVA del 21%. El monto mostrado es
                    el total a pagar.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowBudgetModal(false)}>
              Cerrar
            </Button>
            <Button
              variant="outline"
              className="border-green-200 text-green-700 hover:bg-green-50"
              onClick={async () => {
                try {
                  // Guardar el presupuesto en el historial
                  const savedBudget = await saveBudgetToHistory();
                  notification.success(
                    `Presupuesto guardado con ID: ${
                      savedBudget.transaction_id || "N/A"
                    }`
                  );
                  // Cerrar el modal después de guardar
                  setShowBudgetModal(false);
                } catch (error) {
                  notification.error("Error al guardar el presupuesto");
                  console.error("Error:", error);
                }
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Guardar Presupuesto
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={async () => {
                try {
                  // Guardar el presupuesto en el historial
                  await saveBudgetToHistory();

                  // Crear una ventana nueva para imprimir/descargar solo el presupuesto
                  const printWindow = window.open("", "_blank");
                  if (printWindow) {
                    printWindow.document.write(`
                       <!DOCTYPE html>
                       <html>
                       <head>
                         <title>Presupuesto de Venta</title>
                         <style>
                           * {
                             box-sizing: border-box;
                           }
                           body { 
                             font-family: Arial, sans-serif; 
                             margin: 10px; 
                             padding: 10px;
                             color: #333;
                             font-size: 12px;
                             line-height: 1.4;
                           }
                           .header { 
                             text-align: center; 
                             margin-bottom: 20px; 
                             border-bottom: 2px solid #333; 
                             padding-bottom: 15px;
                           }
                           .header h1 {
                             margin: 0 0 10px 0;
                             font-size: 24px;
                           }
                           .info-section { 
                             display: flex; 
                             justify-content: space-between; 
                             margin-bottom: 20px; 
                             background: #f5f5f5; 
                             padding: 15px; 
                             border-radius: 4px;
                           }
                           .info-column { 
                             flex: 1; 
                             margin-right: 15px;
                           }
                           .info-column:last-child { 
                             margin-right: 0; 
                           }
                           .info-column h3 {
                             margin: 0 0 10px 0;
                             font-size: 14px;
                           }
                           .info-column p {
                             margin: 5px 0;
                             font-size: 11px;
                           }
                           table { 
                             width: 100%; 
                             border-collapse: collapse; 
                             margin-bottom: 20px;
                             font-size: 11px;
                           }
                           th, td { 
                             border: 1px solid #ddd; 
                             padding: 6px 4px; 
                             text-align: left;
                             word-wrap: break-word;
                           }
                           th { 
                             background-color: #f2f2f2; 
                             font-weight: bold;
                             font-size: 10px;
                           }
                           .text-right { 
                             text-align: right;
                           }
                           .summary { 
                             background: #f5f5f5; 
                             padding: 15px; 
                             border-radius: 4px; 
                             margin-top: 15px;
                           }
                           .summary h3 {
                             margin: 0 0 10px 0;
                             font-size: 14px;
                           }
                           .summary p {
                             margin: 5px 0;
                             font-size: 11px;
                           }
                           .total { 
                             font-size: 16px; 
                             font-weight: bold; 
                             margin-top: 10px;
                           }
                           .badge { 
                             display: inline-block; 
                             padding: 2px 6px; 
                             border-radius: 3px; 
                             font-size: 10px; 
                             font-weight: bold;
                           }
                           .badge-green { 
                             background: #d4edda; 
                             color: #155724; 
                             border: 1px solid #c3e6cb;
                           }
                           .badge-red { 
                             background: #f8d7da; 
                             color: #721c24; 
                             border: 1px solid #f5c6cb;
                           }
                           @media print {
                             body { 
                               margin: 0.5in; 
                               padding: 0;
                               font-size: 11px;
                             }
                             .header h1 {
                               font-size: 20px;
                             }
                             .info-section {
                               padding: 10px;
                               margin-bottom: 15px;
                             }
                             .info-column p {
                               font-size: 10px;
                               margin: 3px 0;
                             }
                             table {
                               font-size: 10px;
                               margin-bottom: 15px;
                             }
                             th, td {
                               padding: 4px 2px;
                               font-size: 9px;
                             }
                             .summary {
                               padding: 10px;
                               margin-top: 10px;
                             }
                             .summary p {
                               font-size: 10px;
                               margin: 3px 0;
                             }
                             .total {
                               font-size: 14px;
                             }
                             .no-print { display: none; }
                           }
                         </style>
                       </head>
                       <body>
                         <div class="header">
                           <h1>PRESUPUESTO DE VENTA</h1>
                           <p>Fecha: ${new Date().toLocaleDateString(
                             "es-AR"
                           )}</p>
                         </div>
                         
                         <div class="info-section">
                           <div class="info-column">
                             <h3>Información del Cliente</h3>
                             ${
                               selectedClient
                                 ? `
                               <p><strong>Nombre:</strong> ${
                                 clients.find(
                                   (c) =>
                                     c.person_id.toString() === selectedClient
                                 )?.name || "Cliente no encontrado"
                               }</p>
                               <p><strong>Empresa:</strong> ${
                                 clients.find(
                                   (c) =>
                                     c.person_id.toString() === selectedClient
                                 )?.company_name || "N/A"
                               }</p>
                               <p><strong>Email:</strong> ${
                                 clients.find(
                                   (c) =>
                                     c.person_id.toString() === selectedClient
                                 )?.email || "N/A"
                               }</p>
                               <p><strong>Teléfono:</strong> ${
                                 clients.find(
                                   (c) =>
                                     c.person_id.toString() === selectedClient
                                 )?.phone || "N/A"
                               }</p>
                             `
                                 : "<p>No se ha seleccionado un cliente</p>"
                             }
                           </div>
                           <div class="info-column">
                             <h3>Información del Presupuesto</h3>
                             <p><strong>Tipo de Impuesto:</strong> 
                               <span class="badge badge-green">
                                 Con IVA
                               </span>
                             </p>
                             <p><small>Presupuesto con IVA incluido (21%)</small></p>
                           </div>
                         </div>

                         <h3>Productos</h3>
                         <table>
                           <thead>
                             <tr>
                               <th>Código</th>
                               <th>Producto</th>
                               <th class="text-right">Cantidad</th>
                               <th class="text-right">Precio Unit.</th>
                               <th class="text-right">Total</th>
                             </tr>
                           </thead>
                           <tbody>
                             ${cartItems
                               .map(
                                 (item) => `
                               <tr>
                                 <td>${item.codigo}</td>
                                 <td>${item.nombre}</td>
                                 <td class="text-right">${item.cantidad}</td>
                                 <td class="text-right">$${item.precio.toLocaleString(
                                   "es-AR"
                                 )}</td>
                                 <td class="text-right">$${item.total.toLocaleString(
                                   "es-AR"
                                 )}</td>
                               </tr>
                             `
                               )
                               .join("")}
                           </tbody>
                         </table>

                         ${
                           saleExtras.length > 0
                             ? `
                           <h3>Cargos Adicionales</h3>
                           <table>
                             <thead>
                               <tr>
                                 <th>Tipo</th>
                                 <th>Descripción</th>
                                 <th class="text-right">Monto</th>
                               </tr>
                             </thead>
                             <tbody>
                               ${saleExtras
                                 .map(
                                   (extra) => `
                                 <tr>
                                   <td>${extra.type}</td>
                                   <td>${extra.note}</td>
                                   <td class="text-right ${
                                     extra.type === "Descuento"
                                       ? "text-green-600"
                                       : ""
                                   }">
                                     ${
                                       extra.type === "Descuento" ? "-" : ""
                                     }$${extra.price.toLocaleString("es-AR")}
                                   </td>
                                 </tr>
                               `
                                 )
                                 .join("")}
                             </tbody>
                           </table>
                         `
                             : ""
                         }

                         <div class="summary">
                           <h3>Resumen del Presupuesto</h3>
                           <p><strong>Subtotal Productos:</strong> $${total.toLocaleString(
                             "es-AR"
                           )}</p>
                           ${
                             totalExtras !== 0
                               ? `
                             <p><strong>Cargos Adicionales:</strong> 
                               <span class="${
                                 totalExtras < 0 ? "text-green-600" : ""
                               }">
                                 ${totalExtras < 0 ? "-" : ""}$${Math.abs(
                                   totalExtras
                                 ).toLocaleString("es-AR")}
                               </span>
                             </p>
                           `
                               : ""
                           }
                           <p><strong>Subtotal:</strong> $${(
                             total + totalExtras
                           ).toLocaleString("es-AR")}</p>
                           <p><strong>IVA (21%):</strong> $${(
                             (total + totalExtras) *
                             0.21
                           ).toLocaleString("es-AR")}</p>
                           <p class="total">Total: $${(
                             (total + totalExtras) *
                             1.21
                           ).toLocaleString("es-AR")}</p>
                           
                           <div style="margin-top: 15px;">
                             <span class="badge badge-green">
                               Incluye IVA
                             </span>
                             <p style="margin-top: 10px; font-size: 12px; color: #666;">
                               Este presupuesto incluye IVA del 21%. El monto mostrado es el total a pagar.
                             </p>
                           </div>
                         </div>
                       </body>
                       </html>
                     `);
                    printWindow.document.close();
                    printWindow.print();
                    printWindow.close();
                  }
                } catch (error) {
                  notification.error("Error al guardar el presupuesto");
                  console.error("Error:", error);
                }
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Imprimir/Descargar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Presupuesto de Transacción Completada */}
      <Dialog
        open={showTransactionBudgetModal}
        onOpenChange={setShowTransactionBudgetModal}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Recibo de Venta #{completedTransaction?.transaction_id}
            </DialogTitle>
          </DialogHeader>

          {completedTransaction && (
            <div className="space-y-6">
              {/* Información del Cliente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold mb-2">
                    Información del Cliente
                  </h3>
                  {completedTransaction.client ? (
                    <>
                      <p>
                        <strong>Nombre:</strong>{" "}
                        {completedTransaction.client.name}
                      </p>
                      <p>
                        <strong>Empresa:</strong>{" "}
                        {completedTransaction.client.company_name || "N/A"}
                      </p>
                      <p>
                        <strong>Email:</strong>{" "}
                        {completedTransaction.client.email || "N/A"}
                      </p>
                      <p>
                        <strong>Teléfono:</strong>{" "}
                        {completedTransaction.client.phone || "N/A"}
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-500 italic">
                      Cliente no especificado
                    </p>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">
                    Información de la Venta
                  </h3>
                  <p>
                    <strong>Número de Venta:</strong> #
                    {completedTransaction.transaction_id}
                  </p>
                  <p>
                    <strong>Fecha:</strong>{" "}
                    {new Date(completedTransaction.date).toLocaleDateString(
                      "es-AR"
                    )}
                  </p>
                  <div className="flex items-center gap-2 mb-2">
                    <strong>Tipo de Impuesto:</strong>
                    <Badge
                      variant="default"
                      className="bg-green-100 text-green-800 border-green-200"
                    >
                      Con IVA
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Venta con IVA incluido (21%)
                  </p>
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
                    {completedTransaction.items.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.codigo}
                        </TableCell>
                        <TableCell>{item.nombre}</TableCell>
                        <TableCell className="text-right">
                          {item.cantidad}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.precio)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Extras */}
              {completedTransaction.extras.length > 0 && (
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
                      {completedTransaction.extras.map((extra: any) => (
                        <TableRow key={extra.id}>
                          <TableCell className="font-medium">
                            {extra.type}
                          </TableCell>
                          <TableCell>{extra.note}</TableCell>
                          <TableCell
                            className={`text-right ${
                              extra.type === "Descuento" ? "text-green-600" : ""
                            }`}
                          >
                            {extra.type === "Descuento" ? "-" : ""}
                            {formatCurrency(extra.price)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Información de Pago */}
              {completedTransaction.payment && (
                <div>
                  <h3 className="font-semibold mb-3">Información de Pago</h3>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p>
                          <strong>Método de Pago:</strong>{" "}
                          {completedTransaction.payment.method}
                        </p>
                        <p>
                          <strong>Fecha de Pago:</strong>{" "}
                          {new Date(
                            completedTransaction.payment.date
                          ).toLocaleDateString("es-AR")}
                        </p>
                      </div>
                      <div>
                        <p>
                          <strong>Monto Pagado:</strong>{" "}
                          {formatCurrency(completedTransaction.payment.amount)}
                        </p>
                        {completedTransaction.payment.note && (
                          <p>
                            <strong>Nota:</strong>{" "}
                            {completedTransaction.payment.note}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Resumen */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-3">Resumen de la Venta</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p>
                      <strong>Subtotal Productos:</strong>{" "}
                      {formatCurrency(completedTransaction.totals.subtotal)}
                    </p>
                    {completedTransaction.totals.extras !== 0 && (
                      <p>
                        <strong>Cargos Adicionales:</strong>{" "}
                        <span
                          className={
                            completedTransaction.totals.extras < 0
                              ? "text-green-600"
                              : ""
                          }
                        >
                          {completedTransaction.totals.extras < 0 ? "-" : ""}
                          {formatCurrency(
                            Math.abs(completedTransaction.totals.extras)
                          )}
                        </span>
                      </p>
                    )}
                    <p>
                      <strong>Subtotal:</strong>{" "}
                      {formatCurrency(
                        completedTransaction.totals.subtotal +
                          completedTransaction.totals.extras
                      )}
                    </p>
                    <p>
                      <strong>IVA (21%):</strong>{" "}
                      {formatCurrency(completedTransaction.totals.tax)}
                    </p>
                    <p className="text-lg font-bold">
                      Total: {formatCurrency(completedTransaction.totals.total)}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800 border-green-300 font-semibold">
                        Venta Completada
                      </Badge>
                      <Badge className="bg-green-100 text-green-800 border-green-300 font-semibold">
                        Incluye IVA
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Esta venta ha sido completada exitosamente. El monto
                      mostrado incluye IVA del 21%.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowTransactionBudgetModal(false)}
            >
              Cerrar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                // Crear una ventana nueva para imprimir/descargar el recibo
                const printWindow = window.open("", "_blank");
                if (printWindow && completedTransaction) {
                  printWindow.document.write(`
                     <!DOCTYPE html>
                     <html>
                     <head>
                       <title>Recibo de Venta #${
                         completedTransaction.transaction_id
                       }</title>
                       <style>
                         * {
                           box-sizing: border-box;
                         }
                         body { 
                           font-family: Arial, sans-serif; 
                           margin: 10px; 
                           padding: 10px;
                           color: #333;
                           font-size: 12px;
                           line-height: 1.4;
                         }
                         .header { 
                           text-align: center; 
                           margin-bottom: 20px; 
                           border-bottom: 2px solid #333; 
                           padding-bottom: 15px;
                         }
                         .header h1 {
                           margin: 0 0 10px 0;
                           font-size: 24px;
                         }
                         .info-section { 
                           display: flex; 
                           justify-content: space-between; 
                           margin-bottom: 20px; 
                           background: #f5f5f5; 
                           padding: 15px; 
                           border-radius: 4px;
                         }
                         .info-column { 
                           flex: 1; 
                           margin-right: 15px;
                         }
                         .info-column:last-child { 
                           margin-right: 0; 
                         }
                         .info-column h3 {
                           margin: 0 0 10px 0;
                           font-size: 14px;
                         }
                         .info-column p {
                           margin: 5px 0;
                           font-size: 11px;
                         }
                         table { 
                           width: 100%; 
                           border-collapse: collapse; 
                           margin-bottom: 20px;
                           font-size: 11px;
                         }
                         th, td { 
                           border: 1px solid #ddd; 
                           padding: 6px 4px; 
                           text-align: left;
                           word-wrap: break-word;
                         }
                         th { 
                           background-color: #f2f2f2; 
                           font-weight: bold;
                           font-size: 10px;
                         }
                         .text-right { 
                           text-align: right;
                         }
                         .summary { 
                           background: #f5f5f5; 
                           padding: 15px; 
                           border-radius: 4px; 
                           margin-top: 15px;
                         }
                         .summary h3 {
                           margin: 0 0 10px 0;
                           font-size: 14px;
                         }
                         .summary p {
                           margin: 5px 0;
                           font-size: 11px;
                         }
                         .total { 
                           font-size: 16px; 
                           font-weight: bold; 
                           margin-top: 10px;
                         }
                         .badge { 
                           display: inline-block; 
                           padding: 2px 6px; 
                           border-radius: 3px; 
                           font-size: 10px; 
                           font-weight: bold;
                         }
                         .badge-green { 
                           background: #d4edda; 
                           color: #155724; 
                           border: 1px solid #c3e6cb;
                         }
                         .payment-info {
                           background: #e3f2fd;
                           padding: 15px;
                           border-radius: 4px;
                           margin: 15px 0;
                         }
                         @media print {
                           body { 
                             margin: 0.5in; 
                             padding: 0;
                             font-size: 11px;
                           }
                           .header h1 {
                             font-size: 20px;
                           }
                           .info-section {
                             padding: 10px;
                             margin-bottom: 15px;
                           }
                           .info-column p {
                             font-size: 10px;
                             margin: 3px 0;
                           }
                           table {
                             font-size: 10px;
                             margin-bottom: 15px;
                           }
                           th, td {
                             padding: 4px 2px;
                             font-size: 9px;
                           }
                           .summary {
                             padding: 10px;
                             margin-top: 10px;
                           }
                           .summary p {
                             font-size: 10px;
                             margin: 3px 0;
                           }
                           .total {
                             font-size: 14px;
                           }
                           .no-print { display: none; }
                         }
                       </style>
                     </head>
                     <body>
                       <div class="header">
                         <h1>RECIBO DE VENTA</h1>
                         <p>Número: #${completedTransaction.transaction_id}</p>
                         <p>Fecha: ${new Date(
                           completedTransaction.date
                         ).toLocaleDateString("es-AR")}</p>
                       </div>
                       
                       <div class="info-section">
                         <div class="info-column">
                           <h3>Información del Cliente</h3>
                           ${
                             completedTransaction.client
                               ? `
                             <p><strong>Nombre:</strong> ${
                               completedTransaction.client.name
                             }</p>
                             <p><strong>Empresa:</strong> ${
                               completedTransaction.client.company_name || "N/A"
                             }</p>
                             <p><strong>Email:</strong> ${
                               completedTransaction.client.email || "N/A"
                             }</p>
                             <p><strong>Teléfono:</strong> ${
                               completedTransaction.client.phone || "N/A"
                             }</p>
                           `
                               : "<p>Cliente no especificado</p>"
                           }
                         </div>
                         <div class="info-column">
                           <h3>Información de la Venta</h3>
                           <p><strong>Tipo de Impuesto:</strong> 
                             <span class="badge badge-green">
                               Con IVA
                             </span>
                           </p>
                           <p><small>Venta con IVA incluido (21%)</small></p>
                         </div>
                       </div>

                       <h3>Productos</h3>
                       <table>
                         <thead>
                           <tr>
                             <th>Código</th>
                             <th>Producto</th>
                             <th class="text-right">Cantidad</th>
                             <th class="text-right">Precio Unit.</th>
                             <th class="text-right">Total</th>
                           </tr>
                         </thead>
                         <tbody>
                           ${completedTransaction.items
                             .map(
                               (item: any) => `
                             <tr>
                               <td>${item.codigo}</td>
                               <td>${item.nombre}</td>
                               <td class="text-right">${item.cantidad}</td>
                               <td class="text-right">$${item.precio.toLocaleString(
                                 "es-AR"
                               )}</td>
                               <td class="text-right">$${item.total.toLocaleString(
                                 "es-AR"
                               )}</td>
                             </tr>
                           `
                             )
                             .join("")}
                         </tbody>
                       </table>

                       ${
                         completedTransaction.extras.length > 0
                           ? `
                         <h3>Cargos Adicionales</h3>
                         <table>
                           <thead>
                             <tr>
                               <th>Tipo</th>
                               <th>Descripción</th>
                               <th class="text-right">Monto</th>
                             </tr>
                           </thead>
                           <tbody>
                             ${completedTransaction.extras
                               .map(
                                 (extra: any) => `
                               <tr>
                                 <td>${extra.type}</td>
                                 <td>${extra.note}</td>
                                 <td class="text-right ${
                                   extra.type === "Descuento"
                                     ? "text-green-600"
                                     : ""
                                 }">
                                   ${
                                     extra.type === "Descuento" ? "-" : ""
                                   }$${extra.price.toLocaleString("es-AR")}
                                 </td>
                               </tr>
                             `
                               )
                               .join("")}
                           </tbody>
                         </table>
                       `
                           : ""
                       }

                       ${
                         completedTransaction.payment
                           ? `
                         <div class="payment-info">
                           <h3>Información de Pago</h3>
                           <div style="display: flex; justify-content: space-between;">
                             <div>
                               <p><strong>Método:</strong> ${
                                 completedTransaction.payment.method
                               }</p>
                               <p><strong>Fecha:</strong> ${new Date(
                                 completedTransaction.payment.date
                               ).toLocaleDateString("es-AR")}</p>
                             </div>
                             <div>
                               <p><strong>Monto Pagado:</strong> $${completedTransaction.payment.amount.toLocaleString(
                                 "es-AR"
                               )}</p>
                               ${
                                 completedTransaction.payment.note
                                   ? `<p><strong>Nota:</strong> ${completedTransaction.payment.note}</p>`
                                   : ""
                               }
                             </div>
                           </div>
                         </div>
                       `
                           : ""
                       }

                       <div class="summary">
                         <h3>Resumen de la Venta</h3>
                         <p><strong>Subtotal Productos:</strong> $${completedTransaction.totals.subtotal.toLocaleString(
                           "es-AR"
                         )}</p>
                         ${
                           completedTransaction.totals.extras !== 0
                             ? `
                           <p><strong>Cargos Adicionales:</strong> 
                             <span class="${
                               completedTransaction.totals.extras < 0
                                 ? "text-green-600"
                                 : ""
                             }">
                               ${
                                 completedTransaction.totals.extras < 0
                                   ? "-"
                                   : ""
                               }$${Math.abs(
                                 completedTransaction.totals.extras
                               ).toLocaleString("es-AR")}
                             </span>
                           </p>
                         `
                             : ""
                         }
                         <p><strong>Subtotal:</strong> $${(
                           completedTransaction.totals.subtotal +
                           completedTransaction.totals.extras
                         ).toLocaleString("es-AR")}</p>
                         <p><strong>IVA (21%):</strong> $${completedTransaction.totals.tax.toLocaleString(
                           "es-AR"
                         )}</p>
                         <p class="total">Total: $${completedTransaction.totals.total.toLocaleString(
                           "es-AR"
                         )}</p>
                         
                         <div style="margin-top: 15px;">
                           <span class="badge badge-green">
                             Venta Completada
                           </span>
                           <span class="badge badge-green" style="margin-left: 10px;">
                             Incluye IVA
                           </span>
                           <p style="margin-top: 10px; font-size: 12px; color: #666;">
                             Esta venta ha sido completada exitosamente. El monto mostrado incluye IVA del 21%.
                           </p>
                         </div>
                       </div>
                     </body>
                     </html>
                   `);
                  printWindow.document.close();
                  printWindow.print();
                  printWindow.close();
                }
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Imprimir Recibo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
