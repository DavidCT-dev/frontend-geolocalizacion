'use client';

import * as React from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import { CardHeader, InputLabel, Link, MenuItem, Select, type SelectChangeEvent, Typography } from '@mui/material';

export function CreateProfileForm(): React.JSX.Element {
    const [rol, setRol] = React.useState('');

    const handleChange = (event: SelectChangeEvent) => {
        setRol(event.target.value);
    };
    return (
        <div>
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                }}
            >
                <Card sx={{padding: '1.8rem'}}>
                    <Typography variant='h3' align='center'>Registro nuevo usuario</Typography>
                    <CardContent sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.8rem 3rem' }}>
                        <FormControl sx={{ display: 'grid', gridTemplateColumns: '0.2fr 1.8fr', alignItems: 'center', gap: '1rem' }} fullWidth required>
                            <label>Nombre</label>
                            <OutlinedInput size='small' fullWidth name="name" />
                        </FormControl>
                        <FormControl sx={{ display: 'grid', gridTemplateColumns: '0.2fr 1.8fr', alignItems: 'center', gap: '1rem' }} fullWidth required>
                            <label>Email</label>
                            <OutlinedInput size='small' fullWidth name="email" type='email' />
                        </FormControl>
                        <FormControl sx={{ display: 'grid', gridTemplateColumns: '0.2fr 1.8fr', alignItems: 'center', gap: '1rem' }} fullWidth required>
                            <label>CI</label>
                            <OutlinedInput size='small' fullWidth name="ci" />
                        </FormControl>
                        <FormControl sx={{ display: 'grid', gridTemplateColumns: '0.2fr 1.8fr', alignItems: 'center', gap: '1rem' }} fullWidth required>
                            <label>Teléfono</label>
                            <OutlinedInput size='small' fullWidth name="phone" type="tel" />
                        </FormControl>
                        <FormControl sx={{ display: 'grid', gridTemplateColumns: '0.2fr 1.8fr', alignItems: 'center', gap: '1rem' }} fullWidth required>
                            <label>Rol</label>
                            <Select
                                labelId="demo-simple-select-label"
                                id="demo-simple-select"
                                value={rol}
                                onChange={handleChange}
                                size='small'
                            >
                                <MenuItem value='user'>Usuario</MenuItem>
                                <MenuItem value='driver'>Chofer</MenuItem>
                                <MenuItem value='admin'>Admin</MenuItem>
                            </Select>
                        </FormControl>
                        <Link sx={{alignSelf: 'center'}}>Nuevo rol</Link>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'center' }}>
                        <Button variant="contained">Registrar</Button>
                    </CardActions>
                    <Typography>Usuario y contraseña: CI predefinido</Typography>
                </Card>
            </form>
        </div>
    );
}
