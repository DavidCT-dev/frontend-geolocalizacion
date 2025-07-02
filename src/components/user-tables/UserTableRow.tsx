'use client';
import React from 'react';
import {
  TableRow, TableCell, Stack, Typography, Avatar,
  IconButton, Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

interface UserTableRowProps {
  row: any ;
  isSelected?: boolean;
  onEdit: (user: any) => void;
  onDelete: (userId: string) => void;
  permissions?: string[];
}

export default function UserTableRow({
  row,
  isSelected,
  onEdit,
  onDelete,
  permissions
}: UserTableRowProps) {
  return (
    <TableRow hover selected={isSelected}>
      <TableCell>
        <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
          <Avatar src={row.avatar} />
          <Typography variant="subtitle2">{row.nombre}</Typography>
        </Stack>
      </TableCell>
      <TableCell>{row.ci}</TableCell>
      <TableCell>{row.telefono}</TableCell>
      <TableCell>
        {row.state === false ? (
          <Typography color="warning.main">Sin confirmar</Typography>
        ) : row.deleted ? (
          <Typography color="error">Inactivo</Typography>
        ) : (
          <Typography color="success.main">Activo</Typography>
        )}
      </TableCell>
      <TableCell>{row.email}</TableCell>
      {'carDescription' in row && (
        <TableCell>{String(row.carDescription)}</TableCell>
      )}
      <TableCell>{row.rol?.nombre}</TableCell>
      {'carId' in row && (
        <TableCell>{String(row.carId)}</TableCell>
      )}
      <TableCell>
        {permissions?.includes('editar-usuario') && (
          <Tooltip title="Editar">
            <IconButton color="primary" onClick={() => onEdit(row)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
        )}
        {permissions?.includes('eliminar-usuario') && (
          <Tooltip title="Eliminar">
            <IconButton color="error" onClick={() => onDelete(row._id)}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  );
}
