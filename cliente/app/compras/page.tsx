"use client";

import { Label } from "@/components/ui/label";

import { useEffect, useState } from "react";
import {
  Download,
  Plus,
  ShoppingBag,
  Trash2,
  UserPlus,
  Search,
  X,
  Eye,
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
import { getAllActiveProviders, createPerson } from "@/api/personsApi";
import {
  createPurchase,
  getPurchasesHistory,
  getPurchaseDetails,
} from "@/api/transactionsApi";

import { createItem } from "@/api/itemsApi";
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

export default function ComprasPage() {
  const { user, token, validateToken, loading } = useAuth();
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

  // HISTORIAL DE COMPRAS
  const [purchasesHistory, setPurchasesHistory] = useState<
    PurchaseHistoryItem[]
  >([]);
  // historial de compras original
  const [originalPurchasesHistory, setOriginalPurchasesHistory] = useState<
    PurchaseHistoryItem[]
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
  const [selectedPurchase, setSelectedPurchase] = useState<any | null>(null);
  const [showPurchaseDetails, setShowPurchaseDetails] = useState(false);
  const [isLoadingPurchaseDetails, setIsLoadingPurchaseDetails] =
    useState(false);

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

  // LISTADO DE PROVEEDORES
  // lista de proveedores
  const [providersList, setProvidersList] = useState<any[]>([]);
  // lista de proveedores original
  const [originalProvidersList, setOriginalProvidersList] = useState<any[]>([]);
  // estado de carga de proveedores
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  // error de proveedores
  const [providersError, setProvidersError] = useState("");
  // termino de búsqueda de proveedores
  const [providersSearchTerm, setProvidersSearchTerm] = useState("");
  // paginación de proveedores
  const [currentProvidersPage, setCurrentProvidersPage] = useState(1);
  // items por página de proveedores
  const [providersItemsPerPage, setProvidersItemsPerPage] = useState(10);
  // diálogo de crear proveedor
  const [isCreateProviderDialogOpen, setIsCreateProviderDialogOpen] =
    useState(false);
  // formulario de crear proveedor
  const [newProvider, setNewProvider] = useState({
    name: "",
    company_name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
    tax_id: "",
    tax_type: "R.I",
  });
  const [isCreatingProvider, setIsCreatingProvider] = useState(false);
  const [providerFormError, setProviderFormError] = useState("");

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
      errors.push("Debe seleccionar un proveedor");
    }

    // Validar método de pago
    if (!paymentMethod) {
      errors.push("Debe seleccionar un método de pago");
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

    // Validar productos individuales
    cartItems.forEach((item, index) => {
      if (item.precioCompra <= 0) {
        errors.push(`El producto "${item.nombre}" tiene un precio inválido`);
      }
      if (item.cantidad <= 0) {
        errors.push(`El producto "${item.nombre}" tiene una cantidad inválida`);
      }
      if (item.total <= 0) {
        errors.push(`El producto "${item.nombre}" tiene un total inválido`);
      }
    });

    return errors;
  };

  // COMPRA
  // eliminar item del carrito
  const removeItem = (id: number) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
  };

  // actualizar cantidad del item
  const updateQuantity = (id: number, cantidad: number) => {
    // Validar cantidad
    if (cantidad <= 0) {
      alert("La cantidad debe ser mayor a 0");
      return;
    }
    if (cantidad > 999999999) {
      alert("La cantidad no puede ser mayor a 999,999,999");
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
    // Validar precio
    if (precioCompra <= 0) {
      alert("El precio debe ser mayor a 0");
      return;
    }
    if (precioCompra > 999999999.99) {
      alert("El precio no puede ser mayor a $999,999,999.99");
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
      alert("El producto no tiene un precio de compra válido");
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
      alert("Errores de validación:\n" + errors.join("\n"));
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

      // Limpiar el carrito y mostrar mensaje de éxito
      setCartItems([]);
      setSelectedProvider("");
      setProviderSearchTerm("");
      setProviderSearchResults([]);
      setShowProviderResults(false);
      setPaymentMethod("");
      setNotes("");
      setSearchTerm("");
      setSearchResults([]);
      setShowSearchResults(false);

      alert("¡Compra confirmada exitosamente!");
    } catch (error: any) {
      console.error("Error al confirmar la compra:", error);
      alert(
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

  // LISTADO DE PROVEEDORES
  const loadProvidersList = async () => {
    setIsLoadingProviders(true);
    setProvidersError("");

    try {
      const response = await getAllActiveProviders();
      const providersData = response.providers || [];
      setProvidersList(providersData);
      setOriginalProvidersList(providersData);
    } catch (error: any) {
      console.error("Error al cargar proveedores:", error.message);
      setProvidersError("Error al cargar el listado de proveedores");
      setProvidersList([]);
      setOriginalProvidersList([]);
    } finally {
      setIsLoadingProviders(false);
    }
  };

  // búsqueda de proveedores
  const handleProvidersSearch = (searchTerm: string) => {
    setProvidersSearchTerm(searchTerm);
    setCurrentProvidersPage(1); // Reset a la primera página al buscar

    if (!searchTerm.trim()) {
      setProvidersList(originalProvidersList);
      return;
    }

    // filtrar proveedores
    const filteredProviders = originalProvidersList.filter(
      (provider) =>
        provider.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.company_name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        provider.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setProvidersList(filteredProviders);
  };

  // Funciones de paginación para proveedores
  const getPaginatedProviders = () => {
    const startIndex = (currentProvidersPage - 1) * providersItemsPerPage;
    const endIndex = startIndex + providersItemsPerPage;
    return providersList.slice(startIndex, endIndex);
  };

  const totalProvidersPages = Math.ceil(
    providersList.length / providersItemsPerPage
  );

  // Funciones para crear proveedor
  const handleProviderInputChange = (field: string, value: string) => {
    let formattedValue = value;

    // Formatear CUIT automáticamente
    if (field === "tax_id") {
      // Remover todos los caracteres no numéricos
      const numbersOnly = value.replace(/\D/g, "");

      // Aplicar formato XX-XXXXXXXX-X
      if (numbersOnly.length <= 2) {
        formattedValue = numbersOnly;
      } else if (numbersOnly.length <= 10) {
        formattedValue = `${numbersOnly.slice(0, 2)}-${numbersOnly.slice(2)}`;
      } else {
        formattedValue = `${numbersOnly.slice(0, 2)}-${numbersOnly.slice(
          2,
          10
        )}-${numbersOnly.slice(10, 11)}`;
      }
    }

    setNewProvider((prev) => ({
      ...prev,
      [field]: formattedValue,
    }));
    setProviderFormError(""); // Limpiar errores al escribir
  };

  const validateProviderForm = () => {
    // Validar nombre
    if (!newProvider.name.trim()) {
      setProviderFormError("El nombre es obligatorio");
      return false;
    }
    // Validar email
    if (!newProvider.email.trim()) {
      setProviderFormError("El email es obligatorio");
      return false;
    }
    // Validar formato de email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newProvider.email)) {
      setProviderFormError("El email no tiene un formato válido");
      return false;
    }
    // Validar CUIT
    if (!newProvider.tax_id.trim()) {
      setProviderFormError("El CUIT es obligatorio");
      return false;
    }
    // Validar formato de CUIT
    if (!/^\d{2}-\d{8}-\d{1}$/.test(newProvider.tax_id)) {
      setProviderFormError(
        "El CUIT debe tener 11 dígitos (se formatea automáticamente)"
      );
      return false;
    }
    return true;
  };

  const handleCreateProvider = async () => {
    if (!validateProviderForm()) return;

    setIsCreatingProvider(true);
    setProviderFormError("");

    try {
      // Convertir el CUIT de formato XX-XXXXXXXX-X a XXXXXXXXXXX (sin guiones)
      const taxIdWithoutDashes = newProvider.tax_id.replace(/-/g, "");

      // Mapear los tipos de IVA al formato que espera el backend
      const taxTypeMapping: { [key: string]: string } = {
        "R.I": "R.I",
        M: "Monotributo",
        E: "Exento",
        C: "Consumidor Final",
      };

      const providerData = {
        name: newProvider.name.trim(),
        company_name: newProvider.company_name.trim() || "",
        phone: newProvider.phone.trim() || "",
        email: newProvider.email.trim(),
        address: newProvider.address.trim() || "",
        notes: newProvider.notes.trim() || "",
        provider: true,
        active: true,
        tax_id: taxIdWithoutDashes,
        tax_type: taxTypeMapping[newProvider.tax_type] || "R.I",
      };

      console.log("Datos del proveedor a enviar:", providerData);
      const response = await createPerson(providerData);

      if (response.person) {
        // Limpiar formulario
        setNewProvider({
          name: "",
          company_name: "",
          phone: "",
          email: "",
          address: "",
          notes: "",
          tax_id: "",
          tax_type: "R.I",
        });

        // Cerrar diálogo
        setIsCreateProviderDialogOpen(false);

        // Recargar lista de proveedores
        await loadProvidersList();

        // Mostrar mensaje de éxito
        alert("Proveedor creado exitosamente");
      } else {
        setProviderFormError("Error al crear el proveedor");
      }
    } catch (error: any) {
      console.error("Error al crear proveedor:", error);
      if (error.response && error.response.data && error.response.data.error) {
        setProviderFormError(`Error: ${error.response.data.error}`);
      } else {
        setProviderFormError(
          "Error al crear el proveedor. Intente nuevamente."
        );
      }
    } finally {
      setIsCreatingProvider(false);
    }
  };

  const handleCloseProviderDialog = () => {
    setIsCreateProviderDialogOpen(false);
    setNewProvider({
      name: "",
      company_name: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
      tax_id: "",
      tax_type: "R.I",
    });
    setProviderFormError("");
  };

  // Cargar historial de compras cuando se carga el componente
  useEffect(() => {
    loadPurchasesHistory();
  }, []);

  // Cargar listado de proveedores cuando se carga el componente
  useEffect(() => {
    loadProvidersList();
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
      setPurchasesHistory(purchasesData);
      setOriginalPurchasesHistory(purchasesData);
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
      alert("Error al cargar los detalles de la compra");
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
                  <div className="relative provider-search-container">
                    <Input
                      placeholder="Buscar proveedor por nombre o empresa..."
                      value={providerSearchTerm}
                      onChange={(e) => {
                        setProviderSearchTerm(e.target.value);
                        handleProviderSearch(e.target.value);
                      }}
                      onFocus={() => {
                        if (providerSearchTerm.trim()) {
                          setShowProviderResults(true);
                        }
                      }}
                    />

                    {/* Resultados de búsqueda de proveedores */}
                    {showProviderResults &&
                      providerSearchResults.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {providerSearchResults.map((provider) => (
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
                          ))}
                        </div>
                      )}

                    {/* Proveedor seleccionado */}
                    {selectedProvider && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                        <div className="text-sm text-green-800">
                          Proveedor seleccionado:{" "}
                          {
                            providers.find(
                              (p) => p.person_id.toString() === selectedProvider
                            )?.name
                          }
                        </div>
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
                        alert(
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
                        <TableHead className="text-right">
                          <Button
                            variant="ghost"
                            onClick={() => requestPurchasesSort("items_count")}
                          >
                            Items
                            {getPurchasesSortIndicator("items_count")}
                          </Button>
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
                            {purchase.items_count || 0}
                          </TableCell>
                          <TableCell className="text-right">
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

        <TabsContent value="proveedores">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Proveedores</CardTitle>
              <CardDescription>
                Administre la información de sus proveedores
              </CardDescription>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Buscar proveedores..."
                    className="w-[250px]"
                    value={providersSearchTerm}
                    onChange={(e) => handleProvidersSearch(e.target.value)}
                  />

                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                  </Button>
                </div>

                <Button
                  onClick={() => setIsCreateProviderDialogOpen(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Crear Proveedor
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingProviders ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Cargando proveedores...</p>
                </div>
              ) : providersError ? (
                <div className="text-center py-8">
                  <p className="text-red-600">{providersError}</p>
                  <Button
                    onClick={loadProvidersList}
                    className="mt-4 bg-blue-600 hover:bg-blue-700"
                  >
                    Reintentar
                  </Button>
                </div>
              ) : providersList.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">
                    {providersSearchTerm
                      ? "No se encontraron proveedores"
                      : "No hay proveedores registrados"}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getPaginatedProviders().map((provider) => (
                      <TableRow key={provider.person_id}>
                        <TableCell className="font-medium">
                          {provider.name}
                        </TableCell>
                        <TableCell>{provider.company_name || "-"}</TableCell>
                        <TableCell>{provider.phone || "-"}</TableCell>
                        <TableCell>{provider.email || "-"}</TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={provider.active ? "default" : "secondary"}
                          >
                            {provider.active ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Aquí se puede agregar funcionalidad para ver detalles o editar
                              console.log(
                                "Ver detalles del proveedor:",
                                provider
                              );
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* Paginación de proveedores */}
              {providersList.length > 0 && (
                <div className="flex items-center justify-between px-2 py-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">Mostrar:</span>
                    <Select
                      value={providersItemsPerPage.toString()}
                      onValueChange={(value) => {
                        setProvidersItemsPerPage(parseInt(value));
                        setCurrentProvidersPage(1); // Reset a la primera página
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
                      {(currentProvidersPage - 1) * providersItemsPerPage + 1} a{" "}
                      {Math.min(
                        currentProvidersPage * providersItemsPerPage,
                        providersList.length
                      )}{" "}
                      de {providersList.length} proveedores
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentProvidersPage(1)}
                      disabled={currentProvidersPage === 1}
                    >
                      Primera
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentProvidersPage(currentProvidersPage - 1)
                      }
                      disabled={currentProvidersPage === 1}
                    >
                      Anterior
                    </Button>

                    <span className="text-sm text-gray-700">
                      Página {currentProvidersPage} de {totalProvidersPages}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentProvidersPage(currentProvidersPage + 1)
                      }
                      disabled={currentProvidersPage === totalProvidersPages}
                    >
                      Siguiente
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentProvidersPage(totalProvidersPages)
                      }
                      disabled={currentProvidersPage === totalProvidersPages}
                    >
                      Última
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo de Crear Proveedor */}
      <Dialog
        open={isCreateProviderDialogOpen}
        onOpenChange={handleCloseProviderDialog}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Proveedor</DialogTitle>
            <DialogDescription>
              Complete la información del nuevo proveedor
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="provider-name">Nombre *</Label>
                <Input
                  id="provider-name"
                  placeholder="Nombre del proveedor"
                  value={newProvider.name}
                  onChange={(e) =>
                    handleProviderInputChange("name", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider-company">Empresa</Label>
                <Input
                  id="provider-company"
                  placeholder="Nombre de la empresa"
                  value={newProvider.company_name}
                  onChange={(e) =>
                    handleProviderInputChange("company_name", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="provider-phone">Teléfono</Label>
                <Input
                  id="provider-phone"
                  placeholder="Número de teléfono"
                  value={newProvider.phone}
                  onChange={(e) =>
                    handleProviderInputChange("phone", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider-email">Email *</Label>
                <Input
                  id="provider-email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={newProvider.email}
                  onChange={(e) =>
                    handleProviderInputChange("email", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="provider-tax-id">CUIT *</Label>
                <Input
                  id="provider-tax-id"
                  placeholder="Ingrese solo números (ej: 20123456789)"
                  value={newProvider.tax_id}
                  onChange={(e) =>
                    handleProviderInputChange("tax_id", e.target.value)
                  }
                  maxLength={13}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider-tax-type">Tipo de IVA</Label>
                <Select
                  value={newProvider.tax_type}
                  onValueChange={(value) =>
                    handleProviderInputChange("tax_type", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="R.I">Responsable Inscripto</SelectItem>
                    <SelectItem value="M">Monotributista</SelectItem>
                    <SelectItem value="E">Exento</SelectItem>
                    <SelectItem value="C">Consumidor Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider-address">Dirección</Label>
              <Input
                id="provider-address"
                placeholder="Dirección completa"
                value={newProvider.address}
                onChange={(e) =>
                  handleProviderInputChange("address", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider-notes">Notas</Label>
              <Textarea
                id="provider-notes"
                placeholder="Información adicional del proveedor"
                rows={3}
                value={newProvider.notes}
                onChange={(e) =>
                  handleProviderInputChange("notes", e.target.value)
                }
              />
            </div>

            {/* Mensaje de error */}
            {providerFormError && (
              <div className="text-red-600 text-sm mt-2">
                {providerFormError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseProviderDialog}
              disabled={isCreatingProvider}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateProvider}
              disabled={isCreatingProvider}
              className="bg-green-600 hover:bg-green-700"
            >
              {isCreatingProvider ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando...
                </>
              ) : (
                "Crear Proveedor"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
