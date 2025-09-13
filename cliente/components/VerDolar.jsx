"use client";
import { useEffect, useState } from "react";

function VerDolar() {
  const [dolarCompra, setDolarCompra] = useState(null);
  const [dolarVenta, setDolarVenta] = useState(null);

  const getDolarData = async () => {
    try {
      const response = await fetch("https://dolarapi.com/v1/dolares/oficial");
      const data = await response.json();
      setDolarCompra(data.compra);
      setDolarVenta(data.venta);
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    getDolarData();
  }, []);

  return (
    <div>
      <span className="text-green-500 mr-2">
        <b>Dolar:</b>
      </span>
      <span className="text-green-500 mr-2">
        Compra: $<b>{dolarCompra}</b>
      </span>
      <span className="text-green-500 mr-2">
        Venta: $<b>{dolarVenta}</b>
      </span>
    </div>
  );
}

export default VerDolar;
