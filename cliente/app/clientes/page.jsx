"use client";

import { useEffect, useState, useMemo } from "react";
import { Download, MoreHorizontal, UserPlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

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
import { Textarea } from "@/components/ui/textarea";

export default function ClientesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [error, setError] = useState(null);
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

  const { user, token, validateToken, loading } = useAuth();

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
        setError("Sesión expirada. Por favor, inicie sesión nuevamente.");
        // Redirigir al login si el token no es válido
        window.location.href = "/";
      } else {
        setError(
          "Error al cargar los clientes: " +
            (error.response?.data?.error || error.message)
        );
      }
      console.error("Error:", error);
    } finally {
      setLoadingClients(false);
    }
  };
  //este es el que se encarga de crear un cliente
  const handleCreateClient = async (clientData) => {
    try {
      // Validaciones
      if (!clientData.email || !clientData.tax_id || !clientData.tax_type) {
        setError("Todos los campos son obligatorios");
        return;
      }
      //validar que el CUIT/CUIL tenga 11 dígitos
      if (clientData.tax_id.length !== 11) {
        setError("El CUIT/CUIL debe tener 11 dígitos");
        return;
      }
      
      // Asegurar que provider sea un booleano
      const dataToSend = {
        ...clientData,
        provider: Boolean(clientData.provider)
      };
      
      //crear el cliente
      const newClient = await createPerson(dataToSend);
      setClients([...clients, newClient.person]);
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
    } catch (error) {
      setError(
        "Error al crear el cliente: " +
          (error.response?.data?.error || error.message)
      );
      console.error("Error:", error);
    }
  };
  //este es el que se encarga de actualizar el estado de un cliente
  const handleUpdatePersonStatus = async (id) => {
    try {
      await updatePersonStatus(id);
      // Recargar la lista completa para mostrar solo personas activas
      await loadClients();
    } catch (error) {
      setError("Error al actualizar el estado del cliente");
      console.error("Error:", error);
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
            {clients.length} clientes
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
        <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
        <div className="flex items-center space-x-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                  <Input
                    id="nombre"
                    className="col-span-3"
                    value={clientData.name}
                    onChange={(e) =>
                      setClientData({ ...clientData, name: e.target.value })
                    }
                  />
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
                  <Select
                    value={clientData.tax_type}
                    onValueChange={(value) =>
                      setClientData({ ...clientData, tax_type: value })
                    }
                  >
                    <SelectTrigger className="col-span-3">
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
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cuit" className="text-right">
                    CUIT/CUIL
                  </Label>
                  <Input
                    id="cuit"
                    className="col-span-3"
                    value={clientData.tax_id}
                    onChange={(e) =>
                      setClientData({ ...clientData, tax_id: e.target.value })
                    }
                  />
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
                  <Input
                    id="email"
                    type="email"
                    className="col-span-3"
                    value={clientData.email}
                    onChange={(e) =>
                      setClientData({ ...clientData, email: e.target.value })
                    }
                  />
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
                      setClientData({ ...clientData, provider: value === "true" })
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
            placeholder="Buscar clientes..."
            className="h-9 w-[150px] lg:w-[250px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Activos</SelectItem>
              <SelectItem value="false">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {loadingClients ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando clientes...</p>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <p className="text-red-600">{error}</p>
              <Button
                onClick={loadClients}
                className="mt-4 bg-blue-600 hover:bg-blue-700"
              >
                Reintentar
              </Button>
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
                        Estado{getSortIndicator("provider")}
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
                            <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                            <DropdownMenuItem>Editar cliente</DropdownMenuItem>
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
                              Desactivar cliente
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
    </div>
  );
}
