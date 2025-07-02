'use client';

import { Metadata } from "next";
import { config } from "@/config";
import React, { useEffect, useState } from "react";
import {TableUserHeader} from "@/components/user-tables/table-user-header";
import { Box } from "@mui/material";
import { GeneralUser } from "@/types/generalUser";
import UserTable from "@/components/user-tables/UserTable";

// export const metadata = { title: `Usuarios | ${config.site.name}` } satisfies Metadata;

function applyPagination(rows: GeneralUser[], page: number, rowsPerPage: number): GeneralUser[] {
    return rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
}

export default function UsersPage(): React.JSX.Element {
    const [users, setUsers] = useState<GeneralUser[]>([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [roles, setRole] = useState([]);


    const fetchRoles = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL_BACK}roles`);
      if (!res.ok) throw new Error('Error al obtener roles');
      const data = await res.json();
      setRole(data);
    } catch (error) {
      console.error('Error cargando roles:', error);
    }
  };

    const getUsers = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_BACK}user`);

                if (!response.ok) {
                    throw new Error('Error al cargar usuarios');
                }

                const data = await response.json();
                setUsers(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error desconocido');
            } finally {
                setLoading(false);
            }
        };

    useEffect(() => {
        getUsers();
        fetchRoles()
    }, []); // Eliminé la dependencia que causaba bucle infinito

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    const handleRowsPerPageChange = (newRowsPerPage: number) => {
        setRowsPerPage(newRowsPerPage);
        setPage(0); // Resetear a la primera página al cambiar el tamaño
    };

    const paginatedUsers = applyPagination(users, page, rowsPerPage);

    const tableHeader: string[] = ['NOMBRE', 'CI', 'TELÉFONO','ESTADO', 'CORREO','ROL' ,'MODIFICAR'];

    if (loading) {
        return <Box sx={{ p: 3 }}>Cargando usuarios...</Box>;
    }

    if (error) {
        return <Box sx={{ p: 3, color: 'error.main' }}>{error}</Box>;
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.6rem', p: 3 }}>
            <TableUserHeader
                // title="Lista de Usuarios"
                // buttonText="Nuevo Usuario"
                // onAddClick={() => console.log('Agregar nuevo usuario')}
                refreshData={getUsers}
                roles={roles}
                refreshRoles={fetchRoles}
            />
            <UserTable
                count={users.length}
                page={page}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
                headerTable={tableHeader}
                rows={paginatedUsers}
                rowsPerPage={rowsPerPage}
                refreshData={getUsers}
                roles={roles}
            />
        </Box>
    );
}
