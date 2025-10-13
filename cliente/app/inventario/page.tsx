"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Download,
  MoreHorizontal,
  Plus,
  SlidersHorizontal,
  Edit,
  Trash2,
} from "lucide-react";
import { useNotification } from "@/hooks/use-notification";
import { useToast } from "@/hooks/use-toast";

interface FormErrors {
  name?: string | null;
  code?: string | null;
  category_id?: string | null;
  stock?: string | null;
  purchase_price?: string | null;
  sell_price?: string | null;
  stock_minimum?: string | null;
}

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
import {
  getCategories,
  createCategory,
  updateCategory,
} from "@/api/categoriesApi";

export default function InventarioPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { user, token, validateToken, loading } = useAuth();
  const notification = useNotification();
  const { toast } = useToast();

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
    sell_price: "",
    category_id: "",
    category_name: "",
    stock_minimum: "5",
  });

  const [originalProducts, setOriginalProducts] = useState<any[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Estados para gestión de categorías
  const [isCategoriesDialogOpen, setIsCategoriesDialogOpen] = useState(false);
  const [isCreateCategoryDialogOpen, setIsCreateCategoryDialogOpen] =
    useState(false);
  const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] =
    useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryData, setCategoryData] = useState({
    name: "",
  });
  const [categoryNameError, setCategoryNameError] = useState("");
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: "ascending" | "descending";
  }>({
    key: null,
    direction: "ascending",
  });

  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (columnKey: string) => {
    if (sortConfig.key !== columnKey) {
      return null;
    }
    return sortConfig.direction === "ascending" ? " ▲" : " ▼";
  };

  const clearFormErrors = () => {
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: FormErrors = {};

    if (!productData.name.trim()) {
      errors.name = "El nombre es obligatorio";
    }

    if (!productData.code.trim()) {
      errors.code = "El código es obligatorio";
    }

    if (!productData.category_id) {
      errors.category_id = "Debe seleccionar una categoría";
    }

    // Validaciones numéricas
    const stock = parseFloat(productData.stock);
    if (isNaN(stock) || productData.stock.trim() === "") {
      errors.stock = "El stock debe ser un número válido";
    } else if (stock < 0) {
      errors.stock = "El stock no puede ser negativo";
    }

    const purchasePrice = parseFloat(productData.purchase_price);
    if (isNaN(purchasePrice) || productData.purchase_price.trim() === "") {
      errors.purchase_price = "El precio de compra debe ser un número válido";
    } else if (purchasePrice <= 0) {
      errors.purchase_price = "El precio de compra debe ser mayor a 0";
    }

    const sellPrice = parseFloat(productData.sell_price);
    if (isNaN(sellPrice) || productData.sell_price.trim() === "") {
      errors.sell_price = "El precio de venta debe ser un número válido";
    } else if (sellPrice <= 0) {
      errors.sell_price = "El precio de venta debe ser mayor a 0";
    }

    const stockMinimum = parseFloat(productData.stock_minimum);
    if (isNaN(stockMinimum) || productData.stock_minimum.trim() === "") {
      errors.stock_minimum = "El stock mínimo debe ser un número válido";
    } else if (stockMinimum < 0) {
      errors.stock_minimum = "El stock mínimo no puede ser negativo";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const sortedProducts = useMemo(() => {
    let sortableItems = [...products];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key!];
        const valB = b[sortConfig.key!];

        if (valA === null || typeof valA === "undefined") return 1;
        if (valB === null || typeof valB === "undefined") return -1;

        if (typeof valA === "boolean" && typeof valB === "boolean") {
          if (valA === valB) return 0;
          if (sortConfig.direction === "ascending") {
            return valA ? -1 : 1;
          }
          return valA ? 1 : -1;
        }

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
  }, [products, sortConfig]);

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
      }));
      //actualizar el estado de los productos
      setProducts(productsWithCategories);
      //actualizar el estado de los productos originales para que se pueda filtrar por categoria
      setOriginalProducts(productsWithCategories);
      toast({
        title: "Producto actualizado",
        description: "El estado del producto se ha actualizado exitosamente.",
      });
    } catch (error) {
      toast({
        title: "Error al actualizar producto",
        description: "No se pudo actualizar el estado del producto.",
        variant: "destructive",
      });
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

  // Funciones para gestión de categorías
  const handleCreateCategory = async () => {
    try {
      setCategoryNameError("");

      if (!categoryData.name.trim()) {
        setCategoryNameError("El nombre de la categoría es obligatorio");
        return;
      }

      // Validar nombre único
      const existingCategory = categories.find(
        (cat) => cat.name.toLowerCase() === categoryData.name.toLowerCase()
      );

      if (existingCategory) {
        setCategoryNameError("Ya existe una categoría con este nombre");
        return;
      }

      await createCategory(categoryData);
      await handleGetCategories(); // Recargar categorías
      setIsCreateCategoryDialogOpen(false);
      setCategoryData({ name: "" });
      notification.success("Categoría creada exitosamente");
    } catch (error: any) {
      console.error("Error al crear categoría:", error);
      notification.error(
        "Error al crear la categoría: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setCategoryData({
      name: category.name,
    });
    setIsEditCategoryDialogOpen(true);
  };

  const handleUpdateCategory = async () => {
    try {
      setCategoryNameError("");

      if (!categoryData.name.trim()) {
        setCategoryNameError("El nombre de la categoría es obligatorio");
        return;
      }

      // Validar nombre único (excluyendo la categoría actual)
      const existingCategory = categories.find(
        (cat) =>
          cat.name.toLowerCase() === categoryData.name.toLowerCase() &&
          cat.category_id !== editingCategory.category_id
      );

      if (existingCategory) {
        setCategoryNameError("Ya existe una categoría con este nombre");
        return;
      }

      await updateCategory(editingCategory.category_id, categoryData);
      await handleGetCategories(); // Recargar categorías
      setIsEditCategoryDialogOpen(false);
      setEditingCategory(null);
      setCategoryData({ name: "" });
      notification.success("Categoría actualizada exitosamente");
    } catch (error: any) {
      console.error("Error al actualizar categoría:", error);
      notification.error(
        "Error al actualizar la categoría: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  const handleCategoryNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setCategoryData({ ...categoryData, name: newName });

    if (newName.length > 0) {
      const existingCategory = categories.find(
        (cat) =>
          cat.name.toLowerCase() === newName.toLowerCase() &&
          (!editingCategory || cat.category_id !== editingCategory.category_id)
      );

      if (existingCategory) {
        setCategoryNameError("Ya existe una categoría con este nombre");
      } else {
        setCategoryNameError("");
      }
    } else {
      setCategoryNameError("");
    }
  };

  //este es el que se encarga de obtener el nombre de la categoria
  // const getCategoryName = (categoryId: string) => {
  //   //busca la categoria en el array de categorias
  //   const category = categories.find(
  //     (cat) => cat.category_id.toString() === categoryId
  //   );
  //   return category ? category.name : categoryId;
  // };

  //este es el que se encarga de obtener los productos por categoria
  const handleGetProductByCategory = async (categoryId: string) => {
    setLoadingProducts(true);
    try {
      //llamamo a la api para obtener los productos por categoria
      const response = await getProductByCategory(categoryId);
      //mapear los productos con las categorias
      const productsWithCategories = response.products.map((product: any) => ({
        ...product,
      }));
      setCurrentPage(1);
      //actualizar el estado de los productos
      setProducts(productsWithCategories);
      setError(null);
    } catch (error: any) {
      console.error("Error al obtener los productos por categoría:", error);
      toast({
        title: "Error al filtrar por categoría",
        description: error.response?.data?.error || error.message,
        variant: "destructive",
      });
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
      }));
      //actualizar el estado de los productos
      setProducts(productsWithCategories);
      //actualizar el estado de los productos originales para que se pueda filtrar por categoria
      setOriginalProducts(productsWithCategories);
      setCurrentPage(1); // Reset a la primera página
      setError(null);
    } catch (error: any) {
      console.error("Error al obtener los productos:", error);
      toast({
        title: "Error al cargar productos",
        description: error.response?.data?.error || error.message,
        variant: "destructive",
      });
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
      toast({
        title: "Error al limpiar filtros",
        description: error.response?.data?.error || error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  //este es el que se encarga de crear un nuevo producto
  const handleCreateProduct = async () => {
    // Limpiar errores previos
    clearFormErrors();

    // Validar formulario
    if (!validateForm()) {
      return;
    }

    try {
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
      await createProduct(productData);

      // Recargar todos los productos para obtener el category_name
      await handleGetProducts();

      setIsDialogOpen(false);
      setProductData({
        name: "",
        code: "",
        stock: "",
        purchase_price: "",
        sell_price: "",
        category_id: "",
        category_name: "",
        stock_minimum: "5",
      });
      clearFormErrors();

      toast({
        title: "Producto creado",
        description: "El producto se ha creado exitosamente.",
      });
    } catch (error: any) {
      toast({
        title: "Error al crear producto",
        description: error.response?.data?.error || error.message,
        variant: "destructive",
      });
      console.error("Error al crear el producto:", error);
    }
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setProductData({
      name: product.name,
      code: product.code,
      stock: product.stock.toString(),
      purchase_price: product.purchase_price.toString(),
      sell_price: product.sell_price?.toString() || "",
      category_id: product.category_id.toString(),
      category_name: product.category_name,
      stock_minimum: product.stock_minimum?.toString() || "5",
    });
    setIsEditDialogOpen(true);
  };
  const handleUpdateProduct = async () => {
    // Limpiar errores previos
    clearFormErrors();

    // Validar formulario
    if (!validateForm()) {
      return;
    }

    try {
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
        sell_price: "",
        category_id: "",
        category_name: "",
        stock_minimum: "5",
      });
      clearFormErrors();

      handleGetProducts();
      toast({
        title: "Producto actualizado",
        description: "El producto se ha actualizado exitosamente.",
      });
    } catch (error: any) {
      toast({
        title: "Error al actualizar producto",
        description: error.response?.data?.error || error.message,
        variant: "destructive",
      });
      console.error("Error al actualizar el producto:", error);
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
        setFormErrors({
          ...formErrors,
          code: "Este código ya existe en otro producto",
        });
        return false;
      } else {
        setFormErrors({ ...formErrors, code: null });
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
        setFormErrors({
          ...formErrors,
          name: "Ya existe un producto con este nombre en la misma categoría",
        });
        return false;
      } else {
        setFormErrors({ ...formErrors, name: null });
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
      setFormErrors({ ...formErrors, code: null });
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
      setFormErrors({ ...formErrors, name: null });
    }
  };

  const handleStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStock = e.target.value;
    setProductData({ ...productData, stock: newStock });

    if (newStock.trim() === "") {
      setFormErrors({ ...formErrors, stock: null });
      return;
    }

    const stock = parseFloat(newStock);
    if (isNaN(stock)) {
      setFormErrors({
        ...formErrors,
        stock: "El stock debe ser un número válido",
      });
    } else if (stock < 0) {
      setFormErrors({ ...formErrors, stock: "El stock no puede ser negativo" });
    } else {
      setFormErrors({ ...formErrors, stock: null });
    }
  };

  const handlePurchasePriceChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newPrice = e.target.value;
    setProductData({ ...productData, purchase_price: newPrice });

    if (newPrice.trim() === "") {
      setFormErrors({ ...formErrors, purchase_price: null });
      return;
    }

    const price = parseFloat(newPrice);
    if (isNaN(price)) {
      setFormErrors({
        ...formErrors,
        purchase_price: "El precio debe ser un número válido",
      });
    } else if (price <= 0) {
      setFormErrors({
        ...formErrors,
        purchase_price: "El precio debe ser mayor a 0",
      });
    } else {
      setFormErrors({ ...formErrors, purchase_price: null });
    }
  };

  const handleSellPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrice = e.target.value;
    setProductData({ ...productData, sell_price: newPrice });

    if (newPrice.trim() === "") {
      setFormErrors({ ...formErrors, sell_price: null });
      return;
    }

    const price = parseFloat(newPrice);
    if (isNaN(price)) {
      setFormErrors({
        ...formErrors,
        sell_price: "El precio debe ser un número válido",
      });
    } else if (price <= 0) {
      setFormErrors({
        ...formErrors,
        sell_price: "El precio debe ser mayor a 0",
      });
    } else {
      setFormErrors({ ...formErrors, sell_price: null });
    }
  };

  const handleStockMinimumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStockMinimum = e.target.value;
    setProductData({ ...productData, stock_minimum: newStockMinimum });

    if (newStockMinimum.trim() === "") {
      setFormErrors({ ...formErrors, stock_minimum: null });
      return;
    }

    const stockMinimum = parseFloat(newStockMinimum);
    if (isNaN(stockMinimum)) {
      setFormErrors({
        ...formErrors,
        stock_minimum: "El stock mínimo debe ser un número válido",
      });
    } else if (stockMinimum < 0) {
      setFormErrors({
        ...formErrors,
        stock_minimum: "El stock mínimo no puede ser negativo",
      });
    } else {
      setFormErrors({ ...formErrors, stock_minimum: null });
    }
  };
  //este es el que se encarga de obtener los productos para paginarlos
  const getPaginatedProducts = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedProducts.slice(startIndex, endIndex);
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

  // Función para determinar el estado del stock basado en la cantidad y stock_minimum
  const getStockStatus = (stock: number, stockMinimum: number = 5) => {
    if (stock === 0) {
      return { text: "Sin Stock", color: "bg-red-500 text-white" };
    } else if (stock <= stockMinimum) {
      return { text: "Stock Bajo", color: "bg-yellow-500 text-white" };
    } else {
      return { text: "En Stock", color: "bg-green-500 text-white" };
    }
  };

  //este es el que se encarga de obtener los productos y las categorias
  useEffect(() => {
    //llamamo a la api para obtener todos los productos
    getProducts()
      .then((data) => {
        const productsWithCategories = data.products.map((product: any) => ({
          ...product,
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
        toast({
          title: "Error al cargar productos",
          description: error.response?.data?.error || error.message,
          variant: "destructive",
        });
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
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                  setProductData({
                    name: "",
                    code: "",
                    stock: "",
                    purchase_price: "",
                    sell_price: "",
                    category_id: "",
                    category_name: "",
                    stock_minimum: "5",
                  });
                  clearFormErrors();
                }}
              >
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
                  <div className="col-span-3">
                    <Input
                      id="codigo"
                      className={formErrors.code ? "border-red-500" : ""}
                      value={productData.code}
                      onChange={handleCodeChange}
                    />
                    {formErrors.code && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.code}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="nombre" className="text-right">
                    Nombre
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="nombre"
                      className={formErrors.name ? "border-red-500" : ""}
                      value={productData.name}
                      onChange={handleNameChange}
                    />
                    {formErrors.name && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="categoria" className="text-right">
                    Categoría
                  </Label>
                  <div className="col-span-3">
                    <Select
                      value={productData.category_id}
                      onValueChange={(value) => {
                        setProductData({ ...productData, category_id: value });
                        if (formErrors.category_id) {
                          setFormErrors({ ...formErrors, category_id: null });
                        }
                      }}
                    >
                      <SelectTrigger
                        className={
                          formErrors.category_id ? "border-red-500" : ""
                        }
                      >
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
                    {formErrors.category_id && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.category_id}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="stock" className="text-right">
                    Stock
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="stock"
                      type="number"
                      className={formErrors.stock ? "border-red-500" : ""}
                      value={productData.stock}
                      onChange={handleStockChange}
                    />
                    {formErrors.stock && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.stock}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="precio-compra" className="text-right">
                    Precio Compra
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="precio-compra"
                      type="number"
                      step="0.01"
                      className={
                        formErrors.purchase_price ? "border-red-500" : ""
                      }
                      value={productData.purchase_price}
                      onChange={handlePurchasePriceChange}
                    />
                    {formErrors.purchase_price && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.purchase_price}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="precio-venta" className="text-right">
                    Precio Venta
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="precio-venta"
                      type="number"
                      step="0.01"
                      className={formErrors.sell_price ? "border-red-500" : ""}
                      value={productData.sell_price}
                      onChange={handleSellPriceChange}
                    />
                    {formErrors.sell_price && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.sell_price}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="stock-minimo" className="text-right">
                    Stock Mínimo
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="stock-minimo"
                      type="number"
                      className={
                        formErrors.stock_minimum ? "border-red-500" : ""
                      }
                      value={productData.stock_minimum}
                      onChange={handleStockMinimumChange}
                      placeholder="5"
                    />
                    {formErrors.stock_minimum && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.stock_minimum}
                      </p>
                    )}
                  </div>
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
                  <div className="col-span-3">
                    <Input
                      id="edit-codigo"
                      className={formErrors.code ? "border-red-500" : ""}
                      value={productData.code}
                      onChange={handleCodeChange}
                    />
                    {formErrors.code && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.code}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-nombre" className="text-right">
                    Nombre
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="edit-nombre"
                      className={formErrors.name ? "border-red-500" : ""}
                      value={productData.name}
                      onChange={handleNameChange}
                    />
                    {formErrors.name && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-categoria" className="text-right">
                    Categoría
                  </Label>
                  <div className="col-span-3">
                    <Select
                      value={productData.category_id}
                      onValueChange={(value) => {
                        setProductData({ ...productData, category_id: value });
                        if (formErrors.category_id) {
                          setFormErrors({ ...formErrors, category_id: null });
                        }
                      }}
                    >
                      <SelectTrigger
                        className={
                          formErrors.category_id ? "border-red-500" : ""
                        }
                      >
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
                    {formErrors.category_id && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.category_id}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-stock" className="text-right">
                    Stock
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="edit-stock"
                      type="number"
                      className={formErrors.stock ? "border-red-500" : ""}
                      value={productData.stock}
                      onChange={handleStockChange}
                    />
                    {formErrors.stock && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.stock}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-precio-compra" className="text-right">
                    Precio Compra
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="edit-precio-compra"
                      type="number"
                      step="0.01"
                      className={
                        formErrors.purchase_price ? "border-red-500" : ""
                      }
                      value={productData.purchase_price}
                      onChange={handlePurchasePriceChange}
                    />
                    {formErrors.purchase_price && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.purchase_price}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-precio-venta" className="text-right">
                    Precio Venta
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="edit-precio-venta"
                      type="number"
                      step="0.01"
                      className={formErrors.sell_price ? "border-red-500" : ""}
                      value={productData.sell_price}
                      onChange={handleSellPriceChange}
                    />
                    {formErrors.sell_price && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.sell_price}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-stock-minimo" className="text-right">
                    Stock Mínimo
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="edit-stock-minimo"
                      type="number"
                      className={
                        formErrors.stock_minimum ? "border-red-500" : ""
                      }
                      value={productData.stock_minimum}
                      onChange={handleStockMinimumChange}
                      placeholder="5"
                    />
                    {formErrors.stock_minimum && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.stock_minimum}
                      </p>
                    )}
                  </div>
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
                      sell_price: "",
                      category_id: "",
                      category_name: "",
                      stock_minimum: "5",
                    });
                    clearFormErrors();
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

          <Button
            variant="outline"
            onClick={() => setIsCategoriesDialogOpen(true)}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Categorías
          </Button>
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
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px] text-center">
                    <Button variant="ghost" onClick={() => requestSort("code")}>
                      Código{getSortIndicator("code")}
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">
                    <Button variant="ghost" onClick={() => requestSort("name")}>
                      Nombre{getSortIndicator("name")}
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">
                    <Button
                      variant="ghost"
                      onClick={() => requestSort("category_name")}
                    >
                      Categoría{getSortIndicator("category_name")}
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">
                    <Button
                      variant="ghost"
                      onClick={() => requestSort("stock")}
                    >
                      Stock{getSortIndicator("stock")}
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">
                    <Button
                      variant="ghost"
                      onClick={() => requestSort("purchase_price")}
                    >
                      Precio Compra{getSortIndicator("purchase_price")}
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">
                    <Button
                      variant="ghost"
                      onClick={() => requestSort("sell_price")}
                    >
                      Precio Venta{getSortIndicator("sell_price")}
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">
                    <Button
                      variant="ghost"
                      onClick={() => requestSort("active")}
                    >
                      Estado{getSortIndicator("active")}
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getPaginatedProducts().map((product) => (
                  <TableRow key={product.product_id}>
                    <TableCell className="text-center">
                      {product.code}
                    </TableCell>
                    <TableCell className="text-center">
                      {product.name}
                    </TableCell>
                    <TableCell className="text-center">
                      {product.category_name}
                    </TableCell>
                    <TableCell className="text-center">
                      {product.stock}
                    </TableCell>
                    <TableCell className="text-center">
                      {product.purchase_price}
                    </TableCell>
                    <TableCell className="text-center">
                      {product.sell_price || "N/A"}
                    </TableCell>
                    <TableCell className="text-center">
                      {(() => {
                        const stockStatus = getStockStatus(
                          product.stock,
                          product.stock_minimum
                        );
                        return (
                          <Badge
                            variant="outline"
                            className={stockStatus.color}
                          >
                            {stockStatus.text}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-center">
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

      {/* Modal de Gestión de Categorías */}
      <Dialog
        open={isCategoriesDialogOpen}
        onOpenChange={setIsCategoriesDialogOpen}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Gestionar Categorías</DialogTitle>
            <DialogDescription>
              Administra las categorías de productos. Puedes crear, editar y
              eliminar categorías.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Categorías Existentes</h3>
              <Button
                onClick={() => {
                  setCategoryData({ name: "" });
                  setCategoryNameError("");
                  setIsCreateCategoryDialogOpen(true);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nueva Categoría
              </Button>
            </div>
            <div className="max-h-60 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.category_id}>
                      <TableCell className="font-medium">
                        {category.name}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCategoriesDialogOpen(false)}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Crear Categoría */}
      <Dialog
        open={isCreateCategoryDialogOpen}
        onOpenChange={setIsCreateCategoryDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nueva Categoría</DialogTitle>
            <DialogDescription>
              Crea una nueva categoría para organizar tus productos.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category-name" className="text-right">
                Nombre
              </Label>
              <Input
                id="category-name"
                className="col-span-3"
                value={categoryData.name}
                onChange={handleCategoryNameChange}
                placeholder="Nombre de la categoría"
              />
            </div>
            {categoryNameError && (
              <div className="col-span-4 text-red-500 text-sm mt-1">
                {categoryNameError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateCategoryDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleCreateCategory}
            >
              Crear Categoría
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Editar Categoría */}
      <Dialog
        open={isEditCategoryDialogOpen}
        onOpenChange={setIsEditCategoryDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Categoría</DialogTitle>
            <DialogDescription>
              Modifica los datos de la categoría seleccionada.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-category-name" className="text-right">
                Nombre
              </Label>
              <Input
                id="edit-category-name"
                className="col-span-3"
                value={categoryData.name}
                onChange={handleCategoryNameChange}
                placeholder="Nombre de la categoría"
              />
            </div>
            {categoryNameError && (
              <div className="col-span-4 text-red-500 text-sm mt-1">
                {categoryNameError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditCategoryDialogOpen(false);
                setEditingCategory(null);
                setCategoryData({ name: "" });
                setCategoryNameError("");
              }}
            >
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleUpdateCategory}
            >
              Actualizar Categoría
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
