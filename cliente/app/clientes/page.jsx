"use client";

import { useEffect, useState, useMemo } from "react";
import { Download, MoreHorizontal, UserPlus, Eye, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import {
  getPersons,
  getPersonById,
  createPerson,
  updatePerson,
  updatePersonStatus,
} from "@/api/personsApi";
import { getSalesHistory, getPurchasesHistory } from "@/api/transactionsApi";
import { getPaymentsByPersonId } from "@/api/paymentsApi";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ClientesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [clientData, setClientData] = useState({
    name: "",
    company_name: "",
    tax_type: "",
    tax_id: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
    provider: false,
  });
  const [originalClients, setOriginalClients] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Estados para el modal de detalles
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientTransactions, setClientTransactions] = useState({
    sales: [],
    purchases: [],
  });
  const [clientPayments, setClientPayments] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [clientBalance, setClientBalance] = useState({
    total: 0,
    sales: 0,
    purchases: 0,
    payments: 0,
  });

  const { user, token, validateToken, loading } = useAuth();
  const { toast } = useToast();

  const router = useRouter(); // Usar el hook useRouter

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return null;
    }
    return sortConfig.direction === "ascending" ? " ▲" : " ▼";
  };

  const clearFormErrors = () => {
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};

    if (!clientData.name.trim()) {
      errors.name = "El nombre es obligatorio";
    }

    if (!clientData.tax_type) {
      errors.tax_type = "El tipo es obligatorio";
    }

    if (!clientData.tax_id.trim()) {
      errors.tax_id = "El CUIT/CUIL es obligatorio";
    } else if (clientData.tax_id.length !== 11) {
      errors.tax_id = "El CUIT/CUIL debe tener 11 dígitos";
    }

    if (!clientData.email.trim()) {
      errors.email = "El email es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientData.email)) {
      errors.email = "El email debe tener un formato válido";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const sortedClients = useMemo(() => {
    let sortableItems = [...clients];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key] || "";
        const valB = b[sortConfig.key] || "";
        if (valA < valB) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [clients, sortConfig]);

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

  useEffect(() => {
    if (!loading && user) {
      loadClients();
    }
  }, [loading, user]);

  useEffect(() => {
    let filteredClients = [...originalClients];

    // Apply status filter
    if (statusFilter !== "all") {
      const isProvider = statusFilter === "true";
      filteredClients = filteredClients.filter(
        (c) => c.provider === isProvider
      );
    }

    // Apply search filter
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      filteredClients = filteredClients.filter(
        (client) =>
          (client.name && client.name.toLowerCase().includes(lowercasedTerm)) ||
          (client.email &&
            client.email.toLowerCase().includes(lowercasedTerm)) ||
          (client.tax_id && client.tax_id.includes(lowercasedTerm))
      );
    }

    setClients(filteredClients);
    setCurrentPage(1); // Reset page on filter change
  }, [searchTerm, statusFilter, originalClients]);

  // Opcional: Mostrar un loader mientras se valida
  if (loading) {
    return <div>Cargando...</div>;
  }

  //este es el que se encarga de obtener los clientes para paginarlos

  const loadClients = async () => {
    setLoadingClients(true);
    try {
      //obtener los clientes
      const { persons } = await getPersons();
      setClients(persons);
      setOriginalClients(persons); // Agregar esta línea para la paginación
      setError(null);
    } catch (error) {
      if (error.response?.status === 401) {
        toast({
          title: "Sesión expirada",
          description: "Por favor, inicie sesión nuevamente.",
          variant: "destructive",
        });
        // Redirigir al login si el token no es válido
        window.location.href = "/";
      } else {
        toast({
          title: "Error al cargar clientes",
          description: error.response?.data?.error || error.message,
          variant: "destructive",
        });
      }
      console.error("Error:", error);
    } finally {
      setLoadingClients(false);
    }
  };
  //este es el que se encarga de crear un cliente
  const handleCreateClient = async (clientData) => {
    // Limpiar errores previos
    clearFormErrors();

    // Validar formulario
    if (!validateForm()) {
      return;
    }

    try {
      // Asegurar que provider sea un booleano
      const dataToSend = {
        ...clientData,
        provider: Boolean(clientData.provider),
      };

      //crear el cliente
      const newClient = await createPerson(dataToSend);
      setClients([...clients, newClient.person]);
      setOriginalClients([...originalClients, newClient.person]);
      setIsDialogOpen(false);
      setClientData({
        name: "",
        company_name: "",
        tax_type: "",
        tax_id: "",
        phone: "",
        email: "",
        address: "",
        notes: "",
        provider: false,
      });
      clearFormErrors();

      toast({
        title: "Cliente creado",
        description: "El cliente se ha creado exitosamente.",
      });
    } catch (error) {
      toast({
        title: "Error al crear cliente",
        description: error.response?.data?.error || error.message,
        variant: "destructive",
      });
      console.error("Error:", error);
    }
  };
  //este es el que se encarga de actualizar el estado de un cliente
  const handleUpdatePersonStatus = async (id) => {
    try {
      await updatePersonStatus(id);
      // Recargar la lista completa para mostrar solo personas activas
      await loadClients();
      toast({
        title: "Cliente desactivado",
        description: "El cliente ha sido desactivado exitosamente.",
      });
    } catch (error) {
      toast({
        title: "Error al desactivar cliente",
        description: "No se pudo actualizar el estado del cliente.",
        variant: "destructive",
      });
      console.error("Error:", error);
    }
  };

  // Cargar detalles del cliente
  const loadClientDetails = async (clientId) => {
    setLoadingDetails(true);
    try {
      // Obtener datos del cliente
      const clientData = await getPersonById(clientId);
      setSelectedClient(clientData.person);

      // Obtener ventas del cliente - Ahora filtrando por person_id en el backend
      const salesData = await getSalesHistory({ person_id: clientId });
      const sales = salesData.sales || [];

      // Obtener compras del cliente - Ahora filtrando por person_id en el backend
      const purchasesData = await getPurchasesHistory({ person_id: clientId });
      const purchases = purchasesData.purchases || [];

      setClientTransactions({ sales, purchases });

      // Obtener pagos del cliente - Usando el nuevo endpoint
      const paymentsData = await getPaymentsByPersonId(clientId);
      const clientPayments = paymentsData.payments || [];

      setClientPayments(clientPayments);

      // Calcular saldo
      const totalSales = sales.reduce(
        (sum, sale) => sum + parseFloat(sale.total_transaction || 0),
        0
      );
      const totalPurchases = purchases.reduce(
        (sum, purchase) => sum + parseFloat(purchase.total_transaction || 0),
        0
      );
      const totalPayments = clientPayments.reduce(
        (sum, payment) => sum + parseFloat(payment.amount || 0),
        0
      );

      // Saldo = (Ventas - Compras) - Pagos
      // Si es positivo, el cliente debe dinero
      // Si es negativo, el cliente tiene saldo a favor
      const balance = totalSales - totalPurchases - totalPayments;

      setClientBalance({
        total: balance,
        sales: totalSales,
        purchases: totalPurchases,
        payments: totalPayments,
      });

      setIsDetailsModalOpen(true);
    } catch (error) {
      toast({
        title: "Error al cargar detalles",
        description: error.response?.data?.error || error.message,
        variant: "destructive",
      });
      console.error("Error:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Funciones de paginación
  const getPaginatedClients = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedClients.slice(startIndex, endIndex);
  };

  //este es el que se encarga de obtener el total de paginas
  const totalPages = Math.ceil(clients.length / itemsPerPage);
  //este es el que se encarga de obtener las paginas
  const Pagination = () => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between px-2 py-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">
            Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
            {Math.min(currentPage * itemsPerPage, clients.length)} de{" "}
            {clients.length} personas
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            Primera
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>

          {pages.map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </Button>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Siguiente
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            Última
          </Button>
        </div>
      </div>
    );
  };

  const ItemsPerPageSelector = () => {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-700">Mostrar:</span>
        <Select
          value={itemsPerPage.toString()}
          onValueChange={(value) => {
            setItemsPerPage(parseInt(value));
            setCurrentPage(1); // Reset a la primera página
          }}
        >
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-700">por página</span>
      </div>
    );
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Personas</h2>
        <div className="flex items-center space-x-2">
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                clearFormErrors();
                setClientData({
                  name: "",
                  company_name: "",
                  tax_type: "",
                  tax_id: "",
                  phone: "",
                  email: "",
                  address: "",
                  notes: "",
                  provider: false,
                });
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <UserPlus className="mr-2 h-4 w-4" />
                Nuevo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
                <DialogDescription>
                  Complete los datos del cliente para agregarlo al sistema.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="nombre" className="text-right">
                    Nombre
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="nombre"
                      className={formErrors.name ? "border-red-500" : ""}
                      value={clientData.name}
                      onChange={(e) => {
                        setClientData({ ...clientData, name: e.target.value });
                        if (formErrors.name) {
                          setFormErrors({ ...formErrors, name: null });
                        }
                      }}
                    />
                    {formErrors.name && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="razon_social" className="text-right">
                    Razón Social
                  </Label>
                  <Input
                    id="razon_social"
                    className="col-span-3"
                    value={clientData.company_name}
                    onChange={(e) =>
                      setClientData({
                        ...clientData,
                        company_name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tipo" className="text-right">
                    Tipo
                  </Label>
                  <div className="col-span-3">
                    <Select
                      value={clientData.tax_type}
                      onValueChange={(value) => {
                        setClientData({ ...clientData, tax_type: value });
                        if (formErrors.tax_type) {
                          setFormErrors({ ...formErrors, tax_type: null });
                        }
                      }}
                    >
                      <SelectTrigger
                        className={formErrors.tax_type ? "border-red-500" : ""}
                      >
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="R.I">R.I</SelectItem>
                        <SelectItem value="Exento">Exento</SelectItem>
                        <SelectItem value="R.N.I">R.N.I</SelectItem>
                        <SelectItem value="Monotributo">Monotributo</SelectItem>
                        <SelectItem value="Consumidor Final">
                          Consumidor Final
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {formErrors.tax_type && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.tax_type}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cuit" className="text-right">
                    CUIT/CUIL
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="cuit"
                      className={formErrors.tax_id ? "border-red-500" : ""}
                      value={clientData.tax_id}
                      onChange={(e) => {
                        setClientData({
                          ...clientData,
                          tax_id: e.target.value,
                        });
                        if (formErrors.tax_id) {
                          setFormErrors({ ...formErrors, tax_id: null });
                        }
                      }}
                    />
                    {formErrors.tax_id && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.tax_id}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="telefono" className="text-right">
                    Teléfono
                  </Label>
                  <Input
                    id="telefono"
                    className="col-span-3"
                    value={clientData.phone}
                    onChange={(e) =>
                      setClientData({ ...clientData, phone: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="email"
                      type="email"
                      className={formErrors.email ? "border-red-500" : ""}
                      value={clientData.email}
                      onChange={(e) => {
                        setClientData({ ...clientData, email: e.target.value });
                        if (formErrors.email) {
                          setFormErrors({ ...formErrors, email: null });
                        }
                      }}
                    />
                    {formErrors.email && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.email}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="direccion" className="text-right">
                    Dirección
                  </Label>
                  <Input
                    id="direccion"
                    className="col-span-3"
                    value={clientData.address}
                    onChange={(e) =>
                      setClientData({ ...clientData, address: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notas" className="text-right">
                    Notas
                  </Label>
                  <Textarea
                    id="notas"
                    className="col-span-3"
                    value={clientData.notes}
                    onChange={(e) =>
                      setClientData({ ...clientData, notes: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="provider" className="text-right">
                    Cliente/Proveedor
                  </Label>
                  <Select
                    value={clientData.provider ? "true" : "false"}
                    onValueChange={(value) =>
                      setClientData({
                        ...clientData,
                        provider: value === "true",
                      })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Proveedor</SelectItem>
                      <SelectItem value="false">Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleCreateClient(clientData)}
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
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="Buscar personas..."
            className="h-9 w-[150px] lg:w-[250px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por Cliente/Proveedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Proveedor</SelectItem>
              <SelectItem value="false">Cliente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {loadingClients ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando personas...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => requestSort("name")}
                      >
                        Nombre{getSortIndicator("name")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => requestSort("tax_type")}
                      >
                        Tipo{getSortIndicator("tax_type")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => requestSort("tax_id")}
                      >
                        CUIT/CUIL{getSortIndicator("tax_id")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => requestSort("phone")}
                      >
                        Teléfono{getSortIndicator("phone")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => requestSort("email")}
                      >
                        Email{getSortIndicator("email")}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        onClick={() => requestSort("provider")}
                      >
                        Cliente/Proveedor{getSortIndicator("provider")}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getPaginatedClients().map((client) => (
                    <TableRow key={client.person_id}>
                      <TableCell className="font-medium">
                        {client.name}
                      </TableCell>
                      <TableCell>{client.tax_type}</TableCell>
                      <TableCell>{client.tax_id}</TableCell>
                      <TableCell>{client.phone}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          className={`${
                            client.provider ? "bg-yellow-500" : "bg-teal-500"
                          }`}
                        >
                          {client.provider ? "Proveedor" : "Cliente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menú</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() =>
                                loadClientDetails(client.person_id)
                              }
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem>Editar persona</DropdownMenuItem>
                            <DropdownMenuItem>
                              Historial de compras
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() =>
                                handleUpdatePersonStatus(client.person_id)
                              }
                            >
                              Desactivar persona
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Paginación */}
          {clients.length > 0 && (
            <div className="flex items-center justify-between">
              <ItemsPerPageSelector />
              <Pagination />
            </div>
          )}
        </>
      )}

      {/* Modal de Detalles del Cliente */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Detalles del Cliente</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDetailsModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {loadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : selectedClient ? (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                {/* Información del Cliente */}
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Información Personal
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-500">Nombre</Label>
                        <p className="font-medium">{selectedClient.name}</p>
                      </div>
                      {selectedClient.company_name && (
                        <div>
                          <Label className="text-gray-500">Razón Social</Label>
                          <p className="font-medium">
                            {selectedClient.company_name}
                          </p>
                        </div>
                      )}
                      <div>
                        <Label className="text-gray-500">Tipo</Label>
                        <p className="font-medium">{selectedClient.tax_type}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500">CUIT/CUIL</Label>
                        <p className="font-medium">{selectedClient.tax_id}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Email</Label>
                        <p className="font-medium">{selectedClient.email}</p>
                      </div>
                      {selectedClient.phone && (
                        <div>
                          <Label className="text-gray-500">Teléfono</Label>
                          <p className="font-medium">{selectedClient.phone}</p>
                        </div>
                      )}
                      {selectedClient.address && (
                        <div className="col-span-2">
                          <Label className="text-gray-500">Dirección</Label>
                          <p className="font-medium">
                            {selectedClient.address}
                          </p>
                        </div>
                      )}
                      {selectedClient.notes && (
                        <div className="col-span-2">
                          <Label className="text-gray-500">Notas</Label>
                          <p className="font-medium">{selectedClient.notes}</p>
                        </div>
                      )}
                      <div>
                        <Label className="text-gray-500">Tipo de Persona</Label>
                        <Badge
                          className={`${
                            selectedClient.provider
                              ? "bg-yellow-500"
                              : "bg-teal-500"
                          } mt-1`}
                        >
                          {selectedClient.provider ? "Proveedor" : "Cliente"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Resumen Financiero */}
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Resumen Financiero
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <Label className="text-gray-500 text-sm">
                          Total Ventas
                        </Label>
                        <p className="text-xl font-bold text-blue-600">
                          ${clientBalance.sales.toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <Label className="text-gray-500 text-sm">
                          Total Compras
                        </Label>
                        <p className="text-xl font-bold text-orange-600">
                          ${clientBalance.purchases.toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <Label className="text-gray-500 text-sm">
                          Total Pagos
                        </Label>
                        <p className="text-xl font-bold text-green-600">
                          ${clientBalance.payments.toFixed(2)}
                        </p>
                      </div>
                      <div
                        className={`${
                          clientBalance.total >= 0
                            ? "bg-red-50"
                            : "bg-emerald-50"
                        } p-4 rounded-lg`}
                      >
                        <Label className="text-gray-500 text-sm">
                          Saldo Restante
                        </Label>
                        <p
                          className={`text-xl font-bold ${
                            clientBalance.total >= 0
                              ? "text-red-600"
                              : "text-emerald-600"
                          }`}
                        >
                          ${Math.abs(clientBalance.total).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {clientBalance.total >= 0
                            ? "A cobrar"
                            : "A favor del cliente"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Historial de Transacciones */}
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Historial de Transacciones
                    </h3>
                    <Tabs defaultValue="sales" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="sales">
                          Ventas ({clientTransactions.sales.length})
                        </TabsTrigger>
                        <TabsTrigger value="purchases">
                          Compras ({clientTransactions.purchases.length})
                        </TabsTrigger>
                        <TabsTrigger value="payments">
                          Pagos ({clientPayments.length})
                        </TabsTrigger>
                      </TabsList>

                      {/* Tab de Ventas */}
                      <TabsContent value="sales">
                        {clientTransactions.sales.length > 0 ? (
                          <div className="border rounded-lg">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>ID</TableHead>
                                  <TableHead>Fecha</TableHead>
                                  <TableHead>Estado</TableHead>
                                  <TableHead className="text-right">
                                    Total
                                  </TableHead>
                                  <TableHead className="text-right">
                                    Saldo Restante
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {clientTransactions.sales.map((sale) => (
                                  <TableRow key={sale.transaction_id}>
                                    <TableCell className="font-medium">
                                      #{sale.transaction_id}
                                    </TableCell>
                                    <TableCell>
                                      {new Date(sale.date).toLocaleDateString(
                                        "es-AR"
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        className={
                                          parseFloat(
                                            sale.saldo_restante || 0
                                          ) === 0
                                            ? "bg-green-500"
                                            : parseFloat(sale.total_paid || 0) >
                                              0
                                            ? "bg-yellow-500"
                                            : "bg-red-500"
                                        }
                                      >
                                        {parseFloat(
                                          sale.saldo_restante || 0
                                        ) === 0
                                          ? "Pagada"
                                          : parseFloat(sale.total_paid || 0) > 0
                                          ? "Parcial"
                                          : "Pendiente"}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                      $
                                      {parseFloat(
                                        sale.total_transaction || 0
                                      ).toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                      $
                                      {parseFloat(
                                        sale.saldo_restante || 0
                                      ).toFixed(2)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            No hay ventas registradas
                          </div>
                        )}
                      </TabsContent>

                      {/* Tab de Compras */}
                      <TabsContent value="purchases">
                        {clientTransactions.purchases.length > 0 ? (
                          <div className="border rounded-lg">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>ID</TableHead>
                                  <TableHead>Fecha</TableHead>
                                  <TableHead>Estado</TableHead>
                                  <TableHead className="text-right">
                                    Total
                                  </TableHead>
                                  <TableHead className="text-right">
                                    Saldo
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {clientTransactions.purchases.map(
                                  (purchase) => (
                                    <TableRow key={purchase.transaction_id}>
                                      <TableCell className="font-medium">
                                        #{purchase.transaction_id}
                                      </TableCell>
                                      <TableCell>
                                        {new Date(
                                          purchase.date
                                        ).toLocaleDateString("es-AR")}
                                      </TableCell>
                                      <TableCell>
                                        <Badge
                                          className={
                                            parseFloat(
                                              purchase.saldo_restante || 0
                                            ) === 0
                                              ? "bg-green-500"
                                              : parseFloat(
                                                  purchase.total_paid || 0
                                                ) > 0
                                              ? "bg-yellow-500"
                                              : "bg-red-500"
                                          }
                                        >
                                          {parseFloat(
                                            purchase.saldo_restante || 0
                                          ) === 0
                                            ? "Pagada"
                                            : parseFloat(
                                                purchase.total_paid || 0
                                              ) > 0
                                            ? "Parcial"
                                            : "Pendiente"}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-right font-medium">
                                        $
                                        {parseFloat(
                                          purchase.total_transaction || 0
                                        ).toFixed(2)}
                                      </TableCell>
                                      <TableCell className="text-right font-medium">
                                        $
                                        {parseFloat(
                                          purchase.saldo_restante || 0
                                        ).toFixed(2)}
                                      </TableCell>
                                    </TableRow>
                                  )
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            No hay compras registradas
                          </div>
                        )}
                      </TabsContent>

                      {/* Tab de Pagos */}
                      <TabsContent value="payments">
                        {clientPayments.length > 0 ? (
                          <div className="border rounded-lg">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Fecha</TableHead>
                                  <TableHead>Método</TableHead>
                                  <TableHead>Transacción #</TableHead>
                                  <TableHead>Nota</TableHead>
                                  <TableHead className="text-right">
                                    Monto
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {clientPayments.map((payment) => (
                                  <TableRow key={payment.payment_id}>
                                    <TableCell>
                                      {new Date(
                                        payment.date
                                      ).toLocaleDateString("es-AR")}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline">
                                        {payment.type}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      #{payment.transaction_id}
                                    </TableCell>
                                    <TableCell>{payment.note || "-"}</TableCell>
                                    <TableCell className="text-right font-medium text-green-600">
                                      $
                                      {parseFloat(payment.amount || 0).toFixed(
                                        2
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            No hay pagos registrados
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          ) : null}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDetailsModalOpen(false)}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
