// A screen-reader-only table that gives the same numbers as a chart.
// Sighted users see the chart; screen reader users get this table instead.

export default function ChartSummary({ caption, columns, rows }) {
  return (
    <div className="sr-only">
      <table>
      <caption>{caption}</caption>

      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column} scope="col">
              {column}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((value, columnIndex) =>
              columnIndex === 0 ? (
                <th key={columnIndex} scope="row">
                  {value}
                </th>
              ) : (
                <td key={columnIndex}>{value}</td>
              )
            )}
          </tr>
        ))}
      </tbody>
      </table>
    </div>
  );
}
