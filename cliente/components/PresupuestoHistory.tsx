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
import { CalendarIcon, Search, Filter, Download, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getBudgetsHistory, getBudgetDetails } from '@/api/transactionsApi';

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
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selectedPresupuesto, setSelectedPresupuesto] = useState<Presupuesto | null>(null);

  // Cargar presupuestos al montar el componente
  useEffect(() => {
    loadPresupuestos();
  }, []);

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
  const filteredPresupuestos = presupuestos.filter(presupuesto => {
    // Verificar que el presupuesto existe y tiene las propiedades necesarias
    if (!presupuesto) return false;
    
    const cliente = presupuesto.client_name || presupuesto.cliente || '';
    const id = presupuesto.transaction_id || presupuesto.id || '';
    
    const matchesSearch = cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         id.toString().includes(searchTerm);
    const matchesStatus = statusFilter === 'todos' || (presupuesto.status || presupuesto.estado) === statusFilter;
    
    // TODO: Implementar filtro por fecha
    const matchesDate = true; // Por ahora siempre true
    
    return matchesSearch && matchesStatus && matchesDate;
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

  const handleViewPresupuesto = (presupuesto: Presupuesto) => {
    setSelectedPresupuesto(presupuesto);
  };

  const handleDownloadPresupuesto = (presupuesto: Presupuesto) => {
    // TODO: Implementar descarga de presupuesto
    console.log('Descargar presupuesto:', presupuesto.id);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
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
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="aprobado">Aprobado</SelectItem>
              <SelectItem value="rechazado">Rechazado</SelectItem>
              <SelectItem value="convertido">Convertido</SelectItem>
            </SelectContent>
          </Select>

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
        </div>

        {/* Lista de presupuestos */}
        <div className="space-y-4">
          {filteredPresupuestos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No se encontraron presupuestos</p>
            </div>
          ) : (
            filteredPresupuestos.map((presupuesto, index) => (
              <div
                key={presupuesto.transaction_id || presupuesto.id || `presupuesto-${index}`}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="font-semibold">Presupuesto #{presupuesto.transaction_id || presupuesto.id}</h3>
                      <Badge variant={getStatusBadgeVariant(presupuesto.status || presupuesto.estado || 'pendiente')}>
                        {(presupuesto.status || presupuesto.estado || 'pendiente').charAt(0).toUpperCase() + (presupuesto.status || presupuesto.estado || 'pendiente').slice(1)}
                      </Badge>
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
                    <div className="mt-2">
                      <span className="font-medium">Items:</span> {presupuesto.items?.length || 0} producto(s)
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
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

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
