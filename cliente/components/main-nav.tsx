import Link from "next/link"
import { BarChart3, Home, Package, ShoppingCart, Truck, Users } from "lucide-react"

export function MainNav() {
  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      <Link href="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
        <div className="flex items-center">
          <Home className="mr-2 h-4 w-4" />
          Dashboard
        </div>
      </Link>
      <Link
        href="/inventario"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <div className="flex items-center">
          <Package className="mr-2 h-4 w-4" />
          Inventario
        </div>
      </Link>
      <Link href="/ventas" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
        <div className="flex items-center">
          <ShoppingCart className="mr-2 h-4 w-4" />
          Ventas
        </div>
      </Link>
      <Link href="/compras" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
        <div className="flex items-center">
          <Truck className="mr-2 h-4 w-4" />
          Compras
        </div>
      </Link>
      <Link href="/clientes" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
        <div className="flex items-center">
          <Users className="mr-2 h-4 w-4" />
          Clientes
        </div>
      </Link>
      <Link href="/reportes" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
        <div className="flex items-center">
          <BarChart3 className="mr-2 h-4 w-4" />
          Reportes
        </div>
      </Link>
    </nav>
  )
}
