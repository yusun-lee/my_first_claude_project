import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Station } from "@/types/station"

type StationTableProps = {
  stations: Station[]
}

export function StationTable({ stations }: StationTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>이름</TableHead>
          <TableHead>주소</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {stations.map((station) => (
          <TableRow key={station.id}>
            <TableCell>{station.name}</TableCell>
            <TableCell>{station.address}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
