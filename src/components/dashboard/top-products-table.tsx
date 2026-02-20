"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { TopProduct } from "@/types/shopify";

interface TopProductsTableProps {
  products: TopProduct[];
  isLoading: boolean;
}

export function TopProductsTable({ products, isLoading }: TopProductsTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full mb-2" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Productos Mas Vendidos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-left pb-3 w-8">#</th>
                <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-left pb-3">Producto</th>
                <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right pb-3">Ingresos</th>
                <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right pb-3">Unidades</th>
                <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right pb-3">Pedidos</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted-foreground py-8 text-sm">
                    No se encontraron productos en este periodo
                  </td>
                </tr>
              ) : (
                products.map((product, index) => (
                  <tr key={product.title} className="border-b border-border/20 last:border-0">
                    <td className="py-3 text-muted-foreground font-medium text-[13px]">
                      {index + 1}
                    </td>
                    <td className="py-3 font-medium text-[13px]">{product.title}</td>
                    <td className="py-3 text-right text-[13px]">
                      {formatCurrency(product.totalRevenue)}
                    </td>
                    <td className="py-3 text-right text-muted-foreground text-[13px]">
                      {formatNumber(product.totalQuantitySold)}
                    </td>
                    <td className="py-3 text-right text-muted-foreground text-[13px]">
                      {formatNumber(product.orderCount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
