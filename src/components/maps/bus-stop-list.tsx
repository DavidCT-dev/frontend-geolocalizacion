'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import PlaceIcon from '@mui/icons-material/Place';

interface BusStopListProps {
    list: string[];
}

export default function BusStopList({ list }: BusStopListProps) {
    return (
        <Box sx={{ flexGrow: 1, maxWidth: 752 }}>
            <List>
                {list.map((busStop) => {
                    return (
                        <ListItem>
                            <ListItemIcon>
                                <PlaceIcon />
                            </ListItemIcon>
                            <ListItemText
                                primary={busStop}
                            />
                        </ListItem>
                    )
                })}

            </List>
        </Box>
    );
}
