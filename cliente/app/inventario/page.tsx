"use client";

import { useEffect, useState } from "react";
import {
  Download,
  MoreHorizontal,
  Plus,
  SlidersHorizontal,
  Edit,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
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
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  getProducts,
  updateProductStatus,
  getProductByCategory,
  createProduct,
  updateProduct,
} from "@/api/productsApi";
import { getCategories } from "@/api/categoriesApi";

export default function InventarioPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  // Opcional: Mostrar un loader mientras se valida

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [productData, setProductData] = useState({
    name: "",
    code: "",
    stock: "",
    purchase_price: "",
    category_id: "",
  });

  const [originalProducts, setOriginalProducts] = useState<any[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [codeError, setCodeError] = useState("");
  const [nameError, setNameError] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  //este es el que se encarga de actualizar el estado del producto
  const handleUpdateProductStatus = async (productId: string) => {
    try {
      //llamamo a la api para actualizar el estado del producto
      await updateProductStatus(productId);
      // Recargar todos los productos desde el servidor
      const response = await getProducts();
      //mapear los productos con las categorias
      const productsWithCategories = response.products.map((product: any) => ({
        ...product,
        category_name: getCategoryName(product.category_id),
      }));
      //actualizar el estado de los productos
      setProducts(productsWithCategories);
      //actualizar el estado de los productos originales para que se pueda filtrar por categoria
      setOriginalProducts(productsWithCategories);
    } catch (error) {
      console.error("Error al actualizar el estado del producto:", error);
    }
  };

  //este es el que se encarga de obtener las categorias
  const handleGetCategories = async () => {
    try {
      const response = await getCategories();
      setCategories(response.categories);
    } catch (error) {
      console.error("Error al obtener las categorías:", error);
    }
  };

  //este es el que se encarga de obtener el nombre de la categoria
  const getCategoryName = (categoryId: string) => {
    //busca la categoria en el array de categorias
    const category = categories.find(
      (cat) => cat.category_id.toString() === categoryId
    );
    return category ? category.name : categoryId;
  };

  //este es el que se encarga de obtener los productos por categoria
  const handleGetProductByCategory = async (categoryId: string) => {
    setLoadingProducts(true);
    try {
      //llamamo a la api para obtener los productos por categoria
      const response = await getProductByCategory(categoryId);
      //mapear los productos con las categorias
      const productsWithCategories = response.products.map((product: any) => ({
        ...product,
        category_name: getCategoryName(product.category_id),
      }));
      setCurrentPage(1);
      //actualizar el estado de los productos
      setProducts(productsWithCategories);
      setError(null);
    } catch (error: any) {
      console.error("Error al obtener los productos por categoría:", error);
      setError(
        "Error al filtrar por categoría: " +
          (error.response?.data?.error || error.message)
      );
    } finally {
      setLoadingProducts(false);
    }
  };

  //este es el que se encarga de obtener todos los productos
  const handleGetProducts = async () => {
    setLoadingProducts(true);
    try {
      //llamamo a la api para obtener todos los productos
      const response = await getProducts();
      //mapear los productos con las categorias
      const productsWithCategories = response.products.map((product: any) => ({
        ...product,
        category_name: getCategoryName(product.category_id),
      }));
      //actualizar el estado de los productos
      setProducts(productsWithCategories);
      //actualizar el estado de los productos originales para que se pueda filtrar por categoria
      setOriginalProducts(productsWithCategories);
      setCurrentPage(1); // Reset a la primera página
      setError(null);
    } catch (error: any) {
      console.error("Error al obtener los productos:", error);
      setError(
        "Error al cargar los productos: " +
          (error.response?.data?.error || error.message)
      );
    } finally {
      setLoadingProducts(false);
    }
  };

  //este es el que se encarga de limpiar los filtros
  const handleClearFilters = async () => {
    setLoadingProducts(true);
    try {
      //llamamo a la api para obtener todos los productos
      const response = await getProducts();
      //mapear los productos con las categorias
      const productsWithCategories = response.products.map((product: any) => ({
        ...product,
        category_name: getCategoryName(product.category_id),
      }));
      //actualizar la pagina actual a la primera
      setCurrentPage(1);
      //actualizar el estado de los productos
      setProducts(productsWithCategories);

      //actualizar el estado de los productos originales para que se pueda filtrar por categoria
      setOriginalProducts(productsWithCategories);
      setError(null);
    } catch (error: any) {
      console.error("Error al limpiar filtros:", error);
      setError(
        "Error al limpiar filtros: " +
          (error.response?.data?.error || error.message)
      );
    } finally {
      setLoadingProducts(false);
    }
  };

  //este es el que se encarga de crear un nuevo producto
  const handleCreateProduct = async () => {
    try {
      // Limpiar errores previos
      setCodeError("");
      setNameError("");

      // Validaciones
      if (
        !productData.name ||
        !productData.code ||
        !productData.stock ||
        !productData.purchase_price ||
        !productData.category_id
      ) {
        alert("Todos los campos son obligatorios");
        return;
      }

      if (parseFloat(productData.stock) < 0) {
        alert("El stock no puede ser negativo");
        return;
      }

      if (parseFloat(productData.purchase_price) <= 0) {
        alert("El precio debe ser mayor a 0");
        return;
      }

      // Validar codigo unico
      const isCodeValid = await validateCode(productData.code);
      if (!isCodeValid) return;

      // Validar nombre unico en categoria
      const isNameValid = await validateNameInCategory(
        productData.name,
        productData.category_id
      );
      if (!isNameValid) return;

      // Si todas las validaciones pasan, crear el producto y actualizar el estado de los productos
      const newProduct = await createProduct(productData);
      setProducts([...products, newProduct.product]);
      setIsDialogOpen(false);
      setProductData({
        name: "",
        code: "",
        stock: "",
        purchase_price: "",
        category_id: "",
      });
    } catch (error: any) {
      console.error("Error al crear el producto:", error);
      alert(
        "Error al crear el producto: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setProductData({
      name: product.name,
      code: product.code,
      stock: product.stock.toString(),
      purchase_price: product.purchase_price.toString(),
      category_id: product.category_id,
    });
    setIsEditDialogOpen(true);
  };
  const handleUpdateProduct = async () => {
    try {
      // Limpiar errores previos
      setCodeError("");
      setNameError("");

      // Validaciones
      if (
        !productData.name ||
        !productData.code ||
        !productData.stock ||
        !productData.purchase_price ||
        !productData.category_id
      ) {
        alert("Todos los campos son obligatorios");
        return;
      }

      if (parseFloat(productData.stock) < 0) {
        alert("El stock no puede ser negativo");
        return;
      }

      if (parseFloat(productData.purchase_price) <= 0) {
        alert("El precio debe ser mayor a 0");
        return;
      }

      // Validar codigo unico
      const isCodeValid = await validateCode(
        productData.code,
        editingProduct.product_id
      );
      if (!isCodeValid) return;

      // Validar nombre unico en categoria
      const isNameValid = await validateNameInCategory(
        productData.name,
        productData.category_id,
        editingProduct.product_id
      );
      if (!isNameValid) return;

      // Si todas las validaciones pasan, actualizar el producto y actualizar el estado de los productos
      await updateProduct(editingProduct.product_id, productData);

      setIsEditDialogOpen(false);
      setEditingProduct(null);
      setProductData({
        name: "",
        code: "",
        stock: "",
        purchase_price: "",
        category_id: "",
      });

      handleGetProducts();
    } catch (error: any) {
      console.error("Error al actualizar el producto:", error);
      alert(
        "Error al actualizar el producto: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  //este es el que se encarga de validar el codigo del producto
  const validateCode = async (code: string, excludeId?: string) => {
    try {
      // Verificar si el código ya existe (excluyendo el producto actual si estamos editando)
      const existingProduct = products.find(
        (p) => p.code === code && (!excludeId || p.product_id !== excludeId)
      );

      if (existingProduct) {
        setCodeError("Este código ya existe en otro producto");
        return false;
      } else {
        setCodeError("");
        return true;
      }
    } catch (error) {
      console.error("Error al validar código:", error);
      return false;
    }
  };
  //este es el que se encarga de validar el nombre del producto en la misma categoria
  const validateNameInCategory = async (
    name: string,
    categoryId: string,
    excludeId?: string
  ) => {
    try {
      // Verificar si el nombre ya existe en la misma categoría
      const existingProduct = products.find(
        (p) =>
          p.name.toLowerCase() === name.toLowerCase() &&
          p.category_id === categoryId &&
          (!excludeId || p.product_id !== excludeId)
      );

      if (existingProduct) {
        setNameError(
          "Ya existe un producto con este nombre en la misma categoría"
        );
        return false;
      } else {
        setNameError("");
        return true;
      }
    } catch (error) {
      console.error("Error al validar nombre:", error);
      return false;
    }
  };

  // Funciones para validación en tiempo real
  const handleCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCode = e.target.value;
    setProductData({ ...productData, code: newCode });

    if (newCode.length > 0) {
      await validateCode(newCode, editingProduct?.product_id);
    } else {
      setCodeError("");
    }
  };

  const handleNameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setProductData({ ...productData, name: newName });

    if (newName.length > 0 && productData.category_id) {
      await validateNameInCategory(
        newName,
        productData.category_id,
        editingProduct?.product_id
      );
    } else {
      setNameError("");
    }
  };
  //este es el que se encarga de obtener los productos para paginarlos
  const getPaginatedProducts = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return products.slice(startIndex, endIndex);
  };
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
            {Math.min(currentPage * itemsPerPage, products.length)} de{" "}
            {products.length} productos
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

  const totalPages = Math.ceil(products.length / itemsPerPage);

  //este es el que se encarga de obtener los productos y las categorias
  useEffect(() => {
    //llamamo a la api para obtener todos los productos
    getProducts()
      .then((data) => {
        const productsWithCategories = data.products.map((product: any) => ({
          ...product,
          category_name: getCategoryName(product.category_id),
        }));
        //actualizar el estado de los productos
        setProducts(productsWithCategories);
        //actualizar el estado de los productos originales para que se pueda filtrar por categoria
        setOriginalProducts(productsWithCategories);
        //actualizar el estado de la pagina actual a la primera
        setCurrentPage(1);
        //actualizar el estado de la carga a false
        setLoadingProducts(false);
        //actualizar el estado de los errores a null
        setError(null);
      })
      .catch((error: any) => {
        console.error("Error al cargar productos:", error);
        setError(
          "Error al cargar los productos: " +
            (error.response?.data?.error || error.message)
        );
        setLoadingProducts(false);
      });
    handleGetCategories();
  }, []);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Inventario</h2>
        <div className="flex items-center space-x-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="mr-2 h-4 w-4" />
                Agregar Producto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Producto</DialogTitle>
                <DialogDescription>
                  Complete los detalles del nuevo producto para agregarlo al
                  inventario.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="codigo" className="text-right">
                    Código
                  </Label>
                  <Input
                    id="codigo"
                    className="col-span-3"
                    value={productData.code}
                    onChange={handleCodeChange}
                  />
                </div>
                {codeError && (
                  <div className="col-span-4 text-red-500 text-sm mt-1">
                    {codeError}
                  </div>
                )}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="nombre" className="text-right">
                    Nombre
                  </Label>
                  <Input
                    id="nombre"
                    className="col-span-3"
                    value={productData.name}
                    onChange={handleNameChange}
                  />
                </div>
                {nameError && (
                  <div className="col-span-4 text-red-500 text-sm mt-1">
                    {nameError}
                  </div>
                )}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="categoria" className="text-right">
                    Categoría
                  </Label>
                  <Select
                    value={productData.category_id}
                    onValueChange={(value) =>
                      setProductData({ ...productData, category_id: value })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem
                          key={category.category_id}
                          value={category.category_id.toString()}
                        >
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="stock" className="text-right">
                    Stock
                  </Label>
                  <Input
                    id="stock"
                    type="number"
                    className="col-span-3"
                    value={productData.stock}
                    onChange={(e) =>
                      setProductData({ ...productData, stock: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="precio" className="text-right">
                    Precio
                  </Label>
                  <Input
                    id="precio"
                    type="number"
                    step="0.01"
                    className="col-span-3"
                    value={productData.purchase_price}
                    onChange={(e) =>
                      setProductData({
                        ...productData,
                        purchase_price: e.target.value,
                      })
                    }
                  />
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
                  onClick={handleCreateProduct}
                >
                  Guardar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Editar Producto</DialogTitle>
                <DialogDescription>
                  Modifica los datos del producto seleccionado.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-codigo" className="text-right">
                    Código
                  </Label>
                  <Input
                    id="edit-codigo"
                    className="col-span-3"
                    value={productData.code}
                    onChange={handleCodeChange}
                  />
                </div>
                {codeError && (
                  <div className="col-span-4 text-red-500 text-sm mt-1">
                    {codeError}
                  </div>
                )}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-nombre" className="text-right">
                    Nombre
                  </Label>
                  <Input
                    id="edit-nombre"
                    className="col-span-3"
                    value={productData.name}
                    onChange={handleNameChange}
                  />
                </div>
                {nameError && (
                  <div className="col-span-4 text-red-500 text-sm mt-1">
                    {nameError}
                  </div>
                )}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-categoria" className="text-right">
                    Categoría
                  </Label>
                  <Select
                    value={productData.category_id}
                    onValueChange={(value) =>
                      setProductData({ ...productData, category_id: value })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem
                          key={category.category_id}
                          value={category.category_id.toString()}
                        >
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-stock" className="text-right">
                    Stock
                  </Label>
                  <Input
                    id="edit-stock"
                    type="number"
                    className="col-span-3"
                    value={productData.stock}
                    onChange={(e) =>
                      setProductData({ ...productData, stock: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-precio" className="text-right">
                    Precio
                  </Label>
                  <Input
                    id="edit-precio"
                    type="number"
                    step="0.01"
                    className="col-span-3"
                    value={productData.purchase_price}
                    onChange={(e) =>
                      setProductData({
                        ...productData,
                        purchase_price: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingProduct(null);
                    setProductData({
                      name: "",
                      code: "",
                      stock: "",
                      purchase_price: "",
                      category_id: "",
                    });
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleUpdateProduct}
                >
                  Actualizar
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
            placeholder="Buscar por código o nombre..."
            className="h-9 w-[200px] lg:w-[300px]"
            onChange={(e) => {
              const searchTerm = e.target.value.toLowerCase();
              if (searchTerm === "") {
                setProducts(originalProducts);
              } else {
                const filteredProducts = originalProducts.filter(
                  (product) =>
                    product.code.toLowerCase().includes(searchTerm) ||
                    product.name.toLowerCase().includes(searchTerm)
                );
                setProducts(filteredProducts);
              }
              setCurrentPage(1); // Reset a la primera página
            }}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 px-2 lg:px-3">
                <SlidersHorizontal className="h-4 w-4" />
                <span className="ml-2 hidden lg:inline-block">Filtros</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filtrar por categoría</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {categories.map((category) => (
                <DropdownMenuCheckboxItem
                  key={category.category_id}
                  checked={category.active}
                  onCheckedChange={() =>
                    handleGetProductByCategory(category.category_id)
                  }
                >
                  {category.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-2 lg:px-3"
            onClick={handleClearFilters}
          >
            Limpiar Filtros
          </Button>
        </div>
      </div>
      {loadingProducts ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando productos...</p>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <p className="text-red-600">{error}</p>
              <Button
                onClick={handleGetProducts}
                className="mt-4 bg-blue-600 hover:bg-blue-700"
              >
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getPaginatedProducts().map((product) => (
                  <TableRow key={product.product_id}>
                    <TableCell>{product.code}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.category_name}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>{product.purchase_price}</TableCell>
                    <TableCell>
                      {product.active ? "Activo" : "Inactivo"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar Producto
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              handleUpdateProductStatus(product.product_id)
                            }
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {product.active
                              ? "Eliminar Producto"
                              : "Activar Producto"}
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
      )}

      {/* Paginación */}
      {!loading && !error && products.length > 0 && (
        <div className="flex items-center justify-between">
          <ItemsPerPageSelector />
          <Pagination />
        </div>
      )}
    </div>
  );
}
