"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarIcon, Search, Filter, Download, Eye, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getBudgetsHistory, getBudgetDetails, deleteTransaction } from '@/api/transactionsApi';

interface Presupuesto {
  transaction_id?: number;
  id?: string;
  date?: string;
  fecha?: string;
  client_name?: string;
  cliente?: string;
  total_transaction?: number;
  total?: number;
  status?: string;
  estado?: 'pendiente' | 'aprobado' | 'rechazado' | 'convertido';
  items?: Array<{
    producto: string;
    cantidad: number;
    precio: number;
    subtotal: number;
    codigo?: string;
  }>;
  extras?: Array<{
    tipo: string;
    descripcion: string;
    monto: number;
  }>;
  subtotal?: number;
  totalExtras?: number;
  iva?: number;
  clienteInfo?: {
    company_name?: string;
    email?: string;
    phone?: string;
  };
}

const PresupuestoHistory: React.FC = () => {
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selectedPresupuesto, setSelectedPresupuesto] = useState<Presupuesto | null>(null);
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Cargar presupuestos al montar el componente
  useEffect(() => {
    loadPresupuestos();
  }, []);

  // Resetear página cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFrom, dateTo]);

  const loadPresupuestos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getBudgetsHistory({});
      setPresupuestos(response.budgets || []);
    } catch (error) {
      console.error('Error al cargar presupuestos:', error);
      setError('Error al cargar el historial de presupuestos');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar presupuestos
  const filteredPresupuestos = presupuestos
    .filter(presupuesto => {
    // Verificar que el presupuesto existe y tiene las propiedades necesarias
    if (!presupuesto) return false;
    
    const cliente = presupuesto.client_name || presupuesto.cliente || '';
    const id = presupuesto.transaction_id || presupuesto.id || '';
    
    const matchesSearch = cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         id.toString().includes(searchTerm);
      
      // Filtro por fecha
      let matchesDate = true;
      if (dateFrom || dateTo) {
        const presupuestoDate = new Date(presupuesto.date || presupuesto.fecha || new Date());
        
        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          matchesDate = matchesDate && presupuestoDate >= fromDate;
        }
        
        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          matchesDate = matchesDate && presupuestoDate <= toDate;
        }
      }
      
      return matchesSearch && matchesDate;
    })
    .sort((a, b) => {
      const idA = parseInt(String(a.transaction_id || a.id || 0));
      const idB = parseInt(String(b.transaction_id || b.id || 0));
      return idA - idB; // Ordenar por ID ascendente
    });

  const getStatusBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return 'secondary';
      case 'aprobado':
        return 'default';
      case 'rechazado':
        return 'destructive';
      case 'convertido':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const handleViewPresupuesto = async (presupuesto: Presupuesto) => {
    try {
      // Cargar los detalles completos del presupuesto
      const budgetId = presupuesto.transaction_id || presupuesto.id;
      if (budgetId) {
        const details = await getBudgetDetails(budgetId);
        console.log('Datos recibidos del backend:', details);
        const budgetData = details.budget || details;
        console.log('Budget data:', budgetData);
        
        // Transformar los datos para que coincidan con la interfaz esperada
        const transformedBudget: Presupuesto = {
          transaction_id: budgetData.transaction?.transaction_id,
          id: budgetData.transaction?.transaction_id?.toString(),
          date: budgetData.transaction?.date,
          fecha: budgetData.transaction?.date,
          client_name: budgetData.transaction?.client_name,
          cliente: budgetData.transaction?.client_name,
          total_transaction: budgetData.totals?.transaction,
          total: budgetData.totals?.transaction,
          status: 'pendiente', // Los presupuestos siempre están pendientes por defecto
          estado: 'pendiente',
          items: budgetData.items?.map((item: any) => ({
            producto: item.product_name,
            cantidad: item.quantity,
            precio: item.price,
            subtotal: item.quantity * item.price,
            codigo: item.product_code
          })) || [],
          extras: budgetData.extras?.map((extra: any) => ({
            tipo: extra.type,
            descripcion: extra.note,
            monto: extra.price
          })) || [],
          subtotal: budgetData.totals?.items || 0,
          totalExtras: budgetData.totals?.extras || 0,
          iva: budgetData.totals?.transaction ? (budgetData.totals.transaction - (budgetData.totals.items + budgetData.totals.extras)) : 0,
          clienteInfo: {
            company_name: budgetData.transaction?.client_company,
            email: budgetData.transaction?.client_email,
            phone: budgetData.transaction?.client_phone
          }
        };
        
        console.log('Budget transformado:', transformedBudget);
        setSelectedPresupuesto(transformedBudget);
      } else {
        setSelectedPresupuesto(presupuesto);
      }
    } catch (error) {
      console.error('Error al cargar detalles del presupuesto:', error);
      // Si hay error, mostrar los datos básicos que ya tenemos
    setSelectedPresupuesto(presupuesto);
    }
  };

  const handleDeletePresupuesto = async (presupuesto: Presupuesto) => {
    try {
      const budgetId = presupuesto.transaction_id || presupuesto.id;
      if (!budgetId) {
        alert('No se puede eliminar el presupuesto: ID no encontrado');
        return;
      }

      const confirmed = window.confirm(
        `¿Estás seguro de que quieres eliminar el presupuesto #${budgetId}?\n\nEsta acción no se puede deshacer.`
      );

      if (confirmed) {
        await deleteTransaction(budgetId);
        await loadPresupuestos();
        alert('Presupuesto eliminado correctamente');
      }
    } catch (error) {
      console.error('Error al eliminar presupuesto:', error);
      alert('Error al eliminar el presupuesto');
    }
  };

  const handleDownloadPresupuesto = async (presupuesto: Presupuesto) => {
    try {
      // Primero cargar los detalles completos del presupuesto
      const budgetId = presupuesto.transaction_id || presupuesto.id;
      let presupuestoCompleto = presupuesto;
      
      if (budgetId) {
        try {
          const details = await getBudgetDetails(budgetId);
          const budgetData = details.budget || details;
          
          // Transformar los datos para que coincidan con la interfaz esperada
          presupuestoCompleto = {
            transaction_id: budgetData.transaction?.transaction_id,
            id: budgetData.transaction?.transaction_id?.toString(),
            date: budgetData.transaction?.date,
            fecha: budgetData.transaction?.date,
            client_name: budgetData.transaction?.client_name,
            cliente: budgetData.transaction?.client_name,
            total_transaction: budgetData.totals?.transaction,
            total: budgetData.totals?.transaction,
            status: 'pendiente',
            estado: 'pendiente',
            items: budgetData.items?.map((item: any) => ({
              producto: item.product_name,
              cantidad: item.quantity,
              precio: item.price,
              subtotal: item.quantity * item.price,
              codigo: item.product_code
            })) || [],
            extras: budgetData.extras?.map((extra: any) => ({
              tipo: extra.type,
              descripcion: extra.note,
              monto: extra.price
            })) || [],
            subtotal: budgetData.totals?.items || 0,
            totalExtras: budgetData.totals?.extras || 0,
            iva: budgetData.totals?.transaction ? (budgetData.totals.transaction - (budgetData.totals.items + budgetData.totals.extras)) : 0,
            clienteInfo: {
              company_name: budgetData.transaction?.client_company,
              email: budgetData.transaction?.client_email,
              phone: budgetData.transaction?.client_phone
            }
          };
        } catch (error) {
          console.error('Error al cargar detalles para impresión:', error);
          // Continuar con los datos básicos si hay error
        }
      }

      // Crear una ventana nueva para imprimir/descargar el presupuesto
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Presupuesto #${presupuestoCompleto.transaction_id || presupuestoCompleto.id}</title>
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
                font-weight: bold; 
                font-size: 14px; 
                color: #333;
              }
              .badge {
                display: inline-block;
                padding: 2px 6px;
                background: #e3f2fd;
                color: #1976d2;
                border-radius: 3px;
                font-size: 10px;
                font-weight: bold;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>PRESUPUESTO DE VENTA</h1>
              <p>Presupuesto #${presupuestoCompleto.transaction_id || presupuestoCompleto.id}</p>
            </div>

            <div class="info-section">
              <div class="info-column">
                <h3>Información del Cliente</h3>
                <p><strong>Nombre:</strong> ${presupuestoCompleto.client_name || presupuestoCompleto.cliente || 'Sin cliente'}</p>
                ${presupuestoCompleto.clienteInfo ? `
                  <p><strong>Empresa:</strong> ${presupuestoCompleto.clienteInfo.company_name || "N/A"}</p>
                  <p><strong>Email:</strong> ${presupuestoCompleto.clienteInfo.email || "N/A"}</p>
                  <p><strong>Teléfono:</strong> ${presupuestoCompleto.clienteInfo.phone || "N/A"}</p>
                ` : ''}
              </div>
              <div class="info-column">
                <h3>Información del Presupuesto</h3>
                <p><strong>Fecha:</strong> ${format(new Date(presupuestoCompleto.date || presupuestoCompleto.fecha || new Date()), "dd/MM/yyyy", { locale: es })}</p>
                <p><strong>Estado:</strong> <span class="badge">${(presupuestoCompleto.status || presupuestoCompleto.estado || 'pendiente').charAt(0).toUpperCase() + (presupuestoCompleto.status || presupuestoCompleto.estado || 'pendiente').slice(1)}</span></p>
                <p><strong>Tipo de Impuesto:</strong> <span class="badge">Con IVA</span></p>
                <p style="font-size: 10px; color: #666;">Presupuesto con IVA incluido (21%)</p>
              </div>
            </div>

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
                ${(presupuestoCompleto.items || []).map((item, index) => `
                  <tr>
                    <td>${item.codigo || `ITEM-${index + 1}`}</td>
                    <td>${item.producto}</td>
                    <td class="text-right">${item.cantidad}</td>
                    <td class="text-right">${formatCurrency(item.precio)}</td>
                    <td class="text-right">${formatCurrency(item.subtotal)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            ${(presupuestoCompleto.extras && presupuestoCompleto.extras.length > 0) ? `
              <table>
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Descripción</th>
                    <th class="text-right">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  ${presupuestoCompleto.extras.map((extra, index) => `
                    <tr>
                      <td>${extra.tipo}</td>
                      <td>${extra.descripcion}</td>
                      <td class="text-right ${extra.tipo === "Descuento" ? "color: #4caf50;" : ""}">
                        ${extra.tipo === "Descuento" ? "-" : ""}${formatCurrency(extra.monto)}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : ''}

            <div class="summary">
              <h3>Resumen del Presupuesto</h3>
              <p><strong>Subtotal Productos:</strong> ${formatCurrency(presupuestoCompleto.subtotal || 0)}</p>
              ${(presupuestoCompleto.totalExtras || 0) !== 0 ? `
                <p><strong>Cargos Adicionales:</strong> 
                  <span style="${(presupuestoCompleto.totalExtras || 0) < 0 ? "color: #4caf50;" : ""}">
                    ${(presupuestoCompleto.totalExtras || 0) < 0 ? "-" : ""}${formatCurrency(Math.abs(presupuestoCompleto.totalExtras || 0))}
                  </span>
                </p>
              ` : ''}
              <p><strong>Subtotal:</strong> ${formatCurrency((presupuestoCompleto.subtotal || 0) + (presupuestoCompleto.totalExtras || 0))}</p>
              <p><strong>IVA (21%):</strong> ${formatCurrency(presupuestoCompleto.iva || 0)}</p>
              <p class="total">Total: ${formatCurrency(presupuestoCompleto.total_transaction || presupuestoCompleto.total || 0)}</p>
              <div style="margin-top: 10px;">
                <span class="badge">Incluye IVA</span>
                <p style="font-size: 10px; color: #666; margin-top: 5px;">
                  Este presupuesto incluye IVA del 21%. El monto mostrado es el total a pagar.
                </p>
              </div>
            </div>
          </body>
          </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        
        // Esperar un momento para que se cargue el contenido y luego imprimir
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    } catch (error) {
      console.error('Error al generar el presupuesto:', error);
      alert('Error al generar el presupuesto');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  // Función para obtener los presupuestos paginados
  const getPaginatedPresupuestos = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredPresupuestos.slice(startIndex, endIndex);
  };

  // Calcular el total de páginas
  const totalPages = Math.ceil(filteredPresupuestos.length / itemsPerPage);

  // Función para cambiar de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Función para cambiar elementos por página
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset a la primera página
  };

  // Componente de paginación
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
            {Math.min(currentPage * itemsPerPage, filteredPresupuestos.length)} de{" "}
            {filteredPresupuestos.length} presupuestos
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

          {pages.map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageChange(page)}
            >
              {page}
            </Button>
          ))}

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
    );
  };

  // Componente selector de elementos por página
  const ItemsPerPageSelector = () => {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-700">Mostrar:</span>
        <Select
          value={itemsPerPage.toString()}
          onValueChange={(value) => {
            handleItemsPerPageChange(parseInt(value));
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Presupuestos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p>Cargando historial de presupuestos...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Presupuestos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={loadPresupuestos} variant="outline">
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Presupuestos</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por cliente o ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Fecha desde"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={setDateFrom}
                locale={es}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "dd/MM/yyyy") : "Fecha hasta"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
                locale={es}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {(dateFrom || dateTo) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDateFrom(undefined);
                setDateTo(undefined);
              }}
              className="text-gray-600 hover:text-gray-800"
            >
              Limpiar fechas
            </Button>
          )}
        </div>

        {/* Lista de presupuestos */}
        <div className="space-y-4">
          {getPaginatedPresupuestos().length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No se encontraron presupuestos</p>
            </div>
          ) : (
            getPaginatedPresupuestos().map((presupuesto, index) => {
              // Calcular el número de presupuesto: el más reciente tiene el número más alto
              const presupuestoNumber = filteredPresupuestos.length - ((currentPage - 1) * itemsPerPage + index);
              return (
              <div
                key={presupuesto.transaction_id || presupuesto.id || `presupuesto-${index}`}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <div>
                        <h3 className="font-semibold">Presupuesto #{presupuestoNumber}</h3>
                        <p className="text-xs text-gray-500">Transacción N°{presupuesto.transaction_id || presupuesto.id}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Cliente:</span> {presupuesto.client_name || presupuesto.cliente || 'Sin cliente'}
                      </div>
                      <div>
                        <span className="font-medium">Fecha:</span> {format(new Date(presupuesto.date || presupuesto.fecha || new Date()), "dd/MM/yyyy", { locale: es })}
                      </div>
                      <div>
                        <span className="font-medium">Total:</span> {formatCurrency(presupuesto.total_transaction || presupuesto.total || 0)}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewPresupuesto(presupuesto)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPresupuesto(presupuesto)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Descargar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePresupuesto(presupuesto)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
              );
            })
          )}
        </div>

        {/* Paginación */}
        {!loading && !error && filteredPresupuestos.length > 0 && (
          <div className="flex items-center justify-between">
            <ItemsPerPageSelector />
            <Pagination />
          </div>
        )}

        {/* Modal para ver detalles del presupuesto */}
        {selectedPresupuesto && (
          <Dialog open={true} onOpenChange={() => setSelectedPresupuesto(null)}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Presupuesto #{selectedPresupuesto.transaction_id || selectedPresupuesto.id}</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Información del Cliente */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold mb-2">
                      Información del Cliente
                    </h3>
                    <p>
                      <strong>Nombre:</strong> {selectedPresupuesto.client_name || selectedPresupuesto.cliente || 'Sin cliente'}
                    </p>
                    {selectedPresupuesto.clienteInfo && (
                      <>
                        <p>
                          <strong>Empresa:</strong> {selectedPresupuesto.clienteInfo.company_name || "N/A"}
                        </p>
                        <p>
                          <strong>Email:</strong> {selectedPresupuesto.clienteInfo.email || "N/A"}
                        </p>
                        <p>
                          <strong>Teléfono:</strong> {selectedPresupuesto.clienteInfo.phone || "N/A"}
                        </p>
                      </>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">
                      Información del Presupuesto
                    </h3>
                    <p>
                      <strong>Fecha:</strong> {format(new Date(selectedPresupuesto.date || selectedPresupuesto.fecha || new Date()), "dd/MM/yyyy", { locale: es })}
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      <strong>Estado:</strong>
                      <Badge variant={getStatusBadgeVariant(selectedPresupuesto.status || selectedPresupuesto.estado || 'pendiente')}>
                        {(selectedPresupuesto.status || selectedPresupuesto.estado || 'pendiente').charAt(0).toUpperCase() + (selectedPresupuesto.status || selectedPresupuesto.estado || 'pendiente').slice(1)}
                      </Badge>
                    </div>
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
                      {(selectedPresupuesto.items || []).map((item, index) => (
                        <TableRow key={`item-${index}-${item.producto || 'unknown'}`}>
                          <TableCell className="font-medium">
                            {item.codigo || `ITEM-${index + 1}`}
                          </TableCell>
                          <TableCell>{item.producto}</TableCell>
                          <TableCell className="text-right">
                            {item.cantidad}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.precio)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.subtotal)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Extras */}
                {selectedPresupuesto.extras && selectedPresupuesto.extras.length > 0 && (
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
                        {selectedPresupuesto.extras.map((extra, index) => (
                          <TableRow key={`extra-${index}-${extra.tipo || 'unknown'}`}>
                            <TableCell className="font-medium">
                              {extra.tipo}
                            </TableCell>
                            <TableCell>{extra.descripcion}</TableCell>
                            <TableCell
                              className={`text-right ${
                                extra.tipo === "Descuento" ? "text-green-600" : ""
                              }`}
                            >
                              {extra.tipo === "Descuento" ? "-" : ""}
                              {formatCurrency(extra.monto)}
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
                        <strong>Subtotal Productos:</strong>{" "}
                        {formatCurrency(selectedPresupuesto.subtotal || 0)}
                      </p>
                      {(selectedPresupuesto.totalExtras || 0) !== 0 && (
                        <p>
                          <strong>Cargos Adicionales:</strong>{" "}
                          <span
                            className={
                              (selectedPresupuesto.totalExtras || 0) < 0 ? "text-green-600" : ""
                            }
                          >
                            {(selectedPresupuesto.totalExtras || 0) < 0 ? "-" : ""}
                            {formatCurrency(Math.abs(selectedPresupuesto.totalExtras || 0))}
                          </span>
                        </p>
                      )}
                      <p>
                        <strong>Subtotal:</strong>{" "}
                        {formatCurrency((selectedPresupuesto.subtotal || 0) + (selectedPresupuesto.totalExtras || 0))}
                      </p>
                      <p>
                        <strong>IVA (21%):</strong>{" "}
                        {formatCurrency(selectedPresupuesto.iva || 0)}
                      </p>
                      <p className="text-lg font-bold">
                        Total: {formatCurrency(selectedPresupuesto.total_transaction || selectedPresupuesto.total || 0)}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className="bg-green-100 text-green-800 border-green-300 font-semibold"
                        >
                          Incluye IVA
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Este presupuesto incluye IVA del 21%. El monto mostrado es el total a pagar.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            <DialogFooter className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setSelectedPresupuesto(null)}
              >
                Cerrar
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => handleDownloadPresupuesto(selectedPresupuesto!)}
              >
                <Download className="mr-2 h-4 w-4" />
                Imprimir/Descargar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        )}
      </CardContent>
    </Card>
  );
};

export default PresupuestoHistory;
