import { Box, Container } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useTheme } from '@mui/material/styles';
import { useEffect } from 'react';
import DBBackup from './BackupDB';
import DBRestore from './RestoreDB';
import { useSocketStore } from '../../store/socketStore';

function DBOperations() {
    const theme = useTheme();
    const isConnected = useSocketStore((s) => s.isConnected);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return () => { };
    }, []);


    return (
        <>
            <Box sx={{ width: 1, bgcolor: isConnected ? 'green' : 'red', height: 5 }} />
            <Grid
                container
                justifyContent={'center'}
                alignItems={'stretch'}
                width={1}
                height={1}
            >
                <Grid
                    size={{ xs: 12 }}
                    bgcolor={theme.palette.background.default}
                    position="relative"
                    minHeight={20}
                    sx={{
                        position: 'relative',
                        backgroundColor: theme.palette.background.default,
                        '&::after': {
                            position: 'absolute',
                            content: '""',
                            width: '100%',
                            zIndex: 1,
                            top: 0,
                            right: 0,
                            height: '100%',
                            backgroundSize: '10px 10px',
                            backgroundImage: `radial-gradient(${theme.palette.secondary.light} 20%, transparent 20%)`,
                            opacity: 0.2,
                        },
                    }}
                >
                    <Container
                        maxWidth="xl"
                        sx={{
                            px: 2,
                            py: { xs: 2 },
                            position: 'relative',
                            zIndex: 2,
                        }}
                    >
                        <DBBackup />
                    </Container>
                </Grid>
                <Grid
                    size={{ xs: 12 }}
                    bgcolor={theme.palette.background.default}
                    position="relative"
                    minHeight={20}
                    sx={{
                        position: 'relative',
                        backgroundColor: theme.palette.background.default,
                        '&::after': {
                            position: 'absolute',
                            content: '""',
                            width: '100%',
                            zIndex: 1,
                            top: 0,
                            right: 0,
                            height: '100%',
                            backgroundSize: '10px 10px',
                            backgroundImage: `radial-gradient(${theme.palette.primary.light} 20%, transparent 20%)`,
                            opacity: 0.2,
                        },
                    }}
                >
                    <Container
                        maxWidth="xl"
                        sx={{
                            px: 2,
                            py: { xs: 2 },
                            position: 'relative',
                            zIndex: 2,
                        }}
                    >
                        <DBRestore />
                    </Container>
                </Grid>
            </Grid>
        </>
    );
};

export default DBOperations;
