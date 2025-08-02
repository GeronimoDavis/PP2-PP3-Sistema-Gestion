"use client";

import { useEffect, useState } from "react";
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
import { redirect } from "next/navigation";
import {
  getPersons,
  getPersonById,
  createPerson,
  updatePerson,
  deletePerson,
} from "@/api/personsApi";
import { Textarea } from "@/components/ui/textarea";

export default function ClientesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const { user, token } = useAuth();

  if (!token || !user) {
    return redirect("/"); //pasar prop para dar mensaje de error
  }

  const loadClients = async () => {
    setLoading(true);
    try {
      const { persons } = await getPersons();
      setClients(persons);
      setError(null);
    } catch (error) {
      setError("Error al cargar los clientes");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (clientData) => {
    try {
      // Validaciones básicas
      if (!clientData.email || !clientData.tax_id || !clientData.tax_type) {
        setError("Todos los campos son obligatorios");
        return;
      }

      if (clientData.tax_id.length !== 11) {
        setError("El CUIT/CUIL debe tener 11 dígitos");
        return;
      }

      const newClient = await createPerson(clientData);
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

  const handleDeleteClient = async (id) => {
    try {
      await deletePerson(id);
      setClients(clients.filter((client) => client.id !== id));
    } catch (error) {
      setError("Error al eliminar el cliente");
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

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
                    value={clientData.provider}
                    onValueChange={(value) =>
                      setClientData({ ...clientData, provider: value })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={true}>Proveedor</SelectItem>
                      <SelectItem value={false}>Cliente</SelectItem>
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
          />
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>CUIT/CUIL</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.person_id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.tax_type}</TableCell>
                  <TableCell>{client.tax_id}</TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell className="text-right">
                    <Badge className="bg-green-500">
                      {client.provider ? "Activo" : "Inactivo"}
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
                          onClick={() => handleDeleteClient(client.person_id)}
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
    </div>
  );
}
