import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function RecentVentas() {
  return (
    <div className="space-y-8">
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/placeholder-user.jpg" alt="Avatar" />
          <AvatarFallback>EA</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Estancia El Amanecer S.A.</p>
          <p className="text-sm text-muted-foreground">10/05/2023</p>
        </div>
        <div className="ml-auto font-medium">+$245,630.00</div>
      </div>
      <div className="flex items-center">
        <Avatar className="flex h-9 w-9 items-center justify-center space-y-0 border">
          <AvatarImage src="/placeholder-user.jpg" alt="Avatar" />
          <AvatarFallback>JP</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Juan Pérez</p>
          <p className="text-sm text-muted-foreground">08/05/2023</p>
        </div>
        <div className="ml-auto font-medium">+$37,850.00</div>
      </div>
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/placeholder-user.jpg" alt="Avatar" />
          <AvatarFallback>CA</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Cooperativa Agrícola Regional</p>
          <p className="text-sm text-muted-foreground">05/05/2023</p>
        </div>
        <div className="ml-auto font-medium">+$156,780.00</div>
      </div>
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/placeholder-user.jpg" alt="Avatar" />
          <AvatarFallback>MG</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">María González</p>
          <p className="text-sm text-muted-foreground">01/05/2023</p>
        </div>
        <div className="ml-auto font-medium">+$12,450.00</div>
      </div>
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/placeholder-user.jpg" alt="Avatar" />
          <AvatarFallback>AS</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Agrícola San Martín</p>
          <p className="text-sm text-muted-foreground">28/04/2023</p>
        </div>
        <div className="ml-auto font-medium">+$89,320.00</div>
      </div>
    </div>
  )
}
