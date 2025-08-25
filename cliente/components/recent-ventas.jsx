import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function RecentVentas({ nombreCliente, fechaVenta, montoVenta }) {
  return (
    <div className="flex items-center">
      <Avatar className="h-9 w-9">
        <AvatarImage src="/placeholder-user.jpg" alt="Avatar" />
        <AvatarFallback>EA</AvatarFallback>
      </Avatar>
      <div className="ml-4 space-y-1">
        <p className="text-sm font-medium leading-none">{nombreCliente}</p>
        <p className="text-sm text-muted-foreground">{fechaVenta}</p>
      </div>
      <div className="ml-auto font-medium">$ {montoVenta}</div>
    </div>
  );
}
