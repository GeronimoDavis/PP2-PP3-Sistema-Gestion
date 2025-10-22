"use client";

import { useEffect, useState } from "react";
import {
  Trash2,
  RotateCcw,
  Search,
  Package,
  Users,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import {
  getDeletedProducts,
  getDeletedPersons,
  restoreProduct,
  restorePerson,
} from "@/api/papeleraApi";

// Interfaces
interface DeletedProduct {
  product_id: number;
  name: string;
  code: string;
  stock: number;
  purchase_price: number;
  sell_price: number;
  category_name: string;
  active: number;
}

interface DeletedPerson {
  person_id: number;
  company_name: string;
  name: string;
  email: string;
  phone: string;
  tax_type: string;
  active: number;
}

export default function PapeleraPage() {
  const { user, token, validateToken, loading } = useAuth();
  const router = useRouter();

  // Estados
  const [deletedProducts, setDeletedProducts] = useState<DeletedProduct[]>([]);
  const [deletedPersons, setDeletedPersons] = useState<DeletedPerson[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingPersons, setLoadingPersons] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "products" | "persons">(
    "all"
  );
  const [restoreDialog, setRestoreDialog] = useState<{
    isOpen: boolean;
    type: "product" | "person" | null;
    id: number | null;
    name: string;
  }>({
    isOpen: false,
    type: null,
    id: null,
    name: "",
  });

  // Validación de autenticación
  useEffect(() => {
    if (!loading) {
      if (!token || !user || !validateToken(token)) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
        router.push("/");
      }
    }
  }, [user, token, validateToken, router, loading]);

  // Cargar datos eliminados
  const loadDeletedProducts = async () => {
    setLoadingProducts(true);
    try {
      const data = await getDeletedProducts();
      setDeletedProducts(data.products || []);
    } catch (error) {
      console.error("Error cargando productos eliminados:", error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadDeletedPersons = async () => {
    setLoadingPersons(true);
    try {
      const data = await getDeletedPersons();
      setDeletedPersons(data.persons || []);
    } catch (error) {
      console.error("Error cargando personas eliminadas:", error);
    } finally {
      setLoadingPersons(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    if (token && user) {
      loadDeletedProducts();
      loadDeletedPersons();
    }
  }, [token, user]);

  // Función para restaurar
  const handleRestore = async () => {
    if (!restoreDialog.id || !restoreDialog.type) return;

    try {
      if (restoreDialog.type === "product") {
        await restoreProduct(restoreDialog.id);
        await loadDeletedProducts();
      } else {
        await restorePerson(restoreDialog.id);
        await loadDeletedPersons();
      }
      setRestoreDialog({ isOpen: false, type: null, id: null, name: "" });
    } catch (error) {
      console.error("Error restaurando elemento:", error);
    }
  };

  // Filtrar datos
  const filteredProducts = deletedProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPersons = deletedPersons.filter(
    (person) =>
      person.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Función para obtener el color del badge

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Papelera</h2>
      </div>

      {/* Búsqueda y Actualizar */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            loadDeletedProducts();
            loadDeletedPersons();
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Tabs para productos y personas */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">
            Todos ({filteredProducts.length + filteredPersons.length})
          </TabsTrigger>
          <TabsTrigger value="products">
            <Package className="h-4 w-4 mr-2" />
            Productos ({filteredProducts.length})
          </TabsTrigger>
          <TabsTrigger value="persons">
            <Users className="h-4 w-4 mr-2" />
            Personas ({filteredPersons.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Productos eliminados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Productos Eliminados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingProducts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Trash2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No hay productos eliminados</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Nombre</TableHead>
                      <TableHead className="w-[120px]">Código</TableHead>
                      <TableHead className="w-[150px]">Categoría</TableHead>
                      <TableHead className="w-[100px]">Stock</TableHead>
                      <TableHead className="w-[120px]">Precio Venta</TableHead>
                      <TableHead className="w-[120px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.product_id}>
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell>{product.code}</TableCell>
                        <TableCell>{product.category_name}</TableCell>
                        <TableCell>{product.stock}</TableCell>
                        <TableCell>${product.sell_price}</TableCell>
                        <TableCell>
                          <Button
                            className="bg-green-600 hover:bg-green-700"
                            size="sm"
                            onClick={() =>
                              setRestoreDialog({
                                isOpen: true,
                                type: "product",
                                id: product.product_id,
                                name: product.name,
                              })
                            }
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restaurar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Personas eliminadas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Personas Eliminadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPersons ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : filteredPersons.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Trash2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No hay personas eliminadas</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Nombre</TableHead>
                      <TableHead className="w-[200px]">Razón Social</TableHead>
                      <TableHead className="w-[200px]">Email</TableHead>
                      <TableHead className="w-[150px]">Teléfono</TableHead>
                      <TableHead className="w-[120px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPersons.map((person) => (
                      <TableRow key={person.person_id}>
                        <TableCell className="font-medium">
                          {person.name}
                        </TableCell>
                        <TableCell>{person.company_name}</TableCell>
                        <TableCell>{person.email}</TableCell>
                        <TableCell>{person.phone}</TableCell>
                        <TableCell>
                          <Button
                            className="bg-green-600 hover:bg-green-700"
                            size="sm"
                            onClick={() =>
                              setRestoreDialog({
                                isOpen: true,
                                type: "person",
                                id: person.person_id,
                                name: person.company_name || person.name,
                              })
                            }
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restaurar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Productos Eliminados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingProducts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Trash2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No hay productos eliminados</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Precio Venta</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.product_id}>
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell>{product.code}</TableCell>
                        <TableCell>{product.category_name}</TableCell>
                        <TableCell>{product.stock}</TableCell>
                        <TableCell>${product.sell_price}</TableCell>
                        <TableCell>
                          <Button
                            className="bg-green-600 hover:bg-green-700"
                            size="sm"
                            onClick={() =>
                              setRestoreDialog({
                                isOpen: true,
                                type: "product",
                                id: product.product_id,
                                name: product.name,
                              })
                            }
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restaurar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="persons">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Personas Eliminadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPersons ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : filteredPersons.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Trash2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No hay personas eliminadas</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Razón Social</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPersons.map((person) => (
                      <TableRow key={person.person_id}>
                        <TableCell className="font-medium">
                          {person.name}
                        </TableCell>
                        <TableCell>{person.company_name}</TableCell>
                        <TableCell>{person.email}</TableCell>
                        <TableCell>{person.phone}</TableCell>
                        <TableCell>
                          <Button
                            className="bg-green-600 hover:bg-green-700"
                            size="sm"
                            onClick={() =>
                              setRestoreDialog({
                                isOpen: true,
                                type: "person",
                                id: person.person_id,
                                name: person.name,
                              })
                            }
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restaurar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de confirmación para restaurar */}
      <Dialog
        open={restoreDialog.isOpen}
        onOpenChange={(open) =>
          setRestoreDialog({ ...restoreDialog, isOpen: open })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Restauración</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres restaurar{" "}
              <strong>{restoreDialog.name}</strong>?
              <br />
              Este elemento volverá a estar disponible en el sistema.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setRestoreDialog({
                  isOpen: false,
                  type: null,
                  id: null,
                  name: "",
                })
              }
            >
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleRestore}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
