import * as React from "react";
import {
    Box, Paper, Typography, Stack, Chip, IconButton, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, FormGroup, FormControlLabel, Checkbox,
    CircularProgress, Alert, Tooltip
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { useUsers, useUpdateUserRoles } from "../api/users";
import type { UserRow } from "../api/users";
import { isRoleCode, roleRank, UserRoles } from "../constants/userRoles"; // mirror of backend enum

// map codes to labels to show in UI
const ROLE_LABELS: Record<string, string> = {
    [UserRoles.superUser]: "Super User",
    [UserRoles.admin]: "Admin",
    [UserRoles.userFL]: "User FL",
    [UserRoles.userHL]: "User HL",
    [UserRoles.userML]: "User ML",
    [UserRoles.userLL]: "User LL",
};

// order high → low like backend
const ROLE_ORDER = [
    UserRoles.superUser,
    UserRoles.admin,
    UserRoles.userFL,
    UserRoles.userHL,
    UserRoles.userML,
    UserRoles.userLL,
];

export default function UsersPage() {
    const { data, isLoading, error } = useUsers();
    const updateRoles = useUpdateUserRoles();

    const [open, setOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<UserRow | null>(null);
    const [selected, setSelected] = React.useState<string[]>([]);
    const [roleChangeError, setRoleChangeError] = React.useState<string | null>(null);

    const onEdit = (u: UserRow) => {
        setEditing(u);
        setSelected(u.roles ?? []);
        setOpen(true);
    };

    const toggleRole = (role: string) => {
        setSelected((prev) =>
            prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
        );
    };

    const onSave = () => {
        if (!editing) return;
        updateRoles.mutate({ id: editing.id, roles: selected }, {
            onError: (error: any) => {
                try {
                    // Attempt to parse the error message if it is stringified
                    const parsedError = JSON.parse(error?.message || "{}");
                    const errorMessage = parsedError?.message || "An error occurred while updating roles.";
                    setRoleChangeError(errorMessage);
                } catch (e) {
                    // Fallback to generic error if parsing fails
                    setRoleChangeError("An error occurred while updating roles.");
                }
            },
            onSuccess: () => {
                setOpen(false);  // Close the dialog upon successful role update
            },
        });
    };


    if (isLoading) {
        return (
            <Box sx={{ p: 3, display: "grid", placeItems: "center" }}>
                <CircularProgress />
            </Box>
        );
    }
    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{(error as Error).message}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h6">Users</Typography>
                </Stack>

                <Stack spacing={1.5}>
                    {(data ?? []).map((u) => (
                        <Paper key={u.id} variant="outlined" sx={{ p: 1.5 }}>
                            <Stack direction="row" alignItems="center" spacing={2} justifyContent="space-between">
                                <Stack spacing={0.3}>
                                    <Typography fontWeight={600}>{u.email}</Typography>
                                    <Stack direction="row" spacing={1} flexWrap="wrap">
                                        {(u.roles ?? [])
                                            .filter(isRoleCode)                      // narrow to RoleCode
                                            .sort((a, b) => roleRank(a) - roleRank(b))
                                            .map((r) => <Chip key={r} label={ROLE_LABELS[r]} size="small" />)}
                                        {(!u.roles || u.roles.length === 0) && (
                                            <Chip label="No roles" size="small" variant="outlined" />
                                        )}
                                    </Stack>
                                </Stack>

                                <Tooltip title="Edit roles">
                                    <span>
                                        <IconButton onClick={() => onEdit(u)} disabled={updateRoles.isPending}>
                                            <EditIcon />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            </Stack>
                        </Paper>
                    ))}
                </Stack>
            </Paper>

            {/* Edit roles dialog */}
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Edit roles</DialogTitle>
                {/* Error message for role change */}
                {roleChangeError && (
                    <DialogActions>
                        <Alert severity="error" sx={{ mt: 2, width: 1 }}>
                            {roleChangeError}
                        </Alert>
                    </DialogActions>
                )}
                <DialogContent>
                    <FormGroup>
                        {ROLE_ORDER.map((r) => (
                            <FormControlLabel
                                key={r}
                                control={
                                    <Checkbox
                                        checked={selected.includes(r)}
                                        onChange={() => toggleRole(r)}
                                        disabled={r === UserRoles.superUser}
                                    />
                                }
                                label={ROLE_LABELS[r] ?? r}
                            />
                        ))}
                    </FormGroup>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={onSave} variant="contained" disabled={updateRoles.isPending}>
                        {updateRoles.isPending ? "Saving…" : "Save"}
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
}
