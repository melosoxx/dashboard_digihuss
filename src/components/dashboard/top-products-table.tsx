"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
        <CardTitle className="text-base">Productos Más Vendidos</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">#</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead className="text-right">Ingresos</TableHead>
              <TableHead className="text-right">Unidades</TableHead>
              <TableHead className="text-right">Pedidos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No se encontraron productos en este período
                </TableCell>
              </TableRow>
            ) : (
              products.map((product, index) => (
                <TableRow key={product.title}>
                  <TableCell className="font-medium text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell className="font-medium">{product.title}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(product.totalRevenue)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(product.totalQuantitySold)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(product.orderCount)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
