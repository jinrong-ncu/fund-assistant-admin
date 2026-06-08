import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import {
  Box,
  Card,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  loading = false,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card
      variant="outlined"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderColor: '#dfe4ee',
      }}
    >
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            bgcolor: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(1px)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Box sx={{ display: 'grid', justifyItems: 'center', gap: 1, color: 'primary.main' }}>
            <CircularProgress size={32} thickness={4} />
            <Typography variant="caption" sx={{ fontWeight: 800 }}>
              正在努力加载数据...
            </Typography>
          </Box>
        </Box>
      )}

      <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto' }}>
        <Table sx={{ minWidth: 760, borderCollapse: 'separate', borderSpacing: 0 }}>
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableCell
                    key={header.id}
                    sx={{
                      py: 1.75,
                      px: 2,
                      borderBottom: '1px solid #dfe4ee',
                      whiteSpace: 'nowrap',
                      letterSpacing: 0,
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} sx={{ py: 7, textAlign: 'center', color: 'text.secondary' }}>
                  {loading ? '加载中...' : '暂无数据'}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  sx={{
                    '&:last-child td': { borderBottom: 0 },
                    '&:hover td': { bgcolor: '#f8fbff' },
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      sx={{
                        py: 1.65,
                        px: 2,
                        borderBottom: '1px solid #edf0f6',
                        verticalAlign: 'middle',
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}
