import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  className?: string;
}

export function DataTable<TData, TValue>({ columns, data, loading = false, className = '' }: DataTableProps<TData, TValue>) {
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });
  return <div className={`relative overflow-hidden rounded-xl border border-borderBase bg-white shadow-sm ${className}`}>
    {loading && <div className="absolute inset-0 z-10 grid place-items-center bg-white/75 backdrop-blur-[1px]"><div className="flex flex-col items-center gap-2 text-xs font-semibold text-primary"><span className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />正在加载数据...</div></div>}
    <div className="max-w-full overflow-x-auto">
      <table className="min-w-[760px] w-full border-collapse text-sm">
        <thead className="bg-slate-50 text-xs text-textMuted"><tr>{table.getHeaderGroups()[0].headers.map((header) => <th key={header.id} className="whitespace-nowrap border-b border-borderBase px-4 py-3.5 text-left font-bold">{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</th>)}</tr></thead>
        <tbody>{table.getRowModel().rows.length === 0 ? <tr><td colSpan={columns.length} className="py-16 text-center text-sm text-textMuted">{loading ? '加载中...' : '暂无数据'}</td></tr> : table.getRowModel().rows.map((row) => <tr key={row.id} className="transition hover:bg-slate-50/70">{row.getVisibleCells().map((cell) => <td key={cell.id} className="border-b border-slate-100 px-4 py-3.5 align-middle text-textMain">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}</tbody>
      </table>
    </div>
  </div>;
}
