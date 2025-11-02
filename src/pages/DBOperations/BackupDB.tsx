import { BackupTable } from '@mui/icons-material';
import { Button, CircularProgress, Container, LinearProgress, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useTheme } from '@mui/material/styles';
import { useEffect } from 'react';
import { useBackupRequest } from '../../api/dbOperation';
import { translate } from '../../utils/translate';
import { useBackupProgress } from '../../features/useBackupProgressLive';

function DBBackup() {
    const theme = useTheme()
    const ln = theme.direction === "ltr" ? "en" : "fa"
    const t = translate(ln) as any
    const { mutateAsync: backupDBMutateAsync, isPending } = useBackupRequest()
    const { backupDBProgress, backupFilesProgress, isComplete, resetProgress } = useBackupProgress()

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return () => { };
    }, []);

    const handleBackupDB = async () => {
        // Reset progress before starting a new backup
        resetProgress();

        try {
            const { url } = await backupDBMutateAsync()

            // Optional: Bootstrap URL into progress if needed for auto-download
            // const queryClient = useQueryClient();
            // queryClient.setQueryData(backupProgress, (prev) => ({ ...prev, url }));

            // Wait briefly or check completion before download (adjust as needed)
            if (!isComplete) {
                console.warn(`Backup may not be fully complete (DB: ${backupDBProgress}%, Files: ${backupFilesProgress}%)`);
            }

            // Create a temporary anchor element
            const link = document.createElement('a');
            link.href = url;  // e.g., '/db-operations/download?file=backups%2F2025-10-28_12-00-00_backup.zip'
            link.download = 'backup.zip';  // Optional: Suggest a filename (backend can override via headers)
            link.target = '_blank';  // Optional: Open in new tab if needed

            // Append to DOM (required for some browsers), trigger click, and clean up
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Auto-reset after success if complete
            setTimeout(() => {
                if (isComplete) resetProgress();
            }, 2000);
        } catch (error) {
            console.error("Backup failed:", error);
            resetProgress();
        }
    }

    // Calculate a combined progress for button display (e.g., average)
    const combinedProgress = Math.round((backupDBProgress + backupFilesProgress) / 2);
    const isInProgress = (isPending && combinedProgress < 100) || isPending;

    return (
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
                    <Button
                        startIcon={
                            isPending ? <CircularProgress size={24} color='error' /> :
                                isInProgress ? <CircularProgress size={24} /> : <BackupTable />
                        }
                        color={'primary'}
                        onClick={handleBackupDB}
                        size='large'
                        fullWidth
                        variant='contained'
                        disabled={isInProgress}
                        title={isInProgress ? t["BACKUP_IN_PROGRESS"] || "Backup in progress..." : ""}
                    >
                        {isPending ? t["STARTING_BACKUP"] || "Starting Backup..." :
                            isInProgress ? `${t["BACKUP_PROGRESS"] || "Backup Progress"}: ${combinedProgress}%` :
                                t["DB BACKUP"]}
                    </Button>

                    {isInProgress && (
                        <Grid container spacing={2} sx={{ mt: 2 }}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="body2" gutterBottom>
                                    {t["DB_BACKUP"] || "DB Backup"}: {backupDBProgress}%
                                </Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={backupDBProgress}
                                    sx={{ height: 8, borderRadius: 4 }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="body2" gutterBottom>
                                    {t["FILES_BACKUP"] || "Files Backup"}: {backupFilesProgress}%
                                </Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={backupFilesProgress}
                                    sx={{ height: 8, borderRadius: 4 }}
                                />
                            </Grid>
                            {isComplete && (
                                <Grid size={{ xs: 12 }}>
                                    <Typography color="success.main" variant="body1">
                                        {t["BACKUP_COMPLETE"] || "Backup complete! Download ready."}
                                    </Typography>
                                </Grid>
                            )}
                        </Grid>
                    )}
                </Container>
            </Grid>
        </Grid>
    );
};

export default DBBackup;