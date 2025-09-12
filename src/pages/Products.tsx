import { Box } from "@mui/material";
import { useSocketStore } from "../store/socketStore";

export default function Products() {
    const isConnected = useSocketStore((s) => s.isConnected);

    return <Box sx={{ width: 1, bgcolor: isConnected ? 'green' : 'red', height: 20 }} />
}
