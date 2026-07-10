interface Column {
  key: string;
  label: string;
}

interface AdminTableProps {
  title: string;
  description?: string;
  columns: Column[];
  data: Record<string, string>[];
}

export function AdminTable({ title, description, columns, data }: AdminTableProps) {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-kiosk-navy">{title}</h1>
        {description && <p className="text-gray-500">{description}</p>}
      </div>
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left font-semibold text-gray-600">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400">
                  No records found.
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="border-b last:border-0 hover:bg-gray-50">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      {row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
